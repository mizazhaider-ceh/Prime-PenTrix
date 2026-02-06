import { Message, Conversation, Subject } from '@prisma/client';

export interface ExportData {
  conversation: Conversation & {
    subject: Subject;
  };
  messages: Message[];
  exportedAt: Date;
}

export class ConversationExporter {
  static exportToJSON(data: ExportData): string {
    return JSON.stringify(data, null, 2);
  }

  static exportToMarkdown(data: ExportData): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${data.conversation.title}`);
    lines.push('');
    lines.push(`**Subject:** ${data.conversation.subject.name}`);
    lines.push(`**Mode:** ${data.conversation.mode}`);
    lines.push(`**Created:** ${new Date(data.conversation.createdAt).toLocaleString()}`);
    lines.push(`**Exported:** ${data.exportedAt.toLocaleString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Messages
    for (const message of data.messages) {
      const role = message.role === 'user' ? '👤 User' : '🤖 Prime PenTrix';
      const timestamp = new Date(message.createdAt).toLocaleString();
      
      lines.push(`## ${role}`);
      lines.push(`*${timestamp}*`);
      lines.push('');
      lines.push(message.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  static exportToHTML(data: ExportData): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.conversation.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      background-color: #f9fafb;
      color: #111827;
    }
    .header {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    h1 {
      margin: 0 0 1rem 0;
      color: #1f2937;
    }
    .meta {
      color: #6b7280;
      font-size: 0.875rem;
    }
    .message {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .message.user {
      border-left: 4px solid #3b82f6;
    }
    .message.assistant {
      border-left: 4px solid #8b5cf6;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .role {
      font-weight: 600;
      color: #1f2937;
    }
    .timestamp {
      color: #6b7280;
      font-size: 0.875rem;
    }
    .content {
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .content code {
      background: #f3f4f6;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-family: 'Courier New', monospace;
      font-size: 0.875em;
    }
    .content pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
    }
    .content pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.conversation.title}</h1>
    <div class="meta">
      <p><strong>Subject:</strong> ${data.conversation.subject.name}</p>
      <p><strong>Mode:</strong> ${data.conversation.mode}</p>
      <p><strong>Created:</strong> ${new Date(data.conversation.createdAt).toLocaleString()}</p>
      <p><strong>Exported:</strong> ${data.exportedAt.toLocaleString()}</p>
    </div>
  </div>

  ${data.messages
    .map(
      (message) => `
  <div class="message ${message.role}">
    <div class="message-header">
      <span class="role">${message.role === 'user' ? '👤 User' : '🤖 Prime PenTrix'}</span>
      <span class="timestamp">${new Date(message.createdAt).toLocaleString()}</span>
    </div>
    <div class="content">${escapeHtml(message.content)}</div>
  </div>
  `
    )
    .join('\n')}
</body>
</html>
    `.trim();

    return html;
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async exportConversation(
    conversationId: string,
    format: 'json' | 'markdown' | 'html'
  ) {
    // Fetch conversation with messages
    const response = await fetch(`/api/conversations/${conversationId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }

    const { conversation } = await response.json();
    
    const exportData: ExportData = {
      conversation,
      messages: conversation.messages,
      exportedAt: new Date(),
    };

    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedTitle = conversation.title
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();

    switch (format) {
      case 'json': {
        const content = this.exportToJSON(exportData);
        this.downloadFile(
          content,
          `${sanitizedTitle}-${timestamp}.json`,
          'application/json'
        );
        break;
      }
      case 'markdown': {
        const content = this.exportToMarkdown(exportData);
        this.downloadFile(
          content,
          `${sanitizedTitle}-${timestamp}.md`,
          'text/markdown'
        );
        break;
      }
      case 'html': {
        const content = this.exportToHTML(exportData);
        this.downloadFile(
          content,
          `${sanitizedTitle}-${timestamp}.html`,
          'text/html'
        );
        break;
      }
    }
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
