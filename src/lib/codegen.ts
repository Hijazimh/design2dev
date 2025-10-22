import { UITreeType, UINodeType, LayoutType, StyleType, ActionDSLType } from './schemas';

export interface CodegenResult {
  filePath: string;
  code: string;
  success: boolean;
  error?: string;
}

/**
 * Converts layout properties to Tailwind classes
 */
function layoutToTailwind(layout: Partial<LayoutType>): string[] {
  const classes: string[] = [];
  
  if (layout.display === 'flex') {
    classes.push('flex');
    if (layout.direction === 'column') {
      classes.push('flex-col');
    } else if (layout.direction === 'row') {
      classes.push('flex-row');
    }
  } else if (layout.display === 'grid') {
    classes.push('grid');
    if (layout.columns) {
      classes.push(`grid-cols-${layout.columns}`);
    }
  } else if (layout.display === 'block') {
    classes.push('block');
  }
  
  if (layout.gap) {
    classes.push(`gap-${Math.round(layout.gap / 4)}`); // Convert to Tailwind spacing
  }
  
  if (layout.padding) {
    classes.push(`p-${Math.round(layout.padding / 4)}`);
  }
  
  if (layout.align) {
    const alignMap: Record<string, string> = {
      'start': 'items-start',
      'center': 'items-center',
      'end': 'items-end',
      'between': 'items-stretch',
      'around': 'items-center'
    };
    classes.push(alignMap[layout.align] || '');
  }
  
  if (layout.justify) {
    const justifyMap: Record<string, string> = {
      'start': 'justify-start',
      'center': 'justify-center',
      'end': 'justify-end',
      'between': 'justify-between',
      'around': 'justify-around'
    };
    classes.push(justifyMap[layout.justify] || '');
  }
  
  return classes.filter(Boolean);
}

/**
 * Converts style properties to Tailwind classes
 */
function styleToTailwind(style: Partial<StyleType>): string[] {
  const classes: string[] = [];
  
  if (style.bg) {
    if (style.bg.startsWith('#')) {
      // Convert hex to Tailwind color if possible, otherwise use arbitrary value
      classes.push(`bg-[${style.bg}]`);
    } else {
      classes.push(`bg-${style.bg}`);
    }
  }
  
  if (style.color) {
    if (style.color.startsWith('#')) {
      classes.push(`text-[${style.color}]`);
    } else {
      classes.push(`text-${style.color}`);
    }
  }
  
  if (style.radius) {
    const radiusMap: Record<number, string> = {
      2: 'rounded-sm',
      4: 'rounded',
      6: 'rounded-md',
      8: 'rounded-lg',
      12: 'rounded-xl',
      16: 'rounded-2xl',
      24: 'rounded-3xl'
    };
    classes.push(radiusMap[style.radius] || `rounded-[${style.radius}px]`);
  }
  
  if (style.shadow) {
    const shadowMap: Record<string, string> = {
      'sm': 'shadow-sm',
      'md': 'shadow-md',
      'lg': 'shadow-lg'
    };
    classes.push(shadowMap[style.shadow] || '');
  }
  
  if (style.border) {
    classes.push('border');
    if (style.border.includes('solid')) {
      classes.push('border-solid');
    }
  }
  
  // Handle additional style properties
  if ((style as any).fontSize) {
    classes.push(`text-[${(style as any).fontSize}px]`);
  }
  
  if ((style as any).fontWeight) {
    const weightMap: Record<string, string> = {
      'normal': 'font-normal',
      'bold': 'font-bold',
      '500': 'font-medium',
      '600': 'font-semibold'
    };
    classes.push(weightMap[(style as any).fontWeight] || `font-[${(style as any).fontWeight}]`);
  }
  
  if ((style as any).padding) {
    classes.push(`p-[${(style as any).padding}px]`);
  }
  
  return classes.filter(Boolean);
}

/**
 * Generates form field components
 */
function generateFormField(field: any, index: number): string {
  const { name, label, component, required, options, placeholder } = field;
  const fieldId = `field-${name}-${index}`;
  
  let fieldElement = '';
  
  switch (component) {
    case 'Input':
      fieldElement = `<Input id="${fieldId}" name="${name}" placeholder="${placeholder || ''}" ${required ? 'required' : ''} />`;
      break;
    case 'Textarea':
      fieldElement = `<Textarea id="${fieldId}" name="${name}" placeholder="${placeholder || ''}" ${required ? 'required' : ''} />`;
      break;
    case 'Select':
      const optionsList = options?.map((opt: string) => `<option value="${opt}">${opt}</option>`).join('') || '';
      fieldElement = `<Select name="${name}"><option value="">Select ${label || name}</option>${optionsList}</Select>`;
      break;
    case 'Checkbox':
      fieldElement = `<input type="checkbox" id="${fieldId}" name="${name}" className="rounded" />`;
      break;
    case 'Switch':
      fieldElement = `<input type="checkbox" id="${fieldId}" name="${name}" className="sr-only peer" />`;
      break;
    default:
      fieldElement = `<Input id="${fieldId}" name="${name}" placeholder="${placeholder || ''}" />`;
  }
  
  return `
    <div className="space-y-2">
      <label htmlFor="${fieldId}" className="text-sm font-medium">
        ${label || name}
        ${required ? '<span className="text-red-500">*</span>' : ''}
      </label>
      ${fieldElement}
    </div>
  `;
}

/**
 * Generates action handler code
 */
function generateActionHandler(actions: ActionDSLType): string {
  if (!actions?.onSubmit) return '';
  
  const { onSubmit } = actions;
  
  switch (onSubmit.type) {
    case 'http.post':
      return `
  const handleSubmit = async (data: FormData) => {
    try {
      const response = await fetch('${onSubmit.url}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit');
      }
      
      // Handle success
      console.log('Form submitted successfully');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };`;
    
    case 'supabase.insert':
      return `
  const handleSubmit = async (data: FormData) => {
    try {
      // This would be implemented with Supabase client
      console.log('Inserting into ${onSubmit.table}:', Object.fromEntries(data));
    } catch (error) {
      console.error('Error inserting data:', error);
    }
  };`;
    
    default:
      return `
  const handleSubmit = async (data: FormData) => {
    console.log('Form data:', Object.fromEntries(data));
  };`;
  }
}

/**
 * Recursively generates React component code from UI nodes
 */
function generateNodeCode(node: UINodeType, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  
  switch (node.type) {
    case 'Text':
      const textTag = node.role === 'h1' ? 'h1' : 
                     node.role === 'h2' ? 'h2' : 
                     node.role === 'h3' ? 'h3' : 
                     node.role === 'span' ? 'span' : 'p';
      
      const textClasses = styleToTailwind(node.style || {}).join(' ');
      return `${indent}<${textTag} className="${textClasses}">${node.content}</${textTag}>`;
    
    case 'Image':
      const imageClasses = styleToTailwind(node.style || {}).join(' ');
      return `${indent}<img src="${node.src}" alt="${node.alt}" className="${imageClasses}" />`;
    
    case 'Icon':
      const iconClasses = styleToTailwind(node.style || {}).join(' ');
      return `${indent}<div className="${iconClasses}">${node.name}</div>`; // Simplified icon
    
    case 'Form':
      const formClasses = styleToTailwind(node.style || {}).join(' ');
      const fields = node.fields?.map((field: any, index: number) => generateFormField(field, index)).join('\n') || '';
      const actionHandler = generateActionHandler(node.actions || {});
      
      return `${indent}<div className="space-y-4 ${formClasses}">
${fields}
${indent}  <Button type="submit" className="w-full">
${indent}    Submit
${indent}  </Button>
${indent}</div>`;
    
    case 'Frame':
      const frameClasses = [
        ...layoutToTailwind(node.layout || {}),
        ...styleToTailwind(node.style || {})
      ].join(' ');
      
      const children = node.children?.map((child: any) => generateNodeCode(child, depth + 1)).join('\n') || '';
      
      return `${indent}<div className="${frameClasses}">
${children}
${indent}</div>`;
    
    default:
      return `${indent}<!-- Unknown node type: ${(node as any).type} -->`;
  }
}

/**
 * Main function to convert UI Tree to React component
 */
export function uiTree_to_react(tree: UITreeType, componentName: string): CodegenResult {
  try {
    const componentCode = generateNodeCode(tree);
    const hasForm = tree.children?.some(child => child.type === 'Form');
    const actionHandlers = hasForm 
      ? generateActionHandler(tree.children?.find(child => child.type === 'Form')?.actions || {})
      : '';
    
    const code = `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

interface ${componentName}Props {
  className?: string;
}

export default function ${componentName}({ className = '' }: ${componentName}Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
${actionHandlers}
  
  return (
    <div className={\`\${className}\`}>
${componentCode}
    </div>
  );
}`;

    return {
      filePath: `/components/generated/${componentName}.tsx`,
      code,
      success: true
    };
    
  } catch (error) {
    return {
      filePath: '',
      code: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating code'
    };
  }
}
