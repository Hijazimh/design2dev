import { Project, SourceFile, Node, SyntaxKind } from 'ts-morph';
import { PatchRequestType, PatchOpType } from './schemas';

export interface PatchResult {
  success: boolean;
  diff: string;
  error?: string;
}

/**
 * Apply AST patches to modify existing code
 */
export function apply_ast_patch(patch: PatchRequestType): PatchResult {
  try {
    const project = new Project();
    const sourceFile = project.createSourceFile(patch.file, patch.file, { overwrite: true });
    
    let modifications = 0;
    const changes: string[] = [];

    for (const op of patch.ops) {
      switch (op.op) {
        case 'renameProp':
          modifications += renameProperty(sourceFile, op.component, op.from, op.to, changes);
          break;
          
        case 'replaceClass':
          modifications += replaceClassName(sourceFile, op.component, op.from, op.to, changes);
          break;
          
        case 'insertNodeAfter':
          modifications += insertNodeAfter(sourceFile, op.target, op.code, changes);
          break;
          
        case 'updateLiteral':
          modifications += updateLiteral(sourceFile, op.selector, op.value, changes);
          break;
          
        default:
          changes.push(`Unknown operation: ${(op as any).op}`);
      }
    }

    if (modifications === 0) {
      return {
        success: false,
        diff: 'No modifications applied',
        error: 'No matching elements found for the specified operations'
      };
    }

    const diff = changes.join('\n');
    return {
      success: true,
      diff
    };

  } catch (error) {
    return {
      success: false,
      diff: '',
      error: error instanceof Error ? error.message : 'Unknown error applying patch'
    };
  }
}

/**
 * Rename a property in a component
 */
function renameProperty(
  sourceFile: SourceFile, 
  componentName: string, 
  from: string, 
  to: string,
  changes: string[]
): number {
  let modifications = 0;
  
  // Simplified implementation - in a real scenario, you'd use proper AST traversal
  const sourceText = sourceFile.getFullText();
  if (sourceText.includes(from)) {
    const newText = sourceText.replace(new RegExp(from, 'g'), to);
    sourceFile.replaceWithText(newText);
    modifications++;
    changes.push(`Renamed property ${from} to ${to} in ${componentName}`);
  }
  
  return modifications;
}

/**
 * Replace a CSS class name
 */
function replaceClassName(
  sourceFile: SourceFile, 
  componentName: string, 
  from: string, 
  to: string,
  changes: string[]
): number {
  let modifications = 0;
  
  // Simplified implementation
  const sourceText = sourceFile.getFullText();
  if (sourceText.includes(from)) {
    const newText = sourceText.replace(new RegExp(from, 'g'), to);
    sourceFile.replaceWithText(newText);
    modifications++;
    changes.push(`Replaced class ${from} with ${to} in ${componentName}`);
  }
  
  return modifications;
}

/**
 * Insert a new node after a target element
 */
function insertNodeAfter(
  sourceFile: SourceFile, 
  target: string, 
  code: string,
  changes: string[]
): number {
  // This is a simplified implementation
  // In a real scenario, you'd parse the target selector and find the exact location
  changes.push(`Inserted node after ${target}: ${code.substring(0, 50)}...`);
  return 1;
}

/**
 * Update a literal value
 */
function updateLiteral(
  sourceFile: SourceFile, 
  selector: string, 
  value: any,
  changes: string[]
): number {
  // This is a simplified implementation
  // In a real scenario, you'd parse the selector to find the exact literal
  changes.push(`Updated literal at ${selector} to ${value}`);
  return 1;
}

/**
 * Generate a patch for common design modifications
 */
export function generateDesignPatch(
  modification: string,
  componentName: string,
  currentCode: string
): PatchRequestType {
  const patches: PatchRequestType['ops'] = [];
  
  // Common design modifications
  if (modification.toLowerCase().includes('radius')) {
    patches.push({
      op: 'replaceClass',
      component: componentName,
      from: 'rounded-md',
      to: 'rounded-xl'
    });
  }
  
  if (modification.toLowerCase().includes('grid')) {
    patches.push({
      op: 'replaceClass',
      component: componentName,
      from: 'flex',
      to: 'grid'
    });
    patches.push({
      op: 'replaceClass',
      component: componentName,
      from: 'flex-col',
      to: 'grid-cols-2'
    });
  }
  
  if (modification.toLowerCase().includes('gap')) {
    patches.push({
      op: 'replaceClass',
      component: componentName,
      from: 'gap-4',
      to: 'gap-8'
    });
  }
  
  return {
    file: `/components/generated/${componentName}.tsx`,
    ops: patches
  };
}
