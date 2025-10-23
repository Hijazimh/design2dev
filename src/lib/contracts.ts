import { z } from "zod";

/** What we infer from the SVG (semantic, library-agnostic) */
export const Layout = z.object({
  display: z.enum(["flex","grid","block"]).default("flex"),
  direction: z.enum(["row","column"]).optional(),
  gap: z.number().optional(),
  padding: z.number().optional(),
  columns: z.number().optional(),
  align: z.enum(["start","center","end","between","around"]).optional(),
  justify: z.enum(["start","center","end","between","around"]).optional(),
});

export const Style = z.object({
  bg: z.string().optional(),
  color: z.string().optional(),
  radius: z.number().optional(),
  shadow: z.enum(["sm","md","lg"]).optional(),
  border: z.boolean().optional(),
});

const TextNode = z.object({ 
  type: z.literal("Text"), 
  role: z.enum(["h1","h2","h3","p","span"]).default("p"), 
  content: z.string(), 
  style: Style.partial().optional() 
});

const ImageNode = z.object({ 
  type: z.literal("Image"), 
  src: z.string().optional(), 
  alt: z.string().optional(), 
  style: Style.partial().optional() 
});

const Field = z.object({ 
  name: z.string(), 
  label: z.string().optional(), 
  component: z.enum(["Input","Textarea","Select","Checkbox","Switch","Button"]), 
  required: z.boolean().optional(), 
  options: z.array(z.string()).optional(), 
  placeholder: z.string().optional() 
});

const FormNode = z.object({ 
  type: z.literal("Form"), 
  name: z.string(), 
  fields: z.array(Field), 
  style: Style.partial().optional() 
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
      children: z.array(UINode).default([]) 
    }),
    z.object({ 
      type: z.literal("List"), 
      items: z.array(z.any()), 
      style: Style.partial().optional() 
    }),
    z.object({ 
      type: z.literal("Button"), 
      label: z.string(), 
      style: Style.partial().optional() 
    }),
    z.object({ 
      type: z.literal("Icon"), 
      name: z.string(), 
      style: Style.partial().optional() 
    }),
  ])
);

export const UITree = z.object({ 
  type: z.literal("Frame"), 
  layout: Layout.partial().optional(), 
  style: Style.partial().optional(), 
  children: z.array(UINode) 
});

export type UITree = z.infer<typeof UITree>;

/** Component palette entry the agent can choose */
export const PaletteEntry = z.object({
  key: z.string(), // "ui.button"
  lib: z.enum(["html","shadcn","mui"]).default("html"),
  import: z.string().optional(), // e.g. `import { Button } from "@/components/ui/button"`
  tag: z.string(), // e.g. "button" or "Button"
  defaultProps: z.record(z.string(), z.any()).optional(),
  tailwind: z.string().optional(),
  matchHints: z.array(z.string()).optional(), // "rounded", "primary", "submit"
});

export type PaletteEntry = z.infer<typeof PaletteEntry>;

/** BuildPlan: specific instances of palette components assembled into a tree */
export const BuildNode = z.object({
  componentKey: z.string(), // must exist in palette
  props: z.record(z.string(), z.any()).optional(),
  tailwind: z.string().optional(),
  children: z.array(z.any()).optional(), // nested BuildNodes or string
});

export const BuildPlan = z.object({
  name: z.string(), // Component name
  imports: z.array(z.string()).default([]),
  root: BuildNode,  // top-level wrapper
});

export type BuildPlan = z.infer<typeof BuildPlan>;

/** Patch DSL for chat edits */
export const PatchOp = z.union([
  z.object({ 
    op: z.literal("addClass"), 
    file: z.string(), 
    jsx: z.string(), 
    className: z.string() 
  }),
  z.object({ 
    op: z.literal("removeClass"), 
    file: z.string(), 
    jsx: z.string(), 
    className: z.string() 
  }),
  z.object({ 
    op: z.literal("replaceClass"), 
    file: z.string(), 
    jsx: z.string(), 
    from: z.string(), 
    to: z.string() 
  }),
  z.object({ 
    op: z.literal("setAttribute"), 
    file: z.string(), 
    jsx: z.string(), 
    name: z.string(), 
    value: z.string() 
  }),
  z.object({ 
    op: z.literal("insertAfter"), 
    file: z.string(), 
    targetJsx: z.string(), 
    code: z.string() 
  }),
  z.object({ 
    op: z.literal("textEdit"), 
    file: z.string(), 
    find: z.string(), 
    replace: z.string() 
  }),
]);

export const PatchRequest = z.object({ 
  ops: z.array(PatchOp).min(1) 
});

export type PatchRequest = z.infer<typeof PatchRequest>;
