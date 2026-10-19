import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowUpDown, 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight,
  RotateCcw,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { dataManagerApi } from '../services/apiService';

export default function DesignationPage({ currentView, setCurrentView }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // New Designation Form State
  const [newDesignationName, setNewDesignationName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [metaOptions, setMetaOptions] = useState({ clients: [], skills: [] });
  const [companyMasterDesignations, setCompanyMasterDesignations] = useState([]);
  const [loadingMasterDesignations, setLoadingMasterDesignations] = useState(false);
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination state (default 20 records per page, options: 10, 20, 50, 100, All)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sorting state
  const [sortField, setSortField] = useState('oid');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Column filter inputs (matching legacy table search inputs below headers)
  const [columnFilters, setColumnFilters] = useState({
    oid: '',
    client: '',
    designation: '',
    skill_designation: '',
    skill_designation_oid: ''
  });

  // Delete modal state
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Client filter dropdown state
  const [showClientFilterDropdown, setShowClientFilterDropdown] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const filterDropdownRef = useRef(null);

  // Skill searchable dropdown state
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const skillDropdownRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setShowClientFilterDropdown(false);
      }
    }
    if (showClientFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showClientFilterDropdown]);

  // Close skill dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (skillDropdownRef.current && !skillDropdownRef.current.contains(e.target)) {
        setShowSkillDropdown(false);
      }
    }
    if (showSkillDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSkillDropdown]);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch designations from backend
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataManagerApi.getDesignations({
        limit: 2000,
        offset: 0
      });
      if (data && data.items) {
        setRecords(data.items);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching designations:', err);
      setError('Failed to load designations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch meta options (clients & skills)
  const fetchMeta = async () => {
    try {
      const meta = await dataManagerApi.getDesignationsMeta();
      if (meta) {
        setMetaOptions({
          clients: meta.clients || [],
          skills: meta.skills || []
        });
        if (meta.clients && meta.clients.length > 0) {
          setSelectedClientId(String(meta.clients[0].oid));
        }
      }
    } catch (e) {
      console.warn('Failed to load designations meta', e);
    }
  };

  // Fetch company master designations when client is selected
  const fetchClientMasterDesignations = async (clientId) => {
    if (!clientId) {
      setCompanyMasterDesignations([]);
      return;
    }
    setLoadingMasterDesignations(true);
    try {
      const data = await dataManagerApi.getDesignations({ client_id: clientId });
      const items = (data && data.items) ? data.items : [];
      setCompanyMasterDesignations(items);
    } catch (err) {
      console.warn('Failed to load company master designations:', err);
      setCompanyMasterDesignations([]);
    } finally {
      setLoadingMasterDesignations(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchMeta();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientMasterDesignations(selectedClientId);
      setNewDesignationName('');
      setIsCustomInput(false);
    }
  }, [selectedClientId]);

  // Handle column sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (field, val) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: val
    }));
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setColumnFilters({
      oid: '',
      client: '',
      designation: '',
      skill_designation: '',
      skill_designation_oid: ''
    });
    setCurrentPage(1);
  };

  // Refresh table data and reset all filters
  const handleRefresh = async () => {
    handleResetFilters();
    setClientSearchTerm('');
    setShowClientFilterDropdown(false);
    await Promise.all([fetchRecords(), fetchMeta()]);
  };

  // Unique sorted clients list across records & metaOptions
  const allClientsList = useMemo(() => {
    const set = new Set();
    metaOptions.clients.forEach(c => {
      if (c.name) set.add(c.name.trim());
    });
    records.forEach(r => {
      if (r.client) set.add(String(r.client).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [metaOptions.clients, records]);

  // Client counts in designations table
  const clientCounts = useMemo(() => {
    const counts = {};
    records.forEach(r => {
      const c = (r.client || '').trim();
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [records]);

  // Filtered clients list based on search term in dropdown
  const filteredClientsList = useMemo(() => {
    if (!clientSearchTerm.trim()) return allClientsList;
    const lower = clientSearchTerm.toLowerCase().trim();
    return allClientsList.filter(c => c.toLowerCase().includes(lower));
  }, [allClientsList, clientSearchTerm]);

  // Selected skill object
  const selectedSkill = useMemo(() => {
    return metaOptions.skills.find(s => String(s.oid) === String(selectedSkillId)) || null;
  }, [metaOptions.skills, selectedSkillId]);

  // Filtered skills based on search input
  const filteredSkills = useMemo(() => {
    if (!skillSearchTerm.trim()) return metaOptions.skills;
    const term = skillSearchTerm.toLowerCase().trim();
    return metaOptions.skills.filter(s => (s.name || '').toLowerCase().includes(term));
  }, [metaOptions.skills, skillSearchTerm]);

  // Create new designation
  const handleAddDesignation = async (e) => {
    if (e) e.preventDefault();
    const trimmed = (newDesignationName || '').trim();
    if (!trimmed) {
      showToastMsg('Please enter a Designation Name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmed,
        client_id: selectedClientId ? parseInt(selectedClientId, 10) : undefined,
        skill_designation_oid: selectedSkillId ? parseInt(selectedSkillId, 10) : undefined
      };
      const res = await dataManagerApi.createDesignation(payload);
      if (res && res.status === 'created') {
        showToastMsg(`Designation "${trimmed}" created successfully (OID: ${res.oid})!`);
        setNewDesignationName('');
        setSelectedSkillId('');
        setSkillSearchTerm('');
        await fetchRecords();
        if (selectedClientId) {
          await fetchClientMasterDesignations(selectedClientId);
        }
      } else if (res && res.status === 'exists') {
        showToastMsg(res.message || `Designation "${trimmed}" already exists for this client (OID: ${res.oid})`, 'error');
        await fetchRecords();
        if (selectedClientId) {
          await fetchClientMasterDesignations(selectedClientId);
        }
      } else {
        showToastMsg(res?.message || res?.detail || 'Failed to create designation', 'error');
      }
    } catch (err) {
      console.error('Error creating designation:', err);
      showToastMsg(err.message || 'Failed to create designation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete designation
  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await dataManagerApi.deleteDesignation(deletingRecord.oid);
      showToastMsg(`Designation #${deletingRecord.oid} removed successfully.`);
      setDeletingRecord(null);
      fetchRecords();
    } catch (err) {
      console.error('Error removing designation:', err);
      showToastMsg(err.message || 'Cannot remove designation (may be in use)', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return records.filter(row => {
      if (columnFilters.oid) {
        if (!String(row.oid).includes(columnFilters.oid.trim())) return false;
      }
      if (columnFilters.client) {
        const clientVal = (row.client || '').toLowerCase();
        if (!clientVal.includes(columnFilters.client.trim().toLowerCase())) return false;
      }
      if (columnFilters.designation) {
        const desigVal = (row.designation || '').toLowerCase();
        if (!desigVal.includes(columnFilters.designation.trim().toLowerCase())) return false;
      }
      if (columnFilters.skill_designation) {
        const skillVal = (row.skill_designation || '').toLowerCase();
        if (!skillVal.includes(columnFilters.skill_designation.trim().toLowerCase())) return false;
      }
      if (columnFilters.skill_designation_oid) {
        const sodOid = row.skill_designation_oid ? String(row.skill_designation_oid) : '';
        if (!sodOid.includes(columnFilters.skill_designation_oid.trim())) return false;
      }
      return true;
    });
  }, [records, columnFilters]);

  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRecords, sortField, sortDirection]);

  // Paginated records
  const totalCount = sortedRecords.length;
  const isAll = pageSize === 'all' || pageSize >= 99999;
  const totalPages = isAll ? 1 : Math.ceil(totalCount / (pageSize || 20)) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    if (isAll) return sortedRecords;
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, safeCurrentPage, pageSize, isAll]);

  const activeFiltersCount = Object.values(columnFilters).filter(Boolean).length;

  return (
    <div className="min-h-full bg-[#f4f7f9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
          toast.type === 'error' 
            ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-800' 
            : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
        } animate-in fade-in slide-in-from-bottom-2 duration-200`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* TOP BLUE HEADER BANNER (Matching BIO-QRDA Emp Search palette) */}
      <div className="bg-[#0066a2] text-white py-2.5 px-4 shadow-sm select-none">
        <h1 className="text-center text-white text-base md:text-lg font-bold tracking-wide">
          Designation
        </h1>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        
        {/* TOP CARD: "Designation Name *" and "Add Designation" button */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-5 shadow-xs">
          <form 
            onSubmit={handleAddDesignation}
            className="flex flex-col gap-4"
          >
            {/* ROW 1: Designation Name, Client, and Skill / Designation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-center w-full">
              {/* Designation Name - loaded from company master designations */}
              <div className="flex items-center justify-center md:justify-end space-x-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Designation Name <span className="text-rose-500">*</span>
                </label>
                {companyMasterDesignations.length > 0 && !isCustomInput ? (
                  <div className="flex items-center space-x-1.5">
                    <select
                      value={newDesignationName}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setIsCustomInput(true);
                          setNewDesignationName('');
                        } else {
                          setNewDesignationName(val);
                          const match = companyMasterDesignations.find(d => d.designation === val);
                          if (match && match.skill_designation_oid) {
                            setSelectedSkillId(String(match.skill_designation_oid));
                          }
                        }
                      }}
                      className="w-40 sm:w-56 h-9 px-2 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-[#0066a2]/30 focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                    >
                      <option value="">-- Select Master Designation ({companyMasterDesignations.length}) --</option>
                      {companyMasterDesignations.map(d => (
                        <option key={d.oid || d.id} value={d.designation}>
                          {d.designation} {d.skill_designation ? `(${d.skill_designation})` : ''}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter Custom Designation...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={newDesignationName}
                      onChange={(e) => setNewDesignationName(e.target.value)}
                      placeholder={loadingMasterDesignations ? "Loading master..." : "Enter designation name"}
                      className="w-40 sm:w-52 h-9 px-3 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-[#0066a2]/30 focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100 transition-all"
                    />
                    {companyMasterDesignations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomInput(false);
                          setNewDesignationName('');
                        }}
                        className="text-[11px] text-[#0066a2] hover:underline font-semibold cursor-pointer whitespace-nowrap"
                        title="Switch back to Master Designation dropdown"
                      >
                        Master
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Client selection for new designation - centered directly above button */}
              <div className="flex items-center justify-center space-x-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Client:
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="h-9 px-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-700 dark:text-slate-200 min-w-[130px] max-w-[200px]"
                >
                  {metaOptions.clients.map(c => (
                    <option key={c.oid} value={c.oid}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Skill / Designation searchable dropdown */}
              <div className="flex items-center justify-center md:justify-start space-x-2 relative" ref={skillDropdownRef}>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Skill / Designation:
                </label>
                <div className="relative min-w-[130px] max-w-[200px]">
                  <button
                    type="button"
                    onClick={() => setShowSkillDropdown(prev => !prev)}
                    className="w-full h-9 px-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-700 dark:text-slate-200 flex items-center justify-between text-left cursor-pointer transition-all"
                  >
                    <span className="truncate pr-1">
                      {selectedSkill ? selectedSkill.name : '-- None --'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${showSkillDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showSkillDropdown && (
                    <div className="absolute left-0 top-10 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                      {/* Search box inside dropdown */}
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={skillSearchTerm}
                          onChange={(e) => setSkillSearchTerm(e.target.value)}
                          placeholder="Search skill/designation..."
                          className="w-full h-8 pl-8 pr-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded focus:border-[#0066a2] focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                          autoFocus
                        />
                        {skillSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setSkillSearchTerm('')}
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Options list */}
                      <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs">
                        {/* None option */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSkillId('');
                            setShowSkillDropdown(false);
                            setSkillSearchTerm('');
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors cursor-pointer ${
                            !selectedSkillId
                              ? 'bg-[#0066a2]/15 text-[#0066a2] font-semibold dark:bg-[#0066a2]/25'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="italic">-- None --</span>
                          {!selectedSkillId && <Check className="w-3.5 h-3.5 text-[#0066a2] shrink-0" />}
                        </button>

                        {filteredSkills.length === 0 ? (
                          <div className="py-3 text-center text-xs text-slate-400">
                            No skill/designation found
                          </div>
                        ) : (
                          filteredSkills.map(s => {
                            const isSelected = String(s.oid) === String(selectedSkillId);
                            return (
                              <button
                                key={s.oid}
                                type="button"
                                onClick={() => {
                                  setSelectedSkillId(String(s.oid));
                                  setShowSkillDropdown(false);
                                  setSkillSearchTerm('');
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#0066a2]/15 text-[#0066a2] font-semibold dark:bg-[#0066a2]/25'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="truncate pr-2">{s.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#0066a2] shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: Add Designation aligned directly in the same vertical line below Client */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-center w-full pt-3 border-t border-slate-150 dark:border-slate-800/80">
              {/* Left Placeholder for symmetric balance */}
              <div className="hidden md:block"></div>

              {/* Center: Add Designation Button - IN SAME VERTICAL COLUMN AS CLIENT ABOVE */}
              <div className="flex items-center justify-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 bg-[#0066a2] hover:bg-[#005588] active:bg-[#00446c] text-white text-xs sm:text-sm font-semibold rounded flex items-center space-x-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{submitting ? 'Adding...' : 'Add Designation'}</span>
                </button>
              </div>

              {/* Right: Filter Button with Clients List */}
              <div className="flex items-center justify-end relative" ref={filterDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowClientFilterDropdown(prev => !prev)}
                  className={`h-9 px-3.5 text-xs font-semibold rounded flex items-center space-x-2 border transition-all cursor-pointer ${
                    columnFilters.client
                      ? 'bg-[#0066a2] hover:bg-[#005588] text-white border-[#0066a2] shadow-xs'
                      : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Filter by Client"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="max-w-[130px] truncate">
                    {columnFilters.client ? columnFilters.client : 'Filter'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showClientFilterDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown with Clients List */}
                {showClientFilterDropdown && (
                  <div className="absolute right-0 top-11 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 p-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-150 dark:border-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Filter className="w-3.5 h-3.5 text-[#0066a2]" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Filter by Client
                        </span>
                      </div>
                      {columnFilters.client && (
                        <button
                          type="button"
                          onClick={() => {
                            handleFilterChange('client', '');
                            setShowClientFilterDropdown(false);
                          }}
                          className="text-[11px] text-[#0066a2] hover:underline font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Client search box */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        placeholder="Search clients..."
                        className="w-full h-8 pl-8 pr-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded focus:border-[#0066a2] focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                        autoFocus
                      />
                    </div>

                    {/* Clients List */}
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5 text-xs">
                      {/* Show All Clients Option */}
                      <button
                        type="button"
                        onClick={() => {
                          handleFilterChange('client', '');
                          setShowClientFilterDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors cursor-pointer ${
                          !columnFilters.client
                            ? 'bg-[#0066a2]/10 text-[#0066a2] font-semibold dark:bg-[#0066a2]/20'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>All Clients</span>
                        {!columnFilters.client && <Check className="w-3.5 h-3.5 text-[#0066a2]" />}
                      </button>

                      {filteredClientsList.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No clients found
                        </div>
                      ) : (
                        filteredClientsList.map((clientName) => {
                          const isSelected = columnFilters.client.toLowerCase() === clientName.toLowerCase();
                          const count = clientCounts[clientName] || 0;
                          return (
                            <button
                              key={clientName}
                              type="button"
                              onClick={() => {
                                handleFilterChange('client', isSelected ? '' : clientName);
                                setShowClientFilterDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0066a2]/15 text-[#0066a2] font-semibold dark:bg-[#0066a2]/25'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="truncate pr-2">{clientName}</span>
                              <div className="flex items-center space-x-1.5 shrink-0">
                                {count > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                    {count}
                                  </span>
                                )}
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#0066a2]" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* SECTION CARD: Designation Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
          
          {/* Section Header bar with title, pagination options, and filter controls */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center space-x-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                Designation Details
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {totalCount} Total
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              {/* Reset filters button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Clear all column filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Filters ({activeFiltersCount})</span>
                </button>
              )}

              {/* Page size dropdown */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 dark:text-slate-400">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 99999 : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </select>
              </div>

              {/* Reload / Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Refresh Table & Clear Filters"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Header row 1: Column Names with Sort Arrows */}
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  
                  {/* Oid */}
                  <th 
                    onClick={() => handleSort('oid')}
                    className="p-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-24"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Oid</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'oid' ? 'text-[#0066a2]' : 'text-slate-400'}`} />
                    </div>
                  </th>

                  {/* Client */}
                  <th 
                    onClick={() => handleSort('client')}
                    className="p-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[180px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Client</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'client' ? 'text-[#0066a2]' : 'text-slate-400'}`} />
                    </div>
                  </th>

                  {/* Designation */}
                  <th 
                    onClick={() => handleSort('designation')}
                    className="p-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[150px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Designation</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'designation' ? 'text-[#0066a2]' : 'text-slate-400'}`} />
                    </div>
                  </th>

                  {/* Skill / Designation */}
                  <th 
                    onClick={() => handleSort('skill_designation')}
                    className="p-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[160px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Skill / Designation</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'skill_designation' ? 'text-[#0066a2]' : 'text-slate-400'}`} />
                    </div>
                  </th>

                  {/* Skill / Designation Oid */}
                  <th 
                    onClick={() => handleSort('skill_designation_oid')}
                    className="p-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-40"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Skill / Designation Oid</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'skill_designation_oid' ? 'text-[#0066a2]' : 'text-slate-400'}`} />
                    </div>
                  </th>

                  {/* Action */}
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-200 text-center w-28">
                    Action
                  </th>
                </tr>

                {/* Header row 2: Filter inputs directly below column headers (Exact reference photo style) */}
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
                  {/* Oid filter */}
                  <th className="p-2">
                    <input
                      type="text"
                      value={columnFilters.oid}
                      onChange={(e) => handleFilterChange('oid', e.target.value)}
                      placeholder=""
                      className="w-full h-7 px-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                    />
                  </th>

                  {/* Client filter */}
                  <th className="p-2">
                    <input
                      type="text"
                      value={columnFilters.client}
                      onChange={(e) => handleFilterChange('client', e.target.value)}
                      placeholder=""
                      className="w-full h-7 px-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                    />
                  </th>

                  {/* Designation filter */}
                  <th className="p-2">
                    <input
                      type="text"
                      value={columnFilters.designation}
                      onChange={(e) => handleFilterChange('designation', e.target.value)}
                      placeholder=""
                      className="w-full h-7 px-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                    />
                  </th>

                  {/* Skill / Designation filter */}
                  <th className="p-2">
                    <input
                      type="text"
                      value={columnFilters.skill_designation}
                      onChange={(e) => handleFilterChange('skill_designation', e.target.value)}
                      placeholder=""
                      className="w-full h-7 px-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                    />
                  </th>

                  {/* Skill / Designation Oid filter */}
                  <th className="p-2">
                    <input
                      type="text"
                      value={columnFilters.skill_designation_oid}
                      onChange={(e) => handleFilterChange('skill_designation_oid', e.target.value)}
                      placeholder=""
                      className="w-full h-7 px-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                    />
                  </th>

                  {/* Empty cell for Action column filter */}
                  <th className="p-2"></th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RotateCcw className="w-5 h-5 animate-spin text-[#0066a2]" />
                        <span>Loading designations data...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No designations match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((row) => (
                    <tr 
                      key={row.oid}
                      className="hover:bg-sky-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Oid */}
                      <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                        {row.oid}
                      </td>

                      {/* Client */}
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                        {row.client || '-'}
                      </td>

                      {/* Designation */}
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                        {row.designation || '-'}
                      </td>

                      {/* Skill / Designation */}
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {row.skill_designation || '-'}
                      </td>

                      {/* Skill / Designation Oid */}
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                        {row.skill_designation_oid !== null && row.skill_designation_oid !== undefined
                          ? row.skill_designation_oid 
                          : '-'}
                      </td>

                      {/* Action: Remove link (disabled - non-clickable) */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          disabled
                          className="text-slate-400 dark:text-slate-500 font-medium cursor-not-allowed text-xs select-none opacity-60"
                          title="Removal is disabled"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER / PAGINATION (Upside or Downside pagination controls) */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              {totalCount > 0 ? (
                <span>
                  Showing {isAll ? 1 : ((safeCurrentPage - 1) * pageSize) + 1} to{' '}
                  {isAll ? totalCount : Math.min(safeCurrentPage * pageSize, totalCount)} of {totalCount} designations
                </span>
              ) : (
                <span>0 designations</span>
              )}
            </div>

            {/* Pagination buttons */}
            {!isAll && totalPages > 1 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CONFIRM DELETE MODAL */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Remove Designation</span>
              </div>
              <button 
                onClick={() => setDeletingRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove designation{' '}
              <strong className="text-slate-800 dark:text-slate-100 font-bold">
                "{deletingRecord.designation}"
              </strong>{' '}
              (OID: {deletingRecord.oid}) for client{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {deletingRecord.client}
              </span>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
