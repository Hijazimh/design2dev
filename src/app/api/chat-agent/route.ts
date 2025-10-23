import { NextResponse } from "next/server";
import { generatePatch } from "@/lib/claudeAgent";
import { applyPatch } from "@/lib/applyPatch";
import { PatchRequest } from "@/lib/contracts";

export async function POST(req: Request) {
  try {
    const { message, currentCode, componentName } = await req.json();
    
    if (!message || !currentCode) {
      return NextResponse.json({ error: "Missing message or currentCode" }, { status: 400 });
    }

    console.log('Processing chat message:', message);
    
    // Generate patch operations using Claude
    const patchRequest = await generatePatch(currentCode, message, componentName);
    
    if (!patchRequest.ops || patchRequest.ops.length === 0) {
      return NextResponse.json({
        success: true,
        response: "I understand your request, but I couldn't generate any specific changes. Could you be more specific about what you'd like to modify?",
        patches: []
      });
    }

    // Apply the patches
    const result = applyPatch(patchRequest);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        response: `I've applied ${result.diffs.length} changes to your component. The modifications include: ${result.diffs.join(', ')}`,
        patches: result.diffs,
        errors: result.errors
      });
    } else {
      return NextResponse.json({
        success: false,
        response: `I encountered errors while applying the changes: ${result.errors.join(', ')}`,
        errors: result.errors
      });
    }

  } catch (error) {
    console.error('Chat agent error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing chat message'
      }, 
      { status: 500 }
    );
  }
}
