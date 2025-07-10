# Zod Validation Schemas Guide

**Document ID:** ENG-GUIDE-001
**Created:** January 17, 2025
**Owner:** Engineering Team
**Tags:** #validation #zod #typescript #security #data-integrity

## Overview

**Zod** is a TypeScript-first schema validation library that provides runtime validation, automatic type generation, and clear error messages. It's a critical component of our data integrity and security strategy.

## What is Zod?

Zod allows you to:
1. **Define data structures** (schemas) with validation rules
2. **Validate data at runtime** (especially user input and API requests)
3. **Generate TypeScript types** automatically from your schemas
4. **Provide clear error messages** when validation fails

Think of it as a "contract" that describes what valid data should look like.

## Why We Use Zod

### The Problem Without Validation

```typescript
// ❌ DANGEROUS: No validation
export async function POST(req: NextRequest) {
  const body = await req.json();

  // What if body.name is undefined? Or 500 characters long?
  // What if body.priority is "hello" instead of a number?
  // What if body.scope is "InvalidScope"?

  await database.insert({
    name: body.name,        // Could be anything!
    priority: body.priority, // Could crash the database!
    scope: body.scope       // Could break business logic!
  });
}
```

### The Solution With Zod

```typescript
// ✅ SAFE: Validated input
import { z } from 'zod';

const CreateContextSchema = z.object({
  name: z.string().min(1).max(100),
  priority: z.number().int().min(1).max(100),
  scope: z.enum(['Personal', 'Team', 'Organizational', 'Global'])
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  // This will throw an error if data is invalid
  const validatedData = CreateContextSchema.parse(body);

  // Now we KNOW the data is safe to use
  await database.insert(validatedData);
}
```

## Core Zod Concepts

### 1. Basic Types

```typescript
import { z } from 'zod';

// Primitive types
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const dateSchema = z.date();

// Arrays
const stringArraySchema = z.array(z.string());
const numberArraySchema = z.array(z.number());

// Objects
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email()
});

// Enums
const statusSchema = z.enum(['active', 'inactive', 'pending']);
```

### 2. Validation Rules

```typescript
// String validations
z.string()
  .min(1, 'Required')                    // Minimum length
  .max(100, 'Too long')                  // Maximum length
  .email('Invalid email')                // Email format
  .url('Invalid URL')                    // URL format
  .regex(/^[A-Z]+$/, 'Must be uppercase') // Custom regex
  .trim()                               // Remove whitespace
  .toLowerCase()                        // Convert to lowercase

// Number validations
z.number()
  .int('Must be integer')               // Whole numbers only
  .positive('Must be positive')         // > 0
  .negative('Must be negative')         // < 0
  .min(1, 'Must be at least 1')        // Minimum value
  .max(100, 'Must be at most 100')     // Maximum value

// Optional and nullable
z.string().optional()                   // Can be undefined
z.string().nullable()                   // Can be null
z.string().nullish()                    // Can be null or undefined

// Default values
z.string().default('default value')     // Provides default if missing
z.number().default(0)                   // Numeric default
```

### 3. Complex Validations

```typescript
// Custom validation with refine
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain uppercase letter'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Password must contain number'
  );

// Conditional validation
const userSchema = z.object({
  type: z.enum(['admin', 'user']),
  adminLevel: z.string().optional()
}).refine(
  (data) => data.type !== 'admin' || data.adminLevel,
  {
    message: 'Admin level is required for admin users',
    path: ['adminLevel']
  }
);

// Transform data during validation
const numberStringSchema = z.string().transform((val) => parseInt(val, 10));
```

## Automatic TypeScript Types

One of Zod's most powerful features is automatic type generation:

```typescript
// Define the schema once
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  isActive: z.boolean(),
  roles: z.array(z.enum(['admin', 'user', 'moderator'])),
  createdAt: z.date(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean()
  }).optional()
});

// Get the TypeScript type automatically!
export type User = z.infer<typeof UserSchema>;

// Now you have full type safety:
function processUser(user: User) {
  console.log(user.name);           // ✅ String
  console.log(user.age);            // ✅ Number
  console.log(user.isActive);       // ✅ Boolean
  console.log(user.roles[0]);       // ✅ 'admin' | 'user' | 'moderator'
  console.log(user.preferences?.theme); // ✅ 'light' | 'dark' | undefined
  console.log(user.invalidField);   // ❌ TypeScript error!
}
```

## Real-World Examples from LeaderForge

### 1. Prompt Context Validation

```typescript
// File: apps/web/lib/validation/contextSchemas.ts

import { z } from 'zod';

// Scope enum for prompt contexts
export const ContextScopeEnum = z.enum(['Personal', 'Team', 'Organizational', 'Global']);

// Template variables schema - key-value pairs where both are strings
export const TemplateVariablesSchema = z.record(z.string(), z.string()).optional();

// Core prompt context schema
export const PromptContextSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less')
    .trim(),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be 10,000 characters or less')
    .trim(),
  scope: ContextScopeEnum,
  priority: z.number()
    .int('Priority must be a whole number')
    .min(1, 'Priority must be at least 1')
    .max(100, 'Priority must be at most 100'),
  template_variables: TemplateVariablesSchema,
  created_by: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  is_editable: z.boolean().optional()
});

// Schema for creating new contexts (excludes id, timestamps, etc.)
export const CreateContextSchema = PromptContextSchema.omit({
  id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  is_editable: true
});

// Schema for updating existing contexts (makes most fields optional)
export const UpdateContextSchema = PromptContextSchema.partial().extend({
  id: z.string().uuid() // ID is required for updates
});

// Export types
export type PromptContext = z.infer<typeof PromptContextSchema>;
export type CreateContext = z.infer<typeof CreateContextSchema>;
export type UpdateContext = z.infer<typeof UpdateContextSchema>;
```

**Why each validation rule matters:**
- **`min(1)`**: Prevents empty strings that would break the UI
- **`max(100)`**: Prevents database overflow and UI layout issues
- **`trim()`**: Removes accidental whitespace that users might add
- **`enum()`**: Ensures only valid business values are accepted
- **`int()`**: Prevents decimal priorities that don't make sense
- **`uuid()`**: Ensures proper ID format for database relations

### 2. API Request Validation

```typescript
// File: apps/web/app/api/context/route.ts

import { CreateContextSchema } from '../../../lib/validation/contextSchemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body with Zod schema
    let validatedData;
    try {
      validatedData = CreateContextSchema.parse(body);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid context data',
        details: error instanceof Error ? error.message : 'Validation failed'
      }, { status: 400 });
    }

    // Now we can safely use validatedData
    const { data: context, error } = await supabase
      .schema('core')
      .from('prompt_contexts')
      .insert({
        name: validatedData.name,           // ✅ Guaranteed to be 1-100 chars
        description: validatedData.description, // ✅ Guaranteed to be 1-500 chars
        content: validatedData.content,     // ✅ Guaranteed to be 1-10000 chars
        context_type: validatedData.scope,  // ✅ Guaranteed to be valid enum
        priority: validatedData.priority,   // ✅ Guaranteed to be 1-100 integer
        template_variables: validatedData.template_variables, // ✅ Guaranteed format
        tenant_key: tenantKey,
        created_by: session.user.id,
        is_active: true
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      message: 'Context created successfully',
      context
    }, { status: 201 });

  } catch (error) {
    console.error('[Context API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3. Complex Custom Validation

```typescript
// Template variables validation with custom logic
export const TemplateVariablesTextSchema = z.string()
  .optional()
  .refine((value) => {
    if (!value || !value.trim()) return true; // Empty is valid

    const lines = value.trim().split('\n');
    for (const line of lines) {
      if (line.trim() && !line.includes('=')) {
        return false; // Invalid format
      }
    }
    return true;
  }, {
    message: 'Template variables must be in key=value format (one per line)'
  });

// Helper function to parse validated template variables
export function parseTemplateVariables(text: string): Record<string, string> {
  const variables: Record<string, string> = {};

  if (!text || !text.trim()) {
    return variables;
  }

  const lines = text.trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        variables[key.trim()] = valueParts.join('=').trim();
      }
    }
  }

  return variables;
}
```

## Error Handling Patterns

### 1. API Error Responses

```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateContextSchema.parse(body);

    // Process validated data...

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }

    // Handle other errors
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

### 2. Frontend Form Validation

```typescript
// In React component
const validateForm = (): boolean => {
  const newErrors: FormErrors = {};

  try {
    // Validate the entire form data
    CreateContextSchema.parse(formData);

    // Also validate template variables text format
    TemplateVariablesTextSchema.parse(templateVariablesText);

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert Zod errors to form errors
      for (const zodError of error.errors) {
        const fieldPath = zodError.path.join('.');
        newErrors[fieldPath as keyof FormErrors] = zodError.message;
      }
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Benefits in Our System

### 1. **Security**: Prevents malicious input
```typescript
// ❌ Without Zod: SQL injection risk
const maliciousInput = "'; DROP TABLE contexts; --";

// ✅ With Zod: Caught and rejected
CreateContextSchema.parse({ name: maliciousInput }); // Throws error if validation fails
```

### 2. **Data Integrity**: Ensures consistent data
```typescript
// ❌ Without Zod: Invalid data in database
{ name: "", priority: -5, scope: "InvalidScope" }

// ✅ With Zod: Only valid data gets through
{ name: "My Context", priority: 1, scope: "Personal" }
```

### 3. **Developer Experience**: Clear errors
```typescript
// ❌ Without Zod: Mysterious runtime errors
TypeError: Cannot read property 'name' of undefined

// ✅ With Zod: Clear validation errors
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "priority",
      "message": "Expected number, received string"
    }
  ]
}
```

### 4. **Type Safety**: Prevents bugs
```typescript
// ❌ Without Zod: Runtime errors
function updateContext(context: any) {
  context.nam = "typo";  // Typo creates bug
}

// ✅ With Zod: Compile-time errors
function updateContext(context: PromptContext) {
  context.nam = "typo";  // ❌ TypeScript catches this!
}
```

## Best Practices

### 1. **Schema Organization**
```typescript
// ✅ Good: Organized in dedicated files
// File: apps/web/lib/validation/contextSchemas.ts
// File: apps/web/lib/validation/userSchemas.ts
// File: apps/web/lib/validation/entitlementSchemas.ts

// ❌ Bad: Scattered throughout codebase
```

### 2. **Error Messages**
```typescript
// ✅ Good: Clear, user-friendly messages
z.string().min(1, 'Name is required')
z.string().max(100, 'Name must be 100 characters or less')
z.number().int('Priority must be a whole number')

// ❌ Bad: Generic or unclear messages
z.string().min(1)  // No message
z.string().max(100, 'Too long')  // Unclear what "too long" means
```

### 3. **Schema Composition**
```typescript
// ✅ Good: Reusable base schemas
const BaseContextSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500)
});

const CreateContextSchema = BaseContextSchema.extend({
  content: z.string().min(1).max(10000),
  scope: ContextScopeEnum
});

const UpdateContextSchema = BaseContextSchema.partial().extend({
  id: z.string().uuid()
});

// ❌ Bad: Duplicated validation rules
```

### 4. **Type Exports**
```typescript
// ✅ Good: Export types alongside schemas
export const UserSchema = z.object({...});
export type User = z.infer<typeof UserSchema>;

// ❌ Bad: Separate type definitions that can get out of sync
export interface User {
  // Manual type definition that might not match schema
}
```

## Common Patterns

### 1. **Optional Fields with Defaults**
```typescript
const ConfigSchema = z.object({
  theme: z.enum(['light', 'dark']).default('light'),
  notifications: z.boolean().default(true),
  maxResults: z.number().int().min(1).max(100).default(20)
});
```

### 2. **Nested Objects**
```typescript
const UserPreferencesSchema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email()
  }),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean()
  }),
  contexts: z.array(z.object({
    id: z.string().uuid(),
    enabled: z.boolean()
  }))
});
```

### 3. **Union Types**
```typescript
const NotificationSchema = z.union([
  z.object({
    type: z.literal('email'),
    address: z.string().email()
  }),
  z.object({
    type: z.literal('sms'),
    phone: z.string().regex(/^\+?[\d\s-()]+$/)
  }),
  z.object({
    type: z.literal('push'),
    deviceId: z.string()
  })
]);
```

## Testing Schemas

```typescript
// Test valid data
describe('PromptContextSchema', () => {
  it('should validate correct context data', () => {
    const validContext = {
      name: 'Test Context',
      description: 'A test context',
      content: 'This is test content',
      scope: 'Personal' as const,
      priority: 1
    };

    expect(() => CreateContextSchema.parse(validContext)).not.toThrow();
  });

  it('should reject invalid data', () => {
    const invalidContext = {
      name: '', // Empty name
      description: 'A test context',
      content: 'This is test content',
      scope: 'InvalidScope', // Invalid scope
      priority: -1 // Invalid priority
    };

    expect(() => CreateContextSchema.parse(invalidContext)).toThrow();
  });
});
```

## Migration from Unvalidated Code

### Before (Dangerous)
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();

  // No validation - anything could happen!
  await database.insert(body);
}
```

### After (Safe)
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateContextSchema.parse(body);

    await database.insert(validatedData);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

## Conclusion

Zod is essential for building robust, secure applications. It provides:

- **Runtime validation** that catches bad data before it causes problems
- **Automatic TypeScript types** that prevent coding mistakes
- **Clear error messages** that help users fix their input
- **Consistent data structures** throughout the application
- **Security** by preventing malicious input

Every API endpoint, form, and data structure in LeaderForge should use Zod validation to ensure data integrity and system reliability.

## Resources

- **Zod Documentation**: https://zod.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Our Validation Schemas**: `apps/web/lib/validation/`
- **Example Usage**: `apps/web/app/api/context/route.ts`

---

**Last Updated:** January 17, 2025
**Next Review:** February 17, 2025
**Version:** 1.0