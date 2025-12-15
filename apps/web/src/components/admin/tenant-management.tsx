/**
 * File: src/components/admin/tenant-management.tsx
 * Purpose: Tenant management component for Platform Admin
 * Owner: LeaderForge Team
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Plus, MoreHorizontal, Users, Building,
  Edit2, Search, Power, PowerOff, ExternalLink, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

interface TenantStats {
  organizations: number;
  users: number;
}

interface Tenant {
  id: string;
  tenant_key: string;
  display_name: string;
  theme: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stats: TenantStats;
}

interface TenantManagementProps {
  tenants: Tenant[];
}

export function TenantManagement({ tenants: initialTenants }: TenantManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tenants, setTenants] = useState(initialTenants);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  // Form states
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.tenant_key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && tenant.is_active) ||
      (statusFilter === 'suspended' && !tenant.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.is_active).length;
  const totalOrgs = tenants.reduce((sum, t) => sum + t.stats.organizations, 0);
  const totalUsers = tenants.reduce((sum, t) => sum + t.stats.users, 0);

  const resetForm = () => {
    setFormKey('');
    setFormName('');
  };

  const handleCreateTenant = async () => {
    if (!formKey.trim() || !formName.trim()) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/platform-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_key: formKey,
          display_name: formName,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant');
      }

      toast({ title: 'Tenant Created', description: `${formName} has been created successfully.` });
      setCreateModalOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create tenant',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormName(tenant.display_name);
    setEditModalOpen(true);
  };

  const handleEditTenant = async () => {
    if (!selectedTenant) return;
    if (!formName.trim()) {
      toast({ title: 'Error', description: 'Display name is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/platform-admin/tenants/${selectedTenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: formName,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tenant');
      }

      toast({ title: 'Tenant Updated', description: `${formName} has been updated.` });
      setEditModalOpen(false);
      setSelectedTenant(null);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update tenant',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    // Prevent suspending leaderforge tenant
    if (tenant.tenant_key === 'leaderforge' && tenant.is_active) {
      toast({ 
        title: 'Error', 
        description: 'Cannot suspend the LeaderForge platform tenant',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/platform-admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !tenant.is_active,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tenant status');
      }

      const action = tenant.is_active ? 'suspended' : 'activated';
      toast({ title: 'Status Updated', description: `${tenant.display_name} has been ${action}.` });
      router.refresh();
    } catch (error) {
      console.error('Error updating tenant status:', error);
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
                <p className="text-2xl font-bold">{totalTenants}</p>
                <p className="text-xs text-muted-foreground">Total Tenants</p>
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
                <p className="text-2xl font-bold">{activeTenants}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
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
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            Manage platform tenants and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {filteredTenants.map((tenant) => (
              <div 
                key={tenant.id} 
                className={`flex items-center justify-between py-4 ${!tenant.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{tenant.display_name}</h4>
                      {!tenant.is_active && (
                        <Badge variant="destructive" className="text-xs">Suspended</Badge>
                      )}
                      {tenant.tenant_key === 'leaderforge' && (
                        <Badge variant="secondary" className="text-xs">Platform</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {tenant.tenant_key}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-sm text-right hidden sm:block">
                    <p className="font-medium">{tenant.stats.organizations} orgs</p>
                    <p className="text-muted-foreground">{tenant.stats.users} users</p>
                  </div>
                  <div className="text-sm text-muted-foreground hidden md:block">
                    Created {new Date(tenant.created_at).toLocaleDateString()}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(tenant)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Tenant
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(tenant)}
                        disabled={tenant.tenant_key === 'leaderforge' && tenant.is_active}
                      >
                        {tenant.is_active ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Suspend Tenant
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Activate Tenant
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredTenants.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tenants found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Tenant Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Create Tenant
            </DialogTitle>
            <DialogDescription>
              Add a new tenant to the LeaderForge platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-key">Tenant Key *</Label>
              <Input
                id="create-key"
                placeholder="acme-corp"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. Used in URLs.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-name">Display Name *</Label>
              <Input
                id="create-name"
                placeholder="Acme Corporation"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Shown to users in the app
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTenant} 
              disabled={!formKey.trim() || !formName.trim() || isSubmitting}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Creating...' : 'Create Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Tenant
            </DialogTitle>
            <DialogDescription>
              Update {selectedTenant?.display_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tenant Key</Label>
              <Input
                value={selectedTenant?.tenant_key || ''}
                disabled
                className="font-mono bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Cannot be changed after creation
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-name">Display Name *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditModalOpen(false); setSelectedTenant(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditTenant} disabled={!formName.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
