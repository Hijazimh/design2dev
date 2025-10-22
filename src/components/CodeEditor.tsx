'use client';

import { Editor } from '@monaco-editor/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange?: (value: string) => void;
  onApplyPatch?: () => void;
  className?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ 
  code, 
  language = 'typescript',
  onChange,
  onApplyPatch,
  className = '',
  readOnly = false
}: CodeEditorProps) {
  const [isModified, setIsModified] = useState(false);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setIsModified(true);
      onChange?.(value);
    }
  };

  const handleApplyPatch = () => {
    setIsModified(false);
    onApplyPatch?.();
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Generated Code</span>
          {isModified && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Modified
            </span>
          )}
        </div>
        {onApplyPatch && (
          <Button 
            size="sm" 
            onClick={handleApplyPatch}
            disabled={!isModified}
          >
            Apply Changes
          </Button>
        )}
      </div>
      <Editor
        height="400px"
        language={language}
        value={code}
        onChange={handleEditorChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          theme: 'vs-light'
        }}
      />
    </div>
  );
}
