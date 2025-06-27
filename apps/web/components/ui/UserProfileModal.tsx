"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog';
import { Camera, User, Edit3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forceAvatarRefresh } from './NavPanel';

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
}

interface UserPreferences {
  theme?: string;
  notifications?: boolean;
  language?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

// Fetch user data from API
async function fetchUserData(userId: string): Promise<{ user: UserData; preferences: UserPreferences }> {
  const response = await fetch(`/api/user/${userId}/preferences`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  return response.json();
}

// Update user data via API
async function updateUserData(userId: string, data: Partial<UserData & UserPreferences>): Promise<{ user: UserData; preferences: UserPreferences }> {
  const response = await fetch(`/api/user/${userId}/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update user data');
  }
  return response.json();
}

// Fetch avatar signed URL
async function fetchAvatarUrl(userId: string): Promise<string> {
  // Add cache-busting timestamp to ensure fresh avatar after upload
  const cacheBuster = Date.now();
  const response = await fetch(`/api/user/avatar?userId=${userId}&t=${cacheBuster}`, {
    credentials: 'include',
    cache: 'no-cache' // Ensure no browser caching
  });
  if (!response.ok) {
    return "/icons/default-avatar.svg";
  }
  const data = await response.json();
  return data.url || "/icons/default-avatar.svg";
}

export function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    theme: 'light',
    notifications: true,
    language: 'en'
  });
  const [avatarPendingRefresh, setAvatarPendingRefresh] = useState(false);

  const queryClient = useQueryClient();

  // Fetch user data
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserData(userId),
    enabled: !!userId && isOpen,
  });

  // Fetch avatar URL separately
  const { data: avatarUrl } = useQuery({
    queryKey: ['avatar', userId],
    queryFn: () => fetchAvatarUrl(userId),
    enabled: !!userId && isOpen,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserData & UserPreferences>) => updateUserData(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Failed to update user data:', error);
    }
  });

  // Avatar upload mutation
  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('[UserProfileModal] Starting avatar upload for user:', userId);
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', userId);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      console.log('[UserProfileModal] Avatar upload response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[UserProfileModal] Avatar upload failed:', error);
        throw new Error(error.error || 'Failed to upload avatar');
      }

      const result = await response.json();
      console.log('[UserProfileModal] Avatar upload successful:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[UserProfileModal] Avatar upload mutation onSuccess:', data);

      // Mark that NavPanel needs refresh when modal closes (not immediately)
      setAvatarPendingRefresh(true);

      // Force refetch avatar queries to show new avatar in modal immediately
      queryClient.refetchQueries({ queryKey: ['avatar', userId] });
      queryClient.refetchQueries({ queryKey: ['avatar'] });

      // Update the user query cache to reflect the new avatar filename
      queryClient.setQueryData(['user', userId], (oldData: { user: UserData; preferences: UserPreferences } | undefined) => {
        if (oldData && data.fileName) {
          return {
            ...oldData,
            user: {
              ...oldData.user,
              avatar_url: data.fileName // Store the filename, not the signed URL
            }
          };
        }
        return oldData;
      });

      // Also manually update the avatar cache with the new signed URL
      queryClient.setQueryData(['avatar', userId], data.url);

      console.log('[UserProfileModal] Avatar updated in modal, NavPanel refresh deferred until modal close');
    },
    onError: (error) => {
      console.error('[UserProfileModal] Avatar upload mutation onError:', error);
      // You could add a toast notification here
    },
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (data) {
      setFormData({
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        theme: data.preferences.theme || 'light',
        notifications: data.preferences.notifications ?? true,
        language: data.preferences.language || 'en'
      });
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const handleCancel = () => {
    if (data) {
      setFormData({
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        theme: data.preferences.theme || 'light',
        notifications: data.preferences.notifications ?? true,
        language: data.preferences.language || 'en'
      });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit for high quality images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('File size must be less than 10MB');
      return;
    }

    // Upload the file
    avatarUploadMutation.mutate(file);

    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  // Handle modal close with NavPanel refresh if needed
  const handleModalClose = () => {
    if (avatarPendingRefresh) {
      console.log('[UserProfileModal] Modal closing, triggering NavPanel avatar refresh');
      forceAvatarRefresh(userId);
      setAvatarPendingRefresh(false);
    }
    onClose();
  };

  if (isLoading) {
    return null;
  }

  if (error) {
    console.error('Error loading user data:', error);
    return null;
  }

  if (!data || !data.user) {
    console.warn('User data not available yet');
    return null;
  }

  const currentUser = data.user;
  const displayName = currentUser.first_name && currentUser.last_name
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser.full_name || 'User Profile';

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md w-full mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div
          className="relative rounded-2xl p-5 border border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 50%, rgba(241,245,249,0.95) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <DialogDescription className="sr-only">
            Manage your profile settings including personal information, theme preferences, and notification settings
          </DialogDescription>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <DialogTitle className="text-base font-semibold text-slate-800 tracking-tight">
              Profile Settings
            </DialogTitle>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg border-3 border-white/50 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                }}
              >
                {avatarUrl && avatarUrl !== "/icons/default-avatar.svg" ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>

              {/* Avatar Pending Refresh Indicator */}
              {avatarPendingRefresh && (
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm"
                  title="Avatar updated - will refresh when you close this modal"
                />
              )}

              <label
                htmlFor="avatar-upload"
                className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border-2 border-white group-hover:scale-110 ${
                  avatarUploadMutation.isPending
                    ? 'bg-blue-500 cursor-wait'
                    : 'bg-slate-600 hover:bg-slate-700 cursor-pointer'
                }`}
              >
                {avatarUploadMutation.isPending ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={!isEditing}
              />
              {/* Edit Profile Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border-2 border-white bg-slate-600 hover:bg-slate-700 group-hover:scale-110"
                  aria-label="Edit profile"
                >
                  <Edit3 className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs font-medium text-slate-700">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 disabled:bg-slate-50/50 disabled:text-slate-600"
                placeholder="Enter your first name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 disabled:bg-slate-50/50 disabled:text-slate-600"
                placeholder="Enter your last name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl bg-slate-50/30 text-slate-500 flex items-center">
                <span className="flex-1 text-xs">{currentUser?.email}</span>
                <span className="text-[10px] text-slate-400 ml-2">Verified</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Email address cannot be changed for security reasons</p>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Theme Preference
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 disabled:bg-slate-50/50 disabled:text-slate-600"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="auto">System Default</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 disabled:bg-slate-50/50 disabled:text-slate-600"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-slate-200/60">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Email Notifications
                </label>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Receive updates and important announcements
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.checked }))}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-600 disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200/50">
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all duration-200 border border-slate-200/60 hover:border-slate-300/60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 px-3 py-2.5 text-xs font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}