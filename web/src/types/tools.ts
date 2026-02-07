// ═══════════════════════════════════════════════════════════════
// TOOL SYSTEM TYPES - Phase 4
// ═══════════════════════════════════════════════════════════════

export type ToolCategory =
  | 'network'
  | 'security'
  | 'web'
  | 'linux'
  | 'scripting'
  | 'privacy'
  | 'ctf'
  | 'backend';

export type ToolPriority = 1 | 2 | 3;

export interface ToolInputField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox';
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  defaultValue?: string | number | boolean;
  required?: boolean;
  min?: number;
  max?: number;
  validation?: string; // regex pattern
  helperText?: string;
}

export interface ToolOutput {
  success: boolean;
  result?: any;
  error?: string;
  formatted?: string; // Pre-formatted display string
  metadata?: Record<string, any>;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  priority: ToolPriority;
  icon: string; // lucide icon name
  inputs: ToolInputField[];
  exampleInputs?: Record<string, any>;
  subjects: string[]; // Subject codes this tool is relevant to
  tags: string[];
}

export interface ToolExecution {
  id: string;
  toolId: string;
  userId: string;
  subjectId: string;
  inputs: Record<string, any>;
  output: ToolOutput;
  executedAt: Date | string;
}

// Tool Registry - All 24 tools
export const TOOL_CATEGORIES: Record<ToolCategory, { name: string; icon: string; color: string }> = {
  network: { name: 'Networking', icon: 'Network', color: '#3b82f6' },
  security: { name: 'Security', icon: 'Shield', color: '#ef4444' },
  web: { name: 'Web Development', icon: 'Globe', color: '#10b981' },
  linux: { name: 'Linux/Unix', icon: 'Terminal', color: '#f59e0b' },
  scripting: { name: 'Scripting', icon: 'Code', color: '#8b5cf6' },
  privacy: { name: 'Privacy & Law', icon: 'Lock', color: '#ec4899' },
  ctf: { name: 'CTF & Crypto', icon: 'Flag', color: '#14b8a6' },
  backend: { name: 'Backend Dev', icon: 'Database', color: '#06b6d4' },
};

// Subject to Category Mapping
export const SUBJECT_TOOL_CATEGORIES: Record<string, ToolCategory[]> = {
  'CS-NET-S2': ['network', 'security'],
  'CS-PENTEST-S2': ['security', 'ctf', 'network'],
  'CS-BACKEND-S2': ['backend', 'web', 'scripting'],
  'CS-LINUX-S2': ['linux', 'scripting', 'security'],
  'CS-CTF-S2': ['ctf', 'security', 'scripting'],
  'CS-SCRIPT-S2': ['scripting', 'backend', 'linux'],
  'CS-LAW-S2': ['privacy', 'security'],
  'CS-AISEC-S2': ['security', 'scripting', 'ctf'],
};
