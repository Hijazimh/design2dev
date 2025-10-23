import { PALETTE } from "./palette";
import type { BuildPlan } from "./contracts";

function emitNode(n: any, indent = 2): string {
  const pad = " ".repeat(indent);
  const entry = PALETTE[n.componentKey];
  
  if (!entry) {
    console.warn(`Unknown component key: ${n.componentKey}`);
    return `${pad}<div>Unknown component: ${n.componentKey}</div>`;
  }
  
  const tag = entry.tag;
  const tw = [entry.tailwind, n.tailwind].filter(Boolean).join(" ");
  const classAttr = tw ? ` className="${tw}"` : "";
  const props = Object.entries(n.props || {}).map(([k, v]) => ` ${k}=${JSON.stringify(v)}`).join("");

  const children = (n.children || []).map((c: any) => {
    if (typeof c === "string") {
      return `${pad}  ${c}`;
    }
    return emitNode(c, indent + 2);
  }).join("\n");
  
  const isSelfClosing = (children.trim().length === 0) && ["img", "input"].includes(tag);
  
  if (isSelfClosing) {
    return `${pad}<${tag}${classAttr}${props} />`;
  }
  
  return `${pad}<${tag}${classAttr}${props}>\n${children}\n${pad}</${tag}>`;
}

export function codegenBuildPlan(plan: BuildPlan) {
  // Gather imports from palette entries used
  const importSet = new Set<string>();
  
  function collect(n: any) {
    const e = PALETTE[n.componentKey];
    if (e?.import) {
      importSet.add(e.import);
    }
    (n.children || []).forEach(collect);
  }
  
  collect(plan.root);

  const imports = Array.from(importSet).join("\n");
  const jsx = emitNode(plan.root, 2);
  
  const code = `${imports ? imports + "\n\n" : ""}import * as React from "react";

export type ${plan.name}Props = { 
  onSubmit?: (data: Record<string, any>) => void;
  className?: string;
};

export default function ${plan.name}({ onSubmit, className, ...props }: ${plan.name}Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onSubmit?.(data);
  }

  return (
    <div className={\`\${className || ""}\`} {...props}>
${jsx}
    </div>
  );
}`;
  
  return { 
    filePath: `/src/components/generated/${plan.name}.tsx`, 
    code 
  };
}
