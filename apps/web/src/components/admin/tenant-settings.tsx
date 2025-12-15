/**
 * File: src/components/admin/tenant-settings.tsx
 * Purpose: Tenant settings and theming configuration component
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, Palette, Type, Image, RotateCcw, Eye,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface TenantTheme {
  logo_url: string | null;
  logo_dark_url?: string | null;
  logo_icon_url?: string | null;
  favicon_url: string | null;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text_primary: string;
  text_secondary: string;
  font_family: string;
  border_radius: string;
}

interface Tenant {
  id: string;
  tenant_key: string;
  display_name: string;
  theme: TenantTheme | null;
  settings: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TenantSettingsProps {
  tenant: Tenant;
}

const DEFAULT_THEME: TenantTheme = {
  logo_url: null,
  logo_dark_url: null,
  logo_icon_url: null,
  favicon_url: null,
  primary: '#152557',
  secondary: '#00A9E0',
  accent: '#00A9E0',
  background: '#ffffff',
  surface: '#f8fafc',
  text_primary: '#152557',
  text_secondary: '#64748b',
  font_family: 'Inter',
  border_radius: '0.5rem',
};

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'system-ui', label: 'System Default' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
];

const RADIUS_OPTIONS = [
  { value: '0', label: 'None (Square)' },
  { value: '0.25rem', label: 'Small' },
  { value: '0.5rem', label: 'Medium (Default)' },
  { value: '0.75rem', label: 'Large' },
  { value: '1rem', label: 'Extra Large' },
];

export function TenantSettings({ tenant: initialTenant }: TenantSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(initialTenant.display_name);
  const [theme, setTheme] = useState<TenantTheme>({
    ...DEFAULT_THEME,
    ...(initialTenant.theme || {}),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateTheme = (key: keyof TenantTheme, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({ title: 'Error', description: 'Display name is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tenant-admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          theme,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast({ title: 'Settings Saved', description: 'Your tenant settings have been updated.' });
      setHasChanges(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setDisplayName(initialTenant.display_name);
    setTheme({
      ...DEFAULT_THEME,
      ...(initialTenant.theme || {}),
    });
    setHasChanges(false);
    toast({ title: 'Reset', description: 'Changes have been discarded.' });
  };

  const handleResetToDefaults = () => {
    setTheme(DEFAULT_THEME);
    setHasChanges(true);
    toast({ title: 'Reset to Defaults', description: 'Theme reset to default values. Save to apply.' });
  };

  // Color input component
  const ColorInput = ({ 
    label, 
    field, 
    description 
  }: { 
    label: string; 
    field: keyof TenantTheme; 
    description?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={field}
          type="color"
          value={theme[field] as string || '#000000'}
          onChange={(e) => updateTheme(field, e.target.value)}
          className="w-14 h-10 p-1 cursor-pointer"
        />
        <Input
          value={theme[field] as string || ''}
          onChange={(e) => updateTheme(field, e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Save/Reset Bar */}
      {hasChanges && (
        <div className="sticky top-0 z-10 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-amber-800">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            General Settings
          </CardTitle>
          <CardDescription>Basic tenant information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Your Company Name"
              />
              <p className="text-xs text-muted-foreground">
                Shown in the app header and emails
              </p>
            </div>
            <div className="space-y-2">
              <Label>Tenant Key</Label>
              <Input
                value={initialTenant.tenant_key}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (cannot be changed)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Logo & Branding Images
          </CardTitle>
          <CardDescription>Configure your logo assets for different contexts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo (Light Background)</Label>
              <Input
                id="logo-url"
                value={theme.logo_url || ''}
                onChange={(e) => updateTheme('logo_url', e.target.value)}
                placeholder="/logos/your-logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Used on light backgrounds (e.g., login page)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-dark-url">Logo (Dark Background)</Label>
              <Input
                id="logo-dark-url"
                value={theme.logo_dark_url || ''}
                onChange={(e) => updateTheme('logo_dark_url', e.target.value)}
                placeholder="/logos/your-logo-white.png"
              />
              <p className="text-xs text-muted-foreground">
                Used on dark backgrounds (e.g., sidebar)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-icon-url">Logo Icon</Label>
              <Input
                id="logo-icon-url"
                value={theme.logo_icon_url || ''}
                onChange={(e) => updateTheme('logo_icon_url', e.target.value)}
                placeholder="/logos/icon.png"
              />
              <p className="text-xs text-muted-foreground">
                Square icon for small spaces
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="favicon-url">Favicon</Label>
              <Input
                id="favicon-url"
                value={theme.favicon_url || ''}
                onChange={(e) => updateTheme('favicon_url', e.target.value)}
                placeholder="/logos/favicon.png"
              />
              <p className="text-xs text-muted-foreground">
                Browser tab icon
              </p>
            </div>
          </div>

          {/* Logo Preview */}
          {(theme.logo_url || theme.logo_dark_url) && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-3">Preview</p>
              <div className="grid gap-4 md:grid-cols-2">
                {theme.logo_url && (
                  <div className="p-4 bg-white rounded border">
                    <p className="text-xs text-muted-foreground mb-2">Light Background</p>
                    <img 
                      src={theme.logo_url} 
                      alt="Logo" 
                      className="h-10 w-auto"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
                {theme.logo_dark_url && (
                  <div className="p-4 rounded" style={{ backgroundColor: theme.primary }}>
                    <p className="text-xs text-white/70 mb-2">Dark Background</p>
                    <img 
                      src={theme.logo_dark_url} 
                      alt="Logo Dark" 
                      className="h-10 w-auto"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Color Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Color Palette
          </CardTitle>
          <CardDescription>Customize your brand colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Colors */}
          <div>
            <h4 className="text-sm font-medium mb-3">Primary Colors</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <ColorInput 
                label="Primary" 
                field="primary" 
                description="Main brand color (sidebar, buttons)"
              />
              <ColorInput 
                label="Secondary" 
                field="secondary" 
                description="Accent highlights"
              />
              <ColorInput 
                label="Accent" 
                field="accent" 
                description="Links and interactive elements"
              />
            </div>
          </div>

          {/* Background Colors */}
          <div>
            <h4 className="text-sm font-medium mb-3">Background Colors</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <ColorInput 
                label="Background" 
                field="background" 
                description="Main page background"
              />
              <ColorInput 
                label="Surface" 
                field="surface" 
                description="Card and panel backgrounds"
              />
            </div>
          </div>

          {/* Text Colors */}
          <div>
            <h4 className="text-sm font-medium mb-3">Text Colors</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <ColorInput 
                label="Primary Text" 
                field="text_primary" 
                description="Main text color"
              />
              <ColorInput 
                label="Secondary Text" 
                field="text_secondary" 
                description="Muted/secondary text"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted border-b flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Live Preview</span>
            </div>
            <div className="p-4" style={{ backgroundColor: theme.background }}>
              <div 
                className="p-4 rounded-lg mb-3"
                style={{ backgroundColor: theme.surface }}
              >
                <h3 style={{ color: theme.text_primary }} className="font-semibold mb-1">
                  Card Title
                </h3>
                <p style={{ color: theme.text_secondary }} className="text-sm">
                  This is secondary text describing the card content.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded text-sm font-medium text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded text-sm font-medium text-white"
                  style={{ backgroundColor: theme.secondary }}
                >
                  Secondary Button
                </button>
                <span 
                  className="px-4 py-2 text-sm"
                  style={{ color: theme.accent }}
                >
                  Accent Link
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            Typography & Style
          </CardTitle>
          <CardDescription>Font and styling options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select 
                value={theme.font_family} 
                onValueChange={(value) => updateTheme('font_family', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Primary font used throughout the app
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="border-radius">Border Radius</Label>
              <Select 
                value={theme.border_radius} 
                onValueChange={(value) => updateTheme('border_radius', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map(radius => (
                    <SelectItem key={radius.value} value={radius.value}>
                      {radius.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Corner roundness for buttons and cards
              </p>
            </div>
          </div>

          {/* Typography Preview */}
          <div className="p-4 border rounded-lg" style={{ fontFamily: theme.font_family }}>
            <p className="text-xs text-muted-foreground mb-2">Font Preview ({theme.font_family})</p>
            <p className="text-2xl font-bold" style={{ color: theme.text_primary }}>
              The quick brown fox jumps
            </p>
            <p style={{ color: theme.text_secondary }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={handleResetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              Discard Changes
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSubmitting || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
