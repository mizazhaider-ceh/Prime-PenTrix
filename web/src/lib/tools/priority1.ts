import { ToolOutput } from '@/types/tools';

// ═══════════════════════════════════════════════════════════════
// PRIORITY 1 TOOL IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// 1. Subnet Calculator
// ─────────────────────────────────────────────────────────────
export function calculateSubnet(ipAddress: string, cidr: number): ToolOutput {
  try {
    const ip = ipAddress.split('.').map(Number);
    if (ip.length !== 4 || ip.some((octet) => octet < 0 || octet > 255)) {
      throw new Error('Invalid IP address');
    }
    if (cidr < 1 || cidr > 32) {
      throw new Error('CIDR must be between 1 and 32');
    }

    // Calculate subnet mask
    const mask = Array(4).fill(0);
    for (let i = 0; i < cidr; i++) {
      mask[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
    }

    // Calculate network address
    const network = ip.map((octet, i) => octet & mask[i]);

    // Calculate broadcast address
    const broadcast = network.map((octet, i) => octet | (~mask[i] & 255));

    // Calculate first and last usable IPs
    const firstUsable = [...network];
    firstUsable[3] += 1;
    const lastUsable = [...broadcast];
    lastUsable[3] -= 1;

    // Calculate total hosts
    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = totalHosts - 2;

    const result = {
      networkAddress: network.join('.'),
      broadcastAddress: broadcast.join('.'),
      subnetMask: mask.join('.'),
      cidr: `/${cidr}`,
      firstUsable: firstUsable.join('.'),
      lastUsable: lastUsable.join('.'),
      totalHosts,
      usableHosts: cidr === 31 || cidr === 32 ? totalHosts : usableHosts,
      wildcardMask: mask.map((octet) => 255 - octet).join('.'),
    };

    return {
      success: true,
      result,
      formatted: `
Network Address: ${result.networkAddress}/${cidr}
Subnet Mask: ${result.subnetMask}
Wildcard Mask: ${result.wildcardMask}
Broadcast: ${result.broadcastAddress}

First Usable: ${result.firstUsable}
Last Usable: ${result.lastUsable}

Total Hosts: ${result.totalHosts.toLocaleString()}
Usable Hosts: ${result.usableHosts.toLocaleString()}
      `.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to calculate subnet',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 2. JWT Decoder
// ─────────────────────────────────────────────────────────────
export function decodeJWT(token: string): ToolOutput {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format (must have 3 parts)');
    }

    const [headerB64, payloadB64, signature] = parts;

    // Decode Base64URL
    const base64UrlDecode = (str: string) => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      return Buffer.from(base64 + padding, 'base64').toString('utf-8');
    };

    const header = JSON.parse(base64UrlDecode(headerB64));
    const payload = JSON.parse(base64UrlDecode(payloadB64));

    // Decode timestamps
    const decodeTimestamp = (ts: number) => {
      const date = new Date(ts * 1000);
      return {
        timestamp: ts,
        date: date.toISOString(),
        human: date.toLocaleString(),
      };
    };

    const decodedPayload = { ...payload };
    if (payload.exp) decodedPayload.exp = decodeTimestamp(payload.exp);
    if (payload.iat) decodedPayload.iat = decodeTimestamp(payload.iat);
    if (payload.nbf) decodedPayload.nbf = decodeTimestamp(payload.nbf);

    const result = {
      header,
      payload: decodedPayload,
      signature: signature.substring(0, 20) + '...',
      algorithm: header.alg,
      type: header.typ,
    };

    return {
      success: true,
      result,
      formatted: `
HEADER:
${JSON.stringify(header, null, 2)}

PAYLOAD:
${JSON.stringify(decodedPayload, null, 2)}

SIGNATURE: ${signature.substring(0, 40)}...
      `.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to decode JWT',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Encoder/Decoder
// ─────────────────────────────────────────────────────────────
export function encodeDecodeString(input: string, operation: string): ToolOutput {
  try {
    let result: string;

    switch (operation) {
      case 'url-encode':
        result = encodeURIComponent(input);
        break;
      case 'url-decode':
        result = decodeURIComponent(input);
        break;
      case 'base64-encode':
        result = Buffer.from(input, 'utf-8').toString('base64');
        break;
      case 'base64-decode':
        result = Buffer.from(input, 'base64').toString('utf-8');
        break;
      case 'html-encode':
        result = input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        break;
      case 'html-decode':
        result = input
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        break;
      case 'hex-encode':
        result = Buffer.from(input, 'utf-8').toString('hex');
        break;
      case 'hex-decode':
        result = Buffer.from(input, 'hex').toString('utf-8');
        break;
      default:
        throw new Error('Unknown operation');
    }

    return {
      success: true,
      result: { output: result, operation },
      formatted: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Encoding/decoding failed',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 4. Unix Permission Calculator
// ─────────────────────────────────────────────────────────────
export function calculatePermissions(input: string): ToolOutput {
  try {
    input = input.trim();
    let octal: string;
    let symbolic: string;

    // Check if input is octal (3-4 digits)
    if (/^[0-7]{3,4}$/.test(input)) {
      octal = input.padStart(4, '0');
      // Convert octal to symbolic
      const perms = input.slice(-3).split('').map(Number);
      const toSymbolic = (n: number) => {
        const r = n & 4 ? 'r' : '-';
        const w = n & 2 ? 'w' : '-';
        const x = n & 1 ? 'x' : '-';
        return r + w + x;
      };
      symbolic = perms.map(toSymbolic).join('');
    }
    // Check if input is symbolic (rwxrwxrwx or -rwxrwxrwx)
    else if (/^-?[rwx-]{9}$/.test(input)) {
      symbolic = input.replace(/^-/, '').replace(/[^rwx]/g, '-');
      // Convert symbolic to octal
      const chunks = [symbolic.slice(0, 3), symbolic.slice(3, 6), symbolic.slice(6, 9)];
      const toOctal = (chunk: string) => {
        let val = 0;
        if (chunk[0] === 'r') val += 4;
        if (chunk[1] === 'w') val += 2;
        if (chunk[2] === 'x') val += 1;
        return val;
      };
      octal = '0' + chunks.map(toOctal).join('');
    } else {
      throw new Error('Invalid permission format');
    }

    // Parse permissions
    const numeric = parseInt(octal.slice(-3), 10);
    const owner = Math.floor(numeric / 100);
    const group = Math.floor((numeric % 100) / 10);
    const others = numeric % 10;

    const explain = (n: number) => {
      const perms = [];
      if (n & 4) perms.push('read');
      if (n & 2) perms.push('write');
      if (n & 1) perms.push('execute');
      return perms.length ? perms.join(', ') : 'none';
    };

    const result = {
      octal,
      symbolic,
      owner: { value: owner, permissions: explain(owner) },
      group: { value: group, permissions: explain(group) },
      others: { value: others, permissions: explain(others) },
    };

    return {
      success: true,
      result,
      formatted: `
Octal: ${octal}
Symbolic: ${symbolic}

Owner (${owner}): ${result.owner.permissions}
Group (${group}): ${result.group.permissions}
Others (${others}): ${result.others.permissions}

Command: chmod ${octal.slice(-3)} <file>
      `.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to calculate permissions',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 5. Base Converter
// ─────────────────────────────────────────────────────────────
export function convertBase(input: string, fromBase: number): ToolOutput {
  try {
    // Parse input based on prefix if present
    let cleanInput = input.trim();
    let detectedBase = fromBase;

    if (cleanInput.startsWith('0x')) {
      cleanInput = cleanInput.slice(2);
      detectedBase = 16;
    } else if (cleanInput.startsWith('0b')) {
      cleanInput = cleanInput.slice(2);
      detectedBase = 2;
    } else if (cleanInput.startsWith('0o')) {
      cleanInput = cleanInput.slice(2);
      detectedBase = 8;
    }

    const decimal = parseInt(cleanInput, detectedBase);
    if (isNaN(decimal)) {
      throw new Error('Invalid number for specified base');
    }

    const result = {
      decimal: decimal.toString(10),
      binary: decimal.toString(2),
      octal: decimal.toString(8),
      hexadecimal: decimal.toString(16).toUpperCase(),
      input: input,
      fromBase: detectedBase,
    };

    return {
      success: true,
      result,
      formatted: `
Binary:      ${result.binary} (0b${result.binary})
Octal:       ${result.octal} (0o${result.octal})
Decimal:     ${result.decimal}
Hexadecimal: ${result.hexadecimal} (0x${result.hexadecimal})
      `.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to convert base',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 6. Regex Tester
// ─────────────────────────────────────────────────────────────
export function testRegex(pattern: string, testString: string, flags: string = 'g'): ToolOutput {
  try {
    const regex = new RegExp(pattern, flags);
    const matches = [...testString.matchAll(regex)];

    const result = {
      matches: matches.map((m, i) => ({
        index: i + 1,
        match: m[0],
        position: m.index,
        groups: m.slice(1),
      })),
      totalMatches: matches.length,
      isValid: matches.length > 0,
      pattern,
      flags,
    };

    let formatted = `Pattern: /${pattern}/${flags}\n\n`;
    if (matches.length === 0) {
      formatted += 'No matches found.';
    } else {
      formatted += `Found ${matches.length} match(es):\n\n`;
      formatted += matches
        .map((m, i) => {
          let str = `Match ${i + 1} at position ${m.index}: "${m[0]}"`;
          if (m.length > 1) {
            str += `\n  Groups: [${m.slice(1).join(', ')}]`;
          }
          return str;
        })
        .join('\n\n');
    }

    return {
      success: true,
      result,
      formatted,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Invalid regex pattern',
    };
  }
}
