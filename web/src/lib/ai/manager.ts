import { AIProvider, AIMessage, AIStreamChunk, AIProviderError } from './provider';
import { CerebrasProvider } from './cerebras';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';

export interface AIManagerConfig {
  cerebras?: {
    apiKey: string;
    model: string;
  };
  gemini?: {
    apiKey: string;
    model: string;
  };
  openai?: {
    apiKey: string;
    model: string;
  };
  preferredProvider?: 'cerebras' | 'gemini' | 'openai';
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export class AIManager {
  private providers: AIProvider[] = [];
  private preferredProvider?: AIProvider;

  constructor(config: AIManagerConfig) {
    // Initialize Cerebras if configured
    if (config.cerebras?.apiKey && config.cerebras?.model) {
      const cerebrasProvider = new CerebrasProvider({
        apiKey: config.cerebras.apiKey,
        model: config.cerebras.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
      });
      this.providers.push(cerebrasProvider);
      
      if (config.preferredProvider === 'cerebras') {
        this.preferredProvider = cerebrasProvider;
      }
    }

    // Initialize Gemini if configured
    if (config.gemini?.apiKey && config.gemini?.model) {
      const geminiProvider = new GeminiProvider({
        apiKey: config.gemini.apiKey,
        model: config.gemini.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
      });
      this.providers.push(geminiProvider);
      
      if (config.preferredProvider === 'gemini' || !this.preferredProvider) {
        this.preferredProvider = geminiProvider;
      }
    }

    // Initialize OpenAI if configured
    if (config.openai?.apiKey && config.openai?.model) {
      const openaiProvider = new OpenAIProvider({
        apiKey: config.openai.apiKey,
        model: config.openai.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
      });
      this.providers.push(openaiProvider);
      
      if (config.preferredProvider === 'openai' || !this.preferredProvider) {
        this.preferredProvider = openaiProvider;
      }
    }

    if (this.providers.length === 0) {
      throw new Error('At least one AI provider must be configured');
    }
  }

  async chat(messages: AIMessage[]): Promise<{
    content: string;
    provider: string;
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    const errors: AIProviderError[] = [];
    
    // Try preferred provider first
    if (this.preferredProvider) {
      try {
        const response = await this.preferredProvider.chat(messages);
        return {
          ...response,
          provider: this.preferredProvider.name,
        };
      } catch (error) {
        if (error instanceof AIProviderError) {
          errors.push(error);
          console.warn(`${error.provider} failed, trying fallback:`, error.message);
        } else {
          throw error;
        }
      }
    }

    // Try remaining providers as fallback
    for (const provider of this.providers) {
      if (provider === this.preferredProvider) continue;
      
      try {
        const response = await provider.chat(messages);
        return {
          ...response,
          provider: provider.name,
        };
      } catch (error) {
        if (error instanceof AIProviderError) {
          errors.push(error);
          console.warn(`${error.provider} failed:`, error.message);
        } else {
          throw error;
        }
      }
    }

    // All providers failed
    throw new AIProviderError(
      `All providers failed. Errors: ${errors.map((e) => `${e.provider}: ${e.message}`).join('; ')}`,
      'AIManager'
    );
  }

  async *stream(messages: AIMessage[]): AsyncGenerator<
    AIStreamChunk & { provider: string; model: string }
  > {
    const errors: AIProviderError[] = [];
    
    // Try preferred provider first
    if (this.preferredProvider) {
      try {
        for await (const chunk of this.preferredProvider.stream(messages)) {
          yield {
            ...chunk,
            provider: this.preferredProvider.name,
            model: this.preferredProvider.model,
          };
        }
        return;
      } catch (error) {
        if (error instanceof AIProviderError) {
          errors.push(error);
          console.warn(`${error.provider} streaming failed, trying fallback:`, error.message);
        } else {
          throw error;
        }
      }
    }

    // Try remaining providers as fallback
    for (const provider of this.providers) {
      if (provider === this.preferredProvider) continue;
      
      try {
        for await (const chunk of provider.stream(messages)) {
          yield {
            ...chunk,
            provider: provider.name,
            model: provider.model,
          };
        }
        return;
      } catch (error) {
        if (error instanceof AIProviderError) {
          errors.push(error);
          console.warn(`${error.provider} streaming failed:`, error.message);
        } else {
          throw error;
        }
      }
    }

    // All providers failed
    throw new AIProviderError(
      `All providers failed. Errors: ${errors.map((e) => `${e.provider}: ${e.message}`).join('; ')}`,
      'AIManager'
    );
  }

  get availableProviders(): string[] {
    return this.providers.map((p) => p.name);
  }

  get activeProvider(): string | undefined {
    return this.preferredProvider?.name;
  }
}
