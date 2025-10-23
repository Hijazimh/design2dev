import { NextResponse } from "next/server";
import { PatchRequest } from "@/lib/schemas";
import { applyPatch } from "@/lib/applyPatch";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = PatchRequest.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid patch request", 
        details: parsed.error.format() 
      }, { status: 400 });
    }
    
    const result = applyPatch(parsed.data);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error) {
    console.error('Patch error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error applying patch'
      }, 
      { status: 500 }
    );
  }
}
