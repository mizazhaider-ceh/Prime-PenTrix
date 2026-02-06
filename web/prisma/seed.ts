import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Load environment variables BEFORE creating PrismaClient
dotenv.config({ path: '.env.local' });
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Create Prisma adapter and client
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const subjects = [
  {
    code: 'CS-NET-S2',
    slug: 'networks',
    name: 'Computer Networks',
    credits: 6,
    color: '#3b82f6',
    gradient: 'from-blue-500 to-blue-700',
    icon: 'fa-network-wired',
    teachers: ['Brouckxon Henk', 'Clauwaert Thomas', 'Pareit Daan', 'VandenDriessche Jill'],
    topics: [
      'OSI & TCP/IP Models',
      'IP Addressing & Subnetting',
      'Routing Protocols (RIP, OSPF, BGP)',
      'Transport Layer (TCP/UDP)',
      'Application Protocols (HTTP, DNS, DHCP)',
      'Network Security Basics',
      'Wireshark Analysis',
      'VLANs & Switching',
      'NAT & PAT',
      'Packet Analysis',
    ],
    pedagogy: 'packet-first',
    toolkit: [
      'subnet-calculator',
      'port-lookup',
      'cidr-converter',
      'protocol-diagram',
      'bandwidth-calculator',
      'dns-lookup-simulator',
    ],
    promptStyle:
      'Always explain concepts starting from the packet header structure (bits/bytes layout) before discussing high-level theory. Reference RFC documents. Use Wireshark filter examples where applicable.',
    examType: 'practical + theory',
    description:
      'Deep dive into networking protocols, packet analysis, and infrastructure design.',
  },
  {
    code: 'CS-PENTEST-S2',
    slug: 'pentesting',
    name: 'Web Pentesting Fundamentals',
    credits: 3,
    color: '#ef4444',
    gradient: 'from-red-500 to-red-700',
    icon: 'fa-bug',
    teachers: ['Audenaert Ann', 'Casier Dimitri', 'Koreman Koen'],
    topics: [
      'OWASP Top 10 (2021)',
      'SQL Injection (Union, Blind, Error-based)',
      'XSS (Reflected, Stored, DOM-based)',
      'CSRF Attacks',
      'Authentication Bypass',
      'IDOR Vulnerabilities',
      'Burp Suite Professional Usage',
      'HTTP Headers Security',
      'SSRF (Server-Side Request Forgery)',
      'File Inclusion (LFI/RFI)',
    ],
    pedagogy: 'attack-chain',
    toolkit: ['encoding-decoder', 'header-analyzer', 'payload-generator'],
    promptStyle:
      'Explain vulnerabilities using the attack chain: Reconnaissance → Exploitation → Post-Exploitation. Provide PoC examples safe for lab environments. Include mitigation strategies.',
    examType: 'practical CTF',
    description:
      'Offensive security techniques for web application testing and vulnerability discovery.',
  },
  {
    code: 'CS-BACKEND-S2',
    slug: 'backend',
    name: 'Web Backend',
    credits: 3,
    color: '#22c55e',
    gradient: 'from-green-500 to-green-700',
    icon: 'fa-server',
    teachers: ['Audenaert Ann', 'De Groef Machteld', 'Tack Joost', 'Vlummens Frédéric'],
    topics: [
      'RESTful API Design',
      'Express.js & Node.js',
      'Database Integration (SQL/NoSQL)',
      'Authentication (JWT, Sessions, OAuth)',
      'Input Validation & Sanitization',
      'Error Handling & Logging',
      'ORM/ODM (Sequelize, Mongoose)',
      'API Testing (Postman)',
      'MVC Architecture',
      'Middleware & Routing',
    ],
    pedagogy: 'code-first',
    toolkit: ['jwt-decoder', 'sql-formatter', 'php-validator', 'node-package-analyzer'],
    promptStyle:
      'Start with working code examples using Express.js syntax. Then explain the underlying concepts. Include package.json dependencies and terminal commands.',
    examType: 'project + oral',
    description: 'Server-side development with Node.js, REST APIs, and database integration.',
  },
  {
    code: 'CS-LINUX-S2',
    slug: 'linux',
    name: 'Linux for Ethical Hackers',
    credits: 6,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-amber-700',
    icon: 'fa-terminal',
    teachers: ['Roets Chris', 'Van Eeckhout Guy'],
    topics: [
      'Bash Scripting',
      'File Permissions (chmod, chown)',
      'Process Management',
      'Networking Commands (netstat, ss, ip)',
      'User Administration',
      'Systemd & Services',
      'Log Analysis (/var/log)',
      'Cron Jobs & Automation',
      'Package Management (apt, yum)',
      'Privilege Escalation Techniques',
    ],
    pedagogy: 'cli-first',
    toolkit: ['permission-calculator', 'cron-generator', 'command-builder', 'linux-cheatsheet'],
    promptStyle:
      'Provide the exact Bash command to demonstrate the concept IMMEDIATELY. Then explain each flag and option. Assume Kali Linux or Debian-based distro context.',
    examType: 'practical terminal',
    description: 'Command-line mastery and Linux administration for offensive security.',
  },
  {
    code: 'CS-CTF-S2',
    slug: 'ctf',
    name: 'Capture the Flag',
    credits: 3,
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-purple-700',
    icon: 'fa-flag',
    teachers: ['Clauwaert Thomas', 'Dewulf Mattias', 'Roets Chris', 'Singier Laurens'],
    topics: [
      'Cryptography Challenges',
      'Reverse Engineering Basics',
      'Steganography',
      'Forensics Analysis',
      'Web Exploitation',
      'Binary Exploitation Intro',
      'OSINT Techniques',
      'Privilege Escalation',
      'Miscellaneous Puzzles',
      'Writeup Documentation',
    ],
    pedagogy: 'hint-ladder',
    toolkit: ['base-converter', 'hash-identifier', 'cipher-decoder'],
    promptStyle:
      'Use a hint-ladder approach: Start with the smallest nudge. Only reveal more if explicitly asked. Teach methodology and thinking patterns, not just solutions. Reference CTF platforms like HackTheBox, TryHackMe.',
    examType: 'CTF competition',
    description:
      'Competition-style hacking challenges covering crypto, forensics, and exploitation.',
  },
  {
    code: 'CS-SCRIPT-S2',
    slug: 'scripting',
    name: 'Scripting & Code Analysis',
    credits: 6,
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-cyan-700',
    icon: 'fa-code',
    teachers: ['Baert Brian', 'Debou Arne', 'Rizvi Syed Shan', 'Tack Joost'],
    topics: [
      'Python Scripting',
      'PowerShell Scripting',
      'Bash Automation',
      'Static Code Analysis',
      'Regex Patterns',
      'API Scripting (requests, urllib)',
      'File I/O Operations',
      'Error Handling & Debugging',
      'Security Script Development',
      'Code Review Practices',
    ],
    pedagogy: 'annotated-code',
    toolkit: ['regex-tester', 'code-analyzer'],
    promptStyle:
      'Provide annotated code with inline comments explaining every significant line. Compare Python, Bash, and PowerShell approaches when relevant. Include shebang lines and execution instructions.',
    examType: 'practical + code review',
    description: 'Automation scripting and static analysis across Python, Bash, and PowerShell.',
  },
  {
    code: 'CS-LAW-S2',
    slug: 'privacy',
    name: 'Data Privacy & IT Law',
    credits: 3,
    color: '#ec4899',
    gradient: 'from-pink-500 to-pink-700',
    icon: 'fa-gavel',
    teachers: ['Witters Stephanie'],
    topics: [
      'GDPR Principles (Art. 5)',
      'Data Subject Rights (Art. 12-22)',
      'Lawful Processing Bases (Art. 6)',
      'Data Breach Procedures (Art. 33-34)',
      'DPO Responsibilities (Art. 37-39)',
      'International Transfers (Chapter V)',
      'Cookie Laws (ePrivacy)',
      'NIS2 Directive',
      'Case Law Examples',
      'Privacy by Design (Art. 25)',
    ],
    pedagogy: 'case-based',
    toolkit: ['gdpr-article-lookup', 'privacy-checklist'],
    promptStyle:
      'Reference specific GDPR articles (e.g., Art. 6, Art. 17) and real European court cases (CJEU decisions). Use scenario-based explanations for practical understanding.',
    examType: 'written exam',
    description: 'European data protection law, GDPR compliance, and IT legal frameworks.',
  },
  {
    code: 'CS-AISEC-S2',
    slug: 'aisec',
    name: 'AI x Cybersecurity',
    credits: 6,
    color: '#a855f7',
    gradient: 'from-purple-600 to-fuchsia-600',
    icon: 'fa-brain',
    teachers: ['MIHx0 (Advanced Track)'],
    topics: [
      'AI Security Fundamentals',
      'Adversarial Machine Learning',
      'Prompt Injection Attacks',
      'AI-Powered Penetration Testing',
      'LLM Security (OWASP Top 10 for LLMs)',
      'Model Poisoning & Backdoors',
      'AI Red Teaming',
      'Deepfake Detection',
      'AI-Assisted Malware Analysis',
      'Neural Network Exploitation',
      'AI Ethics & Safety',
      'Automated Vulnerability Scanning',
      'ML Model Extraction Attacks',
      'AI in Threat Intelligence',
      'Defensive AI Systems',
    ],
    pedagogy: 'research-driven',
    toolkit: ['ai-red-team', 'prompt-fuzzer', 'model-extractor', 'adversarial-gen'],
    promptStyle:
      'Blend cutting-edge research papers with practical exploitation techniques. Reference OWASP AI Security, MITRE ATLAS framework, and recent CVEs. Provide Python code for attacks and defenses. Emphasize responsible disclosure.',
    examType: 'research project + practical demo',
    description:
      'Cutting-edge intersection of AI and cybersecurity: offensive AI, defensive AI, and adversarial ML.',
  },
];

async function main() {
  console.log('🌱 Starting subject seed...');

  for (const subject of subjects) {
    const created = await prisma.subject.upsert({
      where: { slug: subject.slug },
      update: subject,
      create: subject,
    });
    console.log(`✅ Created/Updated: ${created.name} (${created.code})`);
  }

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
