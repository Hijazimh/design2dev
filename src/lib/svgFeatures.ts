import { parse } from "svgson";

export type SvgFeature = { 
  type: string; 
  attrs: Record<string,string>; 
  text?: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export async function extractSvgFeatures(svg: string): Promise<SvgFeature[]> {
  const ast = await parse(svg);
  const out: SvgFeature[] = [];
  
  function walk(n: any) {
    if (!n) return;
    
    const type = n.name;
    const attrs = n.attributes || {};
    const text = (n.children || []).find((c: any) => c.type === "text" || c.type === "raw")?.value;
    
    // Calculate bounds for positioning
    const bounds = {
      x: parseFloat(attrs.x || '0'),
      y: parseFloat(attrs.y || '0'),
      width: parseFloat(attrs.width || '0'),
      height: parseFloat(attrs.height || '0')
    };
    
    if (type) {
      out.push({ 
        type, 
        attrs, 
        text,
        bounds: bounds.width > 0 && bounds.height > 0 ? bounds : undefined
      });
    }
    
    (n.children || []).forEach(walk);
  }
  
  walk(ast);
  return out;
}
