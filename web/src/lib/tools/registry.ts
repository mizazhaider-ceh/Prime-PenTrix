import { Tool, ToolCategory, ToolPriority } from '@/types/tools';

// ═══════════════════════════════════════════════════════════════
// TOOL REGISTRY - All 24 Tools Defined
// Phase 4: Tools & Subject Features
// ═══════════════════════════════════════════════════════════════

export const TOOLS: Tool[] = [
  // ─────────────────────────────────────────────────────────────
  // PRIORITY 1: ESSENTIAL TOOLS (6 tools)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'subnet-calculator',
    name: 'Subnet Calculator',
    description: 'Calculate subnets, IP ranges, broadcast addresses, and host counts from CIDR notation',
    category: 'network',
    priority: 1,
    icon: 'Network',
    subjects: ['CS-NET-S2', 'CS-PENTEST-S2'],
    tags: ['networking', 'subnetting', 'CIDR', 'calculator'],
    inputs: [
      {
        name: 'ipAddress',
        label: 'IP Address',
        type: 'text',
        placeholder: '192.168.1.0',
        required: true,
        validation: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$',
        helperText: 'Enter valid IPv4 address',
      },
      {
        name: 'cidr',
        label: 'CIDR Prefix',
        type: 'number',
        placeholder: '24',
        required: true,
        min: 1,
        max: 32,
        defaultValue: 24,
      },
    ],
    exampleInputs: {
      ipAddress: '192.168.1.0',
      cidr: 24,
    },
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode and inspect JSON Web Tokens (JWT) to view header, payload, and signature',
    category: 'web',
    priority: 1,
    icon: 'Key',
    subjects: ['CS-BACKEND-S2', 'CS-PENTEST-S2', 'CS-AISEC-S2'],
    tags: ['JWT', 'authentication', 'security', 'tokens'],
    inputs: [
      {
        name: 'token',
        label: 'JWT Token',
        type: 'textarea',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        required: true,
        helperText: 'Paste your JWT token here',
      },
    ],
    exampleInputs: {
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    },
  },
  {
    id: 'encoder-decoder',
    name: 'Encoder/Decoder',
    description: 'Encode and decode strings in various formats: URL, Base64, HTML entities, and more',
    category: 'web',
    priority: 1,
    icon: 'Binary',
    subjects: ['CS-BACKEND-S2', 'CS-CTF-S2', 'CS-PENTEST-S2', 'CS-SCRIPT-S2'],
    tags: ['encoding', 'decoding', 'base64', 'url', 'html'],
    inputs: [
      {
        name: 'input',
        label: 'Input Text',
        type: 'textarea',
        placeholder: 'Enter text to encode/decode...',
        required: true,
      },
      {
        name: 'operation',
        label: 'Operation',
        type: 'select',
        required: true,
        options: [
          { label: 'URL Encode', value: 'url-encode' },
          { label: 'URL Decode', value: 'url-decode' },
          { label: 'Base64 Encode', value: 'base64-encode' },
          { label: 'Base64 Decode', value: 'base64-decode' },
          { label: 'HTML Encode', value: 'html-encode' },
          { label: 'HTML Decode', value: 'html-decode' },
          { label: 'Hex Encode', value: 'hex-encode' },
          { label: 'Hex Decode', value: 'hex-decode' },
        ],
        defaultValue: 'base64-encode',
      },
    ],
    exampleInputs: {
      input: 'Hello, World!',
      operation: 'base64-encode',
    },
  },
  {
    id: 'permission-calculator',
    name: 'Unix Permission Calculator',
    description: 'Calculate and convert Unix file permissions between octal and symbolic notation',
    category: 'linux',
    priority: 1,
    icon: 'Lock',
    subjects: ['CS-LINUX-S2', 'CS-SCRIPT-S2'],
    tags: ['linux', 'permissions', 'chmod', 'octal'],
    inputs: [
      {
        name: 'input',
        label: 'Permission Input',
        type: 'text',
        placeholder: '755 or rwxr-xr-x',
        required: true,
        helperText: 'Enter octal (755) or symbolic (rwxr-xr-x)',
      },
    ],
    exampleInputs: {
      input: '755',
    },
  },
  {
    id: 'base-converter',
    name: 'Base Converter',
    description: 'Convert numbers between binary, octal, decimal, and hexadecimal bases',
    category: 'scripting',
    priority: 1,
    icon: 'Calculator',
    subjects: ['CS-SCRIPT-S2', 'CS-CTF-S2', 'CS-BACKEND-S2'],
    tags: ['numbers', 'binary', 'hex', 'octal', 'conversion'],
    inputs: [
      {
        name: 'input',
        label: 'Input Number',
        type: 'text',
        placeholder: '255 or 0xFF or 0b11111111',
        required: true,
      },
      {
        name: 'fromBase',
        label: 'From Base',
        type: 'select',
        required: true,
        options: [
          { label: 'Binary (2)', value: 2 },
          { label: 'Octal (8)', value: 8 },
          { label: 'Decimal (10)', value: 10 },
          { label: 'Hexadecimal (16)', value: 16 },
        ],
        defaultValue: 10,
      },
    ],
    exampleInputs: {
      input: '255',
      fromBase: 10,
    },
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regular expressions with pattern matching, groups, and flags',
    category: 'scripting',
    priority: 1,
    icon: 'Regex',
    subjects: ['CS-SCRIPT-S2', 'CS-CTF-S2', 'CS-BACKEND-S2'],
    tags: ['regex', 'pattern', 'matching', 'validation'],
    inputs: [
      {
        name: 'pattern',
        label: 'Regex Pattern',
        type: 'text',
        placeholder: '\\d{3}-\\d{3}-\\d{4}',
        required: true,
      },
      {
        name: 'testString',
        label: 'Test String',
        type: 'textarea',
        placeholder: 'Enter text to test against pattern...',
        required: true,
      },
      {
        name: 'flags',
        label: 'Flags',
        type: 'text',
        placeholder: 'g, i, m',
        defaultValue: 'g',
        helperText: 'Regex flags: g (global), i (case-insensitive), m (multiline)',
      },
    ],
    exampleInputs: {
      pattern: '\\d{3}-\\d{3}-\\d{4}',
      testString: 'My phone is 555-123-4567',
      flags: 'g',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 2: IMPORTANT TOOLS (6 tools)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'header-analyzer',
    name: 'HTTP Header Analyzer',
    description: 'Analyze HTTP request/response headers for security issues and configuration',
    category: 'web',
    priority: 2,
    icon: 'FileCode',
    subjects: ['CS-BACKEND-S2', 'CS-PENTEST-S2', 'CS-AISEC-S2'],
    tags: ['http', 'headers', 'security', 'analysis'],
    inputs: [
      {
        name: 'headers',
        label: 'HTTP Headers',
        type: 'textarea',
        placeholder: 'Content-Type: application/json\nAuthorization: Bearer token...',
        required: true,
        helperText: 'Paste HTTP headers (one per line)',
      },
    ],
    exampleInputs: {
      headers: 'Content-Type: application/json\nX-Frame-Options: DENY\nStrict-Transport-Security: max-age=31536000',
    },
  },
  {
    id: 'sql-formatter',
    name: 'SQL Formatter',
    description: 'Format, beautify, and validate SQL queries for better readability',
    category: 'backend',
    priority: 2,
    icon: 'Database',
    subjects: ['CS-BACKEND-S2', 'CS-PENTEST-S2'],
    tags: ['sql', 'database', 'formatter', 'query'],
    inputs: [
      {
        name: 'query',
        label: 'SQL Query',
        type: 'textarea',
        placeholder: 'SELECT * FROM users WHERE id = 1',
        required: true,
      },
    ],
    exampleInputs: {
      query: 'SELECT u.id,u.name,o.total FROM users u JOIN orders o ON u.id=o.user_id WHERE o.total>100',
    },
  },
  {
    id: 'hash-identifier',
    name: 'Hash Identifier',
    description: 'Identify hash types from hash strings (MD5, SHA-1, bcrypt, etc.)',
    category: 'security',
    priority: 2,
    icon: 'Hash',
    subjects: ['CS-PENTEST-S2', 'CS-CTF-S2', 'CS-AISEC-S2'],
    tags: ['hash', 'cryptography', 'identification'],
    inputs: [
      {
        name: 'hash',
        label: 'Hash String',
        type: 'text',
        placeholder: '5d41402abc4b2a76b9719d911017c592',
        required: true,
      },
    ],
    exampleInputs: {
      hash: '5d41402abc4b2a76b9719d911017c592',
    },
  },
  {
    id: 'cron-generator',
    name: 'Cron Expression Generator',
    description: 'Generate and explain cron expressions for scheduled tasks',
    category: 'linux',
    priority: 2,
    icon: 'Clock',
    subjects: ['CS-LINUX-S2', 'CS-BACKEND-S2', 'CS-SCRIPT-S2'],
    tags: ['cron', 'scheduler', 'linux', 'automation'],
    inputs: [
      {
        name: 'minute',
        label: 'Minute (0-59)',
        type: 'text',
        placeholder: '* or 0 or */5',
        defaultValue: '*',
      },
      {
        name: 'hour',
        label: 'Hour (0-23)',
        type: 'text',
        placeholder: '* or 0 or */2',
        defaultValue: '*',
      },
      {
        name: 'dayOfMonth',
        label: 'Day of Month (1-31)',
        type: 'text',
        placeholder: '* or 1 or 15',
        defaultValue: '*',
      },
      {
        name: 'month',
        label: 'Month (1-12)',
        type: 'text',
        placeholder: '* or 1 or */3',
        defaultValue: '*',
      },
      {
        name: 'dayOfWeek',
        label: 'Day of Week (0-7)',
        type: 'text',
        placeholder: '* or 0 or 1-5',
        defaultValue: '*',
      },
    ],
    exampleInputs: {
      minute: '0',
      hour: '*/2',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    },
  },
  {
    id: 'port-lookup',
    name: 'Port Number Lookup',
    description: 'Look up common service ports and their protocols (database of 100+ ports)',
    category: 'network',
    priority: 2,
    icon: 'DoorOpen',
    subjects: ['CS-NET-S2', 'CS-PENTEST-S2', 'CS-LINUX-S2'],
    tags: ['ports', 'services', 'networking', 'protocols'],
    inputs: [
      {
        name: 'query',
        label: 'Port Number or Service Name',
        type: 'text',
        placeholder: '80 or HTTP or ssh',
        required: true,
      },
    ],
    exampleInputs: {
      query: '80',
    },
  },
  {
    id: 'json-validator',
    name: 'JSON Validator & Formatter',
    description: 'Validate, format, and minify JSON data',
    category: 'web',
    priority: 2,
    icon: 'Braces',
    subjects: ['CS-BACKEND-S2', 'CS-SCRIPT-S2', 'CS-CTF-S2'],
    tags: ['json', 'validation', 'formatter', 'api'],
    inputs: [
      {
        name: 'json',
        label: 'JSON Input',
        type: 'textarea',
        placeholder: '{"key": "value"}',
        required: true,
      },
      {
        name: 'operation',
        label: 'Operation',
        type: 'select',
        options: [
          { label: 'Validate & Format', value: 'format' },
          { label: 'Minify', value: 'minify' },
          { label: 'Validate Only', value: 'validate' },
        ],
        defaultValue: 'format',
      },
    ],
    exampleInputs: {
      json: '{"name":"John","age":30,"city":"New York"}',
      operation: 'format',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 3: NICE-TO-HAVE TOOLS (12 tools)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cidr-converter',
    name: 'CIDR Notation Converter',
    description: 'Convert between CIDR notation and subnet mask formats',
    category: 'network',
    priority: 3,
    icon: 'Network',
    subjects: ['CS-NET-S2'],
    tags: ['networking', 'cidr', 'subnet mask'],
    inputs: [
      {
        name: 'input',
        label: 'CIDR or Subnet Mask',
        type: 'text',
        placeholder: '/24 or 255.255.255.0',
        required: true,
      },
    ],
    exampleInputs: {
      input: '/24',
    },
  },
  {
    id: 'payload-generator',
    name: 'Security Payload Generator',
    description: 'Generate common security testing payloads (XSS, SQLi, Command Injection)',
    category: 'security',
    priority: 3,
    icon: 'Siren',
    subjects: ['CS-PENTEST-S2', 'CS-CTF-S2', 'CS-AISEC-S2'],
    tags: ['security', 'testing', 'payloads', 'pentesting'],
    inputs: [
      {
        name: 'type',
        label: 'Payload Type',
        type: 'select',
        required: true,
        options: [
          { label: 'XSS (Cross-Site Scripting)', value: 'xss' },
          { label: 'SQL Injection', value: 'sqli' },
          { label: 'Command Injection', value: 'cmdi' },
          { label: 'Path Traversal', value: 'lfi' },
          { label: 'XXE', value: 'xxe' },
        ],
        defaultValue: 'xss',
      },
    ],
    exampleInputs: {
      type: 'xss',
    },
  },
  {
    id: 'api-tester',
    name: 'API Request Tester',
    description: 'Test API endpoints with custom methods, headers, and body',
    category: 'web',
    priority: 3,
    icon: 'Webhook',
    subjects: ['CS-BACKEND-S2', 'CS-PENTEST-S2'],
    tags: ['api', 'http', 'testing', 'rest'],
    inputs: [
      {
        name: 'url',
        label: 'API Endpoint',
        type: 'text',
        placeholder: 'https://api.example.com/users',
        required: true,
      },
      {
        name: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'PATCH', value: 'PATCH' },
        ],
        defaultValue: 'GET',
      },
      {
        name: 'headers',
        label: 'Headers (JSON)',
        type: 'textarea',
        placeholder: '{"Content-Type": "application/json"}',
        defaultValue: '{}',
      },
      {
        name: 'body',
        label: 'Request Body',
        type: 'textarea',
        placeholder: '{"key": "value"}',
      },
    ],
    exampleInputs: {
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      headers: '{"Accept": "application/json"}',
      body: '',
    },
  },
  {
    id: 'caesar-cipher',
    name: 'Caesar Cipher',
    description: 'Encrypt and decrypt text using Caesar cipher (ROT-N)',
    category: 'ctf',
    priority: 3,
    icon: 'ShieldCheck',
    subjects: ['CS-CTF-S2', 'CS-AISEC-S2'],
    tags: ['cryptography', 'cipher', 'caesar', 'rot13'],
    inputs: [
      {
        name: 'text',
        label: 'Input Text',
        type: 'textarea',
        placeholder: 'Enter text to encrypt/decrypt...',
        required: true,
      },
      {
        name: 'shift',
        label: 'Shift Amount',
        type: 'number',
        placeholder: '13',
        required: true,
        min: 1,
        max: 25,
        defaultValue: 13,
      },
      {
        name: 'direction',
        label: 'Direction',
        type: 'select',
        options: [
          { label: 'Encrypt', value: 'encrypt' },
          { label: 'Decrypt', value: 'decrypt' },
        ],
        defaultValue: 'encrypt',
      },
    ],
    exampleInputs: {
      text: 'Hello World',
      shift: 13,
      direction: 'encrypt',
    },
  },
  {
    id: 'gdpr-lookup',
    name: 'GDPR Article Lookup',
    description: 'Search and reference GDPR articles and compliance requirements',
    category: 'privacy',
    priority: 3,
    icon: 'Scale',
    subjects: ['CS-LAW-S2', 'CS-AISEC-S2'],
    tags: ['gdpr', 'privacy', 'compliance', 'law'],
    inputs: [
      {
        name: 'query',
        label: 'Article Number or Keyword',
        type: 'text',
        placeholder: '17 or "right to erasure"',
        required: true,
      },
    ],
    exampleInputs: {
      query: '17',
    },
  },
  {
    id: 'command-reference',
    name: 'Linux Command Reference',
    description: 'Quick reference for common Linux commands with examples',
    category: 'linux',
    priority: 3,
    icon: 'Terminal',
    subjects: ['CS-LINUX-S2', 'CS-SCRIPT-S2'],
    tags: ['linux', 'commands', 'reference', 'cli'],
    inputs: [
      {
        name: 'command',
        label: 'Command Name',
        type: 'text',
        placeholder: 'ls or grep or awk',
        required: true,
      },
    ],
    exampleInputs: {
      command: 'grep',
    },
  },
  {
    id: 'color-converter',
    name: 'Color Code Converter',
    description: 'Convert between HEX, RGB, HSL color formats',
    category: 'web',
    priority: 3,
    icon: 'Palette',
    subjects: ['CS-BACKEND-S2', 'CS-SCRIPT-S2'],
    tags: ['colors', 'hex', 'rgb', 'hsl'],
    inputs: [
      {
        name: 'input',
        label: 'Color Code',
        type: 'text',
        placeholder: '#FF5733 or rgb(255,87,51)',
        required: true,
      },
    ],
    exampleInputs: {
      input: '#FF5733',
    },
  },
  {
    id: 'timestamp-converter',
    name: 'Unix Timestamp Converter',
    description: 'Convert between Unix timestamps and human-readable dates',
    category: 'scripting',
    priority: 3,
    icon: 'CalendarClock',
    subjects: ['CS-SCRIPT-S2', 'CS-BACKEND-S2', 'CS-CTF-S2'],
    tags: ['timestamp', 'date', 'time', 'unix'],
    inputs: [
      {
        name: 'input',
        label: 'Timestamp or Date',
        type: 'text',
        placeholder: '1704067200 or 2024-01-01',
        required: true,
      },
    ],
    exampleInputs: {
      input: '1704067200',
    },
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Previewer',
    description: 'Preview and render Markdown with syntax highlighting',
    category: 'scripting',
    priority: 3,
    icon: 'FileText',
    subjects: ['CS-SCRIPT-S2', 'CS-BACKEND-S2'],
    tags: ['markdown', 'preview', 'documentation'],
    inputs: [
      {
        name: 'markdown',
        label: 'Markdown Content',
        type: 'textarea',
        placeholder: '# Heading\\n\\n- Item 1\\n- Item 2',
        required: true,
      },
    ],
    exampleInputs: {
      markdown: '# Hello World\\n\\nThis is **bold** and *italic* text.\\n\\n```js\\nconsole.log("code");\\n```',
    },
  },
  {
    id: 'yaml-json-converter',
    name: 'YAML ⇄ JSON Converter',
    description: 'Convert between YAML and JSON formats',
    category: 'backend',
    priority: 3,
    icon: 'FileCode',
    subjects: ['CS-BACKEND-S2', 'CS-SCRIPT-S2', 'CS-LINUX-S2'],
    tags: ['yaml', 'json', 'converter', 'config'],
    inputs: [
      {
        name: 'input',
        label: 'Input',
        type: 'textarea',
        placeholder: 'YAML or JSON...',
        required: true,
      },
      {
        name: 'direction',
        label: 'Convert To',
        type: 'select',
        options: [
          { label: 'YAML to JSON', value: 'yaml-to-json' },
          { label: 'JSON to YAML', value: 'json-to-yaml' },
        ],
        defaultValue: 'yaml-to-json',
      },
    ],
    exampleInputs: {
      input: 'name: John\\nage: 30\\ncity: New York',
      direction: 'yaml-to-json',
    },
  },
  {
    id: 'password-generator',
    name: 'Secure Password Generator',
    description: 'Generate strong, cryptographically secure passwords',
    category: 'security',
    priority: 3,
    icon: 'KeyRound',
    subjects: ['CS-PENTEST-S2', 'CS-AISEC-S2', 'CS-LAW-S2'],
    tags: ['password', 'security', 'generator'],
    inputs: [
      {
        name: 'length',
        label: 'Password Length',
        type: 'number',
        placeholder: '16',
        required: true,
        min: 8,
        max: 128,
        defaultValue: 16,
      },
      {
        name: 'includeNumbers',
        label: 'Include Numbers',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        name: 'includeSymbols',
        label: 'Include Symbols',
        type: 'checkbox',
        defaultValue: true,
      },
      {
        name: 'includeUppercase',
        label: 'Include Uppercase',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
    exampleInputs: {
      length: 16,
      includeNumbers: true,
      includeSymbols: true,
      includeUppercase: true,
    },
  },
  {
    id: 'diff-checker',
    name: 'Text Diff Checker',
    description: 'Compare two text blocks and highlight differences',
    category: 'scripting',
    priority: 3,
    icon: 'Diff',
    subjects: ['CS-SCRIPT-S2', 'CS-BACKEND-S2', 'CS-CTF-S2'],
    tags: ['diff', 'compare', 'text', 'changes'],
    inputs: [
      {
        name: 'text1',
        label: 'Original Text',
        type: 'textarea',
        placeholder: 'Enter original text...',
        required: true,
      },
      {
        name: 'text2',
        label: 'Modified Text',
        type: 'textarea',
        placeholder: 'Enter modified text...',
        required: true,
      },
    ],
    exampleInputs: {
      text1: 'Hello World\nThis is line 2',
      text2: 'Hello Universe\nThis is line 2\nThis is line 3',
    },
  },
];

// Helper functions
export const getToolById = (id: string): Tool | undefined => {
  return TOOLS.find((tool) => tool.id === id);
};

export const getToolsByCategory = (category: ToolCategory): Tool[] => {
  return TOOLS.filter((tool) => tool.category === category);
};

export const getToolsBySubject = (subjectCode: string): Tool[] => {
  return TOOLS.filter((tool) => tool.subjects.includes(subjectCode));
};

export const getToolsByPriority = (priority: ToolPriority): Tool[] => {
  return TOOLS.filter((tool) => tool.priority === priority);
};

export const searchTools = (query: string): Tool[] => {
  const lowerQuery = query.toLowerCase();
  return TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};
