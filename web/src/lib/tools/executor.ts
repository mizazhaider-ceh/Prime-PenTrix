import { ToolOutput } from '@/types/tools';
import { getToolById } from './registry';

// Priority 1 tools
import {
  calculateSubnet,
  decodeJWT,
  encodeDecodeString,
  calculatePermissions,
  convertBase,
  testRegex,
} from './priority1';

// Priority 2 tools
import { analyzeHeaders, formatSQL, identifyHash, generateCron, lookupPort, validateJSON } from './priority2';

// Priority 3 tools
import {
  convertCIDR,
  generatePayload,
  testAPI,
  caesarCipher,
  lookupGDPR,
  lookupCommand,
  convertColor,
  convertTimestamp,
  previewMarkdown,
  convertYAMLJSON,
  generatePassword,
  diffText,
} from './priority3';

// ═══════════════════════════════════════════════════════════════
// TOOL EXECUTOR - Central dispatcher for all tool executions
// ═══════════════════════════════════════════════════════════════

export async function executeTool(toolId: string, inputs: Record<string, any>): Promise<ToolOutput> {
  // Validate tool exists
  const tool = getToolById(toolId);
  if (!tool) {
    return {
      success: false,
      error: `Tool "${toolId}" not found`,
    };
  }

  // Validate required inputs
  const missingInputs = tool.inputs.filter((input) => input.required && !inputs[input.name]).map((input) => input.label);

  if (missingInputs.length > 0) {
    return {
      success: false,
      error: `Missing required inputs: ${missingInputs.join(', ')}`,
    };
  }

  // Execute the appropriate tool
  try {
    switch (toolId) {
      // ─────────────────────────────────────────────────────────
      // PRIORITY 1
      // ─────────────────────────────────────────────────────────
      case 'subnet-calculator':
        return calculateSubnet(inputs.ipAddress, inputs.cidr);

      case 'jwt-decoder':
        return decodeJWT(inputs.token);

      case 'encoder-decoder':
        return encodeDecodeString(inputs.input, inputs.operation);

      case 'permission-calculator':
        return calculatePermissions(inputs.input);

      case 'base-converter':
        return convertBase(inputs.input, inputs.fromBase);

      case 'regex-tester':
        return testRegex(inputs.pattern, inputs.testString, inputs.flags);

      // ─────────────────────────────────────────────────────────
      // PRIORITY 2
      // ─────────────────────────────────────────────────────────
      case 'header-analyzer':
        return analyzeHeaders(inputs.headers);

      case 'sql-formatter':
        return formatSQL(inputs.query);

      case 'hash-identifier':
        return identifyHash(inputs.hash);

      case 'cron-generator':
        return generateCron(inputs.minute, inputs.hour, inputs.dayOfMonth, inputs.month, inputs.dayOfWeek);

      case 'port-lookup':
        return lookupPort(inputs.query);

      case 'json-validator':
        return validateJSON(inputs.json, inputs.operation);

      // ─────────────────────────────────────────────────────────
      // PRIORITY 3
      // ─────────────────────────────────────────────────────────
      case 'cidr-converter':
        return convertCIDR(inputs.input);

      case 'payload-generator':
        return generatePayload(inputs.type);

      case 'api-tester':
        return await testAPI(inputs.url, inputs.method, inputs.headers, inputs.body);

      case 'caesar-cipher':
        return caesarCipher(inputs.text, inputs.shift, inputs.direction);

      case 'gdpr-lookup':
        return lookupGDPR(inputs.query);

      case 'command-reference':
        return lookupCommand(inputs.command);

      case 'color-converter':
        return convertColor(inputs.input);

      case 'timestamp-converter':
        return convertTimestamp(inputs.input);

      case 'markdown-preview':
        return previewMarkdown(inputs.markdown);

      case 'yaml-json-converter':
        return convertYAMLJSON(inputs.input, inputs.direction);

      case 'password-generator':
        return generatePassword(inputs.length, inputs.includeNumbers, inputs.includeSymbols, inputs.includeUppercase);

      case 'diff-checker':
        return diffText(inputs.text1, inputs.text2);

      default:
        return {
          success: false,
          error: `Tool "${toolId}" has no execution handler`,
        };
    }
  } catch (error: any) {
    console.error(`Tool execution error (${toolId}):`, error);
    return {
      success: false,
      error: error.message || 'Tool execution failed',
    };
  }
}
