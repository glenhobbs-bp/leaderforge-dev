/**
 * Purpose: Company Settings mockup component for admin-level company management
 * Owner: LeaderForge Platform Team
 * Tags: mockup, company-settings, admin-interface, glassmorphism
 */

"use client";

import React, { useState } from 'react';
import { Copy, Building, Mail, Shield, Edit, ChevronDown } from "lucide-react";
import { useCopilotReadable } from "@copilotkit/react-core";

interface User {
  id: string;
  name: string;
  role: 'team_member' | 'supervisor' | 'executive';
  supervisor?: string;
  selected?: boolean;
}

interface CompanyInfo {
  name: string;
  size: string;
}

const CompanySettingsMockup: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Brilliant Perspectives',
    size: '15'
  });

  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Allie Bishop', role: 'team_member', supervisor: 'Admin Account' },
    { id: '2', name: 'Cindy Deininger', role: 'team_member', supervisor: 'Jenny Taylor' },
    { id: '4', name: 'Michael Andrews', role: 'team_member', supervisor: 'Jenny Taylor' },
    { id: '5', name: 'Danielle Ross', role: 'team_member', supervisor: 'Jenny Taylor' },
    { id: '6', name: 'Dionne van Zyl', role: 'executive', supervisor: undefined },
    { id: '7', name: 'Admin Account', role: 'executive', supervisor: undefined }
  ]);

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');

  const inviteLinks = {
    teamMember: 'https://www.myleaderforge.com/join/team?company=Brilliant%20Perspectives',
    supervisor: 'https://www.myleaderforge.com/join/supervisor?company=Brilliant%20Perspectives'
  };

  const supervisors = ['No Supervisor', 'Admin Account', 'Jenny Taylor'];

  // Make data available to CopilotKit
  const readableData = {
    companyInfo,
    users: users.map(user => ({
      name: user.name,
      role: user.role,
      supervisor: user.supervisor
    })),
    inviteLinks,
    totalUsers: users.length,
    usersByRole: {
      executives: users.filter(u => u.role === 'executive').length,
      supervisors: users.filter(u => u.role === 'supervisor').length,
      teamMembers: users.filter(u => u.role === 'team_member').length
    }
  };

  useCopilotReadable({
    description: "Company settings data including company information, user management, and invite links",
    value: readableData
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleUpdateCompany = () => {
    console.log('Updating company:', companyInfo);
  };

  const handleUserRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, role: newRole as User['role'] } : user
    ));
  };

  const handleUserSupervisorChange = (userId: string, newSupervisor: string) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, supervisor: newSupervisor } : user
    ));
  };

  const handleUserSelect = (userId: string, selected: boolean) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, selected } : user
    ));
  };

  const handleUpdateSelected = () => {
    const selectedUsers = users.filter(user => user.selected);
    console.log('Updating selected users:', selectedUsers);
  };



    return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header Section - Following established pattern */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Company Settings
        </h1>
        <p className="text-sm text-gray-600">
          Manage your company information, team access, and administrative settings
        </p>
      </div>

      {/* Company Information - Glassmorphism Card */}
      <div className="card-glass-subtle p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Building className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-medium text-glass-primary">Company Information</h2>
            <p className="text-sm text-glass-secondary">Update your company details and configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-glass-primary mb-1">Company Name</label>
            <input
              type="text"
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
              placeholder="Enter company name"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-glass-primary mb-1">Company Size</label>
            <input
              type="text"
              value={companyInfo.size}
              onChange={(e) => setCompanyInfo({...companyInfo, size: e.target.value})}
              placeholder="e.g. 1-10 employees"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleUpdateCompany}
          className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
        >
          <Edit className="w-4 h-4" />
          Update Company
        </button>
      </div>

      {/* Invite Links - Glassmorphism Card */}
      <div className="card-glass-subtle p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-5 w-5 text-green-600" />
          <div>
            <h2 className="text-lg font-medium text-glass-primary">Invite Links</h2>
            <p className="text-sm text-glass-secondary">Generate and manage invite links for team members and supervisors</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-glass-primary mb-1">Team Member Invite Link</label>
            <div className="flex items-center gap-2">
              <input
                value={inviteLinks.teamMember}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
              <button
                onClick={() => handleCopy(inviteLinks.teamMember)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-glass-primary mb-1">Supervisor Invite Link</label>
            <div className="flex items-center gap-2">
              <input
                value={inviteLinks.supervisor}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
              <button
                onClick={() => handleCopy(inviteLinks.supervisor)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Management - Glassmorphism Card */}
      <div className="card-glass-subtle p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-purple-600" />
          <div>
            <h2 className="text-lg font-medium text-glass-primary">User Management</h2>
            <p className="text-sm text-glass-secondary">Manage user roles and supervisor assignments</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select role...</option>
              <option value="team_member">Team Member</option>
              <option value="supervisor">Supervisor</option>
              <option value="executive">Executive</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select supervisor...</option>
              {supervisors.map(supervisor => (
                <option key={supervisor} value={supervisor}>{supervisor}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={handleUpdateSelected}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            Update Selected
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-2 w-8"></th>
                <th className="text-left p-2 text-xs font-medium text-gray-700">Name</th>
                <th className="text-left p-2 text-xs font-medium text-gray-700">Role</th>
                <th className="text-left p-2 text-xs font-medium text-gray-700">Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={user.selected || false}
                      onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-2 font-medium text-gray-900 text-sm">{user.name}</td>
                  <td className="p-2">
                    <div className="relative">
                      <select
                        value={user.role}
                        onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                        className="appearance-none bg-white border border-gray-200 rounded-lg px-2 py-1 pr-6 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="team_member">Team Member</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="executive">Executive</option>
                      </select>
                      <ChevronDown className="absolute right-1 top-1.5 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="p-2">
                    {user.role === 'executive' ? (
                      <span className="text-gray-500 text-xs">No supervisor</span>
                    ) : (
                      <div className="relative">
                        <select
                          value={user.supervisor || ''}
                          onChange={(e) => handleUserSupervisorChange(user.id, e.target.value)}
                          className="appearance-none bg-white border border-gray-200 rounded-lg px-2 py-1 pr-6 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select supervisor...</option>
                          {supervisors.map(supervisor => (
                            <option key={supervisor} value={supervisor}>{supervisor}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1.5 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsMockup;