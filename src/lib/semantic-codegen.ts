import type { UITreeType } from "./schemas";

function styleToTw(style?: any) {
  if (!style) return "";
  const c: string[] = [];
  if (style.bg) c.push(`bg-[${style.bg}]`);
  if (style.color) c.push(`text-[${style.color}]`);
  if (style.radius) c.push(style.radius >= 16 ? "rounded-2xl" : style.radius > 0 ? "rounded-md" : "");
  if (style.shadow) c.push(style.shadow === "md" ? "shadow-md" : "shadow");
  if (style.border) c.push("border");
  return c.filter(Boolean).join(" ");
}

function layoutToTw(layout?: any) {
  if (!layout) return "flex flex-col";
  const c: string[] = [];
  if (layout.display === "flex") c.push("flex", layout.direction === "row" ? "flex-row" : "flex-col");
  if (layout.display === "grid") c.push("grid", layout.columns ? `grid-cols-${layout.columns}` : "grid-cols-1");
  if (layout.gap) c.push(`gap-[${layout.gap}px]`);
  if (layout.padding) c.push(`p-[${layout.padding}px]`);
  return c.join(" ");
}

function emit(node: any, indent = 2): string {
  const pad = " ".repeat(indent);
  
  if (node.type === "Text") {
    const Tag = node.role || "p";
    const styleClass = styleToTw(node.style);
    return `${pad}<${Tag} className="${styleClass}">${node.content}</${Tag}>`;
  }
  
  if (node.type === "Image") {
    const styleClass = styleToTw(node.style);
    return `${pad}<img src="${node.src}" alt="${node.alt ?? ""}" className="${styleClass}" />`;
  }

  if (node.type === "Form") {
    const fields = (node.fields ?? []).map((f: any) => {
      const fieldId = `field-${f.name}`;
      
      if (f.component === "Input") {
        return `${pad}  <div className="space-y-2">
${pad}    <label htmlFor="${fieldId}" className="block text-sm font-medium text-gray-700">
${pad}      ${f.label ?? f.name}
${pad}    </label>
${pad}    <input
${pad}      id="${fieldId}"
${pad}      name="${f.name}"
${pad}      type="text"
${pad}      placeholder="${f.placeholder ?? ""}"
${pad}      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
${pad}    />
${pad}  </div>`;
      }
      
      if (f.component === "Textarea") {
        return `${pad}  <div className="space-y-2">
${pad}    <label htmlFor="${fieldId}" className="block text-sm font-medium text-gray-700">
${pad}      ${f.label ?? f.name}
${pad}    </label>
${pad}    <textarea
${pad}      id="${fieldId}"
${pad}      name="${f.name}"
${pad}      rows={4}
${pad}      placeholder="${f.placeholder ?? ""}"
${pad}      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
${pad}    />
${pad}  </div>`;
      }
      
      if (f.component === "Select") {
        const options = (f.options ?? []).map((o: string) => 
          `${pad}      <option value="${o}">${o}</option>`
        ).join("\n");
        
        return `${pad}  <div className="space-y-2">
${pad}    <label htmlFor="${fieldId}" className="block text-sm font-medium text-gray-700">
${pad}      ${f.label ?? f.name}
${pad}    </label>
${pad}    <select
${pad}      id="${fieldId}"
${pad}      name="${f.name}"
${pad}      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
${pad}    >
${pad}      <option value="">Select an option</option>
${options}
${pad}    </select>
${pad}  </div>`;
      }
      
      if (f.component === "Checkbox") {
        return `${pad}  <div className="flex items-center space-x-2">
${pad}    <input
${pad}      id="${fieldId}"
${pad}      name="${f.name}"
${pad}      type="checkbox"
${pad}      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
${pad}    />
${pad}    <label htmlFor="${fieldId}" className="text-sm font-medium text-gray-700">
${pad}      ${f.label ?? f.name}
${pad}    </label>
${pad}  </div>`;
      }
      
      if (f.component === "Button") {
        return `${pad}  <button
${pad}    type="submit"
${pad}    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
${pad}  >
${pad}    ${f.label ?? "Submit"}
${pad}  </button>`;
      }
      
      return "";
    }).join("\n");

    const formStyleClass = styleToTw(node.style);
    const formLayoutClass = layoutToTw({ display: "flex", direction: "column", gap: 16 });

    return [
      `${pad}<form onSubmit={handleSubmit} className="${formLayoutClass} ${formStyleClass}">`,
      fields,
      `${pad}</form>`
    ].join("\n");
  }

  if (node.type === "Frame") {
    const kids = (node.children ?? []).map((k: any) => emit(k, indent + 2)).join("\n");
    const layoutClass = layoutToTw(node.layout);
    const styleClass = styleToTw(node.style);
    const combinedClass = [layoutClass, styleClass].filter(Boolean).join(" ");
    
    return `${pad}<div className="${combinedClass}">\n${kids}\n${pad}</div>`;
  }
  
  return `${pad}<div />`;
}

export function uiTreeToReact(tree: UITreeType, name: string) {
  const body = emit(tree, 2);
  
  return `import * as React from "react";

export type ${name}Props = { 
  onSubmit?: (data: Record<string, any>) => void;
  className?: string;
};

export default function ${name}({ onSubmit, className, ...props }: ${name}Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onSubmit?.(data);
  }

  return (
    <div className={\`\${className || ""}\`} {...props}>
${body}
    </div>
  );
}`;
}
