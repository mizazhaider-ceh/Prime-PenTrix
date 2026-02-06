import { Subject } from '@prisma/client';

export interface PromptContext {
  subject: Subject;
  mode: string;
  userLevel?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  contextDocuments?: string[];
}

export class PromptBuilder {
  private static getModeInstructions(mode: string): string {
    const instructions: Record<string, string> = {
      learn: 'LEARN mode: Explain clearly, use examples, build progressively. Make complex topics digestible.',
      practice: 'PRACTICE mode: Present problems, provide hints, give feedback. Start easy, increase difficulty.',
      quiz: 'QUIZ mode: Ask clear questions. Don\'t reveal answers until after response. Explain correctness.',
      explain: 'EXPLAIN mode: Detailed step-by-step breakdowns with examples and edge cases.',
    };
    return instructions[mode] || '';
  }

  private static getSubjectPersonality(subject: Subject): string {
    const style = subject.pedagogy as any;
    if (!style) return '';
    return `Teaching ${subject.name}: ${style.tone || 'Professional'} tone, ${style.approach || 'structured'} approach.`;
  }

  private static getContextInstruction(contextDocs?: string[]): string {
    if (!contextDocs || contextDocs.length === 0) return '';
    return `\n\nCONTEXT (Student's uploaded materials):
${contextDocs.map((doc, i) => `[${i + 1}] ${doc}`).join('\n\n')}

🎯 CITATION RULES:
- Document info → cite source at sentence end: "[Source: filename.pdf, Page X]"
- General knowledge → no citation
- Use exact source attribution from context above`;
  }

  private static getLevelAdjustment(level?: string): string {
    const adjustments: Record<string, string> = {
      beginner: 'Student level: Beginner. Use simple language, explain jargon.',
      intermediate: 'Student level: Intermediate. Technical terms OK, explain complexity.',
      advanced: 'Student level: Advanced. Deep dives, nuanced details.',
    };
    return level ? (adjustments[level] || '') : '';
  }

  static buildSystemPrompt(context: PromptContext): string {
    const parts = [
      `You are Prime PenTrix, an AI tutor specialized in ${context.subject.name}.`,
      
      `🎯 SUBJECT SCOPE: Answer ONLY ${context.subject.name} questions. For off-topic questions, redirect: "🔀 This suits the [Subject] workspace better. I specialize in ${context.subject.name}."`,
      
      this.getSubjectPersonality(context.subject),
      this.getModeInstructions(context.mode),
      this.getLevelAdjustment(context.userLevel),
      
      context.subject.description ? `Subject: ${context.subject.description}` : '',
      
      `GUIDELINES:
- Cite sources for document info: "[Source: file.pdf, Page X]"
- No citation for general knowledge
- Admit unknowns, encourage critical thinking

FORMAT:
- Lists: Use "- " on new lines, NEVER inline bullets (•)
- Bold **key terms**, \`code\` for commands
- Use emoji icons (✅❌💡🎯) sparingly
- Code blocks with language: \`\`\`python
- Break complex topics into sections`,
      
      this.getContextInstruction(context.contextDocuments),
    ];

    return parts.filter(Boolean).join('\n\n');
  }

  static buildUserPrompt(
    userMessage: string,
    additionalContext?: {
      currentTopic?: string;
      learningObjectives?: string[];
    }
  ): string {
    const parts = [userMessage];

    if (additionalContext?.currentTopic) {
      parts.unshift(`[Current Topic: ${additionalContext.currentTopic}]`);
    }

    if (additionalContext?.learningObjectives && additionalContext.learningObjectives.length > 0) {
      parts.unshift(
        `[Learning Objectives: ${additionalContext.learningObjectives.join(', ')}]`
      );
    }

    return parts.join('\n\n');
  }

  static buildConversation(
    context: PromptContext,
    currentMessage: string,
    additionalContext?: {
      currentTopic?: string;
      learningObjectives?: string[];
    }
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: this.buildSystemPrompt(context),
      },
    ];

    // Add conversation history
    if (context.conversationHistory) {
      for (const msg of context.conversationHistory) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: this.buildUserPrompt(currentMessage, additionalContext),
    });

    return messages;
  }
}
