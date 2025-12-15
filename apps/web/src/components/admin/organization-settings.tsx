/**
 * File: src/components/admin/organization-settings.tsx
 * Purpose: Organization settings component with signoff mode and other configs
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, Users, Layers, CheckCircle2, UserCheck, 
  AlertCircle, Save, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  const [signoffMode, setSignoffMode] = useState<string>(
    organization.settings?.signoff_mode || 'self_certify'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      {/* Future Settings Placeholder */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Branding
            <span className="text-xs bg-muted px-2 py-0.5 rounded ml-2">Coming Soon</span>
          </CardTitle>
          <CardDescription>
            Customize your organization&apos;s logo and primary color
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Organization branding customization will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

