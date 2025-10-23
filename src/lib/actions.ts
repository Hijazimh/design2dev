import { ActionDSLType } from './schemas';

export interface ActionWiringResult {
  success: boolean;
  files: Array<{ path: string; code: string }>;
  error?: string;
}

/**
 * Wire actions to forms based on Action DSL
 */
export function wire_action(
  actionDSL: ActionDSLType,
  context: Record<string, any> = {}
): ActionWiringResult {
  try {
    const files: Array<{ path: string; code: string }> = [];
    
    if (!actionDSL.type) {
      return {
        success: false,
        files: [],
        error: 'No action configuration provided'
      };
    }

    switch (actionDSL.type) {
      case 'http.post':
        files.push(generateWebhookAction(actionDSL.url, context));
        break;
        
      default:
        return {
          success: false,
          files: [],
          error: 'Unknown action type'
        };
    }

    return {
      success: true,
      files
    };

  } catch (error) {
    return {
      success: false,
      files: [],
      error: error instanceof Error ? error.message : 'Unknown error wiring action'
    };
  }
}

/**
 * Generate webhook action code
 */
function generateWebhookAction(url: string, context: Record<string, any>): { path: string; code: string } {
  const componentName = context.componentName || 'GeneratedComponent';
  
  const code = `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

interface ${componentName}Props {
  className?: string;
}

export default function ${componentName}({ className = '' }: ${componentName}Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());

      const response = await fetch('${url}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      const result = await response.json();
      setSuccess(true);
      console.log('Form submitted successfully:', result);
      
      // Reset form
      (e.target as HTMLFormElement).reset();
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={\`\${className}\`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields will be generated here */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Enter title"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter description"
              rows={4}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">Form submitted successfully!</p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </div>
  );
}`;

  return {
    path: `/components/generated/${componentName}.tsx`,
    code
  };
}

/**
 * Generate OpenAPI action code
 */
function generateOpenAPIAction(
  specUrl: string, 
  operationId: string, 
  context: Record<string, any>
): { path: string; code: string } {
  const componentName = context.componentName || 'GeneratedComponent';
  
  const code = `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ${componentName}Props {
  className?: string;
}

export default function ${componentName}({ className = '' }: ${componentName}Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());

      // This would use the OpenAPI client generated from the spec
      // For now, we'll make a generic API call
      const response = await fetch('/api/openapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specUrl: '${specUrl}',
          operationId: '${operationId}',
          data
        }),
      });

      if (!response.ok) {
        throw new Error(\`API error! status: \${response.status}\`);
      }

      const result = await response.json();
      setSuccess(true);
      console.log('API call successful:', result);
      
    } catch (error) {
      console.error('Error calling API:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={\`\${className}\`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="field1" className="block text-sm font-medium mb-2">
              Field 1
            </label>
            <Input
              id="field1"
              name="field1"
              type="text"
              required
              placeholder="Enter value"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">Operation completed successfully!</p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </Button>
      </form>
    </div>
  );
}`;

  return {
    path: `/components/generated/${componentName}.tsx`,
    code
  };
}

/**
 * Generate Supabase action code
 */
function generateSupabaseAction(table: string, context: Record<string, any>): { path: string; code: string } {
  const componentName = context.componentName || 'GeneratedComponent';
  
  const code = `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ${componentName}Props {
  className?: string;
}

export default function ${componentName}({ className = '' }: ${componentName}Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());

      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: '${table}',
          data
        }),
      });

      if (!response.ok) {
        throw new Error(\`Database error! status: \${response.status}\`);
      }

      const result = await response.json();
      setSuccess(true);
      console.log('Data inserted successfully:', result);
      
    } catch (error) {
      console.error('Error inserting data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={\`\${className}\`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Enter name"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">Data saved successfully!</p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </div>
  );
}`;

  return {
    path: `/components/generated/${componentName}.tsx`,
    code
  };
}

/**
 * Generate GraphQL action code
 */
function generateGraphQLAction(
  endpoint: string, 
  document: string, 
  context: Record<string, any>
): { path: string; code: string } {
  const componentName = context.componentName || 'GeneratedComponent';
  
  const code = `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ${componentName}Props {
  className?: string;
}

export default function ${componentName}({ className = '' }: ${componentName}Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: '${endpoint}',
          query: \`${document}\`,
          variables: data
        }),
      });

      if (!response.ok) {
        throw new Error(\`GraphQL error! status: \${response.status}\`);
      }

      const result = await response.json();
      setSuccess(true);
      console.log('GraphQL mutation successful:', result);
      
    } catch (error) {
      console.error('Error executing GraphQL mutation:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={\`\${className}\`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="input" className="block text-sm font-medium mb-2">
              Input
            </label>
            <Input
              id="input"
              name="input"
              type="text"
              required
              placeholder="Enter value"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">Mutation executed successfully!</p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Executing...' : 'Execute'}
        </Button>
      </form>
    </div>
  );
}`;

  return {
    path: `/components/generated/${componentName}.tsx`,
    code
  };
}
