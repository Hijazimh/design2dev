import { z } from "zod";

// Layout schema for flex/grid layouts
export const Layout = z.object({
  display: z.enum(["flex", "grid", "block"]).default("flex"),
  direction: z.enum(["row", "column"]).optional(),
  gap: z.number().optional(),
  padding: z.number().optional(),
  align: z.enum(["start", "center", "end", "between", "around"]).optional(),
  justify: z.enum(["start", "center", "end", "between", "around"]).optional(),
  columns: z.number().optional(), // for grid
});

// Style schema for visual properties
export const Style = z.object({
  bg: z.string().optional(),
  color: z.string().optional(),
  radius: z.number().optional(),
  shadow: z.enum(["sm", "md", "lg"]).optional(),
  border: z.string().optional(),
});

// Text node schema
const TextNode = z.object({
  type: z.literal("Text"),
  role: z.enum(["h1", "h2", "h3", "p", "span"]).default("p"),
  content: z.string(),
  style: Style.partial().optional(),
});

// Image node schema
const ImageNode = z.object({
  type: z.literal("Image"),
  src: z.string(),
  alt: z.string().default(""),
  style: Style.partial().optional(),
});

// Icon node schema
const IconNode = z.object({
  type: z.literal("Icon"),
  name: z.string(), // e.g., lucide icon name
  style: Style.partial().optional(),
});

// Form field schema
const Field = z.object({
  name: z.string(),
  label: z.string().optional(),
  component: z.enum(["Input", "Textarea", "Select", "Checkbox", "Switch"]),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

// Form node schema
const FormNode = z.object({
  type: z.literal("Form"),
  name: z.string(),
  fields: z.array(Field),
  actions: z.any().optional(), // linked with ActionDSL
  style: Style.partial().optional(),
});

// Recursive UI node schema
export const UINode: z.ZodType<any> = z.lazy(() => z.union([
  TextNode, 
  ImageNode, 
  IconNode, 
  FormNode,
  z.object({
    type: z.literal("Frame"),
    layout: Layout.partial().optional(),
    style: Style.partial().optional(),
    children: z.array(UINode).default([]),
  })
]));

// Root UI tree schema
export const UITree = z.object({
  type: z.literal("Frame"),
  layout: Layout.partial().optional(),
  style: Style.partial().optional(),
  children: z.array(UINode),
});

// Action DSL for wiring actions
export const ActionDSL = z.object({
  onSubmit: z.union([
    z.object({ 
      type: z.literal("http.post"), 
      url: z.string(), 
      bodySchemaRef: z.string().optional() 
    }),
    z.object({ 
      type: z.literal("openapi.op"), 
      specUrl: z.string(), 
      operationId: z.string() 
    }),
    z.object({ 
      type: z.literal("supabase.insert"), 
      table: z.string() 
    }),
    z.object({ 
      type: z.literal("graphql.mutation"), 
      endpoint: z.string(), 
      document: z.string(), 
      variablesRef: z.string().optional(), 
      headers: z.record(z.string(), z.string()).optional() 
    })
  ]).optional()
});

// AST Patch operations
export const PatchOp = z.union([
  z.object({ 
    op: z.literal("renameProp"), 
    component: z.string(), 
    from: z.string(), 
    to: z.string() 
  }),
  z.object({ 
    op: z.literal("replaceClass"), 
    component: z.string(), 
    from: z.string(), 
    to: z.string() 
  }),
  z.object({ 
    op: z.literal("insertNodeAfter"), 
    target: z.string(), 
    code: z.string() 
  }),
  z.object({ 
    op: z.literal("updateLiteral"), 
    file: z.string(), 
    selector: z.string(), 
    value: z.any() 
  }),
]);

// Patch request schema
export const PatchRequest = z.object({
  file: z.string(), // e.g., /generated/FeatureRequestCard.tsx
  ops: z.array(PatchOp)
});

// Type exports
export type LayoutType = z.infer<typeof Layout>;
export type StyleType = z.infer<typeof Style>;
export type UITreeType = z.infer<typeof UITree>;
export type UINodeType = z.infer<typeof UINode>;
export type ActionDSLType = z.infer<typeof ActionDSL>;
export type PatchRequestType = z.infer<typeof PatchRequest>;
export type PatchOpType = z.infer<typeof PatchOp>;
