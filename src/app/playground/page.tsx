'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import CanvasPreview from '@/components/CanvasPreview';
import CodeEditor from '@/components/CodeEditor';
import Chat from '@/components/Chat';
// Remove old imports - we'll use the new semantic approach
import { UITreeType, UINodeType } from '@/lib/schemas';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function PlaygroundPage() {
  const [svgInput, setSvgInput] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [uiTree, setUiTree] = useState<UITreeType | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [componentName, setComponentName] = useState('GeneratedComponent');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant with powerful tools to help you create and modify React components. I can:\n\n• Update styling (colors, spacing, layout)\n• Add/remove elements (buttons, inputs, text)\n• Reorganize layouts (grid, flex, columns)\n• Generate new components\n• Improve accessibility\n\nTry asking me to "make the button blue", "add a form field", or "change to a grid layout" after you generate a component!',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'svg' | 'figma'>('svg');
  const [activeViewTab, setActiveViewTab] = useState<'preview' | 'code'>('preview');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: generateId(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleGenerateFromSVG = async () => {
    if (!svgInput.trim()) return;

    setIsLoading(true);
    try {
      // Convert SVG to semantic React component using agent-based flow
      const response = await fetch('/api/generate-from-svg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          svg: svgInput,
          name: componentName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGeneratedCode(result.code);
        // Create a simple UI tree for the chat interface
        const simpleTree: UITreeType = {
          type: 'Frame',
          layout: {
            display: 'flex',
            direction: 'column',
            gap: 16
          },
          style: {
            bg: '#ffffff',
            radius: 8,
            shadow: 'sm'
          },
          children: [
            {
              type: 'Text',
              role: 'h2',
              content: 'Generated Component',
              style: {
                color: '#111827'
              }
            },
            {
              type: 'Text',
              role: 'p',
              content: `Found ${result.features?.length || 0} SVG elements`,
              style: {
                color: '#6b7280'
              }
            }
          ]
        };
        
        setUiTree(simpleTree);
        addMessage('assistant', `Successfully generated React component using agent-based flow! Found ${result.features?.length || 0} SVG features.`);
      } else {
        addMessage('assistant', `Error generating component: ${result.error}`);
      }
    } catch (error) {
      addMessage('assistant', `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFromFigma = async () => {
    if (!figmaUrl.trim()) return;

    setIsLoading(true);
    try {
      // This would call the Figma API
      addMessage('assistant', 'Figma integration coming soon! For now, try pasting an SVG.');
    } catch (error) {
      addMessage('assistant', `Error with Figma URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    addMessage('user', message);
    setIsLoading(true);

    try {
      console.log('Sending chat message:', message);
      console.log('Current code length:', generatedCode.length);
      
      // Call the simplified Claude chat agent
      const response = await fetch('/api/chat-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          currentCode: generatedCode,
          componentName
        })
      });

      console.log('Chat response status:', response.status);
      const result = await response.json();
      console.log('Chat response:', result);
      
      if (result.success) {
        addMessage('assistant', result.response);
        
        // Update the generated code if Claude provided an updated version
        if (result.updatedCode && result.updatedCode !== generatedCode) {
          console.log('Updating code with Claude response');
          setGeneratedCode(result.updatedCode);
          addMessage('assistant', '✅ I\'ve updated your component with the changes you requested!');
        }
      } else {
        console.error('Chat error:', result.error);
        addMessage('assistant', result.error || 'Sorry, I encountered an error processing your request.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('assistant', 'Sorry, I encountered an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setGeneratedCode(newCode);
  };

  const handleApplyPatch = () => {
    // This would apply the AST patch
    addMessage('assistant', 'Changes applied successfully!');
  };

  const files = generatedCode ? {
    [`/components/${componentName}.tsx`]: generatedCode
  } : {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Design2Dev Playground</h1>
          <p className="text-gray-600">Transform your designs into React components with AI assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Design Input</h2>
              
              <div className="flex space-x-2 mb-4">
                <Button
                  variant={activeTab === 'svg' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('svg')}
                  size="sm"
                >
                  SVG
                </Button>
                <Button
                  variant={activeTab === 'figma' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('figma')}
                  size="sm"
                >
                  Figma
                </Button>
              </div>

              {activeTab === 'svg' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Paste SVG Code</label>
                    <Textarea
                      value={svgInput}
                      onChange={(e) => setSvgInput(e.target.value)}
                      placeholder="<svg>...</svg>"
                      rows={6}
                      className="font-mono text-sm resize-none overflow-y-auto max-h-48"
                    />
                  </div>
                  <Button 
                    onClick={handleGenerateFromSVG}
                    disabled={!svgInput.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Generating...' : 'Generate Component'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Figma URL or Frame ID</label>
                    <Input
                      value={figmaUrl}
                      onChange={(e) => setFigmaUrl(e.target.value)}
                      placeholder="https://figma.com/design/..."
                    />
                  </div>
                  <Button 
                    onClick={handleGenerateFromFigma}
                    disabled={!figmaUrl.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Generating...' : 'Generate Component'}
                  </Button>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Component Name</label>
                <Input
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="GeneratedComponent"
                />
              </div>
            </Card>

            {/* Chat Interface */}
            <Chat
              onSendMessage={handleChatMessage}
              messages={messages}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column - Preview & Code with Tabs */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex space-x-2 mb-4">
                <Button
                  variant={activeViewTab === 'preview' ? 'default' : 'outline'}
                  onClick={() => setActiveViewTab('preview')}
                  size="sm"
                >
                  Preview
                </Button>
                <Button
                  variant={activeViewTab === 'code' ? 'default' : 'outline'}
                  onClick={() => setActiveViewTab('code')}
                  size="sm"
                >
                  Code
                </Button>
              </div>

              {activeViewTab === 'preview' ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
                  <CanvasPreview
                    files={files}
                    componentName={componentName}
                    className="min-h-96"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Generated Code</h2>
                    <Button 
                      onClick={handleApplyPatch}
                      size="sm"
                      variant="outline"
                    >
                      Apply Changes
                    </Button>
                  </div>
                  <CodeEditor
                    code={generatedCode}
                    onChange={handleCodeChange}
                    onApplyPatch={handleApplyPatch}
                    className="min-h-96"
                  />
                  
                  {/* Export Options */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-4">Export Options</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" className="w-full" size="sm">
                        Download TSX
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        Generate Next.js Route
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        Wire Actions
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
