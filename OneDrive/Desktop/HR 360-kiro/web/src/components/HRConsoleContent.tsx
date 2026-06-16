import React, { useState, useEffect } from 'react';
import { Save, Search, Sparkles, UserCheck } from 'lucide-react';
import apiService from '../services/apiService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'responder' | 'employee';
  team?: string;
  phone?: string;
  address?: string;
  position?: string;
  departmentId?: string;
  teamId?: string;
}

interface HRConsoleContentProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  darkMode: boolean;
  teamHeads: Record<string, string>;
  onUpdateTeamHeads: (heads: Record<string, string>) => void;
}

export function HRConsoleContent({
  users,
  onUpdateUser,
  darkMode,
  teamHeads,
  onUpdateTeamHeads,
}: HRConsoleContentProps) {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'org_chart'>('org_chart');
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showNewTeamInput, setShowNewTeamInput] = useState(false);

  // Editor states
  const selectedUser = users.find((u) => u.id === selectedUserId);
  const [formState, setFormState] = useState<Partial<User>>({});
  const [activeUserIdForForm, setActiveUserIdForForm] = useState('');

  if (selectedUser && activeUserIdForForm !== selectedUser.id) {
    setFormState({ ...selectedUser });
    setActiveUserIdForForm(selectedUser.id);
  }

  const handleInputChange = (field: keyof User, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.id || !selectedUser) return;
    setIsSaving(true);
    setTimeout(() => {
      onUpdateUser({ ...selectedUser, ...formState } as User);
      setIsSaving(false);
    }, 800);
  };

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      // Set the team name in the selected user's form if editing
      if (selectedUser) {
        setFormState((prev) => ({ ...prev, team: newTeamName }));
        alert(`Team "${newTeamName}" added to this member. Click "Commit Changes" to save.`);
      }
      setNewTeamName('');
      setShowNewTeamInput(false);
    }
  };

  // Unique list of active teams dynamically computed for the Org chart
  const uniqueTeams = Array.from(new Set(users.map((u) => u.team).filter(Boolean)));

  const handleHeadChange = (teamName: string, userId: string) => {
    onUpdateTeamHeads({ ...teamHeads, [teamName]: userId });
  };

  // Initialize or reset selectedUserId when users change
  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id);
    } else if (selectedUserId && !users.find(u => u.id === selectedUserId) && users.length > 0) {
      // If selected user is no longer in list, select first user
      setSelectedUserId(users[0].id);
    }
  }, [users.length]);

  return (
    <div
      className={`p-6 rounded-2xl border ${
        darkMode ? 'bg-[#121416] border-neutral-800' : 'bg-white border-stone-200'
      } space-y-6`}
    >
      {/* Tab selection links */}
      <div className="flex border-b border-stone-200 dark:border-neutral-800 pb-2.5 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('org_chart')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'org_chart'
                ? 'bg-[#038F8D]/15 text-[#038F8D] border border-[#038F8D]/30'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            📋 Corporate Org Chart & Leads
          </button>
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'roster'
                ? 'bg-[#038F8D]/15 text-[#038F8D] border border-[#038F8D]/30'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            👥 Edit Staff Emergency Profiles
          </button>
        </div>
        <span className="text-[10px] font-mono text-stone-400">SECURE HR CLEARANCE ZONE</span>
      </div>

      {/* SUBVIEW 1: Org Chart Team Leaders Setup */}
      {activeSubTab === 'org_chart' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-extrabold text-sm text-[#038F8D]">
              Organizational Crisis Structure
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Assign team leads to coordinate logistics. Setting or updating a Team Leader
              automatically updates the direct emergency helpline lists for all members of that
              team.
            </p>
          </div>

          {/* Create New Team Button */}
          {showNewTeamInput ? (
            <div className={`p-4 rounded-xl border ${
              darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-stone-50 border-stone-200'
            } flex gap-2`}>
              <input
                type="text"
                placeholder="Enter new team name (e.g., Operations, Security)"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className={`flex-1 text-xs p-2 rounded-lg border focus:outline-none ${
                  darkMode
                    ? 'bg-neutral-950 border-neutral-800'
                    : 'bg-white border-stone-200'
                }`}
                autoFocus
              />
              <button
                onClick={handleCreateTeam}
                type="button"
                className="px-4 py-2 rounded-lg bg-[#038F8D] hover:bg-[#02706e] text-white font-bold text-xs"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewTeamInput(false);
                  setNewTeamName('');
                }}
                type="button"
                className={`px-4 py-2 rounded-lg border text-xs font-bold ${
                  darkMode
                    ? 'border-neutral-800 text-stone-400'
                    : 'border-stone-200 text-stone-600'
                }`}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewTeamInput(true)}
              type="button"
              className={`w-full py-2 rounded-lg border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition ${
                darkMode
                  ? 'border-neutral-800 text-stone-400 hover:border-[#038F8D] hover:text-[#038F8D]'
                  : 'border-stone-200 text-stone-600 hover:border-[#038F8D] hover:text-[#038F8D]'
              }`}
            >
              <Sparkles size={14} />
              <span>Create New Team/Role</span>
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {uniqueTeams.map((teamName: string | undefined) => {
              if (!teamName) return null;
              const assignedHeadId = teamHeads[teamName] || '';
              const members = users.filter((u) => u.team === teamName);
              const currentHead = users.find((u) => u.id === assignedHeadId);

              return (
                <div
                  key={teamName}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    darkMode
                      ? 'bg-neutral-900 border-neutral-800'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#038F8D] tracking-widest block mb-1">
                      Corporate Division
                    </span>
                    <h4 className="font-extrabold text-sm">{teamName}</h4>
                    <p className="text-[10px] text-stone-400 mt-1">{members.length} member(s)</p>

                    {/* Current Team Leader Display */}
                    <div
                      className={`mt-3 p-3 rounded-lg flex items-center gap-3 ${
                        darkMode ? 'bg-neutral-950' : 'bg-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#038F8D]/10 text-[#038F8D] font-bold flex items-center justify-center text-xs">
                        {currentHead ? currentHead.name.charAt(0) : '🔑'}
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400 font-bold block">
                          Assigned Crisis Head
                        </p>
                        <span className="font-extrabold text-xs text-teal-500">
                          {currentHead ? currentHead.name : 'No leader assigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">
                      Designate Team Leader
                    </label>
                    <select
                      value={assignedHeadId}
                      onChange={(e) => handleHeadChange(teamName, e.target.value)}
                      className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                        darkMode
                          ? 'bg-neutral-950 border-neutral-800 text-white'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <option value="">-- Choose Roster Member --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: Personnel Detail Form & Editor */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Explorer Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <div
              className={`p-2 rounded-xl border flex items-center gap-2 ${
                darkMode
                  ? 'bg-neutral-900 border-neutral-800'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <Search size={14} className="text-stone-400 ml-1" />
              <input
                type="text"
                placeholder="Search active staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs w-full focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {users
                .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      selectedUserId === u.id
                        ? 'bg-[#038F8D]/10 border border-[#038F8D]/30 text-[#038F8D]'
                        : 'hover:bg-stone-50 dark:hover:bg-neutral-900/40 text-stone-400'
                    }`}
                  >
                    <div className="text-left">
                      <h5 className="font-bold text-xs">{u.name}</h5>
                      <p className="text-[10px] opacity-80">{u.team}</p>
                    </div>
                    <UserCheck
                      size={14}
                      className={selectedUserId === u.id ? 'text-[#49D7D1]' : 'opacity-20'}
                    />
                  </button>
                ))}
            </div>
          </div>

          {/* User Profile Editor Form */}
          <form onSubmit={handleSave} className="lg:col-span-2 space-y-4">
            {!selectedUser && users.length === 0 && (
              <div className={`p-6 rounded-xl border text-center ${
                darkMode ? 'bg-neutral-900/40 border-neutral-800' : 'bg-stone-50 border-stone-200'
              }`}>
                <p className="text-sm text-stone-500">No staff members to edit</p>
                <p className="text-xs text-stone-400 mt-1">Add users to your organization first</p>
              </div>
            )}
            {selectedUser ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-stone-400 font-extrabold block mb-1">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    value={formState.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full text-xs p-2.5 rounded-lg border ${
                      darkMode
                        ? 'border-neutral-800 bg-neutral-950'
                        : 'border-stone-200 bg-stone-50'
                    } focus:outline-none focus:border-[#038F8D] transition-all`}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-400 font-extrabold block mb-1">
                    Admin Console Access
                  </label>
                  <select
                    value={formState.role || 'employee'}
                    onChange={(e) => handleInputChange('role', e.target.value as any)}
                    className={`w-full text-xs p-2.5 rounded-lg border ${
                      darkMode
                        ? 'border-neutral-800 bg-neutral-950'
                        : 'border-stone-200 bg-stone-50'
                    } focus:outline-none focus:border-[#038F8D] transition-all`}
                  >
                    <option value="employee">Employee (No Access)</option>
                    <option value="responder">Responder (View Only)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-stone-400 font-extrabold block mb-1">
                    Primary Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formState.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full text-xs p-2.5 rounded-lg border ${
                      darkMode
                        ? 'border-neutral-800 bg-neutral-950'
                        : 'border-stone-200 bg-stone-50'
                    } focus:outline-none focus:border-[#038F8D] transition-all`}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] text-stone-400 font-extrabold block mb-1">
                    Geographic Address (Updates Emergency Directory)
                  </label>
                  <input
                    type="text"
                    value={formState.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full text-xs p-2.5 rounded-lg border ${
                      darkMode
                        ? 'border-neutral-800 bg-neutral-950'
                        : 'border-stone-200 bg-stone-50'
                    } focus:outline-none focus:border-[#038F8D] transition-all`}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-400 font-extrabold block mb-1">
                    Position / Title
                  </label>
                  <input
                    type="text"
                    value={formState.position || ''}
                    onChange={(e) => handleInputChange('position' as any, e.target.value)}
                    className={`w-full text-xs p-2.5 rounded-lg border ${
                      darkMode
                        ? 'border-neutral-800 bg-neutral-950'
                        : 'border-stone-200 bg-stone-50'
                    } focus:outline-none focus:border-[#038F8D] transition-all`}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-400 font-extrabold block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formState.departmentId || ''}
                    onChange={(e) => handleInputChange('departmentId' as any, e.target.value)}
                    placeholder="e.g., Engineering, HR, Sales"
                    className={`w-full text-xs p-2.5 rounded-lg border ${
                      darkMode
                        ? 'border-neutral-800 bg-neutral-950'
                        : 'border-stone-200 bg-stone-50'
                    } focus:outline-none focus:border-[#038F8D] transition-all`}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-400 font-extrabold block mb-1">
                    Team (Use "Create New Team/Role" or type here)
                  </label>
                  <input
                    type="text"
                    value={formState.team || ''}
                    onChange={(e) => handleInputChange('team' as any, e.target.value)}
                    placeholder="e.g., Backend, Frontend, Support, Operations"
                    className={`w-full text-xs p-2.5 rounded-lg border ${
                      darkMode
                        ? 'border-neutral-800 bg-neutral-950'
                        : 'border-stone-200 bg-stone-50'
                    } focus:outline-none focus:border-[#038F8D] transition-all`}
                  />
                </div>

                <div className="col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#038F8D] hover:bg-[#02706e] text-white font-bold transition-all text-xs flex justify-center items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>
                      {isSaving
                        ? 'Synchronizing...'
                        : 'Commit Changes'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedUser?.id) {
                        alert('Error: User ID not available. Please refresh and try again.');
                        return;
                      }
                      if (confirm(`Remove ${selectedUser?.name} from the organization? This action cannot be undone.`)) {
                        console.log('Attempting to remove user:', {
                          userId: selectedUser.id,
                          userName: selectedUser.name,
                          userEmail: selectedUser.email
                        });
                        apiService.delete(`/org/users/${selectedUser.id}`).then(() => {
                          console.log('User removed successfully:', selectedUser.id);
                          alert('User removed from organization');
                          window.location.reload();
                        }).catch((err) => {
                          console.error('Failed to remove user:', {
                            userId: selectedUser.id,
                            error: err,
                            message: err.message
                          });
                          alert(`Failed to remove user: ${err.message}`);
                        });
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold transition-all text-xs flex justify-center items-center gap-1.5"
                  >
                    🗑️
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      )}
    </div>
  );
}
