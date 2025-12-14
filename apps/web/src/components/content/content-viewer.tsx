/**
 * File: src/components/content/content-viewer.tsx
 * Purpose: Client-side content viewer with 4-step module completion
 * Owner: Core Team
 * 
 * 4-Step Module Completion:
 * 1. Watch Video (25%)
 * 2. Complete Worksheet + Bold Action (50%)
 * 3. Team Leader Check-in (75%)
 * 4. Bold Action Signoff (100%)
 */

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Play, Clock, Calendar, CheckCircle, Loader2, 
  FileText, Video, Users, Zap, Circle
} from 'lucide-react';
import { VideoPlayer } from './video-player';
import { WorksheetModal } from './worksheet-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ContentItem } from '@/lib/tribe-social';

interface ContentViewerProps {
  content: ContentItem;
}

interface ProgressData {
  progress_percentage: number;
  completed_at: string | null;
}

interface BoldActionData {
  status: 'pending' | 'completed' | 'cancelled';
  action_description: string;
  completed_at: string | null;
}

export function ContentViewer({ content }: ContentViewerProps) {
  // Video progress state
  const [videoProgress, setVideoProgress] = useState(0);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastSavedProgress = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Worksheet state
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);
  const [isWorksheetCompleted, setIsWorksheetCompleted] = useState(false);

  // Bold Action state
  const [boldAction, setBoldAction] = useState<BoldActionData | null>(null);

  // Check-in state (placeholder for now)
  const [isCheckinCompleted, setIsCheckinCompleted] = useState(false);

  // Calculate step completion
  const step1Complete = isVideoCompleted;
  const step2Complete = isWorksheetCompleted && !!boldAction;
  const step3Complete = isCheckinCompleted;
  const step4Complete = boldAction?.status === 'completed';

  // Calculate overall progress (25% per step)
  const overallProgress = 
    (step1Complete ? 25 : Math.round(videoProgress / 4)) +
    (step2Complete ? 25 : 0) +
    (step3Complete ? 25 : 0) +
    (step4Complete ? 25 : 0);

  const isFullyCompleted = step1Complete && step2Complete && step3Complete && step4Complete;

  // Load existing progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // Load video progress
        const progressResponse = await fetch(`/api/progress/${content.id}`);
        const progressResult = await progressResponse.json();
        
        if (progressResult.success && progressResult.data) {
          const data: ProgressData = progressResult.data;
          setVideoProgress(data.progress_percentage || 0);
          setIsVideoCompleted(data.progress_percentage >= 90);
          lastSavedProgress.current = data.progress_percentage || 0;
        }

        // Load worksheet status
        const worksheetResponse = await fetch(`/api/worksheet/${content.id}`);
        const worksheetResult = await worksheetResponse.json();
        
        if (worksheetResult.success && worksheetResult.data) {
          setIsWorksheetCompleted(true);
        }

        // Load bold action status
        const boldActionResponse = await fetch(`/api/bold-actions/${content.id}`);
        const boldActionResult = await boldActionResponse.json();
        
        if (boldActionResult.success && boldActionResult.data) {
          setBoldAction(boldActionResult.data);
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [content.id]);

  // Save video progress to database (debounced)
  const saveProgress = useCallback(async (progressPercent: number, completed: boolean) => {
    const shouldSave = 
      completed || 
      progressPercent >= 100 ||
      progressPercent - lastSavedProgress.current >= 5;

    if (!shouldSave) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/progress/${content.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressPercentage: progressPercent,
          completed,
        }),
      });

      if (response.ok) {
        lastSavedProgress.current = progressPercent;
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content.id]);

  const debouncedSave = useCallback((progressPercent: number, completed: boolean) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress(progressPercent, completed);
    }, 1000);
  }, [saveProgress]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleVideoProgress = useCallback((newProgress: number) => {
    setVideoProgress(newProgress);
    if (newProgress >= 90) {
      setIsVideoCompleted(true);
    }
    debouncedSave(newProgress, newProgress >= 90);
  }, [debouncedSave]);

  const handleVideoComplete = useCallback(() => {
    setIsVideoCompleted(true);
    saveProgress(100, true);
  }, [saveProgress]);

  const handleWorksheetSubmit = (boldActionText: string) => {
    setIsWorksheetCompleted(true);
    setBoldAction({
      status: 'pending',
      action_description: boldActionText,
      completed_at: null,
    });
  };

  const handleCompleteBoldAction = async () => {
    try {
      const response = await fetch(`/api/bold-actions/${content.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (response.ok) {
        const result = await response.json();
        setBoldAction(result.data);
      }
    } catch (error) {
      console.error('Failed to complete bold action:', error);
    }
  };

  const handleStartLearning = () => {
    const videoContainer = document.querySelector('video');
    if (videoContainer) {
      videoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        videoContainer.play().catch(() => {});
      }, 300);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Step indicator component
  const StepIndicator = ({ 
    step, 
    title, 
    isComplete, 
    isCurrent,
    icon: Icon 
  }: { 
    step: number; 
    title: string; 
    isComplete: boolean; 
    isCurrent: boolean;
    icon: React.ElementType;
  }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
      isComplete ? 'bg-green-50' : isCurrent ? 'bg-secondary/10' : 'bg-muted/30'
    }`}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
        isComplete ? 'bg-green-500 text-white' : isCurrent ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'
      }`}>
        {isComplete ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <span className="text-sm font-bold">{step}</span>
        )}
      </div>
      <div className="flex-1">
        <div className={`text-sm font-medium ${isComplete ? 'text-green-700' : isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
          {title}
        </div>
      </div>
      <Icon className={`h-4 w-4 ${isComplete ? 'text-green-500' : isCurrent ? 'text-secondary' : 'text-muted-foreground'}`} />
    </div>
  );

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Back navigation */}
      <div>
        <Link href="/content">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>
      </div>

      {/* Video Player or Placeholder */}
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        {content.videoUrl ? (
          <VideoPlayer 
            src={content.videoUrl} 
            poster={content.thumbnailUrl || undefined}
            title={content.title}
            onProgress={handleVideoProgress}
            onComplete={handleVideoComplete}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <div className="text-center">
              <Play className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Video not available</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{content.title}</h1>
            
            {/* Metadata */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {content.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(content.duration)}
                </span>
              )}
              {content.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(content.publishedAt)}
                </span>
              )}
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded capitalize">
                {content.type}
              </span>
            </div>
          </div>

          {/* Description */}
          {content.description && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {content.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bold Action Display */}
          {boldAction && (
            <Card className="border-secondary/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Zap className={`h-5 w-5 mt-0.5 ${boldAction.status === 'completed' ? 'text-green-500' : 'text-secondary'}`} />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Your Bold Action</h3>
                    <p className="text-muted-foreground">{boldAction.action_description}</p>
                    {boldAction.status === 'completed' && boldAction.completed_at && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Completed on {formatDate(boldAction.completed_at)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 4-Step Progress */}
        <div className="space-y-4">
          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Module Progress</h3>
                {isSaving && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Overall Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Overall</span>
                      <span className="font-bold">{overallProgress}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFullyCompleted ? 'bg-green-500' : 'bg-secondary'
                        }`}
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* 4 Steps */}
                  <div className="space-y-2 pt-2">
                    <StepIndicator 
                      step={1} 
                      title="Watch Video" 
                      isComplete={step1Complete}
                      isCurrent={!step1Complete}
                      icon={Video}
                    />
                    <StepIndicator 
                      step={2} 
                      title="Complete Worksheet" 
                      isComplete={step2Complete}
                      isCurrent={step1Complete && !step2Complete}
                      icon={FileText}
                    />
                    <StepIndicator 
                      step={3} 
                      title="Team Leader Check-in" 
                      isComplete={step3Complete}
                      isCurrent={step2Complete && !step3Complete}
                      icon={Users}
                    />
                    <StepIndicator 
                      step={4} 
                      title="Bold Action Signoff" 
                      isComplete={step4Complete}
                      isCurrent={step3Complete && !step4Complete}
                      icon={Zap}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t">
                    {/* Step 1: Watch Video */}
                    {!step1Complete && content.videoUrl && (
                      <Button className="w-full" onClick={handleStartLearning}>
                        <Play className="h-4 w-4 mr-2" />
                        {videoProgress > 0 ? 'Continue Watching' : 'Start Video'}
                      </Button>
                    )}

                    {/* Step 2: Worksheet */}
                    {step1Complete && !step2Complete && (
                      <Button 
                        className="w-full bg-secondary hover:bg-secondary/90" 
                        onClick={() => setIsWorksheetOpen(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Complete Worksheet
                      </Button>
                    )}

                    {/* Step 3: Request Check-in */}
                    {step2Complete && !step3Complete && (
                      <Button className="w-full" variant="outline" disabled>
                        <Users className="h-4 w-4 mr-2" />
                        Request Check-in (Coming Soon)
                      </Button>
                    )}

                    {/* Step 4: Complete Bold Action */}
                    {step3Complete && !step4Complete && boldAction && (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700" 
                        onClick={handleCompleteBoldAction}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Mark Bold Action Complete
                      </Button>
                    )}

                    {/* Already completed worksheet - can update */}
                    {step2Complete && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-muted-foreground"
                        onClick={() => setIsWorksheetOpen(true)}
                      >
                        Edit Worksheet
                      </Button>
                    )}

                    {/* Completed state */}
                    {isFullyCompleted && (
                      <div className="text-center py-2">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-green-600 font-medium">Module Complete!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Worksheet Modal */}
      <WorksheetModal
        isOpen={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
        contentId={content.id}
        contentTitle={content.title}
        onSubmit={handleWorksheetSubmit}
      />
    </div>
  );
}
