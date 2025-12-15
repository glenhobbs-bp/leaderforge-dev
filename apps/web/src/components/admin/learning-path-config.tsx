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
  GripVertical, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
} from 'lucide-react';
import type { ContentItem } from '@/lib/tribe-social';

interface LearningPathItem {
  id?: string;
  content_id: string;
  sequence_order: number;
  unlock_date: string | null;
  is_optional: boolean;
}

interface LearningPath {
  id: string;
  name: string;
  description: string | null;
  unlock_mode: 'time_based' | 'completion_based' | 'hybrid';
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
  const [unlockMode, setUnlockMode] = useState<'time_based' | 'completion_based' | 'hybrid'>('hybrid');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [unlockInterval, setUnlockInterval] = useState(7);
  const [completionRequirement, setCompletionRequirement] = useState<'video_only' | 'worksheet' | 'full'>('full');
  const [sequenceItems, setSequenceItems] = useState<{ content_id: string; is_optional: boolean }[]>([]);

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
            content_id: item.content_id,
            is_optional: item.is_optional,
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
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {unlockMode === 'time_based' && 'Modules unlock on a schedule for everyone'}
                {unlockMode === 'completion_based' && 'Complete one module to unlock the next'}
                {unlockMode === 'hybrid' && 'Schedule + completion required'}
              </p>
            </div>

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
            Drag to reorder. {sequenceItems.length} modules • 
            {Math.ceil((sequenceItems.length * unlockInterval) / 7)} weeks total
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Sequence */}
          {sequenceItems.length > 0 ? (
            <div className="space-y-2">
              {sequenceItems.map((item, index) => (
                <div 
                  key={`${item.content_id}-${index}`}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg group"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <span className="font-medium truncate">{getContentTitle(item.content_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{getUnlockWeek(index)}</span>
                      {index === 0 ? (
                        <Unlock className="h-3 w-3 text-green-500" />
                      ) : (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === sequenceItems.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContent(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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

