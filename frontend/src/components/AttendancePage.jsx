import React, { useState, useMemo, useCallback } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { attendanceApi } from '../services/apiService';

export default function AttendancePage() {
  // Search inputs
  const [originalEmpCode, setOriginalEmpCode] = useState('');
  const [subPartEmpCode, setSubPartEmpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSearchedCode, setActiveSearchedCode] = useState('');

  // Data
  const [employeeMasters, setEmployeeMasters] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [selectedEmpOid, setSelectedEmpOid] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // BIO Data
  const [bioEmployeeMasters, setBioEmployeeMasters] = useState([]);
  const [attExportLogsDetails, setAttExportLogsDetails] = useState(null);
  const [devicesInQrda, setDevicesInQrda] = useState([]);

  // Bio table column filters & sorting
  const [bioFilters, setBioFilters] = useState({
    id: '',
    emp_code: '',
    name: '',
  });
  const [bioSort, setBioSort] = useState({ column: 'id', direction: 'asc' });

  // Upper grid column filters
  const [empFilters, setEmpFilters] = useState({
    oid: '',
    site_oid: '',
    site_name: '',
    emp_code: '',
    name: '',
    desig: '',
    desig_oid: '',
    active: '',
    mis_matched: '',
  });

  // Upper grid sorting
  const [empSort, setEmpSort] = useState({ column: 'oid', direction: 'asc' });

  // Lower grid column filters
  const [attnFilters, setAttnFilters] = useState({
    oid: '',
    emp_oid: '',
    emp_code: '',
    emp_name: '',
    attn_site_name: '',
    duty_type: '',
    attn_month: '',
    attn_days: '',
    on_board: '',
  });

  // Lower grid sorting (default: Attn Month descending)
  const [attnSort, setAttnSort] = useState({ column: 'yearmonth', direction: 'desc' });

  // Perform search
  const handleSearch = useCallback(async (type, explicitQuery = null) => {
    const rawQuery = explicitQuery !== null 
      ? explicitQuery 
      : (type === 'original' ? originalEmpCode : subPartEmpCode);
    const query = (rawQuery || '').trim();
    if (!query) return;

    setLoading(true);
    try {
      const res = await attendanceApi.search(type, query);
      const masters = res.employeeMasters?.length 
        ? res.employeeMasters 
        : (res.employeeMaster ? [res.employeeMaster] : []);
      
      setEmployeeMasters(masters);
      setAttendanceRows(res.attendanceRows || []);
      setBioEmployeeMasters(res.bioEmployeeMasters || (res.bioEmployeeMaster ? [res.bioEmployeeMaster] : []));
      setAttExportLogsDetails(res.attExportLogsDetails || null);
      setDevicesInQrda(res.devicesInQrda || []);
      
      const primaryEmp = res.employeeMaster || masters[0];
      setActiveSearchedCode(primaryEmp?.emp_code || query);
      setSelectedEmpOid(primaryEmp?.oid || null);
      setHasSearched(true);
    } catch (err) {
      console.error('Failed to search attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [originalEmpCode, subPartEmpCode]);

  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter') {
      handleSearch(type);
    }
  };

  // Refresh handler: resets all column filters and re-runs the search for fresh data
  const handleRefresh = useCallback(async () => {
    setEmpFilters({
      oid: '',
      site_oid: '',
      site_name: '',
      emp_code: '',
      name: '',
      desig: '',
      desig_oid: '',
      active: '',
      mis_matched: '',
    });
    setAttnFilters({
      oid: '',
      emp_oid: '',
      emp_code: '',
      emp_name: '',
      attn_site_name: '',
      duty_type: '',
      attn_month: '',
      attn_days: '',
      on_board: '',
    });
    setBioFilters({
      id: '',
      emp_code: '',
      name: '',
    });

    const query = (activeSearchedCode || originalEmpCode || subPartEmpCode || '').trim();
    if (query) {
      const type = originalEmpCode.trim() ? 'original' : (subPartEmpCode.trim() ? 'subpart' : 'original');
      await handleSearch(type, query);
    }
  }, [activeSearchedCode, originalEmpCode, subPartEmpCode, handleSearch]);

  // Sorting helper
  const handleSort = (currentSort, setSortFunc, colKey) => {
    if (currentSort.column === colKey) {
      if (currentSort.direction === 'asc') {
        setSortFunc({ column: colKey, direction: 'desc' });
      } else if (currentSort.direction === 'desc') {
        setSortFunc({ column: colKey, direction: 'asc' });
      }
    } else {
      setSortFunc({ column: colKey, direction: 'asc' });
    }
  };

  // Render Sort Indicator
  const renderSortIndicator = (currentSort, colKey) => {
    if (currentSort.column === colKey) {
      return currentSort.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return ' ↑↓';
  };

  // Filtered and sorted Employee Master records
  const filteredEmployees = useMemo(() => {
    let result = [...employeeMasters];

    // Column filtering
    Object.keys(empFilters).forEach((key) => {
      const filterVal = empFilters[key].trim().toLowerCase();
      if (filterVal) {
        result = result.filter((item) => {
          const val = String(item[key] ?? '').toLowerCase();
          return val.includes(filterVal);
        });
      }
    });

    // Sorting
    if (empSort.column) {
      result.sort((a, b) => {
        let valA = a[empSort.column] ?? '';
        let valB = b[empSort.column] ?? '';
        const numA = Number(valA);
        const numB = Number(valB);
        const isNum = !isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '';

        if (isNum) {
          return empSort.direction === 'asc' ? numA - numB : numB - numA;
        } else {
          return empSort.direction === 'asc'
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        }
      });
    }

    return result;
  }, [employeeMasters, empFilters, empSort]);

  // Filtered and sorted Attendance records
  const filteredAttendanceRows = useMemo(() => {
    let result = [...attendanceRows];

    // When multiple employees exist, show the selected employee's 12 months
    if (selectedEmpOid && employeeMasters.length > 1) {
      const empRows = result.filter(r => String(r.emp_oid) === String(selectedEmpOid));
      if (empRows.length > 0) {
        result = empRows;
      }
    }

    // Column filtering
    Object.keys(attnFilters).forEach((key) => {
      const filterVal = attnFilters[key].trim().toLowerCase();
      if (filterVal) {
        result = result.filter((item) => {
          const val = String(item[key] ?? '').toLowerCase();
          return val.includes(filterVal);
        });
      }
    });

    // Sorting
    if (attnSort.column) {
      result.sort((a, b) => {
        let valA = a[attnSort.column] ?? '';
        let valB = b[attnSort.column] ?? '';
        const numA = Number(valA);
        const numB = Number(valB);
        const isNum = !isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '';

        if (isNum) {
          return attnSort.direction === 'asc' ? numA - numB : numB - numA;
        } else {
          return attnSort.direction === 'asc'
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        }
      });
    }

    return result;
  }, [attendanceRows, attnFilters, attnSort, selectedEmpOid, employeeMasters]);

  // Filtered and sorted Bio Employee Master records
  const filteredBioEmployees = useMemo(() => {
    let result = [...bioEmployeeMasters];

    // Column filtering
    Object.keys(bioFilters).forEach((key) => {
      const filterVal = bioFilters[key].trim().toLowerCase();
      if (filterVal) {
        result = result.filter((item) => {
          const val = String(item[key] ?? '').toLowerCase();
          return val.includes(filterVal);
        });
      }
    });

    // Sorting
    if (bioSort.column) {
      result.sort((a, b) => {
        let valA = a[bioSort.column] ?? '';
        let valB = b[bioSort.column] ?? '';
        const numA = Number(valA);
        const numB = Number(valB);
        const isNum = !isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '';

        if (isNum) {
          return bioSort.direction === 'asc' ? numA - numB : numB - numA;
        } else {
          return bioSort.direction === 'asc'
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        }
      });
    }

    return result;
  }, [bioEmployeeMasters, bioFilters, bioSort]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans pb-12 select-text">
      {/* ── Top Blue Header Banner ───────────────────────────────── */}
      <div className="bg-[#0066a2] text-white py-2.5 px-4 shadow-sm flex items-center justify-center relative">
        <h1 className="text-base sm:text-lg font-bold tracking-wide select-none">
          BIO-QRDA Emp Search
        </h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          title="Refresh attendance records & reset filters"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="w-full px-3 py-3 space-y-4">
        {/* ── Search Bar Section ─────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-xs p-3.5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {/* a) Original emp code */}
          <div className="flex items-center space-x-2.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Original emp code:
            </label>
            <input
              type="text"
              value={originalEmpCode}
              onChange={(e) => setOriginalEmpCode(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'original')}
              placeholder="e.g. EMP001"
              className="h-8 w-44 sm:w-52 px-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0066a2]/20 focus:border-[#0066a2] transition-colors"
            />
            <button
              onClick={() => handleSearch('original')}
              disabled={loading}
              className="h-8 px-4 bg-[#0066a2] hover:bg-[#005587] active:bg-[#00446c] text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>

          {/* Subtle separator on wide screens */}
          <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-slate-700" />

          {/* b) Sub part of emp code */}
          <div className="flex items-center space-x-2.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Sub part of emp code:
            </label>
            <input
              type="text"
              value={subPartEmpCode}
              onChange={(e) => setSubPartEmpCode(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'subpart')}
              placeholder="e.g. 001"
              className="h-8 w-44 sm:w-52 px-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0066a2]/20 focus:border-[#0066a2] transition-colors"
            />
            <button
              onClick={() => handleSearch('subpart')}
              disabled={loading}
              className="h-8 px-4 bg-[#0066a2] hover:bg-[#005587] active:bg-[#00446c] text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>

          {/* Subtle separator on wide screens */}
          <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-slate-700" />

          {/* c) Refresh / Reset Button */}
          <div className="flex items-center">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="h-8 px-3.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh Search & Reset Table Filters"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="py-1.5 text-center text-xs font-medium text-blue-600 dark:text-blue-400 animate-pulse">
            Searching database records...
          </div>
        )}

        {/* ── Upper Grid: Employee Master QRDA & BIO ───────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden">
          <div className="flex overflow-x-auto">
            {/* Main Left Table: QRDA */}
            <div className="flex-1 min-w-[760px] flex flex-col">
              {/* Section Header with Serif font matching legacy system */}
              <div className="text-center py-2 border-b border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h2 className="font-serif text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                  Employee Master QRDA : {activeSearchedCode || ''}
                </h2>
              </div>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-300 dark:border-slate-700">
                    {/* oid */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-16 align-top">
                      <div
                        onClick={() => handleSort(empSort, setEmpSort, 'oid')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>oid</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(empSort, 'oid')}</span>
                      </div>
                      <input
                        type="text"
                        value={empFilters.oid}
                        onChange={(e) => setEmpFilters({ ...empFilters, oid: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Site oid */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-20 align-top">
                      <div
                        onClick={() => handleSort(empSort, setEmpSort, 'site_oid')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Site oid</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(empSort, 'site_oid')}</span>
                      </div>
                      <input
                        type="text"
                        value={empFilters.site_oid}
                        onChange={(e) => setEmpFilters({ ...empFilters, site_oid: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Site Name (No sort arrows in screenshot) */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 align-top min-w-[220px]">
                      <div className="select-none pb-1 font-semibold text-slate-800 dark:text-slate-200">
                        <span>Site Name</span>
                      </div>
                      <input
                        type="text"
                        value={empFilters.site_name}
                        onChange={(e) => setEmpFilters({ ...empFilters, site_name: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Emp Code */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24 align-top">
                      <div
                        onClick={() => handleSort(empSort, setEmpSort, 'emp_code')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Emp Code</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(empSort, 'emp_code')}</span>
                      </div>
                      <input
                        type="text"
                        value={empFilters.emp_code}
                        onChange={(e) => setEmpFilters({ ...empFilters, emp_code: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Name */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 min-w-[180px] align-top">
                      <div
                        onClick={() => handleSort(empSort, setEmpSort, 'name')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Name</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(empSort, 'name')}</span>
                      </div>
                      <input
                        type="text"
                        value={empFilters.name}
                        onChange={(e) => setEmpFilters({ ...empFilters, name: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Desig */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24 align-top">
                      <div
                        onClick={() => handleSort(empSort, setEmpSort, 'desig')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Desig</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(empSort, 'desig')}</span>
                      </div>
                      <input
                        type="text"
                        value={empFilters.desig}
                        onChange={(e) => setEmpFilters({ ...empFilters, desig: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Desig oid */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-16 align-top">
                      <div
                        onClick={() => handleSort(empSort, setEmpSort, 'desig_oid')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Desig oid</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(empSort, 'desig_oid')}</span>
                      </div>
                      <input
                        type="text"
                        value={empFilters.desig_oid}
                        onChange={(e) => setEmpFilters({ ...empFilters, desig_oid: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Active */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-16 align-top">
                      <div
                        onClick={() => handleSort(empSort, setEmpSort, 'active')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Active</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(empSort, 'active')}</span>
                      </div>
                      <input
                        type="text"
                        value={empFilters.active}
                        onChange={(e) => setEmpFilters({ ...empFilters, active: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Mis matched */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-16 align-top">
                      <div
                        onClick={() => handleSort(empSort, setEmpSort, 'mis_matched')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span className="whitespace-nowrap">Mis matched</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(empSort, 'mis_matched')}</span>
                      </div>
                      <input
                        type="text"
                        value={empFilters.mis_matched}
                        onChange={(e) => setEmpFilters({ ...empFilters, mis_matched: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp, idx) => {
                      const isSelected = String(selectedEmpOid) === String(emp.oid);
                      return (
                        <tr
                          key={emp.oid || idx}
                          onClick={() => {
                            setSelectedEmpOid(emp.oid);
                            setActiveSearchedCode(emp.emp_code);
                          }}
                          className={`border-b border-slate-200 dark:border-slate-800 hover:bg-sky-50/60 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-slate-800 dark:text-slate-200 ${
                            isSelected ? 'bg-sky-50 dark:bg-sky-950/40 font-medium' : ''
                          }`}
                        >
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{emp.oid}</td>
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{emp.site_oid}</td>
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-normal text-slate-800 dark:text-slate-100">{emp.site_name}</td>
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-normal text-slate-800 dark:text-slate-100">{emp.emp_code}</td>
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-normal text-slate-800 dark:text-slate-100">{emp.name}</td>
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{emp.desig || 'S/G'}</td>
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{emp.desig_oid || '10'}</td>
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            {String(emp.active)}
                          </td>
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{emp.mis_matched}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 dark:text-slate-500 italic">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right Side Column: Employee Master BIO */}
            <div className="w-[300px] border-l border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
              <div className="text-center py-2 border-b border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h2 className="font-serif text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                  Employee Master BIO : {activeSearchedCode || ''}
                </h2>
              </div>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-300 dark:border-slate-700">
                    {/* id */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-16 align-top">
                      <div
                        onClick={() => handleSort(bioSort, setBioSort, 'id')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>id</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(bioSort, 'id')}</span>
                      </div>
                      <input
                        type="text"
                        value={bioFilters.id}
                        onChange={(e) => setBioFilters({ ...bioFilters, id: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Emp Code */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24 align-top">
                      <div
                        onClick={() => handleSort(bioSort, setBioSort, 'emp_code')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Emp Code</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(bioSort, 'emp_code')}</span>
                      </div>
                      <input
                        type="text"
                        value={bioFilters.emp_code}
                        onChange={(e) => setBioFilters({ ...bioFilters, emp_code: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Name */}
                    <th className="p-2 border-slate-300 dark:border-slate-700 align-top min-w-[100px]">
                      <div
                        onClick={() => handleSort(bioSort, setBioSort, 'name')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Name</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(bioSort, 'name')}</span>
                      </div>
                      <input
                        type="text"
                        value={bioFilters.name}
                        onChange={(e) => setBioFilters({ ...bioFilters, name: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBioEmployees.length > 0 ? (
                    filteredBioEmployees.map((bio, idx) => (
                      <tr
                        key={bio.id || idx}
                        className="border-b border-slate-200 dark:border-slate-800 hover:bg-sky-50/60 dark:hover:bg-slate-800/50 transition-colors text-slate-800 dark:text-slate-200"
                      >
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{bio.id}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-normal text-slate-800 dark:text-slate-100">{bio.emp_code}</td>
                        <td className="p-2.5 font-normal text-slate-800 dark:text-slate-100">{bio.name}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-400 dark:text-slate-500 italic">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Lower Grid: AttendanceRows in QRDA ──────────────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden">
          {/* Section Header with Serif font matching legacy system */}
          <div className="text-center py-2 border-b border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h2 className="font-serif text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
              AttendanceRows in QRDA
            </h2>
          </div>

          <div className="flex overflow-x-auto">
            {/* Main Left Table */}
            <div className="flex-1 min-w-0 overflow-x-auto">
              <table className="w-full min-w-[780px] text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-300 dark:border-slate-700">
                    {/* Oid */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-14 align-top">
                      <div
                        onClick={() => handleSort(attnSort, setAttnSort, 'oid')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Oid</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(attnSort, 'oid')}</span>
                      </div>
                      <input
                        type="text"
                        value={attnFilters.oid}
                        onChange={(e) => setAttnFilters({ ...attnFilters, oid: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Emp Oid */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-14 align-top">
                      <div
                        onClick={() => handleSort(attnSort, setAttnSort, 'emp_oid')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Emp Oid</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(attnSort, 'emp_oid')}</span>
                      </div>
                      <input
                        type="text"
                        value={attnFilters.emp_oid}
                        onChange={(e) => setAttnFilters({ ...attnFilters, emp_oid: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Emp Code */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-20 align-top">
                      <div
                        onClick={() => handleSort(attnSort, setAttnSort, 'emp_code')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Emp Code</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(attnSort, 'emp_code')}</span>
                      </div>
                      <input
                        type="text"
                        value={attnFilters.emp_code}
                        onChange={(e) => setAttnFilters({ ...attnFilters, emp_code: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Emp Name */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 min-w-[120px] align-top">
                      <div
                        onClick={() => handleSort(attnSort, setAttnSort, 'emp_name')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Emp Name</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(attnSort, 'emp_name')}</span>
                      </div>
                      <input
                        type="text"
                        value={attnFilters.emp_name}
                        onChange={(e) => setAttnFilters({ ...attnFilters, emp_name: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Attn Site name */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 min-w-[140px] align-top">
                      <div
                        onClick={() => handleSort(attnSort, setAttnSort, 'attn_site_name')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Attn Site name</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(attnSort, 'attn_site_name')}</span>
                      </div>
                      <input
                        type="text"
                        value={attnFilters.attn_site_name}
                        onChange={(e) => setAttnFilters({ ...attnFilters, attn_site_name: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Duty Type */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-20 align-top">
                      <div
                        onClick={() => handleSort(attnSort, setAttnSort, 'duty_type')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Duty Type</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(attnSort, 'duty_type')}</span>
                      </div>
                      <input
                        type="text"
                        value={attnFilters.duty_type}
                        onChange={(e) => setAttnFilters({ ...attnFilters, duty_type: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* Attn Month (Spans vertically in screenshot without input box) */}
                    <th 
                      onClick={() => handleSort(attnSort, setAttnSort, 'yearmonth')}
                      className="p-2 border-r border-slate-300 dark:border-slate-700 w-20 align-middle text-center cursor-pointer select-none font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <span>Attn Month</span>
                    </th>

                    {/* Attn Days */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-14 align-top">
                      <div
                        onClick={() => handleSort(attnSort, setAttnSort, 'attn_days')}
                        className="cursor-pointer select-none flex items-center justify-between pb-1"
                      >
                        <span>Attn Days</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(attnSort, 'attn_days')}</span>
                      </div>
                      <input
                        type="text"
                        value={attnFilters.attn_days}
                        onChange={(e) => setAttnFilters({ ...attnFilters, attn_days: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>

                    {/* ON BOARD */}
                    <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-28 min-w-[105px] shrink-0 align-top text-center">
                      <div
                        onClick={() => handleSort(attnSort, setAttnSort, 'on_board')}
                        className="cursor-pointer select-none flex items-center justify-center space-x-1 pb-1 font-bold text-slate-900 dark:text-slate-100 tracking-wide text-xs"
                      >
                        <span>ON BOARD</span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{renderSortIndicator(attnSort, 'on_board')}</span>
                      </div>
                      <input
                        type="text"
                        value={attnFilters.on_board}
                        onChange={(e) => setAttnFilters({ ...attnFilters, on_board: e.target.value })}
                        className="w-full h-7 px-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-center focus:outline-none focus:border-[#0066a2]"
                      />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttendanceRows.length > 0 ? (
                    filteredAttendanceRows.map((row, idx) => (
                      <tr
                        key={row.oid || idx}
                        className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-800 dark:text-slate-200"
                      >
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{row.oid}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{row.emp_oid}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{row.emp_code}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{row.emp_name}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{row.attn_site_name}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{row.duty_type}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{row.attn_month}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{row.attn_days}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap min-w-[105px]">
                          <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${
                            row.on_board === 'Inactive'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                              : 'bg-[#d1fae5] dark:bg-emerald-950/40 text-[#047857] dark:text-emerald-400 border border-[#86efac] dark:border-emerald-800'
                          }`}>
                            {row.on_board || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 dark:text-slate-500 italic">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right Side Section: AttExport_Logs & Devices in QRDA */}
            <div className="w-[300px] border-l border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 p-3 space-y-4">
              {/* 1. AttExport_Logs details from BIO-DB */}
              <div className="space-y-1.5">
                <div className="text-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-serif text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                    AttExport_Logs details from BIO-DB
                  </h3>
                </div>
                <div className="flex justify-center">
                  <table className="w-full text-xs border border-slate-300 dark:border-slate-700 border-collapse bg-white dark:bg-slate-900">
                    <tbody>
                      <tr className="border-b border-slate-300 dark:border-slate-700">
                        <td className="p-2 font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700 w-1/2">
                          Distinct Emp Codes:
                        </td>
                        <td className="p-2 text-slate-800 dark:text-slate-200 font-normal">
                          {attExportLogsDetails?.distinct_emp_codes || (activeSearchedCode ? `${activeSearchedCode.toLowerCase()}, ` : '')}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-300 dark:border-slate-700">
                        <td className="p-2 font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700 align-top">
                          Attendance min max dates:
                        </td>
                        <td className="p-2 text-slate-800 dark:text-slate-200 font-normal leading-relaxed">
                          {attExportLogsDetails?.min_date ? (
                            <div className="flex flex-col">
                              <span>{attExportLogsDetails.min_date}</span>
                              <span>{attExportLogsDetails.max_date}</span>
                            </div>
                          ) : (
                            ''
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                          Marked attendances on Device IDs:
                        </td>
                        <td className="p-2 text-slate-800 dark:text-slate-200 font-normal">
                          {attExportLogsDetails?.marked_device_ids || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Devices for deviceIds in QRDA */}
              <div className="space-y-1.5">
                <div className="text-center py-1.5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-serif text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                    Devices for deviceIds in QRDA
                  </h3>
                </div>
                <div className="flex justify-center">
                  <table className="w-full text-xs border border-slate-300 dark:border-slate-700 border-collapse bg-white dark:bg-slate-900">
                    <thead>
                      <tr className="bg-[#f8fafc] dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-300 dark:border-slate-700">
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-16 text-left">
                          ID
                        </th>
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-24 text-left">
                          Type
                        </th>
                        <th className="p-2 text-left">
                          IN Sites
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {devicesInQrda.length > 0 ? (
                        devicesInQrda.map((dev, idx) => (
                          <tr key={dev.id || idx} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-normal">
                              {dev.id}
                            </td>
                            <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-normal">
                              {dev.type}
                            </td>
                            <td className="p-2 text-slate-800 dark:text-slate-100 font-normal">
                              {dev.in_sites}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-500 dark:text-slate-400 text-xs italic">
                            No records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
