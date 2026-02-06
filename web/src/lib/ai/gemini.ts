import {
  AIProvider,
  AIMessage,
  AIStreamChunk,
  AIProviderConfig,
  AIProviderResponse,
  AIProviderError,
} from './provider';

interface GeminiContent {
  role: string;
  parts: { text: string }[];
}

interface GeminiStreamChunk {
  candidates: {
    content: {
      parts: { text: string }[];
    };
    finishReason?: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider extends AIProvider {
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: AIProviderConfig) {
    super(config);
  }

  private convertMessages(messages: AIMessage[]): {
    systemInstruction?: { parts: { text: string }[] };
    contents: GeminiContent[];
  } {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const systemInstruction = systemMessages.length > 0
      ? {
          parts: systemMessages.map((m) => ({ text: m.content })),
        }
      : undefined;

    const contents: GeminiContent[] = conversationMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    return { systemInstruction, contents };
  }

  async chat(messages: AIMessage[]): Promise<AIProviderResponse> {
    try {
      const { systemInstruction, contents } = this.convertMessages(messages);

      const response = await fetch(
        `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction,
            contents,
            generationConfig: {
              temperature: this.config.temperature ?? 0.7,
              maxOutputTokens: this.config.maxTokens ?? 2048,
              topP: this.config.topP ?? 1,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIProviderError(
          error.error?.message || `Gemini API error: ${response.statusText}`,
          'Gemini',
          response.status,
          error
        );
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new AIProviderError('No response from Gemini', 'Gemini');
      }

      const candidate = data.candidates[0];
      const content = candidate.content.parts.map((p: any) => p.text).join('');

      return {
        content,
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount,
              completionTokens: data.usageMetadata.candidatesTokenCount,
              totalTokens: data.usageMetadata.totalTokenCount,
            }
          : undefined,
        model: this.config.model,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Gemini provider error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Gemini',
        undefined,
        error
      );
    }
  }

  async *stream(messages: AIMessage[]): AsyncGenerator<AIStreamChunk> {
    try {
      const { systemInstruction, contents } = this.convertMessages(messages);

      const response = await fetch(
        `${this.baseUrl}/models/${this.config.model}:streamGenerateContent?key=${this.config.apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction,
            contents,
            generationConfig: {
              temperature: this.config.temperature ?? 0.7,
              maxOutputTokens: this.config.maxTokens ?? 2048,
              topP: this.config.topP ?? 1,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AIProviderError(
          error.error?.message || `Gemini API error: ${response.statusText}`,
          'Gemini',
          response.status,
          error
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIProviderError('No response body', 'Gemini');
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
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          
          try {
            const json = JSON.parse(trimmed.slice(6)) as GeminiStreamChunk;
            
            if (json.candidates && json.candidates.length > 0) {
              const candidate = json.candidates[0];
              const text = candidate.content.parts
                .map((p) => p.text)
                .join('');
              
              if (text) {
                yield { content: text, done: false };
              }

              if (candidate.finishReason) {
                yield { content: '', done: true };
              }
            }
          } catch (e) {
            console.error('Error parsing Gemini SSE chunk:', e);
          }
        }
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Gemini streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Gemini',
        undefined,
        error
      );
    }
  }
}
