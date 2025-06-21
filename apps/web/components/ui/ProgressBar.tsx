// File: apps/web/components/ui/ProgressBar.tsx
// Purpose: Progress bar component for video and content tracking
// Owner: Frontend team
// Tags: UI component, progress tracking, video

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showText?: boolean;
}

export function ProgressBar({ progress, className = '', showText = false }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showText && (
          <span className="text-xs text-gray-600">
            {Math.round(clampedProgress)}% complete
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-[var(--context-primary,#3b82f6)] h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}