'use client';

import { Sandpack } from '@codesandbox/sandpack-react';
import { useState, useEffect } from 'react';

interface CanvasPreviewProps {
  files: Record<string, string>;
  componentName?: string;
  className?: string;
}

export default function CanvasPreview({ 
  files, 
  componentName = 'GeneratedComponent',
  className = '' 
}: CanvasPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for preview
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [files]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  const sandpackFiles = {
    '/App.tsx': {
      code: `import ${componentName} from './components/${componentName}';

export default function App() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <${componentName} />
    </div>
  );
}`,
    },
    '/components/GeneratedComponent.tsx': {
      code: files[`/components/${componentName}.tsx`] || files['/components/GeneratedComponent.tsx'] || '',
    },
    '/components/ui/button.tsx': {
      code: `import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <button
        className={\`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 \${className}\`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }`,
    },
    '/components/ui/input.tsx': {
      code: `import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={\`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 \${className}\`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }`,
    },
    '/components/ui/textarea.tsx': {
      code: `import * as React from "react"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        className={\`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 \${className}\`}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }`,
    },
    '/components/ui/select.tsx': {
      code: `import * as React from "react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        className={\`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 \${className}\`}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }`,
    },
    '/lib/utils.ts': {
      code: `export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}`,
    },
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <Sandpack
        template="react-ts"
        files={sandpackFiles}
        options={{
          showNavigator: false,
          showTabs: false,
          showLineNumbers: false,
          showRefreshButton: true,
          editorHeight: 400,
        }}
        theme="light"
      />
    </div>
  );
}
