import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  RotateCw, 
  Search, 
  X, 
  Calendar, 
  Clock, 
  Download, 
  CheckCircle2, 
  UserCheck,
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Trash2,
  ArrowRightLeft,
  Info,
  Filter,
  AlertCircle
} from 'lucide-react';
import { 
  INITIAL_TIME_LOGS, 
  DAYS_CONFIG, 
  TIMELOGS_CLIENT_OPTIONS, 
  TIMELOGS_BRANCH_OPTIONS, 
  TIMELOGS_SITE_OPTIONS 
} from '../data/timeLogsData';
import { locationApi, timelogsApi } from '../services/apiService';
import MonthYearPicker from './MonthYearPicker';

const MONTH_INDEX_MAP = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDaysForMonth(monthStr) {
  if (!monthStr) return DAYS_CONFIG;
  const parts = monthStr.split('/');
  if (parts.length !== 2) return DAYS_CONFIG;
  const mIndex = MONTH_INDEX_MAP[parts[0]?.trim()];
  const year = parseInt(parts[1]?.trim(), 10);
  if (mIndex === undefined || isNaN(year)) return DAYS_CONFIG;

  const totalDays = new Date(year, mIndex + 1, 0).getDate();
  const days = [];
  const monthAbbr = parts[0]?.trim();
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, mIndex, i);
    const dayStr = String(i).padStart(2, '0');
    days.push({
      day: i,
      dayName: DAY_NAMES[d.getDay()],
      dateStr: `${year}-${String(mIndex + 1).padStart(2, '0')}-${dayStr}`,
      formattedDate: `${dayStr}-${monthAbbr}-${year}`
    });
  }
  return days;
}

const SAVED_FILTERS_KEY = 'qrda_timelogs_filters';

function getInitialFilters() {
  try {
    const saved = localStorage.getItem(SAVED_FILTERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.site) {
        return {
          client: parsed.client || '',
          branch: parsed.branch || '',
          month: parsed.month || 'Sep/2026',
          site: parsed.site || '',
          hasFiltered: Boolean(parsed.hasFiltered && parsed.site)
        };
      }
    }
  } catch (e) {}
  return {
    client: '',
    branch: '',
    month: 'Sep/2026',
    site: '',
    hasFiltered: false
  };
}

export function calculateHours(inTime, outTime) {
  if (!inTime || !outTime) return 8.0;
  const [inH, inM] = inTime.split(':').map(Number);
  const [outH, outM] = outTime.split(':').map(Number);
  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 8.0;
  let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Cross-midnight shift (e.g. 22:00 to 06:00)
  }
  return Math.round((diffMinutes / 60) * 10) / 10;
}

export function generateFallbackLogsForSite(site, month, client, days) {
  const post = site ? site.split(' ')[0] : 'GATE';
  const prefix = (client || 'EMP').slice(0, 3).toUpperCase();
  const sampleGuards = [
    { name: 'RAJU KUMAR', rank: 'RECEP', code: `${prefix}147131`, wo: 'Saturday' },
    { name: 'SK MD IBRAHIM', rank: 'QRT/SUP', code: `${prefix}147618`, wo: 'Sunday' },
    { name: 'MANISH KUMAR', rank: 'QRT/SUP', code: `${prefix}148650`, wo: 'Sunday' },
    { name: 'YOGESHWARI DHIRHI', rank: 'FIELD OFFICER', code: `${prefix}148687`, wo: 'Sunday' },
    { name: 'G SWAPNA', rank: 'FIELD OFFICER', code: `${prefix}148706`, wo: 'Sunday' },
    { name: 'RAMESH CHANDRA', rank: 'S/G', code: `${prefix}149201`, wo: 'Monday' },
    { name: 'ANIL VERMA', rank: 'S/G', code: `${prefix}149305`, wo: 'Tuesday' },
    { name: 'SUNIL SHARMA', rank: 'LS/G', code: `${prefix}149412`, wo: 'Sunday' }
  ];

  return sampleGuards.map((g, idx) => {
    const logs = {};
    days.forEach(d => {
      const isWo = d.dayName.toLowerCase() === g.wo.toLowerCase();
      const dStr = String(d.day).padStart(2, '0');
      if (isWo) {
        logs[d.day] = { status: 'WO' };
      } else if (d.day === 8 && idx === 1) {
        logs[d.day] = { status: 'A' };
      } else if (d.day === 1) {
        logs[d.day] = {
          status: 'IN',
          hours: 8.0,
          post: post,
          shift: 'A-Shift [ 06:00 to 14:00 ]',
          shiftDuration: '8 hrs',
          punches: `${dStr}/ 05:45:00 - IN`,
          netDuration: 'Active'
        };
      } else {
        const shiftType = (idx % 2 === 0) ? 'A-Shift [ 06:00 to 14:00 ]' : 'B-Shift [ 14:00 to 22:00 ]';
        const inP = (idx % 2 === 0) ? '05:48:12' : '13:52:10';
        const outP = (idx % 2 === 0) ? '14:21:34' : '22:15:40';
        logs[d.day] = {
          status: 'P',
          hours: 8.0,
          post: post,
          shift: shiftType,
          shiftDuration: '8 hrs',
          punches: `${dStr}/ ${inP} - ${dStr}/ ${outP}`,
          netDuration: '8h 33m'
        };
      }
    });

    return {
      id: idx + 1,
      empSite: site,
      rank: g.rank,
      empCode: g.code,
      name: g.name,
      dutyType: 'REGULAR',
      woDay: g.wo,
      logs: logs
    };
  });
}

const SHIFT_TIME_MAP = {
  'A-Shift [ 06:00 to 14:00 ]': { inTime: '06:00', outTime: '14:00', hours: 8.0 },
  'B-Shift [ 14:00 to 22:00 ]': { inTime: '14:00', outTime: '22:00', hours: 8.0 },
  'C-Shift [ 22:00 to 06:00 ]': { inTime: '22:00', outTime: '06:00', hours: 8.0 },
  'General Shift [ 09:00 to 18:00 ]': { inTime: '09:00', outTime: '18:00', hours: 9.0 },
};

export default function SiteTimeLogsPage() {
  // ── Filter Toolbar States ──────────────────────────────────────────────────
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [attendanceMonth, setAttendanceMonth] = useState('Sep/2026');
  const [selectedSite, setSelectedSite] = useState('');
  const [hasFiltered, setHasFiltered] = useState(false);
  const [submittedFilters, setSubmittedFilters] = useState(null);

  // Table search & range view
  const [tableSearch, setTableSearch] = useState('');
  const [dateRangeView, setDateRangeView] = useState('week1'); // 'week1' (1-7), 'week2' (8-14), 'all' (1-30)
  
  // Data state: empty by default until user submits filters!
  const [timeLogs, setTimeLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [liveSites, setLiveSites] = useState([]);

  // Expand / Collapse state for employee parent rows
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());
  const [childStatusFilters, setChildStatusFilters] = useState({});

  const toggleRowExpand = (id) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleChildStatusFilterChange = (rowId, filterValue) => {
    setChildStatusFilters(prev => ({
      ...prev,
      [rowId]: filterValue
    }));
  };

  // Filter Dropdown Open & Search States
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [clientDropdownSearch, setClientDropdownSearch] = useState('');
  const [branchDropdownSearch, setBranchDropdownSearch] = useState('');
  const [siteDropdownSearch, setSiteDropdownSearch] = useState('');

  // Edit / Add Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editingDay, setEditingDay] = useState(1);
  const [editFormData, setEditFormData] = useState({
    status: 'P',
    shift: 'A-Shift [ 06:00 to 14:00 ]',
    post: 'ICGGATE',
    inTime: '06:00',
    outTime: '14:00',
    hours: 8.0,
    punches: '01/ 05:40:00 - 01/ 14:30:00',
    netDuration: '8h 50m'
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLogData, setNewLogData] = useState({
    name: '',
    empCode: '',
    rank: 'S/G',
    empSite: selectedSite || 'SITE',
    dutyType: 'REGULAR',
    woDay: 'Sunday',
    attendanceDay: 1,
    status: 'P',
    shift: 'A-Shift [ 06:00 to 14:00 ]',
    inTime: '06:00',
    outTime: '14:00',
    hours: 8.0,
  });

  // Keep newLogData.empSite aligned with selected site
  useEffect(() => {
    if (selectedSite) {
      setNewLogData(prev => ({ ...prev, empSite: selectedSite }));
    }
  }, [selectedSite]);

  // Notification Banner State
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Fetch dynamic attendance time logs for all dates from backend ──────────
  const fetchLiveTimeLogs = async (site, month, client, branch) => {
    setIsLoadingLogs(true);
    const activeSite = site !== undefined ? site : selectedSite;
    const activeMonth = month || attendanceMonth || 'Sep/2026';
    const activeClient = client !== undefined ? client : selectedClient;
    const activeBranch = branch !== undefined ? branch : selectedBranch;

    try {
      const data = await timelogsApi.getLogs(activeSite, activeMonth, activeClient, activeBranch);
      if (data && Array.isArray(data) && data.length > 0) {
        setTimeLogs(data);
      } else {
        setTimeLogs([]);
      }
    } catch (err) {
      console.warn('Failed to load dynamic timelogs:', err.message);
      setTimeLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // ── Simultaneous Filter Execution Helper ────────────────────────────────────
  const applyFilterSimultaneously = (client, branch, site, month) => {
    const activeSite = site !== undefined ? site : selectedSite;
    const activeMonth = month || attendanceMonth || 'Sep/2026';
    const activeClient = client !== undefined ? client : selectedClient;
    const activeBranch = branch !== undefined ? branch : selectedBranch;

    const toApply = {
      client: activeClient,
      branch: activeBranch,
      month: activeMonth,
      site: activeSite,
      hasFiltered: true
    };
    setHasFiltered(true);
    setSubmittedFilters(toApply);
    fetchLiveTimeLogs(activeSite, activeMonth, activeClient, activeBranch);
  };

  // ── Load metadata on mount & start with clean empty state on refresh ────────
  const [liveClients, setLiveClients] = useState([]);
  const [liveBranches, setLiveBranches] = useState([]);

  useEffect(() => {
    async function loadBackendMetadata() {
      try {
        const [cls, brs, sts] = await Promise.all([
          locationApi.getClients(),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/branches`).then(r => r.json()).catch(() => []),
          locationApi.getSites()
        ]);
        if (cls?.length) setLiveClients(cls);
        if (brs?.length) setLiveBranches(brs.map(b => b.branch || b.name).filter(Boolean));
        if (sts?.length) setLiveSites(sts);
      } catch (e) {
        console.warn('Failed to load metadata:', e);
      }
    }
    loadBackendMetadata();
    
    // Always start with a clean empty filter state on initial load or refresh
    setSelectedClient('');
    setSelectedBranch('');
    setSelectedSite('');
    setAttendanceMonth('Sep/2026');
    setHasFiltered(false);
    setSubmittedFilters(null);
    setTimeLogs([]);
  }, []);

  // Compute available clients merging live database & static
  const availableClients = useMemo(() => {
    const liveC = liveClients.map(c => typeof c === 'string' ? c : c.name || c.client).filter(Boolean);
    const merged = Array.from(new Set([...liveC, ...TIMELOGS_CLIENT_OPTIONS])).sort();
    return merged;
  }, [liveClients]);

  // Compute dependent available branches strictly based on selected client
  const availableBranches = useMemo(() => {
    let clientBranches = [];
    if (selectedClient) {
      // Extract branches for selectedClient from live sites database
      clientBranches = liveSites
        .filter(s => (s.client || '').toLowerCase() === selectedClient.toLowerCase())
        .map(s => s.branch)
        .filter(Boolean);
      
      // Also check static mapping for selectedClient
      const staticB = TIMELOGS_BRANCH_OPTIONS[selectedClient];
      if (staticB) clientBranches.push(...staticB);

      // Fallback matching if exact case match is empty
      if (clientBranches.length === 0) {
        clientBranches = liveSites
          .filter(s => (s.client || '').toLowerCase().includes(selectedClient.toLowerCase()))
          .map(s => s.branch)
          .filter(Boolean);
      }
    } else {
      // If no client is selected, show all unique branches from live database & static
      clientBranches = liveSites.map(s => s.branch).filter(Boolean);
      if (clientBranches.length === 0) clientBranches = liveBranches;
    }

    return Array.from(new Set(clientBranches)).sort();
  }, [selectedClient, liveSites, liveBranches]);

  // Compute dependent available sites strictly based on selected client and/or branch
  const availableSites = useMemo(() => {
    let filteredList = [];
    
    if (selectedClient && selectedBranch) {
      // Sites matching BOTH selectedClient AND selectedBranch
      filteredList = liveSites
        .filter(s => 
          (s.client || '').toLowerCase() === selectedClient.toLowerCase() &&
          (s.branch || '').toLowerCase() === selectedBranch.toLowerCase()
        )
        .map(s => s.name || s.site_name)
        .filter(Boolean);

      const staticKey = `${selectedClient}|${selectedBranch}`;
      if (TIMELOGS_SITE_OPTIONS[staticKey]) {
        filteredList.push(...TIMELOGS_SITE_OPTIONS[staticKey]);
      }
    } else if (selectedClient) {
      // Sites matching selectedClient
      filteredList = liveSites
        .filter(s => (s.client || '').toLowerCase() === selectedClient.toLowerCase())
        .map(s => s.name || s.site_name)
        .filter(Boolean);

      Object.keys(TIMELOGS_SITE_OPTIONS).forEach(key => {
        if (key.startsWith(`${selectedClient}|`)) {
          filteredList.push(...TIMELOGS_SITE_OPTIONS[key]);
        }
      });
    } else if (selectedBranch) {
      // Sites matching selectedBranch
      filteredList = liveSites
        .filter(s => (s.branch || '').toLowerCase() === selectedBranch.toLowerCase())
        .map(s => s.name || s.site_name)
        .filter(Boolean);

      Object.keys(TIMELOGS_SITE_OPTIONS).forEach(key => {
        if (key.endsWith(`|${selectedBranch}`)) {
          filteredList.push(...TIMELOGS_SITE_OPTIONS[key]);
        }
      });
    } else {
      // All sites
      filteredList = liveSites.map(s => s.name || s.site_name).filter(Boolean);
      Object.values(TIMELOGS_SITE_OPTIONS).forEach(arr => filteredList.push(...arr));
    }

    return Array.from(new Set(filteredList)).sort();
  }, [selectedClient, selectedBranch, liveSites]);

  // Filtered dropdown options based on search inputs
  const filteredClientDropdownOptions = useMemo(() => {
    const list = availableClients && availableClients.length ? availableClients : TIMELOGS_CLIENT_OPTIONS;
    if (!clientDropdownSearch.trim()) return list;
    const lower = clientDropdownSearch.toLowerCase().trim();
    return list.filter(c => c.toLowerCase().includes(lower));
  }, [availableClients, clientDropdownSearch]);

  const filteredBranchDropdownOptions = useMemo(() => {
    if (!branchDropdownSearch.trim()) return availableBranches;
    const lower = branchDropdownSearch.toLowerCase().trim();
    return availableBranches.filter(b => b.toLowerCase().includes(lower));
  }, [availableBranches, branchDropdownSearch]);

  const filteredSiteDropdownOptions = useMemo(() => {
    if (!siteDropdownSearch.trim()) return availableSites;
    const lower = siteDropdownSearch.toLowerCase().trim();
    return availableSites.filter(s => s.toLowerCase().includes(lower));
  }, [availableSites, siteDropdownSearch]);

  // Handle Client Selection - Cascading reset of Branch & Site selections
  const handleClientChange = (client) => {
    setSelectedClient(client);
    setSelectedBranch('');
    setSelectedSite('');
  };

  // Handle Branch Selection - Cascading reset of Site selection
  const handleBranchChange = (branch) => {
    setSelectedBranch(branch);
    setSelectedSite('');
  };

  // Handle Site Selection - Update site state
  const handleSiteChange = (site) => {
    setSelectedSite(site);
  };

  // Handle Submit button click - Fetch & display data ONLY when Submit is clicked
  const handleSubmitFilters = () => {
    if (!selectedClient && !selectedBranch && !selectedSite) {
      showNotification('Please select at least one filter before submitting', 'warning');
      return;
    }
    applyFilterSimultaneously(selectedClient, selectedBranch, selectedSite, attendanceMonth);
    showNotification(`Loaded attendance logs for selected filter (${attendanceMonth})`, 'info');
  };

  // Clear Filters Handler - Immediately clears all selected filters and removes displayed data
  const handleClearFilters = () => {
    setSelectedClient('');
    setSelectedBranch('');
    setSelectedSite('');
    setAttendanceMonth('Sep/2026');
    setHasFiltered(false);
    setSubmittedFilters(null);
    setTimeLogs([]);
    setTableSearch('');
    showNotification('Filters cleared. Table returned to initial empty state.', 'info');
  };

  // Clear individual pill selections - Update state only
  const handleClearClient = (e) => {
    e.stopPropagation();
    setSelectedClient('');
    setSelectedBranch('');
    setSelectedSite('');
  };

  const handleClearBranch = (e) => {
    e.stopPropagation();
    setSelectedBranch('');
    setSelectedSite('');
  };

  const handleClearSite = (e) => {
    e.stopPropagation();
    setSelectedSite('');
  };

  // Reset Filters to default
  const handleResetFilters = () => {
    handleClearFilters();
  };

  // Bulk Expand / Collapse All Rows
  const handleExpandAll = () => {
    const allIds = new Set(filteredRows.map(r => r.id));
    setExpandedRowIds(allIds);
    showNotification('Expanded all employee rows', 'info');
  };

  const handleCollapseAll = () => {
    setExpandedRowIds(new Set());
    showNotification('Collapsed all employee rows', 'info');
  };

  // Monthly summary calculations per employee
  const calculateEmployeeSummary = (row, days) => {
    let presentDays = 0;
    let totalDutyHours = 0;
    let otHours = 0;
    let weeklyOffs = 0;
    let absentDays = 0;

    days.forEach(d => {
      const log = row.logs?.[d.day];
      if (log) {
        if (log.status === 'P' || log.status === 'IN') {
          presentDays += 1;
          const h = parseFloat(log.hours) || 8.0;
          totalDutyHours += h;
          if (h > 8.0) {
            otHours += (h - 8.0);
          }
        } else if (log.status === 'WO') {
          weeklyOffs += 1;
        } else if (log.status === 'A') {
          absentDays += 1;
        }
      }
    });

    return {
      presentDays,
      totalDutyHours: Math.round(totalDutyHours * 10) / 10,
      otHours: Math.round(otHours * 10) / 10,
      weeklyOffs,
      absentDays
    };
  };

  // ── Delete Confirmation Popup State ─────────────────────────────────────────
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    row: null,
    dayNum: null,
    formattedDate: ''
  });

  // Prompt Delete Confirmation Modal
  const promptDeleteDayLog = (row, dayNum, formattedDate) => {
    setDeleteModalState({
      isOpen: true,
      row,
      dayNum,
      formattedDate: formattedDate || `Day ${dayNum}`
    });
  };

  // Confirm Delete Action: Marks guard as Absent (A)
  const confirmDeleteDayLog = () => {
    if (!deleteModalState.row || !deleteModalState.dayNum) return;
    const { row, dayNum } = deleteModalState;
    setTimeLogs(prev => prev.map(r => {
      if (r.id === row.id) {
        const updatedLogs = { ...r.logs };
        updatedLogs[dayNum] = { status: 'A' };
        return { ...r, logs: updatedLogs };
      }
      return r;
    }));
    showNotification(`Cleared Day ${dayNum} attendance log for ${row.name} (marked Absent)`, 'info');
    setDeleteModalState({ isOpen: false, row: null, dayNum: null, formattedDate: '' });
  };

  // Action: Update Weekly Off Day for Employee
  const handleUpdateEmployeeWoDay = (rowId, newWoDay) => {
    setTimeLogs(prev => prev.map(r => {
      if (r.id === rowId) {
        const updatedLogs = { ...r.logs };
        currentMonthDays.forEach(d => {
          const isNewWo = d.dayName.toLowerCase() === newWoDay.toLowerCase();
          const existing = updatedLogs[d.day];
          if (isNewWo) {
            updatedLogs[d.day] = { status: 'WO' };
          } else if (existing?.status === 'WO') {
            const dStr = String(d.day).padStart(2, '0');
            updatedLogs[d.day] = {
              status: 'P',
              hours: 8.0,
              post: r.empSite || 'ICGGATE',
              shift: 'A-Shift [ 06:00 to 14:00 ]',
              punches: `${dStr}/ 06:00:00 - ${dStr}/ 14:00:00`,
              netDuration: '8h 00m'
            };
          }
        });
        return { ...r, woDay: newWoDay, logs: updatedLogs };
      }
      return r;
    }));
    showNotification(`Updated Weekly Off to ${newWoDay}`, 'success');
  };

  // Action: Quick Status Change in Child Table Status column
  const handleQuickStatusChange = (rowId, dayNum, newStatus) => {
    const dStr = String(dayNum).padStart(2, '0');
    setTimeLogs(prev => prev.map(r => {
      if (r.id === rowId) {
        const currentLog = r.logs?.[dayNum] || {};
        let updatedLog = { ...currentLog, status: newStatus };
        
        if (newStatus === 'WO') {
          updatedLog.hours = 0;
          updatedLog.punches = '-';
          updatedLog.netDuration = 'Weekly Off';
        } else if (newStatus === 'A') {
          updatedLog.hours = 0;
          updatedLog.punches = '-';
          updatedLog.netDuration = 'Absent';
        } else if (newStatus === 'IN') {
          updatedLog.hours = 8.0;
          updatedLog.shift = updatedLog.shift || 'A-Shift [ 06:00 to 14:00 ]';
          updatedLog.post = updatedLog.post || r.empSite || 'ICGGATE';
          updatedLog.inTime = updatedLog.inTime || '06:00';
          updatedLog.punches = `${dStr}/ ${updatedLog.inTime}:00 - IN`;
          updatedLog.netDuration = 'Active (IN)';
        } else if (newStatus === 'P') {
          updatedLog.hours = 8.0;
          updatedLog.shift = updatedLog.shift || 'A-Shift [ 06:00 to 14:00 ]';
          updatedLog.post = updatedLog.post || r.empSite || 'ICGGATE';
          updatedLog.inTime = updatedLog.inTime || '06:00';
          updatedLog.outTime = updatedLog.outTime || '14:00';
          updatedLog.punches = `${dStr}/ ${updatedLog.inTime}:00 - ${dStr}/ ${updatedLog.outTime}:00`;
          updatedLog.netDuration = '8h 00m';
        }

        return {
          ...r,
          logs: {
            ...r.logs,
            [dayNum]: updatedLog
          }
        };
      }
      return r;
    }));
    showNotification(`Updated Day ${dayNum} status to ${newStatus}`, 'success');
  };

  // Action: Clear / Delete Day Log (kept for compatibility)
  const handleClearDayLog = (rowId, dayNum) => {
    setTimeLogs(prev => prev.map(r => {
      if (r.id === rowId) {
        const updatedLogs = { ...r.logs };
        updatedLogs[dayNum] = { status: 'A' };
        return { ...r, logs: updatedLogs };
      }
      return r;
    }));
    showNotification(`Cleared Day ${dayNum} attendance log`, 'info');
  };

  // Action: Reassign / Move Shift Log
  const handleMoveDayLog = (row, dayNum) => {
    setTimeLogs(prev => prev.map(r => {
      if (r.id === row.id) {
        const currentLog = r.logs?.[dayNum] || {};
        const currentShift = currentLog.shift || 'A-Shift [ 06:00 to 14:00 ]';
        let newShift = 'B-Shift [ 14:00 to 22:00 ]';
        if (currentShift.startsWith('B-Shift')) newShift = 'C-Shift [ 22:00 to 06:00 ]';
        else if (currentShift.startsWith('C-Shift')) newShift = 'General Shift [ 09:00 to 18:00 ]';
        else if (currentShift.startsWith('General')) newShift = 'A-Shift [ 06:00 to 14:00 ]';

        const preset = SHIFT_TIME_MAP[newShift] || { inTime: '06:00', outTime: '14:00', hours: 8.0 };
        const dStr = String(dayNum).padStart(2, '0');

        return {
          ...r,
          logs: {
            ...r.logs,
            [dayNum]: {
              ...currentLog,
              status: currentLog.status === 'A' || currentLog.status === 'WO' ? 'P' : currentLog.status,
              shift: newShift,
              inTime: preset.inTime,
              outTime: preset.outTime,
              hours: preset.hours,
              punches: `${dStr}/ ${preset.inTime}:00 - ${dStr}/ ${preset.outTime}:00`,
              netDuration: `${preset.hours}h`
            }
          }
        };
      }
      return r;
    }));
    showNotification(`Reassigned shift for Day ${dayNum} to ${row.name}`, 'success');
  };

  // Dynamic days computed for the selected Attendance Month
  const currentMonthDays = useMemo(() => {
    return getDaysForMonth(attendanceMonth);
  }, [attendanceMonth]);

  // Visible Days Range
  const visibleDays = useMemo(() => {
    if (dateRangeView === 'week1') return currentMonthDays.slice(0, 7);
    if (dateRangeView === 'week2') return currentMonthDays.slice(7, 14);
    if (dateRangeView === 'week3') return currentMonthDays.slice(14, 21);
    if (dateRangeView === 'week4') return currentMonthDays.slice(21, 28);
    return currentMonthDays; // all days in month
  }, [dateRangeView, currentMonthDays]);

  // Filtered rows based on selectedClient, selectedBranch, selectedSite, and tableSearch
  const filteredRows = useMemo(() => {
    let rows = timeLogs;
    if (selectedClient) {
      rows = rows.filter(r => 
        (r.client || '').toLowerCase().includes(selectedClient.toLowerCase()) || 
        r.empSite.toLowerCase().includes(selectedClient.toLowerCase())
      );
    }
    if (selectedBranch) {
      rows = rows.filter(r => 
        (r.branch || '').toLowerCase().includes(selectedBranch.toLowerCase()) || 
        r.empSite.toLowerCase().includes(selectedBranch.toLowerCase())
      );
    }
    if (selectedSite) {
      rows = rows.filter(r => 
        (r.empSite || '').toLowerCase().includes(selectedSite.toLowerCase())
      );
    }

    const q = tableSearch.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter(row => 
      row.name.toLowerCase().includes(q) ||
      row.empCode.toLowerCase().includes(q) ||
      row.rank.toLowerCase().includes(q) ||
      row.empSite.toLowerCase().includes(q) ||
      row.dutyType.toLowerCase().includes(q) ||
      row.woDay.toLowerCase().includes(q)
    );
  }, [timeLogs, selectedClient, selectedBranch, selectedSite, tableSearch]);

  // Quick Operational Metrics based on filteredRows
  const metrics = useMemo(() => {
    if (filteredRows.length === 0) {
      return {
        totalEmployees: 0,
        present: 0,
        inPunches: 0,
        weeklyOff: 0,
        absent: 0
      };
    }

    let presentCount = 0;
    let inCount = 0;
    let woCount = 0;
    let aCount = 0;

    const sampleDay = visibleDays[0]?.day || 1;

    filteredRows.forEach(r => {
      const log = r.logs?.[sampleDay] || r.logs?.[1];
      if (log?.status === 'IN') inCount++;
      else if (log?.status === 'P') presentCount++;
      else if (log?.status === 'WO') woCount++;
      else if (log?.status === 'A') aCount++;
    });

    return {
      totalEmployees: filteredRows.length,
      present: presentCount,
      inPunches: inCount,
      weeklyOff: woCount,
      absent: aCount
    };
  }, [filteredRows, visibleDays]);

  // Helper to calculate hours from in and out time
  const calculateHours = (inT, outT) => {
    if (!inT || !outT) return 8.0;
    try {
      const [inH, inM] = inT.split(':').map(Number);
      const [outH, outM] = outT.split(':').map(Number);
      let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
      if (diffMin <= 0) diffMin += 24 * 60; // overnight shift
      return Math.round((diffMin / 60) * 10) / 10;
    } catch (e) {
      return 8.0;
    }
  };

  // ── Open Edit Modal for a specific row & day ────────────────────────────────
  const handleOpenEdit = (row, dayNum = 1) => {
    setEditingRow(row);
    setEditingDay(dayNum);
    const existing = row.logs?.[dayNum] || {
      status: 'P',
      shift: 'A-Shift [ 06:00 to 14:00 ]',
      post: row.empSite || 'ICGGATE',
      hours: 8.0,
      punches: `${String(dayNum).padStart(2, '0')}/ 06:00:00 - ${String(dayNum).padStart(2, '0')}/ 14:00:00`,
      netDuration: '8h 00m'
    };

    // Extract time from existing punches
    const parts = (existing.punches || '').split(' - ');
    const inMatch = parts[0]?.match(/(\d{2}:\d{2})/);
    const outMatch = parts[1]?.match(/(\d{2}:\d{2})/);
    const inTime = inMatch ? inMatch[1] : '06:00';
    const outTime = outMatch ? outMatch[1] : '14:00';

    setEditFormData({
      status: existing.status || 'P',
      shift: existing.shift || 'A-Shift [ 06:00 to 14:00 ]',
      post: existing.post || row.empSite || 'ICGGATE',
      inTime,
      outTime,
      hours: existing.hours || 8.0,
      punches: existing.punches || `${String(dayNum).padStart(2, '0')}/ ${inTime}:00 - ${String(dayNum).padStart(2, '0')}/ ${outTime}:00`,
      netDuration: existing.netDuration || '8h 00m'
    });
    setIsEditModalOpen(true);
  };

  // Save Edit Row
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingRow) return;

    const dStr = String(editingDay).padStart(2, '0');
    let computedPunches = editFormData.punches;
    if (editFormData.status === 'IN') {
      computedPunches = `${dStr}/ ${editFormData.inTime}:00 - IN`;
    } else if (editFormData.status === 'P') {
      computedPunches = `${dStr}/ ${editFormData.inTime}:00 - ${dStr}/ ${editFormData.outTime}:00`;
    }

    const calculatedHrs = editFormData.status === 'P'
      ? calculateHours(editFormData.inTime, editFormData.outTime)
      : (parseFloat(editFormData.hours) || 8.0);

    setTimeLogs(prev => prev.map(r => {
      if (r.id === editingRow.id) {
        return {
          ...r,
          logs: {
            ...r.logs,
            [editingDay]: {
              ...editFormData,
              hours: calculatedHrs,
              punches: computedPunches,
              netDuration: `${calculatedHrs}h`
            }
          }
        };
      }
      return r;
    }));

    setIsEditModalOpen(false);
    showNotification(`Updated log for ${editingRow.name} (Day ${editingDay})`, 'success');
  };

  // Save New Employee Log Row
  const handleSaveNewEmployee = (e) => {
    e.preventDefault();
    if (!newLogData.name.trim() || !newLogData.empCode.trim()) return;

    const newId = Date.now();
    const dayTarget = parseInt(newLogData.attendanceDay, 10) || 1;
    const calculatedHrs = newLogData.status === 'P'
      ? calculateHours(newLogData.inTime, newLogData.outTime)
      : (parseFloat(newLogData.hours) || 8.0);

    const generatedLogs = {};

    currentMonthDays.forEach(d => {
      const isTargetDay = d.day === dayTarget;
      const isWo = d.dayName.toLowerCase() === (newLogData.woDay || '').toLowerCase();
      const dStr = String(d.day).padStart(2, '0');
      
      if (isTargetDay) {
        if (newLogData.status === 'WO') {
          generatedLogs[d.day] = { status: 'WO' };
        } else if (newLogData.status === 'A') {
          generatedLogs[d.day] = { status: 'A' };
        } else if (newLogData.status === 'IN') {
          generatedLogs[d.day] = {
            status: 'IN',
            hours: 8.0,
            post: newLogData.empSite || 'ICGGATE',
            shift: newLogData.shift || 'A-Shift [ 06:00 to 14:00 ]',
            shiftDuration: '8 hrs',
            punches: `${dStr}/ ${newLogData.inTime}:00 - IN`,
            netDuration: 'Active'
          };
        } else {
          generatedLogs[d.day] = {
            status: 'P',
            hours: calculatedHrs,
            post: newLogData.empSite || 'ICGGATE',
            shift: newLogData.shift || 'A-Shift [ 06:00 to 14:00 ]',
            shiftDuration: '8 hrs',
            punches: `${dStr}/ ${newLogData.inTime}:00 - ${dStr}/ ${newLogData.outTime}:00`,
            netDuration: `${calculatedHrs}h`
          };
        }
      } else if (isWo) {
        generatedLogs[d.day] = { status: 'WO' };
      } else {
        generatedLogs[d.day] = {
          status: 'P',
          hours: 8.0,
          post: newLogData.empSite || 'ICGGATE',
          shift: newLogData.shift || 'A-Shift [ 06:00 to 14:00 ]',
          shiftDuration: '8 hrs',
          punches: `${dStr}/ 05:45:00 - ${dStr}/ 14:20:00`,
          netDuration: '8h 35m'
        };
      }
    });

    const newEntry = {
      id: newId,
      empSite: newLogData.empSite || 'ICGGATE',
      rank: newLogData.rank || 'S/G',
      empCode: newLogData.empCode.toUpperCase(),
      name: newLogData.name.toUpperCase(),
      dutyType: newLogData.dutyType || 'REGULAR',
      woDay: newLogData.woDay || 'Sunday',
      logs: generatedLogs
    };

    setTimeLogs(prev => [newEntry, ...prev]);
    setIsAddModalOpen(false);
    setNewLogData({
      name: '',
      empCode: '',
      rank: 'S/G',
      empSite: 'ICGGATE',
      dutyType: 'REGULAR',
      woDay: 'Sunday',
      attendanceDay: 1,
      status: 'P',
      shift: 'A-Shift [ 06:00 to 14:00 ]',
      inTime: '06:00',
      outTime: '14:00',
      hours: 8.0,
    });
    showNotification(`Added ${newEntry.name} with attendance time filters to Site Time Logs`, 'success');
  };
  // Export CSV function
  const handleExportCSV = () => {
    if (!hasFiltered || !submittedFilters?.site || timeLogs.length === 0) {
      showNotification('No attendance data available to export. Please select filters first.', 'warning');
      return;
    }
    let csv = 'Sr No,Emp Site,Rank,Emp Code,Emp Name,Duty Type,WO Day\n';
    timeLogs.forEach((r, idx) => {
      csv += `${idx + 1},"${r.empSite}","${r.rank}","${r.empCode}","${r.name}","${r.dutyType}","${r.woDay}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Site_Time_Logs_${(submittedFilters.site || 'Site').replace(/\s+/g, '_')}_${(submittedFilters.month || 'Month').replace('/', '_')}.csv`;
    a.click();
    showNotification('Time logs CSV exported successfully', 'info');
  };

  return (
    <div className="bg-[var(--bg-app)] text-[var(--text-main)] min-h-full pb-2 font-sans transition-colors duration-200">
      
      {/* ── 1. COMPACT WORKSPACE TOP BAR ────────────────────────────────────── */}
      <div className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-color)] py-0.5 px-2.5 flex flex-wrap items-center justify-between gap-1.5 shadow-xs text-[10.5px]">
        <div className="flex items-center space-x-1.5">
          <div className="p-0.5 bg-sky-500/10 text-sky-500 dark:text-sky-400 rounded border border-sky-500/20 shadow-2xs">
            <Clock className="w-3 h-3 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-1">
            <h1 className="text-[10px] font-extrabold tracking-wider uppercase text-[var(--text-main)]">
              Site Time Logs
            </h1>
            {selectedClient || selectedBranch || selectedSite ? (
              <span className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[9px] px-1.5 py-0.25 rounded-full font-bold">
                {selectedSite || selectedBranch || selectedClient}
              </span>
            ) : (
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.25 rounded-full font-semibold">
                No Filter Applied
              </span>
            )}
          </div>
        </div>

        {/* Quick Operational Metrics */}
        <div className="flex items-center space-x-1">
          <div className="hidden lg:flex items-center space-x-1 text-[9.5px] font-semibold border-r border-[var(--border-color)] pr-1.5 mr-1">
            <span className="px-1.5 py-0.25 rounded bg-slate-800/40 text-slate-300 border border-slate-700/50 flex items-center gap-1 font-mono">
              <Layers className="w-2.5 h-2.5 text-sky-400" />
              <span>{metrics.totalEmployees} Deployed</span>
            </span>
            <span className="px-1.5 py-0.25 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
              <UserCheck className="w-2.5 h-2.5" />
              <span>{metrics.present} Present</span>
            </span>
            <span className="px-1.5 py-0.25 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1 font-mono">
              <span className="w-1.2 h-1.2 rounded-full bg-amber-500"></span>
              <span>{metrics.inPunches} Clocked IN</span>
            </span>
            <span className="px-1.5 py-0.25 rounded bg-slate-700/20 text-slate-400 border border-slate-700/40 flex items-center gap-1 font-mono">
              <span>{metrics.weeklyOff} WO</span>
            </span>
            <span className="px-1.5 py-0.25 rounded bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1 font-mono">
              <span>{metrics.absent} Absent</span>
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 bg-[var(--control-bg)] hover:bg-[var(--control-hover)] text-[var(--text-main)] text-[10px] font-semibold px-2 py-0.5 rounded border border-[var(--border-color)] transition-all shadow-2xs"
            title="Export CSV"
          >
            <Download className="w-3 h-3 text-sky-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded transition-all shadow-sm"
            title="Add Employee Attendance Log"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Add Guard Log</span>
          </button>
        </div>
      </div>

      {/* ── 2. STICKY COMPACT HORIZONTAL FILTER TOOLBAR ── */}
      <div className="relative z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-1 px-2.5 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-1.5">
          
          {/* Left Horizontal Filter Pills Group */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[300px]">
            
            {/* Client Pill */}
            <div className={`relative ${isClientDropdownOpen ? 'z-50' : 'z-10'}`}>
              <div
                onClick={() => {
                  setIsClientDropdownOpen(!isClientDropdownOpen);
                  setIsBranchDropdownOpen(false);
                  setIsSiteDropdownOpen(false);
                  setClientDropdownSearch('');
                }}
                className="h-7 px-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-400 dark:hover:border-sky-500 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-none text-xs font-normal text-slate-800 dark:text-slate-100 select-none"
                title="Select Client"
              >
                <span>{selectedClient || 'Select Client'}</span>
                <X
                  className="w-3 h-3 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  onClick={handleClearClient}
                  title="Clear client"
                />
              </div>

              {isClientDropdownOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-hidden">
                  <div className="px-3 py-1 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Select Client
                  </div>
                  {/* Search Input */}
                  <div className="p-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-sky-500 shrink-0" />
                    <input
                      type="text"
                      value={clientDropdownSearch}
                      onChange={(e) => setClientDropdownSearch(e.target.value)}
                      placeholder="Search Client..."
                      className="w-full bg-transparent text-[11px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      autoFocus
                    />
                    {clientDropdownSearch && (
                      <button
                        type="button"
                        onClick={() => setClientDropdownSearch('')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {/* Client Options List */}
                  <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 dark:divide-slate-800/40">
                    {filteredClientDropdownOptions.length > 0 ? (
                      filteredClientDropdownOptions.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            handleClientChange(c);
                            setIsClientDropdownOpen(false);
                            setClientDropdownSearch('');
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                            selectedClient === c 
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold' 
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{c}</span>
                          {selectedClient === c && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-center text-[10px] text-slate-400 italic">
                        No clients found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Branch Pill */}
            <div className={`relative ${isBranchDropdownOpen ? 'z-50' : 'z-10'}`}>
              <div
                onClick={() => {
                  setIsBranchDropdownOpen(!isBranchDropdownOpen);
                  setIsClientDropdownOpen(false);
                  setIsSiteDropdownOpen(false);
                  setBranchDropdownSearch('');
                }}
                className="h-7 px-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-400 dark:hover:border-sky-500 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-none text-xs font-normal text-slate-800 dark:text-slate-100 select-none"
                title="Select Branch"
              >
                <span>{selectedBranch || 'Select Branch'}</span>
                <X
                  className="w-3 h-3 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  onClick={handleClearBranch}
                  title="Clear branch"
                />
              </div>

              {isBranchDropdownOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-hidden">
                  <div className="px-3 py-1 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Select Branch
                  </div>
                  {/* Search Input */}
                  <div className="p-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-sky-500 shrink-0" />
                    <input
                      type="text"
                      value={branchDropdownSearch}
                      onChange={(e) => setBranchDropdownSearch(e.target.value)}
                      placeholder="Search Branch..."
                      className="w-full bg-transparent text-[11px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      autoFocus
                    />
                    {branchDropdownSearch && (
                      <button
                        type="button"
                        onClick={() => setBranchDropdownSearch('')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {/* Branch Options List */}
                  <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 dark:divide-slate-800/40">
                    {filteredBranchDropdownOptions.length > 0 ? (
                      filteredBranchDropdownOptions.map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            handleBranchChange(b);
                            setIsBranchDropdownOpen(false);
                            setBranchDropdownSearch('');
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                            selectedBranch === b 
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold' 
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{b}</span>
                          {selectedBranch === b && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-center text-[10px] text-slate-400 italic">
                        No branches found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Site Pill */}
            <div className={`relative ${isSiteDropdownOpen ? 'z-50' : 'z-10'}`}>
              <div 
                onClick={() => {
                  setIsSiteDropdownOpen(!isSiteDropdownOpen);
                  setIsClientDropdownOpen(false);
                  setIsBranchDropdownOpen(false);
                  setSiteDropdownSearch('');
                }}
                className="h-7 px-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-400 dark:hover:border-sky-500 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-none text-xs font-normal text-slate-800 dark:text-slate-100 max-w-[280px] select-none"
                title="Select Site"
              >
                <span className="truncate">{selectedSite || 'Select Site'}</span>
                <X 
                  className="w-3 h-3 text-slate-400 hover:text-rose-500 transition-colors shrink-0" 
                  onClick={handleClearSite}
                  title="Clear site"
                />
              </div>

              {isSiteDropdownOpen && (
                <div className="absolute left-0 mt-1 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-hidden">
                  <div className="px-3 py-1 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Select Operational Site
                  </div>
                  {/* Search Input */}
                  <div className="p-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-sky-500 shrink-0" />
                    <input
                      type="text"
                      value={siteDropdownSearch}
                      onChange={(e) => setSiteDropdownSearch(e.target.value)}
                      placeholder="Search Site..."
                      className="w-full bg-transparent text-[11px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      autoFocus
                    />
                    {siteDropdownSearch && (
                      <button
                        type="button"
                        onClick={() => setSiteDropdownSearch('')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {/* Site Options List */}
                  <div className="overflow-y-auto max-h-64 divide-y divide-slate-100 dark:divide-slate-800/40">
                    {filteredSiteDropdownOptions.length > 0 ? (
                      filteredSiteDropdownOptions.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            handleSiteChange(s);
                            setIsSiteDropdownOpen(false);
                            setSiteDropdownSearch('');
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                            selectedSite === s 
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold' 
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{s}</span>
                          {selectedSite === s && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-center text-[10px] text-slate-400 italic">
                        No sites found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Month Picker Pill */}
            <MonthYearPicker
              value={attendanceMonth}
              onChange={(newMonth) => {
                setAttendanceMonth(newMonth);
              }}
            />

            {/* Blue Submit Button */}
            <button
              onClick={handleSubmitFilters}
              disabled={isLoadingLogs || (!selectedClient && !selectedBranch && !selectedSite)}
              className="h-7 px-4 rounded-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center space-x-1 cursor-pointer shadow-none shrink-0"
              title={(!selectedClient && !selectedBranch && !selectedSite) ? "Please select at least one filter" : "Load attendance time logs"}
            >
              {isLoadingLogs ? (
                <>
                  <RotateCw className="w-3 h-3 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Submit</span>
                </>
              )}
            </button>

            {/* Clear Filter Button */}
            <button
              onClick={handleClearFilters}
              className="h-7 px-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all flex items-center space-x-1 cursor-pointer shadow-none shrink-0"
              title="Clear all filters and reset table"
            >
              <X className="w-3 h-3 text-slate-400 hover:text-rose-500" />
              <span>Clear Filter</span>
            </button>

            {/* Search within Current Table */}
            {hasFiltered && (
              <div className="relative min-w-[160px] max-w-[200px]">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter guard..."
                  className="h-7 w-full rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 pr-5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors shadow-none"
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Right Side: Week Switcher Controls */}
          {hasFiltered && (
            <div className="flex items-center space-x-1 border-l border-slate-200 dark:border-slate-800 pl-1.5">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase hidden md:inline">
                Range:
              </span>
              <div className="bg-white dark:bg-slate-900 p-0.5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center space-x-0.5 text-[9px] font-bold">
                <button
                  onClick={() => setDateRangeView('week1')}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    dateRangeView === 'week1'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Days 1–7
                </button>
                <button
                  onClick={() => setDateRangeView('week2')}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    dateRangeView === 'week2'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  8–14
                </button>
                <button
                  onClick={() => setDateRangeView('week3')}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    dateRangeView === 'week3'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  15–21
                </button>
                <button
                  onClick={() => setDateRangeView('week4')}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    dateRangeView === 'week4'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  22–28
                </button>
                <button
                  onClick={() => setDateRangeView('all')}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    dateRangeView === 'all'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Full Month
                </button>
              </div>

              {/* Single Dynamic Expand/Collapse Control */}
              <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1.5">
                <button
                  onClick={expandedRowIds.size === filteredRows.length ? handleCollapseAll : handleExpandAll}
                  className="h-7 px-2.5 rounded-full bg-[var(--control-bg)] hover:bg-[var(--control-hover)] text-[var(--text-main)] text-xs font-semibold border border-[var(--border-color)] transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
                  title={expandedRowIds.size === filteredRows.length ? "Collapse all rows" : "Expand all rows"}
                >
                  <ChevronsUpDown className="w-3.5 h-3.5 text-sky-500" />
                  <span>{expandedRowIds.size === filteredRows.length ? "Collapse All" : "Expand All"}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── 3. SITE TITLE HEADER STRIP ───────────────────────────────────────── */}
      <div className="max-w-[1920px] mx-auto px-2.5 mt-2 mb-1 flex flex-wrap items-center justify-between gap-1">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-4 bg-sky-500 rounded-full"></div>
          <h2 className="text-xs font-bold tracking-wide text-slate-900 dark:text-white uppercase font-mono">
            {selectedSite ? selectedSite : (selectedClient ? `${selectedClient} - All Sites` : (selectedBranch ? `${selectedBranch} Branch - All Sites` : 'Site Time Logs'))}
          </h2>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {selectedClient || 'All Clients'} &bull; {selectedBranch || 'All Branches'}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredRows.length}</strong> deployed guards</span>
          <span>&bull;</span>
          <span>Month: <strong className="text-sky-500 font-bold">{attendanceMonth}</strong></span>
        </div>
      </div>

      {/* ── 4. DENSE, DATA-FOCUSED TIME LOGS TABLE CONTAINER ────────────────── */}
      <div className="max-w-[1920px] mx-auto px-2.5 relative z-10 my-2">
        {isLoadingLogs && (
          <div className="absolute inset-x-2.5 inset-y-0 bg-[var(--bg-app)]/60 backdrop-blur-[1px] z-30 flex items-center justify-center rounded-xl pointer-events-none transition-all">
            <div className="bg-[var(--bg-card)] border border-sky-500/40 px-4 py-2 rounded-lg shadow-xl flex items-center space-x-2 text-xs font-bold text-sky-500 font-mono">
              <RotateCw className="w-4 h-4 animate-spin text-sky-500" />
              <span>Fetching dynamic time logs...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors">
          <table className="w-full text-left border-collapse text-xs">
            
            {/* THEAD - Parent Employee Level Headers */}
            <thead className="bg-slate-50 dark:bg-slate-800/80 shadow-2xs">
              <tr className="select-none text-[11px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                
                {/* Column 0: Expand/Collapse All Toggle Header */}
                <th className="py-3 px-2 text-center w-10 min-w-[40px]">
                  <button
                    onClick={expandedRowIds.size === filteredRows.length ? handleCollapseAll : handleExpandAll}
                    className="p-1 rounded bg-slate-200 hover:bg-sky-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-sky-600 dark:text-sky-400 transition-colors mx-auto inline-flex items-center justify-center cursor-pointer"
                    title={expandedRowIds.size === filteredRows.length ? "Collapse All Rows" : "Expand All Rows"}
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>

                {/* Column 1: Sr. No. */}
                <th className="py-3 px-2 text-center w-10 min-w-[40px]">
                  Sr.
                </th>

                {/* Column 2: Emp. Site */}
                <th className="py-3 px-3 min-w-[120px]">
                  Emp. Site
                </th>

                {/* Column 3: Attendance Site */}
                <th className="py-3 px-3 min-w-[130px]">
                  Attendance Site
                </th>

                {/* Column 4: Rank / Designation */}
                <th className="py-3 px-2.5 min-w-[85px]">
                  Rank
                </th>

                {/* Column 5: Emp. Code */}
                <th className="py-3 px-2.5 min-w-[100px] font-mono">
                  Emp. Code
                </th>

                {/* Column 6: Emp. Name */}
                <th className="py-3 px-3 min-w-[150px]">
                  Emp. Name
                </th>

                {/* Column 7: Duty Type */}
                <th className="py-3 px-2.5 min-w-[90px]">
                  Duty Type
                </th>

                {/* Column 8: WO Day */}
                <th className="py-3 px-2.5 min-w-[90px]">
                  WO Day
                </th>

                {/* Summary Totals Columns */}
                <th className="py-3 px-2.5 text-center min-w-[100px] text-emerald-600 dark:text-emerald-400">
                  Working Days
                </th>
                <th className="py-3 px-2.5 text-center min-w-[95px] text-sky-600 dark:text-sky-400">
                  Duty Hours
                </th>
                <th className="py-3 px-2.5 text-center min-w-[90px] text-amber-500">
                  OT Hours
                </th>
                <th className="py-3 px-2 text-center min-w-[65px]">
                  WO
                </th>
                <th className="py-3 px-2 text-center min-w-[70px] text-rose-500">
                  Absent
                </th>

                {/* Column 14: Row Actions */}
                <th className="py-3 px-2.5 text-center min-w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>

            {/* TBODY - Parent summary rows with nested child expandable tables */}
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, index) => {
                  const isExpanded = expandedRowIds.has(row.id);
                  const summary = calculateEmployeeSummary(row, currentMonthDays);

                  return (
                    <React.Fragment key={row.id || index}>
                      {/* PARENT EMPLOYEE ROW */}
                      <tr
                        onClick={() => toggleRowExpand(row.id)}
                        className={`transition-colors cursor-pointer select-none border-b border-slate-100 dark:border-slate-800 ${
                          isExpanded 
                            ? 'bg-sky-50/80 dark:bg-sky-950/40 font-semibold' 
                            : index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'
                        } hover:bg-slate-100/70 dark:hover:bg-slate-800/50`}
                      >
                        {/* Column 0: Chevron Expand Toggle */}
                        <td className="py-3 px-2 text-center w-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpand(row.id);
                            }}
                            className={`p-1 rounded transition-all inline-flex items-center justify-center cursor-pointer ${
                              isExpanded 
                                ? 'bg-sky-600 text-white shadow-xs' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700'
                            }`}
                            title={isExpanded ? "Collapse Details" : "Expand Daily Attendance Logs"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                          </button>
                        </td>

                        {/* Column 1: Sr. No. */}
                        <td className="py-3 px-2 text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                          {index + 1}
                        </td>

                        {/* Column 2: Emp. Site */}
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs">
                          {row.empSite}
                        </td>

                        {/* Column 3: Attendance Site */}
                        <td className="py-3 px-3 text-xs text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                          {selectedSite || row.empSite}
                        </td>

                        {/* Column 4: Rank / Designation */}
                        <td className="py-3 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {row.rank}
                        </td>

                        {/* Column 5: Emp. Code */}
                        <td className="py-3 px-2.5 font-mono font-bold text-sky-600 dark:text-sky-400 text-xs">
                          {row.empCode}
                        </td>

                        {/* Column 6: Emp. Name */}
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                          {row.name}
                        </td>

                        {/* Column 7: Duty Type */}
                        <td className="py-3 px-2.5 text-slate-600 dark:text-slate-300 font-medium text-xs">
                          {row.dutyType}
                        </td>

                        {/* Column 8: WO Day */}
                        <td className="py-3 px-2.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={row.woDay}
                            onChange={(e) => handleUpdateEmployeeWoDay(row.id, e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
                            title="Change Weekly Off Day"
                          >
                            {DAY_NAMES.map(dName => (
                              <option key={dName} value={dName} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{dName}</option>
                            ))}
                          </select>
                        </td>

                        {/* Monthly Summary: Working Days */}
                        <td className="py-3 px-2.5 text-center">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-mono inline-block">
                            {summary.presentDays} Days
                          </span>
                        </td>

                        {/* Monthly Summary: Duty Hours */}
                        <td className="py-3 px-2.5 text-center font-mono font-bold text-sky-600 dark:text-sky-400 text-xs">
                          {summary.totalDutyHours} hrs
                        </td>

                        {/* Monthly Summary: OT Hours */}
                        <td className="py-3 px-2.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                          {summary.otHours > 0 ? `+${summary.otHours} hrs` : '0 hrs'}
                        </td>

                        {/* Monthly Summary: WO */}
                        <td className="py-3 px-2 text-center font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
                          {summary.weeklyOffs} WO
                        </td>

                        {/* Monthly Summary: Absent */}
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono inline-block ${
                            summary.absentDays > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60' : 'text-slate-400'
                          }`}>
                            {summary.absentDays} A
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-3 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleRowExpand(row.id)}
                            className="px-3 py-1 rounded-md bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-200 dark:border-sky-800 transition-all shadow-2xs cursor-pointer"
                          >
                            {isExpanded ? 'Collapse' : 'View Days'}
                          </button>
                        </td>
                      </tr>

                      {/* NESTED CHILD EXPANDED ROW - MICRO-COMPACT SINGLE VIEW */}
                      {isExpanded && (
                        <tr className="bg-[var(--bg-surface-alt)] border-b border-sky-500/40">
                          <td colSpan={16} className="p-2 bg-[var(--bg-app)]/80 border-l-4 border-sky-500">
                            
                            {/* Single View Container (No Scroll, Full Visibility) */}
                            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs relative">
                              
                              {/* CHILD WORKSPACE HEADER BANNER */}
                              <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-1.5 bg-[var(--bg-card)] border-b border-[var(--border-color)] text-xs">
                                <div className="flex items-center space-x-2 font-bold text-[var(--text-main)]">
                                  <span className="text-sky-500 font-extrabold">{row.name}</span>
                                  <span className="text-[var(--text-muted)]">&bull;</span>
                                  <span className="font-mono text-sky-600 dark:text-sky-400 text-xs font-bold">{row.empCode}</span>
                                  <span className="text-[var(--text-muted)]">&bull;</span>
                                  <span className="text-xs text-[var(--text-secondary)] font-semibold">{row.rank} ({row.dutyType})</span>
                                  <span className="text-[var(--text-muted)]">&bull;</span>
                                  <span className="text-xs text-amber-500 font-semibold">WO: {row.woDay}</span>
                                </div>

                                <div className="flex items-center space-x-2 text-xs">
                                  {/* Filter Status Dropdown inside Expandable Row */}
                                  <div className="flex items-center space-x-1 bg-[var(--bg-surface-alt)] px-2 py-0.5 rounded border border-[var(--border-color)] shadow-2xs">
                                    <Filter className="w-3 h-3 text-sky-500 shrink-0" />
                                    <span className="text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Filter:</span>
                                    <select
                                      value={childStatusFilters[row.id] || 'all'}
                                      onChange={(e) => handleChildStatusFilterChange(row.id, e.target.value)}
                                      className="bg-transparent text-xs font-bold text-sky-600 dark:text-sky-400 focus:outline-none cursor-pointer"
                                      title="Filter expandable row entries (blurs non-selected data)"
                                    >
                                      <option value="all" className="bg-[var(--bg-card)] text-[var(--text-main)]">All Days</option>
                                      <option value="WO" className="bg-[var(--bg-card)] text-[var(--text-main)]">WO Only</option>
                                      <option value="A" className="bg-[var(--bg-card)] text-[var(--text-main)]">Absent Only</option>
                                      <option value="P" className="bg-[var(--bg-card)] text-[var(--text-main)]">Present Only</option>
                                      <option value="IN" className="bg-[var(--bg-card)] text-[var(--text-main)]">IN Only</option>
                                    </select>
                                  </div>

                                  <span className="text-[var(--text-muted)] font-mono text-xs hidden sm:inline">
                                    Range: <strong className="text-sky-500">{dateRangeView === 'all' ? 'Day 1–31' : `${dateRangeView}`}</strong>
                                  </span>
                                  <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 stroke-[3]" />
                                    <span>Add</span>
                                  </button>
                                </div>
                              </div>

                              {/* Nested Attendance Records Table */}
                              <table className="w-full text-left text-xs border-separate border-spacing-0">
                                <thead className="bg-[var(--table-header-bg)] shadow-2xs">
                                  <tr className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--table-header-text)] border-b border-[var(--border-color)] select-none">
                                    <th className="py-1 px-2.5 border-r border-[var(--border-color)] min-w-[95px] font-mono">Date</th>
                                    <th className="py-1 px-2.5 border-r border-[var(--border-color)] min-w-[80px]">Day</th>
                                    <th className="py-1 px-2.5 border-r border-[var(--border-color)] min-w-[180px]">Shift & Post</th>
                                    <th className="py-1 px-2 border-r border-[var(--border-color)] min-w-[75px] font-mono">IN Time</th>
                                    <th className="py-1 px-2 border-r border-[var(--border-color)] min-w-[75px] font-mono">OUT Time</th>
                                    <th className="py-1 px-2 border-r border-[var(--border-color)] min-w-[75px] text-center font-mono">Hours</th>
                                    <th className="py-1 px-2.5 border-r border-[var(--border-color)] min-w-[180px] font-mono">Punches & Duration</th>
                                    <th className="py-1 px-2 border-r border-[var(--border-color)] min-w-[105px] text-center">Status</th>
                                    <th className="py-1 px-2 text-center min-w-[100px]">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                  {visibleDays.map((d) => {
                                    const log = row.logs?.[d.day] || {};
                                    const isWO = log.status === 'WO' || (d.dayName.toLowerCase() === row.woDay.toLowerCase() && (!log.status || log.status === 'WO'));
                                    const isAbsent = log.status === 'A';
                                    const isPresent = log.status === 'P';
                                    const isClockedIn = log.status === 'IN';

                                    // Filter Match Logic for Blurring
                                    const activeFilter = childStatusFilters[row.id] || 'all';
                                    let isMatch = true;
                                    if (activeFilter === 'WO') isMatch = isWO;
                                    else if (activeFilter === 'A') isMatch = isAbsent;
                                    else if (activeFilter === 'P') isMatch = isPresent;
                                    else if (activeFilter === 'IN') isMatch = isClockedIn;

                                    const weekNum = Math.floor((d.day - 1) / 7) + 1;
                                    const isWeekStart = d.day === 1 || d.day === 8 || d.day === 15 || d.day === 22 || d.day === 29;
                                    const weekEndDay = Math.min(d.day + 6, currentMonthDays.length);
                                    const isEvenWeek = weekNum % 2 === 0;

                                    return (
                                      <React.Fragment key={d.day}>
                                        {/* WEEK DIVIDER HEADER ROW */}
                                        {isWeekStart && (
                                          <tr className={`bg-sky-500/10 dark:bg-sky-950/40 border-y border-sky-500/20 text-[9.5px] font-extrabold text-sky-600 dark:text-sky-400 font-mono select-none transition-all duration-300 ${
                                            !isMatch ? 'blur-[1.5px] opacity-30 grayscale-[50%]' : ''
                                          }`}>
                                            <td colSpan={9} className="py-1 px-2.5 tracking-wider uppercase">
                                              ✦ Week {weekNum} &bull; (Days {d.day} to {weekEndDay})
                                            </td>
                                          </tr>
                                        )}

                                        {/* DAY ROW WITH BLURRING EFFECT ON UNSELECTED DATA */}
                                        <tr className={`transition-all duration-300 ${
                                          !isMatch 
                                            ? 'blur-[2px] opacity-25 grayscale-[60%] pointer-events-none select-none bg-[var(--bg-app)]' 
                                            : isEvenWeek ? 'bg-sky-500/5 dark:bg-sky-950/20 hover:bg-sky-500/15' : 'hover:bg-sky-500/10'
                                        }`}>
                                          {/* Date Column */}
                                          <td className="py-1 px-2.5 font-mono border-r border-[var(--border-color)] text-xs font-extrabold text-sky-500 whitespace-nowrap">
                                            {d.formattedDate || d.dateStr}
                                          </td>

                                          {/* Day Column */}
                                          <td className="py-1 px-2.5 border-r border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] whitespace-nowrap">
                                            {d.dayName}
                                          </td>

                                          {/* Shift Details & Post - INLINE COMPACT */}
                                          <td className="py-1 px-2.5 border-r border-[var(--border-color)]">
                                            {isWO ? (
                                              <span className="text-[var(--text-muted)] italic text-xs font-semibold">Weekly Off Day (WO)</span>
                                            ) : isAbsent ? (
                                              <span className="text-rose-500/90 text-xs font-semibold">No Shift Logged (Absent)</span>
                                            ) : (
                                              <div className="text-xs font-bold text-[var(--text-main)] truncate">
                                                <span>{log.shift || 'A-Shift [06:00-14:00]'}</span>
                                                <span className="text-[10px] text-sky-500 font-mono font-semibold ml-1.5">Post: {log.post || row.empSite}</span>
                                              </div>
                                            )}
                                          </td>

                                          {/* IN Time */}
                                          <td className="py-1 px-2 font-mono text-xs text-[var(--text-main)] border-r border-[var(--border-color)]">
                                            {isWO || isAbsent ? '-' : (log.inTime || log.punches?.split('-')?.[0]?.trim() || '06:00')}
                                          </td>

                                          {/* OUT Time */}
                                          <td className="py-1 px-2 font-mono text-xs text-[var(--text-main)] border-r border-[var(--border-color)]">
                                            {isClockedIn ? (
                                              <span className="text-amber-500 font-bold">Active (IN)</span>
                                            ) : isWO || isAbsent ? (
                                              '-'
                                            ) : (
                                              log.outTime || log.punches?.split('-')?.[1]?.trim() || '14:00'
                                            )}
                                          </td>

                                          {/* Working Hours */}
                                          <td className="py-1 px-2 text-center font-mono font-bold text-sky-500 border-r border-[var(--border-color)]">
                                            {isWO || isAbsent ? '0 hrs' : `${log.hours || 8.0} hrs`}
                                          </td>

                                          {/* Punches & Duration - INLINE COMPACT */}
                                          <td className="py-1 px-2.5 font-mono text-xs text-[var(--text-main)] border-r border-[var(--border-color)]">
                                            {log.punches && !isWO && !isAbsent ? (
                                              <div className="flex items-center gap-1.5">
                                                <span className="truncate">{log.punches}</span>
                                                {log.netDuration && <span className="text-emerald-500 text-[10px] font-semibold">({log.netDuration})</span>}
                                              </div>
                                            ) : (
                                              <span className="text-[var(--text-muted)]">-</span>
                                            )}
                                          </td>

                                          {/* Status Column: Dropdown ONLY for Weekly Off (WO) and Absent (A) employees/days */}
                                          <td className="py-1 px-2 text-center border-r border-[var(--border-color)]">
                                            {isWO || isAbsent ? (
                                              <select
                                                value={log.status || (isWO ? 'WO' : 'A')}
                                                onChange={(e) => handleQuickStatusChange(row.id, d.day, e.target.value)}
                                                className={`px-1.5 py-0.5 rounded text-xs font-extrabold font-mono border focus:outline-none cursor-pointer shadow-2xs transition-all ${
                                                  isWO
                                                    ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'
                                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40'
                                                }`}
                                                title="Update Status for Weekly Off or Absent Employee"
                                              >
                                                <option value="WO" className="bg-[var(--bg-card)] text-[var(--text-main)]">WO</option>
                                                <option value="A" className="bg-[var(--bg-card)] text-[var(--text-main)]">Absent (A)</option>
                                                <option value="P" className="bg-[var(--bg-card)] text-[var(--text-main)]">Present (P)</option>
                                                <option value="IN" className="bg-[var(--bg-card)] text-[var(--text-main)]">IN</option>
                                              </select>
                                            ) : (
                                              <span className={`px-1.5 py-0.5 rounded text-xs font-extrabold font-mono border inline-block ${
                                                isClockedIn
                                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40'
                                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                                              }`}>
                                                {isClockedIn ? 'Clocked IN' : 'Present (P)'}
                                              </span>
                                            )}
                                          </td>

                                          {/* Child Actions (Edit / Move / Delete) */}
                                          <td className="py-1 px-2 text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                              {/* Edit Button */}
                                              <button
                                                onClick={() => handleOpenEdit(row, d.day)}
                                                className="p-1 rounded bg-sky-500/15 hover:bg-sky-500/30 text-sky-600 dark:text-sky-400 border border-sky-500/30 transition-all cursor-pointer"
                                                title={isAbsent ? "Edit Absent Day" : isWO ? "Edit Weekly Off Day" : "Edit Attendance Log"}
                                              >
                                                <Edit2 className="w-3 h-3 stroke-[2.2]" />
                                              </button>

                                              {/* Rotate Shift */}
                                              <button
                                                onClick={() => handleMoveDayLog(row, d.day)}
                                                className="p-1 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                                                title="Rotate Shift"
                                              >
                                                <ArrowRightLeft className="w-3 h-3 stroke-[2.2]" />
                                              </button>

                                              {/* Delete / Clear */}
                                              <button
                                                onClick={() => handleDeleteDayLog(row, d.day)}
                                                className="p-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                                                title="Delete / Mark Absent"
                                              >
                                                <Trash2 className="w-3 h-3 stroke-[2.2]" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={15} className="py-16 text-center text-slate-500 dark:text-slate-400 text-sm font-semibold">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500 border border-sky-200 dark:border-sky-800">
                        <Filter className="w-6 h-6 text-sky-500" />
                      </div>
                      {!hasFiltered || !submittedFilters ? (
                        <>
                          <p className="text-slate-800 dark:text-slate-100 font-bold text-sm">Select filters to view site time logs.</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">Select a <span className="font-semibold text-sky-600">Client</span>, <span className="font-semibold text-sky-600">Branch</span>, or <span className="font-semibold text-sky-600">Site</span> filter above and click <span className="font-semibold text-sky-600">Submit</span> to load time logs.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-slate-800 dark:text-slate-100 font-bold text-sm">No data found for the selected filters.</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">No guard attendance logs found matching the selected filter criteria.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. MODAL: EDIT TIME LOG ─────────────────────────────────────────── */}
      {isEditModalOpen && editingRow && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[var(--bg-surface-alt)] px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-sky-500/10 text-sky-400">
                  <Edit2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider">
                  Edit Time Log &bull; Day {editingDay}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-3">
              <div className="bg-[var(--bg-surface-alt)] p-2.5 rounded-lg border border-[var(--border-color)] text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Guard Name:</span>
                  <span className="font-bold text-[var(--text-main)]">{editingRow.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Emp Code / Rank:</span>
                  <span className="font-mono font-bold text-sky-400">{editingRow.empCode} ({editingRow.rank})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Site:</span>
                  <span className="font-semibold text-[var(--text-secondary)]">{editingRow.empSite}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold"
                  >
                    <option value="P">Present (P)</option>
                    <option value="IN">Clocked IN (Active)</option>
                    <option value="WO">Weekly Off (WO)</option>
                    <option value="A">Absent (A)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Total Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editFormData.hours}
                    onChange={(e) => setEditFormData({ ...editFormData, hours: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Shift</label>
                <select
                  value={editFormData.shift}
                  onChange={(e) => {
                    const s = e.target.value;
                    const preset = SHIFT_TIME_MAP[s] || { inTime: '06:00', outTime: '14:00', hours: 8.0 };
                    setEditFormData(prev => ({
                      ...prev,
                      shift: s,
                      inTime: preset.inTime,
                      outTime: preset.outTime,
                      hours: preset.hours
                    }));
                  }}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="A-Shift [ 06:00 to 14:00 ]">A-Shift [ 06:00 to 14:00 ]</option>
                  <option value="B-Shift [ 14:00 to 22:00 ]">B-Shift [ 14:00 to 22:00 ]</option>
                  <option value="C-Shift [ 22:00 to 06:00 ]">C-Shift [ 22:00 to 06:00 ]</option>
                  <option value="General Shift [ 09:00 to 18:00 ]">General Shift [ 09:00 to 18:00 ]</option>
                </select>
              </div>

              {editFormData.status !== 'WO' && editFormData.status !== 'A' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                      In Time (Punch In)
                    </label>
                    <input
                      type="time"
                      value={editFormData.inTime}
                      onChange={(e) => setEditFormData({ ...editFormData, inTime: e.target.value })}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                      Out Time (Punch Out)
                    </label>
                    <input
                      type="time"
                      disabled={editFormData.status === 'IN'}
                      value={editFormData.outTime}
                      onChange={(e) => setEditFormData({ ...editFormData, outTime: e.target.value })}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] disabled:opacity-40 rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--control-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. MODAL: ADD GUARD ATTENDANCE RECORD (With Attendance & Time Filters) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-[var(--bg-surface-alt)] px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-sky-500/10 text-sky-400">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider">
                  New Attendance & Guard Record
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEmployee} className="p-4 space-y-3.5">
              {/* Guard Profile Fields */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Guard Name *</label>
                <input
                  type="text"
                  required
                  value={newLogData.name}
                  onChange={(e) => setNewLogData({ ...newLogData, name: e.target.value })}
                  placeholder="e.g. PRAVEEN KUMAR"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Emp Code *</label>
                  <input
                    type="text"
                    required
                    value={newLogData.empCode}
                    onChange={(e) => setNewLogData({ ...newLogData, empCode: e.target.value })}
                    placeholder="HY1501"
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Rank</label>
                  <select
                    value={newLogData.rank}
                    onChange={(e) => setNewLogData({ ...newLogData, rank: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold"
                  >
                    <option value="S/G">S/G (Security Guard)</option>
                    <option value="LS/G">LS/G (Lady Guard)</option>
                    <option value="S/SUP">S/SUP (Supervisor)</option>
                    <option value="ASM">ASM (Assistant Manager)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Emp. Site</label>
                  <input
                    type="text"
                    value={newLogData.empSite}
                    onChange={(e) => setNewLogData({ ...newLogData, empSite: e.target.value })}
                    placeholder="ICGGATE"
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">WO Day</label>
                  <select
                    value={newLogData.woDay}
                    onChange={(e) => setNewLogData({ ...newLogData, woDay: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
              </div>

              {/* ── Attendance & Time Filters ── */}
              <div className="bg-[var(--bg-surface-alt)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-sky-500 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Attendance & Time Filters</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/20">
                    {newLogData.hours} hrs calculated
                  </span>
                </div>

                {/* Day and Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                      Attendance Date / Day *
                    </label>
                    <select
                      value={newLogData.attendanceDay}
                      onChange={(e) => setNewLogData({ ...newLogData, attendanceDay: parseInt(e.target.value, 10) })}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold"
                    >
                      {currentMonthDays.map(d => (
                        <option key={d.day} value={d.day}>
                          Day {d.day} &bull; {d.dayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                      Attendance Status *
                    </label>
                    <select
                      value={newLogData.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value;
                        const preset = SHIFT_TIME_MAP[newLogData.shift] || { inTime: '06:00', outTime: '14:00', hours: 8.0 };
                        setNewLogData(prev => ({
                          ...prev,
                          status: nextStatus,
                          hours: (nextStatus === 'WO' || nextStatus === 'A') ? 0 : preset.hours
                        }));
                      }}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-bold"
                    >
                      <option value="P">Present (P) - Full Shift</option>
                      <option value="IN">Clocked IN (Active Punch)</option>
                      <option value="WO">Weekly Off (WO)</option>
                      <option value="A">Absent (A)</option>
                    </select>
                  </div>
                </div>

                {/* Quick Shift Presets */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                    Shift Selection & Timing Presets
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(SHIFT_TIME_MAP).map(([sName, preset]) => {
                      const isSelected = newLogData.shift === sName;
                      return (
                        <button
                          key={sName}
                          type="button"
                          onClick={() => {
                            setNewLogData(prev => ({
                              ...prev,
                              shift: sName,
                              inTime: preset.inTime,
                              outTime: preset.outTime,
                              hours: prev.status === 'WO' || prev.status === 'A' ? 0 : preset.hours
                            }));
                          }}
                          className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] transition-all flex flex-col ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                              : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-slate-400'
                          }`}
                        >
                          <span className="truncate">{sName.split('[')[0].trim()}</span>
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">
                            {preset.inTime} - {preset.outTime} ({preset.hours}h)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* In/Out Time & Duration Filters (shown when not WO or Absent) */}
                {newLogData.status !== 'WO' && newLogData.status !== 'A' ? (
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                        Punch IN Time
                      </label>
                      <input
                        type="time"
                        value={newLogData.inTime}
                        onChange={(e) => {
                          const newIn = e.target.value;
                          const calcHrs = calculateHours(newIn, newLogData.outTime);
                          setNewLogData(prev => ({
                            ...prev,
                            inTime: newIn,
                            hours: prev.status === 'IN' ? 8.0 : calcHrs
                          }));
                        }}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-main)] font-mono font-bold focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                        Punch OUT Time
                      </label>
                      <input
                        type="time"
                        disabled={newLogData.status === 'IN'}
                        value={newLogData.outTime}
                        onChange={(e) => {
                          const newOut = e.target.value;
                          const calcHrs = calculateHours(newLogData.inTime, newOut);
                          setNewLogData(prev => ({
                            ...prev,
                            outTime: newOut,
                            hours: calcHrs
                          }));
                        }}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] disabled:opacity-40 rounded-lg px-2 py-1.5 text-xs text-[var(--text-main)] font-mono font-bold focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                        Total Hours
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={newLogData.hours}
                        onChange={(e) => setNewLogData({ ...newLogData, hours: parseFloat(e.target.value) || 8.0 })}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2 py-1.5 text-xs text-sky-600 dark:text-sky-400 font-mono font-bold focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-500/10 border border-slate-500/20 text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{newLogData.status === 'WO' ? 'Weekly Off (WO)' : 'Absent (A)'} selected. Time punch records are bypassed for this date.</span>
                  </div>
                )}

                {/* Live Card Preview */}
                <div className="pt-1.5 border-t border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                    Table Attendance Cell Preview:
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--table-header-bg)] border border-[var(--border-color)] flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        newLogData.status === 'IN' 
                          ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                          : newLogData.status === 'WO'
                          ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                          : newLogData.status === 'A'
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                      }`}>
                        {newLogData.status === 'P' ? `${newLogData.hours}h` : newLogData.status}
                      </span>
                      <span className="font-sans font-semibold text-[var(--text-main)] truncate max-w-[140px]">
                        {newLogData.shift.split('[')[0]}
                      </span>
                    </div>
                    <span className="text-[var(--text-muted)]">
                      {newLogData.status === 'WO' 
                        ? 'WEEKLY OFF' 
                        : newLogData.status === 'A' 
                        ? 'ABSENT' 
                        : `${newLogData.inTime} - ${newLogData.status === 'IN' ? 'ACTIVE' : newLogData.outTime}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--control-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. MODAL: DELETE CONFIRMATION POPUP ─────────────────────────────── */}
      {deleteModalState.isOpen && deleteModalState.row && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-rose-500/10 px-4 py-3 border-b border-rose-500/20 flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-extrabold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Confirm Attendance Deletion</span>
            </div>
            
            <div className="p-4 space-y-3">
              <p className="text-xs text-[var(--text-main)] leading-relaxed">
                Are you sure you want to clear/delete the attendance log for <strong className="text-sky-500">{deleteModalState.formattedDate} (Day {deleteModalState.dayNum})</strong> for guard <strong className="text-[var(--text-main)]">{deleteModalState.row.name}</strong>?
              </p>

              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg text-[11px] text-amber-600 dark:text-amber-400 flex items-center space-x-2 font-medium">
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
                <span>This action will mark the guard as <strong>Absent (A)</strong> and set working hours to 0.</span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setDeleteModalState({ isOpen: false, row: null, dayNum: null, formattedDate: '' })}
                  className="px-3.5 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--control-bg)] hover:bg-[var(--control-hover)] text-xs font-semibold text-[var(--text-main)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={confirmDeleteDayLog}
                  className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. TOAST NOTIFICATION ────────────────────────────────────────────── */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-md ${
            notification.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/50'
              : 'bg-slate-900 text-white border-sky-500/50'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Info className="w-4 h-4 text-sky-400" />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

    </div>
  );
}
