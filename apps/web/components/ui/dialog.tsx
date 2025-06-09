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
      <RadixDialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
      <RadixDialog.Content
        className={`fixed left-1/2 top-1/2 z-50 bg-white rounded-lg shadow-lg p-0 outline-none transform -translate-x-1/2 -translate-y-1/2 ${className || ""}`}
      >
        <RadixDialog.Close asChild>
          <button className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white z-50">
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </RadixDialog.Close>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export { Title as DialogTitle, Description as DialogDescription } from "@radix-ui/react-dialog";