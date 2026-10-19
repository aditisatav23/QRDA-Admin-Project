import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  RotateCcw, 
  ChevronRight, 
  ChevronDown, 
  ArrowUpDown, 
  ChevronsLeft, 
  ChevronsRight, 
  ChevronLeft, 
  MapPin, 
  Users, 
  Clock, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { dataManagerApi } from '../services/apiService';

// Sub-table for QR Code Gate Details / Biometric Blank Blocks (matching reference screenshot)
function QrGatesSubTable({ gates = [], isBiometric = false }) {
  const [gateSortField, setGateSortField] = useState('oid');
  const [gateSortOrder, setGateSortOrder] = useState('asc');

  const sortedGates = useMemo(() => {
    return [...gates].sort((a, b) => {
      let aVal = a[gateSortField];
      let bVal = b[gateSortField];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      if (aVal < bVal) return gateSortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return gateSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [gates, gateSortField, gateSortOrder]);

  const handleSort = (field) => {
    if (gateSortField === field) {
      setGateSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setGateSortField(field);
      setGateSortOrder('asc');
    }
  };

  if (!isBiometric && (!gates || gates.length === 0)) {
    return (
      <div className="py-3 px-4 sm:pl-28 md:pl-44 text-xs text-slate-400 italic">
        No QR gates configured for this site.
      </div>
    );
  }

  return (
    <div className="py-2.5 px-4 sm:pl-24 md:pl-40 bg-slate-50/70 dark:bg-slate-950/70 border-y border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto max-w-4xl">
        <table className="text-left border-collapse text-xs whitespace-nowrap">
          <thead>
            {/* Headers */}
            <tr className="text-slate-700 dark:text-slate-300 font-semibold select-none border-b border-slate-200 dark:border-slate-800">
              <th 
                onClick={() => handleSort('oid')}
                className="py-1.5 px-3 cursor-pointer hover:bg-slate-150/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center space-x-1">
                  <span>Oid</span>
                  <ArrowUpDown className={`w-3 h-3 ${gateSortField === 'oid' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                </div>
              </th>

              <th 
                onClick={() => handleSort('gate_name')}
                className="py-1.5 px-3 cursor-pointer hover:bg-slate-150/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center space-x-1">
                  <span>Gate name</span>
                  <ArrowUpDown className={`w-3 h-3 ${gateSortField === 'gate_name' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                </div>
              </th>

              <th className="py-1.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                <span>Latitude</span>
              </th>

              <th className="py-1.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                <span>Longitude</span>
              </th>

              <th 
                onClick={() => handleSort('radius')}
                className="py-1.5 px-3 cursor-pointer hover:bg-slate-150/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center space-x-1">
                  <span>Radius</span>
                  <ArrowUpDown className={`w-3 h-3 ${gateSortField === 'radius' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                </div>
              </th>

              <th 
                onClick={() => handleSort('calibrating')}
                className="py-1.5 px-3 cursor-pointer hover:bg-slate-150/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center space-x-1">
                  <span>Calibrating</span>
                  <ArrowUpDown className={`w-3 h-3 ${gateSortField === 'calibrating' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isBiometric ? (
              /* Blank blocks for Biometric channel */
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40">
                <td className="p-1">
                  <input
                    type="text"
                    placeholder=""
                    className="w-16 h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder=""
                    className="w-28 sm:w-36 h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                  />
                </td>
                <td className="p-1"></td>
                <td className="p-1"></td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder=""
                    className="w-20 h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    placeholder=""
                    className="w-20 h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                  />
                </td>
              </tr>
            ) : (
              sortedGates.map((gate) => (
              <tr key={gate.oid} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors text-slate-700 dark:text-slate-300">
                <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                  {gate.oid}
                </td>
                <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-100">
                  {gate.gate_name}
                </td>
                <td className="py-2 px-3 text-sky-600 dark:text-sky-400 font-mono">
                  {gate.latitude !== null && gate.latitude !== undefined ? (
                    <a
                      href={`https://www.google.com/maps?q=${gate.latitude},${gate.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {gate.latitude}
                    </a>
                  ) : '-'}
                </td>
                <td className="py-2 px-3 text-sky-600 dark:text-sky-400 font-mono">
                  {gate.longitude !== null && gate.longitude !== undefined ? (
                    <a
                      href={`https://www.google.com/maps?q=${gate.latitude},${gate.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {gate.longitude}
                    </a>
                  ) : '-'}
                </td>
                <td className="py-2 px-3 font-mono">
                  {gate.radius !== null && gate.radius !== undefined ? Number(gate.radius).toFixed(1) : '-'}
                </td>
                <td className="py-2 px-3 font-mono">
                  {gate.calibrating ? 'true' : 'false'}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClientSitesPage() {
  const [sites, setSites] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  // Sorting states
  const [sortField, setSortField] = useState('oid');
  const [sortOrder, setSortOrder] = useState('asc');

  // Column Filters
  const [filters, setFilters] = useState({
    oid: '',
    client: '',
    branch: '',
    site_name: '',
    short_name: '',
    channel: '',
    active: '',
    out_mark_compl: '',
    conf_patrol_points: '',
    payroll_policy: '',
  });

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleFilterChange = (field, value) => {
    setExpandedRows({});
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to page 1 on filter
  };

  const handleSort = (field) => {
    setExpandedRows({});
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const resetFilters = () => {
    setExpandedRows({});
    setFilters({
      oid: '',
      client: '',
      branch: '',
      site_name: '',
      short_name: '',
      channel: '',
      active: '',
      out_mark_compl: '',
      conf_patrol_points: '',
      payroll_policy: '',
    });
    setPage(1);
  };

  const goToPage = (newPage) => {
    setExpandedRows({});
    setPage(newPage);
  };

  const handlePageSizeChange = (val) => {
    setExpandedRows({});
    setPageSize(val);
    setPage(1);
  };

  const handleRefresh = () => {
    setExpandedRows({});
    fetchSites();
  };

  // Fetch client sites from backend
  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpandedRows({}); // Automatically close any open sub-tabs on reload/refresh
    try {
      const isAll = pageSize === 'all';
      const effectiveLimit = isAll ? 10000 : Number(pageSize);
      const offset = isAll ? 0 : (page - 1) * effectiveLimit;
      const params = {
        limit: effectiveLimit,
        offset,
        sort_field: sortField,
        sort_order: sortOrder,
        ...filters
      };
      const res = await dataManagerApi.getClientSites(params);
      setSites(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load client sites:', err);
      setError('Failed to fetch client sites from server.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortOrder, filters]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const isAll = pageSize === 'all';
  const effectiveLimit = isAll ? 10000 : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / effectiveLimit));
  const startRecord = total === 0 ? 0 : isAll ? 1 : (page - 1) * effectiveLimit + 1;
  const endRecord = isAll ? total : Math.min(page * effectiveLimit, total);

  // Generate numbered pagination buttons (sliding window of 10)
  const paginationPages = useMemo(() => {
    const maxButtons = 10;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-[1920px] mx-auto font-sans">
      
      {/* Main Container Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
        
        {/* Blue Header Bar (matching BIO-QRDA brand palette) */}
        <div className="bg-[#0066a2] text-white py-2.5 px-4 text-center rounded-t-lg shadow-sm">
          <h2 className="text-base sm:text-lg font-bold tracking-wide select-none">
            Client Sites
          </h2>
        </div>

        {/* Top Pagination & Status Bar */}
        <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Records Counter */}
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            {total > 0 ? (
              <span>
                {startRecord}-{endRecord} of <strong className="text-slate-800 dark:text-slate-100 font-semibold">{total}</strong> records
              </span>
            ) : (
              <span>0 records</span>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => goToPage(1)}
              disabled={page === 1 || loading}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center space-x-1">
              {paginationPages.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`min-w-[24px] h-6 px-1.5 text-xs rounded transition-colors cursor-pointer ${
                    p === page
                      ? 'font-bold text-[#0066a2] dark:text-sky-400 underline underline-offset-2'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => goToPage(totalPages)}
              disabled={page === totalPages || loading}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page Size Selector & Reset/Refresh Button */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1.5 text-slate-500 hover:text-[#0066a2] dark:hover:text-sky-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Table & Close Expanded Tabs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 dark:text-slate-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  handlePageSizeChange(val);
                }}
                className="h-7 px-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 outline-hidden focus:border-[#0066a2]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              {/* Main Column Headers */}
              <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold select-none">
                <th className="py-2.5 px-2 w-8 text-center border-r border-slate-200 dark:border-slate-800/80"></th>
                
                <th 
                  onClick={() => handleSort('oid')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Oid</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'oid' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('client')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Client</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'client' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('branch')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Branch</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'branch' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('site_name')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Site Name</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'site_name' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('short_name')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Short Name</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'short_name' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('emp_count')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors text-right"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Emp Cnt.</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'emp_count' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('shift_count')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors text-right"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Shift Cnt.</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'shift_count' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('channel')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Channel</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'channel' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80">
                  <span>IN Div</span>
                </th>

                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80">
                  <span>OUT Div</span>
                </th>

                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80">
                  <span>Start dt.</span>
                </th>

                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80">
                  <span>End dt.</span>
                </th>

                <th 
                  onClick={() => handleSort('active')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Active</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'active' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('out_mark_compl')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Out Mark compl</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'out_mark_compl' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('conf_patrol_points')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>conf Patrol points</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'conf_patrol_points' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('payroll_policy')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between space-x-1">
                    <span>Payroll Policy</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'payroll_policy' ? 'text-[#0066a2] dark:text-sky-400' : 'text-slate-400'}`} />
                  </div>
                </th>
              </tr>

              {/* Column Filter Row */}
              <tr className="bg-slate-100/70 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <td className="p-1 text-center border-r border-slate-200 dark:border-slate-800/80"></td>
                
                {/* Oid Filter */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <input
                    type="text"
                    value={filters.oid}
                    onChange={(e) => handleFilterChange('oid', e.target.value)}
                    placeholder=""
                    className="w-full h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100"
                  />
                </td>

                {/* Client Filter */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <input
                    type="text"
                    value={filters.client}
                    onChange={(e) => handleFilterChange('client', e.target.value)}
                    placeholder=""
                    className="w-full h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100 min-w-[120px]"
                  />
                </td>

                {/* Branch Filter */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <input
                    type="text"
                    value={filters.branch}
                    onChange={(e) => handleFilterChange('branch', e.target.value)}
                    placeholder=""
                    className="w-full h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100 min-w-[90px]"
                  />
                </td>

                {/* Site Name Filter */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <input
                    type="text"
                    value={filters.site_name}
                    onChange={(e) => handleFilterChange('site_name', e.target.value)}
                    placeholder=""
                    className="w-full h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100 min-w-[140px]"
                  />
                </td>

                {/* Short Name Filter */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <input
                    type="text"
                    value={filters.short_name}
                    onChange={(e) => handleFilterChange('short_name', e.target.value)}
                    placeholder=""
                    className="w-full h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100 min-w-[80px]"
                  />
                </td>

                {/* Emp Cnt. */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <div className="w-full h-6 bg-slate-50 dark:bg-slate-950/40 rounded border border-transparent"></div>
                </td>

                {/* Shift Cnt. */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <div className="w-full h-6 bg-slate-50 dark:bg-slate-950/40 rounded border border-transparent"></div>
                </td>

                {/* Channel Filter */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <input
                    type="text"
                    value={filters.channel}
                    onChange={(e) => handleFilterChange('channel', e.target.value)}
                    placeholder=""
                    className="w-full h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100 min-w-[80px]"
                  />
                </td>

                {/* IN Div */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <div className="w-full h-6 bg-slate-50 dark:bg-slate-950/40 rounded border border-transparent"></div>
                </td>

                {/* OUT Div */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <div className="w-full h-6 bg-slate-50 dark:bg-slate-950/40 rounded border border-transparent"></div>
                </td>

                {/* Start dt. */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <div className="w-full h-6 bg-slate-50 dark:bg-slate-950/40 rounded border border-transparent"></div>
                </td>

                {/* End dt. */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <div className="w-full h-6 bg-slate-50 dark:bg-slate-950/40 rounded border border-transparent"></div>
                </td>

                {/* Active Filter */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <select
                    value={filters.active}
                    onChange={(e) => handleFilterChange('active', e.target.value)}
                    className="w-full h-6 px-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-700 dark:text-slate-300"
                  >
                    <option value="">All</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </td>

                {/* Out Mark compl Filter */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <select
                    value={filters.out_mark_compl}
                    onChange={(e) => handleFilterChange('out_mark_compl', e.target.value)}
                    className="w-full h-6 px-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-700 dark:text-slate-300"
                  >
                    <option value="">All</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </td>

                {/* conf Patrol points Filter */}
                <td className="p-1 border-r border-slate-200 dark:border-slate-800/80">
                  <select
                    value={filters.conf_patrol_points}
                    onChange={(e) => handleFilterChange('conf_patrol_points', e.target.value)}
                    className="w-full h-6 px-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-700 dark:text-slate-300"
                  >
                    <option value="">All</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </td>

                {/* Payroll Policy Filter */}
                <td className="p-1">
                  <input
                    type="text"
                    value={filters.payroll_policy}
                    onChange={(e) => handleFilterChange('payroll_policy', e.target.value)}
                    placeholder=""
                    className="w-full h-6 px-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:border-[#0066a2] outline-hidden text-slate-800 dark:text-slate-100 min-w-[90px]"
                  />
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={17} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-[#0066a2] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading client sites records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-rose-500 font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  </td>
                </tr>
              ) : sites.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-slate-400">
                    No client sites found matching the criteria.
                  </td>
                </tr>
              ) : (
                sites.map((item) => {
                  const isExpanded = Boolean(expandedRows[item.id]);
                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-slate-700 dark:text-slate-300">
                        {/* Expand Toggle */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => toggleRowExpand(item.id)}
                            className={`cursor-pointer inline-flex items-center justify-center transition-all ${
                              isExpanded 
                                ? 'w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5'
                            }`}
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        {/* Oid */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 font-mono text-slate-600 dark:text-slate-400">
                          {item.oid}
                        </td>

                        {/* Client */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 font-medium text-slate-800 dark:text-slate-100">
                          {item.client}
                        </td>

                        {/* Branch */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80">
                          {item.branch}
                        </td>

                        {/* Site Name */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 font-semibold text-slate-800 dark:text-slate-100">
                          {item.site_name}
                        </td>

                        {/* Short Name */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 font-mono text-slate-600 dark:text-slate-400">
                          {item.short_name}
                        </td>

                        {/* Emp Cnt. */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 text-right font-medium">
                          {item.emp_count}
                        </td>

                        {/* Shift Cnt. */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 text-right font-medium">
                          {item.shift_count}
                        </td>

                        {/* Channel */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 font-mono text-xs">
                          {item.channel}
                        </td>

                        {/* IN Div */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 text-slate-400">
                          {item.in_div || ''}
                        </td>

                        {/* OUT Div */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 text-slate-400">
                          {item.out_div || ''}
                        </td>

                        {/* Start dt. */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 text-slate-500">
                          {item.start_dt || ''}
                        </td>

                        {/* End dt. */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 text-slate-500">
                          {item.end_dt || ''}
                        </td>

                        {/* Active */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 font-mono text-xs">
                          {item.active ? 'true' : 'false'}
                        </td>

                        {/* Out Mark compl */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 font-mono text-xs">
                          {item.out_mark_compl ? 'true' : 'false'}
                        </td>

                        {/* conf Patrol points */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800/80 font-mono text-xs">
                          {item.conf_patrol_points ? 'true' : 'false'}
                        </td>

                        {/* Payroll Policy */}
                        <td className="py-2 px-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {item.payroll_policy}
                        </td>
                      </tr>

                      {/* Expand Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-950/50">
                          <td colSpan={17} className="p-0 border-b border-slate-200 dark:border-slate-800">
                            {String(item.channel || '').toUpperCase().includes('QR') ? (
                              <QrGatesSubTable gates={item.gates} isBiometric={false} />
                            ) : (
                              /* For Biometric, show blank blocks as requested */
                              <QrGatesSubTable gates={[]} isBiometric={true} />
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Showing {startRecord} to {endRecord} of {total} sites
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => goToPage(1)}
              disabled={page === 1 || loading}
              className="px-2 py-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              First
            </button>
            <button
              type="button"
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="px-2 py-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Prev
            </button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              className="px-2 py-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => goToPage(totalPages)}
              disabled={page === totalPages || loading}
              className="px-2 py-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Last
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
