/**
 * message service
 * handle message formatting, sending and saving
 */

import { sendMessageToAI } from "./aiService";
import { getUserConfig } from "../hooks/useUserConfig";
import { getAllProviders } from "./models";
import i18n from "../i18n";

/**
 * create a new message content object
 * @param {string} type message type (reasoning_content, content)
 * @param {string} content message content
 * @param {string} status message status (success, error, pending)
 * @returns {Object} message content object
 */
export const createMessageContent = (type, content, status = "success") => {
  return {
    type,
    content,
    status,
    timestamp: Date.now(),
  };
};

/**
 * format message content array to string
 * @param {Array} contentArray message content array
 * @returns {string} formatted message content string
 */
export const formatMessageContent = (contentArray) => {
  if (!contentArray || !Array.isArray(contentArray)) {
    return "";
  }

  // return the content of type 'content'
  const mainContent = contentArray.find((item) => item.type === "content");
  if (mainContent) {
    return mainContent.content;
  }

  // if there is no 'content' type, return the first successful content
  const successContent = contentArray.find((item) => item.status === "success");
  if (successContent) {
    return successContent.content;
  }

  return "";
};

/**
 * parse message content string to content array
 * @param {string} contentString message content string
 * @returns {Array} message content array
 */
export const parseMessageContent = (contentString) => {
  try {
    // 尝试解析为 JSON
    const parsed = JSON.parse(contentString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // if the parsing is successful but not an array, create an array containing the content
    return [createMessageContent("content", contentString)];
  } catch (e) {
    // if the parsing fails, create an array containing the original string
    return [createMessageContent("content", contentString)];
  }
};

/**
 * send message to AI and handle the response
 * @param {Array} messages history messages list
 * @param {Object} session current session
 * @param {Function} onProgress progress callback function
 * @param {Function} onError error callback function
 * @param {Function} onComplete complete callback function
 * @param {Object} options options, contains temperature parameter and signal for cancel request
 * @returns {Promise} Promise containing AI response
 */
export const sendMessage = async (
  messages,
  session,
  onProgress,
  onError,
  onComplete,
  options = {}
) => {
  console.log(
    "sendMessage",
    messages,
    session,
    onProgress,
    onError,
    onComplete,
    options
  );
  if (!session) {
    throw new Error(i18n.t("chat.pleaseSelectOrCreateASession"));
  }

  console.log("messageService: sendMessage", options);

  // get current config
  const userConfig = getUserConfig();
  if (!userConfig.providerId || !userConfig.modelId) {
    console.error(
      "messageService: sendMessage: unselect provider or model:",
      userConfig
    );
    throw new Error(i18n.t("chat.pleaseSelectAModel"));
  }

  // get provider config
  const allProviders = getAllProviders();
  const provider = allProviders.find((p) => p.id === userConfig.providerId);
  if (!provider) {
    console.error(
      "messageService: sendMessage: unselect provider:",
      userConfig.providerId
    );
    throw new Error(i18n.t("settings.noProvidersAvailable"));
  }

  // get model
  const model = provider.models.find((m) => m.id === userConfig.modelId);
  if (!model) {
    console.error(
      "messageService: sendMessage: unselect model:",
      userConfig.modelId
    );
    throw new Error(i18n.t("chat.pleaseSelectAModel"));
  }

  console.log(
    "messageService: sendMessage: prepare to send message to ai service:",
    {
      provider: provider.id,
      model: model.id,
      temperature: options.temperature,
      hasSignal: !!options.signal,
      mcpToolsCount: options.mcpTools ? options.mcpTools.length : 0,
    }
  );

  // format messages
  const formattedMessages = messages.map((msg) => ({
    role: msg.role,
    content:
      typeof msg.content === "string"
        ? msg.content
        : formatMessageContent(msg.content),
    // keep these fields, some APIs may use them
    providerId: msg.providerId,
    modelId: msg.modelId,
  }));

  console.log(
    "messageService: sendMessage: formatted messages length:",
    formattedMessages.length
  );

  try {
    console.log("messageService: sendMessage: start to call ai service...");

    // call ai service, pass temperature and cancel signal
    return await sendMessageToAI(
      formattedMessages,
      provider,
      model,
      onProgress,
      onComplete,
      {
        temperature: options.temperature,
        signal: options.signal,
        mcpTools: options.mcpTools,
      }
    );
  } catch (error) {
    // if the error is caused by user cancel request, pass it to caller
    if (error.name === "AbortError") {
      console.log("messageService: sendMessage: request cancelled by user");
      if (onError) onError(error);
      throw error;
    }

    if (onError) onError(error);
    console.error(
      "messageService: sendMessage: ai response generation failed:",
      error
    );
    throw error;
  }
};

/**
 * save message to database
 * @param {Object} message message object
 * @param {Function} electronAPI Electron API
 * @returns {Promise} save result
 */
export const saveMessage = async (message, electronAPI) => {
  if (!electronAPI) {
    throw new Error("electronAPI is undefined");
  }

  // if the message content is an array, convert it to a JSON string
  if (Array.isArray(message.content)) {
    message.content = JSON.stringify(message.content);
  }

  return await electronAPI.addMessage(message);
};

/**
 * update message status
 * @param {number} messageId message id
 * @param {string} status new status
 * @param {Function} electronAPI Electron API
 * @returns {Promise} update result
 */
export const updateMessageStatus = async (messageId, status, electronAPI) => {
  if (!electronAPI) {
    throw new Error("electronAPI is undefined");
  }

  return await electronAPI.updateMessageStatus(messageId, status);
};

/**
 * update message content
 * @param {number} messageId message id
 * @param {Array|string} content new content
 * @param {Function} electronAPI Electron API
 * @returns {Promise} update result
 */
export const updateMessageContent = async (messageId, content, electronAPI) => {
  if (!electronAPI) {
    throw new Error("electronAPI is undefined");
  }

  // if the content is an array, convert it to a JSON string
  if (Array.isArray(content)) {
    content = JSON.stringify(content);
  }

  return await electronAPI.updateMessageContent(messageId, content);
};
