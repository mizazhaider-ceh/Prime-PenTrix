import {
  AIProvider,
  AIMessage,
  AIStreamChunk,
  AIProviderConfig,
  AIProviderResponse,
  AIProviderError,
} from './provider';

interface CerebrasMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CerebrasStreamChunk {
  choices: {
    delta: {
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

export class CerebrasProvider extends AIProvider {
  private baseUrl = 'https://api.cerebras.ai/v1';

  constructor(config: AIProviderConfig) {
    super(config);
  }

  async chat(messages: AIMessage[]): Promise<AIProviderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: this.config.temperature ?? 0.7,
          max_tokens: this.config.maxTokens ?? 2048,
          top_p: this.config.topP ?? 1,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIProviderError(
          error.message || `Cerebras API error: ${response.statusText}`,
          'Cerebras',
          response.status,
          error
        );
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
        model: data.model,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Cerebras provider error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Cerebras',
        undefined,
        error
      );
    }
  }

  async *stream(messages: AIMessage[]): AsyncGenerator<AIStreamChunk> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: this.config.temperature ?? 0.7,
          max_tokens: this.config.maxTokens ?? 2048,
          top_p: this.config.topP ?? 1,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIProviderError(
          error.message || `Cerebras API error: ${response.statusText}`,
          'Cerebras',
          response.status,
          error
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIProviderError('No response body', 'Cerebras');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          yield { content: '', done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6)) as CerebrasStreamChunk;
              const content = json.choices[0]?.delta?.content;
              
              if (content) {
                yield { content, done: false };
              }

              if (json.choices[0]?.finish_reason) {
                yield { content: '', done: true };
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Cerebras streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Cerebras',
        undefined,
        error
      );
    }
  }
}
