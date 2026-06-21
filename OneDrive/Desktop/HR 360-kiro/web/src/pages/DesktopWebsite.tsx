import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Library,
  Users,
  PhoneCall,
  Landmark,
  Sun,
  Moon,
  PowerOff,
  ChevronRight,
  Plus,
  Save,
  Search,
  Upload,
} from 'lucide-react';
import { HRConsoleContent } from '../components/HRConsoleContent';
import { BulkUserUpload } from '../components/BulkUserUpload';
import apiService from '../services/apiService';

interface GuideItem {
  id: string;
  title: string;
  type: string;
  summary?: string;
}

interface CheckIn {
  id: string;
  userId: string;
  status: 'safe' | 'need-help' | 'sos';
  notes: string;
  timestamp: string;
}

interface IncidentReport {
  id: string;
  title: string;
  type: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface PhoneContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'responder' | 'employee';
  team?: string;
  phone?: string;
  address?: string;
}

interface DesktopWebsiteProps {
  guides: GuideItem[];
  users: User[];
  contacts: PhoneContact[];
  checkIns: CheckIn[];
  reports: IncidentReport[];
  pagasaReports: any[];
  phivolcsReports: any[];
  currentUser: User;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSwitchUser: (userId: string) => void;
  onAddReport: (
    title: string,
    type: string,
    description: string,
    location: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) => void;
  onUpdateUser: (user: User) => void;
  isOnline: boolean;
  onSignOut: () => void;
  teamHeads: Record<string, string>;
  onUpdateTeamHeads: (heads: Record<string, string>) => void;
}

function KBGuideEditModal({ 
  guide, 
  darkMode, 
  onClose, 
  onSave 
}: { 
  guide: any; 
  darkMode: boolean; 
  onClose: () => void; 
  onSave: (title: string, content: string, isArchived: boolean) => void;
}) {
  const [title, setTitle] = React.useState(guide.title);
  const [content, setContent] = React.useState(guide.content || '');
  const [isArchived, setIsArchived] = React.useState(guide.isArchived || false);
  const [saving, setSaving] = React.useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
        darkMode ? 'bg-[#0B0D0E] border-neutral-800' : 'bg-white border-stone-200'
      }`}>
        <div className={`sticky top-0 p-6 border-b ${
          darkMode ? 'border-neutral-800 bg-[#121416]' : 'border-stone-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
              Edit Guide
            </h2>
            <button
              onClick={onClose}
              className={`text-2xl font-bold ${darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-neutral-900'}`}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={`text-xs font-bold block mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full text-sm p-3 rounded-lg border ${
                darkMode
                  ? 'border-neutral-800 bg-neutral-950 text-white'
                  : 'border-stone-200 bg-stone-50 text-neutral-900'
              } focus:outline-none focus:border-[#038F8D]`}
            />
          </div>

          <div>
            <label className={`text-xs font-bold block mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              Content (Markdown supported)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full text-sm p-3 rounded-lg border ${
                darkMode
                  ? 'border-neutral-800 bg-neutral-950 text-white'
                  : 'border-stone-200 bg-stone-50 text-neutral-900'
              } focus:outline-none focus:border-[#038F8D] resize-none`}
              rows={10}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isArchived}
              onChange={(e) => setIsArchived(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <label className={`text-xs font-bold ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              Archive this guide (users will no longer see it)
            </label>
          </div>

          <div className="flex gap-2 pt-4 border-t" style={{
            borderTopColor: darkMode ? '#2a2d2f' : '#e7e5e4'
          }}>
            <button
              onClick={onClose}
              className={`flex-1 py-2 rounded-lg border font-bold text-sm transition ${
                darkMode
                  ? 'border-neutral-800 text-stone-400 hover:bg-neutral-900'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setSaving(true);
                onSave(title, content, isArchived);
              }}
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[#038F8D] hover:bg-[#02706e] text-white font-bold text-sm transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DesktopWebsite({
  guides,
  users,
  contacts,
  checkIns,
  reports,
  currentUser,
  darkMode,
  onToggleDarkMode,
  onAddReport,
  onUpdateUser,
  onSignOut,
  teamHeads,
  onUpdateTeamHeads,
}: DesktopWebsiteProps) {
  const [activeMenu, setActiveMenu] = useState<'hub' | 'library' | 'roster' | 'hotline' | 'admin' | 'hr_console' | 'bulk_import'>('hub');
  const [directorySearch, setDirectorySearch] = useState('');
  const [editingGuide, setEditingGuide] = useState<any>(null);

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      c.role.toLowerCase().includes(directorySearch.toLowerCase())
  );

  const navItems = [
    { id: 'hub', label: 'Safety Dashboard', icon: <Activity size={16} /> },
    { id: 'library', label: 'Emergency Guides', icon: <Library size={16} /> },
    { id: 'roster', label: 'Staff Roster', icon: <Users size={16} /> },
    { id: 'hotline', label: 'Emergency Contacts', icon: <PhoneCall size={16} /> },
    { id: 'hr_console', label: 'Organization Chart', icon: <Landmark size={16} /> },
    { id: 'bulk_import', label: 'Bulk User Import', icon: <Upload size={16} /> },
  ];

  return (
    <div className={`min-h-screen flex text-sm ${darkMode ? 'bg-[#0B0D0E] text-stone-100' : 'bg-stone-50 text-neutral-900'}`}>
      {/* SIDEBAR */}
      <aside
        className={`w-64 shrink-0 border-r flex flex-col justify-between ${
          darkMode ? 'bg-[#121416] border-neutral-800' : 'bg-white border-stone-200'
        }`}
      >
        <div className="p-6 space-y-8">
          {/* Logo */}
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#038F8D] to-[#49D7D1] flex items-center justify-center text-white shadow-lg shadow-[#038F8D]/20">
              <ShieldAlert size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-neutral-900 dark:text-white">HR 360</h1>
              <p className="text-[10px] text-[#038F8D] font-bold tracking-widest">Crisis Hub</p>
            </div>
          </div>

          {/* User Profile */}
          <div
            className={`p-3 rounded-xl border ${
              darkMode ? 'bg-neutral-900/40 border-neutral-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#038F8D]/15 text-[#038F8D] font-bold flex items-center justify-center text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{currentUser.name}</p>
                <p className="text-[9px] text-stone-500 dark:text-stone-400 capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeMenu === item.id
                    ? 'bg-[#038F8D] text-white'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t space-y-3 ${darkMode ? 'border-neutral-800' : 'border-stone-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-stone-500 dark:text-stone-400">LIVE SYNC</span>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full py-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500 hover:text-white transition flex items-center justify-center gap-2"
          >
            <PowerOff size={12} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`h-16 border-b px-8 flex justify-between items-center ${
            darkMode ? 'bg-[#0E1012] border-neutral-800' : 'bg-white border-stone-200'
          }`}
        >
          <h1 className="font-extrabold text-base text-neutral-900 dark:text-white capitalize">
            {navItems.find((n) => n.id === activeMenu)?.label}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleDarkMode}
              className={`p-2 rounded-lg border transition ${
                darkMode
                  ? 'border-neutral-800 hover:bg-neutral-900 text-amber-400'
                  : 'border-stone-200 hover:bg-stone-100 text-stone-600'
              }`}
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#038F8D]/15 text-[#038F8D] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#49D7D1] animate-pulse"></span>
              <span>LIVE</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* HUB VIEW */}
            {activeMenu === 'hub' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-extrabold text-lg text-neutral-900 dark:text-white">Safety Dashboard</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Real-time incident monitoring and team status</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left column - Incidents */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Broadcaster */}
                    {(currentUser.role === 'admin' || currentUser.role === 'responder') && (
                      <div
                        className={`p-8 rounded-2xl border ${
                          darkMode ? 'bg-[#121416]/60 border-neutral-800' : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 rounded-lg bg-[#038F8D]/10">
                            <ShieldAlert size={18} className="text-[#038F8D]" />
                          </div>
                          <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">Report Incident</h3>
                        </div>
                        <BroadcasterForm onAddReport={onAddReport} />
                      </div>
                    )}

                    {/* Incidents List */}
                    <div>
                      <div className="flex items-center gap-2 mb-5">
                        <AlertTriangle size={16} className="text-rose-600" />
                        <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">Active Incidents</h3>
                        <span className="text-xs bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                          {reports.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {reports.map((rep) => (
                          <div
                            key={rep.id}
                            className={`p-4 rounded-xl border transition-all ${
                              rep.severity === 'critical'
                                ? 'border-rose-500/30 bg-rose-500/5'
                                : rep.severity === 'high'
                                ? 'border-orange-500/30 bg-orange-500/5'
                                : 'border-yellow-500/30 bg-yellow-500/5'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                      rep.severity === 'critical'
                                        ? 'bg-rose-600/20 text-rose-600 dark:text-rose-400'
                                        : rep.severity === 'high'
                                        ? 'bg-orange-600/20 text-orange-600 dark:text-orange-400'
                                        : 'bg-yellow-600/20 text-yellow-600 dark:text-yellow-400'
                                    }`}
                                  >
                                    {rep.severity}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{rep.title}</h4>
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-snug">{rep.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-[10px] text-stone-500 dark:text-stone-400">
                                  <span>📍 {rep.location}</span>
                                  <span>⏱ {new Date(rep.timestamp).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {reports.length === 0 && (
                          <div className="p-8 text-center text-stone-400 dark:text-stone-500 text-sm">
                            No active incidents
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right column - Team Status */}
                  <div
                    className={`p-8 rounded-2xl border h-fit ${
                      darkMode ? 'bg-[#121416]/60 border-neutral-800' : 'bg-white border-stone-200'
                    }`}
                  >
                    <h3 className="font-extrabold text-sm text-[#038F8D] mb-5">Team Status</h3>
                    <div className="space-y-3">
                      {checkIns.slice(0, 5).map((ci) => (
                        <div key={ci.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {users.find((u) => u.id === ci.userId)?.name || 'Member'}
                            </p>
                          </div>
                          <span className="text-[9px] font-bold uppercase px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                            {ci.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HR CONSOLE */}
            {activeMenu === 'hr_console' && (
              <HRConsoleContent
                users={users}
                currentUser={currentUser}
                onUpdateUser={onUpdateUser}
                darkMode={darkMode}
                teamHeads={teamHeads}
                onUpdateTeamHeads={onUpdateTeamHeads}
              />
            )}

            {/* CONTACTS */}
            {activeMenu === 'hotline' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-extrabold text-lg text-neutral-900 dark:text-white">Emergency Directory</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Local emergency and rescue services</p>
                </div>

                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    darkMode ? 'bg-neutral-900/40 border-neutral-800' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <Search size={14} className="text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    className="bg-transparent border-none text-xs w-full focus:outline-none text-neutral-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-5 rounded-2xl border ${
                        darkMode
                          ? 'bg-[#121416]/60 border-neutral-800 hover:border-[#038F8D]'
                          : 'bg-white border-stone-200 hover:border-[#038F8D]'
                      } transition-all`}
                    >
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full inline-block ${
                              contact.category === 'emergency' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                              contact.category === 'medical' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                              contact.category === 'veterinary' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
                              contact.category === 'government' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                              contact.category === 'organization' ? 'bg-[#038F8D]/15 text-[#038F8D] dark:bg-[#038F8D]/20 dark:text-[#49D7D1]' :
                              'bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}>
                              {contact.role}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-[#038F8D]">{contact.name}</h4>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-700'}`}>{contact.description}</p>
                        </div>
                        <div className="pt-3 border-t border-stone-200/40 dark:border-neutral-800 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">📞</span>
                            <span className="text-neutral-900 dark:text-white">{contact.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`truncate ${darkMode ? 'text-stone-400' : 'text-stone-700'}`}>{contact.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAFF ROSTER */}
            {activeMenu === 'roster' && (
              <HRConsoleContent
                users={users}
                currentUser={currentUser}
                onUpdateUser={onUpdateUser}
                darkMode={darkMode}
                teamHeads={teamHeads}
                onUpdateTeamHeads={onUpdateTeamHeads}
              />
            )}

            {/* LIBRARY - KB CREATION */}
            {activeMenu === 'library' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-extrabold text-lg text-neutral-900 dark:text-white">Emergency Guides</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Create and manage knowledge base guides</p>
                </div>

                {/* Create Guide Form */}
                <div
                  className={`p-6 rounded-2xl border ${
                    darkMode ? 'bg-[#121416]/60 border-neutral-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-[#038F8D]/10">
                      <Plus size={18} className="text-[#038F8D]" />
                    </div>
                    <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">Create New Guide</h3>
                  </div>
                  <KBCreationForm darkMode={darkMode} />
                </div>

                {/* Guides List */}
                {guides && guides.length > 0 && (
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white mb-4">Published Guides</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {guides.map((guide: any) => (
                        <div
                          key={guide.id}
                          className={`p-4 rounded-xl border group ${
                            darkMode
                              ? 'bg-[#121416]/40 border-neutral-800 hover:border-[#038F8D]'
                              : 'bg-stone-50 border-stone-200 hover:border-[#038F8D]'
                          } transition-all relative`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{guide.title}</h4>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>{guide.description}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingGuide(guide)}
                                className="p-1 rounded text-xs bg-[#038F8D]/20 text-[#038F8D] hover:bg-[#038F8D]/40 transition"
                                title="Edit guide"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this guide? This action cannot be undone.')) {
                                    apiService.delete(`/kb/guides/${guide.id}`).then(() => {
                                      alert('Guide deleted');
                                      window.location.reload();
                                    }).catch((err) => alert(`Failed: ${err.message}`));
                                  }
                                }}
                                className="p-1 rounded text-xs bg-rose-500/20 text-rose-600 hover:bg-rose-500/40 transition"
                                title="Delete guide"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3 text-[10px]">
                            <span className="px-2 py-0.5 rounded-full bg-[#038F8D]/15 text-[#038F8D] dark:text-[#49D7D1] font-bold">
                              {guide.categoryId || 'General'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BULK USER IMPORT */}
            {activeMenu === 'bulk_import' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-extrabold text-lg text-neutral-900 dark:text-white">Bulk User Import</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Import multiple users from a CSV file</p>
                </div>

                <div className={`p-6 rounded-2xl border ${
                  darkMode ? 'bg-[#121416]/60 border-neutral-800' : 'bg-white border-stone-200'
                }`}>
                  <BulkUserUpload />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* KB Edit Modal */}
      {editingGuide && (
        <KBGuideEditModal
          guide={editingGuide}
          darkMode={darkMode}
          onClose={() => setEditingGuide(null)}
          onSave={(title, content, isArchived) => {
            apiService.put(`/kb/guides/${editingGuide.id}`, {
              title,
              content,
              isPublished: true,
              isArchived
            }).then(() => {
              alert('Guide updated successfully!');
              window.location.reload();
            }).catch((err) => alert(`Failed: ${err.message}`));
          }}
        />
      )}
    </div>
  );
}

interface BroadcasterFormProps {
  onAddReport: (
    title: string,
    type: string,
    description: string,
    location: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) => void;
}

function BroadcasterForm({ onAddReport }: BroadcasterFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && type && description && location) {
      onAddReport(title, type, description, location, severity);
      setTitle('');
      setType('');
      setDescription('');
      setLocation('');
      setSeverity('medium');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Incident title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xs p-3 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D]"
        />
        <input
          type="text"
          placeholder="Type (e.g., Flood)"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-xs p-3 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D]"
        />
      </div>
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full text-xs p-3 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D]"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full text-xs p-3 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D] resize-none"
        rows={3}
      />
      <div className="flex gap-3">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as any)}
          className="text-xs p-2.5 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D]"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-lg bg-[#038F8D] hover:bg-[#02706e] text-white font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <Plus size={14} />
          <span>Report</span>
        </button>
      </div>
    </form>
  );
}

function KBCreationForm({ darkMode }: { darkMode: boolean }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('disaster');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !content) {
      alert('Please fill in all fields');
      return;
    }

    const finalCategoryId = useCustomCategory ? customCategoryName.toLowerCase().replace(/\s+/g, '-') : categoryId;
    
    if (!finalCategoryId) {
      alert('Please select or enter a category');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post('/kb/guides', {
        title,
        description,
        content,
        categoryId: finalCategoryId,
        isPublished: true,
      });
      
      if (response.success) {
        alert('Guide created successfully!');
        console.log('Guide created:', response.data);
        setTitle('');
        setDescription('');
        setContent('');
        setCategoryId('disaster');
        setUseCustomCategory(false);
        setCustomCategoryName('');
      }
    } catch (error: any) {
      alert(`Failed to create guide: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Guide Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-xs p-3 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D]"
        disabled={loading}
      />
      <input
        type="text"
        placeholder="Short Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full text-xs p-3 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D]"
        disabled={loading}
      />
      
      {/* Category Selection/Creation */}
      <div className="space-y-2">
        <label className={`text-xs font-bold ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
          Category
        </label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useCustomCategory}
            onChange={(e) => {
              setUseCustomCategory(e.target.checked);
              setCustomCategoryName('');
            }}
            className="w-4 h-4 rounded cursor-pointer"
            disabled={loading}
          />
          <span className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            Create new category
          </span>
        </div>

        {useCustomCategory ? (
          <input
            type="text"
            placeholder="Enter category name (e.g., Weather, Safety, IT)"
            value={customCategoryName}
            onChange={(e) => setCustomCategoryName(e.target.value)}
            className="w-full text-xs p-3 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D]"
            disabled={loading}
          />
        ) : (
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full text-xs p-3 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D]"
            disabled={loading}
          >
            <option value="disaster">Disaster</option>
            <option value="hr">HR</option>
            <option value="work">Work Safety</option>
            <option value="general">General</option>
          </select>
        )}
      </div>

      <textarea
        placeholder="Full Guide Content (markdown supported)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full text-xs p-3 rounded-lg border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D] resize-none"
        rows={6}
        disabled={loading}
      />
      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-[#038F8D] hover:bg-[#02706e] text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
        disabled={loading}
      >
        <Plus size={14} />
        <span>{loading ? 'Creating...' : 'Create Guide'}</span>
      </button>
    </form>
  );
}

export default DesktopWebsite;
