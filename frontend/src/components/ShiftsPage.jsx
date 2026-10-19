import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight,
  RotateCcw
} from 'lucide-react';
import { dataManagerApi } from '../services/apiService';
import SearchableColumnFilter from './SearchableColumnFilter';

export default function ShiftsPage({ currentView, setCurrentView }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState('oid');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Column filter inputs (matching reference photo)
  const [columnFilters, setColumnFilters] = useState({
    oid: '',
    client: '',
    branch: '',
    site_name: '',
    active: '',
    shift_name: '',
    duration: ''
  });

  // Fetch shifts from backend (without changing any data)
  const fetchShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataManagerApi.getShifts({
        limit: 2000,
        offset: 0
      });
      if (data && data.items) {
        setShifts(data.items);
      } else {
        setShifts([]);
      }
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError('Failed to load shift records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // Cascaded dropdown options for searchable filters
  const uniqueOids = useMemo(() => {
    const set = new Set();
    shifts.forEach(s => {
      const v = s.oid ?? s.id;
      if (v !== undefined && v !== null && String(v).trim()) {
        set.add(String(v).trim());
      }
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [shifts]);

  const uniqueClients = useMemo(() => {
    const set = new Set();
    shifts.forEach(s => {
      if (s.client) set.add(String(s.client).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [shifts]);

  const uniqueBranches = useMemo(() => {
    const set = new Set();
    const clientFilter = (columnFilters.client || '').trim().toLowerCase();
    shifts.forEach(s => {
      const matchClient = !clientFilter || (s.client || '').trim().toLowerCase() === clientFilter;
      if (matchClient && s.branch) set.add(String(s.branch).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [shifts, columnFilters.client]);

  const uniqueSites = useMemo(() => {
    const set = new Set();
    const clientFilter = (columnFilters.client || '').trim().toLowerCase();
    const branchFilter = (columnFilters.branch || '').trim().toLowerCase();
    shifts.forEach(s => {
      const matchClient = !clientFilter || (s.client || '').trim().toLowerCase() === clientFilter;
      const matchBranch = !branchFilter || (s.branch || '').trim().toLowerCase() === branchFilter;
      if (matchClient && matchBranch && s.site_name) set.add(String(s.site_name).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [shifts, columnFilters.client, columnFilters.branch]);

  const uniqueShifts = useMemo(() => {
    const set = new Set();
    shifts.forEach(s => {
      if (s.shift_name) set.add(String(s.shift_name).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [shifts]);

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

  // Handle filter changes with cascading
  const handleFilterChange = (field, value) => {
    setColumnFilters(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'client') {
        updated.branch = '';
        updated.site_name = '';
      } else if (field === 'branch') {
        updated.site_name = '';
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
      branch: '',
      site_name: '',
      active: '',
      shift_name: '',
      duration: ''
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    columnFilters.oid ||
    columnFilters.client ||
    columnFilters.branch ||
    columnFilters.site_name ||
    columnFilters.active ||
    columnFilters.shift_name ||
    columnFilters.duration
  );

  // Filtered and sorted records
  const filteredAndSortedShifts = useMemo(() => {
    let result = [...shifts];

    // Apply column filters
    if (columnFilters.oid.trim()) {
      const q = columnFilters.oid.toLowerCase().trim();
      result = result.filter(item => String(item.oid ?? item.id ?? '').toLowerCase().includes(q));
    }
    if (columnFilters.client.trim()) {
      const q = columnFilters.client.toLowerCase().trim();
      result = result.filter(item => (item.client || '').toLowerCase().includes(q));
    }
    if (columnFilters.branch.trim()) {
      const q = columnFilters.branch.toLowerCase().trim();
      result = result.filter(item => (item.branch || '').toLowerCase().includes(q));
    }
    if (columnFilters.site_name.trim()) {
      const q = columnFilters.site_name.toLowerCase().trim();
      result = result.filter(item => (item.site_name || '').toLowerCase().includes(q));
    }
    if (columnFilters.active.trim()) {
      const q = columnFilters.active.toLowerCase().trim();
      result = result.filter(item => String(item.active ?? 'true').toLowerCase().includes(q));
    }
    if (columnFilters.shift_name.trim()) {
      const q = columnFilters.shift_name.toLowerCase().trim();
      result = result.filter(item => (item.shift_name || '').toLowerCase().includes(q));
    }
    if (columnFilters.duration.trim()) {
      const q = columnFilters.duration.toLowerCase().trim();
      result = result.filter(item => (item.duration || '').toLowerCase().includes(q));
    }

    // Apply sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle null / undefined
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Number comparison for OID / numeric values
      if (sortField === 'oid' || sortField === 'id') {
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [shifts, columnFilters, sortField, sortDirection]);

  // Pagination metrics
  const totalRecords = filteredAndSortedShifts.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const currentRecords = filteredAndSortedShifts.slice(startIndex, endIndex);

  // Generate visible page numbers for pagination (up to 10 page buttons like reference)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 10;
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

  // Reusable Pagination Bar (matches reference photo)
  const renderPaginationBar = () => (
    <div className="bg-[#f8fafc] dark:bg-slate-800/80 px-4 py-2 border-y border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 select-none">
      {/* Records Count info: e.g. "1-10 of 894 records" */}
      <div className="text-slate-700 dark:text-slate-300 font-medium">
        {totalRecords > 0 ? (
          <span>
            {startIndex + 1}-{endIndex} of {totalRecords} records
          </span>
        ) : (
          <span>0 of 0 records</span>
        )}
      </div>

      {/* Center Pagination Controls: << < 1 2 3 ... 10 > >> */}
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

      {/* Right Page Size Select: [10 v] */}
      <div className="flex items-center space-x-1.5">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-[1920px] mx-auto font-sans">
      
      {/* Shifts Card Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm">
        
        {/* BLUE HEADER BAR - Matching BIO-QRDA Emp Search palette */}
        <div className="bg-[#0066a2] text-white py-2.5 px-4 text-center rounded-t-lg shadow-sm">
          <h2 className="text-base sm:text-lg font-bold tracking-wide select-none">
            Shifts
          </h2>
        </div>

        {/* PAGE FILTERS UPSIDE - Directly Below Header */}
        {renderPaginationBar()}

        {/* TABLE CONTAINER */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* ROW 1: COLUMN HEADERS WITH SORT ICONS */}
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 select-none">
                <th
                  onClick={() => handleSort('oid')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Oid</span>
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
                  onClick={() => handleSort('branch')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Branch</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('site_name')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Site Name</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('active')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Active</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('shift_name')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Shift Name</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('shift_start_time')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Shift Start Time</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('shift_end_time')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Shift End Time</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('duration')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Duration</span>
                    <span className="text-slate-400 text-[11px]">⇅</span>
                  </div>
                </th>
              </tr>

              {/* ROW 2: COLUMN FILTER INPUTS (SYNCED WITH COLUMN FILTERS) */}
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {/* Oid Filter */}
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
                    className="w-full min-w-[130px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Branch Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.branch}
                    onChange={(e) => handleFilterChange('branch', e.target.value)}
                    placeholder=""
                    className="w-full min-w-[100px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Site Name Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.site_name}
                    onChange={(e) => handleFilterChange('site_name', e.target.value)}
                    placeholder=""
                    className="w-full min-w-[130px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Active Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.active}
                    onChange={(e) => handleFilterChange('active', e.target.value)}
                    placeholder=""
                    className="w-20 max-w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Shift Name Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.shift_name}
                    onChange={(e) => handleFilterChange('shift_name', e.target.value)}
                    placeholder=""
                    className="w-full min-w-[90px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>

                {/* Shift Start Time (Empty in reference) */}
                <td className="p-1.5 px-3"></td>

                {/* Shift End Time (Empty in reference) */}
                <td className="p-1.5 px-3"></td>

                {/* Duration Filter */}
                <td className="p-1.5 px-3">
                  <input
                    type="text"
                    value={columnFilters.duration}
                    onChange={(e) => handleFilterChange('duration', e.target.value)}
                    placeholder=""
                    className="w-24 max-w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium text-xs">Loading shift records...</span>
                    </div>
                  </td>
                </tr>
              ) : currentRecords.length > 0 ? (
                currentRecords.map((row, idx) => (
                  <tr
                    key={row.oid ?? row.id ?? idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Oid */}
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      {row.oid ?? row.id ?? '-'}
                    </td>

                    {/* Client */}
                    <td className="py-2 px-3 font-normal text-slate-800 dark:text-slate-200">
                      {row.client || '-'}
                    </td>

                    {/* Branch */}
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {row.branch || '-'}
                    </td>

                    {/* Site Name */}
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {row.site_name || '-'}
                    </td>

                    {/* Active */}
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      {String(row.active ?? 'true')}
                    </td>

                    {/* Shift Name */}
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                      {row.shift_name || '-'}
                    </td>

                    {/* Shift Start Time */}
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {row.shift_start_time || '-'}
                    </td>

                    {/* Shift End Time */}
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {row.shift_end_time || '-'}
                    </td>

                    {/* Duration */}
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {row.duration || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No matching shift records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SEARCHABLE COLUMN FILTERS (BELOW THE TABLE - Matching User Request) */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-2.5 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5 rounded-b-lg">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
            {/* OID Filter Dropdown */}
            <div className="w-[115px] sm:w-[130px]">
              <SearchableColumnFilter
                field="oid"
                label="OID"
                value={columnFilters.oid || ''}
                onChange={(val) => handleFilterChange('oid', val)}
                options={uniqueOids}
                placeholder="Select OID..."
                roundedClass="rounded-full px-3 py-1.5"
                dropdownClassName="min-w-[180px] max-w-[260px]"
                direction="up"
              />
            </div>

            {/* Client Filter Dropdown */}
            <div className="w-[145px] sm:w-[165px]">
              <SearchableColumnFilter
                field="client"
                label="Client"
                value={columnFilters.client || ''}
                onChange={(val) => handleFilterChange('client', val)}
                options={uniqueClients}
                placeholder="Select Client..."
                roundedClass="rounded-full px-3 py-1.5"
                dropdownClassName="min-w-[240px] max-w-[340px]"
                direction="up"
              />
            </div>

            {/* Branch Filter Dropdown */}
            <div className="w-[130px] sm:w-[145px]">
              <SearchableColumnFilter
                field="branch"
                label="Branch"
                value={columnFilters.branch || ''}
                onChange={(val) => handleFilterChange('branch', val)}
                options={uniqueBranches}
                placeholder="Select Branch..."
                roundedClass="rounded-full px-3 py-1.5"
                dropdownClassName="min-w-[200px] max-w-[280px]"
                direction="up"
              />
            </div>

            {/* Site Filter Dropdown */}
            <div className="w-[140px] sm:w-[160px]">
              <SearchableColumnFilter
                field="site_name"
                label="Site"
                value={columnFilters.site_name || ''}
                onChange={(val) => handleFilterChange('site_name', val)}
                options={uniqueSites}
                placeholder="Select Site..."
                roundedClass="rounded-full px-3 py-1.5"
                dropdownClassName="min-w-[240px] max-w-[340px]"
                direction="up"
              />
            </div>

            {/* Shift Filter Dropdown */}
            <div className="w-[125px] sm:w-[140px]">
              <SearchableColumnFilter
                field="shift_name"
                label="Shift"
                value={columnFilters.shift_name || ''}
                onChange={(val) => handleFilterChange('shift_name', val)}
                options={uniqueShifts}
                placeholder="Select Shift..."
                roundedClass="rounded-full px-3 py-1.5"
                dropdownClassName="min-w-[180px] max-w-[250px]"
                direction="up"
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

      </div>

    </div>
  );
}
