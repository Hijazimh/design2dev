import type { PaletteEntry } from "./contracts";

export const PALETTE: Record<string, PaletteEntry> = {
  "layout.card":   { 
    key: "layout.card", 
    lib: "html", 
    tag: "div", 
    tailwind: "rounded-2xl shadow-md p-6 bg-white",
    matchHints: ["card", "container", "box", "panel"]
  },
  "layout.stack":  { 
    key: "layout.stack", 
    lib: "html", 
    tag: "div", 
    tailwind: "flex flex-col gap-4",
    matchHints: ["stack", "column", "vertical", "list"]
  },
  "layout.row":    { 
    key: "layout.row", 
    lib: "html", 
    tag: "div", 
    tailwind: "flex flex-row gap-4",
    matchHints: ["row", "horizontal", "inline"]
  },
  "layout.grid":   { 
    key: "layout.grid", 
    lib: "html", 
    tag: "div", 
    tailwind: "grid gap-4",
    matchHints: ["grid", "table", "matrix"]
  },
  "typography.h1": { 
    key: "typography.h1", 
    lib: "html", 
    tag: "h1", 
    tailwind: "text-2xl font-semibold",
    matchHints: ["title", "heading", "header", "main"]
  },
  "typography.h2": { 
    key: "typography.h2", 
    lib: "html", 
    tag: "h2", 
    tailwind: "text-xl font-semibold",
    matchHints: ["subtitle", "section", "secondary"]
  },
  "typography.h3": { 
    key: "typography.h3", 
    lib: "html", 
    tag: "h3", 
    tailwind: "text-lg font-medium",
    matchHints: ["subheading", "small-title"]
  },
  "typography.p":  { 
    key: "typography.p",  
    lib: "html", 
    tag: "p",  
    tailwind: "text-sm text-gray-600",
    matchHints: ["text", "description", "content", "body"]
  },
  "typography.span": { 
    key: "typography.span", 
    lib: "html", 
    tag: "span", 
    tailwind: "text-sm",
    matchHints: ["inline", "label", "small-text"]
  },
  "form.input":    { 
    key: "form.input",    
    lib: "html", 
    tag: "input",  
    tailwind: "border rounded-md px-3 py-2 w-full",
    matchHints: ["input", "field", "text-input", "search"]
  },
  "form.textarea": { 
    key: "form.textarea", 
    lib: "html", 
    tag: "textarea", 
    tailwind: "border rounded-md px-3 py-2 w-full",
    matchHints: ["textarea", "multiline", "description", "comment"]
  },
  "form.select":   { 
    key: "form.select",   
    lib: "html", 
    tag: "select", 
    tailwind: "border rounded-md px-3 py-2 w-full",
    matchHints: ["select", "dropdown", "choice", "option"]
  },
  "form.button":   { 
    key: "form.button",   
    lib: "html", 
    tag: "button", 
    tailwind: "bg-black text-white rounded-md px-4 py-2",
    matchHints: ["button", "submit", "action", "click", "primary"]
  },
  "form.button.secondary": { 
    key: "form.button.secondary", 
    lib: "html", 
    tag: "button", 
    tailwind: "bg-gray-200 text-gray-800 rounded-md px-4 py-2",
    matchHints: ["secondary", "cancel", "back", "outline"]
  },
  "list.ul":       { 
    key: "list.ul",       
    lib: "html", 
    tag: "ul", 
    tailwind: "divide-y",
    matchHints: ["list", "items", "menu", "navigation"]
  },
  "list.li":       { 
    key: "list.li",       
    lib: "html", 
    tag: "li", 
    tailwind: "px-4 py-2",
    matchHints: ["item", "entry", "row"]
  },
  "media.img":     { 
    key: "media.img",     
    lib: "html", 
    tag: "img", 
    tailwind: "rounded-md",
    matchHints: ["image", "photo", "picture", "avatar"]
  },
  "icon.button":   { 
    key: "icon.button",   
    lib: "html", 
    tag: "button", 
    tailwind: "p-2 rounded-md hover:bg-gray-100",
    matchHints: ["icon", "symbol", "emoji", "glyph"]
  },
};
