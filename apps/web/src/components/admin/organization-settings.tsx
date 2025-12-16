/**
 * File: src/components/admin/organization-settings.tsx
 * Purpose: Organization settings component with branding, signoff mode and other configs
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, Users, Layers, CheckCircle2, UserCheck, 
  AlertCircle, Save, Info, Palette, Image as ImageIcon, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrganizationSettingsProps {
  organization: {
    id: string;
    name: string;
    branding: {
      logo_url?: string;
      primary_color?: string;
      display_name?: string;
      use_tenant_theme?: boolean;
    } | null;
    settings: {
      signoff_mode?: 'self_certify' | 'leader_approval';
    } | null;
  };
  stats: {
    memberCount: number;
    teamCount: number;
  };
}

export function OrganizationSettings({
  organization,
  stats,
}: OrganizationSettingsProps) {
  const router = useRouter();
  
  // Signoff mode state
  const [signoffMode, setSignoffMode] = useState<string>(
    organization.settings?.signoff_mode || 'self_certify'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Branding state
  const [logoUrl, setLogoUrl] = useState(organization.branding?.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(organization.branding?.primary_color || '#3b82f6');
  const [displayName, setDisplayName] = useState(organization.branding?.display_name || '');
  const [useTenantTheme, setUseTenantTheme] = useState(organization.branding?.use_tenant_theme !== false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingSaveMessage, setBrandingSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch(`/api/admin/organization/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          settings: {
            signoff_mode: signoffMode,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      router.refresh();
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = signoffMode !== (organization.settings?.signoff_mode || 'self_certify');

  const hasBrandingChanges = 
    logoUrl !== (organization.branding?.logo_url || '') ||
    primaryColor !== (organization.branding?.primary_color || '#3b82f6') ||
    displayName !== (organization.branding?.display_name || '') ||
    useTenantTheme !== (organization.branding?.use_tenant_theme !== false);

  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    setBrandingSaveMessage(null);
    
    try {
      const response = await fetch(`/api/admin/organization/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          branding: {
            logo_url: logoUrl || null,
            primary_color: primaryColor || null,
            display_name: displayName || null,
            use_tenant_theme: useTenantTheme,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save branding');
      }

      setBrandingSaveMessage({ type: 'success', text: 'Branding saved successfully!' });
      router.refresh();
    } catch (error) {
      console.error('Error saving branding:', error);
      setBrandingSaveMessage({ type: 'error', text: 'Failed to save branding. Please try again.' });
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Validate hex color
  const isValidHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">{organization.name}</p>
                <p className="text-xs text-muted-foreground">Organization</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.memberCount}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Layers className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.teamCount}</p>
                <p className="text-xs text-muted-foreground">Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Bold Action Completion
          </CardTitle>
          <CardDescription>
            Configure how bold actions are verified and completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="signoff-mode">Signoff Mode</Label>
            <Select value={signoffMode} onValueChange={setSignoffMode}>
              <SelectTrigger id="signoff-mode" className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self_certify">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span>Self-Certification</span>
                  </div>
                </SelectItem>
                <SelectItem value="leader_approval">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Leader Approval Required</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Mode Descriptions */}
            <div className="mt-4 space-y-3">
              {signoffMode === 'self_certify' ? (
                <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Self-Certification Mode</p>
                    <p className="text-sm text-green-700 mt-1">
                      Users can mark their own bold actions as complete after completing their reflection.
                      This promotes accountability while reducing administrative overhead.
                    </p>
                    <ul className="text-sm text-green-700 mt-2 space-y-1">
                      <li>• User watches video ✓</li>
                      <li>• User completes worksheet with bold action ✓</li>
                      <li>• User requests team leader check-in ✓</li>
                      <li>• <strong>User self-certifies bold action completion</strong></li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Leader Approval Mode</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Team leaders must review and approve bold action completions.
                      This adds an extra layer of accountability and coaching opportunity.
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• User watches video ✓</li>
                      <li>• User completes worksheet with bold action ✓</li>
                      <li>• User requests team leader check-in ✓</li>
                      <li>• User submits bold action for review</li>
                      <li>• <strong>Team leader approves completion</strong></li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Note</p>
              <p className="mt-1">
                Changing the signoff mode will affect all future bold action completions.
                Existing completions will not be affected.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-6">
          <div>
            {saveMessage && (
              <div className={`flex items-center gap-2 text-sm ${
                saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {saveMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {saveMessage.text}
              </div>
            )}
          </div>
          <Button 
            onClick={handleSaveSettings} 
            disabled={!hasChanges || isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>

      {/* Organization Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Organization Branding
          </CardTitle>
          <CardDescription>
            Customize your organization&apos;s logo and primary color
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Use Tenant Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="use-tenant-theme" className="font-medium">
                Use Tenant Theme
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, your organization will use the default tenant branding
              </p>
            </div>
            <Switch
              id="use-tenant-theme"
              checked={useTenantTheme}
              onCheckedChange={setUseTenantTheme}
            />
          </div>

          {/* Branding Fields - only enabled when not using tenant theme */}
          <div className={`space-y-6 ${useTenantTheme ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={organization.name}
                disabled={useTenantTheme}
              />
              <p className="text-xs text-muted-foreground">
                Override the organization name shown to users
              </p>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id="logo-url"
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    disabled={useTenantTheme}
                  />
                </div>
                {/* Logo Preview */}
                <div className="w-12 h-12 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={logoUrl} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a URL to your organization logo (PNG, SVG, or JPEG recommended)
              </p>
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  id="primary-color-picker"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  disabled={useTenantTheme}
                  className="w-12 h-10 rounded border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Input
                  id="primary-color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3b82f6"
                  disabled={useTenantTheme}
                  className="w-32 font-mono"
                />
                {primaryColor && !isValidHexColor(primaryColor) && (
                  <span className="text-xs text-destructive">Invalid hex color</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a primary brand color (hex format, e.g., #3b82f6)
              </p>
            </div>

            {/* Preview */}
            {!useTenantTheme && (
              <div className="p-4 border rounded-lg space-y-3">
                <p className="text-sm font-medium">Preview</p>
                <div className="flex items-center gap-3">
                  {logoUrl && (
                    <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <span className="font-semibold">{displayName || organization.name}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: isValidHexColor(primaryColor) ? primaryColor : '#3b82f6' }}
                  />
                  <span className="text-sm text-muted-foreground">Primary color</span>
                  <Button
                    size="sm"
                    style={{ 
                      backgroundColor: isValidHexColor(primaryColor) ? primaryColor : '#3b82f6',
                      borderColor: isValidHexColor(primaryColor) ? primaryColor : '#3b82f6',
                    }}
                    className="ml-2"
                  >
                    Sample Button
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">About Organization Branding</p>
              <p className="mt-1">
                Organization branding allows you to customize the logo and primary color 
                displayed to your users. The tenant&apos;s full theme (fonts, secondary colors, etc.) 
                will still be applied as the base.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-6">
          <div>
            {brandingSaveMessage && (
              <div className={`flex items-center gap-2 text-sm ${
                brandingSaveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {brandingSaveMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {brandingSaveMessage.text}
              </div>
            )}
          </div>
          <Button 
            onClick={handleSaveBranding} 
            disabled={!hasBrandingChanges || isSavingBranding || (!useTenantTheme && !!primaryColor && !isValidHexColor(primaryColor))}
            className="gap-2"
          >
            {isSavingBranding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSavingBranding ? 'Saving...' : 'Save Branding'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

