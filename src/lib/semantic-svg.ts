import { parse } from "svgson";
import type { UITreeType } from "./schemas";

/** Convert SVG to semantic UI Tree using heuristics */
export async function svgToUITree(svg: string): Promise<UITreeType> {
  console.log('Parsing SVG:', svg.substring(0, 200) + '...');
  
  const ast = await parse(svg);
  console.log('Parsed AST:', JSON.stringify(ast, null, 2));
  
  const children: any[] = [];

  // Helper function to extract text content from any element
  const extractTextContent = (node: any): string => {
    if (node.children && node.children.length > 0) {
      return node.children
        .filter((child: any) => child.type === 'text')
        .map((child: any) => child.value)
        .join(' ')
        .trim();
    }
    return '';
  };

  // Helper function to get element bounds for positioning
  const getBounds = (node: any) => {
    const x = parseFloat(node.attributes?.x || '0');
    const y = parseFloat(node.attributes?.y || '0');
    const width = parseFloat(node.attributes?.width || '0');
    const height = parseFloat(node.attributes?.height || '0');
    return { x, y, width, height };
  };

  for (const node of ast.children ?? []) {
    console.log('Processing node:', node.name, node.attributes);
    
    // Handle text elements
    if (node.name === "text") {
      const content = extractTextContent(node) || node.children?.[0]?.value || "Text";
      children.push({ 
        type: "Text", 
        role: "p", 
        content,
        style: {
          color: node.attributes.fill || "#000000"
        }
      });
    }
    
    // Handle tspan elements (text spans)
    if (node.name === "tspan") {
      const content = extractTextContent(node) || node.children?.[0]?.value || "Text";
      children.push({ 
        type: "Text", 
        role: "span", 
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
    
    // Fallback: if we have any element with text content, create a text node
    if (!children.length && node.children) {
      const textContent = extractTextContent(node);
      if (textContent) {
        children.push({
          type: "Text",
          role: "p",
          content: textContent,
          style: {
            color: node.attributes.fill || "#000000"
          }
        });
      }
    }
    
    // Fallback: if we have any visual element (rect, circle, path, etc.), create a frame
    if (!children.length && ['rect', 'circle', 'ellipse', 'path', 'polygon', 'polyline'].includes(node.name)) {
      const bounds = getBounds(node);
      children.push({
        type: "Frame",
        layout: {
          display: "flex",
          direction: "column",
          gap: 8,
          padding: 12
        },
        style: {
          bg: node.attributes.fill || "#f0f0f0",
          radius: 4,
          shadow: "sm",
          border: !!node.attributes.stroke
        },
        children: [{
          type: "Text",
          role: "p",
          content: `${node.name} element`,
          style: {
            color: node.attributes.stroke || "#666666"
          }
        }]
      });
    }
  }

  // If still no children, create a generic content frame
  if (children.length === 0) {
    children.push({ 
      type: "Text", 
      role: "p", 
      content: "SVG content detected but no recognizable elements found" 
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
