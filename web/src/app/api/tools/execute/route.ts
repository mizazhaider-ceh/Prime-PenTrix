import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeTool } from '@/lib/tools/executor';
import { getToolById } from '@/lib/tools/registry';

// ═══════════════════════════════════════════════════════════════
// TOOL EXECUTION API ROUTE
// POST /api/tools/execute
// ═══════════════════════════════════════════════════════════════

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { toolId, inputs, subjectId } = body;

    if (!toolId) {
      return NextResponse.json({ error: 'Missing toolId in request body' }, { status: 400 });
    }

    // Validate tool exists
    const tool = getToolById(toolId);
    if (!tool) {
      return NextResponse.json({ error: `Tool "${toolId}" not found` }, { status: 404 });
    }

    // Execute the tool
    const result = await executeTool(toolId, inputs || {});

    // Log execution to ToolHistory for analytics dashboard
    if (subjectId) {
      try {
        await prisma.toolHistory.create({
          data: {
            toolId,
            toolCategory: tool.category,
            inputData: inputs || {},
            outputData: result as any,
            userId: user.id,
            subjectId,
          },
        });

        // Update global stats tool count
        await prisma.globalStats.upsert({
          where: { userId: user.id },
          update: { totalToolUses: { increment: 1 } },
          create: { userId: user.id, totalToolUses: 1 },
        });
      } catch (logError) {
        // Logging failure should not break tool execution
        console.warn('Tool history logging failed (non-blocking):', logError);
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Tool API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// GET TOOL INFO
// GET /api/tools/execute?toolId=subnet-calculator
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');

    if (!toolId) {
      return NextResponse.json({ error: 'Missing toolId parameter' }, { status: 400 });
    }

    const tool = getToolById(toolId);
    if (!tool) {
      return NextResponse.json({ error: `Tool "${toolId}" not found` }, { status: 404 });
    }

    return NextResponse.json(tool, { status: 200 });
  } catch (error: any) {
    console.error('Tool info API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
