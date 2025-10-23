import { NextResponse } from "next/server";
import { svgToUITree } from "@/lib/semantic-svg";
import { uiTreeToReact } from "@/lib/semantic-codegen";

export async function POST(req: Request) {
  try {
    const { svg, name = "GeneratedComponent" } = await req.json();
    
    if (!svg || typeof svg !== "string") {
      return NextResponse.json({ error: "Missing svg" }, { status: 400 });
    }

    // Convert SVG to semantic UI tree
    const tree = await svgToUITree(svg);
    
    // Convert UI tree to React code
    const code = uiTreeToReact(tree, name);
    
    return NextResponse.json({
      success: true,
      tree,
      code,
      name
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating component'
      }, 
      { status: 500 }
    );
  }
}
