/**
 * File: apps/web/components/mockups/CompanySettingsMockup.tsx
 * Purpose: Company Settings mockup component for admin-level company management
 * Owner: Frontend Team
 * Tags: React components, mockups, admin interface, company settings
 */

"use client";

import React, { useState } from 'react';
import { Copy, Users, Settings, Link as LinkIcon, ChevronDown } from "lucide-react";
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
    { id: '3', name: 'Matt Higham', role: 'supervisor', supervisor: 'Jenny Taylor' },
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

  const supervisors = ['Admin Account', 'Jenny Taylor', 'Matt Higham'];

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
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600">Manage your company information and access settings.</p>
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">Update your company details and configuration</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                id="company-name"
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="company-size" className="block text-sm font-medium text-gray-700">Company Size</label>
              <input
                id="company-size"
                type="text"
                value={companyInfo.size}
                onChange={(e) => setCompanyInfo({...companyInfo, size: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleUpdateCompany}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update Company
          </button>
        </div>
      </div>

      {/* Invite Links */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <LinkIcon className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-gray-900">Invite Links</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">Generate and manage invite links for team members and supervisors</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Member Invite Link</label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                value={inviteLinks.teamMember}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
              <button
                onClick={() => handleCopy(inviteLinks.teamMember)}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Supervisor Invite Link</label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                value={inviteLinks.supervisor}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
              <button
                onClick={() => handleCopy(inviteLinks.supervisor)}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">Manage user roles and supervisor assignments</p>
        </div>
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Update Selected
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 w-8"></th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Role</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={user.selected || false}
                        onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-3 font-medium text-gray-900">{user.name}</td>
                    <td className="p-3">
                      <div className="relative">
                        <select
                          value={user.role}
                          onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                          className="appearance-none bg-white border border-gray-300 rounded-md px-2 py-1 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="team_member">Team Member</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="executive">Executive</option>
                        </select>
                        <ChevronDown className="absolute right-1 top-1.5 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>
                    </td>
                    <td className="p-3">
                      {user.role === 'executive' ? (
                        <span className="text-gray-500 text-sm">No supervisor</span>
                      ) : (
                        <div className="relative">
                          <select
                            value={user.supervisor || ''}
                            onChange={(e) => handleUserSupervisorChange(user.id, e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-md px-2 py-1 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    </div>
  );
};

export default CompanySettingsMockup;