import { Project, SyntaxKind, JsxAttribute } from "ts-morph";
import { PatchRequestType } from "./schemas";

function findJsxBySubstring(sf: any, snippet: string) {
  const els = sf.getDescendantsOfKind(SyntaxKind.JsxElement);
  const selfs = sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  return els.concat(selfs).find((n: any) => n.getText().includes(snippet));
}

function getOrCreateClassName(el: any) {
  const attr = el.getAttributes().find((a: any) => a.getName?.() === "className");
  if (attr) return attr;
  return el.addAttribute({ name: "className", initializer: `""` }) as JsxAttribute;
}

export function applyPatch(patch: PatchRequestType, root = process.cwd()) {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const diffs: string[] = [];
  const errors: string[] = [];
  
  for (const op of patch.ops) {
    const abs = `${root}${op.file}`;
    
    try {
      // For now, we'll work with the file content directly since we're in a web environment
      // In a real implementation, you'd read the file from disk
      const sf = project.createSourceFile(op.file, "", { overwrite: true });
      
      if (op.op === "addClass" || op.op === "removeClass" || op.op === "replaceClass") {
        const node = findJsxBySubstring(sf, op.jsx);
        if (!node) {
          errors.push(`JSX not found: ${op.jsx}`);
          continue;
        }
        
        const attr = getOrCreateClassName(node);
        const lit = attr.getInitializer()?.getText() ?? `""`;
        const current = lit.replace(/^["'`](.*)["'`]$/, "$1");
        let next = current;
        
        if (op.op === "addClass" && !current.split(/\s+/).includes(op.className)) {
          next = (current + " " + op.className).trim();
        }
        if (op.op === "removeClass") {
          next = current.split(/\s+/).filter((c: string) => c && c !== op.className).join(" ");
        }
        if (op.op === "replaceClass") {
          next = current.split(/\s+/).map((c: string) => c === op.from ? op.to : c).join(" ");
        }
        
        attr.setInitializer(`"${next}"`);
      }
      
      if (op.op === "setAttribute") {
        const node = findJsxBySubstring(sf, op.jsx);
        if (!node) {
          errors.push(`JSX not found: ${op.jsx}`);
          continue;
        }
        
        const attr = node.getAttributes().find((a: any) => a.getName?.() === op.name);
        const init = JSON.stringify(op.value);
        attr ? attr.setInitializer(init) : node.addAttribute({ name: op.name, initializer: init });
      }
      
      if (op.op === "insertAfter") {
        const node = findJsxBySubstring(sf, op.targetJsx);
        if (!node) {
          errors.push(`JSX not found: ${op.targetJsx}`);
          continue;
        }
        node.replaceWithText(`${node.getText()}\n${op.code}`);
      }
      
      if (op.op === "textEdit") {
        const currentText = sf.getFullText();
        const newText = currentText.replace(op.find, op.replace);
        sf.replaceWithText(newText);
      }
      
      diffs.push(`${op.file}:${op.op}`);
      
    } catch (e: any) {
      errors.push(`${op.file}:${op.op} - ${e.message}`);
    }
  }
  
  return { 
    success: errors.length === 0, 
    diffs, 
    errors 
  };
}
