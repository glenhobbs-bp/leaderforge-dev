/**
 * File: src/components/admin/organization-management.tsx
 * Purpose: Organization management component for Tenant Admin
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Plus, MoreHorizontal, Users, UsersRound,
  Edit2, Search, Power, PowerOff, Palette
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  teams: number;
}

interface Organization {
  id: string;
  name: string;
  branding: {
    logo_url?: string;
    primary_color?: string;
  } | null;
  settings: {
    signoff_mode?: string;
  } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stats: OrganizationStats;
}

interface OrganizationManagementProps {
  organizations: Organization[];
  tenantId: string;
}

export function OrganizationManagement({
  organizations: initialOrgs,
  tenantId,
}: OrganizationManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState(initialOrgs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formPrimaryColor, setFormPrimaryColor] = useState('');
  const [formSignoffMode, setFormSignoffMode] = useState('self_certify');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter organizations
  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && org.is_active) ||
      (statusFilter === 'inactive' && !org.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter(o => o.is_active).length;
  const totalMembers = organizations.reduce((sum, o) => sum + o.stats.totalMembers, 0);
  const totalTeams = organizations.reduce((sum, o) => sum + o.stats.teams, 0);

  const resetForm = () => {
    setFormName('');
    setFormPrimaryColor('');
    setFormSignoffMode('self_certify');
  };

  const handleCreateOrg = async () => {
    if (!formName.trim()) {
      toast({ title: 'Error', description: 'Organization name is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tenant-admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          branding: formPrimaryColor ? { primary_color: formPrimaryColor } : {},
          settings: { signoff_mode: formSignoffMode },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization');
      }

      toast({ title: 'Organization Created', description: `${formName} has been created successfully.` });
      setCreateModalOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create organization',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (org: Organization) => {
    setSelectedOrg(org);
    setFormName(org.name);
    setFormPrimaryColor(org.branding?.primary_color || '');
    setFormSignoffMode(org.settings?.signoff_mode || 'self_certify');
    setEditModalOpen(true);
  };

  const handleEditOrg = async () => {
    if (!selectedOrg) return;
    if (!formName.trim()) {
      toast({ title: 'Error', description: 'Organization name is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tenant-admin/organizations/${selectedOrg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          branding: { primary_color: formPrimaryColor || null },
          settings: { signoff_mode: formSignoffMode },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update organization');
      }

      toast({ title: 'Organization Updated', description: `${formName} has been updated.` });
      setEditModalOpen(false);
      setSelectedOrg(null);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update organization',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (org: Organization) => {
    try {
      const response = await fetch(`/api/tenant-admin/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !org.is_active,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update organization status');
      }

      const action = org.is_active ? 'deactivated' : 'activated';
      toast({ title: 'Status Updated', description: `${org.name} has been ${action}.` });
      router.refresh();
    } catch (error) {
      console.error('Error updating organization status:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOrgs}</p>
                <p className="text-xs text-muted-foreground">Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Power className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeOrgs}</p>
                <p className="text-xs text-muted-foreground">Active</p>
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
                <p className="text-2xl font-bold">{totalMembers}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UsersRound className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTeams}</p>
                <p className="text-xs text-muted-foreground">Total Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Organization
        </Button>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrgs.map((org) => (
          <Card 
            key={org.id} 
            className={`transition-all ${!org.is_active ? 'opacity-60' : 'hover:border-primary/50'}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {org.name}
                    {!org.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Inactive
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(org.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditModal(org)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Organization
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleStatus(org)}>
                      {org.is_active ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Stats Row */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{org.stats.activeMembers} / {org.stats.totalMembers}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <UsersRound className="h-4 w-4" />
                      <span>{org.stats.teams} teams</span>
                    </div>
                  </div>
                </div>

                {/* Branding indicator */}
                {org.branding?.primary_color && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Palette className="h-4 w-4" />
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: org.branding.primary_color }}
                    />
                    <span>Custom branding</span>
                  </div>
                )}

                {/* Signoff mode */}
                <div className="text-xs text-muted-foreground">
                  Signoff: {org.settings?.signoff_mode === 'leader_approval' ? 'Leader Approval' : 'Self-Certify'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrgs.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No organizations found</p>
              {searchQuery && <p className="text-sm">Try adjusting your search</p>}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Organization Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Create Organization
            </DialogTitle>
            <DialogDescription>
              Add a new organization to your tenant.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Organization Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., Acme Corp"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-color">Primary Color (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="create-color"
                  type="color"
                  value={formPrimaryColor || '#2563eb'}
                  onChange={(e) => setFormPrimaryColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formPrimaryColor}
                  onChange={(e) => setFormPrimaryColor(e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1"
                />
                {formPrimaryColor && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFormPrimaryColor('')}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to use tenant default colors
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-signoff">Default Signoff Mode</Label>
              <Select value={formSignoffMode} onValueChange={setFormSignoffMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_certify">Self-Certify</SelectItem>
                  <SelectItem value="leader_approval">Leader Approval Required</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How bold actions are signed off within this organization
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateOrg} 
              disabled={!formName.trim() || isSubmitting}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Organization
            </DialogTitle>
            <DialogDescription>
              Update {selectedOrg?.name}&apos;s settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Organization Name *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-color">Primary Color Override</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formPrimaryColor || '#2563eb'}
                  onChange={(e) => setFormPrimaryColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formPrimaryColor}
                  onChange={(e) => setFormPrimaryColor(e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1"
                />
                {formPrimaryColor && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFormPrimaryColor('')}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-signoff">Signoff Mode</Label>
              <Select value={formSignoffMode} onValueChange={setFormSignoffMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_certify">Self-Certify</SelectItem>
                  <SelectItem value="leader_approval">Leader Approval Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditModalOpen(false); setSelectedOrg(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditOrg} disabled={!formName.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
