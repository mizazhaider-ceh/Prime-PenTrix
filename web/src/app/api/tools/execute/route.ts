import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { executeTool } from '@/lib/tools/executor';
import { getToolById } from '@/lib/tools/registry';

// ═══════════════════════════════════════════════════════════════
// TOOL EXECUTION API ROUTE
// POST /api/tools/execute
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { toolId, inputs } = body;

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

    // Log execution (optional - can save to database for analytics)
    // await prisma.toolExecution.create({
    //   data: {
    //     toolId,
    //     userId,
    //     inputs,
    //     output: result,
    //   },
    // });

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
}

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
