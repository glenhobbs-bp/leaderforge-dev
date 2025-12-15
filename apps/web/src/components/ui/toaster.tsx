/**
 * File: src/components/ui/toaster.tsx
 * Purpose: Toast notification container component
 * Owner: Core Team
 */

'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Determine icon based on variant or title content
        const getIcon = () => {
          if (variant === 'destructive') {
            return <AlertCircle className="h-5 w-5 text-red-500" />;
          }
          // Check title for hints about the type
          const titleStr = typeof title === 'string' ? title.toLowerCase() : '';
          if (titleStr.includes('error') || titleStr.includes('failed')) {
            return <AlertCircle className="h-5 w-5 text-red-500" />;
          }
          if (titleStr.includes('warning')) {
            return <AlertTriangle className="h-5 w-5 text-orange-500" />;
          }
          if (titleStr.includes('saved') || titleStr.includes('success') || titleStr.includes('created') || titleStr.includes('updated')) {
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
          }
          return <Info className="h-5 w-5 text-blue-500" />;
        };

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
