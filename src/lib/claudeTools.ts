import Anthropic from '@anthropic-ai/sdk';
import { UITree, BuildPlan } from './contracts';
import { PALETTE } from './palette';
import { codegenBuildPlan } from './codegenPlan';

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
 * Claude tools for component manipulation
 */
export const claudeTools = [
  /**
   * Tool: Update component styling
   */
  {
    name: 'update_styling',
    description: 'Update the styling of a React component (colors, spacing, layout, etc.)',
    input_schema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'What to style (e.g., "button", "card", "text", "container")'
        },
        changes: {
          type: 'object',
          description: 'Style changes to apply',
          properties: {
            backgroundColor: { type: 'string' },
            textColor: { type: 'string' },
            padding: { type: 'string' },
            margin: { type: 'string' },
            borderRadius: { type: 'string' },
            fontSize: { type: 'string' },
            fontWeight: { type: 'string' },
            width: { type: 'string' },
            height: { type: 'string' },
            display: { type: 'string' },
            flexDirection: { type: 'string' },
            justifyContent: { type: 'string' },
            alignItems: { type: 'string' },
            gap: { type: 'string' }
          }
        }
      },
      required: ['target', 'changes']
    }
  },

  /**
   * Tool: Add new elements
   */
  {
    name: 'add_element',
    description: 'Add new elements to the component (buttons, inputs, text, etc.)',
    input_schema: {
      type: 'object',
      properties: {
        elementType: {
          type: 'string',
          enum: ['button', 'input', 'textarea', 'select', 'text', 'div', 'form', 'list'],
          description: 'Type of element to add'
        },
        content: {
          type: 'string',
          description: 'Text content or placeholder for the element'
        },
        props: {
          type: 'object',
          description: 'Additional properties for the element',
          properties: {
            placeholder: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            className: { type: 'string' }
          }
        },
        position: {
          type: 'string',
          enum: ['top', 'bottom', 'after', 'before'],
          description: 'Where to add the element'
        }
      },
      required: ['elementType', 'content']
    }
  },

  /**
   * Tool: Remove elements
   */
  {
    name: 'remove_element',
    description: 'Remove elements from the component',
    input_schema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'What to remove (e.g., "button", "input", "text")'
        },
        selector: {
          type: 'string',
          description: 'More specific selector if needed'
        }
      },
      required: ['target']
    }
  },

  /**
   * Tool: Reorganize layout
   */
  {
    name: 'reorganize_layout',
    description: 'Change the layout structure (grid, flex, columns, etc.)',
    input_schema: {
      type: 'object',
      properties: {
        layoutType: {
          type: 'string',
          enum: ['flex', 'grid', 'block', 'inline'],
          description: 'New layout type'
        },
        direction: {
          type: 'string',
          enum: ['row', 'column', 'row-reverse', 'column-reverse'],
          description: 'Layout direction'
        },
        columns: {
          type: 'number',
          description: 'Number of columns for grid layout'
        },
        gap: {
          type: 'string',
          description: 'Gap between elements'
        },
        alignment: {
          type: 'object',
          properties: {
            justify: { type: 'string' },
            align: { type: 'string' }
          }
        }
      },
      required: ['layoutType']
    }
  },

  /**
   * Tool: Generate new component
   */
  {
    name: 'generate_component',
    description: 'Generate a completely new component based on description',
    input_schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description of the component to generate'
        },
        componentType: {
          type: 'string',
          enum: ['form', 'card', 'list', 'navigation', 'hero', 'footer', 'sidebar'],
          description: 'Type of component'
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific features to include'
        }
      },
      required: ['description']
    }
  },

  /**
   * Tool: Apply accessibility improvements
   */
  {
    name: 'improve_accessibility',
    description: 'Apply accessibility improvements to the component',
    input_schema: {
      type: 'object',
      properties: {
        improvements: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['aria-labels', 'semantic-html', 'focus-management', 'color-contrast', 'keyboard-navigation']
          },
          description: 'Accessibility improvements to apply'
        }
      },
      required: ['improvements']
    }
  }
];

/**
 * Enhanced Claude agent with intelligent code generation
 */
export async function chatWithClaude(
  message: string,
  currentCode: string,
  componentName: string,
  context?: {
    svgFeatures?: SvgFeature[];
    uiTree?: UITree;
    buildPlan?: BuildPlan;
  }
) {
  const systemPrompt = `You are an expert React/TypeScript developer and UI/UX specialist. You help users create, modify, and improve React components.

You can:
- Update styling and visual properties
- Add or remove elements
- Reorganize layouts
- Generate new components
- Improve accessibility
- Apply modern React patterns

Guidelines:
1. Always use modern React patterns (functional components, hooks)
2. Use TypeScript with proper types
3. Use Tailwind CSS for styling
4. Follow accessibility best practices
5. Write clean, maintainable code
6. Provide complete, working components
7. Use semantic HTML elements
8. Include proper error handling

When users ask for changes, provide the updated code in a code block.
Always explain what you're doing and why it improves the component.`;

  const userPrompt = `User request: ${message}

Current component code:
\`\`\`tsx
${currentCode || 'No component code provided'}
\`\`\`

Component name: ${componentName}

Context:
${context ? JSON.stringify(context, null, 2) : 'No additional context'}

Please help the user with their request. If they want code changes, provide the complete updated component code in a \`\`\`tsx code block.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    return {
      success: true,
      response: response.content,
      toolsUsed: [],
      textContent: response.content.filter(item => item.type === 'text')
    };

  } catch (error) {
    console.error('Claude chat error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: "I'm sorry, I encountered an error processing your request. Please try again."
    };
  }
}

/**
 * Execute tool actions on the component
 */
export function executeToolAction(
  toolName: string,
  toolInput: any,
  currentCode: string
): { success: boolean; updatedCode?: string; message: string } {
  try {
    switch (toolName) {
      case 'update_styling':
        return updateComponentStyling(toolInput, currentCode);
      
      case 'add_element':
        return addComponentElement(toolInput, currentCode);
      
      case 'remove_element':
        return removeComponentElement(toolInput, currentCode);
      
      case 'reorganize_layout':
        return reorganizeComponentLayout(toolInput, currentCode);
      
      case 'generate_component':
        return generateNewComponent(toolInput);
      
      case 'improve_accessibility':
        return improveComponentAccessibility(toolInput, currentCode);
      
      default:
        return {
          success: false,
          message: `Unknown tool: ${toolName}`
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Tool execution functions
function updateComponentStyling(input: any, currentCode: string): { success: boolean; updatedCode?: string; message: string } {
  const { target, changes } = input;
  
  // This is a simplified implementation
  // In a real system, you'd parse the AST and apply changes
  let updatedCode = currentCode;
  
  // Apply Tailwind classes based on changes
  const classUpdates: string[] = [];
  
  if (changes.backgroundColor) {
    classUpdates.push(`bg-[${changes.backgroundColor}]`);
  }
  if (changes.textColor) {
    classUpdates.push(`text-[${changes.textColor}]`);
  }
  if (changes.padding) {
    classUpdates.push(`p-[${changes.padding}]`);
  }
  if (changes.borderRadius) {
    classUpdates.push(`rounded-[${changes.borderRadius}]`);
  }
  
  // Simple string replacement for demo
  if (classUpdates.length > 0) {
    const newClasses = classUpdates.join(' ');
    updatedCode = updatedCode.replace(
      /className="([^"]*)"/g,
      (match, existingClasses) => `className="${existingClasses} ${newClasses}"`
    );
  }
  
  return {
    success: true,
    updatedCode,
    message: `Updated styling for ${target} with: ${Object.keys(changes).join(', ')}`
  };
}

function addComponentElement(input: any, currentCode: string): { success: boolean; updatedCode?: string; message: string } {
  const { elementType, content, props = {} } = input;
  
  let newElement = '';
  
  switch (elementType) {
    case 'button':
      newElement = `<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">${content}</button>`;
      break;
    case 'input':
      newElement = `<input type="text" placeholder="${content}" className="border rounded-md px-3 py-2" />`;
      break;
    case 'text':
      newElement = `<p className="text-gray-700">${content}</p>`;
      break;
    default:
      newElement = `<div className="p-2">${content}</div>`;
  }
  
  // Add the element before the closing div
  const updatedCode = currentCode.replace(
    /<\/div>\s*<\/div>\s*$/,
    `  ${newElement}\n    </div>\n  </div>`
  );
  
  return {
    success: true,
    updatedCode,
    message: `Added ${elementType}: ${content}`
  };
}

function removeComponentElement(input: any, currentCode: string): { success: boolean; updatedCode?: string; message: string } {
  const { target } = input;
  
  // Simple implementation - in reality you'd use AST parsing
  let updatedCode = currentCode;
  
  if (target === 'button') {
    updatedCode = updatedCode.replace(/<button[^>]*>.*?<\/button>/g, '');
  } else if (target === 'input') {
    updatedCode = updatedCode.replace(/<input[^>]*\/?>/g, '');
  }
  
  return {
    success: true,
    updatedCode,
    message: `Removed ${target} elements`
  };
}

function reorganizeComponentLayout(input: any, currentCode: string): { success: boolean; updatedCode?: string; message: string } {
  const { layoutType, direction, gap, columns } = input;
  
  let updatedCode = currentCode;
  const layoutClasses: string[] = [];
  
  if (layoutType === 'flex') {
    layoutClasses.push('flex');
    if (direction) layoutClasses.push(`flex-${direction}`);
  } else if (layoutType === 'grid') {
    layoutClasses.push('grid');
    if (columns) layoutClasses.push(`grid-cols-${columns}`);
  }
  
  if (gap) layoutClasses.push(`gap-${gap}`);
  
  if (layoutClasses.length > 0) {
    updatedCode = updatedCode.replace(
      /className="([^"]*)"/,
      (match, existingClasses) => `className="${existingClasses} ${layoutClasses.join(' ')}"`
    );
  }
  
  return {
    success: true,
    updatedCode,
    message: `Reorganized layout to ${layoutType}${direction ? ` (${direction})` : ''}`
  };
}

function generateNewComponent(input: any): { success: boolean; updatedCode?: string; message: string } {
  const { description, componentType } = input;
  
  // Generate a basic component based on description
  const componentCode = `import * as React from "react";

export type GeneratedComponentProps = {
  className?: string;
};

export default function GeneratedComponent({ className }: GeneratedComponentProps) {
  return (
    <div className={\`p-6 bg-white rounded-lg shadow-md \${className || ""}\`}>
      <h2 className="text-xl font-semibold mb-4">${description}</h2>
      <p className="text-gray-600">This is a ${componentType || 'component'} generated based on your description.</p>
    </div>
  );
}`;
  
  return {
    success: true,
    updatedCode: componentCode,
    message: `Generated new ${componentType || 'component'}: ${description}`
  };
}

function improveComponentAccessibility(input: any, currentCode: string): { success: boolean; updatedCode?: string; message: string } {
  const { improvements } = input;
  
  let updatedCode = currentCode;
  
  if (improvements.includes('aria-labels')) {
    updatedCode = updatedCode.replace(
      /<button([^>]*)>/g,
      '<button$1 aria-label="Button">'
    );
  }
  
  if (improvements.includes('semantic-html')) {
    updatedCode = updatedCode.replace(
      /<div([^>]*class="[^"]*text-[^"]*"[^>]*)>/g,
      '<p$1>'
    );
  }
  
  return {
    success: true,
    updatedCode,
    message: `Applied accessibility improvements: ${improvements.join(', ')}`
  };
}
