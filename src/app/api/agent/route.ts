import { NextRequest, NextResponse } from 'next/server';
import { processAgentMessage, AgentMessage, generateFromSVG } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, svg, name, messages, filesManifest } = body;

    // Handle simple SVG generation mode
    if (mode === 'svg') {
      if (!svg || !name) {
        return NextResponse.json(
          { error: 'SVG and name are required for svg mode' },
          { status: 400 }
        );
      }
      const result = await generateFromSVG(svg, name);
      return NextResponse.json(result);
    }

    // Handle agent conversation mode
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Validate message format
    const agentMessages: AgentMessage[] = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Process the message with the agent
    const response = await processAgentMessage(agentMessages, filesManifest);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Sorry, I encountered an error processing your request.',
        success: false
      },
      { status: 500 }
    );
  }
}
