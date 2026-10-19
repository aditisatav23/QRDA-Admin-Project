import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Edit2, Check, RotateCcw, Layers, Filter, X, Save, ShieldCheck, ChevronLeft, ChevronRight, Plus, Trash2, UserCheck, UserX, Users, AlertCircle } from 'lucide-react';
import { deploymentDataMap, clientOptions as defaultClientOptions, branchOptions, siteOptions } from '../data/mockData';
import { locationApi } from '../services/apiService';
import SearchableColumnFilter from './SearchableColumnFilter';

export default function DeploymentPage({ employees = [] }) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [liveClients, setLiveClients] = useState([]);
  const [liveSites, setLiveSites] = useState([]);

  const [selectedRows, setSelectedRows] = useState(['S/G']);
  
  // Submission requirement state
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({ client: '', branch: '', site: '' });
  const [validationError, setValidationError] = useState('');
  
  // Custom dynamically added rows
  const [customRows, setCustomRows] = useState([]);
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState(false);
  const [addRowError, setAddRowError] = useState('');
  const [newRowDraft, setNewRowDraft] = useState({
    designation: '',
    required: '',
    onboard: '',
    monFri: 0,
    sat: 0,
    sun: 0
  });

  // Employee detail bottom section tab: 'onboard' | 'releave'
  const [employeeTab, setEmployeeTab] = useState('onboard');

  // Modal Edit state
  const [editingRowItem, setEditingRowItem] = useState(null);
  const [editDraft, setEditDraft] = useState({ required: 0, releave: 0, monFri: 0, sat: 0, sun: 0 });

  // Custom overrides for edited requirements
  const [customOverrides, setCustomOverrides] = useState({});

  // ── Load clients + sites from cached backend ──────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadFilters() {
      try {
        const [clients, sites] = await Promise.all([
          locationApi.getClients(),
          locationApi.getSites(),
        ]);
        if (isMounted) {
          if (clients && clients.length) setLiveClients(clients);
          if (sites && sites.length) setLiveSites(sites);
        }
      } catch (e) {
        console.warn('Deployment filters load warn:', e);
      }
    }
    loadFilters();
    return () => { isMounted = false; };
  }, []);

  // 1. Fast memoized Client options
  const clientOptions = useMemo(() => {
    const set = new Set(defaultClientOptions);
    for (let i = 0; i < liveClients.length; i++) {
      const c = liveClients[i];
      const name = typeof c === 'string' ? c : (c.name || c.client_name || c.client);
      if (name) set.add(name);
    }
    for (let i = 0; i < Math.min(employees.length, 1000); i++) {
      if (employees[i].client) set.add(employees[i].client);
    }
    return Array.from(set).sort();
  }, [liveClients, employees]);

  // 2. Fast memoized Branches for selected client
  const availableBranches = useMemo(() => {
    const set = new Set(['Main', 'Mumbai', 'Pune']);
    if (selectedClient && branchOptions[selectedClient]) {
      branchOptions[selectedClient].forEach(b => set.add(b));
    }
    for (let i = 0; i < liveSites.length; i++) {
      const s = liveSites[i];
      if (!selectedClient || s.client_name === selectedClient || s.client === selectedClient) {
        if (s.branch || s.branch_name) set.add(s.branch || s.branch_name);
      }
    }
    return Array.from(set).sort();
  }, [liveSites, selectedClient]);

  // 3. Fast memoized Sites filtered by client + branch
  const availableSites = useMemo(() => {
    const set = new Set(['WIPRO PDC - II', 'TCL BKC', 'TCL VSB']);
    const key = `${selectedClient}|${selectedBranch}`;
    if (siteOptions[key]) {
      siteOptions[key].forEach(s => set.add(s));
    }
    for (let i = 0; i < liveSites.length; i++) {
      const s = liveSites[i];
      const matchClient = !selectedClient || s.client_name === selectedClient || s.client === selectedClient;
      const matchBranch = !selectedBranch || s.branch === selectedBranch || s.branch_name === selectedBranch;
      if (matchClient && matchBranch) {
        const name = typeof s === 'string' ? s : (s.name || s.site_name);
        if (name) set.add(name);
      }
    }
    return Array.from(set).sort();
  }, [liveSites, selectedClient, selectedBranch]);

  const handleClientChange = useCallback((val) => {
    setSelectedClient(val);
    setSelectedBranch('');
    setSelectedSite('');
    setHasSubmitted(false);
    setValidationError('');
  }, []);

  const handleBranchChange = useCallback((val) => {
    setSelectedBranch(val);
    setSelectedSite('');
    setHasSubmitted(false);
    setValidationError('');
  }, []);

  const handleSiteChange = useCallback((val) => {
    setSelectedSite(val);
    setHasSubmitted(false);
    setValidationError('');
  }, []);

  // Helper to check designation match including reliever aliases
  const isMatchingDesig = (empDesig, targetDesig) => {
    if (!empDesig || !targetDesig) return false;
    const e = String(empDesig).trim().toUpperCase();
    const t = String(targetDesig).trim().toUpperCase();
    if (e === t) return true;
    if ((t === 'RELIEVE' || t === 'RELIEVER' || t === 'RELIEVED' || t === 'REL') && 
        (e === 'RELIEVE' || e === 'RELIEVER' || e === 'RELIEVED' || e === 'REL' || e.startsWith('RELIEV'))) {
      return true;
    }
    return false;
  };

  // ── Fast Single-Pass O(N) Onboard Employee Aggregator ────────────────────
  const onboardCountsByDesig = useMemo(() => {
    const map = {};
    if (!hasSubmitted || !employees || !employees.length) return map;

    const cLower = (appliedFilters.client || '').toLowerCase().trim();
    const sLower = (appliedFilters.site || '').toLowerCase().trim();

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      if (!emp.onBoard) continue;

      if (cLower && !String(emp.client || '').toLowerCase().includes(cLower)) continue;
      if (sLower) {
        const empSite = String(emp.site || '').toLowerCase();
        if (!empSite.includes(sLower) && !sLower.includes(empSite)) continue;
      }

      const desig = (emp.skillDesig || emp.clientDesig || '').trim();
      if (desig) {
        map[desig] = (map[desig] || 0) + 1;
        const upper = desig.toUpperCase();
        if (upper.startsWith('RELIEV') || upper === 'REL') {
          map['RELIEVE'] = (map['RELIEVE'] || 0) + 1;
          map['RELIEVER'] = (map['RELIEVER'] || 0) + 1;
          map['RELIEVED'] = (map['RELIEVED'] || 0) + 1;
        }
      }
    }
    return map;
  }, [hasSubmitted, employees, appliedFilters]);

  // ── Fast Single-Pass O(N) Releave Employee Aggregator ────────────────────
  const releaveCountsByDesig = useMemo(() => {
    const map = {};
    if (!hasSubmitted || !employees || !employees.length) return map;

    const cLower = (appliedFilters.client || '').toLowerCase().trim();
    const sLower = (appliedFilters.site || '').toLowerCase().trim();

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const hasReleaveDate = Boolean(emp.releavedOn && String(emp.releavedOn).trim() !== '' && String(emp.releavedOn).trim() !== '-');
      const isReleaved = hasReleaveDate || emp.onBoard === false;
      if (!isReleaved) continue;

      if (cLower && !String(emp.client || '').toLowerCase().includes(cLower)) continue;
      if (sLower) {
        const empSite = String(emp.site || '').toLowerCase();
        if (!empSite.includes(sLower) && !sLower.includes(empSite)) continue;
      }

      const desig = (emp.skillDesig || emp.clientDesig || '').trim();
      if (desig) {
        map[desig] = (map[desig] || 0) + 1;
        const upper = desig.toUpperCase();
        if (upper.startsWith('RELIEV') || upper === 'REL') {
          map['RELIEVE'] = (map['RELIEVE'] || 0) + 1;
          map['RELIEVER'] = (map['RELIEVER'] || 0) + 1;
          map['RELIEVED'] = (map['RELIEVED'] || 0) + 1;
        }
      }
    }
    return map;
  }, [hasSubmitted, employees, appliedFilters]);

  // Compute dynamic active deployment table rows INSTANTLY
  const activeDeployment = useMemo(() => {
    if (!hasSubmitted) return [];

    const key = `${appliedFilters.client}|${appliedFilters.branch}|${appliedFilters.site}`;
    const baseRequirements = deploymentDataMap[key] || [
      { designation: 'ASM', required: 1, releave: 0, monFri: 1, sat: 1, sun: 0 },
      { designation: 'S/G', required: 131, releave: 0, monFri: 116, sat: 40, sun: 76 },
      { designation: 'S/SUP', required: 5, releave: 0, monFri: 3, sat: 3, sun: 3 },
      { designation: 'S/OFF', required: 4, releave: 0, monFri: 3, sat: 2, sun: 2 },
      { designation: 'L/SG', required: 10, releave: 0, monFri: 8, sat: 4, sun: 4 }
    ];

    // Combine base with custom added rows
    const combined = [...baseRequirements];
    for (let i = 0; i < customRows.length; i++) {
      const cr = customRows[i];
      if (!combined.some(r => r.designation.toUpperCase() === cr.designation.toUpperCase())) {
        combined.push({ ...cr, isCustom: true });
      }
    }

    return combined.map(row => {
      const override = customOverrides[row.designation];
      const req = override ? override.required : row.required;
      const monFri = override ? override.monFri : row.monFri;
      const sat = override ? override.sat : row.sat;
      const sun = override ? override.sun : row.sun;

      const onboardCount = override?.onboard !== undefined
        ? override.onboard
        : (onboardCountsByDesig[row.designation] || (row.onboard ?? 0));

      const releaveCount = override?.releave !== undefined
        ? override.releave
        : (releaveCountsByDesig[row.designation] !== undefined
            ? releaveCountsByDesig[row.designation]
            : (row.releave ?? 0));
      const shortfall = onboardCount - req;

      return {
        ...row,
        required: req,
        monFri, sat, sun,
        onboard: onboardCount,
        releave: releaveCount,
        shortfall: shortfall
      };
    });
  }, [hasSubmitted, appliedFilters, onboardCountsByDesig, releaveCountsByDesig, customOverrides, customRows]);

  const handleSubmitFilters = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedClient || !selectedBranch || !selectedSite) {
      setValidationError('Please select Client, Branch, and Site before submitting.');
      return;
    }
    setValidationError('');
    setAppliedFilters({
      client: selectedClient,
      branch: selectedBranch,
      site: selectedSite
    });
    setHasSubmitted(true);
  };

  const handleClearFilters = () => {
    setSelectedClient('');
    setSelectedBranch('');
    setSelectedSite('');
    setAppliedFilters({ client: '', branch: '', site: '' });
    setHasSubmitted(false);
    setValidationError('');
    setSelectedRows(['S/G']);
  };

  const handleRowClick = (designation, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && (e.ctrlKey || e.metaKey)) {
      if (selectedRows.includes(designation)) {
        setSelectedRows(selectedRows.filter(r => r !== designation));
      } else {
        setSelectedRows([...selectedRows, designation]);
      }
    } else if (e && e.shiftKey && selectedRows.length > 0) {
      const allDesigs = activeDeployment.map(r => r.designation);
      const lastIndex = allDesigs.indexOf(selectedRows[selectedRows.length - 1]);
      const currentIndex = allDesigs.indexOf(designation);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const range = allDesigs.slice(start, end + 1);
      setSelectedRows([...new Set([...selectedRows, ...range])]);
    } else {
      setSelectedRows([designation]);
    }
  };

  // ── FIX EDIT BUTTON & MODAL ──
  const handleOpenEditModal = (rowItem, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setEditingRowItem(rowItem);
    setEditDraft({
      required: rowItem.required,
      releave: rowItem.releave || 0,
      monFri: rowItem.monFri,
      sat: rowItem.sat,
      sun: rowItem.sun
    });
  };

  const handleSaveEditModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingRowItem) return;
    
    const desig = editingRowItem.designation;
    setCustomOverrides(prev => ({
      ...prev,
      [desig]: {
        required: Number(editDraft.required) || 0,
        releave: Number(editDraft.releave) || 0,
        monFri: Number(editDraft.monFri) || 0,
        sat: Number(editDraft.sat) || 0,
        sun: Number(editDraft.sun) || 0
      }
    }));
    setEditingRowItem(null);
  };

  // ── ADD NEW ROW HANDLERS ──
  const handleSaveAddRowModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const desigName = (newRowDraft.designation || '').trim();
    const reqStr = newRowDraft.required !== null && newRowDraft.required !== undefined ? String(newRowDraft.required).trim() : '';
    const onbStr = newRowDraft.onboard !== null && newRowDraft.onboard !== undefined ? String(newRowDraft.onboard).trim() : '';

    if (!desigName || reqStr === '' || isNaN(Number(reqStr)) || onbStr === '' || isNaN(Number(onbStr))) {
      setAddRowError('Please fill all 3 mandatory fields: Designation Name, Required Count, and Onboard Count.');
      return;
    }

    setAddRowError('');
    const newRow = {
      designation: desigName,
      required: Number(reqStr),
      onboard: Number(onbStr),
      releave: 0,
      monFri: Number(newRowDraft.monFri) || 0,
      sat: Number(newRowDraft.sat) || 0,
      sun: Number(newRowDraft.sun) || 0,
      isCustom: true
    };

    setCustomRows(prev => {
      const exists = prev.some(r => r.designation.toUpperCase() === desigName.toUpperCase());
      if (exists) {
        return prev.map(r => r.designation.toUpperCase() === desigName.toUpperCase() ? newRow : r);
      }
      return [...prev, newRow];
    });

    setCustomOverrides(prev => ({
      ...prev,
      [desigName]: {
        required: newRow.required,
        onboard: newRow.onboard,
        releave: newRow.releave,
        monFri: newRow.monFri,
        sat: newRow.sat,
        sun: newRow.sun
      }
    }));

    setSelectedRows([desigName]);
    setIsAddRowModalOpen(false);
  };

  const handleDeleteRow = (designation, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setCustomRows(prev => prev.filter(r => r.designation !== designation));
    setCustomOverrides(prev => {
      const copy = { ...prev };
      delete copy[designation];
      return copy;
    });
    setSelectedRows(prev => prev.filter(r => r !== designation));
  };

  const totals = useMemo(() => {
    let required = 0, onboard = 0, releave = 0, shortfall = 0, monFri = 0, sat = 0, sun = 0;
    for (let i = 0; i < activeDeployment.length; i++) {
      const item = activeDeployment[i];
      required += item.required;
      onboard += item.onboard;
      releave += (item.releave || 0);
      shortfall += item.shortfall;
      monFri += item.monFri;
      sat += item.sat;
      sun += item.sun;
    }
    return { required, onboard, releave, shortfall, monFri, sat, sun };
  }, [activeDeployment]);

  // Fast memoized onboarded staff for selected designation (slice max 100 for fast UI)
  const onboardedStaff = useMemo(() => {
    if (!hasSubmitted || !employees || !employees.length) return [];
    const cLower = (appliedFilters.client || '').toLowerCase().trim();
    const sLower = (appliedFilters.site || '').toLowerCase().trim();

    const result = [];
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      if (!emp.onBoard) continue;
      if (cLower && !String(emp.client || '').toLowerCase().includes(cLower)) continue;
      if (sLower) {
        const empSite = String(emp.site || '').toLowerCase();
        if (!empSite.includes(sLower) && !sLower.includes(empSite)) continue;
      }
      const eDesig = emp.skillDesig || emp.clientDesig;
      const isMatched = selectedRows.some(r => isMatchingDesig(eDesig, r));
      if (isMatched) {
        result.push(emp);
        if (result.length >= 100) break; // Fast slicing
      }
    }
    return result;
  }, [hasSubmitted, employees, appliedFilters, selectedRows]);

  // Fast memoized releaved staff for selected designation
  const releavedStaff = useMemo(() => {
    if (!hasSubmitted || !employees || !employees.length) return [];
    const cLower = (appliedFilters.client || '').toLowerCase().trim();
    const sLower = (appliedFilters.site || '').toLowerCase().trim();

    const result = [];
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const hasReleaveDate = Boolean(emp.releavedOn && String(emp.releavedOn).trim() !== '' && String(emp.releavedOn).trim() !== '-');
      const isReleaved = hasReleaveDate || emp.onBoard === false;
      if (!isReleaved) continue;

      if (cLower && !String(emp.client || '').toLowerCase().includes(cLower)) continue;
      if (sLower) {
        const empSite = String(emp.site || '').toLowerCase();
        if (!empSite.includes(sLower) && !sLower.includes(empSite)) continue;
      }
      const eDesig = emp.skillDesig || emp.clientDesig;
      const isMatched = selectedRows.some(r => isMatchingDesig(eDesig, r));
      if (isMatched) {
        result.push(emp);
        if (result.length >= 100) break; // Fast slicing
      }
    }
    return result;
  }, [hasSubmitted, employees, appliedFilters, selectedRows]);

  return (
    <div className="bg-[var(--bg-app)] text-[var(--text-main)] min-h-[calc(100vh-50px)] pb-12 transition-colors duration-200 font-sans">
      
      {/* Compact Header Bar */}
      <div className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-color)] py-2.5 px-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md border border-sky-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-extrabold tracking-wider uppercase text-[var(--text-main)] flex items-center gap-2">
              <span>Standard Deployment Details Workspace</span>
            </h1>
          </div>
        </div>

        {hasSubmitted ? (
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-bold">
              {totals.required} Required
            </span>
            <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
              {totals.releave} Relieved
            </span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              {totals.onboard} Onboard
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--text-muted)] italic">
            Select filters & click Submit to view data
          </span>
        )}
      </div>

      <div className="max-w-[1920px] mx-auto px-3 mt-3 space-y-3">
        
        {/* COMPACT HORIZONTAL SINGLE-LINE FILTER TOOLBAR */}
        <form 
          onSubmit={handleSubmitFilters}
          className="bg-[var(--bg-card)] p-2 rounded-lg border border-[var(--border-color)] shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[var(--text-main)]"
        >
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Client Dropdown */}
            <div className="w-[180px]">
              <SearchableColumnFilter
                label="Client"
                value={selectedClient}
                onChange={handleClientChange}
                options={clientOptions}
              />
            </div>

            {/* Branch Dropdown */}
            <div className="w-[140px]">
              <SearchableColumnFilter
                label="Branch"
                value={selectedBranch}
                onChange={handleBranchChange}
                options={availableBranches}
              />
            </div>

            {/* Site Dropdown */}
            <div className="w-[180px]">
              <SearchableColumnFilter
                label="Site"
                value={selectedSite}
                onChange={handleSiteChange}
                options={availableSites}
              />
            </div>

            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-all shadow-xs cursor-pointer"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="bg-[var(--control-bg)] hover:bg-[var(--control-hover)] text-[var(--text-main)] border border-[var(--border-color)] text-xs font-semibold px-3 py-1.5 rounded-md transition-all flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setAddRowError('');
                setNewRowDraft({ designation: '', required: '', onboard: '', monFri: 0, sat: 0, sun: 0 });
                setIsAddRowModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-md transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer ml-auto"
              title="Add a new designation or relieved row"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          {validationError && (
            <div className="w-full flex items-center space-x-1.5 text-rose-500 text-[11px] font-semibold pt-1 border-t border-[var(--border-color)] mt-1 animate-in fade-in duration-150">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </form>

        {hasSubmitted ? (
          <>
            {/* COMPACT DESIGN 3 DEPLOYMENT DATA TABLE */}
            <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-md overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  {/* Header Row 1 */}
                  <tr className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] font-extrabold text-[var(--table-header-text)] select-none uppercase tracking-wider text-[10px]">
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-[var(--border-color)]">Designation</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-[var(--border-color)] text-left">Required Count</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-[var(--border-color)] text-left">Relieved</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-[var(--border-color)] text-left">Onboard Count</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-[var(--border-color)] text-left">Shortfall</th>
                    <th colSpan={3} className="py-2 px-3 border-r border-[var(--border-color)] text-left bg-[var(--table-header-bg)] text-[var(--table-header-text)] font-extrabold">
                      Required Daily Deployment Count
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 text-center">Action</th>
                  </tr>

                  {/* Header Row 2 - Full Day Names */}
                  <tr className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] font-extrabold text-[var(--table-header-text)] select-none text-[10px] uppercase">
                    <th className="py-1.5 px-3 border-r border-[var(--border-color)] text-left">Monday to Friday</th>
                    <th className="py-1.5 px-3 border-r border-[var(--border-color)] text-left">Saturday</th>
                    <th className="py-1.5 px-3 border-r border-[var(--border-color)] text-left">Sunday</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                  {activeDeployment.map((item, index) => {
                    const isSelected = selectedRows.includes(item.designation);
                    return (
                      <tr
                        key={item.designation}
                        onClick={(e) => handleRowClick(item.designation, e)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold border-l-4 border-l-sky-500'
                            : 'hover:bg-sky-500/10'
                        }`}
                      >
                        {/* Designation */}
                        <td className="py-2.5 px-3 border-r border-[var(--border-color)] font-bold text-[var(--text-main)]">
                          {item.designation}
                        </td>

                        {/* Required */}
                        <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono font-bold text-[var(--text-main)]">
                          {item.required}
                        </td>

                        {/* Relieve */}
                        <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono font-semibold text-amber-600 dark:text-amber-400">
                          {item.releave}
                        </td>

                        {/* Onboard */}
                        <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.onboard}
                        </td>

                        {/* Shortfall */}
                        <td className={`py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono font-bold ${
                          item.shortfall < 0 ? 'text-sky-600 dark:text-sky-400' : item.shortfall > 0 ? 'text-rose-600 dark:text-rose-400' : ''
                        }`}>
                          {item.shortfall}
                        </td>

                        {/* Monday to Friday */}
                        <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono text-[var(--text-secondary)]">
                          {item.monFri}
                        </td>

                        {/* Saturday */}
                        <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono text-[var(--text-secondary)]">
                          {item.sat}
                        </td>

                        {/* Sunday */}
                        <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono text-[var(--text-secondary)]">
                          {item.sun}
                        </td>

                        {/* Action Button - Working Edit Modal Launcher */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={(e) => handleOpenEditModal(item, e)}
                              className="text-sky-600 dark:text-sky-400 hover:text-sky-800 p-1.5 rounded hover:bg-sky-500/20 transition-colors font-bold text-xs"
                              title="Edit Requirement"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {item.isCustom && (
                              <button
                                onClick={(e) => handleDeleteRow(item.designation, e)}
                                className="text-rose-500 hover:text-rose-700 p-1.5 rounded hover:bg-rose-500/20 transition-colors font-bold text-xs"
                                title="Delete Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Summary Row */}
                  <tr className="hover:bg-sky-500/10 transition-colors text-[var(--text-main)] font-extrabold border-t-2 border-[var(--border-color)] text-xs">
                    <td className="py-2.5 px-3 border-r border-[var(--border-color)] uppercase">Total:</td>
                    <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono">{totals.required}</td>
                    <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono text-amber-600 dark:text-amber-400">{totals.releave}</td>
                    <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono text-emerald-600 dark:text-emerald-400">{totals.onboard}</td>
                    <td className={`py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono ${
                      totals.shortfall < 0 ? 'text-sky-600 dark:text-sky-400' : totals.shortfall > 0 ? 'text-rose-600 dark:text-rose-400' : ''
                    }`}>
                      {totals.shortfall}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono">{totals.monFri}</td>
                    <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono">{totals.sat}</td>
                    <td className="py-2.5 px-3 border-r border-[var(--border-color)] text-left font-mono">{totals.sun}</td>
                    <td className="py-2.5 px-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Selection Hint Text */}
            <div className="mt-1 text-center">
              <p className="text-[11px] text-[var(--text-muted)] italic">
                Click row to select/unselect. Hold Ctrl/Shift to multi-select rows.
              </p>
            </div>

            {/* Employees Sub-Section with Onboard / Relieved Tabs */}
            <div className="mt-4">
              <div className="border-b border-[var(--border-color)] pb-2 mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEmployeeTab('onboard')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      employeeTab === 'onboard'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[var(--control-bg)] text-[var(--text-secondary)] hover:bg-[var(--control-hover)]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Onboard Employees ({selectedRows.join(', ')})</span>
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                      {onboardedStaff.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmployeeTab('releave')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      employeeTab === 'releave'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-[var(--control-bg)] text-[var(--text-secondary)] hover:bg-[var(--control-hover)]'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Relieved Employees ({selectedRows.join(', ')})</span>
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                      {releavedStaff.length}
                    </span>
                  </button>
                </div>

                <span className="text-[11px] text-[var(--text-muted)]">
                  Showing {employeeTab === 'onboard' ? onboardedStaff.length : releavedStaff.length} staff
                </span>
              </div>

              <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-sm overflow-hidden">
                {employeeTab === 'onboard' ? (
                  onboardedStaff.length > 0 ? (
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] text-[var(--table-header-text)] font-extrabold uppercase text-[10px]">
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Emp Code</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Name</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Designation</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Client</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Site</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Weekly Off</th>
                          <th className="py-2 px-3">Mobile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                        {onboardedStaff.map((staff, idx) => (
                          <tr key={staff.oid || idx} className="hover:bg-sky-500/10 transition-colors">
                            <td className="py-2 px-3 border-r border-[var(--border-color)] font-mono text-[var(--text-muted)]">{staff.empCode}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] font-bold text-[var(--text-main)]">{staff.name}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] text-[var(--text-secondary)]">{staff.skillDesig}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] text-[var(--text-secondary)]">{staff.client}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] font-semibold text-sky-600 dark:text-sky-400">{staff.site}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] font-semibold text-[var(--text-secondary)]">{staff.weeklyOff || 'Sunday'}</td>
                            <td className="py-2 px-3 font-mono">{staff.mobile}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-[var(--text-muted)] text-xs font-medium">
                      <p>No onboarded employees currently assigned to designation: <span className="font-bold text-[var(--text-main)]">{selectedRows.join(', ')}</span>.</p>
                    </div>
                  )
                ) : (
                  releavedStaff.length > 0 ? (
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] text-[var(--table-header-text)] font-extrabold uppercase text-[10px]">
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Emp Code</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Name</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Designation</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Client</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Site</th>
                          <th className="py-2 px-3 border-r border-[var(--border-color)]">Weekly Off</th>
                          <th className="py-2 px-3">Mobile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                        {releavedStaff.map((staff, idx) => (
                          <tr key={staff.oid || idx} className="hover:bg-amber-500/10 transition-colors">
                            <td className="py-2 px-3 border-r border-[var(--border-color)] font-mono text-[var(--text-muted)]">{staff.empCode}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] font-bold text-[var(--text-main)]">{staff.name}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] text-[var(--text-secondary)]">{staff.skillDesig}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] text-[var(--text-secondary)]">{staff.client}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] font-semibold text-sky-600 dark:text-sky-400">{staff.site}</td>
                            <td className="py-2 px-3 border-r border-[var(--border-color)] font-semibold text-[var(--text-secondary)]">{staff.weeklyOff || 'Sunday'}</td>
                            <td className="py-2 px-3 font-mono">{staff.mobile}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-[var(--text-muted)] text-xs font-medium">
                      <p>No relieved employees currently recorded for designation: <span className="font-bold text-[var(--text-main)]">{selectedRows.join(', ')}</span>.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-12 text-center shadow-xs space-y-3 mt-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center mx-auto shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-main)]">
              Select Deployment Parameters
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              Please select a <strong>Client</strong>, <strong>Branch</strong>, and <strong>Site</strong> from the filters above and click <span className="text-sky-600 dark:text-sky-400 font-bold">Submit</span> to view deployment requirements and staff roster.
            </p>
          </div>
        )}

      </div>

      {/* EDIT DEPLOYMENT MODAL */}
      {editingRowItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-color)] w-full max-w-md overflow-hidden text-[var(--text-main)]">
            
            {/* Modal Header */}
            <div className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-500" />
                <span>Edit Deployment ({editingRowItem.designation})</span>
              </h3>
              <button
                onClick={() => setEditingRowItem(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded hover:bg-[var(--control-hover)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditModal} className="p-4 text-xs space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Required Count *</label>
                <input
                  type="number" min={0}
                  value={editDraft.required}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, required: e.target.value }))}
                  required
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Relieved Count</label>
                <input
                  type="number" min={0}
                  value={editDraft.releave}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, releave: e.target.value }))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Monday to Friday Requirement *</label>
                <input
                  type="number" min={0}
                  value={editDraft.monFri}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, monFri: e.target.value }))}
                  required
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Saturday Requirement *</label>
                <input
                  type="number" min={0}
                  value={editDraft.sat}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, sat: e.target.value }))}
                  required
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Sunday Requirement *</label>
                <input
                  type="number" min={0}
                  value={editDraft.sun}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, sun: e.target.value }))}
                  required
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingRowItem(null)}
                  className="px-4 py-1.5 border border-[var(--border-color)] rounded-md text-[var(--text-main)] hover:bg-[var(--control-hover)] font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-bold text-xs flex items-center space-x-1 transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ADD DEPLOYMENT ROW MODAL */}
      {isAddRowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-color)] w-full max-w-md overflow-hidden text-[var(--text-main)]">
            
            {/* Modal Header */}
            <div className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Add Deployment Row</span>
              </h3>
              <button
                onClick={() => setIsAddRowModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded hover:bg-[var(--control-hover)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddRowModal} className="p-4 text-xs space-y-3">
              {addRowError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[11px] font-semibold animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addRowError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                  Designation Name <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['RELIEVED', 'RELIEVER', 'GUNMAN', 'CCTV OPERATOR', 'DRIVER'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAddRowError('');
                        setNewRowDraft(prev => ({ ...prev, designation: preset }));
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        newRowDraft.designation === preset
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-[var(--control-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--control-hover)]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newRowDraft.designation}
                  onChange={(e) => {
                    setAddRowError('');
                    setNewRowDraft(prev => ({ ...prev, designation: e.target.value.toUpperCase() }));
                  }}
                  required
                  placeholder="Select preset above or type e.g. RELIEVED"
                  className={`w-full bg-[var(--input-bg)] border rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none font-bold transition-all ${
                    addRowError && !newRowDraft.designation?.trim()
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/40'
                      : 'border-[var(--input-border)] focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                    Required Count <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="number" min={0}
                    value={newRowDraft.required}
                    onChange={(e) => {
                      setAddRowError('');
                      setNewRowDraft(prev => ({ ...prev, required: e.target.value }));
                    }}
                    required
                    placeholder="Enter required count"
                    className={`w-full bg-[var(--input-bg)] border rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none font-mono font-bold transition-all ${
                      addRowError && (newRowDraft.required === '' || newRowDraft.required === null || isNaN(Number(newRowDraft.required)))
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/40'
                        : 'border-[var(--input-border)] focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                    Onboard Count <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="number" min={0}
                    value={newRowDraft.onboard}
                    onChange={(e) => {
                      setAddRowError('');
                      setNewRowDraft(prev => ({ ...prev, onboard: e.target.value }));
                    }}
                    required
                    placeholder="Enter onboard count"
                    className={`w-full bg-[var(--input-bg)] border rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none font-mono font-bold transition-all ${
                      addRowError && (newRowDraft.onboard === '' || newRowDraft.onboard === null || isNaN(Number(newRowDraft.onboard)))
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/40'
                        : 'border-[var(--input-border)] focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Monday to Friday Requirement</label>
                <input
                  type="number" min={0}
                  value={newRowDraft.monFri}
                  onChange={(e) => setNewRowDraft(prev => ({ ...prev, monFri: e.target.value }))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Saturday Requirement</label>
                  <input
                    type="number" min={0}
                    value={newRowDraft.sat}
                    onChange={(e) => setNewRowDraft(prev => ({ ...prev, sat: e.target.value }))}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Sunday Requirement</label>
                  <input
                    type="number" min={0}
                    value={newRowDraft.sun}
                    onChange={(e) => setNewRowDraft(prev => ({ ...prev, sun: e.target.value }))}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddRowModalOpen(false)}
                  className="px-4 py-1.5 border border-[var(--border-color)] rounded-md text-[var(--text-main)] hover:bg-[var(--control-hover)] font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-xs flex items-center space-x-1 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
