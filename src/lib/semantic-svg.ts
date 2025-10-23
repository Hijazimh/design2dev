import { parse } from "svgson";
import type { UITreeType } from "./schemas";

/** Convert SVG to semantic UI Tree using heuristics */
export async function svgToUITree(svg: string): Promise<UITreeType> {
  const ast = await parse(svg);
  const children: any[] = [];

  for (const node of ast.children ?? []) {
    if (node.name === "text") {
      const content = node.children?.[0]?.value ?? "Text";
      children.push({ 
        type: "Text", 
        role: "p", 
        content,
        style: {
          color: node.attributes.fill || "#000000"
        }
      });
    }
    
    if (node.name === "rect") {
      const radius = Number(node.attributes.rx || 0);
      const fill = node.attributes.fill || "#ffffff";
      const stroke = node.attributes.stroke;
      
      children.push({
        type: "Frame",
        layout: { 
          display: "flex", 
          direction: "column", 
          gap: 12, 
          padding: 16 
        },
        style: { 
          bg: fill, 
          radius: isNaN(radius) ? 0 : radius, 
          shadow: "sm", 
          border: !!stroke 
        },
        children: [],
      });
    }

    // Detect buttons: rect + text combination
    if (node.name === "g" && node.children) {
      const hasRect = node.children.some((child: any) => child.name === "rect");
      const hasText = node.children.some((child: any) => child.name === "text");
      
      if (hasRect && hasText) {
        const textContent = node.children
          .find((child: any) => child.name === "text")
          ?.children?.[0]?.value || "Button";
        
        children.push({
          type: "Form",
          name: "buttonForm",
          fields: [{
            name: "button",
            component: "Button",
            label: textContent
          }],
          style: {
            bg: "#3b82f6",
            radius: 8,
            shadow: "sm"
          }
        });
      }
    }

    // Detect forms: multiple rects with text
    if (node.name === "g" && node.children) {
      const rects = node.children.filter((child: any) => child.name === "rect");
      const texts = node.children.filter((child: any) => child.name === "text");
      
      if (rects.length > 1 && texts.length > 0) {
        const formFields = texts.map((textNode: any, index: number) => ({
          name: `field${index}`,
          component: "Input" as const,
          label: textNode.children?.[0]?.value || `Field ${index + 1}`,
          placeholder: `Enter ${textNode.children?.[0]?.value || `field ${index + 1}`}`
        }));

        children.push({
          type: "Form",
          name: "generatedForm",
          fields: formFields,
          style: {
            bg: "#f9fafb",
            radius: 8,
            shadow: "sm"
          }
        });
      }
    }
  }

  if (children.length === 0) {
    children.push({ 
      type: "Text", 
      role: "p", 
      content: "Parsed empty SVG" 
    });
  }

  return { 
    type: "Frame", 
    layout: {
      display: "flex",
      direction: "column",
      gap: 16
    },
    style: {
      bg: "#ffffff",
      radius: 8,
      shadow: "sm"
    },
    children 
  };
}
