import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Clock, 
  Users, 
  Search, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Plus, 
  X, 
  Check, 
  ArrowUpDown,
  Sun,
  Sunset,
  Moon,
  Briefcase,
  Building2,
  MapPin,
  Trash2,
  Info,
  Edit3
} from 'lucide-react';
import { dataManagerApi, locationApi } from '../services/apiService';
import SearchableColumnFilter from './SearchableColumnFilter';

// 4 STANDARD SHIFTS (A, B, C, G) DEFINITION
const STANDARD_SHIFTS = [
  {
    code: 'A',
    name: 'A-Shift',
    title: 'Morning Shift',
    timings: '07:00 - 15:00',
    duration: '8 hrs',
    icon: Sun,
    activeBorder: 'border-sky-500 ring-2 ring-sky-500/30 bg-sky-500/10',
    badge: 'bg-sky-600 text-white',
    badgeText: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    desc: 'Morning operational & security roster'
  },
  {
    code: 'B',
    name: 'B-Shift',
    title: 'Evening Shift',
    timings: '15:00 - 22:00',
    duration: '7 hrs',
    icon: Sunset,
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10',
    badge: 'bg-emerald-600 text-white',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    desc: 'Afternoon & evening surveillance deployment'
  },
  {
    code: 'C',
    name: 'C-Shift',
    title: 'Night Shift',
    timings: '22:00 - 07:00',
    duration: '9 hrs',
    icon: Moon,
    activeBorder: 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/10',
    badge: 'bg-purple-600 text-white',
    badgeText: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    desc: 'Night security, perimeter patrol & vigilance'
  },
  {
    code: 'G',
    name: 'G-Shift',
    title: 'General Shift',
    timings: '09:30 - 18:30',
    duration: '9 hrs',
    icon: Briefcase,
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10',
    badge: 'bg-amber-600 text-white',
    badgeText: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    desc: 'Standard daytime office hours & administration'
  }
];

// 24-Hour Time Input Component (without AM/PM)
const Time24Input = ({ value = '00:00', onChange, required = false, id, placeholder = '00:00' }) => {
  const sanitizeTime = (raw) => {
    if (!raw) return '00:00';
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 0) return '00:00';
    let h = 0;
    let m = 0;
    if (raw.includes(':')) {
      const parts = raw.split(':');
      h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
      m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
    } else if (digits.length <= 2) {
      h = Math.min(23, Math.max(0, parseInt(digits, 10) || 0));
      m = 0;
    } else {
      h = Math.min(23, Math.max(0, parseInt(digits.slice(0, 2), 10) || 0));
      m = Math.min(59, Math.max(0, parseInt(digits.slice(2, 4), 10) || 0));
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const [text, setText] = useState(value || '00:00');

  useEffect(() => {
    if (value !== text && /^\d{2}:\d{2}$/.test(value || '')) {
      setText(value);
    }
  }, [value]);

  const handleChange = (e) => {
    let val = e.target.value.replace(/[^0-9:]/g, '');
    if (val.length > 5) val = val.slice(0, 5);

    // Auto-insert colon after 2 digits if typing forward
    if (val.length === 2 && !val.includes(':') && text.length < 2) {
      val = val + ':';
    }

    setText(val);

    if (/^\d{2}:\d{2}$/.test(val)) {
      const [hStr, mStr] = val.split(':');
      const h = Math.min(23, Math.max(0, parseInt(hStr, 10) || 0));
      const m = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));
      const validTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      onChange(validTime);
    }
  };

  const handleBlur = () => {
    const formatted = sanitizeTime(text);
    setText(formatted);
    onChange(formatted);
  };

  const adjustHour = (delta) => {
    const [h, m] = (value || '00:00').split(':').map(Number);
    let newH = ((h || 0) + delta + 24) % 24;
    const formatted = `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
    setText(formatted);
    onChange(formatted);
  };

  return (
    <div className="relative flex items-center bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/30 transition-all">
      <input
        type="text"
        id={id}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={5}
        required={required}
        className="w-full bg-transparent text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none tracking-widest"
      />
      <span className="text-[10px] font-mono font-extrabold text-[var(--text-muted)] bg-[var(--control-bg)] px-1.5 py-0.5 rounded border border-[var(--border-color)] mr-1 shrink-0 select-none">
        24h
      </span>
      <div className="flex flex-col -my-1 ml-0.5 shrink-0">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjustHour(1)}
          className="text-[var(--text-muted)] hover:text-sky-500 text-[8px] px-1 hover:bg-[var(--control-hover)] rounded leading-none transition-colors cursor-pointer"
          title="Hour +1"
        >
          ▲
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjustHour(-1)}
          className="text-[var(--text-muted)] hover:text-sky-500 text-[8px] px-1 hover:bg-[var(--control-hover)] rounded leading-none transition-colors cursor-pointer"
          title="Hour -1"
        >
          ▼
        </button>
      </div>
      <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1.5 shrink-0 pointer-events-none" />
    </div>
  );
};

export default function DataManagerPage({ currentView, setCurrentView }) {
  const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' | 'staff'
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('ALL'); // 'ALL' | 'A-Shift' | 'B-Shift' | 'C-Shift' | 'G-Shift'

  // SHIFTS STATE
  const [shifts, setShifts] = useState([]);
  const [shiftsTotal, setShiftsTotal] = useState(0);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalSearch, setGlobalSearch] = useState('');

  // Column Filters
  const [filters, setFilters] = useState({
    oid: '',
    client: '',
    branch: '',
    siteName: '',
    active: '',
    shiftName: '',
    duration: ''
  });

  // Sort state
  const [sortField, setSortField] = useState('oid');
  const [sortAsc, setSortAsc] = useState(true);

  // Add/Edit Shift Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [modalClient, setModalClient] = useState('');
  const [modalSite, setModalSite] = useState('');
  const [modalShifts, setModalShifts] = useState([
    {
      id: 1,
      shift_name: 'A-Shift',
      shift_start_time: '07:00',
      shift_end_time: '15:00'
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveSites, setLiveSites] = useState([]);
  const [modalError, setModalError] = useState('');

  // STAFF STATE
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');

  // Sync with currentView prop if set externally
  useEffect(() => {
    if (currentView === 'datamanager_A') {
      setActiveTab('shifts');
      setSelectedShiftFilter('A-Shift');
      setCurrentPage(1);
    } else if (currentView === 'datamanager_B') {
      setActiveTab('shifts');
      setSelectedShiftFilter('B-Shift');
      setCurrentPage(1);
    } else if (currentView === 'datamanager_C') {
      setActiveTab('shifts');
      setSelectedShiftFilter('C-Shift');
      setCurrentPage(1);
    } else if (currentView === 'datamanager_G') {
      setActiveTab('shifts');
      setSelectedShiftFilter('G-Shift');
      setCurrentPage(1);
    } else if (currentView === 'datamanager_staff') {
      setActiveTab('staff');
    } else if (currentView === 'datamanager' || currentView === 'shifts' || currentView === 'datamanager_shifts') {
      setActiveTab('shifts');
    }
  }, [currentView]);

  // Fetch shifts from backend
  const fetchShifts = async () => {
    setShiftsLoading(true);
    try {
      const data = await dataManagerApi.getShifts({
        limit: 2000,
        offset: 0
      });
      if (data && data.items) {
        setShifts(data.items);
        setShiftsTotal(data.total || data.items.length);
      }
    } catch (e) {
      console.warn('fetchShifts error:', e);
    } finally {
      setShiftsLoading(false);
    }
  };

  // Fetch staff from backend
  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const data = await dataManagerApi.getStaff();
      if (data && data.items) {
        setStaffList(data.items);
      }
    } catch (e) {
      console.warn('fetchStaff error:', e);
    } finally {
      setStaffLoading(false);
    }
  };

  // Fetch sites for modal
  useEffect(() => {
    async function loadSites() {
      try {
        const sites = await locationApi.getSites();
        if (sites?.length) setLiveSites(sites);
      } catch (e) {
        console.warn('loadSites error:', e);
      }
    }
    loadSites();
  }, []);

  useEffect(() => {
    if (activeTab === 'shifts') {
      fetchShifts();
    } else if (activeTab === 'staff') {
      fetchStaff();
    }
  }, [activeTab]);

  // Calculate live site counts for the 4 Standard Shifts
  const shiftCounts = useMemo(() => {
    const counts = {
      ALL: shifts.length,
      'A-Shift': 0,
      'B-Shift': 0,
      'C-Shift': 0,
      'G-Shift': 0
    };
    shifts.forEach(s => {
      const name = (s.shift_name || '').trim();
      if (name.startsWith('A-Shift') || name === 'A') counts['A-Shift']++;
      else if (name.startsWith('B-Shift') || name === 'B') counts['B-Shift']++;
      else if (name.startsWith('C-Shift') || name === 'C') counts['C-Shift']++;
      else if (name.startsWith('G-Shift') || name === 'G') counts['G-Shift']++;
    });
    return counts;
  }, [shifts]);

  // Unique options for upside dropdown filters
  const uniqueOids = useMemo(() => {
    const set = new Set();
    shifts.forEach(s => {
      const matchClient = !filters.client || String(s.client || '').toLowerCase().includes(filters.client.toLowerCase());
      const matchBranch = !filters.branch || String(s.branch || '').toLowerCase().includes(filters.branch.toLowerCase());
      const matchSite = !filters.siteName || String(s.site_name || '').toLowerCase().includes(filters.siteName.toLowerCase());
      const val = s.oid || s.id;
      if (matchClient && matchBranch && matchSite && val !== undefined && val !== null && val !== '') {
        set.add(String(val).trim());
      }
    });
    return Array.from(set).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [shifts, filters.client, filters.branch, filters.siteName]);

  const uniqueClients = useMemo(() => {
    const set = new Set();
    shifts.forEach(s => {
      if (s.client) set.add(String(s.client).trim());
    });
    return Array.from(set).sort();
  }, [shifts]);

  const uniqueBranches = useMemo(() => {
    const set = new Set();
    shifts.forEach(s => {
      const matchClient = !filters.client || String(s.client || '').toLowerCase().includes(filters.client.toLowerCase());
      if (matchClient && s.branch) set.add(String(s.branch).trim());
    });
    return Array.from(set).sort();
  }, [shifts, filters.client]);

  const uniqueSites = useMemo(() => {
    const set = new Set();
    shifts.forEach(s => {
      const matchClient = !filters.client || String(s.client || '').toLowerCase().includes(filters.client.toLowerCase());
      const matchBranch = !filters.branch || String(s.branch || '').toLowerCase().includes(filters.branch.toLowerCase());
      if (matchClient && matchBranch && s.site_name) set.add(String(s.site_name).trim());
    });
    return Array.from(set).sort();
  }, [shifts, filters.client, filters.branch]);

  // Combined unique client options for modal searchable dropdown
  const modalClientOptions = useMemo(() => {
    const set = new Set();
    liveSites.forEach(s => {
      if (s.client) set.add(String(s.client).trim());
    });
    shifts.forEach(s => {
      if (s.client) set.add(String(s.client).trim());
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [liveSites, shifts]);

  // Filtered site options for modal searchable dropdown (cascaded from selected Client)
  const modalSiteOptions = useMemo(() => {
    const set = new Set();
    const clientFilter = (modalClient || '').trim().toLowerCase();

    liveSites.forEach(s => {
      const clientMatch = !clientFilter || (s.client || '').trim().toLowerCase() === clientFilter;
      const name = s.site || s.name || s.site_name;
      if (clientMatch && name) set.add(String(name).trim());
    });

    shifts.forEach(s => {
      const clientMatch = !clientFilter || (s.client || '').trim().toLowerCase() === clientFilter;
      if (clientMatch && s.site_name) set.add(String(s.site_name).trim());
    });

    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [liveSites, shifts, modalClient]);

  // Selected site details preview
  const selectedSiteDetails = useMemo(() => {
    if (!modalSite) return null;
    const matchLive = liveSites.find(s => (s.site || s.name || s.site_name || '').trim().toLowerCase() === modalSite.trim().toLowerCase());
    const matchShifts = shifts.filter(s => (s.site_name || '').trim().toLowerCase() === modalSite.trim().toLowerCase());
    const firstShift = matchShifts[0];

    const clientName = modalClient || matchLive?.client || firstShift?.client || 'N/A';
    const branchName = matchLive?.branch || firstShift?.branch || 'N/A';
    const siteId = matchLive?.id || matchLive?.oid || firstShift?.site_id || firstShift?.id || 'Auto';
    const existingShiftsList = Array.from(new Set(matchShifts.map(s => s.shift_name).filter(Boolean)));

    return {
      siteName: modalSite,
      client: clientName,
      branch: branchName,
      siteId: siteId,
      existingShiftsCount: existingShiftsList.length,
      existingShifts: existingShiftsList
    };
  }, [modalSite, modalClient, liveSites, shifts]);

  // Helper: Live duration calculation
  const calculateShiftDuration = (start, end) => {
    if (!start || !end) return '';
    if (start === '00:00' && end === '00:00') return '';
    if (start === end) return '24 hrs';
    try {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      let minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (minutes < 0) minutes += 1440;
      const hours = minutes / 60;
      return hours % 1 === 0 ? `${hours} hrs` : `${hours.toFixed(1)} hrs`;
    } catch {
      return '';
    }
  };

  // Helper: Add more shift row (starts from 00:00 zero timings with manual name)
  const handleAddShiftRow = () => {
    setModalShifts(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        shift_name: '',
        shift_start_time: '00:00',
        shift_end_time: '00:00'
      }
    ]);
  };

  // Helper: Open modal in edit mode for an existing shift
  const handleEditShift = (row) => {
    setModalError('');
    setEditingShiftId(row.id || row.oid);
    setModalClient(row.client || '');
    setModalSite(row.site_name || '');
    setModalShifts([
      {
        id: row.id || row.oid,
        shift_name: row.shift_name || 'A-Shift',
        shift_start_time: row.shift_start_time || '00:00',
        shift_end_time: row.shift_end_time || '00:00',
        isEditingName: false
      }
    ]);
    setIsAddModalOpen(true);
  };

  // Helper: Open modal in clean add mode
  const handleOpenAddModal = () => {
    setEditingShiftId(null);
    setModalError('');
    setModalClient('');
    setModalSite('');
    setModalShifts([
      {
        id: 1,
        shift_name: 'A-Shift',
        shift_start_time: '07:00',
        shift_end_time: '15:00',
        isEditingName: false
      }
    ]);
    setIsAddModalOpen(true);
  };

  // Helper: Remove shift row
  const handleRemoveShiftRow = (id) => {
    if (modalShifts.length <= 1) return;
    setModalShifts(prev => prev.filter(s => s.id !== id));
  };

  // Helper: Update shift row field
  const handleUpdateShiftRow = (id, field, value) => {
    setModalShifts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Helper: Apply standard preset to a shift row
  const handleApplyPresetToRow = (id, preset) => {
    const times = preset.timings.split('-').map(t => t.trim());
    setModalShifts(prev => prev.map(s => s.id === id ? {
      ...s,
      shift_name: preset.name,
      shift_start_time: times[0] || s.shift_start_time,
      shift_end_time: times[1] || s.shift_end_time
    } : s));
  };

  // Handle column filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'client') {
        updated.branch = '';
        updated.siteName = '';
      } else if (field === 'branch') {
        updated.siteName = '';
      }
      return updated;
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setGlobalSearch('');
    setFilters({
      oid: '',
      client: '',
      branch: '',
      siteName: '',
      active: '',
      shiftName: '',
      duration: ''
    });
    setSelectedShiftFilter('ALL');
    setCurrentPage(1);
  };

  // Filtered & Sorted Shifts
  const filteredShifts = useMemo(() => {
    let list = [...shifts];

    // Filter by 4 standard shifts selection
    if (selectedShiftFilter !== 'ALL') {
      list = list.filter(item => {
        const n = (item.shift_name || '').trim();
        return n.startsWith(selectedShiftFilter) || n === selectedShiftFilter.replace('-Shift', '');
      });
    }

    // Global Search across fields
    if (globalSearch.trim()) {
      const q = globalSearch.trim().toLowerCase();
      list = list.filter(item => {
        return (
          String(item.oid || item.id || '').toLowerCase().includes(q) ||
          (item.client || '').toLowerCase().includes(q) ||
          (item.branch || '').toLowerCase().includes(q) ||
          (item.site_name || '').toLowerCase().includes(q) ||
          (item.shift_name || '').toLowerCase().includes(q) ||
          (item.duration || '').toLowerCase().includes(q) ||
          String(item.active || '').toLowerCase().includes(q)
        );
      });
    }

    // Column Filters
    if (filters.oid.trim()) {
      list = list.filter(item => String(item.oid || item.id).includes(filters.oid.trim()));
    }
    if (filters.client.trim()) {
      const q = filters.client.trim().toLowerCase();
      list = list.filter(item => (item.client || '').toLowerCase().includes(q));
    }
    if (filters.branch.trim()) {
      const q = filters.branch.trim().toLowerCase();
      list = list.filter(item => (item.branch || '').toLowerCase().includes(q));
    }
    if (filters.siteName.trim()) {
      const q = filters.siteName.trim().toLowerCase();
      list = list.filter(item => (item.site_name || '').toLowerCase().includes(q));
    }
    if (filters.active.trim()) {
      const q = filters.active.trim().toLowerCase();
      list = list.filter(item => String(item.active || '').toLowerCase().includes(q));
    }
    if (filters.shiftName.trim()) {
      const q = filters.shiftName.trim().toLowerCase();
      list = list.filter(item => (item.shift_name || '').toLowerCase().includes(q));
    }
    if (filters.duration.trim()) {
      const q = filters.duration.trim().toLowerCase();
      list = list.filter(item => (item.duration || '').toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      let vA = a[sortField] ?? '';
      let vB = b[sortField] ?? '';
      const numA = Number(vA);
      const numB = Number(vB);
      if (!isNaN(numA) && !isNaN(numB) && vA !== '' && vB !== '') {
        return sortAsc ? numA - numB : numB - numA;
      }
      return sortAsc 
        ? String(vA).localeCompare(String(vB))
        : String(vB).localeCompare(String(vA));
    });

    return list;
  }, [shifts, selectedShiftFilter, globalSearch, filters, sortField, sortAsc]);

  // Pagination calculation
  const totalRecords = filteredShifts.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const currentShifts = filteredShifts.slice(startIndex, endIndex);

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Add shift save (handles single or multiple shifts)
  const handleSaveShift = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!modalClient && (!selectedSiteDetails || selectedSiteDetails.client === 'N/A')) {
      setModalError('Please select a client.');
      return;
    }

    if (!modalSite) {
      setModalError('Please select a site.');
      return;
    }

    // Validate shifts
    for (let i = 0; i < modalShifts.length; i++) {
      const s = modalShifts[i];
      if (!s.shift_name || !s.shift_name.trim()) {
        setModalError(`Shift #${i + 1}: Please enter a shift name.`);
        return;
      }
      if (!s.shift_start_time || !s.shift_end_time) {
        setModalError(`Shift #${i + 1}: Please specify both start and end times in 24-hour format.`);
        return;
      }
    }

    const targetSiteId = (selectedSiteDetails?.siteId && selectedSiteDetails.siteId !== 'Auto')
      ? selectedSiteDetails.siteId
      : (() => {
          const matchLive = liveSites.find(s => (s.site || s.name || s.site_name || '').trim().toLowerCase() === modalSite.trim().toLowerCase());
          const matchShift = shifts.find(s => (s.site_name || '').trim().toLowerCase() === modalSite.trim().toLowerCase());
          return matchLive ? (matchLive.id || matchLive.oid) : (matchShift ? (matchShift.site_id || matchShift.id) : modalSite);
        })();

    setIsSubmitting(true);
    try {
      if (editingShiftId) {
        const s = modalShifts[0];
        const shiftName = s.shift_name.trim() || 'A-Shift';

        await dataManagerApi.updateShift(editingShiftId, {
          site_id: targetSiteId || modalSite,
          site: targetSiteId || modalSite,
          shift_name: shiftName,
          shift_start_time: s.shift_start_time,
          shift_end_time: s.shift_end_time
        });
      } else {
        // Save all configured shifts in parallel via existing createShift API
        await Promise.all(
          modalShifts.map((s, idx) => {
            const shiftName = s.shift_name.trim() || `Shift ${idx + 1}`;

            return dataManagerApi.createShift({
              site_id: targetSiteId || modalSite,
              site: targetSiteId || modalSite,
              shift_name: shiftName,
              shift_start_time: s.shift_start_time,
              shift_end_time: s.shift_end_time
            });
          })
        );
      }

      setIsAddModalOpen(false);
      setEditingShiftId(null);
      setModalClient('');
      setModalSite('');
      setModalShifts([
        {
          id: 1,
          shift_name: 'A-Shift',
          shift_start_time: '07:00',
          shift_end_time: '15:00'
        }
      ]);
      fetchShifts();
    } catch (err) {
      setModalError((editingShiftId ? 'Failed to update shift: ' : 'Failed to create shifts: ') + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return staffList;
    const q = staffSearch.toLowerCase();
    return staffList.filter(s => 
      (s.name || '').toLowerCase().includes(q) ||
      (s.emp_code || '').toLowerCase().includes(q) ||
      (s.mobile || '').toLowerCase().includes(q) ||
      (s.branch || '').toLowerCase().includes(q)
    );
  }, [staffList, staffSearch]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1920px] mx-auto font-sans">
      
      {/* HEADER WITH TABS (Shown on Staff Tab) */}
      {activeTab === 'staff' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-black tracking-tight text-[var(--text-main)]">
                  Staff Directory
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Master Employee & Staff Directory
                </p>
              </div>
            </div>
          </div>

          {/* Record Count Badge */}
          <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
            <Users className="w-3.5 h-3.5" />
            <span>Staff</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/20 font-mono">
              {staffList.length}
            </span>
          </div>
        </div>
      )}

      {/* SHIFTS VIEW */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          


          {/* MAIN SHIFTS WORKSPACE */}
          <div className="space-y-2.5 pt-1 font-sans">
            
            {/* Compact Workspace Header Bar */}
            <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-color)] py-2.5 px-4 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md border border-sky-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xs font-extrabold tracking-wider uppercase text-[var(--text-main)] flex items-center gap-2">
                    <span>Shift Directory Workspace</span>
                    <span className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold lowercase">
                      {totalRecords.toLocaleString()} total
                    </span>
                  </h1>
                </div>
              </div>

              {/* Compact Quick Metrics & Action Controls */}
              <div className="flex items-center space-x-2">
                <div className="hidden md:flex items-center space-x-2 text-[11px] font-semibold border-r border-[var(--border-color)] pr-3 mr-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{shifts.filter(s => s.active).length.toLocaleString()} Active</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{selectedShiftFilter !== 'ALL' ? selectedShiftFilter : '4 Shifts'}</span>
                  </span>
                </div>

                <button
                  onClick={handleClearFilters}
                  className="flex items-center space-x-1 bg-[var(--control-bg)] hover:bg-[var(--control-hover)] text-[var(--text-main)] text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--border-color)] transition-all shadow-2xs cursor-pointer"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-md transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Shift</span>
                </button>
              </div>
            </div>

            {/* STICKY HORIZONTAL FILTER & CONTROL TOOLBAR */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2 shadow-sm flex flex-wrap items-center justify-between gap-2 transition-colors">
              
              {/* Left Side: Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                {/* OID Code Filter Dropdown */}
                <div className="w-[115px] sm:w-[130px]">
                  <SearchableColumnFilter
                    field="oid"
                    label="OID Code"
                    value={filters.oid || ''}
                    onChange={(val) => handleFilterChange('oid', val)}
                    options={uniqueOids}
                    placeholder="Select OID..."
                    roundedClass="rounded-full px-3 py-1.5"
                  />
                </div>

                {/* Client Filter Dropdown */}
                <div className="w-[140px] sm:w-[155px]">
                  <SearchableColumnFilter
                    field="client"
                    label="Client"
                    value={filters.client || ''}
                    onChange={(val) => handleFilterChange('client', val)}
                    options={uniqueClients}
                    placeholder="Select Client..."
                    roundedClass="rounded-full px-3 py-1.5"
                  />
                </div>

                {/* Branch Filter Dropdown */}
                <div className="w-[125px] sm:w-[140px]">
                  <SearchableColumnFilter
                    field="branch"
                    label="Branch"
                    value={filters.branch || ''}
                    onChange={(val) => handleFilterChange('branch', val)}
                    options={uniqueBranches}
                    placeholder="Select Branch..."
                    roundedClass="rounded-full px-3 py-1.5"
                  />
                </div>

                {/* Site Filter Dropdown */}
                <div className="w-[135px] sm:w-[150px]">
                  <SearchableColumnFilter
                    field="siteName"
                    label="Site"
                    value={filters.siteName || ''}
                    onChange={(val) => handleFilterChange('siteName', val)}
                    options={uniqueSites}
                    placeholder="Select Site..."
                    roundedClass="rounded-full px-3 py-1.5"
                  />
                </div>
              </div>

              {/* Right Side: Compact Pagination Controls */}
              <div className="flex items-center space-x-2 text-[11px] text-[var(--text-muted)] font-semibold border-l border-[var(--border-color)] pl-2">
                <span className="font-mono text-[var(--text-main)] text-[10px] whitespace-nowrap font-bold">
                  {totalRecords > 0 ? `${startIndex + 1}-${endIndex} of ${totalRecords}` : '0 records'}
                </span>

                {/* Page Buttons */}
                <div className="flex items-center space-x-0.5">
                  <button 
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--control-hover)] disabled:opacity-30 cursor-pointer"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--control-hover)] disabled:opacity-30 cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-2 py-0.5 bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 rounded font-bold text-[10px]">
                    {currentPage} / {totalPages}
                  </span>

                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--control-hover)] disabled:opacity-30 cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--control-hover)] disabled:opacity-30 cursor-pointer"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Page Size Select */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1.5 py-1 text-[10px] text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold cursor-pointer"
                >
                  <option value={10}>10 / p</option>
                  <option value={25}>25 / p</option>
                  <option value={50}>50 / p</option>
                  <option value={100}>100 / p</option>
                </select>
              </div>

            </div>

            {/* Main Table Container */}
            <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-md overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] text-[var(--text-main)] font-bold select-none uppercase tracking-wider text-[10px]">
                    <th 
                      onClick={() => handleSort('oid')}
                      className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-between">
                        <span>OID Code</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('client')}
                      className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-between">
                        <span>Client</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('branch')}
                      className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-between">
                        <span>Branch</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('site_name')}
                      className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-between">
                        <span>Site</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('shift_name')}
                      className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-between">
                        <span>Shift Name</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('shift_start_time')}
                      className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-between">
                        <span>Shift Start Time</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('shift_end_time')}
                      className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-between">
                        <span>Shift End Time</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('duration')}
                      className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-between">
                        <span>Duration</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('active')}
                      className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-between">
                        <span>Active</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                      </div>
                    </th>

                    <th className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span>Action</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-color)]">
                  {shiftsLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[var(--text-muted)]">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-semibold text-xs">Loading shift records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentShifts.length > 0 ? (
                    currentShifts.map((row) => (
                      <tr 
                        key={row.oid || row.id} 
                        className="hover:bg-[var(--control-hover)] transition-colors group text-[11px]"
                      >
                        <td className="py-2.5 px-2.5 border-r border-[var(--border-color)] font-mono text-[var(--text-muted)]">
                          {row.oid || row.id}
                        </td>

                        <td className="py-2.5 px-2.5 border-r border-[var(--border-color)] font-medium text-[var(--text-main)]">
                          {row.client || 'Tata Communications'}
                        </td>

                        <td className="py-2.5 px-2.5 border-r border-[var(--border-color)] text-[var(--text-secondary)]">
                          {row.branch || 'Mumbai'}
                        </td>

                        <td className="py-2.5 px-2.5 border-r border-[var(--border-color)] font-medium text-sky-600 dark:text-sky-400">
                          {row.site_name || '-'}
                        </td>

                        <td className="py-2.5 px-2.5 border-r border-[var(--border-color)]">
                          <div className="flex items-center space-x-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              (row.shift_name || '').startsWith('A') ? 'bg-sky-500' :
                              (row.shift_name || '').startsWith('B') ? 'bg-emerald-500' :
                              (row.shift_name || '').startsWith('C') ? 'bg-purple-500' :
                              'bg-amber-500'
                            }`} />
                            <span className="font-bold text-[var(--text-main)]">
                              {row.shift_name || 'Standard Shift'}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-2.5 border-r border-[var(--border-color)] font-mono text-[var(--text-main)]">
                          {row.shift_start_time || '-'}
                        </td>

                        <td className="py-2.5 px-2.5 border-r border-[var(--border-color)] font-mono text-[var(--text-main)]">
                          {row.shift_end_time || '-'}
                        </td>

                        <td className="py-2.5 px-2.5 border-r border-[var(--border-color)] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.duration || '8 hrs'}
                        </td>

                        <td className="py-2.5 px-2.5 border-r border-[var(--border-color)] text-[var(--text-secondary)] font-mono">
                          {String(row.active ?? true)}
                        </td>

                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEditShift(row)}
                            title="Edit shift entry"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-600 text-sky-600 dark:text-sky-400 hover:text-white border border-sky-500/20 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[var(--text-muted)]">
                        <div className="space-y-1">
                          <p className="font-bold text-sm">No matching shift records found</p>
                          <p className="text-xs">
                            {selectedShiftFilter !== 'ALL' 
                              ? `No records found for ${selectedShiftFilter}. Click 'Reset Filters' to see all shifts.`
                              : 'Try adjusting your column filter inputs above.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* STAFF VIEW */}
      {activeTab === 'staff' && (
        <div className="space-y-3">
          {/* Top Blue Header Banner */}
          <div className="bg-[#0066a2] text-white py-2.5 px-4 text-center rounded-t-lg shadow-sm">
            <h2 className="text-base sm:text-lg font-bold tracking-wide select-none">
              Staff Directory
            </h2>
          </div>

          {/* Search Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 rounded-lg shadow-xs flex items-center justify-between gap-3">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Search staff by Name, Emp Code, Mobile or Branch..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredStaff.length}</strong> staff members
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                  <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">Emp Code</th>
                  <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">Name</th>
                  <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">Mobile</th>
                  <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">Branch</th>
                  <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">Designation</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {staffLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading staff...
                    </td>
                  </tr>
                ) : filteredStaff.length > 0 ? (
                  filteredStaff.map((staff, idx) => (
                    <tr key={staff.id || staff.emp_code || idx} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 font-mono font-bold text-[#0066a2] dark:text-sky-400">
                        {staff.emp_code || '-'}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100">
                        {staff.name || '-'}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-400">
                        {staff.mobile || '-'}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                        {staff.branch || '-'}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                        {staff.designation || 'Security Staff'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT SHIFT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] w-full max-w-2xl text-[var(--text-main)] max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-xl ${editingShiftId ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'} flex items-center justify-center font-bold`}>
                  {editingShiftId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
                    {editingShiftId ? 'Edit Shift Record' : 'Add Shift Record(s)'}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {editingShiftId 
                      ? 'Modify shift timings and details for this site assignment' 
                      : 'Assign shifts to a Client and Site with custom or preset rosters'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingShiftId(null);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1.5 rounded-lg hover:bg-[var(--control-hover)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveShift} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>{modalError}</span>
                </div>
              )}

              {/* 1. Client & Site Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[var(--control-bg)] p-3.5 rounded-xl border border-[var(--border-color)]">
                {/* Client Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-500" />
                    <span>Client <span className="text-red-500">*</span></span>
                  </label>
                  <SearchableColumnFilter
                    label="Client"
                    value={modalClient}
                    onChange={(val) => {
                      setModalError('');
                      setModalClient(val);
                      // Clear site if the currently chosen site does not match the new client
                      if (modalSite && val) {
                        const matchLive = liveSites.find(s => (s.site || s.name || s.site_name || '').trim().toLowerCase() === modalSite.trim().toLowerCase());
                        const matchShift = shifts.find(s => (s.site_name || '').trim().toLowerCase() === modalSite.trim().toLowerCase());
                        const siteClient = (matchLive?.client || matchShift?.client || '').trim().toLowerCase();
                        if (siteClient && siteClient !== val.trim().toLowerCase()) {
                          setModalSite('');
                        }
                      }
                    }}
                    options={modalClientOptions}
                    placeholder="Select Client..."
                    roundedClass="rounded-lg"
                    inputClassName="px-3 py-2 text-xs font-semibold pr-7"
                    dropdownClassName="w-full min-w-[240px]"
                  />
                </div>

                {/* Site Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Site <span className="text-red-500">*</span></span>
                  </label>
                  <SearchableColumnFilter
                    label="Site"
                    value={modalSite}
                    onChange={(val) => {
                      setModalError('');
                      setModalSite(val);
                      // If client was not selected, auto-fill it from the selected site
                      if (val && !modalClient) {
                        const matchLive = liveSites.find(s => (s.site || s.name || s.site_name || '').trim().toLowerCase() === val.trim().toLowerCase());
                        const matchShift = shifts.find(s => (s.site_name || '').trim().toLowerCase() === val.trim().toLowerCase());
                        const detectedClient = matchLive?.client || matchShift?.client;
                        if (detectedClient) setModalClient(detectedClient);
                      }
                    }}
                    options={modalSiteOptions}
                    placeholder={modalClient ? `Select Site for ${modalClient}...` : "Select a Site..."}
                    roundedClass="rounded-lg"
                    inputClassName="px-3 py-2 text-xs font-semibold pr-7"
                    dropdownClassName="w-full min-w-[240px]"
                  />
                </div>
              </div>

              {/* 2. Selected Site Details Preview */}
              {selectedSiteDetails && (
                <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-extrabold text-[var(--text-main)]">
                        {selectedSiteDetails.siteName}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                      Site OID: {selectedSiteDetails.siteId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-sky-500/10 text-[11px]">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Client</span>
                      <span className="font-semibold text-[var(--text-main)] truncate block">
                        {selectedSiteDetails.client}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Branch</span>
                      <span className="font-semibold text-[var(--text-main)] truncate block">
                        {selectedSiteDetails.branch}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Configured Shifts</span>
                      {selectedSiteDetails.existingShiftsCount > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                            {selectedSiteDetails.existingShiftsCount} shifts:
                          </span>
                          {shifts
                            .filter(s => (s.site_name || '').trim().toLowerCase() === modalSite.trim().toLowerCase())
                            .slice(0, 4)
                            .map(s => (
                              <button
                                key={s.id || s.oid}
                                type="button"
                                onClick={() => handleEditShift(s)}
                                className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-bold transition-colors cursor-pointer"
                                title={`Edit ${s.shift_name} (${s.shift_start_time} - ${s.shift_end_time})`}
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>{s.shift_name}</span>
                              </button>
                            ))}
                        </div>
                      ) : (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">None yet</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Multi-Shift Configuration Section */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
                    {editingShiftId ? 'Shift Details' : `Shifts Configuration (${modalShifts.length})`}
                  </h4>
                </div>

                {/* Shift Entry Rows */}
                <div className="space-y-3">
                  {modalShifts.map((shift, idx) => {
                    const duration = calculateShiftDuration(shift.shift_start_time, shift.shift_end_time);

                    return (
                      <div 
                        key={shift.id} 
                        className="bg-[var(--bg-surface-alt)] border border-[var(--border-color)] rounded-xl p-3.5 space-y-3 shadow-2xs relative transition-all"
                      >
                        {/* Shift Card Top Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-md bg-[#4f46e5] text-white text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs text-[var(--text-main)]">
                              {shift.shift_name ? shift.shift_name : `Shift Entry #${idx + 1}`}
                            </span>
                            {duration && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                                {duration}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {/* Remove Row Button (if > 1 shift && not in single edit mode) */}
                            {modalShifts.length > 1 && !editingShiftId && (
                              <button
                                type="button"
                                onClick={() => handleRemoveShiftRow(shift.id)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer ml-1"
                                title="Remove this shift"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Shift Fields: Shift Name & 24-Hour Start/End Times */}
                        <div className="space-y-2.5 pt-0.5">
                          {/* Manual Shift Name Input */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">
                              Shift Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={shift.shift_name}
                              onChange={(e) => handleUpdateShiftRow(shift.id, 'shift_name', e.target.value)}
                              placeholder="Enter shift name (e.g. A-Shift, Morning Shift, Night Shift, General)..."
                              required
                              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] font-semibold placeholder:text-[var(--text-muted)] focus:outline-none focus:border-sky-500 transition-colors"
                            />
                          </div>

                          {/* 24-Hour Shift Start and End Times (NO AM / PM) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Start Time */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1 flex items-center justify-between">
                                <span>Shift Start Time (24h) <span className="text-red-500">*</span></span>
                              </label>
                              <Time24Input
                                value={shift.shift_start_time}
                                onChange={(val) => handleUpdateShiftRow(shift.id, 'shift_start_time', val)}
                                required
                              />
                            </div>

                            {/* End Time */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1 flex items-center justify-between">
                                <span>Shift End Time (24h) <span className="text-red-500">*</span></span>
                              </label>
                              <Time24Input
                                value={shift.shift_end_time}
                                onChange={(val) => handleUpdateShiftRow(shift.id, 'shift_end_time', val)}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Single Add Shift option placed right above Save Shifts - only one plus sign */}
                {!editingShiftId && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddShiftRow}
                      className="flex items-center space-x-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-600 border border-sky-500/30 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Shift</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingShiftId(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-[var(--text-main)] hover:bg-[var(--control-hover)] font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting 
                      ? (editingShiftId ? 'Updating...' : 'Saving...') 
                      : editingShiftId
                        ? 'Update Shift'
                        : modalShifts.length > 1 
                          ? `Save ${modalShifts.length} Shifts` 
                          : 'Save Shift'}
                  </span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
