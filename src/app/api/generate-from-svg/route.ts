import { NextResponse } from "next/server";
import { extractSvgFeatures } from "@/lib/svgFeatures";
import { codegenBuildPlan } from "@/lib/codegenPlan";
import { PALETTE } from "@/lib/palette";
import { UITree, BuildPlan } from "@/lib/contracts";

// NOTE: In production, call Claude here for propose_ui_tree & propose_build_plan.
// For now, we accept UI Tree & Build Plan from the client or stub them.

export async function POST(req: Request) {
  try {
    const { svg, name = "GeneratedComponent", uiTree, buildPlan } = await req.json();
    
    if (!svg) {
      return NextResponse.json({ error: "Missing svg" }, { status: 400 });
    }

    console.log('Extracting SVG features...');
    const features = await extractSvgFeatures(svg);
    console.log('Extracted features:', features);

    let tree = uiTree;
    if (!tree) {
      // TODO: call Claude with system prompt and features to return a UITree
      // For MVP, create a trivial tree based on features
      const hasText = features.some(f => f.text);
      const hasRects = features.some(f => f.type === 'rect');
      const hasButtons = features.some(f => f.type === 'rect' && f.text);
      
      if (hasButtons) {
        tree = {
          type: "Frame",
          children: [
            { type: "Text", role: "h2", content: "Interactive Component" },
            {
              type: "Form",
              name: "mainForm",
              fields: features
                .filter(f => f.text && f.type === 'rect')
                .map((f, i) => ({
                  name: `field${i}`,
                  component: "Button" as const,
                  label: f.text || `Button ${i + 1}`
                }))
            }
          ]
        };
      } else if (hasText) {
        tree = {
          type: "Frame",
          children: features
            .filter(f => f.text)
            .map(f => ({
              type: "Text" as const,
              role: "p" as const,
              content: f.text || "Text"
            }))
        };
      } else {
        tree = {
          type: "Frame",
          children: [
            { type: "Text", role: "h2", content: "SVG Component" },
            { type: "Text", role: "p", content: `Found ${features.length} elements` }
          ]
        };
      }
    }

    let plan = buildPlan;
    if (!plan) {
      // TODO: call Claude to map tree -> plan
      // For MVP, create a basic plan
      const paletteKeys = Object.keys(PALETTE);
      
      if (tree.children.some((c: any) => c.type === "Form")) {
        plan = {
          name,
          imports: [],
          root: {
            componentKey: "layout.card",
            children: [
              {
                componentKey: "layout.stack",
                children: [
                  { componentKey: "typography.h2", children: ["Form Component"] },
                  {
                    componentKey: "layout.stack",
                    children: [
                      { componentKey: "form.input", props: { name: "title", placeholder: "Title" } },
                      { componentKey: "form.textarea", props: { name: "description", placeholder: "Description" } },
                      { componentKey: "form.button", props: { type: "submit" }, children: ["Submit"] }
                    ]
                  }
                ]
              }
            ]
          }
        } as BuildPlan;
      } else {
        plan = {
          name,
          imports: [],
          root: {
            componentKey: "layout.card",
            children: [
              {
                componentKey: "layout.stack",
                children: tree.children.map((child: any) => {
                  if (child.type === "Text") {
                    const role = child.role || "p";
                    const componentKey = role === "h1" ? "typography.h1" :
                                      role === "h2" ? "typography.h2" :
                                      role === "h3" ? "typography.h3" :
                                      "typography.p";
                    return {
                      componentKey,
                      children: [child.content]
                    };
                  }
                  return {
                    componentKey: "typography.p",
                    children: ["Unknown element"]
                  };
                })
              }
            ]
          }
        } as BuildPlan;
      }
    }

    console.log('Generating code from build plan...');
    const out = codegenBuildPlan(plan);
    
    return NextResponse.json({ 
      success: true,
      features, 
      tree, 
      plan, 
      ...out 
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
