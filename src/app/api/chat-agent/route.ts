import { NextResponse } from "next/server";
import { chatWithClaude, executeToolAction } from "@/lib/claudeTools";

export async function POST(req: Request) {
  try {
    const { message, currentCode, componentName, context } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    console.log('Processing chat message with Claude tools:', message);
    
    // Use enhanced Claude with tool calling
    const claudeResponse = await chatWithClaude(
      message,
      currentCode || '',
      componentName || 'GeneratedComponent',
      context
    );

    if (!claudeResponse.success) {
      return NextResponse.json({
        success: false,
        response: claudeResponse.error || 'Failed to process request',
        updatedCode: currentCode
      });
    }

    let updatedCode = currentCode;
    let toolResults: string[] = [];
    let finalResponse = '';

    // Process Claude's response
    if (claudeResponse.textContent) {
      for (const content of claudeResponse.textContent) {
        if (content.type === 'text') {
          finalResponse += content.text;
        }
      }
    }

    // Extract updated code from Claude's response if it contains a code block
    if (finalResponse.includes('```tsx')) {
      const codeMatch = finalResponse.match(/```tsx\n([\s\S]*?)\n```/);
      if (codeMatch) {
        updatedCode = codeMatch[1];
        toolResults.push('Updated component code based on your request');
      }
    }

    return NextResponse.json({
      success: true,
      response: finalResponse,
      updatedCode: updatedCode !== currentCode ? updatedCode : undefined,
      toolsUsed: claudeResponse.toolsUsed?.length || 0,
      actions: toolResults
    });

  } catch (error) {
    console.error('Enhanced chat agent error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing chat message',
        response: "I'm sorry, I encountered an error processing your request. Please try again."
      }, 
      { status: 500 }
    );
  }
}
