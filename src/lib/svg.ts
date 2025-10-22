import { parse } from 'svgson';
import { UITreeType, UINodeType, LayoutType, StyleType } from './schemas';
import DOMPurify from 'isomorphic-dompurify';

export interface SVGParseResult {
  success: boolean;
  tree?: UITreeType;
  error?: string;
}

/**
 * Sanitizes SVG content to prevent XSS attacks
 */
function sanitizeSVG(svgContent: string): string {
  return DOMPurify.sanitize(svgContent, {
    ADD_TAGS: ['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'image'],
    ADD_ATTR: ['viewBox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'fill', 'stroke', 'stroke-width', 'font-family', 'font-size', 'text-anchor', 'dominant-baseline']
  });
}

/**
 * Converts SVG attributes to Tailwind classes
 */
function svgStyleToTailwind(attrs: Record<string, any>): Partial<StyleType> {
  const style: Partial<StyleType> & { fontSize?: number; fontWeight?: string } = {};

  if (attrs.fill && attrs.fill !== 'none') {
    style.color = attrs.fill;
  }

  if (attrs.stroke) {
    style.border = `1px solid ${attrs.stroke}`;
  }

  // Handle font attributes
  if (attrs['font-size']) {
    style.fontSize = parseFloat(attrs['font-size']);
  }

  if (attrs['font-weight']) {
    style.fontWeight = attrs['font-weight'];
  }

  return style;
}

/**
 * Converts SVG layout attributes to our Layout schema
 */
function svgLayoutToLayout(attrs: Record<string, any>): Partial<LayoutType> {
  const layout: Partial<LayoutType> = {
    display: 'flex',
    direction: 'column'
  };
  
  return layout;
}

/**
 * Recursively extracts text content from an element and its children
 */
function extractTextContent(element: any): string {
  let content = '';

  // Check if this is a text node
  if (element.type === 'text' && element.value) {
    return element.value;
  }

  // Check for direct text properties
  if (element.value) {
    content += element.value;
  }

  if (element.text) {
    content += element.text;
  }

  // Recursively check children
  if (element.children && Array.isArray(element.children)) {
    for (const child of element.children) {
      content += extractTextContent(child);
    }
  }

  return content;
}

/**
 * Processes text elements from SVG
 */
function processTextElement(element: any): UINodeType | null {
  if (element.name === 'text' || element.name === 'tspan') {
    console.log('Processing text element:', element);

    // Extract all text content recursively
    const content = extractTextContent(element);

    console.log('Text content found:', content);

    if (content.trim()) {
      const attrs = element.attributes || {};
      const fontSize = attrs['font-size'] ? parseFloat(attrs['font-size']) : undefined;

      // Determine the role based on font size
      let role: 'h1' | 'h2' | 'h3' | 'p' | 'span' = 'p';
      if (fontSize) {
        if (fontSize >= 32) role = 'h1';
        else if (fontSize >= 24) role = 'h2';
        else if (fontSize >= 18) role = 'h3';
      }

      return {
        type: 'Text',
        role,
        content: content.trim(),
        style: {
          ...svgStyleToTailwind(attrs),
          ...(fontSize ? { fontSize } : {})
        }
      };
    }
  }
  return null;
}

/**
 * Processes image elements from SVG
 */
function processImageElement(element: any): UINodeType | null {
  if (element.name === 'image') {
    return {
      type: 'Image',
      src: element.attributes?.href || element.attributes?.xlinkHref || '',
      alt: element.attributes?.alt || '',
      style: svgStyleToTailwind(element.attributes || {})
    };
  }
  return null;
}

/**
 * Processes path elements as icons
 */
function processPathElement(element: any): UINodeType | null {
  if (element.name === 'path') {
    // Simple heuristic: if path has no fill/stroke or is very simple, treat as icon
    const attrs = element.attributes || {};
    if (attrs.d && attrs.d.length < 100) { // Simple path
      return {
        type: 'Icon',
        name: 'square', // Default icon, could be improved with path analysis
        style: svgStyleToTailwind(attrs)
      };
    }
  }
  return null;
}

/**
 * Processes rect elements as frames
 */
function processRectElement(element: any): UINodeType | null {
  if (element.name === 'rect') {
    const attrs = element.attributes || {};
    const children: UINodeType[] = [];
    
    // Process children if any
    if (element.children) {
      for (const child of element.children) {
        const processed = processSVGElement(child);
        if (processed) {
          children.push(processed);
        }
      }
    }
    
    return {
      type: 'Frame',
      layout: {
        display: 'flex',
        direction: 'column',
        gap: 8
      },
      style: {
        ...svgStyleToTailwind(attrs),
        radius: attrs.rx ? parseInt(attrs.rx) : 0
      },
      children
    };
  }
  return null;
}

/**
 * Recursively processes SVG elements
 */
function processSVGElement(element: any): UINodeType | null {
  if (!element) return null;
  
  // Handle text nodes directly
  if (element.type === 'text' && element.value) {
    return {
      type: 'Text',
      role: 'p',
      content: element.value.trim(),
      style: {}
    };
  }
  
  // Handle element nodes
  if (element.type === 'element') {
    // Try different element processors
    const processors = [
      processTextElement,
      processImageElement,
      processPathElement,
      processRectElement
    ];
    
    for (const processor of processors) {
      const result = processor(element);
      if (result) return result;
    }
    
    // If no specific processor matched, try to process as a generic frame
    if (element.children && element.children.length > 0) {
      const children: UINodeType[] = [];
      for (const child of element.children) {
        const processed = processSVGElement(child);
        if (processed) {
          children.push(processed);
        }
      }
      
      if (children.length > 0) {
        return {
          type: 'Frame',
          layout: svgLayoutToLayout(element.attributes || {}),
          style: svgStyleToTailwind(element.attributes || {}),
          children
        };
      }
    }
  }
  
  return null;
}

/**
 * Extract SVG elements and their properties
 */
interface SVGElement {
  type: 'text' | 'rect' | 'path' | 'circle' | 'image';
  content?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  rx?: number;
  ry?: number;
}

function parseSVGElements(svgContent: string): SVGElement[] {
  const elements: SVGElement[] = [];
  
  // Extract text elements
  const textMatches = svgContent.match(/<text[^>]*>([^<]*)<\/text>/gi);
  if (textMatches) {
    textMatches.forEach(match => {
      const content = match.replace(/<[^>]*>/g, '').trim();
      if (content) {
        const xMatch = match.match(/x="([^"]*)"/);
        const yMatch = match.match(/y="([^"]*)"/);
        const fontSizeMatch = match.match(/font-size="([^"]*)"/);
        const fontWeightMatch = match.match(/font-weight="([^"]*)"/);
        const fillMatch = match.match(/fill="([^"]*)"/);
        
        elements.push({
          type: 'text',
          content,
          x: xMatch ? parseFloat(xMatch[1]) : 0,
          y: yMatch ? parseFloat(yMatch[1]) : 0,
          fontSize: fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 16,
          fontWeight: fontWeightMatch ? fontWeightMatch[1] : 'normal',
          fill: fillMatch ? fillMatch[1] : '#000000'
        });
      }
    });
  }
  
  // Extract rect elements
  const rectMatches = svgContent.match(/<rect[^>]*\/?>/gi);
  if (rectMatches) {
    rectMatches.forEach(match => {
      const xMatch = match.match(/x="([^"]*)"/);
      const yMatch = match.match(/y="([^"]*)"/);
      const widthMatch = match.match(/width="([^"]*)"/);
      const heightMatch = match.match(/height="([^"]*)"/);
      const fillMatch = match.match(/fill="([^"]*)"/);
      const strokeMatch = match.match(/stroke="([^"]*)"/);
      const rxMatch = match.match(/rx="([^"]*)"/);
      
      elements.push({
        type: 'rect',
        x: xMatch ? parseFloat(xMatch[1]) : 0,
        y: yMatch ? parseFloat(yMatch[1]) : 0,
        width: widthMatch ? parseFloat(widthMatch[1]) : 0,
        height: heightMatch ? parseFloat(heightMatch[1]) : 0,
        fill: fillMatch ? fillMatch[1] : 'transparent',
        stroke: strokeMatch ? strokeMatch[1] : 'none',
        rx: rxMatch ? parseFloat(rxMatch[1]) : 0
      });
    });
  }
  
  return elements;
}

/**
 * Convert SVG elements to React components
 */
function convertSVGToReactElements(elements: SVGElement[]): UINodeType[] {
  const reactElements: UINodeType[] = [];
  
  // Group elements by their visual hierarchy
  const textElements = elements.filter(el => el.type === 'text');
  const rectElements = elements.filter(el => el.type === 'rect');
  
  // Create a main card container
  const mainCard: UINodeType = {
    type: 'Frame',
    layout: {
      display: 'flex',
      direction: 'column',
      gap: 16,
      padding: 24
    },
    style: {
      bg: '#ffffff',
      radius: 16,
      shadow: 'md',
      border: '1px solid #e5e7eb'
    },
    children: []
  };
  
  // Add title (first text element, usually largest)
  const titleElement = textElements.find(el => el.fontSize && el.fontSize > 20);
  if (titleElement) {
    mainCard.children!.push({
      type: 'Text',
      role: 'h2',
      content: titleElement.content!,
      style: {
        color: titleElement.fill || '#111827',
        fontSize: titleElement.fontSize
      }
    });
  }
  
  // Add subtitle (second text element)
  const subtitleElement = textElements.find(el => el.fontSize && el.fontSize < 20 && el.fontSize > 14);
  if (subtitleElement) {
    mainCard.children!.push({
      type: 'Text',
      role: 'p',
      content: subtitleElement.content!,
      style: {
        color: subtitleElement.fill || '#6b7280'
      }
    });
  }
  
  // Create form fields for input areas
  const inputRects = rectElements.filter(rect => 
    rect.fill === '#F9FAFB' || rect.fill === '#f9fafb' || 
    rect.stroke === '#D1D5DB' || rect.stroke === '#d1d5db'
  );
  
  if (inputRects.length > 0) {
    const formNode: UINodeType = {
      type: 'Form',
      name: 'featureRequestForm',
      fields: [
        {
          name: 'title',
          label: 'Title',
          component: 'Input',
          required: true,
          placeholder: 'Enter a short summary'
        },
        {
          name: 'description',
          label: 'Description',
          component: 'Textarea',
          placeholder: 'Describe your idea in detail'
        }
      ],
      actions: {
        onSubmit: {
          type: 'http.post',
          url: '/api/requests'
        }
      },
      style: {
        bg: '#f9fafb',
        radius: 8,
        padding: 16
      }
    };
    
    mainCard.children!.push(formNode);
  }
  
  // Add submit button
  const buttonRect = rectElements.find(rect => rect.fill === '#3B82F6' || rect.fill === '#3b82f6');
  if (buttonRect) {
    mainCard.children!.push({
      type: 'Frame',
      layout: {
        display: 'flex',
        direction: 'row',
        justify: 'start'
      },
      style: {},
      children: [
        {
          type: 'Text',
          role: 'span',
          content: 'Submit',
          style: {
            bg: '#3b82f6',
            color: '#ffffff',
            radius: 16,
            padding: 8,
            fontSize: 14,
            fontWeight: '500'
          }
        }
      ]
    });
  }
  
  reactElements.push(mainCard);
  
  return reactElements;
}

/**
 * Main function to convert SVG string to UI Tree
 */
export async function svg_to_uiTree(svgContent: string): Promise<SVGParseResult> {
  try {
    console.log('Processing SVG:', svgContent.substring(0, 100) + '...');

    // Sanitize the SVG first
    const sanitized = sanitizeSVG(svgContent);

    // Parse SVG using svgson
    const parsed = await parse(sanitized);
    console.log('Parsed SVG with svgson:', JSON.stringify(parsed, null, 2));

    // Process the SVG tree into UI nodes
    const processedNode = processSVGElement(parsed);
    console.log('Processed SVG node:', JSON.stringify(processedNode, null, 2));

    // If no node was processed, fall back to regex-based parsing
    let children: UINodeType[] = [];

    if (processedNode) {
      // If the processed node is a Frame with children, use those children
      if (processedNode.type === 'Frame' && processedNode.children) {
        children = processedNode.children;
      } else {
        children = [processedNode];
      }
    }

    // If we still have no children, try the regex fallback
    if (children.length === 0) {
      console.log('No elements found with svgson, trying regex fallback...');
      const elements = parseSVGElements(svgContent);
      console.log('Parsed SVG elements with regex:', elements);
      children = convertSVGToReactElements(elements);
    }

    const tree: UITreeType = {
      type: 'Frame',
      layout: {
        display: 'flex',
        direction: 'column',
        gap: 16,
        padding: 24
      },
      style: {
        bg: '#ffffff',
        radius: 8
      },
      children
    };

    console.log('Generated UI tree:', JSON.stringify(tree, null, 2));

    return {
      success: true,
      tree
    };

  } catch (error) {
    console.error('SVG parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error parsing SVG'
    };
  }
}
