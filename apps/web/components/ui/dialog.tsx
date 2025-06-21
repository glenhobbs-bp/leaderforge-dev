"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import React from "react";

export function Dialog({ open, onOpenChange, children }: RadixDialog.DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
      <RadixDialog.Content
        className={`fixed left-1/2 top-1/2 z-50 bg-transparent rounded-lg p-0 outline-none transform -translate-x-1/2 -translate-y-1/2 ${className || ""}`}
        aria-describedby="dialog-description"
      >
        <RadixDialog.Close asChild>
          <button className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white/90 z-50 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 border border-gray-200">
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </RadixDialog.Close>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export { Title as DialogTitle, Description as DialogDescription } from "@radix-ui/react-dialog";