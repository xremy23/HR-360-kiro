import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';

interface TeamCheckIn {
  id: string;
  userName: string;
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
}

interface PagasaAlert {
  id: string;
  title: string;
  signalNo?: number;
  severity: string;
  summary: string;
}

interface MobileHomeProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

const MobileHome: React.FC<MobileHomeProps> = ({ onMenuClick, showMenu }) => {
  const { user, isGuest, accessMode } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'community' | 'pagasa' | 'philvolcs' | 'ndrrmc'>('community');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [myStatus, setMyStatus] = useState<'safe' | 'need-help' | 'sos' | null>(null);

  const currentUser = {
    name: user?.name || 'Emergency Responder',
    team: 'Product Infrastructure Core',
    department: 'Engineering Operations',
    address: '45B Emerald Ave, Ortigas, Pasig, Metro Manila',
  };

  const teamCheckins: TeamCheckIn[] = [
    { id: '1', userName: 'Maria Gonzales', status: 'safe', notes: 'Safe here in Ortigas office. Strong winds outside.', timestamp: '08:42 AM' },
    { id: '2', userName: 'Paolo Santos', status: 'need-help', notes: 'Basement parking in Pasig starts to flood. Stuck.', timestamp: '08:39 AM' },
    { id: '3', userName: 'Carla Reyes', status: 'safe', notes: 'WFH setup online, power stable via generator.', timestamp: '08:25 AM' },
  ];

  const communityIncidents: IncidentReport[] = [
    { id: 'r1', title: 'Road Blocked - Fallen Acacia Tree', type: 'Wind Damage', description: 'Ortigas Ave eastbound completely blocked by fallen debris. Response team requested.', location: 'Ortigas Ave corner Opal Road', severity: 'high' },
    { id: 'r2', title: 'Flash Flooding Alert', type: 'Flooding', description: 'Knee-deep currents accumulating. Avoid low-elevation alleys near creek lines.', location: 'F. Ortigas Jr. Road', severity: 'critical' },
  ];

  const pagasaAlerts: PagasaAlert[] = [
    { id: 'p1', title: 'TCWS Signal No. 3 Active', signalNo: 3, severity: 'critical', summary: 'Typhoon "Mawar" maintains severe structural shear winds within NCR boundary.' },
    { id: 'p2', title: 'Heat Index Warning', signalNo: undefined, severity: 'medium', summary: 'Metro Manila heat index may reach 38-40°C. Stay hydrated and avoid prolonged sun exposure.' },
    { id: 'p3', title: 'Southwest Monsoon Alert', signalNo: undefined, severity: 'high', summary: 'Scattered to widespread rains expected over Mindanao and western Visayas.' },
  ];

  const philvolcsAlerts = [
    { id: 'pv1', title: 'Mayon Volcano Alert Level 1', severity: 'medium', summary: 'Mayon Volcano is at Alert Level 1. Volcanic tremors are being monitored. Residents should stay vigilant.' },
    { id: 'pv2', title: 'Taal Volcano Monitoring', severity: 'low', summary: 'Taal Volcano remains under normal monitoring. No unusual seismic activity detected.' },
  ];

  const ndrrmcAlerts = [
    { id: 'n1', title: 'Flooding Alert - Low-lying Areas', severity: 'high', summary: 'Residents in low-lying areas are advised to be prepared for possible flooding. Evacuation centers are on standby.' },
    { id: 'n2', title: 'Road Safety Update - Cordillera', severity: 'high', summary: 'Several roads in Cordillera Region are closed due to landslide risks. Use alternate routes.' },
    { id: 'n3', title: 'Disaster Preparedness Reminder', severity: 'medium', summary: 'NDRRMC reminds families to update their disaster preparedness plans and emergency contact lists.' },
  ];

  const handleStatusSubmit = (status: 'safe' | 'need-help' | 'sos') => {
    setMyStatus(status);
    setHasCheckedIn(true);
    setCheckInNotes('');
  };

  // Build team checkins with current user at the top
  const teamCheckinsWithCurrentUser: TeamCheckIn[] = myStatus
    ? [
        {
          id: 'current-user',
          userName: currentUser.name,
          status: myStatus,
          notes: checkInNotes || 'Status updated',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        },
        ...teamCheckins,
      ]
    : teamCheckins;

  return (
    <div className="w-full min-h-screen bg-stone-50 dark:bg-neutral-950">
      {/* MAIN CONTENT */}
      <div className="px-4 py-6 pb-24 space-y-4 overflow-y-auto">
        {/* APP HEADER */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">⚡ CORPORATE SHIELD ACTIVE</span>
            <h1 className="text-xl font-black text-[#038F8D] dark:text-[#49D7D1] leading-tight">Crisis 360 Hub</h1>
          </div>
          <div className="p-2 bg-[#038F8D]/10 dark:bg-[#038F8D]/20 rounded-2xl border border-[#038F8D]/20">
            <span className="text-2xl">🛡️</span>
          </div>
        </div>

        {/* ACTIVE LOCALIZATION BANNER */}
        <div className="p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-150 dark:border-neutral-850/80 shadow-sm flex items-center gap-2.5">
          <span className="text-lg shrink-0">📍</span>
          <div className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold text-stone-400 dark:text-neutral-500 uppercase tracking-wider">Profile Safe Address</span>
            <p className="text-[11px] font-semibold truncate text-stone-750 dark:text-neutral-300">{currentUser.address}</p>
          </div>
        </div>

        {/* SYSTEM ANNOUNCEMENT */}
        <div className="p-3.5 bg-gradient-to-br from-[#038F8D]/8 to-[#8965F5]/8 dark:from-[#038F8D]/5 dark:to-[#8965F5]/5 rounded-3xl border border-[#038F8D]/15 dark:border-[#038F8D]/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-[12px] text-[#038F8D] dark:text-[#49D7D1] flex items-center gap-1.5">
              ⬇️ Standby Offline Caching
            </h4>
            <span className="text-[8.5px] font-mono bg-[#038F8D]/20 dark:bg-[#038F8D]/15 text-[#038F8D] dark:text-[#49D7D1] px-1.5 py-0.5 rounded-full font-bold">ENGAGED</span>
          </div>
          <p className="text-[10.5px] text-stone-700 dark:text-stone-405 leading-normal">Local service workers pre-cached. Disaster rosters and emergency contacts are functional even during network grid isolation.</p>
        </div>

        {/* 3. SAFETY CHECK-IN WIDGET - Only for authenticated users with org */}
        {(accessMode === 'authenticated-with-org' || accessMode === 'admin') && (
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-stone-100 dark:border-neutral-850 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-sm flex items-center gap-1.5">
              <span>✓</span>
              <span>Share Safety Check-in</span>
            </h2>
            <span className="text-[8px] font-mono uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-md font-bold">Team Isolation</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">Broadcasting position status in: <b className="text-neutral-800 dark:text-neutral-100 italic">{currentUser.team}</b></p>
          <input
            type="text"
            placeholder="Describe your environment (e.g., safe at home/stuck)..."
            value={checkInNotes}
            onChange={(e) => setCheckInNotes(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 focus:outline-none focus:border-[#038F8D] transition-all text-neutral-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-600"
          />
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleStatusSubmit('safe')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95"
            >
              <span className="text-sm">🟢</span>
              <span>Safe</span>
            </button>
            <button
              onClick={() => handleStatusSubmit('need-help')}
              className="bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95"
            >
              <span className="text-sm">🟡</span>
              <span>Need Help</span>
            </button>
            <button
              onClick={() => handleStatusSubmit('sos')}
              className="bg-red-655 hover:bg-red-750 text-white py-2 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 border-2 border-red-200 dark:border-red-900 animate-pulse"
            >
              <span className="text-sm">🚨</span>
              <span>SOS</span>
            </button>
          </div>
          {hasCheckedIn && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/15 rounded-xl text-[11px] text-emerald-700 dark:text-emerald-400 text-center font-bold">
              ✓ Successfully logged status: <span className="uppercase text-neutral-800 dark:text-white">{myStatus}</span>
            </div>
          )}
        </div>
        )}

        {/* GO-BAG QUICK ACTION BUTTON */}
        <button
          onClick={() => navigate('/tobag')}
          className="w-full p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl hover:border-amber-300 dark:hover:border-amber-700 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-100 mb-1">
                🎒 Go-Bag Checklist
              </h3>
              <p className="text-[11px] text-amber-900 dark:text-amber-200">
                Prepare your survival kit essentials
              </p>
            </div>
            <span className="text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* 4. DYNAMIC TEAM ROSTER LIST - Only for authenticated users with org */}
        {(accessMode === 'authenticated-with-org' || accessMode === 'admin') && (
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wide text-stone-500 dark:text-neutral-400">
              👥 My Team Safe Count
            </h2>
            <span className="text-[9px] font-mono bg-[#038F8D]/10 dark:bg-[#038F8D]/15 text-[#038F8D] dark:text-[#49D7D1] px-2 py-0.5 rounded-full font-bold">
              Active: {myStatus ? Math.floor(teamCheckinsWithCurrentUser.filter(m => m.status === 'safe').length / (teamCheckinsWithCurrentUser.length) * 100) : 2}/{myStatus ? teamCheckinsWithCurrentUser.length : 3} Safe
            </span>
          </div>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
            {teamCheckinsWithCurrentUser.map((member) => (
              <div
                key={member.id}
                className={`p-3 rounded-2xl flex justify-between items-start text-xs shadow-xs ${
                  member.id === 'current-user'
                    ? 'bg-gradient-to-r from-[#038F8D]/10 to-[#49D7D1]/10 dark:from-[#038F8D]/15 dark:to-[#49D7D1]/15 border border-[#038F8D]/30 dark:border-[#038F8D]/20'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#038F8D] dark:text-[#49D7D1] block truncate">{member.userName}</span>
                    {member.id === 'current-user' && (
                      <span className="text-[7px] font-extrabold bg-[#038F8D] text-white px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] italic text-stone-700 dark:text-neutral-400 leading-tight">&quot;{member.notes}&quot;</p>
                  <div className="text-[9.5px] text-stone-700 dark:text-neutral-500 flex items-center gap-1 font-mono">
                    🕐 {member.timestamp}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 select-none ${
                    member.status === 'safe'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : member.status === 'need-help'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-red-500/20 text-red-655 dark:text-red-400 font-black'
                  }`}
                >
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* 5. DISASTER BOARD TABBED HUB */}
        <div className="space-y-2.5 pt-1 border-t border-stone-250/30 dark:border-neutral-850">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black flex items-center gap-1 uppercase tracking-wider text-rose-650 dark:text-rose-400">
              📻 Local Disaster Feed
            </h3>
            <button
              onClick={() => navigate('/incidents')}
              className="bg-rose-550/10 hover:bg-rose-550/20 dark:bg-rose-550/10 dark:hover:bg-rose-550/20 text-rose-600 dark:text-rose-450 px-2 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-0.5 transition-colors"
            >
              ➕ Broadcast
            </button>
          </div>
          <div className="flex bg-stone-100 dark:bg-neutral-950 p-1 rounded-xl text-[10px] font-extrabold border border-stone-200/40 dark:border-neutral-800 select-none overflow-x-auto">
            <button
              onClick={() => setActiveTab('community')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'community'
                  ? 'bg-white dark:bg-neutral-900 text-rose-600 shadow-xs'
                  : 'text-stone-500 dark:text-neutral-450'
              }`}
            >
              👥 Hazard Logs
            </button>
            <button
              onClick={() => setActiveTab('pagasa')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'pagasa' ? 'bg-white dark:bg-neutral-900 text-[#038F8D] shadow-xs' : 'text-stone-500 dark:text-neutral-450'
              }`}
            >
              ⛅ PAGASA
            </button>
            <button
              onClick={() => setActiveTab('philvolcs')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'philvolcs' ? 'bg-white dark:bg-neutral-900 text-orange-600 shadow-xs' : 'text-stone-500 dark:text-neutral-450'
              }`}
            >
              🌋 PhilVolcs
            </button>
            <button
              onClick={() => setActiveTab('ndrrmc')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ndrrmc' ? 'bg-white dark:bg-neutral-900 text-red-600 shadow-xs' : 'text-stone-500 dark:text-neutral-450'
              }`}
            >
              🛡️ NDRRMC
            </button>
          </div>
          <div className="space-y-1.5">
            {activeTab === 'community' &&
              communityIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3 rounded-2xl bg-rose-500/5 dark:bg-rose-500/2 border border-rose-200 dark:border-red-950/40 text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-extrabold tracking-tight text-neutral-850 dark:text-rose-100">{inc.title}</span>
                    <span className="text-[7.5px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 shrink-0">
                      {inc.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-700 dark:text-neutral-400 leading-snug">{inc.description}</p>
                  <div className="text-[9px] text-stone-400 dark:text-neutral-500 font-mono flex items-center gap-1">
                    📍 {inc.location}
                  </div>
                </div>
              ))}
            {activeTab === 'pagasa' &&
              pagasaAlerts.map((ad) => (
                <div
                  key={ad.id}
                  className="p-3 rounded-2xl bg-[#038F8D]/5 dark:bg-[#038F8D]/2 border border-[#038F8D]/20 dark:border-[#038F8D]/10 text-xs space-y-1.5 border-l-4 border-l-[#038F8D]"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-neutral-850 dark:text-teal-100">{ad.title}</span>
                    {ad.signalNo && (
                      <span className="text-[7.5px] font-black bg-rose-600 dark:bg-rose-700 text-white px-2 py-0.4 rounded">
                        SIGN No. {ad.signalNo}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-700 dark:text-neutral-400 leading-snug">{ad.summary}</p>
                </div>
              ))}
            {activeTab === 'philvolcs' &&
              philvolcsAlerts.map((ad) => (
                <div
                  key={ad.id}
                  className="p-3 rounded-2xl bg-orange-500/5 dark:bg-orange-500/2 border border-orange-200 dark:border-orange-900/40 text-xs space-y-1.5 border-l-4 border-l-orange-500"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-extrabold text-neutral-850 dark:text-orange-100">{ad.title}</span>
                    <span className={`text-[7.5px] font-black px-2 py-0.4 rounded uppercase ${
                      ad.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
                    }`}>
                      {ad.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-700 dark:text-neutral-400 leading-snug">{ad.summary}</p>
                </div>
              ))}
            {activeTab === 'ndrrmc' &&
              ndrrmcAlerts.map((ad) => (
                <div
                  key={ad.id}
                  className="p-3 rounded-2xl bg-red-500/5 dark:bg-red-500/2 border border-red-200 dark:border-red-900/40 text-xs space-y-1.5 border-l-4 border-l-red-500"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-extrabold text-neutral-850 dark:text-red-100">{ad.title}</span>
                    <span className={`text-[7.5px] font-black px-2 py-0.4 rounded uppercase ${
                      ad.severity === 'critical' ? 'bg-red-600 text-white' : ad.severity === 'high' ? 'bg-orange-600 text-white' : 'bg-yellow-600 text-white'
                    }`}>
                      {ad.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-700 dark:text-neutral-400 leading-snug">{ad.summary}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
