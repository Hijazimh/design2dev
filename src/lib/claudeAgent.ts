import Anthropic from '@anthropic-ai/sdk';
import { UITree, BuildPlan } from './contracts';
import { PALETTE } from './palette';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SvgFeature {
  type: string;
  attrs: Record<string, string>;
  text?: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Claude agent: Convert SVG features to semantic UI Tree
 */
export async function proposeUITree(svg: string, features: SvgFeature[]): Promise<UITree> {
  const systemPrompt = `You are a frontend expert that converts SVG designs into semantic UI structures.

Your task: Analyze SVG features and output a UI Tree JSON that represents the semantic meaning of the design.

UI Tree Schema:
- Frame: Container with layout/style properties
- Text: Text content with role (h1, h2, h3, p, span)
- Form: Form with fields (Input, Textarea, Select, Checkbox, Button)
- List: List of items
- Image: Image element
- Button: Interactive button
- Icon: Icon element

Rules:
1. Infer semantic meaning from visual elements
2. Group related elements into Frames
3. Use proper text roles (h1 for main titles, p for body text)
4. Detect forms when you see input-like elements
5. Detect buttons from rect+text combinations
6. Create accessible, semantic structure
7. Output ONLY valid JSON matching the UI Tree schema

Example:
Input: SVG with rect + text "Submit"
Output: { "type": "Frame", "children": [{ "type": "Button", "label": "Submit" }] }`;

  const userPrompt = `SVG Content:
${svg}

Extracted Features:
${JSON.stringify(features, null, 2)}

Generate a semantic UI Tree JSON:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const uiTree = JSON.parse(jsonMatch[0]);
        return uiTree as UITree;
      }
    }
    
    throw new Error('No valid JSON found in Claude response');
  } catch (error) {
    console.error('Claude UI Tree generation error:', error);
    // Fallback to simple structure
    return {
      type: 'Frame',
      children: [
        { type: 'Text', role: 'h2', content: 'SVG Component' },
        { type: 'Text', role: 'p', content: `Found ${features.length} elements` }
      ]
    };
  }
}

/**
 * Claude agent: Convert UI Tree to Build Plan using component palette
 */
export async function proposeBuildPlan(tree: UITree, paletteKeys: string[]): Promise<BuildPlan> {
  const systemPrompt = `You are a frontend expert that maps semantic UI structures to React component implementations.

Your task: Convert a UI Tree into a Build Plan using the available component palette.

Component Palette:
${Object.entries(PALETTE).map(([key, entry]) => 
  `- ${key}: ${entry.tag} (${entry.lib}) - ${entry.tailwind}`
).join('\n')}

Build Plan Schema:
- componentKey: Must be a valid palette key
- props: Component-specific properties
- tailwind: Additional Tailwind classes
- children: Nested components or text strings

Rules:
1. Use ONLY palette keys that exist
2. Map semantic elements to appropriate components
3. Preserve hierarchy and relationships
4. Add proper props for forms and inputs
5. Use semantic HTML elements
6. Output ONLY valid JSON matching the Build Plan schema

Example:
UI Tree: { "type": "Text", "role": "h1", "content": "Title" }
Build Plan: { "componentKey": "typography.h1", "children": ["Title"] }`;

  const userPrompt = `UI Tree:
${JSON.stringify(tree, null, 2)}

Available Palette Keys:
${paletteKeys.join(', ')}

Generate a Build Plan JSON:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const buildPlan = JSON.parse(jsonMatch[0]);
        return buildPlan as BuildPlan;
      }
    }
    
    throw new Error('No valid JSON found in Claude response');
  } catch (error) {
    console.error('Claude Build Plan generation error:', error);
    // Fallback to simple structure
    return {
      name: 'GeneratedComponent',
      imports: [],
      root: {
        componentKey: 'layout.card',
        children: [
          {
            componentKey: 'typography.h2',
            children: ['Generated Component']
          }
        ]
      }
    };
  }
}

/**
 * Claude agent: Generate patch operations for chat edits
 */
export async function generatePatch(
  currentCode: string,
  userRequest: string,
  componentName: string
): Promise<any> {
  const systemPrompt = `You are a frontend expert that applies precise edits to React components.

Your task: Generate patch operations to modify React code based on user requests.

Available Patch Operations:
- addClass: Add CSS class to element
- removeClass: Remove CSS class from element  
- replaceClass: Replace one CSS class with another
- setAttribute: Set element attribute
- insertAfter: Insert code after element
- textEdit: Replace text content

Rules:
1. Target elements using unique JSX substrings
2. Use minimal, precise changes
3. Preserve existing functionality
4. Output ONLY valid JSON with PatchRequest schema
5. Never rewrite entire files

Example:
User: "Make the button blue"
Patch: { "ops": [{ "op": "addClass", "file": "component.tsx", "jsx": "<button", "className": "bg-blue-500" }] }`;

  const userPrompt = `Current React Code:
${currentCode}

User Request: ${userRequest}

Generate patch operations to apply this change:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const patchRequest = JSON.parse(jsonMatch[0]);
        return patchRequest;
      }
    }
    
    throw new Error('No valid JSON found in Claude response');
  } catch (error) {
    console.error('Claude patch generation error:', error);
    // Fallback to no-op patch
    return {
      ops: []
    };
  }
}
