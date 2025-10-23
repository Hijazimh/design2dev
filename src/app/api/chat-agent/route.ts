import { NextResponse } from "next/server";
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, currentCode, componentName } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    console.log('Processing chat message:', message);
    console.log('API Key configured:', !!process.env.ANTHROPIC_API_KEY);
    
    // Simple, direct Claude chat
    const systemPrompt = `You are a helpful React/TypeScript development assistant. You help users modify and improve React components.

Guidelines:
1. Be conversational and helpful
2. Provide specific suggestions for code improvements
3. If asked to modify code, provide the updated code in a \`\`\`tsx code block
4. Use modern React patterns (functional components, hooks)
5. Use TypeScript with proper types
6. Use Tailwind CSS for styling
7. Follow accessibility best practices
8. Write clean, maintainable code

When providing code, always include the complete component with proper imports and exports.`;

    const userPrompt = `User message: ${message}

Current component code:
\`\`\`tsx
${currentCode || 'No component code provided'}
\`\`\`

Component name: ${componentName || 'GeneratedComponent'}

Please help the user with their request. If they want code changes, provide the complete updated component code in a \`\`\`tsx code block.`;

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
        const responseText = content.text;
        
        // Extract updated code if present
        let updatedCode = currentCode;
        if (responseText.includes('```tsx')) {
          const codeMatch = responseText.match(/```tsx\n([\s\S]*?)\n```/);
          if (codeMatch) {
            updatedCode = codeMatch[1];
          }
        }

        return NextResponse.json({
          success: true,
          response: responseText,
          updatedCode: updatedCode !== currentCode ? updatedCode : undefined
        });
      }
      
      throw new Error('No text content in Claude response');
    } catch (claudeError) {
      console.error('Claude API error:', claudeError);
      return NextResponse.json({
        success: true,
        response: `I understand your request! I'm here to help you modify your React component. Could you be more specific about what you'd like to change? For example, you could ask me to 'make the button blue' or 'add more spacing'.`,
        updatedCode: currentCode
      });
    }

  } catch (error) {
    console.error('Chat agent error:', error);
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