import { NextResponse } from 'next/server';
import { transform } from '@svgr/core';

export async function POST(req: Request) {
  try {
    const { svg, name = 'GeneratedComponent' } = await req.json();

    if (!svg || typeof svg !== 'string') {
      return NextResponse.json({ error: 'Missing svg' }, { status: 400 });
    }

    const code = await transform(
      svg,
      {
        jsxRuntime: 'automatic',
        typescript: true,
        dimensions: true,
        svgo: true,
        svgoConfig: {
          plugins: [
            { name: 'removeViewBox', active: false },
            { name: 'removeDimensions', active: false },
            { name: 'removeUnknownsAndDefaults', active: false },
            { name: 'convertStyleToAttrs', active: true }, // Convert inline styles to attributes
          ],
        },
        expandProps: 'end', // allow passing className/width/height if you want
        memo: false,
        icon: false, // keep original viewBox/size
        prettier: false,
        titleProp: false,
        ref: false,
        exportType: 'default', // Ensure default export
        replaceAttrValues: {
          // Convert common style strings to React-compatible values
          '#000': 'currentColor',
          '#000000': 'currentColor',
        },
      },
      { componentName: name }
    );

    // Ensure the component is properly defined and exported
    let normalized = code;
    
    // Post-process to fix any remaining style string issues
    normalized = normalized.replace(/style="([^"]*)"/g, (match, styleString) => {
      // Convert CSS string to React style object
      const styleObj: Record<string, string> = {};
      const styles = styleString.split(';').filter(Boolean);
      
      styles.forEach((style: string) => {
        const [property, value] = style.split(':').map((s: string) => s.trim());
        if (property && value) {
          // Convert kebab-case to camelCase
          const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          styleObj[camelProperty] = value;
        }
      });
      
      return `style={${JSON.stringify(styleObj)}}`;
    });
    
    // If the code doesn't contain the component definition, add it
    if (!code.includes(`function ${name}`) && !code.includes(`const ${name}`) && !code.includes(`export default function ${name}`)) {
      // Extract the JSX content and wrap it in a proper component
      const jsxMatch = normalized.match(/<svg[\s\S]*<\/svg>/);
      if (jsxMatch) {
        const jsxContent = jsxMatch[0];
        normalized = `import * as React from 'react';

interface ${name}Props {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function ${name}({ className, width, height, ...props }: ${name}Props) {
  return (
    ${jsxContent}
  );
}`;
      }
    }
    
    // Ensure default export if not present
    if (!normalized.includes('export default')) {
      normalized += `\nexport default ${name};\n`;
    }

    return NextResponse.json({ 
      success: true,
      code: normalized,
      componentName: name
    });

  } catch (error) {
    console.error('SVG to React conversion error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error converting SVG'
      }, 
      { status: 500 }
    );
  }
}
