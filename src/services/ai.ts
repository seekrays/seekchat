import { databaseService, type Provider, type ProviderModel } from "./database";

export interface AiConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface MessageRequest {
  role: string;
  content: string;
  model: string;
  provider: Provider;
}

export interface MessageResponse {
  role: string;
  content: string;
  error?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

class AiService {
  private activeProvider: Provider | null = null;
  private activeModel: ProviderModel | null = null;

  async init() {
    try {
      // 获取启用的提供商
      const enabledProviders = await databaseService.getEnabledProviders();
      if (enabledProviders.length > 0) {
        this.activeProvider = enabledProviders[0];

        // 获取启用的模型
        const enabledModels = this.activeProvider.models.filter(
          (m) => m.enabled
        );
        if (enabledModels.length > 0) {
          this.activeModel = enabledModels[0];
        }
      }
    } catch (error) {
      console.error("初始化AI服务失败:", error);
    }
  }

  async sendMessage(message: MessageRequest): Promise<MessageResponse> {
    if (!message.provider || !message.model) {
      throw new Error("未配置AI服务或模型");
    }

    try {
      // 根据不同的提供商调用不同的API
      switch (message.provider.id) {
        case "openai":
          return await this.callOpenAI(
            message.provider,
            message.model,
            message.content
          );
        case "deepseek":
          return await this.callDeepSeek(
            message.provider,
            message.model,
            message.content
          );
        case "silicon":
          return await this.callSiliconFlow(
            message.provider,
            message.model,
            message.content
          );
        case "moonshot":
          return await this.callMoonshot(
            message.provider,
            message.model,
            message.content
          );
        case "dashscope":
          return await this.callDashScope(
            message.provider,
            message.model,
            message.content
          );
        case "ollama":
          return await this.callOllama(
            message.provider,
            message.model,
            message.content
          );
        case "lmstudio":
          return await this.callLMStudio(
            message.provider,
            message.model,
            message.content
          );
        default:
          // 对于自定义提供商，使用通用的OpenAI兼容接口
          return await this.callOpenAICompatible(
            message.provider,
            message.model,
            message.content
          );
      }
    } catch (error) {
      console.error("发送消息到AI服务失败:", error);
      throw error;
    }
  }

  private async callOpenAI(
    provider: Provider,
    model: string,
    content: string
  ): Promise<MessageResponse> {
    if (!provider.apiKey) {
      return {
        role: "assistant",
        content: `请先在设置中配置 ${provider.name} 的 API Key 才能使用此服务。`,
        error: "API Key 未配置",
      };
    }

    const messages: ChatMessage[] = [{ role: "user", content }];

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return {
        role: "assistant",
        content: `OpenAI API 调用失败: ${response.status} ${response.statusText}。请检查API Key是否正确配置。`,
        error: `OpenAI API错误: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      role: "assistant",
      content: data.choices[0].message.content,
    };
  }

  private async callDeepSeek(
    provider: Provider,
    model: string,
    content: string
  ): Promise<MessageResponse> {
    if (!provider.apiKey) {
      // 演示模式：当没有API Key时，返回友好的演示回复
      return {
        role: "assistant",
        content: `🤖 **演示模式回复**\n\n您好！我是 ${provider.name} 的 ${model} 模型。\n\n您说："${content}"\n\n由于您还没有配置API Key，这是一个演示回复。要使用真实的AI服务，请：\n\n1. 前往 https://platform.deepseek.com/ 注册并获取API Key\n2. 在设置页面的"模型服务"中配置您的API Key\n3. 返回这里开始真实的AI对话\n\n配置完成后，您就可以与真正的AI助手进行对话了！`,
        error: "API Key 未配置 - 演示模式",
      };
    }

    const messages: ChatMessage[] = [{ role: "user", content }];

    console.log("DeepSeek API调用参数:", {
      url: `${provider.baseUrl}/chat/completions`,
      model,
      messages,
      hasApiKey: !!provider.apiKey,
    });

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      let errorMessage = `DeepSeek API 调用失败: ${response.status} ${response.statusText}`;

      // 尝试获取详细错误信息
      try {
        const errorData = await response.json();
        console.error("DeepSeek API错误详情:", errorData);
        if (errorData.error && errorData.error.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch (e) {
        console.error("无法解析错误响应:", e);
      }

      // 根据不同的错误状态码给出不同的提示
      if (response.status === 400) {
        errorMessage += "\n可能的原因：模型名称不正确或请求格式有误";
      } else if (response.status === 401) {
        errorMessage += "\n请检查API Key是否正确配置";
      } else if (response.status === 429) {
        errorMessage += "\n请求过于频繁，请稍后重试";
      }

      return {
        role: "assistant",
        content: errorMessage,
        error: `DeepSeek API错误: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      role: "assistant",
      content: data.choices[0].message.content,
    };
  }

  private async callSiliconFlow(
    provider: Provider,
    model: string,
    content: string
  ): Promise<MessageResponse> {
    if (!provider.apiKey) {
      return {
        role: "assistant",
        content: `请先在设置中配置 ${provider.name} 的 API Key 才能使用此服务。`,
        error: "API Key 未配置",
      };
    }

    const messages: ChatMessage[] = [{ role: "user", content }];

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return {
        role: "assistant",
        content: `SiliconFlow API 调用失败: ${response.status} ${response.statusText}。请检查API Key是否正确配置。`,
        error: `SiliconFlow API错误: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      role: "assistant",
      content: data.choices[0].message.content,
    };
  }

  private async callMoonshot(
    provider: Provider,
    model: string,
    content: string
  ): Promise<MessageResponse> {
    if (!provider.apiKey) {
      return {
        role: "assistant",
        content: `请先在设置中配置 ${provider.name} 的 API Key 才能使用此服务。`,
        error: "API Key 未配置",
      };
    }

    const messages: ChatMessage[] = [{ role: "user", content }];

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return {
        role: "assistant",
        content: `Moonshot API 调用失败: ${response.status} ${response.statusText}。请检查API Key是否正确配置。`,
        error: `Moonshot API错误: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      role: "assistant",
      content: data.choices[0].message.content,
    };
  }

  private async callDashScope(
    provider: Provider,
    model: string,
    content: string
  ): Promise<MessageResponse> {
    if (!provider.apiKey) {
      return {
        role: "assistant",
        content: `请先在设置中配置 ${provider.name} 的 API Key 才能使用此服务。`,
        error: "API Key 未配置",
      };
    }

    const messages: ChatMessage[] = [{ role: "user", content }];

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return {
        role: "assistant",
        content: `DashScope API 调用失败: ${response.status} ${response.statusText}。请检查API Key是否正确配置。`,
        error: `DashScope API错误: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      role: "assistant",
      content: data.choices[0].message.content,
    };
  }

  private async callOllama(
    provider: Provider,
    model: string,
    content: string
  ): Promise<MessageResponse> {
    // Ollama 通常不需要API Key，直接调用
    const messages: ChatMessage[] = [{ role: "user", content }];

    try {
      const response = await fetch(`${provider.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        return {
          role: "assistant",
          content: `Ollama 服务连接失败: ${response.status} ${response.statusText}。请确保Ollama服务正在运行。`,
          error: `Ollama API错误: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        role: "assistant",
        content: data.message.content,
      };
    } catch (error) {
      return {
        role: "assistant",
        content: `无法连接到Ollama服务。请确保Ollama服务正在运行并且地址配置正确。`,
        error: "Ollama连接失败",
      };
    }
  }

  private async callLMStudio(
    provider: Provider,
    model: string,
    content: string
  ): Promise<MessageResponse> {
    // LM Studio 通常不需要API Key，直接调用
    const messages: ChatMessage[] = [{ role: "user", content }];

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        return {
          role: "assistant",
          content: `LM Studio 服务连接失败: ${response.status} ${response.statusText}。请确保LM Studio服务正在运行。`,
          error: `LM Studio API错误: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        role: "assistant",
        content: data.choices[0].message.content,
      };
    } catch (error) {
      return {
        role: "assistant",
        content: `无法连接到LM Studio服务。请确保LM Studio服务正在运行并且地址配置正确。`,
        error: "LM Studio连接失败",
      };
    }
  }

  private async callOpenAICompatible(
    provider: Provider,
    model: string,
    content: string
  ): Promise<MessageResponse> {
    const messages: ChatMessage[] = [{ role: "user", content }];

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (provider.apiKey) {
      headers["Authorization"] = `Bearer ${provider.apiKey}`;
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      role: "assistant",
      content: data.choices[0].message.content,
    };
  }

  async setActiveProvider(provider: Provider) {
    this.activeProvider = provider;
    // 设置第一个启用的模型
    const enabledModels = provider.models.filter((m) => m.enabled);
    if (enabledModels.length > 0) {
      this.activeModel = enabledModels[0];
    }
  }

  async setActiveModel(model: ProviderModel) {
    this.activeModel = model;
  }

  getActiveProvider() {
    return this.activeProvider;
  }

  getActiveModel() {
    return this.activeModel;
  }

  // 流式调用方法（用于实时响应）
  async sendMessageStream(
    message: MessageRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!message.provider || !message.model) {
      throw new Error("未配置AI服务或模型");
    }

    const messages: ChatMessage[] = [
      { role: "user", content: message.content },
    ];

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (message.provider.apiKey) {
      headers["Authorization"] = `Bearer ${message.provider.apiKey}`;
    }

    const response = await fetch(
      `${message.provider.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: message.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API错误: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法获取响应流");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            if (data === "[DONE]") return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.warn("解析流数据失败:", e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const aiService = new AiService();
