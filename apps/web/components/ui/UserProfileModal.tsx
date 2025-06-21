"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog';
import { Camera, User, Edit3 } from 'lucide-react';
import { useUserPreferences, useUpdateUserPreferences } from '../../app/hooks/useUserPreferences';

interface UserPreferences {
  theme?: string;
  notifications?: boolean;
  language?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export function UserProfileModal({ isOpen, onClose, currentUser }: UserProfileModalProps) {
  const { data: preferences, isLoading } = useUserPreferences(currentUser?.id);
  const updatePreferences = useUpdateUserPreferences(currentUser?.id);

  if (isLoading || !currentUser) {
    return null;
  }

  const userPrefs = preferences as UserPreferences;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || '',
    theme: userPrefs?.theme || 'light',
    notifications: userPrefs?.notifications !== false,
    language: userPrefs?.language || 'en',
  });

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        theme: formData.theme,
        notifications: formData.notifications,
        language: formData.language,
        full_name: formData.full_name,
      });
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: currentUser?.full_name || '',
      theme: userPrefs?.theme || 'light',
      notifications: userPrefs?.notifications !== false,
      language: userPrefs?.language || 'en',
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-lg transition-all duration-200 border border-slate-200/50 hover:border-slate-300/50"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            )}
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
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <button
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-slate-600 hover:bg-slate-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border-2 border-white group-hover:scale-110"
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs font-medium text-slate-700">
                {currentUser?.full_name || 'User Profile'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 bg-white/70 backdrop-blur-sm transition-all duration-200 disabled:bg-slate-50/50 disabled:text-slate-600"
                placeholder="Enter your full name"
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
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-400/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-600 disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2.5 mt-6 pt-5 border-t border-slate-200/50">
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white/60 hover:bg-white/80 border border-slate-200/80 hover:border-slate-300/80 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updatePreferences.isPending}
                className="flex-1 px-3 py-2.5 text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {updatePreferences.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}