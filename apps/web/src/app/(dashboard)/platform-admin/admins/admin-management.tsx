/**
 * File: src/app/(dashboard)/platform-admin/admins/admin-management.tsx
 * Purpose: Client component for managing platform administrators
 * Owner: LeaderForge Team
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, UserPlus, Trash2, Mail, Calendar, Clock,
  Loader2, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface Admin {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_platform_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

interface PlatformAdminManagementProps {
  admins: Admin[];
  currentUserId: string;
}

export function PlatformAdminManagement({ admins: initialAdmins, currentUserId }: PlatformAdminManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [admins, setAdmins] = useState(initialAdmins);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAddAdmin = async () => {
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/platform-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Admin added',
          description: result.message,
        });
        setAddDialogOpen(false);
        setEmail('');
        router.refresh();
      } else {
        toast({
          title: 'Failed to add admin',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while adding the admin',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/platform-admin/admins/${selectedAdmin.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Admin removed',
          description: result.message,
        });
        setRemoveDialogOpen(false);
        setSelectedAdmin(null);
        router.refresh();
      } else {
        toast({
          title: 'Failed to remove admin',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while removing the admin',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRemoveDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setRemoveDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Platform Administrators
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage who has platform-level access to LeaderForge
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {/* Warning Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Platform Admin Access</p>
              <p className="text-sm text-amber-700">
                Platform admins have full access to all tenants, organizations, and system settings. 
                Only grant this access to trusted LeaderForge team members.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{admins.length}</p>
              <p className="text-xs text-muted-foreground">Platform Administrators</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Administrators</CardTitle>
          <CardDescription>
            Users with platform-level access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {admins.map((admin) => (
              <div 
                key={admin.id} 
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={admin.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(admin.full_name, admin.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{admin.full_name || admin.email}</p>
                      {admin.id === currentUserId && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {admin.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Added {formatDate(admin.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last login {formatDate(admin.last_sign_in_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => openRemoveDialog(admin)}
                  disabled={admin.id === currentUserId}
                  title={admin.id === currentUserId ? "You can't remove yourself" : "Remove admin"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {admins.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No platform administrators found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Platform Admin
            </DialogTitle>
            <DialogDescription>
              Enter the email of an existing user to grant them platform admin access.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
              />
              <p className="text-xs text-muted-foreground">
                The user must already have an account in LeaderForge
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddAdmin} 
              disabled={!email.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Remove Platform Admin
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{selectedAdmin?.full_name || selectedAdmin?.email}</strong> as a platform admin?
              They will lose access to all platform management features.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRemoveAdmin} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
