import React, { useState, useMemo } from 'react';
import { Plus, Edit2, RotateCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Filter, Search, X, Users, UserCheck, ShieldCheck } from 'lucide-react';
import SearchableColumnFilter from './SearchableColumnFilter';

const DAY_NAME_MAP = {
  sun: 'Sunday', sunday: 'Sunday',
  mon: 'Monday', monday: 'Monday',
  tue: 'Tuesday', tuesday: 'Tuesday',
  wed: 'Wednesday', wednesday: 'Wednesday',
  thu: 'Thursday', thursday: 'Thursday',
  fri: 'Friday', friday: 'Friday',
  sat: 'Saturday', saturday: 'Saturday'
};

const getFullDayName = (raw) => {
  if (!raw) return 'Sunday';
  const clean = String(raw).trim().toLowerCase();
  return DAY_NAME_MAP[clean] || DAY_NAME_MAP[clean.slice(0, 3)] || raw;
};

export default function EmployeesPage({ employees = [], onAddEmployee, onEditEmployee }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [globalSearch, setGlobalSearch] = useState('');

  const [filters, setFilters] = useState({
    client: '', branch: '', site: ''
  });

  const columns = [
    { key: 'client', label: 'Client' },
    { key: 'branch', label: 'Branch' },
    { key: 'site', label: 'Site' },
    { key: 'empCode', label: 'Emp Code' },
    { key: 'name', label: 'Name' },
    { key: 'skillDesig', label: 'Designation' },
    { key: 'clientDesig', label: 'Client Desig' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'weeklyOff', label: 'Weekly Off' },
    { key: 'joinedOn', label: 'Joined On' },
    { key: 'releavedOn', label: 'Releaved On' },
    { key: 'onBoard', label: 'On Board' },
    { key: 'attnApp', label: 'Attn App' },
  ];

  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'client') {
        updated.branch = '';
        updated.site = '';
      } else if (field === 'branch') {
        updated.site = '';
      }
      return updated;
    });
    setCurrentPage(1);
  };

  const availableBranchEmployees = useMemo(() => {
    if (!filters.client) return employees;
    return employees.filter(e => String(e.client ?? '').toLowerCase().includes(filters.client.toLowerCase()));
  }, [employees, filters.client]);

  const availableSiteEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchClient = !filters.client || String(e.client ?? '').toLowerCase().includes(filters.client.toLowerCase());
      const matchBranch = !filters.branch || String(e.branch ?? '').toLowerCase().includes(filters.branch.toLowerCase());
      return matchClient && matchBranch;
    });
  }, [employees, filters.client, filters.branch]);

  const handleSort = (field) => {
    if (sortColumn === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(field);
      setSortDirection('asc');
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!employees || !employees.length) return [];
    
    const search = globalSearch.trim().toLowerCase();
    const cFilter = (filters.client || '').trim().toLowerCase();
    const bFilter = (filters.branch || '').trim().toLowerCase();
    const sFilter = (filters.site || '').trim().toLowerCase();

    const result = [];
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];

      // Dropdown filters check
      if (cFilter && !String(emp.client || '').toLowerCase().includes(cFilter)) continue;
      if (bFilter && !String(emp.branch || '').toLowerCase().includes(bFilter)) continue;
      if (sFilter && !String(emp.site || '').toLowerCase().includes(sFilter)) continue;

      // Global search check
      if (search) {
        const nameMatch = String(emp.name || '').toLowerCase().includes(search);
        const codeMatch = String(emp.empCode || '').toLowerCase().includes(search);
        const mobileMatch = String(emp.mobile || '').toLowerCase().includes(search);
        const clientMatch = String(emp.client || '').toLowerCase().includes(search);
        const siteMatch = String(emp.site || '').toLowerCase().includes(search);
        const branchMatch = String(emp.branch || '').toLowerCase().includes(search);
        const desigMatch = String(emp.skillDesig || '').toLowerCase().includes(search);
        const dayMatch = String(emp.weeklyOff || '').toLowerCase().includes(search);
        const statusMatch = emp.onBoard ? 'active'.includes(search) : 'inactive'.includes(search);
        const attnMatch = emp.attnApp ? 'registered'.includes(search) : 'not registered'.includes(search);

        if (!nameMatch && !codeMatch && !mobileMatch && !clientMatch && !siteMatch && !branchMatch && !desigMatch && !dayMatch && !statusMatch && !attnMatch) {
          continue;
        }
      }

      result.push(emp);
    }
    return result;
  }, [employees, globalSearch, filters]);

  const sortedEmployees = useMemo(() => {
    if (!sortColumn || !filteredEmployees.length) return filteredEmployees;
    return [...filteredEmployees].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (typeof valA === 'boolean') {
        if (sortColumn === 'attnApp') valA = valA ? 'Registered' : 'Not Registered';
        else valA = valA ? 'Active' : 'Inactive';
      }
      if (typeof valB === 'boolean') {
        if (sortColumn === 'attnApp') valB = valB ? 'Registered' : 'Not Registered';
        else valB = valB ? 'Active' : 'Inactive';
      }
      valA = String(valA ?? '').toLowerCase();
      valB = String(valB ?? '').toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, sortColumn, sortDirection]);

  // Quick Metrics Calculation
  const activeCount = useMemo(() => employees.filter(e => e.onBoard).length, [employees]);
  const registeredCount = useMemo(() => employees.filter(e => e.attnApp).length, [employees]);

  const pageCount = Math.ceil(sortedEmployees.length / pageSize) || 1;
  const paginatedEmployees = sortedEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setGlobalSearch('');
    setFilters({
      client: '', branch: '', site: ''
    });
    setSortColumn(null);
    setCurrentPage(1);
  };

  return (
    <div className="bg-[var(--bg-app)] text-[var(--text-main)] min-h-[calc(100vh-50px)] pb-8 font-sans transition-colors duration-200">
      
      {/* Compact Workspace Header Bar */}
      <div className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-color)] py-2.5 px-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md border border-sky-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-extrabold tracking-wider uppercase text-[var(--text-main)] flex items-center gap-2">
              <span>Employee Directory Workspace</span>
              <span className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold lowercase">
                {employees.length.toLocaleString()} total
              </span>
            </h1>
          </div>
        </div>

        {/* Compact Quick Metrics & Action Controls */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-2 text-[11px] font-semibold border-r border-[var(--border-color)] pr-3 mr-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>{activeCount.toLocaleString()} Active</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{registeredCount.toLocaleString()} App Reg</span>
            </span>
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center space-x-1 bg-[var(--control-bg)] hover:bg-[var(--control-hover)] text-[var(--text-main)] text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--border-color)] transition-all shadow-2xs"
            title="Reset Filters"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onAddEmployee}
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-md transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* STICKY HORIZONTAL FILTER & CONTROL TOOLBAR (ALWAYS VISIBLE ON SCROLL) */}
      <div className="sticky top-0 z-30 bg-[var(--bg-app)] py-2 px-3 border-b border-[var(--border-color)] shadow-sm">
        <div className="max-w-[1920px] mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-2 shadow-sm flex flex-wrap items-center justify-between gap-2 transition-colors">
          
          {/* Left Side: Global Search & Dropdowns in One Horizontal Line */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
            {/* Global Search Input */}
            <div className="relative min-w-[220px] flex-1 max-w-[400px]">
              <Search className="w-3.5 h-3.5 text-sky-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Name, Code, Mobile, Client, Branch, Site..."
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md pl-8 pr-7 py-1.5 text-[11px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-sky-500 font-medium transition-all"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Client Filter Dropdown */}
            <div className="w-[140px] sm:w-[160px]">
              <SearchableColumnFilter
                field="client"
                label="Client"
                value={filters.client || ''}
                onChange={(val) => handleFilterChange('client', val)}
                employees={employees}
              />
            </div>

            {/* Branch Filter Dropdown */}
            <div className="w-[120px] sm:w-[140px]">
              <SearchableColumnFilter
                field="branch"
                label="Branch"
                value={filters.branch || ''}
                onChange={(val) => handleFilterChange('branch', val)}
                employees={availableBranchEmployees}
              />
            </div>

            {/* Site Filter Dropdown */}
            <div className="w-[140px] sm:w-[160px]">
              <SearchableColumnFilter
                field="site"
                label="Site"
                value={filters.site || ''}
                onChange={(val) => handleFilterChange('site', val)}
                employees={availableSiteEmployees}
              />
            </div>

            {/* Clear Filters Badge */}
            {(globalSearch || filters.client || filters.branch || filters.site) && (
              <button
                onClick={resetFilters}
                className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-bold px-2 py-1 rounded bg-sky-500/10 border border-sky-500/30 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {/* Right Side: Compact Pagination Controls */}
          <div className="flex items-center space-x-2 text-[11px] text-[var(--text-muted)] font-semibold border-l border-[var(--border-color)] pl-2">
            <span className="font-mono text-[var(--text-main)] text-[10px] whitespace-nowrap">
              {sortedEmployees.length > 0 ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, sortedEmployees.length)} of ${sortedEmployees.length}` : '0 records'}
            </span>

            {/* Page Buttons */}
            <div className="flex items-center space-x-0.5">
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--control-hover)] disabled:opacity-30"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--control-hover)] disabled:opacity-30"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 rounded font-bold text-[10px]">
                {currentPage} / {pageCount}
              </span>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--control-hover)] disabled:opacity-30"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setCurrentPage(pageCount)}
                disabled={currentPage === pageCount}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--control-hover)] disabled:opacity-30"
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
              className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1.5 py-1 text-[10px] text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold"
            >
              <option value={25}>25 / p</option>
              <option value={50}>50 / p</option>
              <option value={100}>100 / p</option>
              <option value={250}>250 / p</option>
            </select>
          </div>

        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-3 mt-2.5 space-y-2.5">

        {/* DENSE PROFESSIONAL DATA-TABLE CONTAINER WITH INTERNAL SCROLLING */}
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-md overflow-x-auto overflow-y-auto max-h-[calc(100vh-195px)] min-h-[480px]">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="sticky top-0 bg-[var(--table-header-bg)] z-10">
              <tr className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] text-[var(--text-main)] font-bold select-none uppercase tracking-wider text-[10px]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="py-2.5 px-2.5 border-r border-[var(--border-color)] hover:bg-sky-500/10 cursor-pointer transition-colors whitespace-nowrap sticky top-0 bg-[var(--table-header-bg)] z-10"
                  >
                    <div className="flex items-center space-x-1 justify-between">
                      <span>{col.label}</span>
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap text-[var(--text-main)] sticky top-0 bg-[var(--table-header-bg)] z-10">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-color)]">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp, index) => (
                  <tr
                    key={emp.oid || emp.empCode || index}
                    className={`hover:bg-sky-500/10 transition-colors ${
                      index % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] text-[var(--text-main)] font-medium truncate max-w-[140px]">{emp.client}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] text-[var(--text-secondary)] truncate max-w-[110px]">{emp.branch}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] font-semibold text-sky-600 dark:text-sky-400 truncate max-w-[150px]">{emp.site}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] font-mono text-[var(--text-secondary)] font-semibold">{emp.empCode}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] font-bold text-[var(--text-main)] whitespace-nowrap">{emp.name}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] text-[var(--text-secondary)]">{emp.skillDesig}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] text-[var(--text-muted)]">{emp.clientDesig}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] font-mono text-[var(--text-secondary)]">{emp.mobile}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] font-semibold text-[var(--text-secondary)] text-[11px]">{getFullDayName(emp.weeklyOff)}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] text-[var(--text-muted)] whitespace-nowrap">{emp.joinedOn}</td>
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] text-[var(--text-muted)] whitespace-nowrap">{emp.releavedOn || '-'}</td>
                    
                    {/* On Board Status Badge */}
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        emp.onBoard
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/30'
                      }`}>
                        {emp.onBoard ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Attn App Status Badge */}
                    <td className="py-2 px-2.5 border-r border-[var(--border-color)] text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        emp.attnApp
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                          : 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/30'
                      }`}>
                        {emp.attnApp ? 'Registered' : 'Not Registered'}
                      </span>
                    </td>

                    {/* Action Icon */}
                    <td className="py-2 px-2.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => onEditEmployee(emp)}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-800 p-1 rounded hover:bg-sky-500/20 transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-[var(--text-muted)] font-medium">
                    No matching employee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
