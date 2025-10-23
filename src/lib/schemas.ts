import { z } from "zod";

export const Layout = z.object({
  display: z.enum(["flex", "grid", "block"]).default("flex"),
  direction: z.enum(["row", "column"]).optional(),
  gap: z.number().optional(),
  padding: z.number().optional(),
  columns: z.number().optional(),
  align: z.enum(["start", "center", "end", "between", "around"]).optional(),
  justify: z.enum(["start", "center", "end", "between", "around"]).optional(),
});

export const Style = z.object({
  bg: z.string().optional(),
  color: z.string().optional(),
  radius: z.number().optional(),
  shadow: z.enum(["sm", "md", "lg"]).optional(),
  border: z.boolean().optional(),
});

const TextNode = z.object({
  type: z.literal("Text"),
  role: z.enum(["h1", "h2", "h3", "p", "span"]).default("p"),
  content: z.string(),
  style: Style.partial().optional(),
});

const ImageNode = z.object({
  type: z.literal("Image"),
  src: z.string(),
  alt: z.string().default(""),
  style: Style.partial().optional(),
});

const Field = z.object({
  name: z.string(),
  label: z.string().optional(),
  component: z.enum(["Input", "Textarea", "Select", "Checkbox", "Switch", "Button"]),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

const FormNode = z.object({
  type: z.literal("Form"),
  name: z.string(),
  fields: z.array(Field),
  style: Style.partial().optional(),
  actions: z.object({
    onSubmit: z
      .object({ type: z.literal("http.post"), url: z.string() })
      .optional(),
  }).optional(),
});

export const UINode: z.ZodType<any> = z.lazy(() =>
  z.union([
    TextNode,
    ImageNode,
    FormNode,
    z.object({
      type: z.literal("Frame"),
      layout: Layout.partial().optional(),
      style: Style.partial().optional(),
      children: z.array(UINode).default([]),
    }),
  ])
);

export const UITree = z.object({
  type: z.literal("Frame"),
  layout: Layout.partial().optional(),
  style: Style.partial().optional(),
  children: z.array(UINode),
});

export const ActionDSL = z.object({
  type: z.literal("http.post"),
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.record(z.string(), z.any()).optional(),
});

export const PatchOp = z.union([
  z.object({
    op: z.literal("addClass"),
    file: z.string(),
    jsx: z.string(),
    className: z.string(),
  }),
  z.object({
    op: z.literal("removeClass"),
    file: z.string(),
    jsx: z.string(),
    className: z.string(),
  }),
  z.object({
    op: z.literal("replaceClass"),
    file: z.string(),
    jsx: z.string(),
    from: z.string(),
    to: z.string(),
  }),
  z.object({
    op: z.literal("setAttribute"),
    file: z.string(),
    jsx: z.string(),
    name: z.string(),
    value: z.string(),
  }),
  z.object({
    op: z.literal("insertAfter"),
    file: z.string(),
    targetJsx: z.string(),
    code: z.string(),
  }),
  z.object({
    op: z.literal("textEdit"),
    file: z.string(),
    jsx: z.string(),
    find: z.string(),
    replace: z.string(),
  }),
]);

export const PatchRequest = z.object({
  ops: z.array(PatchOp).min(1),
});

// Type exports
export type LayoutType = z.infer<typeof Layout>;
export type StyleType = z.infer<typeof Style>;
export type UINodeType = z.infer<typeof UINode>;
export type UITreeType = z.infer<typeof UITree>;
export type ActionDSLType = z.infer<typeof ActionDSL>;
export type PatchOpType = z.infer<typeof PatchOp>;
export type PatchRequestType = z.infer<typeof PatchRequest>;