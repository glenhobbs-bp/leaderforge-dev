/**
 * File: src/app/(dashboard)/settings/profile/profile-settings.tsx
 * Purpose: Client component for profile settings with avatar upload
 * Owner: Core Team
 */

'use client';

import { useState, useRef } from 'react';
import { 
  User, Mail, Building2, Users, Calendar, 
  Camera, Loader2, Check, X, Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface ProfileProps {
  profile: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  membership: {
    role: string;
    organizationName: string | null;
    teamName: string | null;
  };
}

export function ProfileSettings({ profile, membership }: ProfileProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase();

  const handleNameChange = (value: string) => {
    setFullName(value);
    setHasChanges(value !== profile.fullName || avatarUrl !== profile.avatarUrl);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setAvatarUrl(result.data.avatarUrl);
        setHasChanges(true);
        toast({
          title: 'Avatar uploaded',
          description: 'Your profile picture has been updated',
        });
      } else {
        toast({
          title: 'Upload failed',
          description: result.error || 'Failed to upload avatar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'An error occurred while uploading',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          avatarUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setHasChanges(false);
        toast({
          title: 'Profile updated',
          description: 'Your changes have been saved',
        });
      } else {
        toast({
          title: 'Update failed',
          description: result.error || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update failed',
        description: 'An error occurred while saving',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setFullName(profile.fullName);
    setAvatarUrl(profile.avatarUrl);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal details and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-medium">Profile Picture</h3>
              <p className="text-sm text-muted-foreground">
                Click the camera icon to upload a new photo
              </p>
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your full name"
                className="max-w-md"
              />
            </div>
          </div>

          {/* Email Field (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                value={profile.email}
                disabled
                className="max-w-md bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Contact your administrator to change your email address
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Your current organization and role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{membership.organizationName || 'No organization'}</p>
              <p className="text-sm text-muted-foreground">Organization</p>
            </div>
          </div>

          {membership.teamName && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{membership.teamName}</p>
                <p className="text-sm text-muted-foreground">Team</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">
              {membership.role}
            </Badge>
            <span className="text-sm text-muted-foreground">Your role</span>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleDiscard} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Discard
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
