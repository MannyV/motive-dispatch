"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  TrendingUp,
  Clock,
  ShieldCheck,
  DollarSign,
  Search,
  AlertTriangle,
  CheckCircle2,
  Mic,
  Database,
  UserCircle,
  Bell,
  HelpCircle,
  ChevronDown,
  X,
  MapPin,
  MessageSquare,
  History,
  Navigation,
  ArrowRight,
  Info
} from 'lucide-react';

const mockLocationsFallback = [
  { id: 1, name: "14 Rue de Rivoli, Paris", access: "Rear Alley", code: "#4592", cues: "Blue Door", verified: "10 mins ago", confidence: "98%", recentHistory: ["DA Chloe logged Blue Door (10m ago)", "DA System verified #4592 (2d ago)"] },
  { id: 2, name: "Building C, Canary Wharf", access: "Loading Dock", code: "Keyfob Required", cues: "Next to green awning", verified: "2 hours ago", confidence: "85%", recentHistory: ["DA Liam requested access routing (2h ago)", "DA Sarah reported loading dock delay (1w ago)"] },
];

const mockInterventions = [
  {
    id: 1,
    type: "warning",
    da: "Marco",
    van: "Van 12",
    trigger: "requested access to Via Roma 42.",
    action: "Sent code #1984",
    timeSaved: "4m",
    transcript: "Marco: 'Hey I am at Via Roma 42, is there a code for the gate?'\nDispatch Bot: 'Yes, checking knowledge graph... The code is #1984.'",
    status: "Auto-Resolved"
  },
  {
    id: 2,
    type: "mic",
    da: "Chloe",
    van: "Van 08",
    trigger: "logged new visual cue for 14 Rue de Rivoli.",
    action: "Knowledge Graph updated globally",
    timeSaved: "Sys-Wide",
    transcript: "[Voice Memo Analyzed] 'Just a heads up for the next driver, the entrance is actually the blue door in the rear alley, not the main street.'",
    status: "Indexed"
  },
  {
    id: 3,
    type: "warning",
    da: "Liam",
    van: "Flex",
    trigger: "stuck at Building C.",
    action: "Directed to Loading Dock",
    timeSaved: "6m",
    transcript: "Liam: 'Front desk won't take these packages for Building C.'\nDispatch Bot: 'Building C policy requires large deliveries through the Loading Dock. Walk past the green awning.'",
    status: "Auto-Resolved"
  },
];

export default function DispatchDashboard() {
  const [locations, setLocations] = useState(mockLocationsFallback);
  const [interventions, setInterventions] = useState(mockInterventions);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ access: '', code: '', cues: '' });

  // Fetch from Supabase
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('atoz_dispatch_intelligence')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formattedData = data.map(item => ({
          id: item.id,
          name: item.location_identifier,
          access: item.structured_data?.access_point || "Unknown",
          code: item.structured_data?.access_code || "None",
          cues: Array.isArray(item.structured_data?.visual_cues) ? item.structured_data.visual_cues.join(', ') : (item.structured_data?.visual_cues || "None"),
          verified: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          confidence: "99%", // Placeholder for AI confidence
          recentHistory: ["AI Logged via Dispatch Bot (" + new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")"]
        }));

        const dynamicInterventions = data.map(item => ({
          id: 'live-' + item.id,
          type: "mic",
          da: "DispatchDA",
          van: "Active",
          trigger: `logged new intel for ${item.location_identifier}.`,
          action: "Knowledge Graph updated",
          timeSaved: "Sys-Wide",
          transcript: `[Parsed Intelligence] Visual cues updated to: ${item.structured_data?.visual_cues || 'None'}. Access point: ${item.structured_data?.access_point || 'None'}.`,
          status: "Indexed"
        }));

        setLocations([...formattedData, ...mockLocationsFallback]);
        setInterventions([...dynamicInterventions, ...mockInterventions]);
      } else {
        setLocations(mockLocationsFallback);
        setInterventions(mockInterventions);
      }
    };

    fetchLocations();

    // Setup Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atoz_dispatch_intelligence' }, () => {
        // Just refetch on any change to keep logic simple
        fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f9fbfc] text-slate-800 font-sans selection:bg-[#008296]/20 relative">

      {/* Top Navigation Bar - Motive Dark Theme */}
      <header className="sticky top-0 z-50 bg-[#232f3e] text-white flex flex-col shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 mr-4">
              <div className="w-8 h-8 rounded bg-[#ff9900] flex items-center justify-center text-slate-900 font-bold text-lg shadow-sm">
                a
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Motive <span className="font-normal text-slate-300">Dispatch</span>
              </h1>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-300">
              <a href="#" className="hover:text-white transition-colors">Home</a>
              <a href="#" className="hover:text-white transition-colors">Scheduling</a>
              <a href="#" className="hover:text-white transition-colors">Work Summary Tool</a>
              <a href="#" className="hover:text-white transition-colors">Operations</a>
              <a href="#" className="text-white border-b-2 border-[#ff9900] pb-1 font-semibold transition-colors">Dispatch</a>
              <a href="#" className="hover:text-white transition-colors">Performance</a>
            </nav>
          </div>

          <div className="flex items-center gap-5 text-slate-300">
            <div className="relative cursor-pointer hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">22</span>
            </div>
            <HelpCircle className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            <UserCircle className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>

        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 border border-slate-300 rounded px-3 py-1.5 min-w-[200px] text-slate-600 cursor-pointer hover:border-slate-400 bg-slate-50">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="font-medium">DCS3</span>
              <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
            </div>
            <div className="flex items-center gap-2 border border-slate-300 rounded px-3 py-1.5 text-slate-600 bg-white shadow-sm">
              <span className="font-medium text-[13px]">10/06/2026</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto space-y-6">

        {/* KPI Ribbon */}
        <section className="bg-white border text-center border-slate-200 rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-visible">
          <div className="flex items-start justify-between min-w-[800px] divide-x divide-slate-100">
            {/* Metric 1 */}
            <div className="flex-1 px-4 text-left group cursor-pointer relative">
              <h3 className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 w-full relative">
                Live Fleet Adoption
                <div className="relative group/tooltip ml-auto md:ml-0 md:inline-block">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white text-slate-700 text-[11px] p-3 rounded shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[120] font-normal normal-case tracking-normal border border-slate-200 pointer-events-auto text-left">
                    <p className="mb-2">Daily active DAs utilizing Motive Routing Intelligence divided by your total available roster.</p>
                    <a href="#" className="text-[#008296] hover:text-[#18aebf] transition-colors hover:underline inline-flex items-center gap-1 font-medium">View Roster Dashboard &rarr;</a>
                  </div>
                </div>
              </h3>
              <div className="flex items-baseline gap-2 mb-1 mt-1">
                <span className="text-3xl font-light text-slate-800 tracking-tight">42 / 50</span>
                <span className="text-sm text-slate-500 border-l border-slate-200 pl-2">DAs</span>
              </div>
              <span className="text-[11px] text-[#008296] font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> Utilizing Motive Routing
              </span>
            </div>
            {/* Metric 2 */}
            <div className="flex-1 px-6 text-left group cursor-pointer relative">
              <h3 className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 w-full relative">
                Variable Labor Saved
                <div className="relative group/tooltip ml-auto md:ml-0 md:inline-block">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-white text-slate-700 text-[11px] p-3 rounded shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[120] font-normal normal-case tracking-normal border border-slate-200 pointer-events-auto text-left">
                    <p className="mb-2">Calculated by multiplying the estimated time saved per AI auto-resolution by your local average DA hourly rate limit.</p>
                    <a href="#" className="text-[#008296] hover:text-[#18aebf] transition-colors hover:underline inline-flex items-center gap-1 font-medium">View Labor Analytics &rarr;</a>
                  </div>
                </div>
              </h3>
              <div className="flex items-baseline gap-2 mb-1 mt-1">
                <span className="text-3xl font-light text-slate-800 tracking-tight">28.5</span>
                <span className="text-sm text-slate-500 border-l border-slate-200 pl-2">hrs</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Current Week</span>
            </div>
            {/* Metric 3 */}
            <div className="flex-1 px-6 text-left group cursor-pointer relative">
              <h3 className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 w-full relative">
                OTD Penalties Prevented
                <div className="relative group/tooltip ml-auto md:ml-0 md:inline-block">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-white text-slate-700 text-[11px] p-3 rounded shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[120] font-normal normal-case tracking-normal border border-slate-200 pointer-events-auto text-left">
                    <p className="mb-2">Measure of high-risk "Late" mapped packages successfully delivered exclusively via direct Motive Routing intervention.</p>
                    <a href="#" className="text-[#008296] hover:text-[#18aebf] transition-colors hover:underline inline-flex items-center gap-1 font-medium">View OTD Scorecard &rarr;</a>
                  </div>
                </div>
              </h3>
              <div className="flex items-baseline gap-2 mb-1 mt-1">
                <span className="text-3xl font-light text-slate-800 tracking-tight">14</span>
              </div>
              <span className="text-[11px] text-[#008296] font-medium flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1" /> Bonus Shielded
              </span>
            </div>
            {/* Metric 4 */}
            <div className="flex-1 pl-6 text-left group cursor-pointer relative">
              <h3 className="text-slate-500 text-[11px] uppercase tracking-wider font-bold text-[#ff9900] mb-1 flex items-center gap-1 w-full relative">
                Margin Protected
                <div className="relative group/tooltip ml-auto md:ml-0 md:inline-block">
                  <Info className="w-3.5 h-3.5 text-[#ff9900]/80 hover:text-[#ff9900] transition-colors" />
                  <div className="absolute top-full right-0 md:left-1/2 md:-translate-x-1/2 mt-2 w-56 bg-white text-slate-700 text-[11px] p-3 rounded shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[120] font-normal normal-case tracking-normal border border-slate-200 pointer-events-auto text-left">
                    <p className="mb-2">Total cumulative estimated labor savings added to prevented concession costs and preserved bonuses for the week.</p>
                    <a href="#" className="text-[#008296] hover:text-[#18aebf] transition-colors hover:underline inline-flex items-center gap-1 font-medium">View Operations Financials &rarr;</a>
                  </div>
                </div>
              </h3>
              <div className="flex items-baseline gap-1 mb-1 mt-1">
                <span className="text-3xl font-light text-slate-800 tracking-tight">
                  <span className="text-xl text-slate-400 font-medium mr-1">$</span>1,420
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Estimate</span>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

          {/* Table Area */}
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[650px] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
              <h2 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#008296]" />
                Last-50-Feet Knowledge Graph
              </h2>
              <div className="relative w-[300px]">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-md text-[13px] bg-slate-50 outline-none focus:border-[#008296]"
                  placeholder="Search intelligence..."
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-left">
                <thead className="text-[11px] uppercase text-slate-500 font-semibold bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 border-r border-slate-200 w-[20px]"><input type="checkbox" className="rounded" /></th>
                    <th className="px-5 py-3 border-r border-slate-200 text-slate-700">Location ID</th>
                    <th className="px-5 py-3 border-r border-slate-200">Access Point</th>
                    <th className="px-5 py-3 border-r border-slate-200">Access Code</th>
                    <th className="px-5 py-3 border-r border-slate-200">Visual Cues</th>
                    <th className="px-5 py-3 text-right">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-slate-700 divide-y divide-slate-100">
                  {locations.map((loc) => (
                    <tr
                      key={loc.id}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setIsEditing(false);
                        setEditForm({ access: loc.access, code: loc.code, cues: loc.cues });
                      }}
                      className={`transition-colors cursor-pointer ${selectedLocation?.id === loc.id ? 'bg-[#008296]/5' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="px-5 py-3 border-r border-slate-100"><input type="checkbox" className="rounded" /></td>
                      <td className="px-5 py-3 border-r border-slate-100 font-medium text-slate-900">{loc.name}</td>
                      <td className="px-5 py-3 border-r border-slate-100">{loc.access}</td>
                      <td className="px-5 py-3 border-r border-slate-100 font-mono text-[12px]">
                        {loc.code === "None" ? <span className="italic text-slate-400">None</span> :
                          loc.code === "Keyfob Required" ? <span className="text-[#ff9900] bg-[#ff9900]/10 px-2 py-0.5 rounded border border-[#ff9900]/20">{loc.code}</span> :
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600">{loc.code}</span>}
                      </td>
                      <td className="px-5 py-3 border-r border-slate-100">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#18aebf]/10 text-[#008296]">{loc.cues}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-[11px] text-right">{loc.verified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Interventions Feed */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm h-[650px] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h2 className="text-[15px] font-semibold text-slate-800">Real-Time AI Micro-Dispatch</h2>
              <div className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#008296] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#008296]"></span>
              </div>
            </div>

            <div className="p-5 flex-1 overflow-auto bg-slate-50/30 space-y-4">
              {interventions.map((intv) => (
                <div
                  key={intv.id}
                  onClick={() => setSelectedIntervention(intv)}
                  className={`border rounded-lg p-4 shadow-sm relative overflow-hidden transition-all cursor-pointer hover:shadow-md ${selectedIntervention?.id === intv.id ? 'border-[#008296] bg-[#008296]/5' : 'border-slate-200 bg-white'}`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${intv.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'}`}></div>

                  <div className="flex items-start gap-3 mb-2">
                    <div className="mt-0.5 flex-shrink-0">
                      {intv.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-500" /> : <Mic className="w-4 h-4 text-blue-500" />}
                    </div>
                    <p className="text-[13px] text-slate-600 leading-snug">
                      <strong className="text-slate-800 font-semibold">DA {intv.da}</strong> <span className="text-slate-400 text-[11px] mx-1">{intv.van}</span> {intv.trigger}
                    </p>
                  </div>

                  <div className={`border rounded p-2.5 ml-7 flex items-start gap-2.5 ${intv.type === 'warning' ? 'bg-[#f0f9fa] border-[#bce3eb]' : 'bg-slate-50 border-slate-200'}`}>
                    {intv.type === 'warning' ? <CheckCircle2 className="w-4 h-4 text-[#008296] mt-0.5" /> : <Database className="w-4 h-4 text-blue-500 mt-0.5" />}
                    <div>
                      <p className="text-[12px] font-medium text-slate-800">{intv.action}</p>
                      <span className={`inline-block mt-1.5 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${intv.type === 'warning' ? 'text-[#008296] bg-[#008296]/10' : 'text-slate-500 bg-slate-200'}`}>
                        {intv.type === 'warning' ? `Time saved: ${intv.timeSaved}` : 'Indexed'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* --- DRAWERS AND MODALS OVERLAYS --- */}

      {/* Location Slide-Over Drawer */}
      {selectedLocation && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/20 z-[90] transition-opacity" onClick={() => setSelectedLocation(null)}></div>

          <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-[100] border-l border-slate-200 flex flex-col transform transition-transform duration-300">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#008296]" />
                Location Intelligence
              </h2>
              <button onClick={() => { setSelectedLocation(null); setIsEditing(false); }} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 border-b border-slate-200">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedLocation.name}</h1>

              <div className="flex items-center gap-3 mb-6">
                <span className="bg-[#008296]/10 text-[#008296] text-xs font-bold px-2 py-1 rounded">Confidence: {selectedLocation.confidence}</span>
                <span className="text-slate-400 text-xs">Verified {selectedLocation.verified}</span>
              </div>

              {/* Map Mock */}
              <div className="w-full h-40 bg-slate-100 rounded-lg mb-6 border border-slate-200 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M0 0h20v20H0V0zm10 10l10-10H0l10 10z\\' fill=\\'%23ccc\\' fill-opacity=\\'0.4\\' fill-rule=\\'evenodd\\'/%3E%3C/svg%3E')", backgroundSize: "20px" }}></div>
                <div className="w-8 h-8 bg-[#ff9900] rounded-full border-4 border-white shadow-lg flex items-center justify-center relative z-10 animate-bounce">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Access Point</h4>
                  {isEditing ? (
                    <input
                      value={editForm.access}
                      onChange={e => setEditForm({ ...editForm, access: e.target.value })}
                      className="w-full bg-white border border-[#008296] rounded px-3 py-2 text-slate-800 font-medium focus:outline-none"
                    />
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 font-medium">
                      {selectedLocation.access}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Access Code</h4>
                    {isEditing ? (
                      <input
                        value={editForm.code}
                        onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                        className="w-full bg-white border border-[#008296] rounded px-3 py-2 font-mono text-sm font-semibold focus:outline-none"
                      />
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 font-mono text-sm font-semibold">
                        {selectedLocation.code}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Visual Cues</h4>
                    {isEditing ? (
                      <input
                        value={editForm.cues}
                        onChange={e => setEditForm({ ...editForm, cues: e.target.value })}
                        className="w-full bg-white border border-[#008296] rounded px-3 py-2 text-[#008296] text-sm font-medium focus:outline-none"
                      />
                    ) : (
                      <div className="bg-[#18aebf]/10 border border-[#18aebf]/20 rounded px-3 py-2 text-[#008296] text-sm font-medium">
                        {selectedLocation.cues}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1">
                    <History className="w-3 h-3" /> Event History
                  </h4>
                  <ul className="space-y-2 border-l-2 border-slate-100 pl-4 py-1">
                    {selectedLocation.recentHistory.map((hist, i) => (
                      <li key={i} className="text-xs text-slate-600 relative">
                        <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#008296] shadow shadow-[#008296]/40"></div>
                        {hist}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50 flex gap-3">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium rounded py-2 hover:bg-slate-50 transition-colors shadow-sm">
                    Cancel
                  </button>
                  <button onClick={async () => {
                    if (!selectedLocation.id || typeof selectedLocation.id !== 'string' && typeof selectedLocation.id !== 'number') return;
                    // Don't save mock data
                    if (selectedLocation.id <= 10) {
                      setIsEditing(false);
                      return;
                    }
                    const { data } = await supabase.from('atoz_dispatch_intelligence').select('structured_data').eq('id', selectedLocation.id).single();
                    if (data) {
                      const updated = {
                        ...data.structured_data,
                        access_point: editForm.access,
                        access_code: editForm.code,
                        visual_cues: editForm.cues.split(',').map(s => s.trim())
                      };
                      await supabase.from('atoz_dispatch_intelligence').update({ structured_data: updated }).eq('id', selectedLocation.id);
                    }
                    setIsEditing(false);
                  }} className="flex-1 bg-[#008296] text-white font-medium rounded py-2 hover:bg-[#007082] transition-colors shadow-sm">
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(true)} className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium rounded py-2 hover:bg-slate-50 transition-colors shadow-sm">
                    Edit Intelligence
                  </button>
                  <button className="flex-1 bg-[#232f3e] text-white font-medium rounded py-2 hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Navigation className="w-4 h-4" /> Push to Fleet
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Intervention Modal */}
      {selectedIntervention && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[110] flex items-center justify-center" onClick={() => setSelectedIntervention(null)}>

          <div className="bg-white rounded-xl shadow-2xl w-[600px] border border-slate-200 overflow-hidden transform scale-100" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${selectedIntervention.type === 'warning' ? 'bg-[#f0f9fa] border-[#bce3eb]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${selectedIntervention.type === 'warning' ? 'bg-[#008296]/10 text-[#008296]' : 'bg-blue-100 text-blue-600'}`}>
                  {selectedIntervention.type === 'warning' ? <CheckCircle2 className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">AI Resolution Event</h3>
                  <p className="text-xs text-slate-500 font-medium">ID: #{selectedIntervention.id}092-AX</p>
                </div>
              </div>
              <button onClick={() => setSelectedIntervention(null)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded border border-transparent hover:border-slate-200 shadow-sm transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Line */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center gap-2 text-sm text-slate-700">
              <UserCircle className="w-4 h-4 text-slate-400" />
              <strong>DA {selectedIntervention.da}</strong>
              <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono text-slate-500 mx-1">{selectedIntervention.van}</span>
              triggered an intervention.
            </div>

            {/* Transcript/Action */}
            <div className="p-6 bg-slate-50 space-y-4">
              <div>
                <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Transcript / Payload
                </h4>
                <div className="bg-white border border-slate-200 rounded p-4 text-sm font-medium text-slate-700 whitespace-pre-wrap shadow-inner leading-relaxed">
                  {selectedIntervention.transcript}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1 bg-white border border-[#008296]/30 rounded p-4 relative shadow-[0_2px_10px_rgba(0,130,150,0.05)]">
                  <div className="absolute -top-2 left-4 bg-[#008296] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Dispatch Outcome</div>
                  <p className="text-sm font-medium text-slate-800 mt-1">{selectedIntervention.action}</p>
                </div>

                {selectedIntervention.type === 'warning' && (
                  <div className="flex-shrink-0 text-center px-4">
                    <span className="block text-2xl font-light text-[#008296]">{selectedIntervention.timeSaved}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Saved</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">Logged securely via Motive Routing Engine</span>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded hover:bg-slate-50 transition-colors">
                  Flag as Incorrect
                </button>
                <button className="px-4 py-2 bg-[#ff9900] text-slate-900 border border-[#e58a00] text-sm font-semibold rounded hover:bg-[#ff8800] transition-colors shadow-sm flex items-center gap-2" onClick={() => setSelectedIntervention(null)}>
                  Acknowledge <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
