/**
 * File: apps/web/components/copilot/ResizableWindow.tsx
 * Purpose: Custom resizable window component for CopilotKit popup
 * Owner: Engineering Team
 * Tags: #copilotkit #resizable #window #ui
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useChatContext } from "@copilotkit/react-ui";

// Simple utility to detect macOS
const isMacOS = () => {
  return typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
};

interface WindowProps {
  clickOutsideToClose: boolean;
  hitEscapeToClose: boolean;
  shortcut: string;
  children?: React.ReactNode;
}

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  direction: string;
}

export const ResizableWindow = ({
  children,
  clickOutsideToClose,
  shortcut,
  hitEscapeToClose,
}: WindowProps) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = useChatContext();

  // Resizable state
  const [windowSize, setWindowSize] = useState({
    width: 400,
    height: 600,
  });
  const [windowPosition] = useState({
    bottom: 16,
    right: 16,
  });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    direction: '',
  });

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!clickOutsideToClose || resizeState.isResizing) {
        return;
      }

      const parentElement = windowRef.current?.parentElement;
      let className = "";
      if (event.target instanceof HTMLElement) {
        className = event.target.className;
      }

      if (
        open &&
        parentElement &&
        !parentElement.contains(event.target as Node) &&
        !className.includes("copilotKitDebugMenu") &&
        !className.includes("resize-handle")
      ) {
        setOpen(false);
      }
    },
    [clickOutsideToClose, open, setOpen, resizeState.isResizing],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      const isDescendantOfWrapper = windowRef.current?.contains(target);

      if (
        open &&
        event.key === "Escape" &&
        (!isInput || isDescendantOfWrapper) &&
        hitEscapeToClose
      ) {
        setOpen(false);
      } else if (
        event.key === shortcut &&
        ((isMacOS() && event.metaKey) || (!isMacOS() && event.ctrlKey)) &&
        (!isInput || isDescendantOfWrapper)
      ) {
        setOpen(!open);
      }
    },
    [hitEscapeToClose, shortcut, open, setOpen],
  );

  // Resize handlers
  const handleResizeStart = useCallback((event: React.MouseEvent, direction: string) => {
    event.preventDefault();
    event.stopPropagation();

    setResizeState({
      isResizing: true,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: windowSize.width,
      startHeight: windowSize.height,
      direction,
    });
  }, [windowSize]);

  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!resizeState.isResizing) return;

    const deltaX = event.clientX - resizeState.startX;
    const deltaY = event.clientY - resizeState.startY;

    let newWidth = resizeState.startWidth;
    let newHeight = resizeState.startHeight;

    // Handle different resize directions
    if (resizeState.direction.includes('right')) {
      newWidth = Math.max(300, resizeState.startWidth + deltaX);
    }
    if (resizeState.direction.includes('left')) {
      newWidth = Math.max(300, resizeState.startWidth - deltaX);
    }
    if (resizeState.direction.includes('bottom')) {
      newHeight = Math.max(400, resizeState.startHeight + deltaY);
    }
    if (resizeState.direction.includes('top')) {
      newHeight = Math.max(400, resizeState.startHeight - deltaY);
    }

    // Ensure maximum size constraints
    newWidth = Math.min(newWidth, window.innerWidth * 0.9);
    newHeight = Math.min(newHeight, window.innerHeight * 0.9);

    setWindowSize({ width: newWidth, height: newHeight });
  }, [resizeState]);

  const handleResizeEnd = useCallback(() => {
    setResizeState(prev => ({ ...prev, isResizing: false }));
  }, []);

  // Mobile adjustment
  const adjustForMobile = useCallback(() => {
    const copilotKitWindow = windowRef.current;
    const vv = window.visualViewport;
    if (!copilotKitWindow || !vv) {
      return;
    }

    if (window.innerWidth < 640 && open) {
      copilotKitWindow.style.height = `${vv.height}px`;
      copilotKitWindow.style.width = '100%';
      copilotKitWindow.style.left = `${vv.offsetLeft}px`;
      copilotKitWindow.style.top = `${vv.offsetTop}px`;
      copilotKitWindow.style.bottom = 'auto';
      copilotKitWindow.style.right = 'auto';

      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = `${window.innerHeight}px`;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      document.body.addEventListener("touchmove", preventScroll, {
        passive: false,
      });
    } else {
      // Reset to resizable mode on desktop
      copilotKitWindow.style.left = "";
      copilotKitWindow.style.top = "";
      copilotKitWindow.style.bottom = `${windowPosition.bottom}px`;
      copilotKitWindow.style.right = `${windowPosition.right}px`;
      copilotKitWindow.style.width = `${windowSize.width}px`;
      copilotKitWindow.style.height = `${windowSize.height}px`;

      document.body.style.position = "";
      document.body.style.height = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";

      document.body.removeEventListener("touchmove", preventScroll);
    }
  }, [open, windowSize, windowPosition]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", adjustForMobile);
      adjustForMobile();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", adjustForMobile);
      }
    };
  }, [adjustForMobile, handleClickOutside, handleKeyDown, handleResizeMove, handleResizeEnd]);

  const windowStyle: React.CSSProperties = {
    width: window.innerWidth < 640 ? '100%' : `${windowSize.width}px`,
    height: window.innerWidth < 640 ? '100vh' : `${windowSize.height}px`,
    bottom: window.innerWidth < 640 ? 'auto' : `${windowPosition.bottom}px`,
    right: window.innerWidth < 640 ? 'auto' : `${windowPosition.right}px`,
    resize: 'none', // Disable browser default resize
    minWidth: '300px',
    minHeight: '400px',
    maxWidth: '90vw',
    maxHeight: '90vh',
  };

  return (
    <div
      className={`copilotKitWindow resizable-window ${open ? "open" : ""}`}
      ref={windowRef}
      style={windowStyle}
    >
      {/* Resize handles - only show on desktop */}
      {window.innerWidth >= 640 && (
        <>
          {/* Corner handles */}
          <div
            className="resize-handle resize-handle-nw"
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '10px',
              height: '10px',
              cursor: 'nw-resize',
              zIndex: 1000,
            }}
          />
          <div
            className="resize-handle resize-handle-ne"
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '10px',
              height: '10px',
              cursor: 'ne-resize',
              zIndex: 1000,
            }}
          />
          <div
            className="resize-handle resize-handle-sw"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '10px',
              height: '10px',
              cursor: 'sw-resize',
              zIndex: 1000,
            }}
          />
          <div
            className="resize-handle resize-handle-se"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '10px',
              height: '10px',
              cursor: 'se-resize',
              zIndex: 1000,
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '0 0 8px 0',
            }}
          />

          {/* Edge handles */}
          <div
            className="resize-handle resize-handle-top"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
            style={{
              position: 'absolute',
              top: 0,
              left: '10px',
              right: '10px',
              height: '5px',
              cursor: 'n-resize',
              zIndex: 1000,
            }}
          />
          <div
            className="resize-handle resize-handle-bottom"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            style={{
              position: 'absolute',
              bottom: 0,
              left: '10px',
              right: '10px',
              height: '5px',
              cursor: 's-resize',
              zIndex: 1000,
            }}
          />
          <div
            className="resize-handle resize-handle-left"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
            style={{
              position: 'absolute',
              left: 0,
              top: '10px',
              bottom: '10px',
              width: '5px',
              cursor: 'w-resize',
              zIndex: 1000,
            }}
          />
          <div
            className="resize-handle resize-handle-right"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
            style={{
              position: 'absolute',
              right: 0,
              top: '10px',
              bottom: '10px',
              width: '5px',
              cursor: 'e-resize',
              zIndex: 1000,
            }}
          />
        </>
      )}

      {children}
    </div>
  );
};

const preventScroll = (event: TouchEvent): void => {
  let targetElement = event.target as Element;

  const hasParentWithClass = (element: Element, className: string): boolean => {
    while (element && element !== document.body) {
      if (element.classList.contains(className)) {
        return true;
      }
      element = element.parentElement!;
    }
    return false;
  };

  if (!hasParentWithClass(targetElement, "copilotKitMessages")) {
    event.preventDefault();
  }
};