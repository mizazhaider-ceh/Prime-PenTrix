export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface AIProviderResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export abstract class AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract chat(messages: AIMessage[]): Promise<AIProviderResponse>;
  abstract stream(messages: AIMessage[]): AsyncGenerator<AIStreamChunk>;
  
  get name(): string {
    return this.constructor.name;
  }

  get model(): string {
    return this.config.model;
  }
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
