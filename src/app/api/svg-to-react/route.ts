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
            { name: 'convertStyleToAttrs', active: false }, // keep <svg style="">
          ],
        },
        expandProps: 'end', // allow passing className/width/height if you want
        memo: false,
        icon: false, // keep original viewBox/size
        prettier: false,
        titleProp: false,
        ref: false,
        exportType: 'default', // Ensure default export
      },
      { componentName: name }
    );

    // Ensure the component is properly defined and exported
    let normalized = code;
    
    // If the code doesn't contain the component definition, add it
    if (!code.includes(`function ${name}`) && !code.includes(`const ${name}`) && !code.includes(`export default function ${name}`)) {
      // Extract the JSX content and wrap it in a proper component
      const jsxMatch = code.match(/<svg[\s\S]*<\/svg>/);
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
