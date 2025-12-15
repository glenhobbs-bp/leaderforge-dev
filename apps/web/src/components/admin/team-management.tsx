/**
 * File: src/components/admin/team-management.tsx
 * Purpose: Team management component with create, edit, and member assignment
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Plus, MoreHorizontal, Edit2, Trash2, 
  UserPlus, ChevronRight, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface Manager {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  memberCount: number;
  managers: Manager[];
}

interface Member {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  teamId: string | null;
}

interface TeamManagementProps {
  teams: Team[];
  members: Member[];
  organizationId: string;
  tenantId: string;
}

export function TeamManagement({
  teams,
  members,
  organizationId,
  tenantId,
}: TeamManagementProps) {
  const router = useRouter();
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName.trim(),
          description: teamDescription.trim() || null,
          organizationId,
          tenantId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create team');
      }

      setCreateModalOpen(false);
      setTeamName('');
      setTeamDescription('');
      router.refresh();
    } catch (error) {
      console.error('Error creating team:', error);
      alert(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeam = async () => {
    if (!selectedTeam || !teamName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/teams/${selectedTeam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName.trim(),
          description: teamDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update team');
      }

      setEditModalOpen(false);
      setSelectedTeam(null);
      setTeamName('');
      setTeamDescription('');
      router.refresh();
    } catch (error) {
      console.error('Error updating team:', error);
      alert(error instanceof Error ? error.message : 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`Are you sure you want to delete "${team.name}"? Members will be unassigned from this team.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/teams/${team.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  };

  const handleAssignMember = async () => {
    if (!selectedTeam || !selectedMemberId) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedMemberId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign member');
      }

      setAssignModalOpen(false);
      setSelectedMemberId('');
      router.refresh();
    } catch (error) {
      console.error('Error assigning member:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      router.refresh();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description || '');
    setEditModalOpen(true);
  };

  const openAssignModal = (team: Team) => {
    setSelectedTeam(team);
    setSelectedMemberId('');
    setAssignModalOpen(true);
  };

  // Get members not in any team or in a different team (available for assignment)
  const availableMembers = members.filter(m => 
    !m.teamId || m.teamId !== selectedTeam?.id
  );

  // Get members in the selected team
  const getTeamMembers = (teamId: string) => 
    members.filter(m => m.teamId === teamId);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teams.length}</p>
                <p className="text-xs text-muted-foreground">Total Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {members.filter(m => m.teamId).length}
                </p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {members.filter(m => !m.teamId).length}
                </p>
                <p className="text-xs text-muted-foreground">Unassigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex justify-end">
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Teams List */}
      <div className="space-y-4">
        {teams.map((team) => {
          const teamMembers = getTeamMembers(team.id);
          const isExpanded = expandedTeam === team.id;
          
          return (
            <Card key={team.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      {team.description && (
                        <CardDescription className="mt-1">{team.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                    </span>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAssignModal(team)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Member
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditModal(team)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTeam(team)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Managers */}
                {team.managers.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 ml-8">
                    <span className="text-xs text-muted-foreground">Managers:</span>
                    <div className="flex -space-x-2">
                      {team.managers.map(manager => (
                        <Avatar key={manager.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={manager.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {manager.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {team.managers.map(m => m.name).join(', ')}
                    </span>
                  </div>
                )}
              </CardHeader>
              
              {/* Expanded Members List */}
              {isExpanded && (
                <CardContent className="pt-2">
                  <div className="ml-8 space-y-2">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No members assigned to this team yet.
                      </p>
                    ) : (
                      teamMembers.map(member => (
                        <div 
                          key={member.userId}
                          className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback>
                                {getInitials(member.fullName, member.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {member.fullName || member.email}
                              </p>
                              {member.fullName && (
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveMember(team.id, member.userId)}
                            className="text-muted-foreground hover:text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => openAssignModal(team)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {teams.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No teams created yet</p>
              <p className="text-sm">Create your first team to organize members</p>
              <Button 
                onClick={() => setCreateModalOpen(true)} 
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Team Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Team
            </DialogTitle>
            <DialogDescription>
              Create a new team to organize members.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Sales Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team-description">Description (Optional)</Label>
              <Textarea
                id="team-description"
                placeholder="Brief description of the team..."
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTeam} 
              disabled={!teamName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Team
            </DialogTitle>
            <DialogDescription>
              Update team details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-team-description">Description</Label>
              <Textarea
                id="edit-team-description"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditTeam} 
              disabled={!teamName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Member Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Member to {selectedTeam?.name}
            </DialogTitle>
            <DialogDescription>
              Select a member to add to this team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="select-member">Select Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available members
                    </SelectItem>
                  ) : (
                    availableMembers.map(member => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.fullName || member.email}
                        {member.teamId && ' (reassign)'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignMember} 
              disabled={!selectedMemberId || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add to Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

