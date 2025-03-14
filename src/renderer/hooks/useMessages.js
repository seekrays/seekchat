import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { message as antMessage } from "antd";
import {
  sendMessage,
  saveMessage,
  updateMessageStatus,
  updateMessageContent,
  parseMessageContent,
  createMessageContent,
} from "../services/messageService";
import {
  getUserConfig,
  getProvidersConfig,
  isAIConfigured,
} from "../hooks/useUserConfig";
import { useTranslation } from "react-i18next";
import mcpService from "../services/mcpService";
import { sendMessageToAI } from "../services/aiService";

/**
 * message management hook, for handling message sending, receiving and status management
 * @param {Object} session current session
 * @param {Object} sessionSettings 会话设置，包含temperature等
 * @returns {Object} contains message related status and methods
 */
export const useMessages = (session, sessionSettings) => {
  const { t } = useTranslation();
  // ================== define status ==================
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentAIMessageId, setCurrentAIMessageId] = useState(null); // track the id of the current generating ai message
  const abortControllerRef = useRef(null); // for canceling network request

  // ================== define refs ==================
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const sessionIdRef = useRef(null);

  // use the api exposed in preload.js
  const electronAPI = window.electronAPI;

  // ================== scroll control ==================
  /**
   * 滚动到聊天底部的函数
   * 已优化为立即滚动到底部，没有过渡动画或不必要的延迟
   */
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    } else if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messagesEndRef, chatContainerRef]);

  // ================== load messages ==================
  /**
   * load messages from database
   */
  const loadMessages = useCallback(
    async (sessionId) => {
      if (!sessionId) return;

      setLoading(true);
      try {
        const messageList = await electronAPI.getMessages(sessionId);
        const processedMessages = messageList.map((msg) => ({
          ...msg,
          parsedContent:
            typeof msg.content === "string"
              ? parseMessageContent(msg.content)
              : msg.content,
        }));
        setMessages(processedMessages);
      } catch (error) {
        console.error("加载消息失败:", error);
        antMessage.error(t("chat.loadMessagesFailed"));
      } finally {
        setLoading(false);
      }
    },
    [electronAPI, t]
  );

  // when session changes, load messages
  useEffect(() => {
    if (session) {
      // if the session id changes, update the reference
      if (sessionIdRef.current !== session.id) {
        sessionIdRef.current = session.id;
        console.log(`switch to session: ${session.id}`);
      }
      loadMessages(session.id);
    } else {
      setMessages([]);
    }
  }, [session?.id, loadMessages]);

  // 当消息加载完成后，滚动到底部
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      console.log("消息加载完成，准备滚动到底部");
      // 使用requestAnimationFrame确保DOM已更新后再滚动
      requestAnimationFrame(() => {
        scrollToBottom();
        console.log("已执行滚动到底部");
      });
    }
  }, [messages, loading, scrollToBottom]);

  // ================== handle message context ==================
  /**
   * get context settings
   * @param {Object} targetSession target session
   * @returns {Object} contains maxMessages and noLimit
   */
  const getContextSettings = useCallback(
    (targetSession) => {
      // default settings
      const settings = {
        maxMessages: 10, // default limit 10 messages
        noLimit: false, // default enable limit
      };

      // 优先使用sessionSettings的值，即使targetSession不存在
      if (sessionSettings) {
        console.log(
          `Using sessionSettings: ${JSON.stringify(sessionSettings)}`
        );

        if (sessionSettings.contextLength !== undefined) {
          const contextLength = parseInt(sessionSettings.contextLength);
          console.log(
            `Using contextLength from sessionSettings: ${contextLength}`
          );

          // 如果contextLength为-1，则表示无限制
          if (contextLength === -1) {
            console.log("Context length is -1, setting noLimit=true");
            settings.noLimit = true;
          } else {
            console.log(`Setting maxMessages=${contextLength}`);
            settings.maxMessages = contextLength;
          }

          return settings;
        }
      } else {
        console.log("No sessionSettings provided");
      }

      // if there is no session, return default settings
      if (!targetSession) {
        console.log("No targetSession provided, using default settings");
        return settings;
      }

      try {
        if (targetSession.metadata) {
          let metadata;
          if (typeof targetSession.metadata === "string") {
            try {
              metadata = JSON.parse(targetSession.metadata);
              console.log(
                `Parsed session metadata: ${JSON.stringify(metadata)}`
              );
            } catch (e) {
              console.error("Failed to parse session metadata string:", e);
              metadata = {};
            }
          } else {
            metadata = targetSession.metadata || {};
            console.log(
              `Using session metadata object: ${JSON.stringify(metadata)}`
            );
          }

          // 检查新的contextLength字段
          if (metadata.contextLength !== undefined) {
            const contextLength = parseInt(metadata.contextLength);
            console.log(`Using contextLength from metadata: ${contextLength}`);

            // 如果contextLength为-1，则表示无限制
            if (contextLength === -1) {
              console.log("Context length is -1, setting noLimit=true");
              settings.noLimit = true;
            } else {
              console.log(`Setting maxMessages=${contextLength}`);
              settings.maxMessages = contextLength;
            }
          }

          // 兼容旧的noContextLimit字段
          if (metadata.noContextLimit) {
            settings.noLimit = true;
            console.log("Using legacy noContextLimit=true");
          }
        } else {
          console.log("No metadata in session, using default settings");
        }
      } catch (error) {
        console.error("parse session metadata failed:", error);
      }

      console.log(
        `Final context settings: maxMessages=${settings.maxMessages}, noLimit=${settings.noLimit}`
      );
      return settings;
    },
    [sessionSettings]
  );

  /**
   * parse the messages need to be sent
   * @param {Array} allMessage all messages
   * @param {Object} currentSession current session
   * @returns {Array} processed messages array
   */
  const parseNeedSendMessage = useCallback(
    (allMessage, currentSession = null) => {
      // use the current session or the session in the hook
      const targetSession = currentSession || session;

      // get context settings
      const { maxMessages, noLimit } = getContextSettings(targetSession);

      console.log(
        `Context settings: maxMessages=${maxMessages}, noLimit=${noLimit}`
      );
      console.log(`Original message count: ${allMessage.length}`);

      // if there is no message, return empty array
      if (!allMessage || allMessage.length === 0) {
        return [];
      }

      const sortedMessages = [...allMessage].sort((a, b) => {
        // sort by created time
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      // collect valid messages
      let validMessages = [];

      // process each message, extract content
      for (const msg of sortedMessages) {
        // skip empty message
        if (!msg.content || msg.content === "") continue;

        // parse message content
        const parsedContent = parseMessageContent(msg.content);
        const mainContent = parsedContent.find(
          (item) => item.type === "content"
        );

        if (mainContent && mainContent.content) {
          validMessages.push({
            ...msg,
            parsedContent: mainContent.content,
          });
        }
      }

      // build the strict alternating message sequence
      let alternatingMessages = [];
      let i = 0;

      while (i < validMessages.length) {
        const currentMsg = validMessages[i];

        // if the current message is user message
        if (currentMsg.role === "user") {
          // find the next assistant message
          let nextAssistantIndex = -1;
          for (let j = i + 1; j < validMessages.length; j++) {
            if (validMessages[j].role === "assistant") {
              nextAssistantIndex = j;
              break;
            }
          }

          // 如果找到了助手消息
          if (nextAssistantIndex !== -1) {
            const assistantMsg = validMessages[nextAssistantIndex];

            // if the assistant message is not error status, add user-assistant pair
            if (assistantMsg.status !== "error") {
              alternatingMessages.push({
                role: "user",
                content: currentMsg.parsedContent,
              });

              alternatingMessages.push({
                role: "assistant",
                content: assistantMsg.parsedContent,
              });
            }
            // if the assistant message is error status, skip this pair
            else {
              console.log(
                "skip error message and its corresponding user message"
              );
            }

            // continue to process the next pair
            i = nextAssistantIndex + 1;
          }
          // if there is no corresponding assistant message, this is the last user message
          else {
            alternatingMessages.push({
              role: "user",
              content: currentMsg.parsedContent,
            });
            i++;
          }
        }
        // if the current message is assistant message, it may be a standalone message, skip it
        else {
          i++;
        }
      }

      // 如果没有有效消息，返回空数组
      if (alternatingMessages.length === 0) {
        console.log(
          "no valid alternating message pair, cannot build conversation"
        );
        return [];
      }

      // ensure the first message is user message
      if (alternatingMessages[0].role !== "user") {
        // find the first user message in the array
        const firstUserIndex = alternatingMessages.findIndex(
          (msg) => msg.role === "user"
        );
        if (firstUserIndex > 0) {
          // move to the beginning
          const firstUserMsg = alternatingMessages.splice(firstUserIndex, 1)[0];
          alternatingMessages.unshift(firstUserMsg);
          console.log("adjusted the position of the first user message");
        } else {
          console.log("no user message found, cannot adjust the first message");
        }
      }

      // 确保最后一条消息是用户消息
      if (
        alternatingMessages.length > 0 &&
        alternatingMessages[alternatingMessages.length - 1].role !== "user"
      ) {
        // find the last user message
        for (let i = alternatingMessages.length - 2; i >= 0; i--) {
          if (alternatingMessages[i].role === "user") {
            // move to the end
            const lastUserMsg = alternatingMessages.splice(i, 1)[0];
            alternatingMessages.push(lastUserMsg);
            console.log("adjusted the position of the last user message");
            break;
          }
        }
      }

      // 应用消息数量限制
      if (
        !noLimit &&
        maxMessages > 0 &&
        alternatingMessages.length > maxMessages
      ) {
        console.log(
          `Message count(${alternatingMessages.length}) exceeds the limit(${maxMessages}), truncating...`
        );

        console.log(
          "Messages before truncation:",
          alternatingMessages.map((m) => ({
            role: m.role,
            content:
              typeof m.content === "string"
                ? m.content.substring(0, 20) + "..."
                : "[object]",
          }))
        );

        // ensure to keep the last user message
        const lastUserMessage =
          alternatingMessages[alternatingMessages.length - 1];

        // 截取消息，保留最近的消息
        alternatingMessages = alternatingMessages.slice(-maxMessages);

        // 确保第一条消息是用户消息
        if (
          alternatingMessages.length > 0 &&
          alternatingMessages[0].role !== "user"
        ) {
          // 查找新数组中的第一条用户消息
          const firstUserIndex = alternatingMessages.findIndex(
            (msg) => msg.role === "user"
          );
          if (firstUserIndex > 0) {
            // 移到开头
            const firstUserMsg = alternatingMessages.splice(
              firstUserIndex,
              1
            )[0];
            alternatingMessages.unshift(firstUserMsg);

            // 如果这导致数组超出大小限制，移除一条消息
            if (alternatingMessages.length > maxMessages) {
              alternatingMessages.splice(1, 1);
            }
          }
        }

        console.log(
          "Messages after truncation:",
          alternatingMessages.map((m) => ({
            role: m.role,
            content:
              typeof m.content === "string"
                ? m.content.substring(0, 20) + "..."
                : "[object]",
          }))
        );
      } else {
        console.log(
          `No truncation needed (${alternatingMessages.length} messages, limit=${maxMessages}, noLimit=${noLimit})`
        );
      }

      // 特殊情况：如果限制为1，只返回最后的用户消息
      if (maxMessages === 1) {
        const lastUserIndex = alternatingMessages.findIndex(
          (msg) => msg.role === "user"
        );
        if (lastUserIndex !== -1) {
          return [alternatingMessages[lastUserIndex]];
        }
      }

      // 最后检查一次确保严格交替（除了最后可能是用户消息）
      let finalMessages = [];
      let expectedRole = "user";

      for (const msg of alternatingMessages) {
        if (msg.role === expectedRole) {
          finalMessages.push(msg);
          // 切换下一个期望的角色
          expectedRole = expectedRole === "user" ? "assistant" : "user";
        }
      }

      // 如果最后不是用户消息，找到最后的用户消息并添加
      if (
        finalMessages.length > 0 &&
        finalMessages[finalMessages.length - 1].role !== "user"
      ) {
        // 找到最后的用户消息
        for (let i = alternatingMessages.length - 1; i >= 0; i--) {
          if (alternatingMessages[i].role === "user") {
            finalMessages.push(alternatingMessages[i]);
            break;
          }
        }
      }

      console.log(`Final messages to send: ${finalMessages.length} messages`);
      return finalMessages;
    },
    [getContextSettings, session]
  );

  /**
   * 确保第一条消息是用户消息
   * @param {Array} messages 消息数组
   * @returns {Array} 调整后的消息数组
   */
  const ensureUserMessageFirst = useCallback((messages) => {
    if (messages.length > 1 && messages[0].role !== "user") {
      console.log("第一条不是用户消息，调整顺序");
      // 查找第一条用户消息
      const firstUserIndex = messages.findIndex((msg) => msg.role === "user");
      if (firstUserIndex > 0) {
        // 将第一条用户消息移到数组开头
        const firstUserMsg = messages.splice(firstUserIndex, 1)[0];
        messages.unshift(firstUserMsg);
      }
    }
    return messages;
  }, []);

  // ================== 消息更新 ==================
  /**
   * 更新AI消息内容和状态
   * @param {Number} messageId 消息ID
   * @param {String} content 消息内容
   * @param {String} reasoning_content 推理内容
   * @param {String} status 消息状态
   * @param {Array} toolCallResults 工具调用结果
   */
  const updateAIMessage = useCallback(
    async (
      messageId,
      content,
      reasoning_content,
      status,
      toolCallResults = []
    ) => {
      const messageContent = [
        createMessageContent("content", content, status),
        ...(reasoning_content
          ? [
              createMessageContent(
                "reasoning_content",
                reasoning_content,
                status
              ),
            ]
          : []),
      ];

      // 如果存在工具调用结果，添加到消息内容中
      if (toolCallResults && toolCallResults.length > 0) {
        messageContent.push(
          createMessageContent("tool_calls", toolCallResults, status)
        );

        // 不再单独保存工具调用到数据库，而是直接包含在消息内容中
        // saveToolCalls(messageId, toolCallResults);
      }

      const updatedContent = JSON.stringify(messageContent);

      try {
        // 更新数据库中的消息内容
        if (status === "success" || status === "error") {
          await updateMessageContent(messageId, updatedContent, electronAPI);
          await updateMessageStatus(messageId, status, electronAPI);

          // 当消息状态为成功或错误时，也直接滚动到底部
          // 使用requestAnimationFrame确保DOM更新后再滚动
          requestAnimationFrame(() => {
            scrollToBottom();
            console.log("AI消息完成，已滚动到底部");
          });
        }

        // 更新本地消息列表 - 使用函数式更新以确保始终基于最新状态
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: status,
                  content: updatedContent,
                }
              : msg
          )
        );
      } catch (error) {
        console.error("更新消息内容失败:", error);
      }
    },
    [electronAPI, scrollToBottom]
  );

  // ================== 获取最新会话 ==================
  /**
   * 获取最新的会话数据
   * @param {Object} currentSession 当前会话
   * @returns {Promise<Object>} 最新的会话数据
   */
  const getFreshSession = useCallback(
    async (currentSession) => {
      try {
        // 如果可能的话，从数据库重新获取最新的会话信息
        if (electronAPI && electronAPI.getSessions) {
          const sessions = await electronAPI.getSessions();
          const freshSession = sessions.find((s) => s.id === currentSession.id);
          if (freshSession) {
            console.log("已获取最新会话信息:", freshSession.id);
            return freshSession;
          }
        }
        return currentSession;
      } catch (error) {
        console.error("获取最新会话信息失败:", error);
        return currentSession;
      }
    },
    [electronAPI]
  );

  /**
   * 从会话元数据中获取温度设置
   * @param {Object} sessionData 会话数据
   * @returns {Number} 温度值
   */
  const getTemperatureSetting = useCallback(
    (sessionData) => {
      let temperature = 0.7; // 默认值

      // 优先使用传入的sessionSettings
      if (sessionSettings && sessionSettings.temperature !== undefined) {
        temperature = parseFloat(sessionSettings.temperature);
        console.log(`使用传入的会话温度设置: ${temperature}`);
        return temperature;
      }

      try {
        if (sessionData.metadata) {
          const metadata =
            typeof sessionData.metadata === "string"
              ? JSON.parse(sessionData.metadata)
              : sessionData.metadata;

          if (metadata.temperature !== undefined) {
            temperature = parseFloat(metadata.temperature);
            console.log(`使用会话自定义温度: ${temperature}`);
          }
        }
      } catch (error) {
        console.error("解析会话温度设置失败:", error);
      }

      return temperature;
    },
    [sessionSettings]
  );

  // ================== 消息发送 ==================
  /**
   * 创建并保存用户消息
   * @param {String} content 消息内容
   * @param {Object} sessionData 会话数据
   * @param {Object} userConfig 用户配置
   * @returns {Object} 本地用户消息对象
   */
  const createUserMessage = useCallback(
    async (content, sessionData, userConfig) => {
      const userMessage = {
        sessionId: sessionData.id,
        role: "user",
        providerId: userConfig.providerId,
        modelId: userConfig.modelId,
        content: JSON.stringify([createMessageContent("content", content)]),
        status: "success",
      };

      const savedUserMessage = await saveMessage(userMessage, electronAPI);
      return {
        ...savedUserMessage,
        parsedContent: [createMessageContent("content", content)],
      };
    },
    [electronAPI]
  );

  /**
   * 创建并保存AI响应消息
   * @param {Object} sessionData 会话数据
   * @param {Object} userConfig 用户配置
   * @returns {Object} 本地AI消息对象和保存的消息ID
   */
  const createAIMessage = useCallback(
    async (sessionData, userConfig) => {
      const aiMessage = {
        sessionId: sessionData.id,
        role: "assistant",
        providerId: userConfig.providerId,
        modelId: userConfig.modelId,
        content: JSON.stringify([
          createMessageContent("content", ""),
          createMessageContent("reasoning_content", "", "pending"),
        ]),
        status: "pending",
      };

      const savedAiMessage = await saveMessage(aiMessage, electronAPI);

      // 保存当前AI消息ID，以便于停止生成时使用
      setCurrentAIMessageId(savedAiMessage.id);

      return {
        message: {
          ...savedAiMessage,
          parsedContent: [
            createMessageContent("content", ""),
            createMessageContent("reasoning_content", "", "pending"),
          ],
        },
        id: savedAiMessage.id,
      };
    },
    [electronAPI]
  );

  /**
   * 发送消息到AI服务
   * @param {Object} currentSession 当前会话
   * @param {Array} allMessages 所有消息
   * @param {Number} aiMessageId AI消息ID
   * @param {Number} temperature 温度设置
   */
  const sendMessageToAI = useCallback(
    async (currentSession, allMessages, aiMessageId, temperature) => {
      try {
        console.log(
          "sendMessageToAI",
          currentSession,
          `allMessages=${allMessages.length}`,
          `aiMessageId=${aiMessageId}`,
          `temperature=${temperature}`
        );

        // 创建一个新的AbortController用于取消请求
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // 应用上下文长度限制，获取需要发送的消息
        const messagesToSend = parseNeedSendMessage(
          allMessages,
          currentSession
        );
        console.log(
          `After context limiting, sending ${messagesToSend.length} messages to AI service`
        );

        // 获取激活的MCP工具
        let mcpTools = [];
        try {
          mcpTools = await mcpService.getAllActiveTools();
          console.log(`获取到${mcpTools.length}个激活的MCP工具`);
        } catch (error) {
          console.error("获取MCP工具失败:", error);
          // 获取工具失败不影响正常聊天
        }

        // 记录前两条和最后一条消息，帮助调试
        if (messagesToSend.length > 0) {
          console.log("First message:", {
            role: messagesToSend[0].role,
            content:
              typeof messagesToSend[0].content === "string"
                ? messagesToSend[0].content.substring(0, 50) + "..."
                : "[object]",
          });

          if (messagesToSend.length > 1) {
            console.log("Second message:", {
              role: messagesToSend[1].role,
              content:
                typeof messagesToSend[1].content === "string"
                  ? messagesToSend[1].content.substring(0, 50) + "..."
                  : "[object]",
            });
          }

          console.log("Last message:", {
            role: messagesToSend[messagesToSend.length - 1].role,
            content:
              typeof messagesToSend[messagesToSend.length - 1].content ===
              "string"
                ? messagesToSend[messagesToSend.length - 1].content.substring(
                    0,
                    50
                  ) + "..."
                : "[object]",
          });
        } else {
          console.warn("No messages to send after context limiting!");
        }

        await sendMessage(
          messagesToSend,
          currentSession,
          // 流式更新回调
          (response) => {
            const content = response.content || "";
            const reasoning_content = response.reasoning_content || "";
            // 获取工具调用状态
            const toolCallResults = response.toolCallResults || [];
            // receiving 表示会显示在ui上，但不会立即更新到db中
            updateAIMessage(
              aiMessageId,
              content,
              reasoning_content,
              "receiving",
              toolCallResults
            );
          },
          // 错误回调
          async (error) => {
            console.log("sendMessageToAI error", error);
            // 如果是因为请求被中止导致的错误，则忽略它（我们已经在handleStopGeneration中处理了）
            if (error.name === "AbortError") {
              console.log("请求已被用户取消");
              return;
            }

            const errorContent = error.message || "发送消息失败";
            updateAIMessage(aiMessageId, errorContent, "", "error");

            // 清除当前AI消息ID
            setCurrentAIMessageId(null);
            setIsSending(false);
            abortControllerRef.current = null;
          },
          // 完成回调
          async (response) => {
            console.log("sendMessageToAI complete", response);
            const content = response.content || "";
            const reasoning_content = response.reasoning_content || "";
            const toolCallResults = response.toolCallResults || [];
            updateAIMessage(
              aiMessageId,
              content,
              reasoning_content,
              "success",
              toolCallResults
            );

            // 清除当前AI消息ID
            setCurrentAIMessageId(null);
            setIsSending(false);
            abortControllerRef.current = null;
          },
          // pass parameters, including AbortSignal
          {
            temperature,
            signal: abortController.signal,
            mcpTools, // 传递MCP工具
          }
        );

        // if there is a callback function, call it
        if (typeof onSendMessage === "function") {
          onSendMessage();
        }
      } catch (error) {
        // if the error is caused by user cancel request, ignore it
        if (error.name === "AbortError") {
          console.log("request cancelled by user");
          return;
        }

        // if there is an uncaught exception, also clear status
        setCurrentAIMessageId(null);
        setIsSending(false);
        abortControllerRef.current = null;
        throw error;
      }
    },
    [parseNeedSendMessage, updateAIMessage]
  );

  /**
   * handle send message - main function
   * @param {string} content 要发送的消息内容
   */
  const handleSendMessage = useCallback(
    async (content) => {
      if (!content) return;

      if (!session) {
        antMessage.error(t("chat.pleaseSelectOrCreateASession"));
        return;
      }

      // check if AI is configured
      if (!isAIConfigured()) {
        antMessage.error(t("chat.pleaseSelectAModel"));
        return;
      }

      // get current config and provider and model infofig and provider and model info
      const userConfig = getUserConfig();

      // 设置发送状态
      setIsSending(true);

      try {
        // get latest session info
        const currentSession = await getFreshSession(session);

        // create and save user message
        const localUserMessage = await createUserMessage(
          content,
          currentSession,
          userConfig
        );
        setMessages((prevMessages) => [...prevMessages, localUserMessage]);

        // create and save ai response message
        const { message: localAiMessage, id: aiMessageId } =
          await createAIMessage(currentSession, userConfig);
        setMessages((prevMessages) => [...prevMessages, localAiMessage]);
        console.log("localAiMessage", localAiMessage);

        // 发送消息后直接滚动到底部
        // 使用requestAnimationFrame确保DOM更新后再滚动
        requestAnimationFrame(() => {
          scrollToBottom();
          console.log("发送消息后，已滚动到底部");
        });

        // get temperature setting
        const temperature = getTemperatureSetting(currentSession);

        // send message to ai service
        await sendMessageToAI(
          currentSession,
          [...messages, localUserMessage],
          aiMessageId,
          temperature
        );
      } catch (error) {
        // handle error directly, not call handleSendError
        console.error("send message failed:", error);
        antMessage.error(t("chat.sendMessageFailed") + ": " + error.message);
      }
    },
    [
      session,
      messages,
      createUserMessage,
      createAIMessage,
      getFreshSession,
      getTemperatureSetting,
      t,
      scrollToBottom,
    ]
  );

  /**
   * handle stop generation operation
   * mark the current generating message as error, content is user主动终止
   */
  const handleStopGeneration = useCallback(async () => {
    if (!currentAIMessageId) {
      console.log("no generating message can be stopped");
      return;
    }

    try {
      console.log(`stop generation message id: ${currentAIMessageId}`);

      // 取消网络请求
      if (abortControllerRef.current) {
        console.log("abort network request");
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // create termination message content
      const terminationContent = [
        createMessageContent(
          "content",
          t("chat.userTerminatedGeneration"),
          "error"
        ),
      ];

      // update message content and status
      await updateMessageContent(
        currentAIMessageId,
        JSON.stringify(terminationContent),
        electronAPI
      );
      await updateMessageStatus(currentAIMessageId, "error", electronAPI);

      // update local status
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === currentAIMessageId
            ? {
                ...msg,
                status: "error",
                content: JSON.stringify(terminationContent),
                parsedContent: terminationContent,
              }
            : msg
        )
      );

      // clear current ai message id and reset sending status
      setCurrentAIMessageId(null);
      setIsSending(false);

      // show tip
      antMessage.info(t("chat.aiGenerationTerminated"));
    } catch (error) {
      console.error("stop generation failed:", error);
      antMessage.error(t("chat.stopGenerationFailed") + error.message);

      // note: even if error, reset status
      setCurrentAIMessageId(null);
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [
    currentAIMessageId,
    electronAPI,
    updateMessageContent,
    updateMessageStatus,
  ]);

  // ================== export interface ==================
  return {
    messages,
    isSending,
    loading,
    messagesEndRef,
    chatContainerRef,
    handleSendMessage,
    loadMessages,
    handleStopGeneration,
    scrollToBottom,
  };
};
