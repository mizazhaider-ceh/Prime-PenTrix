import { ToolOutput } from '@/types/tools';

// ═══════════════════════════════════════════════════════════════
// PRIORITY 2 TOOL IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// 1. HTTP Header Analyzer
// ─────────────────────────────────────────────────────────────
export function analyzeHeaders(headers: string): ToolOutput {
  try {
    const headerLines = headers.split('\n').filter((line) => line.trim());
    const headerMap: Record<string, string> = {};

    headerLines.forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        headerMap[key.trim()] = valueParts.join(':').trim();
      }
    });

    const securityHeaders = {
      'Strict-Transport-Security': 'HSTS - Forces HTTPS connections',
      'X-Frame-Options': 'Prevents clickjacking attacks',
      'X-Content-Type-Options': 'Prevents MIME-sniffing',
      'Content-Security-Policy': 'Prevents XSS and injection attacks',
      'X-XSS-Protection': 'Legacy XSS protection',
      'Referrer-Policy': 'Controls referrer information',
      'Permissions-Policy': 'Controls browser features',
    };

    const analysis = {
      headers: headerMap,
      securityHeaders: Object.entries(securityHeaders).map(([name, purpose]) => ({
        name,
        purpose,
        present: !!headerMap[name],
        value: headerMap[name] || null,
      })),
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Check for common issues
    if (!headerMap['Strict-Transport-Security']) {
      analysis.issues.push('Missing HSTS header - site vulnerable to protocol downgrade attacks');
      analysis.recommendations.push('Add: Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
    if (!headerMap['X-Frame-Options'] && !headerMap['Content-Security-Policy']?.includes('frame-ancestors')) {
      analysis.issues.push('Missing frame protection - vulnerable to clickjacking');
      analysis.recommendations.push('Add: X-Frame-Options: DENY or SAMEORIGIN');
    }
    if (!headerMap['X-Content-Type-Options']) {
      analysis.issues.push('Missing MIME-sniffing protection');
      analysis.recommendations.push('Add: X-Content-Type-Options: nosniff');
    }

    let formatted = '=== SECURITY HEADERS ===\n\n';
    analysis.securityHeaders.forEach(({ name, present, value, purpose }) => {
      formatted += `${name}: ${present ? '✓' : '✗'} ${present ? `(${value})` : ''}\n`;
      formatted += `  Purpose: ${purpose}\n\n`;
    });

    if (analysis.issues.length > 0) {
      formatted += '\n=== ISSUES ===\n';
      analysis.issues.forEach((issue) => {
        formatted += `\n⚠️  ${issue}`;
      });
      formatted += '\n\n=== RECOMMENDATIONS ===\n';
      analysis.recommendations.forEach((rec) => {
        formatted += `\n✅ ${rec}`;
      });
    } else {
      formatted += '\n✓ All security headers properly configured!';
    }

    return {
      success: true,
      result: analysis,
      formatted,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to analyze headers',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 2. SQL Formatter
// ─────────────────────────────────────────────────────────────
export function formatSQL(query: string): ToolOutput {
  try {
    // Basic SQL formatter
    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'ON',
      'AND',
      'OR',
      'ORDER BY',
      'GROUP BY',
      'HAVING',
      'LIMIT',
      'OFFSET',
      'INSERT INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE',
      'CREATE',
      'ALTER',
      'DROP',
    ];

    let formatted = query.trim();

    // Uppercase keywords
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, kw);
    });

    // Add newlines before major keywords
    formatted = formatted
      .replace(/\s+(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ORDER BY|GROUP BY|HAVING|LIMIT)/gi, '\n$1')
      .replace(/\s+(AND|OR)\s+/gi, '\n  $1 ')
      .replace(/,/g, ',\n  ')
      .trim();

    const result = {
      original: query,
      formatted,
    };

    return {
      success: true,
      result,
      formatted,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to format SQL',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Hash Identifier
// ─────────────────────────────────────────────────────────────
export function identifyHash(hash: string): ToolOutput {
  try {
    const cleanHash = hash.trim();
    const length = cleanHash.length;
    const possibilities = [];

    // Identify by length and pattern
    if (/^[a-f0-9]{32}$/i.test(cleanHash)) {
      possibilities.push({
        name: 'MD5',
        description: '128-bit hash, commonly used but cryptographically broken',
        length: 32,
        pattern: 'Hexadecimal',
        tools: 'hashcat -m 0, john --format=raw-md5',
      });
    }
    if (/^[a-f0-9]{40}$/i.test(cleanHash)) {
      possibilities.push({
        name: 'SHA-1',
        description: '160-bit hash, considered weak',
        length: 40,
        pattern: 'Hexadecimal',
        tools: 'hashcat -m 100, john --format=raw-sha1',
      });
    }
    if (/^[a-f0-9]{64}$/i.test(cleanHash)) {
      possibilities.push(
        {
          name: 'SHA-256',
          description: '256-bit hash from SHA-2 family',
          length: 64,
          pattern: 'Hexadecimal',
          tools: 'hashcat -m 1400, john --format=raw-sha256',
        },
        {
          name: 'SHA3-256',
          description: '256-bit hash from SHA-3 family',
          length: 64,
          pattern: 'Hexadecimal',
          tools: 'hashcat -m 17400',
        }
      );
    }
    if (/^[a-f0-9]{128}$/i.test(cleanHash)) {
      possibilities.push({
        name: 'SHA-512',
        description: '512-bit hash from SHA-2 family',
        length: 128,
        pattern: 'Hexadecimal',
        tools: 'hashcat -m 1700, john --format=raw-sha512',
      });
    }
    if (/^\$2[ayb]\$.{56}$/i.test(cleanHash)) {
      possibilities.push({
        name: 'bcrypt',
        description: 'Slow adaptive hash designed for passwords',
        length: 60,
        pattern: 'Format: $2a$[cost]$[salt][hash]',
        tools: 'hashcat -m 3200, john --format=bcrypt',
      });
    }
    if (/^\$6\$.{86,}$/i.test(cleanHash)) {
      possibilities.push({
        name: 'SHA-512 Crypt',
        description: 'Unix crypt using SHA-512',
        length: 'Variable (86+)',
        pattern: 'Format: $6$[salt]$[hash]',
        tools: 'hashcat -m 1800, john --format=sha512crypt',
      });
    }

    if (possibilities.length === 0) {
      return {
        success: true,
        result: { length, possibilities: [] },
        formatted: `Unknown hash type.\nLength: ${length} characters\nPattern: ${/^[a-f0-9]+$/i.test(cleanHash) ? 'Hexadecimal' : 'Mixed'}`,
      };
    }

    let formatted = `Hash Length: ${length}\n\nPossible hash types:\n\n`;
    possibilities.forEach((p, i) => {
      formatted += `${i + 1}. ${p.name}\n`;
      formatted += `   ${p.description}\n`;
      formatted += `   Pattern: ${p.pattern}\n`;
      formatted += `   Crack with: ${p.tools}\n\n`;
    });

    return {
      success: true,
      result: { hash: cleanHash, length, possibilities },
      formatted: formatted.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to identify hash',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 4. Cron Generator
// ─────────────────────────────────────────────────────────────
export function generateCron(minute: string, hour: string, dayOfMonth: string, month: string, dayOfWeek: string): ToolOutput {
  try {
    const cronExp = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

    // Explain the cron expression
    const explain = (field: string, name: string, range: string) => {
      if (field === '*') return `every ${name}`;
      if (field.includes('*/')) return `every ${field.split('*/')[1]} ${name}`;
      if (field.includes('-')) return `${name} ${field.replace('-', ' to ')}`;
      if (field.includes(',')) return `${name} ${field.split(',').join(', ')}`;
      return `${name} ${field}`;
    };

    const explanation = [
      explain(minute, 'minute', '0-59'),
      explain(hour, 'hour', '0-23'),
      explain(dayOfMonth, 'day of month', '1-31'),
      explain(month, 'month', '1-12'),
      explain(dayOfWeek, 'day of week', '0-7'),
    ].join(', ');

    const result = {
      expression: cronExp,
      explanation: `Run ${explanation}`,
      examples: [
        { cron: '0 0 * * *', desc: 'Daily at midnight' },
        { cron: '0 */2 * * *', desc: 'Every 2 hours' },
        { cron: '0 9 * * 1-5', desc: 'Weekdays at 9 AM' },
        { cron: '*/15 * * * *', desc: 'Every 15 minutes' },
      ],
    };

    const formatted = `
Cron Expression: ${cronExp}

Explanation: ${result.explanation}

Usage in crontab:
${cronExp} /path/to/command

Common Examples:
${result.examples.map((e) => `${e.cron.padEnd(15)} - ${e.desc}`).join('\n')}
    `.trim();

    return {
      success: true,
      result,
      formatted,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate cron expression',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 5. Port Lookup
// ─────────────────────────────────────────────────────────────
const COMMON_PORTS: Record<number, { service: string; protocol: string; description: string }> = {
  20: { service: 'FTP-DATA', protocol: 'TCP', description: 'File Transfer Protocol (Data)' },
  21: { service: 'FTP', protocol: 'TCP', description: 'File Transfer Protocol (Control)' },
  22: { service: 'SSH', protocol: 'TCP', description: 'Secure Shell' },
  23: { service: 'Telnet', protocol: 'TCP', description: 'Telnet remote login' },
  25: { service: 'SMTP', protocol: 'TCP', description: 'Simple Mail Transfer Protocol' },
  53: { service: 'DNS', protocol: 'TCP/UDP', description: 'Domain Name System' },
  67: { service: 'DHCP', protocol: 'UDP', description: 'DHCP Server' },
  68: { service: 'DHCP', protocol: 'UDP', description: 'DHCP Client' },
  80: { service: 'HTTP', protocol: 'TCP', description: 'Hypertext Transfer Protocol' },
  110: { service: 'POP3', protocol: 'TCP', description: 'Post Office Protocol v3' },
  143: { service: 'IMAP', protocol: 'TCP', description: 'Internet Message Access Protocol' },
  443: { service: 'HTTPS', protocol: 'TCP', description: 'HTTP Secure' },
  445: { service: 'SMB', protocol: 'TCP', description: 'Server Message Block' },
  465: { service: 'SMTPS', protocol: 'TCP', description: 'SMTP Secure' },
  587: { service: 'SMTP', protocol: 'TCP', description: 'SMTP (Submission)' },
  993: { service: 'IMAPS', protocol: 'TCP', description: 'IMAP over SSL' },
  995: { service: 'POP3S', protocol: 'TCP', description: 'POP3 over SSL' },
  1433: { service: 'MSSQL', protocol: 'TCP', description: 'Microsoft SQL Server' },
  1521: { service: 'Oracle', protocol: 'TCP', description: 'Oracle Database' },
  3306: { service: 'MySQL', protocol: 'TCP', description: 'MySQL Database' },
  3389: { service: 'RDP', protocol: 'TCP', description: 'Remote Desktop Protocol' },
  5432: { service: 'PostgreSQL', protocol: 'TCP', description: 'PostgreSQL Database' },
  5900: { service: 'VNC', protocol: 'TCP', description: 'Virtual Network Computing' },
  6379: { service: 'Redis', protocol: 'TCP', description: 'Redis Database' },
  8000: { service: 'HTTP-Alt', protocol: 'TCP', description: 'Alternative HTTP' },
  8080: { service: 'HTTP-Proxy', protocol: 'TCP', description: 'HTTP Proxy' },
  8443: { service: 'HTTPS-Alt', protocol: 'TCP', description: 'Alternative HTTPS' },
  27017: { service: 'MongoDB', protocol: 'TCP', description: 'MongoDB Database' },
};

export function lookupPort(query: string): ToolOutput {
  try {
    const cleanQuery = query.trim().toLowerCase();
    const portNum = parseInt(cleanQuery);

    let results = [];

    // Search by port number
    if (!isNaN(portNum) && COMMON_PORTS[portNum]) {
      results.push({ port: portNum, ...COMMON_PORTS[portNum] });
    }

    // Search by service name
    if (isNaN(portNum) || results.length === 0) {
      results = Object.entries(COMMON_PORTS)
        .filter(([_, info]) => info.service.toLowerCase().includes(cleanQuery) || info.description.toLowerCase().includes(cleanQuery))
        .map(([port, info]) => ({ port: parseInt(port), ...info }));
    }

    if (results.length === 0) {
      return {
        success: true,
        result: { query, results: [] },
        formatted: `No matching ports found for: ${query}`,
      };
    }

    let formatted = `Found ${results.length} result(s):\n\n`;
    results.forEach((r) => {
      formatted += `Port ${r.port}/${r.protocol} - ${r.service}\n`;
      formatted += `  ${r.description}\n\n`;
    });

    return {
      success: true,
      result: { query, results },
      formatted: formatted.trim(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to lookup port',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 6. JSON Validator
// ─────────────────────────────────────────────────────────────
export function validateJSON(json: string, operation: string = 'format'): ToolOutput {
  try {
    const parsed = JSON.parse(json);
    let result: string;

    switch (operation) {
      case 'format':
        result = JSON.stringify(parsed, null, 2);
        break;
      case 'minify':
        result = JSON.stringify(parsed);
        break;
      case 'validate':
        result = 'Valid JSON ✓';
        break;
      default:
        result = JSON.stringify(parsed, null, 2);
    }

    return {
      success: true,
      result: { parsed, output: result, operation },
      formatted: result,
      metadata: {
        valid: true,
        size: json.length,
        formatted_size: result.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Invalid JSON: ${error.message}`,
    };
  }
}
