import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowUpDown, 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight,
  RotateCcw,
  PlusCircle,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  ChevronDown,
  Check
} from 'lucide-react';
import { dataManagerApi } from '../services/apiService';
import SearchableColumnFilter from './SearchableColumnFilter';

export default function SiteDesignationsPage({ currentView, setCurrentView }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // New Company Designation Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [newDesignationName, setNewDesignationName] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [metaOptions, setMetaOptions] = useState({ clients: [], skills: [] });
  const [submitting, setSubmitting] = useState(false);

  // Company searchable dropdown state
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const companyDropdownRef = useRef(null);

  // Skill searchable dropdown state
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const skillDropdownRef = useRef(null);

  // Pagination state (default 50 records per page as shown in reference image)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Sorting state
  const [sortField, setSortField] = useState('oid');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Column filter inputs
  const [columnFilters, setColumnFilters] = useState({
    oid: '',
    client: '',
    site_oid: '',
    site: '',
    designation_oid: '',
    designation: '',
    master_oid: '',
    master_designation: ''
  });

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch site designations from backend
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataManagerApi.getSiteDesignations({
        limit: 2000,
        offset: 0
      });
      if (data && data.items) {
        setRecords(data.items);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching site designations:', err);
      setError('Failed to load site designations');
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
          setSelectedCompanyId(String(meta.clients[0].oid));
        }
      }
    } catch (e) {
      console.warn('Failed to load designations meta', e);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchMeta();
  }, []);

  // Close company dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target)) {
        setShowCompanyDropdown(false);
      }
    }
    if (showCompanyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCompanyDropdown]);

  // Selected company object
  const selectedCompany = useMemo(() => {
    return metaOptions.clients.find(c => String(c.oid) === String(selectedCompanyId)) || null;
  }, [metaOptions.clients, selectedCompanyId]);

  // Filtered companies based on search input
  const filteredCompanies = useMemo(() => {
    if (!companySearchTerm.trim()) return metaOptions.clients;
    const term = companySearchTerm.toLowerCase().trim();
    return metaOptions.clients.filter(c => (c.name || '').toLowerCase().includes(term));
  }, [metaOptions.clients, companySearchTerm]);

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

  // Handle Add/Save Company Designation
  const handleAddCompanyDesignation = async (e) => {
    if (e) e.preventDefault();
    const trimmed = (newDesignationName || '').trim();
    if (!trimmed) {
      showToastMsg('Please enter a Designation Name', 'error');
      return;
    }
    if (!selectedCompanyId) {
      showToastMsg('Please select a Company Name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmed,
        client_id: parseInt(selectedCompanyId, 10),
        skill_designation_oid: selectedSkillId ? parseInt(selectedSkillId, 10) : undefined
      };
      const res = await dataManagerApi.createCompanyDesignation(payload);
      if (res && res.status === 'created') {
        showToastMsg(res.message || `Company Designation "${trimmed}" created successfully (OID: ${res.oid})!`);
        setNewDesignationName('');
        await fetchRecords();
      } else if (res && res.status === 'exists') {
        showToastMsg(res.message || `Designation "${trimmed}" already exists for this Company (OID: ${res.oid})`, 'error');
        await fetchRecords();
      } else {
        showToastMsg(res?.message || res?.detail || 'Failed to create company designation', 'error');
      }
    } catch (err) {
      console.error('Error creating company designation:', err);
      showToastMsg(err.message || 'Failed to create company designation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Unique options for searchable filters
  const uniqueClients = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (r.client) set.add(String(r.client).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const uniqueSites = useMemo(() => {
    const set = new Set();
    const clientFilter = (columnFilters.client || '').trim().toLowerCase();
    records.forEach(r => {
      const matchClient = !clientFilter || (r.client || '').trim().toLowerCase() === clientFilter;
      if (matchClient && r.site) set.add(String(r.site).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records, columnFilters.client]);

  const uniqueDesignations = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (r.designation) set.add(String(r.designation).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const uniqueMasterDesignations = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (r.master_designation) set.add(String(r.master_designation).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);

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
  const handleFilterChange = (field, value) => {
    setColumnFilters(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'client') {
        updated.site = '';
      }
      return updated;
    });
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setColumnFilters({
      oid: '',
      client: '',
      site_oid: '',
      site: '',
      designation_oid: '',
      designation: '',
      master_oid: '',
      master_designation: ''
    });
    setCurrentPage(1);
  };

  // Refresh records and reset filters
  const handleRefresh = async () => {
    handleResetFilters();
    await fetchRecords();
  };

  const hasActiveFilters = Boolean(
    columnFilters.oid ||
    columnFilters.client ||
    columnFilters.site_oid ||
    columnFilters.site ||
    columnFilters.designation_oid ||
    columnFilters.designation ||
    columnFilters.master_oid ||
    columnFilters.master_designation
  );

  // Filtered and sorted records
  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    if (columnFilters.oid.trim()) {
      const q = columnFilters.oid.toLowerCase().trim();
      result = result.filter(item => String(item.oid ?? item.id ?? '').toLowerCase().includes(q));
    }
    if (columnFilters.client.trim()) {
      const q = columnFilters.client.toLowerCase().trim();
      result = result.filter(item => (item.client || '').toLowerCase().includes(q));
    }
    if (columnFilters.site_oid.trim()) {
      const q = columnFilters.site_oid.toLowerCase().trim();
      result = result.filter(item => String(item.site_oid ?? '').toLowerCase().includes(q));
    }
    if (columnFilters.site.trim()) {
      const q = columnFilters.site.toLowerCase().trim();
      result = result.filter(item => (item.site || '').toLowerCase().includes(q));
    }
    if (columnFilters.designation_oid.trim()) {
      const q = columnFilters.designation_oid.toLowerCase().trim();
      result = result.filter(item => String(item.designation_oid ?? '').toLowerCase().includes(q));
    }
    if (columnFilters.designation.trim()) {
      const q = columnFilters.designation.toLowerCase().trim();
      result = result.filter(item => (item.designation || '').toLowerCase().includes(q));
    }
    if (columnFilters.master_oid.trim()) {
      const q = columnFilters.master_oid.toLowerCase().trim();
      result = result.filter(item => String(item.master_oid ?? '').toLowerCase().includes(q));
    }
    if (columnFilters.master_designation.trim()) {
      const q = columnFilters.master_designation.toLowerCase().trim();
      result = result.filter(item => (item.master_designation || '').toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (sortField === 'oid' || sortField === 'site_oid' || sortField === 'designation_oid' || sortField === 'master_oid') {
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, columnFilters, sortField, sortDirection]);

  // Pagination metrics
  const totalRecords = filteredAndSortedRecords.length;
  const effectivePageSize = pageSize === 'all' ? (totalRecords || 10000) : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalRecords / effectivePageSize));
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalRecords);
  const currentRecords = filteredAndSortedRecords.slice(startIndex, endIndex);

  // Visible page numbers (up to 5 or 10 page buttons)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Reusable Pagination Bar (matches reference image: "1-50 of 232 records << < 1 2 3 4 5 > >> [50 v]")
  const renderPaginationBar = (extraClass = '') => (
    <div className={`bg-[#f8fafc] dark:bg-slate-800/80 px-4 py-2 border-y border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 select-none ${extraClass}`}>
      {/* Records Count info */}
      <div className="text-slate-700 dark:text-slate-300 font-medium">
        {totalRecords > 0 ? (
          <span>
            {startIndex + 1}-{endIndex} of {totalRecords} records
          </span>
        ) : (
          <span>0 of 0 records</span>
        )}
      </div>

      {/* Center Pagination Controls */}
      <div className="flex items-center space-x-1.5 font-medium">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="First Page"
        >
          &lt;&lt;
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Previous Page"
        >
          &lt;
        </button>

        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            className={`min-w-[22px] px-1 py-0.5 text-center rounded transition-colors cursor-pointer ${
              currentPage === pageNum
                ? 'font-bold text-[#0066a2] dark:text-sky-400 underline underline-offset-2'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Next Page"
        >
          &gt;
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Last Page"
        >
          &gt;&gt;
        </button>
      </div>

      {/* Right Controls: Refresh & Page Size Select */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Refresh Table & Clear Filters"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <select
          value={pageSize}
          onChange={(e) => {
            const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
            setPageSize(val);
            setCurrentPage(1);
          }}
          className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value="all">All</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-[1920px] mx-auto font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl border flex items-center space-x-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-top duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span className="font-medium">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP CARD: "Designation Name *", "Client:", "Skill / Designation:" aligned horizontally */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-5 shadow-xs">
        <form 
          onSubmit={handleAddCompanyDesignation}
          className="flex flex-col gap-4"
        >
          {/* ROW 1: Designation Name, Client, and Skill / Designation in ONE SINGLE LINE */}
          {/* ROW 1: Designation Name, Company Name, and Skill / Designation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-center w-full">
            {/* Designation Name */}
            <div className="flex items-center justify-center md:justify-end space-x-2">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Designation Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newDesignationName}
                onChange={(e) => setNewDesignationName(e.target.value)}
                placeholder=""
                className="w-36 sm:w-44 lg:w-52 h-9 px-3 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-[#0066a2]/30 focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100 transition-all"
                required
              />
            </div>

            {/* Company Name searchable dropdown for company designation - centered directly above button */}
            <div className="flex items-center justify-center space-x-2 relative" ref={companyDropdownRef}>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Company Name:
              </label>
              <div className="relative min-w-[130px] max-w-[200px]">
                <button
                  type="button"
                  onClick={() => setShowCompanyDropdown(prev => !prev)}
                  className="w-full h-9 px-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-700 dark:text-slate-200 flex items-center justify-between text-left cursor-pointer transition-all"
                >
                  <span className="truncate pr-1">
                    {selectedCompany ? selectedCompany.name : '-- Select Company --'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCompanyDropdown && (
                  <div className="absolute left-0 top-10 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                    {/* Search box inside dropdown */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={companySearchTerm}
                        onChange={(e) => setCompanySearchTerm(e.target.value)}
                        placeholder="Search company..."
                        className="w-full h-8 pl-8 pr-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded focus:border-[#0066a2] focus:ring-1 focus:ring-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                        autoFocus
                      />
                      {companySearchTerm && (
                        <button
                          type="button"
                          onClick={() => setCompanySearchTerm('')}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Options list */}
                    <div className="max-h-52 overflow-y-auto space-y-0.5 text-xs">
                      {filteredCompanies.length === 0 ? (
                        <div className="py-3 text-center text-xs text-slate-400">
                          No company found
                        </div>
                      ) : (
                        filteredCompanies.map(c => {
                          const isSelected = String(c.oid) === String(selectedCompanyId);
                          return (
                            <button
                              key={c.oid}
                              type="button"
                              onClick={() => {
                                setSelectedCompanyId(String(c.oid));
                                setShowCompanyDropdown(false);
                                setCompanySearchTerm('');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0066a2]/15 text-[#0066a2] font-semibold dark:bg-[#0066a2]/25'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="truncate pr-2">{c.name}</span>
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

          {/* ROW 2: Add Company Designation aligned directly below Client */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-center w-full pt-3 border-t border-slate-150 dark:border-slate-800/80">
            {/* Left Placeholder for symmetric balance */}
            <div className="hidden md:block"></div>

            {/* Center: Add Company Designation Button - in same vertical column as Client */}
            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="h-9 px-5 bg-[#0066a2] hover:bg-[#005588] active:bg-[#00446c] text-white text-xs sm:text-sm font-semibold rounded flex items-center space-x-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Adding...' : 'Add Company Designation'}</span>
              </button>
            </div>

            {/* Right Placeholder */}
            <div className="hidden md:block"></div>
          </div>
        </form>
      </div>

      {/* Site Designations Card Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm">
        
        {/* BLUE HEADER BAR - Matching BIO-QRDA Emp Search palette */}
        <div className="bg-[#0066a2] text-white py-2.5 px-4 text-center rounded-t-lg shadow-sm">
          <h2 className="text-base sm:text-lg font-bold tracking-wide select-none">
            Company Designation
          </h2>
        </div>

        {/* TOP SEARCHABLE COLUMN FILTERS (Search options at top side as shown in reference) */}
        <div className="bg-white dark:bg-slate-900 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
            {/* Client Filter Dropdown */}
            <div className="w-[155px] sm:w-[175px]">
              <SearchableColumnFilter
                field="client"
                label="Client"
                value={columnFilters.client || ''}
                onChange={(val) => handleFilterChange('client', val)}
                options={uniqueClients}
                placeholder="Select Client..."
                roundedClass="rounded-full px-3 py-1.5"
                dropdownClassName="min-w-[240px] max-w-[340px]"
                direction="down"
              />
            </div>

            {/* Site Filter Dropdown */}
            <div className="w-[150px] sm:w-[170px]">
              <SearchableColumnFilter
                field="site"
                label="Site"
                value={columnFilters.site || ''}
                onChange={(val) => handleFilterChange('site', val)}
                options={uniqueSites}
                placeholder="Select Site..."
                roundedClass="rounded-full px-3 py-1.5"
                dropdownClassName="min-w-[240px] max-w-[340px]"
                direction="down"
              />
            </div>

            {/* Designation Filter Dropdown */}
            <div className="w-[150px] sm:w-[170px]">
              <SearchableColumnFilter
                field="designation"
                label="Designation"
                value={columnFilters.designation || ''}
                onChange={(val) => handleFilterChange('designation', val)}
                options={uniqueDesignations}
                placeholder="Select Designation..."
                roundedClass="rounded-full px-3 py-1.5"
                dropdownClassName="min-w-[200px] max-w-[280px]"
                direction="down"
              />
            </div>

            {/* Master Designation Filter Dropdown */}
            <div className="w-[150px] sm:w-[170px]">
              <SearchableColumnFilter
                field="master_designation"
                label="Master Desig"
                value={columnFilters.master_designation || ''}
                onChange={(val) => handleFilterChange('master_designation', val)}
                options={uniqueMasterDesignations}
                placeholder="Select Master..."
                roundedClass="rounded-full px-3 py-1.5"
                dropdownClassName="min-w-[200px] max-w-[280px]"
                direction="down"
              />
            </div>

            {/* Clear / Reset Filter Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-600 transition-all shadow-2xs cursor-pointer ml-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#0066a2]" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* PAGE FILTERS UPSIDE - Directly Below Header */}
        {renderPaginationBar()}

        {/* TABLE CONTAINER */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* ROW 1: COLUMN HEADERS WITH SORT ICONS (EXACT COLUMNS REQUESTED) */}
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 select-none">
                <th
                  onClick={() => handleSort('oid')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>oid</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('client')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Client</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('site_oid')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Site oid</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('site')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Site</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('designation_oid')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Designation oid</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('designation')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Designation</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('master_oid')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Master oid</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('master_designation')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Master Designation</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>
              </tr>

              {/* ROW 2: COLUMN FILTER INPUTS (EXACTLY AS IN PHOTO) */}
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {/* oid Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.oid}
                    onChange={(e) => handleFilterChange('oid', e.target.value)}
                    placeholder=""
                    className="w-16 max-w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Client Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.client}
                    onChange={(e) => handleFilterChange('client', e.target.value)}
                    placeholder=""
                    className="w-full min-w-[160px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Site oid Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.site_oid}
                    onChange={(e) => handleFilterChange('site_oid', e.target.value)}
                    placeholder=""
                    className="w-20 max-w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Site Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.site}
                    onChange={(e) => handleFilterChange('site', e.target.value)}
                    placeholder=""
                    className="w-full min-w-[160px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Designation oid Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.designation_oid}
                    onChange={(e) => handleFilterChange('designation_oid', e.target.value)}
                    placeholder=""
                    className="w-20 max-w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Designation Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.designation}
                    onChange={(e) => handleFilterChange('designation', e.target.value)}
                    placeholder=""
                    className="w-full min-w-[120px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Master oid Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.master_oid}
                    onChange={(e) => handleFilterChange('master_oid', e.target.value)}
                    placeholder=""
                    className="w-20 max-w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Master Designation Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.master_designation}
                    onChange={(e) => handleFilterChange('master_designation', e.target.value)}
                    placeholder=""
                    className="w-full min-w-[130px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium text-xs">Loading company designations...</span>
                    </div>
                  </td>
                </tr>
              ) : currentRecords.length > 0 ? (
                currentRecords.map((row, idx) => (
                  <tr
                    key={row.oid ?? row.id ?? idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* oid */}
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                      {row.oid ?? row.id ?? '-'}
                    </td>

                    {/* Client */}
                    <td className="py-2.5 px-3 font-normal text-slate-800 dark:text-slate-200">
                      {row.client || '-'}
                    </td>

                    {/* Site oid */}
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                      {row.site_oid ?? '-'}
                    </td>

                    {/* Site */}
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">
                      {row.site || '-'}
                    </td>

                    {/* Designation oid */}
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                      {row.designation_oid ?? '-'}
                    </td>

                    {/* Designation */}
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold">
                      {row.designation || '-'}
                    </td>

                    {/* Master oid */}
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                      {row.master_oid ?? '-'}
                    </td>

                    {/* Master Designation */}
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center space-x-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-bold text-xs bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {row.master_designation || '-'}
                        </span>
                        {row.designation_full && row.designation_full !== row.master_designation && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                            ({row.designation_full})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No matching company designations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM PAGINATION BAR */}
        {renderPaginationBar('rounded-b-lg border-t border-b-0')}

      </div>

    </div>
  );
}
