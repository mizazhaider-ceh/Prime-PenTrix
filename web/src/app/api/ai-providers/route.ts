import { NextResponse } from 'next/server';

/** Returns which AI providers have valid (non-placeholder) API keys configured. */
export async function GET() {
  const isValidKey = (key: string | undefined): boolean => {
    if (!key) return false;
    const lower = key.toLowerCase().trim();
    return (
      !lower.includes('your') &&
      !lower.includes('here') &&
      !lower.includes('placeholder') &&
      !lower.includes('xxx') &&
      lower.length > 10
    );
  };

  return NextResponse.json({
    providers: {
      cerebras: isValidKey(process.env.CEREBRAS_API_KEY),
      gemini: isValidKey(process.env.GOOGLE_GEMINI_API_KEY),
      openai: isValidKey(process.env.OPENAI_CHAT_API_KEY),
    },
  });
}
