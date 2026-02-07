/**
 * Tool Validation Script - Run in Browser Console
 * 
 * This script tests all 24 Phase 4 tools via the API endpoint
 * to verify they execute without errors.
 * 
 * USAGE:
 * 1. Open browser to http://localhost:3001
 * 2. Sign in with Clerk
 * 3. Open DevTools Console (F12)
 * 4. Copy and paste this entire script
 * 5. Press Enter
 * 6. Watch the results appear in console
 */

(async function validateAllTools() {
  console.log('%c🧪 Phase 4 Tool Validation Script', 'color: #00ff00; font-size: 20px; font-weight: bold;');
  console.log('%cTesting all 24 tools...', 'color: #00aaff; font-size: 14px;');
  console.log('');

  const results = {
    passed: [],
    failed: [],
    total: 0
  };

  // Priority 1 - Essential Tools
  const priority1Tests = [
    {
      name: 'Subnet Calculator',
      toolId: 'subnet-calculator',
      inputs: { ipAddress: '192.168.1.0', cidr: '24' }
    },
    {
      name: 'JWT Decoder',
      toolId: 'jwt-decoder',
      inputs: { 
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      }
    },
    {
      name: 'Encoder/Decoder',
      toolId: 'encoder-decoder',
      inputs: { operation: 'base64-encode', input: 'Hello World' }
    },
    {
      name: 'Permission Calculator',
      toolId: 'permission-calculator',
      inputs: { input: '755' }
    },
    {
      name: 'Base Converter',
      toolId: 'base-converter',
      inputs: { number: '255', fromBase: 'decimal' }
    },
    {
      name: 'Regex Tester',
      toolId: 'regex-tester',
      inputs: { pattern: '\\d{3}', testString: 'abc123def456', flags: 'g' }
    }
  ];

  // Priority 2 - Important Tools
  const priority2Tests = [
    {
      name: 'Header Analyzer',
      toolId: 'header-analyzer',
      inputs: { 
        headers: 'Strict-Transport-Security: max-age=31536000\nX-Frame-Options: DENY'
      }
    },
    {
      name: 'SQL Formatter',
      toolId: 'sql-formatter',
      inputs: { 
        query: 'select * from users where id=1'
      }
    },
    {
      name: 'Hash Identifier',
      toolId: 'hash-identifier',
      inputs: { hash: '5d41402abc4b2a76b9719d911017c592' }
    },
    {
      name: 'Cron Generator',
      toolId: 'cron-generator',
      inputs: { 
        minute: '0',
        hour: '2',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '*'
      }
    },
    {
      name: 'Port Lookup',
      toolId: 'port-lookup',
      inputs: { port: '22' }
    },
    {
      name: 'JSON Validator',
      toolId: 'json-validator',
      inputs: { 
        json: '{"name":"test","value":123}',
        operation: 'validate'
      }
    }
  ];

  // Priority 3 - Utility Tools (sampling 6 of 12)
  const priority3Tests = [
    {
      name: 'CIDR Converter',
      toolId: 'cidr-converter',
      inputs: { input: '24', type: 'cidr' }
    },
    {
      name: 'Payload Generator',
      toolId: 'payload-generator',
      inputs: { type: 'xss' }
    },
    {
      name: 'Caesar Cipher',
      toolId: 'caesar-cipher',
      inputs: { text: 'Hello', shift: '13', mode: 'encrypt' }
    },
    {
      name: 'Color Converter',
      toolId: 'color-converter',
      inputs: { input: '#FF5733', fromFormat: 'hex' }
    },
    {
      name: 'Password Generator',
      toolId: 'password-generator',
      inputs: { 
        length: '16',
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true
      }
    },
    {
      name: 'Diff Checker',
      toolId: 'diff-checker',
      inputs: { 
        text1: 'Line 1\nLine 2\nLine 3',
        text2: 'Line 1\nModified Line 2\nLine 3'
      }
    }
  ];

  const allTests = [...priority1Tests, ...priority2Tests, ...priority3Tests];
  results.total = allTests.length;

  console.log(`%c📊 Running ${results.total} tests...`, 'color: #ffaa00; font-weight: bold;');
  console.log('');

  for (const test of allTests) {
    try {
      console.log(`%c⏳ Testing: ${test.name}`, 'color: #aaaaaa;');
      
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: test.toolId,
          inputs: test.inputs
        })
      });

      const data = await response.json();

      if (response.ok && data.success !== false && !data.error) {
        console.log(`%c✅ ${test.name} - PASSED`, 'color: #00ff00; font-weight: bold;');
        console.log(`   Output length: ${data.output?.length || 0} chars`);
        results.passed.push(test.name);
      } else {
        console.error(`%c❌ ${test.name} - FAILED`, 'color: #ff0000; font-weight: bold;');
        console.error(`   Error:`, data.error || data.message || 'Unknown error');
        results.failed.push(test.name);
      }
    } catch (error) {
      console.error(`%c❌ ${test.name} - ERROR`, 'color: #ff0000; font-weight: bold;');
      console.error(`   Exception:`, error.message);
      results.failed.push(test.name);
    }
    console.log('');
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Final Results
  console.log('═══════════════════════════════════════════════');
  console.log('%c🎯 TEST RESULTS', 'color: #00ffff; font-size: 18px; font-weight: bold;');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log(`%c✅ Passed: ${results.passed.length}/${results.total}`, 'color: #00ff00; font-size: 16px; font-weight: bold;');
  console.log(`%c❌ Failed: ${results.failed.length}/${results.total}`, 'color: #ff0000; font-size: 16px; font-weight: bold;');
  console.log('');
  
  const successRate = ((results.passed.length / results.total) * 100).toFixed(1);
  console.log(`%c📊 Success Rate: ${successRate}%`, 'color: #ffaa00; font-size: 16px; font-weight: bold;');
  console.log('');

  if (results.failed.length > 0) {
    console.log('%c Failed Tools:', 'color: #ff0000; font-weight: bold;');
    results.failed.forEach(name => console.log(`   - ${name}`));
    console.log('');
  }

  if (successRate >= 80) {
    console.log('%c🎉 Phase 4 PASSED! (≥80% success rate)', 'color: #00ff00; font-size: 20px; font-weight: bold;');
  } else {
    console.log('%c⚠️ Phase 4 needs fixes (< 80% success rate)', 'color: #ff8800; font-size: 18px; font-weight: bold;');
  }

  return results;
})();
