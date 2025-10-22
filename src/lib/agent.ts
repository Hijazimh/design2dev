import Anthropic from '@anthropic-ai/sdk';
import { UITree, PatchRequestType } from './schemas';
import { svg_to_uiTree } from './svg';
import { uiTree_to_react } from './codegen';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  message: string;
  patches?: PatchRequestType[];
  success: boolean;
  error?: string;
}

// Tool definitions would be implemented here for future tool calling

/**
 * System prompt for the agent
 */
const SYSTEM_PROMPT = `You are a senior full-stack engineer helping users transform designs into React components. 

Your capabilities:
1. Parse SVG/design inputs into structured UI trees
2. Generate clean React components using shadcn/ui + Tailwind
3. Apply precise AST patches for design modifications
4. Wire actions (webhooks, APIs, databases) to forms
5. Ensure accessibility compliance

Guidelines:
- Always produce valid UI JSON first, then generate React code
- Use semantic HTML and proper ARIA attributes
- Apply Tailwind classes systematically (layout, spacing, colors, etc.)
- For modifications, emit minimal AST patches with clear diffs
- When wiring actions, generate proper error handling and loading states
- Always validate inputs with Zod schemas
- Ensure generated code is production-ready

When users ask for changes:
1. Understand the request clearly
2. Generate appropriate AST patches
3. Explain what changes you're making
4. Ensure the result maintains design integrity

Be helpful, precise, and always explain your reasoning.`;

/**
 * Main agent function that processes messages and calls tools
 */
export async function processAgentMessage(
  messages: AgentMessage[],
  filesManifest?: Record<string, string>
): Promise<AgentResponse> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });

    // Process the response
    const content = response.content[0];
    
    if (content.type === 'text') {
      return {
        message: content.text,
        success: true
      };
    } else if (content.type === 'tool_use') {
      // Handle tool calls
      const toolName = content.name;
      const toolInput = content.input;
      
      let toolResult: any;
      
      switch (toolName) {
        case 'svg_to_uiTree':
          // This would call the actual SVG parser
          toolResult = { success: true, tree: {} };
          break;
          
        case 'uiTree_to_react':
          // This would call the code generator
          toolResult = { success: true, code: '// Generated component' };
          break;
          
        case 'apply_ast_patch':
          // This would apply AST patches
          toolResult = { success: true, diff: '// Patch applied' };
          break;
          
        case 'wire_action':
          // This would wire actions
          toolResult = { success: true, files: [] };
          break;
          
        case 'a11y_check':
          // This would run accessibility checks
          toolResult = { success: true, violations: [] };
          break;
          
        default:
          toolResult = { success: false, error: 'Unknown tool' };
      }
      
      return {
        message: `Executed ${toolName}: ${JSON.stringify(toolResult)}`,
        success: true
      };
    }
    
    return {
      message: 'No response generated',
      success: false,
      error: 'Unexpected response type'
    };
    
  } catch (error) {
    console.error('Agent error:', error);
    return {
      message: 'Sorry, I encountered an error processing your request.',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Simple function to generate React component from SVG
 */
export async function generateFromSVG(svg: string, name: string) {
  const result = await svg_to_uiTree(svg);
  if (!result.success || !result.tree) {
    throw new Error(result.error || 'Failed to parse SVG');
  }
  const codeResult = uiTree_to_react(result.tree, name);
  if (!codeResult.success) {
    throw new Error(codeResult.error || 'Failed to generate code');
  }
  return { tree: result.tree, code: codeResult.code };
}
