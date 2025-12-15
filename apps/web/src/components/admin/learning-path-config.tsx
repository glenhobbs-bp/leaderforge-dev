/**
 * File: src/components/admin/learning-path-config.tsx
 * Purpose: Admin UI for configuring organization learning paths
 * Owner: Core Team
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { ContentItem } from '@/lib/tribe-social';

interface LearningPathItem {
  id?: string;
  content_id: string;
  sequence_order: number;
  unlock_date: string | null;
  is_optional: boolean;
  is_manually_unlocked?: boolean;
}

interface LearningPath {
  id: string;
  name: string;
  description: string | null;
  unlock_mode: 'time_based' | 'completion_based' | 'hybrid' | 'manual';
  enrollment_date: string;
  unlock_interval_days: number;
  completion_requirement: 'video_only' | 'worksheet' | 'full';
  items: LearningPathItem[];
}

interface LearningPathConfigProps {
  availableContent: ContentItem[];
}

export function LearningPathConfig({ availableContent }: LearningPathConfigProps) {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('Leadership Foundations');
  const [description, setDescription] = useState('');
  const [unlockMode, setUnlockMode] = useState<'time_based' | 'completion_based' | 'hybrid' | 'manual'>('hybrid');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [unlockInterval, setUnlockInterval] = useState(7);
  const [completionRequirement, setCompletionRequirement] = useState<'video_only' | 'worksheet' | 'full'>('full');
  const [sequenceItems, setSequenceItems] = useState<{ content_id: string; is_optional: boolean; id?: string; is_manually_unlocked?: boolean }[]>([]);
  const [isTogglingUnlock, setIsTogglingUnlock] = useState<string | null>(null);

  // Load existing learning path
  const loadLearningPath = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/learning-path');
      const result = await response.json();
      
      if (result.success && result.learningPath) {
        const path = result.learningPath;
        setLearningPath(path);
        setName(path.name);
        setDescription(path.description || '');
        setUnlockMode(path.unlock_mode);
        setEnrollmentDate(path.enrollment_date);
        setUnlockInterval(path.unlock_interval_days);
        setCompletionRequirement(path.completion_requirement);
        setSequenceItems(
          path.items.map((item: LearningPathItem) => ({
            id: item.id,
            content_id: item.content_id,
            is_optional: item.is_optional,
            is_manually_unlocked: item.is_manually_unlocked,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load learning path:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLearningPath();
  }, [loadLearningPath]);

  // Save learning path settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          unlock_mode: unlockMode,
          enrollment_date: enrollmentDate,
          unlock_interval_days: unlockInterval,
          completion_requirement: completionRequirement,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setLearningPath(result.learningPath);
        toast({ title: 'Settings saved', description: 'Learning path settings updated successfully.' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to save settings', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Save sequence
  const handleSaveSequence = async () => {
    if (!learningPath) {
      toast({ title: 'Error', description: 'Save settings first to create a learning path', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/learning-path/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: sequenceItems }),
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: 'Sequence saved', description: `${sequenceItems.length} modules in sequence.` });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to save sequence', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save sequence', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Add content to sequence
  const handleAddContent = (contentId: string) => {
    if (sequenceItems.some(item => item.content_id === contentId)) {
      toast({ title: 'Already added', description: 'This module is already in the sequence.', variant: 'destructive' });
      return;
    }
    setSequenceItems([...sequenceItems, { content_id: contentId, is_optional: false }]);
  };

  // Remove content from sequence
  const handleRemoveContent = (index: number) => {
    setSequenceItems(sequenceItems.filter((_, i) => i !== index));
  };

  // Move item in sequence
  const handleMoveItem = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= sequenceItems.length) return;
    
    const newItems = [...sequenceItems];
    [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
    setSequenceItems(newItems);
  };

  // Get content title by ID
  const getContentTitle = (contentId: string) => {
    const content = availableContent.find(c => c.id === contentId);
    return content?.title || `Module ${contentId}`;
  };

  // Calculate unlock week for display
  const getUnlockWeek = (index: number) => {
    const weekNum = Math.floor((index * unlockInterval) / 7) + 1;
    if (index === 0) return 'Week 1 (immediate)';
    return `Week ${weekNum}`;
  };

  // Toggle manual unlock for an item
  const handleToggleManualUnlock = async (itemId: string, currentlyUnlocked: boolean) => {
    if (!learningPath || unlockMode !== 'manual') return;
    
    setIsTogglingUnlock(itemId);
    try {
      const response = await fetch('/api/admin/learning-path/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          unlock: !currentlyUnlocked,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setSequenceItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, is_manually_unlocked: !currentlyUnlocked }
            : item
        ));
        toast({ 
          title: !currentlyUnlocked ? 'Module unlocked' : 'Module locked',
          description: !currentlyUnlocked 
            ? 'Users can now access this module.' 
            : 'Module is now locked for users.',
        });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Toggle unlock error:', error);
      toast({ title: 'Error', description: 'Failed to update unlock status', variant: 'destructive' });
    } finally {
      setIsTogglingUnlock(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Path Settings</CardTitle>
          <CardDescription>
            Configure how content unlocks for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Leadership Foundations 2024"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="enrollmentDate">Enrollment Date</Label>
              <Input
                id="enrollmentDate"
                type="date"
                value={enrollmentDate}
                onChange={(e) => setEnrollmentDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">When your organization started this program</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this learning path"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unlock Mode</Label>
              <Select value={unlockMode} onValueChange={(v) => setUnlockMode(v as typeof unlockMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_based">Time-based (Cohort)</SelectItem>
                  <SelectItem value="completion_based">Completion-based (Self-paced)</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
                  <SelectItem value="manual">Manual (Admin Controlled)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {unlockMode === 'time_based' && 'Modules unlock on a schedule for everyone'}
                {unlockMode === 'completion_based' && 'Complete one module to unlock the next'}
                {unlockMode === 'hybrid' && 'Schedule + completion required'}
                {unlockMode === 'manual' && 'You control when each module unlocks'}
              </p>
            </div>

            {unlockMode !== 'manual' && (
              <div className="space-y-2">
                <Label>Unlock Interval</Label>
                <Select value={String(unlockInterval)} onValueChange={(v) => setUnlockInterval(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Weekly (7 days)</SelectItem>
                    <SelectItem value="14">Bi-weekly (14 days)</SelectItem>
                    <SelectItem value="3">Every 3 days</SelectItem>
                    <SelectItem value="1">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Completion Requirement</Label>
              <Select value={completionRequirement} onValueChange={(v) => setCompletionRequirement(v as typeof completionRequirement)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video_only">Video only</SelectItem>
                  <SelectItem value="worksheet">Video + Worksheet</SelectItem>
                  <SelectItem value="full">Full 4-step</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {completionRequirement === 'full' && 'Video + Worksheet + Check-in + Signoff'}
              </p>
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Sequence Card */}
      <Card>
        <CardHeader>
          <CardTitle>Module Sequence</CardTitle>
          <CardDescription>
            {unlockMode === 'manual' ? (
              <>
                {sequenceItems.length} modules • Click lock/unlock to control access
              </>
            ) : (
              <>
                {sequenceItems.length} modules • 
                {Math.ceil((sequenceItems.length * unlockInterval) / 7)} weeks total • 
                Hover to reorder
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual mode info banner */}
          {unlockMode === 'manual' && learningPath && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>Manual Mode:</strong> Save the sequence first, then use the lock/unlock buttons to control which modules are available to users.
            </div>
          )}

          {/* Current Sequence */}
          {sequenceItems.length > 0 ? (
            <div className="space-y-2">
              {sequenceItems.map((item, index) => {
                const isUnlocked = index === 0 || item.is_manually_unlocked === true;
                const canToggle = unlockMode === 'manual' && index > 0 && item.id && learningPath;
                
                return (
                  <div 
                    key={`${item.content_id}-${index}`}
                    className={`flex items-center gap-3 p-3 rounded-lg group ${
                      unlockMode === 'manual' 
                        ? isUnlocked ? 'bg-green-50 border border-green-200' : 'bg-muted'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{getContentTitle(item.content_id)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {unlockMode === 'manual' ? (
                          <>
                            {isUnlocked ? (
                              <>
                                <Unlock className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600">
                                  {index === 0 ? 'Always unlocked (first module)' : 'Unlocked'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Locked</span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{getUnlockWeek(index)}</span>
                            {index === 0 ? (
                              <Unlock className="h-3 w-3 text-green-500" />
                            ) : (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Manual unlock toggle button */}
                    {canToggle && (
                      <Button
                        variant={isUnlocked ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleManualUnlock(item.id!, isUnlocked)}
                        disabled={isTogglingUnlock === item.id}
                        className={isUnlocked ? 'border-amber-500 text-amber-600 hover:bg-amber-50' : 'bg-green-600 hover:bg-green-700'}
                      >
                        {isTogglingUnlock === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isUnlocked ? (
                          <>
                            <Lock className="h-4 w-4 mr-1" />
                            Lock
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-1" />
                            Unlock
                          </>
                        )}
                      </Button>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveItem(index, 'up')}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveItem(index, 'down')}
                        disabled={index === sequenceItems.length - 1}
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveContent(index)}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No modules in sequence yet.</p>
              <p className="text-sm">Add modules from the list below.</p>
            </div>
          )}

          {sequenceItems.length > 0 && (
            <Button onClick={handleSaveSequence} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Sequence
            </Button>
          )}

          {/* Available Content */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Available Content</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {availableContent.map((content) => {
                const isInSequence = sequenceItems.some(item => item.content_id === content.id);
                return (
                  <div 
                    key={content.id}
                    className={`flex items-center justify-between p-2 rounded border ${
                      isInSequence ? 'bg-green-50 border-green-200' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-sm truncate flex-1">{content.title}</span>
                    {isInSequence ? (
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2 flex-shrink-0" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddContent(content.id)}
                        className="ml-2 flex-shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

