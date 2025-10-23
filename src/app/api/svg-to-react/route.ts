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
      },
      { componentName: name }
    );

    // Ensure default export function (nice for Sandpack)
    const normalized = code.includes('export default')
      ? code
      : code + `\nexport default ${name};\n`;

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
