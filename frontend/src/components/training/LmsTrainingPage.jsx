import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Video, 
  FileCheck2, 
  Clock, 
  Users, 
  Play, 
  QrCode, 
  Plus, 
  Award,
  ExternalLink,
  Search,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { lmsApi, locationApi } from '../../services/apiService';

export default function LmsTrainingPage({ setCurrentView }) {
  const [activeTab, setActiveTab] = useState('sessions');
  const [liveCourses, setLiveCourses] = useState([]);
  const [lmsStats, setLmsStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Performance Log State & Dynamic Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSite, setSelectedSite] = useState('');

  // Dropdown list options
  const [clientOptions, setClientOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [siteOptions, setSiteOptions] = useState([]);

  // Trainee Detail Modal State
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);

  useEffect(() => {
    async function loadLmsData() {
      setIsLoading(true);
      try {
        const [courses, stats, clients, sites] = await Promise.all([
          lmsApi.getCourses(),
          lmsApi.getDashboardStats(),
          locationApi.getClients(),
          locationApi.getSites(),
        ]);
        if (courses?.length) setLiveCourses(courses);
        if (stats) setLmsStats(stats);
        if (clients?.length) setClientOptions(clients);
        if (sites?.length) {
          setSiteOptions(sites.map(s => s.site_name || s.name || s));
          const branches = Array.from(new Set(sites.map(s => s.branch).filter(Boolean)));
          if (branches.length) setBranchOptions(branches);
        }
      } catch (err) {
        console.error('Failed loading LMS data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLmsData();
  }, []);

  // Performance Log Demo Sessions Data matching exact screenshot layout
  const initialSessions = [
    {
      id: 'sess-1',
      title: 'Human Rights Policies',
      subject: 'Human Rights Policies',
      subjectCode: 'Human Rights Policies',
      client: 'Unique Delta Force Pvt. Ltd.',
      branch: 'Chennai',
      site: 'Chennai Main Facility',
      traineesCount: 4,
      completed: 4,
      inProgress: 0,
      notStarted: 0,
      completionRate: 100,
      avgScore: '0%',
      traineesList: [
        { id: 't1', empCode: 'EMP-104', name: 'Ramesh Kumar', status: 'Completed', score: '85%' },
        { id: 't2', empCode: 'EMP-108', name: 'Karthik Raja', status: 'Completed', score: '90%' },
        { id: 't3', empCode: 'EMP-112', name: 'Suresh Babu', status: 'Completed', score: '88%' },
        { id: 't4', empCode: 'EMP-119', name: 'Vijay Anand', status: 'Completed', score: '92%' },
      ]
    },
    {
      id: 'sess-2',
      title: 'SOFT SKILLS',
      subject: 'SOFT SKILLS',
      subjectCode: 'SOFT SKILLS',
      client: 'Unique Delta Force Pvt. Ltd.',
      branch: 'Chennai',
      site: 'Chennai Site 2',
      traineesCount: 81,
      completed: 2,
      inProgress: 1,
      notStarted: 78,
      completionRate: 3.1,
      avgScore: '11%',
      traineesList: [
        { id: 't5', empCode: 'EMP-201', name: 'Manoj Sharma', status: 'Completed', score: '78%' },
        { id: 't6', empCode: 'EMP-202', name: 'Deepak Verma', status: 'Completed', score: '82%' },
        { id: 't7', empCode: 'EMP-203', name: 'Anil Yadav', status: 'In Progress', score: '45%' },
        { id: 't8', empCode: 'EMP-204', name: 'Vikram Singh', status: 'Not Started', score: '0%' },
      ]
    },
    {
      id: 'sess-3',
      title: 'FIRE SAFETY & EMERGENCY RESPONSE',
      subject: 'Fire Safety Protocols',
      subjectCode: 'Emergency SOPs',
      client: 'Unique Delta Force Pvt. Ltd.',
      branch: 'Pune',
      site: 'UDF KASARWADI PUNE',
      traineesCount: 145,
      completed: 120,
      inProgress: 15,
      notStarted: 10,
      completionRate: 82.7,
      avgScore: '94%',
      traineesList: [
        { id: 't9', empCode: 'EMP-007', name: 'Manish Godase', status: 'Completed', score: '96%' },
        { id: 't10', empCode: 'EMP-012', name: 'Prakash Patil', status: 'Completed', score: '92%' },
      ]
    },
    {
      id: 'sess-4',
      title: 'PHYSICAL GUARDING & PERIMETER SECURITY',
      subject: 'Access Control',
      subjectCode: 'Perimeter Patrol',
      client: 'Apex Security Solutions',
      branch: 'Mumbai',
      site: 'BKC Business Park',
      traineesCount: 92,
      completed: 85,
      inProgress: 5,
      notStarted: 2,
      completionRate: 92.3,
      avgScore: '88%',
      traineesList: [
        { id: 't11', empCode: 'EMP-301', name: 'Sunil Deshmukh', status: 'Completed', score: '90%' }
      ]
    }
  ];

  // Dynamic Session Filtering
  const filteredSessions = useMemo(() => {
    return initialSessions.filter(s => {
      // Search text filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(query);
        const matchesClient = s.client.toLowerCase().includes(query);
        const matchesBranch = s.branch.toLowerCase().includes(query);
        const matchesSite = s.site.toLowerCase().includes(query);
        const matchesSubject = s.subject.toLowerCase().includes(query);
        if (!matchesTitle && !matchesClient && !matchesBranch && !matchesSite && !matchesSubject) return false;
      }
      // Client Dropdown
      if (selectedClient && !s.client.toLowerCase().includes(selectedClient.toLowerCase())) return false;
      // Branch Dropdown
      if (selectedBranch && !s.branch.toLowerCase().includes(selectedBranch.toLowerCase())) return false;
      // Site Dropdown
      if (selectedSite && !s.site.toLowerCase().includes(selectedSite.toLowerCase())) return false;
      
      return true;
    });
  }, [searchQuery, selectedClient, selectedBranch, selectedSite]);

  const exportSessionCsv = (session) => {
    const headers = ['Session Title,Subject,Client,Branch,Site,Trainees,Completed,InProgress,NotStarted,CompletionRate,AvgScore\n'];
    const row = `"${session.title}","${session.subject}","${session.client}","${session.branch}","${session.site}",${session.traineesCount},${session.completed},${session.inProgress},${session.notStarted},"${session.completionRate}%","${session.avgScore}"\n`;
    const blob = new Blob([headers + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${session.title.replace(/\s+/g, '_')}_Performance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = [
    {
      title: 'Active Courses',
      value: lmsStats?.total_courses ? `${lmsStats.total_courses} Courses` : (liveCourses.length ? `${liveCourses.length} Courses` : '24 Courses'),
      subtitle: lmsStats?.mandatory_count ? `${lmsStats.mandatory_count} Mandatory Modules` : '5 Mandatory Modules',
      icon: BookOpen, color: 'text-sky-500'
    },
    {
      title: 'Enrolled Guards',
      value: lmsStats?.enrolled_count ? `${lmsStats.enrolled_count.toLocaleString()} Trainees` : '1,420 Trainees',
      subtitle: lmsStats?.sites_count ? `Across ${lmsStats.sites_count} Sites` : 'Across 12 Sites',
      icon: Users, color: 'text-emerald-500'
    },
    {
      title: 'Completion Rate',
      value: lmsStats?.completion_rate ? `${lmsStats.completion_rate}%` : '94.2%',
      subtitle: lmsStats?.certified_count ? `${lmsStats.certified_count} Certified Guards` : '1,338 Certified Guards',
      icon: Award, color: 'text-blue-500'
    },
    { title: 'Upcoming Live Classes', value: '4 Sessions', subtitle: 'Scheduled Today', icon: Video, color: 'text-purple-500' }
  ];

  const courses = [
    {
      id: 'c1',
      title: 'Fire Safety & Emergency Response Protocols',
      category: 'Mandatory Safety',
      duration: '45 mins',
      modules: 6,
      enrolled: 420,
      completion: 92,
      level: 'Level 1 Core',
      desc: 'Standard operating procedures for emergency evacuation, fire extinguisher usage, and hazard identification.'
    },
    {
      id: 'c2',
      title: 'Physical Guarding & Site Perimeter Security',
      category: 'Operational',
      duration: '60 mins',
      modules: 8,
      enrolled: 680,
      completion: 96,
      level: 'Level 2 Intermediate',
      desc: 'Access control protocols, visitor badge verification, perimeter patrol routes, and incident escalation.'
    },
    {
      id: 'c3',
      title: 'First Aid & Basic Life Support (BLS)',
      category: 'Medical Safety',
      duration: '30 mins',
      modules: 4,
      enrolled: 310,
      completion: 88,
      level: 'Level 1 Core',
      desc: 'CPR techniques, wound care management, triage procedures, and emergency service communication.'
    },
    {
      id: 'c4',
      title: 'Cyber & Physical Asset Protection',
      category: 'Compliance',
      duration: '40 mins',
      modules: 5,
      enrolled: 250,
      completion: 94,
      level: 'Level 3 Advanced',
      desc: 'Preventing unauthorized data server entry, material gate pass verification, and tailgating prevention.'
    }
  ];

  const calendarEvents = [
    { date: '10', title: 'Fire Drill Practical', type: 'classroom', time: '10:00 AM' },
    { date: '12', title: 'Virtual Incident Handling', type: 'virtual', time: '02:00 PM' },
    { date: '15', title: 'First Aid CPR Refresher', type: 'classroom', time: '11:30 AM' },
    { date: '18', title: 'Self-Paced Ethics Module', type: 'self-learning', time: 'All Day' },
    { date: '22', title: 'Site Inspection Briefing', type: 'virtual', time: '09:00 AM' }
  ];

  return (
    <div className="p-4 max-w-[1920px] mx-auto space-y-6">
      
      {/* Title Banner */}
      <div className="bg-banner text-white p-4 rounded-2xl shadow-md border border-sky-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wide font-serif">LMS & Guard Training Module</h1>
            <p className="text-xs text-slate-200">Session performance analytics, course catalog & live certification tracking</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('live')}
            className="flex items-center space-x-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Live Class</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, idx) => {
          const Icon = k.icon;
          return (
            <div key={idx} className="lms-stat-card bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{k.title}</span>
                <Icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-[var(--text-main)]">{k.value}</div>
                <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{k.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
        {[
          { id: 'sessions', label: 'Session Performance Log', icon: BarChart3 },
          { id: 'catalog', label: 'Course Catalog', icon: BookOpen },
          { id: 'calendar', label: 'Training Calendar & Roster', icon: Calendar },
          { id: 'live', label: 'Live Session Controls', icon: Video },
          { id: 'quiz', label: 'Quiz & Assessments', icon: FileCheck2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--control-hover)] border border-[var(--border-color)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SESSION PERFORMANCE LOG (MATCHING EXACT UPLOADED DESIGN) */}
      {activeTab === 'sessions' && (
        <div className="session-perf-card bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl">
          
          {/* Header & Filter Controls Bar */}
          <div className="session-perf-header p-5 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[var(--text-main)]">Session Performance Log</h2>
              <span className="bg-sky-500/20 text-sky-400 border border-sky-500/40 text-xs px-3 py-0.5 rounded-full font-bold">
                {filteredSessions.length} Sessions
              </span>
            </div>

            {/* Filter controls matching screenshot */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Client, Branch, Site..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--input-border)] text-xs rounded-xl pl-9 pr-4 py-2.5 w-64 focus:outline-none focus:border-sky-500 transition-all placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* All Clients Dropdown */}
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--input-border)] text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="">All Clients</option>
                {clientOptions.map((c, i) => (
                  <option key={i} value={typeof c === 'string' ? c : c.client || c.name}>{typeof c === 'string' ? c : c.client || c.name}</option>
                ))}
              </select>

              {/* All Branches Dropdown */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--input-border)] text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="">All Branches</option>
                {branchOptions.length > 0 ? (
                  branchOptions.map((b, i) => <option key={i} value={b}>{b}</option>)
                ) : (
                  <>
                    <option value="Chennai">Chennai</option>
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                  </>
                )}
              </select>

              {/* All Sites Dropdown */}
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--input-border)] text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="">All Sites</option>
                {siteOptions.length > 0 ? (
                  siteOptions.map((s, i) => <option key={i} value={s}>{s}</option>)
                ) : (
                  <>
                    <option value="Chennai Main Facility">Chennai Main Facility</option>
                    <option value="Chennai Site 2">Chennai Site 2</option>
                    <option value="UDF KASARWADI PUNE">UDF KASARWADI PUNE</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Performance Log Table */}
          <div className="overflow-x-auto">
            <table className="session-perf-table w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--table-header-bg)] text-[var(--text-muted)] text-[11px] uppercase tracking-wider font-extrabold border-b border-[var(--border-color)]">
                  <th className="py-3.5 px-5">SESSION TITLE</th>
                  <th className="py-3.5 px-5">COURSE / SUBJECT</th>
                  <th className="py-3.5 px-5">CLIENT</th>
                  <th className="py-3.5 px-5">BRANCH</th>
                  <th className="py-3.5 px-5 text-center">TRAINEES</th>
                  <th className="py-3.5 px-5">BREAKDOWN (C / IP / NS)</th>
                  <th className="py-3.5 px-5 text-center">COMPLETION</th>
                  <th className="py-3.5 px-5 text-center">AVG. SCORE</th>
                  <th className="py-3.5 px-5 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      
                      {/* SESSION TITLE */}
                      <td className="py-4 px-5 font-extrabold text-[var(--text-main)] text-sm whitespace-nowrap">
                        {session.title}
                      </td>

                      {/* COURSE / SUBJECT */}
                      <td className="py-4 px-5 space-y-0.5">
                        <div className="font-bold text-[var(--text-main)] text-xs">{session.subject}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-medium">{session.subjectCode}</div>
                      </td>

                      {/* CLIENT */}
                      <td className="py-4 px-5 font-bold text-[var(--text-main)] text-xs max-w-[180px] truncate">
                        {session.client}
                      </td>

                      {/* BRANCH */}
                      <td className="py-4 px-5 text-[var(--text-secondary)] text-xs font-semibold">
                        {session.branch}
                      </td>

                      {/* TRAINEES */}
                      <td className="py-4 px-5 text-center font-extrabold text-[var(--text-main)] text-sm">
                        {session.traineesCount}
                      </td>

                      {/* BREAKDOWN (C / IP / NS) */}
                      <td className="py-4 px-5 text-xs whitespace-nowrap font-bold space-x-2">
                        <span className="text-emerald-500 font-extrabold">{session.completed} C</span>
                        <span className="text-amber-500 font-extrabold">{session.inProgress} IP</span>
                        <span className="text-[var(--text-muted)] font-extrabold">{session.notStarted} NS</span>
                      </td>

                      {/* COMPLETION */}
                      <td className="py-4 px-5 text-center min-w-[140px]">
                        <div className="w-full bg-slate-700/40 rounded-full h-2 overflow-hidden mb-1">
                          <div
                            className="bg-sky-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(session.completionRate, 2)}%` }}
                          />
                        </div>
                        <span className="text-xs font-extrabold text-[var(--text-main)]">{session.completionRate}%</span>
                      </td>

                      {/* AVG. SCORE */}
                      <td className="py-4 px-5 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {session.avgScore}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="py-4 px-5 text-center whitespace-nowrap space-x-3">
                        <button
                          onClick={() => setSelectedSessionForModal(session)}
                          className="text-sky-400 hover:text-sky-300 font-extrabold text-xs transition-colors underline"
                        >
                          View Trainees
                        </button>
                        <button
                          onClick={() => exportSessionCsv(session)}
                          className="btn-export-dark inline-flex items-center gap-1.5 bg-[var(--input-bg)] border border-[var(--input-border)] hover:bg-[var(--control-hover)] text-[var(--text-main)] text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Export</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-10 text-center text-[var(--text-muted)] text-sm font-semibold">
                      No sessions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="p-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[var(--text-muted)]">
            <div>
              Showing page 1 of 1 · {filteredSessions.length} total sessions
            </div>
            <div className="flex items-center space-x-2">
              <button disabled className="px-4 py-2 bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)] rounded-xl opacity-50 cursor-not-allowed font-bold">
                Previous
              </button>
              <button disabled className="px-4 py-2 bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)] rounded-xl opacity-50 cursor-not-allowed font-bold">
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map(course => (
            <div key={course.id} className="lms-card p-5 space-y-4 hover:border-sky-500/40 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    {course.category}
                  </span>
                  <h3 className="text-base font-extrabold text-[var(--text-main)] leading-snug">{course.title}</h3>
                </div>
                <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--table-header-bg)] px-2.5 py-1 rounded-lg shrink-0">
                  {course.level}
                </span>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{course.desc}</p>

              <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[var(--text-secondary)]">Completion Rate</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{course.completion}%</span>
                </div>
                <div className="lms-progress-track">
                  <div className="lms-progress-fill" style={{ width: `${course.completion}%` }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 text-[var(--text-muted)]">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    <span>{course.duration}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{course.enrolled} Guards</span>
                  </span>
                </div>

                <button className="flex items-center space-x-1 bg-[var(--btn-primary)] hover:opacity-90 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs">
                  <span>Start Module</span>
                  <Play className="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TRAINING CALENDAR & ROSTER */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 lms-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-[var(--text-main)]">September 2026 Training Roster</h3>
              <div className="flex items-center space-x-2 text-xs">
                <span className="flex items-center space-x-1 text-sky-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span>Classroom</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Virtual</span>
                </span>
                <span className="flex items-center space-x-1 text-amber-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Self-Learning</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--text-muted)]">
              <span>Sunday</span><span>Monday</span><span>Tuesday</span><span>Wednesday</span><span>Thursday</span><span>Friday</span><span>Saturday</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => {
                const dayNum = String(i + 1);
                const events = calendarEvents.filter(e => e.date === dayNum);
                return (
                  <div key={i} className="lms-calendar-cell space-y-1">
                    <span className="text-xs font-bold text-[var(--text-muted)]">{dayNum}</span>
                    {events.map((ev, idx) => (
                      <div key={idx} className={`lms-calendar-event-pill lms-event-${ev.type}`}>
                        <div className="truncate font-bold">{ev.title}</div>
                        <div className="text-[9px] opacity-80">{ev.time}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lms-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-main)] pb-3 border-b border-[var(--border-color)]">
              Upcoming Training Sessions
            </h3>

            <div className="space-y-3">
              {calendarEvents.map((ev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[var(--table-header-bg)] border border-[var(--border-color)] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Sept {ev.date}, 2026</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase lms-event-${ev.type}`}>
                      {ev.type}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-[var(--text-main)]">{ev.title}</p>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">{ev.time} • Mandatory Attendance</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE SESSION CONTROLS */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="lms-card p-6 flex items-center space-x-5">
            <div className="p-4 bg-[var(--table-header-bg)] rounded-2xl border border-[var(--border-color)] text-sky-500 shrink-0">
              <QrCode className="w-14 h-14" />
            </div>
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                ACTIVE LIVE CLASS
              </span>
              <h4 className="text-base font-extrabold text-[var(--text-main)]">Fire Drill Live QR Check-in</h4>
              <p className="text-xs text-[var(--text-muted)]">Guards scan QR code via mobile app for instant automated check-in.</p>
              <button className="text-xs font-extrabold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1">
                <span>Display Fullscreen QR</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="lms-card p-6 flex items-center space-x-5">
            <div className="p-4 bg-sky-500/10 text-sky-500 rounded-2xl shrink-0">
              <Video className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                VIRTUAL CLASSROOM
              </span>
              <h4 className="text-base font-extrabold text-[var(--text-main)]">Incident Handling Stream</h4>
              <p className="text-xs text-[var(--text-muted)]">Live streaming video broadcast for remote site guards.</p>
              <button className="bg-[var(--btn-primary)] hover:opacity-90 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: QUIZ & ASSESSMENTS */}
      {activeTab === 'quiz' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="lms-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-sky-500/10 text-sky-500 rounded-xl">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">Pre-Deployment Ethics Quiz</h4>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">10 Questions • 80% Pass Mark</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Published
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Mandatory 10-question evaluation for new guards before site deployment.</p>
            <button className="w-full bg-[var(--table-header-bg)] hover:bg-[var(--control-hover)] text-[var(--text-main)] font-bold text-xs py-2 rounded-xl border border-[var(--border-color)] transition-all">
              Edit Quiz Questions
            </button>
          </div>

          <div className="lms-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">Annual Refresher Assessment</h4>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">15 Questions • 85% Pass Mark</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                Active
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Recertification test for guards completing 1 year of service.</p>
            <button className="w-full bg-[var(--table-header-bg)] hover:bg-[var(--control-hover)] text-[var(--text-main)] font-bold text-xs py-2 rounded-xl border border-[var(--border-color)] transition-all">
              Edit Quiz Questions
            </button>
          </div>
        </div>
      )}

      {/* VIEW TRAINEES MODAL */}
      {selectedSessionForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--table-header-bg)]">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-main)]">{selectedSessionForModal.title}</h3>
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  {selectedSessionForModal.client} • {selectedSessionForModal.branch} ({selectedSessionForModal.traineesCount} Trainees Enrolled)
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionForModal(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--control-hover)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trainees List Table */}
            <div className="p-5 max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase font-bold text-[10px]">
                    <th className="pb-2">EMP CODE</th>
                    <th className="pb-2">GUARD NAME</th>
                    <th className="pb-2 text-center">STATUS</th>
                    <th className="pb-2 text-right">QUIZ SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {selectedSessionForModal.traineesList && selectedSessionForModal.traineesList.length > 0 ? (
                    selectedSessionForModal.traineesList.map((t) => (
                      <tr key={t.id} className="hover:bg-[var(--bg-surface-hover)]">
                        <td className="py-2.5 font-mono text-[var(--text-muted)]">{t.empCode}</td>
                        <td className="py-2.5 font-bold text-[var(--text-main)]">{t.name}</td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : t.status === 'In Progress'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-700/30 text-slate-400 border border-slate-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-extrabold text-[var(--text-main)]">{t.score}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-[var(--text-muted)]">
                        Enrolled trainees count: {selectedSessionForModal.traineesCount} ({selectedSessionForModal.completed} Completed, {selectedSessionForModal.inProgress} In Progress, {selectedSessionForModal.notStarted} Not Started)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--table-header-bg)]">
              <span className="text-xs text-[var(--text-muted)] font-semibold">
                Completion Rate: {selectedSessionForModal.completionRate}%
              </span>
              <button
                onClick={() => setSelectedSessionForModal(null)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
