# Design2Dev - AI-Powered Design to Code

Transform your designs into production-ready React components with AI assistance. This MVP web app converts SVGs and Figma frames into dev-ready React (TypeScript + Tailwind + shadcn/ui), lets users iterate via chat, and wires actions (webhooks/OpenAPI/Supabase/GraphQL).

## Features

- 🎨 **SVG to React**: Parse SVG content into structured UI trees
- 🎯 **Figma Integration**: Import designs directly from Figma (coming soon)
- 🤖 **AI Chat Interface**: Iterate on designs through natural language
- 🔧 **AST-based Modifications**: Precise code changes via structured patches
- 🔗 **Action Wiring**: Connect forms to webhooks, APIs, and databases
- ♿ **Accessibility**: Built-in a11y checking and fixes
- 📱 **Live Preview**: Sandpack-powered browser preview
- 💻 **Code Editor**: Monaco editor with syntax highlighting

## Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui
- **AI**: Anthropic Claude with tool calling
- **Code Generation**: ts-morph for AST transformations
- **Preview**: Sandpack for in-browser execution
- **Parsing**: svgson for SVG parsing
- **Validation**: Zod schemas throughout

## Installation

1. **Clone and install dependencies:**
   ```bash
   cd design2dev
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   FIGMA_ACCESS_TOKEN=your_figma_access_token_here
   NEXT_PUBLIC_APP_NAME=Design2Dev
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Generate from SVG

1. Go to the playground at `/playground`
2. Paste your SVG code in the left panel
3. Click "Generate Component"
4. See the live preview and generated code

### 2. Iterate with AI Chat

1. Use the chat interface to request changes:
   - "Make the card radius larger"
   - "Switch to a grid layout with 2 columns"
   - "Add more spacing between elements"

2. The AI will apply AST patches to modify your code

### 3. Wire Actions

1. Click "Wire Actions" to connect forms to:
   - HTTP webhooks
   - OpenAPI endpoints
   - Supabase database
   - GraphQL mutations

### 4. Export

- Download generated TSX files
- Generate Next.js routes
- Copy code for use in your projects

## Sample SVG for Testing

Use this sample SVG to test the functionality:

```svg
<svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="360" height="260" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
  <text x="200" y="60" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" font-weight="600" fill="#111827">Feature Request Card</text>
  <text x="200" y="90" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" fill="#6B7280">Submit your ideas and feedback</text>
  
  <rect x="40" y="120" width="320" height="40" rx="8" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="1"/>
  <text x="50" y="140" font-family="Inter, sans-serif" font-size="14" fill="#374151">Title</text>
  <text x="50" y="155" font-family="Inter, sans-serif" font-size="14" fill="#9CA3AF">Enter a short summary</text>
  
  <rect x="40" y="180" width="320" height="60" rx="8" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="1"/>
  <text x="50" y="200" font-family="Inter, sans-serif" font-size="14" fill="#374151">Description</text>
  <text x="50" y="215" font-family="Inter, sans-serif" font-size="14" fill="#9CA3AF">Describe your idea in detail</text>
  
  <rect x="40" y="260" width="100" height="32" rx="16" fill="#3B82F6"/>
  <text x="90" y="280" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="500" fill="#FFFFFF">Submit</text>
</svg>
```

## Sample Chat Commands

Try these commands in the chat interface:

- **"Increase the card radius to 24px"** - Modifies border radius
- **"Switch to a grid layout with 2 columns on medium screens and up"** - Changes layout system
- **"Add more gap between elements"** - Increases spacing
- **"Make the form fields larger"** - Adjusts input sizing
- **"Add a shadow to the card"** - Applies visual effects

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agent/route.ts          # Claude agent endpoint
│   │   └── integrations/          # Action wiring endpoints
│   ├── playground/page.tsx         # Main playground UI
│   └── page.tsx                    # Redirects to playground
├── components/
│   ├── CanvasPreview.tsx          # Sandpack preview wrapper
│   ├── CodeEditor.tsx              # Monaco editor
│   ├── Chat.tsx                    # Chat interface
│   └── ui/                         # shadcn/ui components
└── lib/
    ├── schemas.ts                  # Zod schemas
    ├── svg.ts                      # SVG parsing
    ├── codegen.ts                  # React code generation
    ├── ast.ts                      # AST transformations
    ├── actions.ts                  # Action wiring
    ├── a11y.ts                     # Accessibility checking
    └── agent.ts                    # Claude integration
```

## API Endpoints

- `POST /api/agent` - Main AI agent endpoint
- `POST /api/integrations/webhook` - Webhook proxy
- `POST /api/integrations/openapi` - OpenAPI integration
- `POST /api/integrations/supabase` - Supabase integration
- `POST /api/integrations/graphql` - GraphQL integration

## Development

### Adding New Features

1. **New UI Components**: Add to `src/components/`
2. **New Schemas**: Extend `src/lib/schemas.ts`
3. **New Actions**: Add to `src/lib/actions.ts`
4. **New Tools**: Extend the agent in `src/lib/agent.ts`

### Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run build
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the GitHub issues
- Review the documentation
- Join our Discord community

---

**Happy coding! 🚀**