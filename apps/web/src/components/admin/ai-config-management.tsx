/**
 * File: src/components/admin/ai-config-management.tsx
 * Purpose: Platform Admin UI for managing AI configurations
 * Owner: LeaderForge Team
 * 
 * Part of 7.9 AI Configuration - Platform-level prompt management
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, Settings, MessageSquare, BookText, Code2,
  ChevronDown, ChevronRight, Save, X, History, 
  Loader2, CheckCircle2, AlertCircle, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface AIConfig {
  id: string;
  config_key: string;
  config_type: 'system_prompt' | 'user_prompt_template' | 'settings' | 'terminology';
  config_value: Record<string, unknown>;
  description: string | null;
  model: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface AIConfigHistory {
  id: string;
  config_key: string;
  config_value: Record<string, unknown>;
  version: number;
  changed_at: string;
  change_note: string | null;
}

const CONFIG_TYPE_INFO = {
  system_prompt: {
    label: 'System Prompts',
    description: 'Core AI personality and behavior instructions',
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  user_prompt_template: {
    label: 'Prompt Templates',
    description: 'Dynamic templates with placeholders',
    icon: BookText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  settings: {
    label: 'AI Settings',
    description: 'Model parameters and rate limits',
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  terminology: {
    label: 'Terminology',
    description: 'Brand-specific term mappings',
    icon: Code2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
};

export function AIConfigManagement() {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedType, setExpandedType] = useState<string | null>('system_prompt');
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AIConfigHistory[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newConfig, setNewConfig] = useState({
    config_key: '',
    config_type: 'system_prompt' as AIConfig['config_type'],
    config_value: '',
    description: '',
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const response = await fetch('/api/platform-admin/ai-config');
      const result = await response.json();
      if (result.success) {
        setConfigs(result.data.configs);
      }
    } catch (error) {
      console.error('Failed to fetch AI configs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory(configKey: string) {
    try {
      const response = await fetch(`/api/platform-admin/ai-config/${configKey}`);
      const result = await response.json();
      if (result.success) {
        setHistory(result.data.history);
        setShowHistory(true);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }

  function handleEdit(config: AIConfig) {
    setEditingConfig(config);
    setEditValue(JSON.stringify(config.config_value, null, 2));
    setEditDescription(config.description || '');
    setChangeNote('');
  }

  async function handleSave() {
    if (!editingConfig) return;
    
    setSaving(true);
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        toast({
          title: 'Invalid JSON',
          description: 'Please enter valid JSON for the configuration value',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/platform-admin/ai-config/${editingConfig.config_key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_value: parsedValue,
          description: editDescription,
          change_note: changeNote || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Configuration Saved',
          description: result.versionIncremented 
            ? `Updated to version ${result.data.version}` 
            : 'Configuration updated',
        });
        setEditingConfig(null);
        fetchConfigs();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save configuration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(newConfig.config_value);
      } catch {
        toast({
          title: 'Invalid JSON',
          description: 'Please enter valid JSON for the configuration value',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      const response = await fetch('/api/platform-admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newConfig,
          config_value: parsedValue,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Configuration Created',
          description: `Created "${newConfig.config_key}"`,
        });
        setShowCreateDialog(false);
        setNewConfig({ config_key: '', config_type: 'system_prompt', config_value: '', description: '' });
        fetchConfigs();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create configuration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create config:', error);
      toast({
        title: 'Error',
        description: 'Failed to create configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(config: AIConfig) {
    try {
      const response = await fetch(`/api/platform-admin/ai-config/${config.config_key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !config.is_active }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: config.is_active ? 'Deactivated' : 'Activated',
          description: `"${config.config_key}" ${config.is_active ? 'deactivated' : 'activated'}`,
        });
        fetchConfigs();
      }
    } catch (error) {
      console.error('Failed to toggle config:', error);
    }
  }

  const groupedConfigs = {
    system_prompt: configs.filter(c => c.config_type === 'system_prompt'),
    user_prompt_template: configs.filter(c => c.config_type === 'user_prompt_template'),
    settings: configs.filter(c => c.config_type === 'settings'),
    terminology: configs.filter(c => c.config_type === 'terminology'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Prompt Configurations</h2>
          <p className="text-sm text-muted-foreground">
            Manage system prompts, templates, and AI settings
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Configuration
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(CONFIG_TYPE_INFO).map(([type, info]) => {
          const count = groupedConfigs[type as keyof typeof groupedConfigs].length;
          const activeCount = groupedConfigs[type as keyof typeof groupedConfigs].filter(c => c.is_active).length;
          const Icon = info.icon;
          return (
            <Card key={type} className={cn("cursor-pointer transition-colors", expandedType === type && "ring-2 ring-primary")}
              onClick={() => setExpandedType(expandedType === type ? null : type)}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", info.bgColor)}>
                    <Icon className={cn("h-5 w-5", info.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    {count !== activeCount && (
                      <p className="text-xs text-amber-600">{count - activeCount} inactive</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Config Sections */}
      {Object.entries(CONFIG_TYPE_INFO).map(([type, info]) => {
        const typeConfigs = groupedConfigs[type as keyof typeof groupedConfigs];
        const isExpanded = expandedType === type;
        const Icon = info.icon;

        return (
          <Card key={type}>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => setExpandedType(isExpanded ? null : type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", info.bgColor)}>
                    <Icon className={cn("h-5 w-5", info.color)} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{info.label}</CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{typeConfigs.length}</Badge>
                  {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="space-y-3">
                {typeConfigs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No configurations of this type yet
                  </p>
                ) : (
                  typeConfigs.map(config => (
                    <div 
                      key={config.id}
                      className={cn(
                        "border rounded-lg p-4 space-y-2",
                        !config.is_active && "opacity-50 bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-medium bg-muted px-2 py-0.5 rounded">
                              {config.config_key}
                            </code>
                            <Badge variant="outline" className="text-xs">
                              v{config.version}
                            </Badge>
                            {!config.is_active && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          {config.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {config.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => fetchHistory(config.config_key)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleActive(config)}
                          >
                            {config.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                      
                      <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(config.config_value, null, 2)}
                      </pre>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Model: {config.model}</span>
                        <span>Max Tokens: {config.max_tokens}</span>
                        <span>Temperature: {config.temperature}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Edit Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Edit Configuration
            </DialogTitle>
            <DialogDescription>
              {editingConfig?.config_key}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Brief description of this configuration"
              />
            </div>

            <div className="space-y-2">
              <Label>Configuration Value (JSON)</Label>
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-mono text-sm min-h-[200px]"
                placeholder='{"key": "value"}'
              />
            </div>

            <div className="space-y-2">
              <Label>Change Note (optional)</Label>
              <Input
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Describe what you changed"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingConfig(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No version history yet
              </p>
            ) : (
              history.map((entry, i) => (
                <div key={entry.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">v{entry.version}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.changed_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.change_note && (
                    <p className="text-sm">{entry.change_note}</p>
                  )}
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-24">
                    {JSON.stringify(entry.config_value, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Configuration
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Configuration Key</Label>
              <Input
                value={newConfig.config_key}
                onChange={(e) => setNewConfig({ ...newConfig, config_key: e.target.value })}
                placeholder="e.g., cheat_sheet_intro"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={newConfig.config_type} 
                onValueChange={(v) => setNewConfig({ ...newConfig, config_type: v as AIConfig['config_type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_prompt">System Prompt</SelectItem>
                  <SelectItem value="user_prompt_template">Prompt Template</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="terminology">Terminology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newConfig.description}
                onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>

            <div className="space-y-2">
              <Label>Value (JSON)</Label>
              <Textarea
                value={newConfig.config_value}
                onChange={(e) => setNewConfig({ ...newConfig, config_value: e.target.value })}
                className="font-mono text-sm min-h-[120px]"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !newConfig.config_key || !newConfig.config_value}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
