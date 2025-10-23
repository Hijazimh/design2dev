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
    
    // Create a simple chat response using Claude
    const systemPrompt = `You are a helpful frontend development assistant. You help users modify React components by providing suggestions and updated code.

Your task: Respond to user requests about modifying React components with helpful suggestions and code changes.

Rules:
1. Be conversational and helpful
2. Provide specific suggestions for code improvements
3. If asked to modify code, provide the updated code in a code block
4. Focus on React, TypeScript, and Tailwind CSS
5. Be encouraging and supportive
6. Always wrap code in \`\`\`tsx code blocks
7. Provide complete, working React components
8. Use modern React patterns (functional components, hooks)
9. Include proper TypeScript types
10. Use Tailwind CSS for styling

Example responses:
- "I'll help you make that button blue! Here's the updated code..."
- "Great idea! Let me suggest a grid layout for better organization..."
- "I can help you add more spacing. Here's how to improve the component..."

When providing code, always include the complete component with proper imports and exports.`;

    const userPrompt = `User message: ${message}

Current component code:
${currentCode || 'No component code provided'}

Component name: ${componentName || 'GeneratedComponent'}

Please respond helpfully to the user's request. If they want code changes, provide the updated code. If they have questions, answer them helpfully.`;

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
        return NextResponse.json({
          success: true,
          response: content.text,
          suggestions: []
        });
      }
      
      throw new Error('No text content in Claude response');
    } catch (claudeError) {
      console.error('Claude API error:', claudeError);
      return NextResponse.json({
        success: true,
        response: "I understand your request! I'm here to help you modify your React component. Could you be more specific about what you'd like to change? For example, you could ask me to 'make the button blue' or 'add more spacing'.",
        suggestions: []
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
