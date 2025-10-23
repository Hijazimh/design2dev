import { NextResponse } from "next/server";
import { extractSvgFeatures } from "@/lib/svgFeatures";
import { codegenBuildPlan } from "@/lib/codegenPlan";
import { PALETTE } from "@/lib/palette";
import { UITree, BuildPlan } from "@/lib/contracts";
import { proposeUITree, proposeBuildPlan } from "@/lib/claudeAgent";

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
      console.log('Calling Claude to generate UI Tree...');
      try {
        tree = await proposeUITree(svg, features);
        console.log('Generated UI Tree:', tree);
      } catch (error) {
        console.error('Claude UI Tree generation failed:', error);
        // Fallback to simple structure
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
      console.log('Calling Claude to generate Build Plan...');
      try {
        const paletteKeys = Object.keys(PALETTE);
        plan = await proposeBuildPlan(tree, paletteKeys);
        plan.name = name; // Ensure correct component name
        console.log('Generated Build Plan:', plan);
      } catch (error) {
        console.error('Claude Build Plan generation failed:', error);
        // Fallback to simple structure
        plan = {
          name,
          imports: [],
          root: {
            componentKey: "layout.card",
            children: [
              {
                componentKey: "layout.stack",
                children: [
                  { componentKey: "typography.h2", children: ["Generated Component"] },
                  { componentKey: "typography.p", children: [`Found ${features.length} SVG elements`] }
                ]
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
