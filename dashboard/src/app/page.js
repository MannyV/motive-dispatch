"use client";
// Motive FleetIQ Dashboard v1.1

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
  Info,
  Truck,
  Shield,
  FileCheck,
  Fuel,
  CreditCard,
  PenTool,
  Users,
  Target,
  FileText,
  ShoppingBag,
  LayoutDashboard,
  Camera,
  Smartphone
} from 'lucide-react';

const mockLocationsFallback = [
  { id: 1, name: "14 Washington Square N, NY", access: "Rear Alley", code: "#4592", cues: "Blue Door", verified: "10 mins ago", confidence: "98%", recentHistory: ["DA Mike logged Blue Door (10m ago)", "DA System verified #4592 (2d ago)"] },
  { id: 2, name: "100 Broadway, NY", access: "Loading Dock", code: "Keyfob Required", cues: "Next to green awning", verified: "2 hours ago", confidence: "85%", recentHistory: ["DA James requested access routing (2h ago)", "DA Sarah reported loading dock delay (1w ago)"] },
  { id: 3, name: "2500 Broadway, NY", access: "Delivery Room", code: "See Guard", cues: "Glass rotating door", verified: "1 hour ago", confidence: "95%", recentHistory: ["DA Alex confirmed Guard presence (1h ago)"] },
  { id: 4, name: "333 W 42nd St, NY", access: "Side Gate", code: "#1122", cues: "Brick wall, white gate", verified: "5 hours ago", confidence: "90%", recentHistory: ["DA Chris logged code #1122 (5h ago)"] },
  { id: 5, name: "888 8th Ave, NY", access: "Valet Area", code: "None", cues: "Palm trees, driveway", verified: "1 day ago", confidence: "99%", recentHistory: ["DA Sam reported easy dropoff (1d ago)"] },
  { id: 6, name: "450 3rd Ave, NY", access: "Mail Room", code: "6789#", cues: "Blue awning, keypad on left", verified: "30 mins ago", confidence: "97%", recentHistory: ["DA Pat updated keypad location (30m ago)"] },
  { id: 7, name: "777 Pine St, Brooklyn, NY", access: "Front Desk", code: "None", cues: "Large glass windows", verified: "2 days ago", confidence: "88%", recentHistory: ["DA Taylor logged front desk (2d ago)"] }
];

const mockInterventions = [
  {
    id: 1,
    type: "warning",
    da: "Mike",
    van: "Van 12",
    trigger: "requested access to 14 Washington Square N.",
    action: "Sent code #1984",
    timeSaved: "4m",
    transcript: "Mike: 'Hey I am at 14 Washington Square N, is there a code for the gate?'\nFleetIQ Bot: 'Yes, checking knowledge graph... The code is #1984.'",
    status: "Auto-Resolved",
    source: "macro",
    thumbnail: "https://loremflickr.com/400/400/gate,keypad/all"
  },
  {
    id: 2,
    type: "mic",
    da: "Sarah",
    van: "Van 08",
    trigger: "logged new visual cue for 1200 5th Ave.",
    action: "Knowledge Graph updated globally",
    timeSaved: "Sys-Wide",
    transcript: "[Voice Memo Analyzed] 'Just a heads up for the next driver, the entrance is actually the blue door in the rear alley, not the main street.'",
    status: "Indexed",
    source: "micro",
    thumbnail: "https://loremflickr.com/400/400/blue,door/all"
  },
  {
    id: 3,
    type: "warning",
    da: "James",
    van: "Flex",
    trigger: "stuck at 100 Broadway.",
    action: "Directed to Loading Dock",
    timeSaved: "6m",
    transcript: "James: 'Front desk won't take these packages for 100 Broadway.'\nFleetIQ Bot: '100 Broadway policy requires large deliveries through the Loading Dock. Walk past the green awning.'",
    status: "Auto-Resolved",
    source: "macro",
    thumbnail: "https://loremflickr.com/400/400/loading,dock/all"
  },
  {
    id: 4,
    type: "mic",
    da: "Alex",
    van: "Van 05",
    trigger: "logged visual cue for 2500 Broadway.",
    action: "Knowledge Graph updated globally",
    timeSaved: "Sys-Wide",
    transcript: "[Voice Memo Analyzed] 'The delivery room is right of the glass rotating doors, see the guard.'",
    status: "Indexed",
    source: "micro",
    thumbnail: "https://loremflickr.com/400/400/glass,door,guard/all"
  },
  {
    id: 5,
    type: "warning",
    da: "Chris",
    van: "Van 02",
    trigger: "requested access to 333 W 42nd St.",
    action: "Sent code #1122",
    timeSaved: "5m",
    transcript: "Chris: 'Hey, I'm at the white side gate at 42nd St.'\nFleetIQ Bot: 'I see a white gate in the graph. The code is #1122.'",
    status: "Auto-Resolved",
    source: "macro",
    thumbnail: "https://loremflickr.com/400/400/white,gate/all"
  },
  {
    id: 6,
    type: "warning",
    da: "Sam",
    van: "Van 11",
    trigger: "stuck at 888 8th Ave.",
    action: "Directed to Valet Area",
    timeSaved: "3m",
    transcript: "Sam: 'Nowhere to park here.'\nFleetIQ Bot: 'Graph shows valet area allows quick 5-min drops. Pull in past the driveway.'",
    status: "Auto-Resolved",
    source: "macro",
    thumbnail: "https://loremflickr.com/400/400/hotel,valet/all"
  },
  {
    id: 7,
    type: "mic",
    da: "Pat",
    van: "Flex",
    trigger: "logged new access code for 450 3rd Ave.",
    action: "Knowledge Graph updated globally",
    timeSaved: "Sys-Wide",
    transcript: "[Image Parsed] Extracted text '6789#' from detected keypad on blue awning column.",
    status: "Indexed",
    source: "micro",
    thumbnail: "https://loremflickr.com/400/400/keypad,security/all"
  },
  {
    id: 8,
    type: "mic",
    da: "Taylor",
    van: "Van 15",
    trigger: "logged visual cue for 777 Pine St, Brooklyn.",
    action: "Knowledge Graph updated globally",
    timeSaved: "Sys-Wide",
    transcript: "[Image Parsed] Identified front desk behind large glass windows. Added to visual cues.",
    status: "Indexed",
    source: "macro",
    thumbnail: "https://loremflickr.com/400/400/front,desk,lobby/all"
  }
];

export default function FleetIQDashboard() {
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
        .from('motive_dispatch_intelligence')
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
          recentHistory: ["AI Logged via FleetIQ Bot (" + new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")"]
        }));

        const dynamicInterventions = data.map(item => ({
          id: 'live-' + item.id,
          type: "mic",
          da: "FleetIQ DA",
          van: "Active",
          trigger: `logged new intel for ${item.location_identifier}.`,
          action: "Knowledge Graph updated",
          timeSaved: "Sys-Wide",
          transcript: `[Parsed Intelligence] Visual cues updated to: ${item.structured_data?.visual_cues || 'None'}. Access point: ${item.structured_data?.access_point || 'None'}.`,
          status: "Indexed",
          source: (Math.random() > 0.5 ? "macro" : "micro"),
          thumbnail: "https://images.unsplash.com/photo-1541888069502-cd53bed07ee2?w=100&h=100&fit=crop"
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'motive_dispatch_intelligence' }, (payload) => {
        console.log("Realtime event received!", payload);
        // Just refetch on any change to keep logic simple
        fetchLocations();
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      console.log("Cleaning up realtime subscription...");
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#0066FF]/20 flex">

      {/* Sidebar - Motive Theme */}
      <aside className="w-[240px] bg-[#000000] text-slate-300 flex flex-col h-screen sticky top-0 flex-shrink-0">
        <div className="px-6 py-6 border-b border-slate-900">
          <h1 className="text-white text-[28px] font-bold tracking-tight italic">
            motive
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 text-[14px] font-medium space-y-1">
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><LayoutDashboard className="w-5 h-5 text-slate-400" /> Fleet View</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><Shield className="w-5 h-5 text-slate-400" /> Safety</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><FileCheck className="w-5 h-5 text-slate-400" /> Compliance</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><Fuel className="w-5 h-5 text-slate-400" /> Fuel</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><CreditCard className="w-5 h-5 text-slate-400" /> Cards</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><PenTool className="w-5 h-5 text-slate-400" /> Maintenance</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><Users className="w-5 h-5 text-slate-400" /> Workforce <span className="ml-auto text-[10px] border border-slate-500 rounded px-1">NEW</span></a>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0066FF]"></div>
            <a href="#" className="flex items-center gap-3 px-6 py-2.5 text-[#3b82f6] bg-white/5"><Navigation className="w-5 h-5" /> FleetIQ</a>
          </div>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><Target className="w-5 h-5 text-slate-400" /> Coaching</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><MessageSquare className="w-5 h-5 text-slate-400" /> Messages</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><FileText className="w-5 h-5 text-slate-400" /> Documents</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><BarChart className="w-5 h-5 text-slate-400" /> Reports</a>
          <a href="#" className="flex items-center gap-3 px-6 py-2.5 hover:bg-white/10 transition-colors"><ShoppingBag className="w-5 h-5 text-slate-400" /> Marketplace</a>
        </nav>
        <div className="px-6 py-4 flex items-center justify-between text-slate-400 border-t border-slate-900">
          <UserCircle className="w-5 h-5 cursor-pointer hover:text-white" />
          <HelpCircle className="w-5 h-5 cursor-pointer hover:text-white" />
          <Bell className="w-5 h-5 cursor-pointer hover:text-white" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f9fafc]">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center text-[14px] text-slate-500 font-medium">
            <span className="hover:text-slate-800 cursor-pointer">Operations</span>
            <span className="mx-3 text-slate-300">/</span>
            <span className="hover:text-slate-800 cursor-pointer">FleetIQ</span>
            <span className="mx-3 text-slate-300">/</span>
            <span className="font-semibold text-slate-800">FleetIQ Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-[13px] font-semibold border border-slate-300 rounded px-4 py-1.5 text-slate-700 hover:bg-slate-50 bg-white shadow-sm">Export <ChevronDown className="w-3 h-3 inline ml-1" /></button>
            <button className="text-[13px] font-semibold border border-slate-300 rounded px-4 py-1.5 text-slate-700 hover:bg-slate-50 bg-white shadow-sm">Duplicate</button>
          </div>
        </header>

        <main className="p-8 max-w-[1600px] w-full mx-auto space-y-6 flex-1">

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
                      <a href="#" className="text-[#0066FF] hover:text-[#18aebf] transition-colors hover:underline inline-flex items-center gap-1 font-medium">View Roster Dashboard &rarr;</a>
                    </div>
                  </div>
                </h3>
                <div className="flex items-baseline gap-2 mb-1 mt-1">
                  <span className="text-3xl font-light text-slate-800 tracking-tight">42 / 50</span>
                  <span className="text-sm text-slate-500 border-l border-slate-200 pl-2">DAs</span>
                </div>
                <span className="text-[11px] text-[#0066FF] font-medium flex items-center">
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
                      <a href="#" className="text-[#0066FF] hover:text-[#18aebf] transition-colors hover:underline inline-flex items-center gap-1 font-medium">View Labor Analytics &rarr;</a>
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
                  Stop Service Time (SST) Reduced
                  <div className="relative group/tooltip ml-auto md:ml-0 md:inline-block">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-white text-slate-700 text-[11px] p-3 rounded shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[120] font-normal normal-case tracking-normal border border-slate-200 pointer-events-auto text-left">
                      <p className="mb-2">Total time saved by removing last-50-feet frictions via Motive Routing interventions (e.g. gate codes, specific access points).</p>
                      <a href="#" className="text-[#0066FF] hover:text-[#18aebf] transition-colors hover:underline inline-flex items-center gap-1 font-medium">View SST Analytics &rarr;</a>
                    </div>
                  </div>
                </h3>
                <div className="flex items-baseline gap-2 mb-1 mt-1">
                  <span className="text-3xl font-light text-slate-800 tracking-tight">14</span>
                  <span className="text-sm text-slate-500 border-l border-slate-200 pl-2">hrs</span>
                </div>
                <span className="text-[11px] text-[#0066FF] font-medium flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified Reduction
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
                      <a href="#" className="text-[#0066FF] hover:text-[#18aebf] transition-colors hover:underline inline-flex items-center gap-1 font-medium">View Operations Financials &rarr;</a>
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
                  <Database className="w-4 h-4 text-[#0066FF]" />
                  Last-50-Feet Knowledge Graph
                </h2>
                <div className="relative w-[300px]">
                  <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-md text-[13px] bg-slate-50 outline-none focus:border-[#0066FF]"
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
                        className={`transition-colors cursor-pointer ${selectedLocation?.id === loc.id ? 'bg-[#0066FF]/5' : 'hover:bg-slate-50/80'}`}
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#18aebf]/10 text-[#0066FF]">{loc.cues}</span>
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
                <h2 className="text-[15px] font-semibold text-slate-800">Live Intelligence Feed</h2>
                <div className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0066FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0066FF]"></span>
                </div>
              </div>

              <div className="p-5 flex-1 overflow-auto bg-slate-50/30 space-y-4">
                {interventions.map((intv) => (
                  <div
                    key={intv.id}
                    onClick={() => setSelectedIntervention(intv)}
                    className={`border rounded-lg p-4 shadow-sm relative overflow-hidden transition-all cursor-pointer hover:shadow-md ${selectedIntervention?.id === intv.id ? 'border-[#0066FF] bg-[#0066FF]/5' : 'border-slate-200 bg-white'}`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${intv.type === 'warning' ? 'bg-yellow-400' : 'bg-[#0066FF]'}`}></div>

                    <div className="flex items-start gap-4 mb-2">
                      {intv.thumbnail && (
                        <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm mt-0.5">
                          <img src={intv.thumbnail} className="object-cover w-full h-full" alt="thumbnail" />
                          <div className="absolute bottom-0 right-0 bg-white shadow rounded-tl p-0.5">
                            {intv.source === 'macro' ? <Camera className="w-3 h-3 text-slate-700" /> : <Smartphone className="w-3 h-3 text-[#0066FF]" />}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col mb-2">
                          <p className="text-[13px] text-slate-600 leading-snug">
                            <strong className="text-slate-800 font-semibold">DA {intv.da}</strong> <span className="text-slate-400 text-[11px] mx-1">{intv.van}</span> {intv.trigger}
                          </p>
                        </div>
                        <div className={`border rounded p-2.5 flex items-start gap-2.5 ${intv.type === 'warning' ? 'bg-[#f0f9fa] border-[#bce3eb]' : 'bg-slate-50 border-slate-200'}`}>
                          {intv.type === 'warning' ? <CheckCircle2 className="w-4 h-4 text-[#0066FF] mt-0.5 flex-shrink-0" /> : <Database className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                          <div>
                            <p className="text-[12px] font-medium text-slate-800">{intv.action}</p>
                            <span className={`inline-block mt-1.5 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${intv.type === 'warning' ? 'text-[#0066FF] bg-[#0066FF]/10' : 'text-slate-500 bg-slate-200'}`}>
                              {intv.type === 'warning' ? `Time saved: ${intv.timeSaved}` : 'Indexed'}
                            </span>
                          </div>
                        </div>
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
                  <MapPin className="w-5 h-5 text-[#0066FF]" />
                  Location Intelligence
                </h2>
                <button onClick={() => { setSelectedLocation(null); setIsEditing(false); }} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedLocation.name}</h1>

                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span className="bg-[#0066FF]/10 text-[#0066FF] text-xs font-bold px-2 py-1 rounded">Confidence: {selectedLocation.confidence}</span>
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded">Source Fusion: Verified by Dashcam + DA</span>
                  <span className="text-slate-400 text-xs ml-auto">Verified {selectedLocation.verified}</span>
                </div>

                {/* Split-View Media Gallery */}
                <div className="mb-6 space-y-2">
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5 mb-2"><Camera className="w-3.5 h-3.5" /> Visual Evidence</h4>
                  <div className="grid grid-rows-2 gap-3 h-64">
                    <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 group shadow-sm">
                      <img src="https://loremflickr.com/800/400/street,dashcam/all" alt="Macro View" className="object-cover w-full h-full" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-end">
                        <span className="text-white text-xs font-medium tracking-wide flex items-center"><Camera className="w-3 h-3 mr-1.5 opacity-80" /> Macro View (Dashcam)</span>
                      </div>
                    </div>
                    <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 group shadow-sm">
                      <img src="https://loremflickr.com/800/400/blue,door,close/all" alt="Micro View" className="object-cover w-full h-full" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-end">
                        <span className="text-white text-xs font-medium tracking-wide flex items-center"><Smartphone className="w-3 h-3 mr-1.5 opacity-80" /> Micro View (DA Upload - Blue Door)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Mock & Heat Zone */}
                <div className="w-full h-32 bg-slate-100 rounded-lg mb-6 border border-slate-200 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M0 0h20v20H0V0zm10 10l10-10H0l10 10z\\' fill=\\'%23ccc\\' fill-opacity=\\'0.4\\' fill-rule=\\'evenodd\\'/%3E%3C/svg%3E')", backgroundSize: "20px" }}></div>
                  <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none">
                    <path d="M 40,100 Q 150,150 200,80 T 400,60" fill="none" stroke="rgba(0, 102, 255, 0.25)" strokeWidth="36" strokeLinecap="round" className="animate-pulse" />
                    <path d="M 40,100 Q 150,150 200,80 T 400,60" fill="none" stroke="#0066FF" strokeWidth="3" strokeDasharray="6 6" className="animate-[dash_3s_linear_infinite]" />
                    <circle cx="40" cy="100" r="5" fill="#0066FF" className="shadow" />
                    <circle cx="400" cy="60" r="5" fill="#ff9900" />
                  </svg>
                  <style>{`
                    @keyframes dash {
                      to { stroke-dashoffset: -12; }
                    }
                    .animate-[dash_3s_linear_infinite] {
                      animation: dash 3s linear infinite;
                    }
                  `}</style>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Access Point</h4>
                    {isEditing ? (
                      <input
                        value={editForm.access}
                        onChange={e => setEditForm({ ...editForm, access: e.target.value })}
                        className="w-full bg-white border border-[#0066FF] rounded px-3 py-2 text-slate-800 font-medium focus:outline-none"
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
                          className="w-full bg-white border border-[#0066FF] rounded px-3 py-2 font-mono text-sm font-semibold focus:outline-none"
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
                          className="w-full bg-white border border-[#0066FF] rounded px-3 py-2 text-[#0066FF] text-sm font-medium focus:outline-none"
                        />
                      ) : (
                        <div className="bg-[#18aebf]/10 border border-[#18aebf]/20 rounded px-3 py-2 text-[#0066FF] text-sm font-medium">
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
                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#0066FF] shadow shadow-[#0066FF]/40"></div>
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
                      const { data } = await supabase.from('motive_dispatch_intelligence').select('structured_data').eq('id', selectedLocation.id).single();
                      if (data) {
                        const updated = {
                          ...data.structured_data,
                          access_point: editForm.access,
                          access_code: editForm.code,
                          visual_cues: editForm.cues.split(',').map(s => s.trim())
                        };
                        await supabase.from('motive_dispatch_intelligence').update({ structured_data: updated }).eq('id', selectedLocation.id);
                      }
                      setIsEditing(false);
                    }} className="flex-1 bg-[#0066FF] text-white font-medium rounded py-2 hover:bg-[#007082] transition-colors shadow-sm">
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
                  <div className={`p-1.5 rounded-full ${selectedIntervention.type === 'warning' ? 'bg-[#0066FF]/10 text-[#0066FF]' : 'bg-blue-100 text-blue-600'}`}>
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
                {selectedIntervention.thumbnail && (
                  <div className="mb-4">
                    <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Event Visual Evidence
                    </h4>
                    <div className="relative rounded border border-slate-200 shadow-sm overflow-hidden bg-white p-1">
                      <img src={selectedIntervention.thumbnail} className="w-full h-auto max-h-64 object-cover rounded shadow-inner" alt="Evidence" />
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Transcript / Payload
                  </h4>
                  <div className="bg-white border border-slate-200 rounded p-4 text-sm font-medium text-slate-700 whitespace-pre-wrap shadow-inner leading-relaxed">
                    {selectedIntervention.transcript}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex-1 bg-white border border-[#0066FF]/30 rounded p-4 relative shadow-[0_2px_10px_rgba(0,130,150,0.05)]">
                    <div className="absolute -top-2 left-4 bg-[#0066FF] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">FleetIQ Outcome</div>
                    <p className="text-sm font-medium text-slate-800 mt-1">{selectedIntervention.action}</p>
                  </div>

                  {selectedIntervention.type === 'warning' && (
                    <div className="flex-shrink-0 text-center px-4">
                      <span className="block text-2xl font-light text-[#0066FF]">{selectedIntervention.timeSaved}</span>
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

        {/* End Main Content Wrapper */}
      </div>
    </div>
  );
}
