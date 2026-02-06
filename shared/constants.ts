/**
 * Shared constants and configuration
 * Used across the Prime PenTrix application
 */

export const APP_CONFIG = {
  name: 'Prime PenTrix',
  version: '3.0.0',
  description: 'Where Penetration Testing Meets Intelligence',
  creator: {
    name: 'Muhammad Izaz Haider',
    alias: 'MIHx0',
    role: 'Junior DevSecOps & AI Security Engineer',
    company: 'Damno Solutions',
    education: 'Cybersecurity Student @ Howest University 🇧🇪',
  },
} as const;

export const PEDAGOGY_STYLES = {
  'packet-first':
    'Always explain concepts starting from the packet header structure (bits/bytes) before discussing high-level theory. Include diagrams of packet layouts.',
  'attack-chain':
    'Explain using the Recon → Exploit → Post-Exploit attack chain. Provide safe lab examples and always mention ethical/legal considerations.',
  'code-first':
    'Start with working, runnable code examples. Then explain underlying concepts. Include installation commands and dependencies.',
  'cli-first':
    'Provide the exact terminal command IMMEDIATELY. Then break down each flag and option. Assume Linux/Bash environment.',
  'hint-ladder':
    'Give the smallest helpful nudge first. Only reveal more when explicitly asked. Focus on teaching methodology over direct answers.',
  'annotated-code':
    'Provide heavily commented code where every significant line has an inline explanation. Compare different language approaches.',
  'case-based':
    'Reference specific legal articles and real court cases. Use scenario-based explanations for practical understanding.',
  'research-driven':
    'Cite recent research papers (arXiv, academic conferences) and CVE disclosures. Provide reproducible Python code for both attack and defense.',
} as const;

export const THEMES = [
  'glass',
  'prime-dark',
  'hacker',
  'midnight',
  'cyber',
  'ocean',
  'forest',
  'nebula',
  'aurora',
  'sunset',
  'lavender',
  'light',
] as const;

export const CONVERSATION_MODES = [
  { value: 'chat', label: 'Chat', icon: '💬' },
  { value: 'questions', label: 'Questions', icon: '❓' },
  { value: 'explain', label: 'Explain', icon: '💡' },
  { value: 'summarize', label: 'Summarize', icon: '📝' },
  { value: 'quiz', label: 'Quiz', icon: '🧠' },
] as const;

export const API_ROUTES = {
  health: '/api/health',
  subjects: '/api/subjects',
  conversations: '/api/conversations',
  messages: '/api/messages',
  documents: '/api/documents',
  analytics: '/api/analytics',
  tools: '/api/tools',
  webhooks: {
    clerk: '/api/webhooks/clerk',
  },
} as const;

export const STORAGE_KEYS = {
  theme: 'prime-pentrix-theme',
  activeSubject: 'sentinel-active-subject',
  conversationHistory: 'sentinel-conversation-history',
} as const;

export const RAG_CONFIG = {
  chunkSize: 500,
  chunkOverlap: 50,
  maxContextChunks: 5,
  embeddingModel: 'all-MiniLM-L6-v2', // 384 dimensions
  rerankModel: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
  topK: 20,
  minSimilarity: 0.5,
} as const;

export const DOCUMENT_CONFIG = {
  maxFileSize: 20 * 1024 * 1024, // 20MB
  allowedTypes: [
    { mime: 'application/pdf', ext: '.pdf', label: 'PDF' },
    {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ext: '.docx',
      label: 'Word',
    },
    { mime: 'text/plain', ext: '.txt', label: 'Text' },
    { mime: 'text/markdown', ext: '.md', label: 'Markdown' },
  ],
  acceptString: '.pdf,.docx,.txt,.md',
  statusLabels: {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Ready',
    failed: 'Failed',
  },
  statusColors: {
    pending: 'text-yellow-400',
    processing: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  },
} as const;

export const SPACED_REPETITION_INTERVALS = {
  wrong: 1, // 1 day
  once: 3, // 3 days
  twice: 7, // 7 days
  mastered: 30, // 30 days
} as const;

export const QUIZ_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  CHAT_MESSAGE: 'chat_message',
  DOCUMENT_UPLOAD: 'document_upload',
  TOOL_USE: 'tool_use',
  QUIZ_ATTEMPT: 'quiz_attempt',
  QUIZ_COMPLETE: 'quiz_complete',
  SUBJECT_VIEW: 'subject_view',
} as const;
