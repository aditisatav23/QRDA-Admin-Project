import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Download, 
  ChevronDown, 
  X, 
  Search, 
  RotateCw, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileSpreadsheet,
  Building,
  MapPin,
  Users,
  ShieldCheck,
  AlertCircle,
  Eye,
  Info
} from 'lucide-react';
import { payrollAttendanceApi, locationApi } from '../services/apiService';
import { INITIAL_PAYROLL_ATTENDANCE } from '../data/payrollAttendanceData';
import { 
  TIMELOGS_CLIENT_OPTIONS, 
  TIMELOGS_BRANCH_OPTIONS, 
  TIMELOGS_SITE_OPTIONS 
} from '../data/timeLogsData';
import SearchableSelect from './SearchableSelect';

export default function PayrollAttendanceSiteWisePage() {
  // Filter States
  const [client, setClient] = useState('Tata Communications');
  const [branch, setBranch] = useState('Mumbai');
  const [month, setMonth] = useState('Sep/2026');
  const [selectedSite, setSelectedSite] = useState('TCL BKC');
  const [showDetails, setShowDetails] = useState(false);

  // Live Meta Options
  const [liveClients, setLiveClients] = useState([]);
  const [liveSites, setLiveSites] = useState([]);

  // Data State
  const [data, setData] = useState(INITIAL_PAYROLL_ATTENDANCE);
  const [loading, setLoading] = useState(false);
  const [selectedCellInfo, setSelectedCellInfo] = useState(null);

  // Load clients and sites metadata from backend
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cls, sts] = await Promise.all([
          locationApi.getClients(),
          locationApi.getSites()
        ]);
        if (cls?.length) setLiveClients(cls);
        if (sts?.length) setLiveSites(sts);
      } catch (err) {
        console.warn('Metadata load error:', err);
      }
    }
    loadMeta();
  }, []);

  // Compute available clients
  const clientOptions = useMemo(() => {
    const liveC = liveClients.map(c => typeof c === 'string' ? c : c.name || c.client).filter(Boolean);
    return Array.from(new Set([...liveC, ...TIMELOGS_CLIENT_OPTIONS])).sort();
  }, [liveClients]);

  // Compute available branches based on client
  const branchOptions = useMemo(() => {
    let branches = [];
    if (client) {
      branches = liveSites
        .filter(s => (s.client || '').toLowerCase() === client.toLowerCase())
        .map(s => s.branch)
        .filter(Boolean);
      const staticB = TIMELOGS_BRANCH_OPTIONS[client];
      if (staticB) branches.push(...staticB);
      if (branches.length === 0) {
        branches = liveSites
          .filter(s => (s.client || '').toLowerCase().includes(client.toLowerCase()))
          .map(s => s.branch)
          .filter(Boolean);
      }
    }
    const unique = Array.from(new Set(branches)).filter(Boolean).sort();
    return unique.length > 0 ? unique : ['Mumbai', 'Delhi', 'Pune', 'Hyderabad', 'Bengaluru'];
  }, [client, liveSites]);

  // Compute available sites based on client and branch
  const siteOptions = useMemo(() => {
    let sites = [];
    if (client) {
      sites = liveSites
        .filter(s => {
          const matchClient = (s.client || '').toLowerCase().includes(client.toLowerCase());
          const matchBranch = !branch || (s.branch || '').toLowerCase().includes(branch.toLowerCase());
          return matchClient && matchBranch;
        })
        .map(s => s.name || s.site)
        .filter(Boolean);

      const staticKey = `${client}|${branch}`;
      const staticSites = TIMELOGS_SITE_OPTIONS[staticKey];
      if (staticSites) sites.push(...staticSites);
    }
    const unique = Array.from(new Set(sites)).filter(Boolean).sort();
    return unique.length > 0 ? unique : ['TCL BKC', 'TCL VSB', 'TCL Equinox', 'TCL LVSB'];
  }, [client, branch, liveSites]);

  // Handle Client change
  const handleClientChange = (newClient) => {
    setClient(newClient);
    const validBranches = TIMELOGS_BRANCH_OPTIONS[newClient] || ['Mumbai'];
    const newBranch = validBranches[0] || '';
    setBranch(newBranch);
    const staticKey = `${newClient}|${newBranch}`;
    const newSites = TIMELOGS_SITE_OPTIONS[staticKey] || ['TCL BKC'];
    setSelectedSite(newSites[0] || '');
  };

  // Handle Branch change
  const handleBranchChange = (newBranch) => {
    setBranch(newBranch);
    const staticKey = `${client}|${newBranch}`;
    const newSites = TIMELOGS_SITE_OPTIONS[staticKey] || siteOptions;
    if (newSites && newSites.length > 0) {
      setSelectedSite(newSites[0]);
    }
  };

  // Fetch Attendance Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await payrollAttendanceApi.getSiteWise({
        client,
        branch,
        site: selectedSite,
        month,
        show_details: showDetails
      });
      if (res && res.groups && res.groups.length > 0) {
        setData(res);
      } else {
        // If query returned no groups, fall back to initial reference data
        setData(INITIAL_PAYROLL_ATTENDANCE);
      }
    } catch (err) {
      console.warn('Failed to fetch payroll attendance:', err);
      setData(INITIAL_PAYROLL_ATTENDANCE);
    } finally {
      setLoading(false);
    }
  }, [client, branch, selectedSite, month, showDetails]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Monthly Summary calculation helpers
  const getRowSummary = (row) => {
    if (row.summary) return row.summary;
    let totalWorked = 0;
    let totalDuty = 0;
    let totalOt = 0;
    let weeklyOff = 0;
    let absent = 0;
    let nh = 0;
    let extDuty = 0;

    if (row.days) {
      Object.values(row.days).forEach(cell => {
        if (!cell) return;
        const status = String(cell.status || '').trim();
        const hrs = parseFloat(cell.hours) || parseFloat(status) || 0;
        if (status === 'WO' || cell.is_wo) {
          weeklyOff += 1;
        } else if (status === 'A' || cell.is_absent) {
          absent += 1;
        } else if (status === 'NH') {
          nh += 1;
        } else if (hrs > 0) {
          totalWorked += hrs;
          if (hrs > 8.0) {
            totalDuty += 8.0;
            totalOt += (hrs - 8.0);
          } else {
            totalDuty += hrs;
          }
        }
      });
    }
    return {
      nh,
      total_worked_hrs: totalWorked,
      total_duty_hrs: totalDuty,
      total_ot_hrs: totalOt,
      weekly_off_days: weeklyOff,
      absent_days: absent,
      ext_duty_hrs: extDuty
    };
  };

  const getGroupSummaryTotals = (group) => {
    if (group.summaryTotals) return group.summaryTotals;
    const totals = { nh: 0, total_worked_hrs: 0, total_duty_hrs: 0, total_ot_hrs: 0, weekly_off_days: 0, absent_days: 0, ext_duty_hrs: 0 };
    if (group.rows) {
      group.rows.forEach(r => {
        const s = getRowSummary(r);
        totals.nh += (s.nh || 0);
        totals.total_worked_hrs += (s.total_worked_hrs || 0);
        totals.total_duty_hrs += (s.total_duty_hrs || 0);
        totals.total_ot_hrs += (s.total_ot_hrs || 0);
        totals.weekly_off_days += (s.weekly_off_days || 0);
        totals.absent_days += (s.absent_days || 0);
        totals.ext_duty_hrs += (s.ext_duty_hrs || 0);
      });
    }
    return totals;
  };

  const getGrandSummaryTotals = (attendanceData) => {
    if (attendanceData.grandSummaryTotals) return attendanceData.grandSummaryTotals;
    const totals = { nh: 0, total_worked_hrs: 0, total_duty_hrs: 0, total_ot_hrs: 0, weekly_off_days: 0, absent_days: 0, ext_duty_hrs: 0 };
    if (attendanceData.groups) {
      attendanceData.groups.forEach(g => {
        const gst = getGroupSummaryTotals(g);
        totals.nh += (gst.nh || 0);
        totals.total_worked_hrs += (gst.total_worked_hrs || 0);
        totals.total_duty_hrs += (gst.total_duty_hrs || 0);
        totals.total_ot_hrs += (gst.total_ot_hrs || 0);
        totals.weekly_off_days += (gst.weekly_off_days || 0);
        totals.absent_days += (gst.absent_days || 0);
        totals.ext_duty_hrs += (gst.ext_duty_hrs || 0);
      });
    }
    return totals;
  };

  // Bottom Totals calculation (Worked Hours Total, Duty Hours Total, OT Hours Total)
  const bottomTotals = useMemo(() => {
    const worked = {};
    const duty = {};
    const ot = {};

    if (data.workedHoursTotals && data.dutyHoursTotals && data.otHoursTotals) {
      return {
        worked: data.workedHoursTotals,
        duty: data.dutyHoursTotals,
        ot: data.otHoursTotals
      };
    }

    if (data.days) {
      data.days.forEach(d => {
        let dayWorked = 0.0;
        let dayOt = 0.0;

        if (data.groups) {
          data.groups.forEach(g => {
            if (g.rows) {
              g.rows.forEach(r => {
                const cell = r.days ? r.days[d.day] : null;
                if (cell) {
                  const hrs = parseFloat(cell.hours) || parseFloat(cell.status) || 0.0;
                  if (cell.is_ot || hrs > 8.0) {
                    dayWorked += hrs;
                    dayOt += (hrs > 8.0 ? hrs - 8.0 : hrs);
                  } else if (hrs > 0) {
                    dayWorked += hrs;
                  }
                }
              });
            }
          });
        }

        if (dayWorked === 0.0 && data.grandTotals && data.grandTotals[d.day] !== undefined) {
          dayWorked = parseFloat(data.grandTotals[d.day]) || 0.0;
        }

        worked[d.day] = Math.round(dayWorked * 10) / 10;
        ot[d.day] = Math.round(dayOt * 10) / 10;
        duty[d.day] = Math.round(Math.max(0, dayWorked - dayOt) * 10) / 10;
      });
    }

    return { worked, duty, ot };
  }, [data]);

  // Export To Excel (CSV format with full BOM for direct Excel compatibility)
  const handleExportToExcel = () => {
    if (!data || !data.groups) return;

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += `"Payroll Attendance Site Wise"\n`;
    csvContent += `"Site:","${data.site_title || selectedSite}","Month:","${month}","Client:","${client}","Branch:","${branch}"\n\n`;

    // Header Row 1: Columns
    const headerCols = ['Sr. No.', 'Emp. Site', 'Rank', 'Emp. Code', 'Emp. Name', 'Duty Type'];
    data.days.forEach(d => {
      headerCols.push(`${d.day} (${d.shortDay})`);
    });
    // Add monthly summary columns
    headerCols.push(
      'NH',
      'Total Worked Hrs',
      'Total Duty Hrs',
      'Total OT Hrs',
      'Weekly Off Days',
      'Absent Days',
      'Ext. Duty Hrs'
    );
    csvContent += headerCols.map(c => `"${c}"`).join(',') + '\n';

    // Loop through groups
    data.groups.forEach(group => {
      // Group header
      csvContent += `"${group.rank}",,,,,` + 
        data.days.map(d => `"${d.day}"`).join(',') + 
        ',"NH","Total Worked Hrs","Total Duty Hrs","Total OT Hrs","Weekly Off Days","Absent Days","Ext. Duty Hrs"\n';

      // Rows in group
      group.rows.forEach(r => {
        const rowCols = [
          r.sr_no,
          r.emp_site,
          r.rank,
          r.emp_code,
          r.emp_name,
          r.duty_type
        ];
        data.days.forEach(d => {
          const cell = r.days[d.day];
          rowCols.push(cell ? cell.status : '');
        });
        const s = getRowSummary(r);
        rowCols.push(
          s.nh !== undefined ? s.nh : 0,
          Number(s.total_worked_hrs || 0).toFixed(1),
          Number(s.total_duty_hrs || 0).toFixed(1),
          Number(s.total_ot_hrs || 0).toFixed(1),
          s.weekly_off_days || 0,
          s.absent_days || 0,
          Number(s.ext_duty_hrs || 0).toFixed(1)
        );
        csvContent += rowCols.map(c => `"${c}"`).join(',') + '\n';
      });

      // Sub Total Row
      const subTotalCols = [`${group.rank} - Sub Total:`, '', '', '', '', ''];
      data.days.forEach(d => {
        const val = group.subTotals ? group.subTotals[d.day] : 0;
        subTotalCols.push(val !== undefined && val !== null ? Number(val).toFixed(1) : '0.0');
      });
      const gst = getGroupSummaryTotals(group);
      subTotalCols.push(
        gst.nh !== undefined ? gst.nh : 0,
        Number(gst.total_worked_hrs || 0).toFixed(1),
        Number(gst.total_duty_hrs || 0).toFixed(1),
        Number(gst.total_ot_hrs || 0).toFixed(1),
        gst.weekly_off_days || 0,
        gst.absent_days || 0,
        Number(gst.ext_duty_hrs || 0).toFixed(1)
      );
      csvContent += subTotalCols.map(c => `"${c}"`).join(',') + '\n';
    });

    // Bottom 3 Grand Total Rows
    const grandSum = getGrandSummaryTotals(data);

    // 1. Worked Hours Total Row
    const workedCols = ['Worked Hours Total:', '', '', '', '', ''];
    data.days.forEach(d => {
      const val = bottomTotals.worked[d.day] ?? (data.grandTotals ? data.grandTotals[d.day] : 0);
      workedCols.push(val !== undefined && val !== null ? Number(val).toFixed(1) : '0.0');
    });
    workedCols.push(
      grandSum.nh !== undefined ? grandSum.nh : 0,
      Number(grandSum.total_worked_hrs || 0).toFixed(1),
      Number(grandSum.total_duty_hrs || 0).toFixed(1),
      Number(grandSum.total_ot_hrs || 0).toFixed(1),
      grandSum.weekly_off_days || 0,
      grandSum.absent_days || 0,
      Number(grandSum.ext_duty_hrs || 0).toFixed(1)
    );
    csvContent += workedCols.map(c => `"${c}"`).join(',') + '\n';

    // 2. Duty Hours Total Row
    const dutyCols = ['Duty Hours Total:', '', '', '', '', ''];
    data.days.forEach(d => {
      const val = bottomTotals.duty[d.day] ?? 0;
      dutyCols.push(val !== undefined && val !== null ? Number(val).toFixed(1) : '0.0');
    });
    dutyCols.push(
      '-',
      Number(grandSum.total_duty_hrs || 0).toFixed(1),
      Number(grandSum.total_duty_hrs || 0).toFixed(1),
      '0.0',
      '-',
      '-',
      '-'
    );
    csvContent += dutyCols.map(c => `"${c}"`).join(',') + '\n';

    // 3. OT Hours Total Row
    const otCols = ['OT Hours Total:', '', '', '', '', ''];
    data.days.forEach(d => {
      const val = bottomTotals.ot[d.day] ?? 0;
      otCols.push(val !== undefined && val !== null ? Number(val).toFixed(1) : '0.0');
    });
    otCols.push(
      '-',
      Number(grandSum.total_ot_hrs || 0).toFixed(1),
      '0.0',
      Number(grandSum.total_ot_hrs || 0).toFixed(1),
      '-',
      '-',
      '-'
    );
    csvContent += otCols.map(c => `"${c}"`).join(',') + '\n\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const sanitizedSite = (selectedSite || 'Site').replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedMonth = month.replace('/', '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `Payroll_Attendance_SiteWise_${sanitizedSite}_${sanitizedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for cell styling
  const getCellClasses = (cell) => {
    if (!cell) return 'text-slate-400';
    const status = String(cell.status).trim();
    if (status === 'IN' || cell.is_in) {
      return 'text-red-600 dark:text-red-500 font-extrabold';
    }
    if (status === '12.0' || status === '4.0' || cell.is_ot) {
      return 'text-fuchsia-600 dark:text-fuchsia-400 font-bold';
    }
    if (status === 'WO' || cell.is_wo) {
      return 'text-slate-700 dark:text-slate-300 font-bold';
    }
    if (status === 'A' || cell.is_absent) {
      return 'text-slate-400 dark:text-slate-500';
    }
    return 'text-slate-800 dark:text-slate-100 font-medium';
  };

  return (
    <div className="flex flex-col min-h-full bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-200">
      
      {/* Top Banner Header matching the reference screenshot */}
      <div className="bg-[#1b5380] text-white px-6 py-3.5 shadow-md flex flex-col justify-center">
        <h1 className="text-xl font-bold tracking-tight text-center leading-tight">
          Payroll Attendance Site Wise
        </h1>
        <p className="text-xs text-sky-100 italic text-center mt-0.5 tracking-wide">
          Lists the employees attendance marked at respective site
        </p>
      </div>

      <div className="p-4 space-y-4 max-w-[100vw]">
        
        {/* Filter Controls Bar */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-xs font-medium">
            
            {/* Client: * */}
            <div className="flex items-center space-x-1.5">
              <label className="text-[var(--text-main)] font-semibold shrink-0">
                Client: <span className="text-red-500 font-bold">*</span>
              </label>
              <SearchableSelect
                value={client}
                onChange={handleClientChange}
                options={clientOptions}
                placeholder="Select Client"
                searchPlaceholder="Search client..."
                minWidth="min-w-[200px]"
              />
            </div>

            {/* Branch: * */}
            <div className="flex items-center space-x-1.5">
              <label className="text-[var(--text-main)] font-semibold shrink-0">
                Branch: <span className="text-red-500 font-bold">*</span>
              </label>
              <SearchableSelect
                value={branch}
                onChange={handleBranchChange}
                options={branchOptions}
                placeholder="Select Branch"
                searchPlaceholder="Search branch..."
                minWidth="min-w-[130px]"
              />
            </div>

            {/* Month: */}
            <div className="flex items-center space-x-1.5">
              <label className="text-[var(--text-main)] font-semibold shrink-0">
                Month:
              </label>
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="pl-2.5 pr-8 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--control-bg)] text-[var(--text-main)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer appearance-none min-w-[110px]"
                >
                  <option value="Sep/2026">Sep/2026</option>
                  <option value="Aug/2026">Aug/2026</option>
                  <option value="Jul/2026">Jul/2026</option>
                  <option value="Jun/2026">Jun/2026</option>
                  <option value="May/2026">May/2026</option>
                  <option value="Apr/2026">Apr/2026</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Sites: Tag Selector */}
            <div className="flex items-center space-x-1.5">
              <label className="text-[var(--text-main)] font-semibold shrink-0">
                Sites:
              </label>
              <SearchableSelect
                value={selectedSite}
                onChange={(newSite) => setSelectedSite(newSite)}
                options={siteOptions}
                placeholder="Select Site"
                searchPlaceholder="Search site..."
                minWidth="min-w-[160px]"
              />
            </div>

            {/* Show details toggle switch */}
            <div className="flex items-center space-x-2 ml-auto lg:ml-0">
              <label htmlFor="showDetailsSwitch" className="text-[var(--text-secondary)] font-semibold text-xs cursor-pointer select-none">
                Show details
              </label>
              <button
                id="showDetailsSwitch"
                type="button"
                role="switch"
                aria-checked={showDetails}
                onClick={() => setShowDetails(!showDetails)}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ease-in-out ${
                  showDetails ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    showDetails ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-auto">
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-1.5 bg-[#2382c4] hover:bg-[#1a6fa8] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Submit</span>
              </button>

              <button
                onClick={handleExportToExcel}
                className="px-4 py-1.5 bg-[#2382c4] hover:bg-[#1a6fa8] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                title="Download formatted Excel/CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export To Excel</span>
              </button>
            </div>

          </div>
        </div>

        {/* Site Section Subtitle / Header */}
        <div className="flex items-center justify-between">
          <div className="text-sky-700 dark:text-sky-400 font-extrabold text-sm tracking-wide uppercase flex items-center space-x-2">
            <span>{data.site_title || `${selectedSite} (${data.channel || 'QR_CODE'})`}</span>
            {loading && <span className="text-[10px] text-slate-400 normal-case font-normal">(Refreshing...)</span>}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono">
            Month: <span className="font-bold text-[var(--text-main)]">{month}</span> | Employees: <span className="font-bold text-[var(--text-main)]">{data.total_employees || 7}</span>
          </div>
        </div>

        {/* Main Attendance Grid Table with sticky columns and scrollability */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-center border-collapse text-xs select-none">
              
              {/* Table Header: Columns */}
              <thead>
                <tr className="bg-slate-200 dark:bg-slate-800 text-[var(--text-main)] border-b border-[var(--border-color)] text-[11px] font-bold">
                  {/* Fixed left headers */}
                  <th className="sticky left-0 z-20 bg-slate-200 dark:bg-slate-800 px-2 py-2 border-r border-[var(--border-color)] min-w-[50px] shadow-2xs">
                    Sr. No.
                  </th>
                  <th className="sticky left-[50px] z-20 bg-slate-200 dark:bg-slate-800 px-2 py-2 border-r border-[var(--border-color)] min-w-[70px] shadow-2xs">
                    Emp. Site
                  </th>
                  <th className="sticky left-[120px] z-20 bg-slate-200 dark:bg-slate-800 px-2 py-2 border-r border-[var(--border-color)] min-w-[65px] shadow-2xs">
                    Rank
                  </th>
                  <th className="sticky left-[185px] z-20 bg-slate-200 dark:bg-slate-800 px-2 py-2 border-r border-[var(--border-color)] min-w-[75px] shadow-2xs">
                    Emp. Code
                  </th>
                  <th className="sticky left-[260px] z-20 bg-slate-200 dark:bg-slate-800 px-3 py-2 border-r border-[var(--border-color)] text-left min-w-[130px] shadow-2xs">
                    Emp. Name
                  </th>
                  <th className="sticky left-[390px] z-20 bg-slate-200 dark:bg-slate-800 px-2 py-2 border-r border-[var(--border-color)] min-w-[95px] shadow-2xs">
                    Duty Type
                  </th>

                  {/* Day Columns 1 to N */}
                  {data.days.map((d) => (
                    <th 
                      key={d.day} 
                      className={`px-1.5 py-1.5 border-r border-[var(--border-color)] min-w-[36px] font-bold ${
                        d.shortDay === 'Su' ? 'bg-slate-300/60 dark:bg-slate-700/60' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-[12px]">{d.day}</span>
                        <span className="text-[10px] font-normal text-[var(--text-muted)] mt-0.5">{d.shortDay}</span>
                      </div>
                    </th>
                  ))}

                  {/* Monthly Record Summary Columns after daily record */}
                  <th className="px-2 py-1.5 border-r border-[var(--border-color)] min-w-[45px] text-[11px] font-bold">
                    NH
                  </th>
                  <th className="px-2 py-1.5 border-r border-amber-300 dark:border-amber-800 bg-[#fef9c3] dark:bg-amber-950/60 text-slate-900 dark:text-amber-200 min-w-[70px] text-[11px] font-bold leading-tight">
                    Total<br />Worked<br />Hrs
                  </th>
                  <th className="px-2 py-1.5 border-r border-amber-300 dark:border-amber-800 bg-[#fef9c3] dark:bg-amber-950/60 text-slate-900 dark:text-amber-200 min-w-[65px] text-[11px] font-bold leading-tight">
                    Total<br />Duty<br />Hrs
                  </th>
                  <th className="px-2 py-1.5 border-r border-amber-300 dark:border-amber-800 bg-[#fef9c3] dark:bg-amber-950/60 text-slate-900 dark:text-amber-200 min-w-[65px] text-[11px] font-bold leading-tight">
                    Total<br />OT<br />Hrs
                  </th>
                  <th className="px-2 py-1.5 border-r border-orange-300 dark:border-orange-800 bg-[#ffedd5] dark:bg-orange-950/50 text-slate-900 dark:text-orange-200 min-w-[65px] text-[11px] font-bold leading-tight">
                    Weekly<br />Off<br />Days
                  </th>
                  <th className="px-2 py-1.5 border-r border-orange-300 dark:border-orange-800 bg-[#ffedd5] dark:bg-orange-950/50 text-slate-900 dark:text-orange-200 min-w-[60px] text-[11px] font-bold leading-tight">
                    Absent<br />Days
                  </th>
                  <th className="px-2 py-1.5 border-r border-orange-300 dark:border-orange-800 bg-[#ffedd5] dark:bg-orange-950/50 text-slate-900 dark:text-orange-200 min-w-[65px] text-[11px] font-bold leading-tight">
                    Ext.<br />Duty<br />Hrs
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[var(--border-color)]">
                {data.groups && data.groups.map((group, gIdx) => (
                  <React.Fragment key={group.rank || gIdx}>
                    
                    {/* Rank Group Header Bar (Yellow Row from reference image) */}
                    <tr className="bg-[#fef08a] dark:bg-amber-900/60 text-slate-900 dark:text-amber-100 font-extrabold text-[12px] border-t-2 border-amber-300 dark:border-amber-700">
                      {/* Left sticky title */}
                      <td 
                        colSpan={6} 
                        className="sticky left-0 z-10 bg-[#fef08a] dark:bg-amber-900 text-left px-3 py-1.5 border-r border-amber-300 dark:border-amber-700 uppercase tracking-wider"
                      >
                        {group.rank}
                      </td>

                      {/* Day numbers across the header */}
                      {data.days.map((d) => (
                        <td 
                          key={d.day} 
                          className="px-1 py-1 border-r border-amber-200 dark:border-amber-800 text-[11px]"
                        >
                          {d.day}
                        </td>
                      ))}

                      {/* Summary column titles in the yellow rank sub-header */}
                      <td className="px-1.5 py-1 border-r border-amber-300 dark:border-amber-700 text-center font-bold text-[11px]">
                        NH
                      </td>
                      <td className="px-1.5 py-1 border-r border-amber-300 dark:border-amber-700 text-center font-bold text-[11px] leading-tight">
                        Total<br />Worked<br />Hrs
                      </td>
                      <td className="px-1.5 py-1 border-r border-amber-300 dark:border-amber-700 text-center font-bold text-[11px] leading-tight">
                        Total<br />Duty<br />Hrs
                      </td>
                      <td className="px-1.5 py-1 border-r border-amber-300 dark:border-amber-700 text-center font-bold text-[11px] leading-tight">
                        Total<br />OT<br />Hrs
                      </td>
                      <td className="px-1.5 py-1 border-r border-amber-300 dark:border-amber-700 text-center font-bold text-[11px] leading-tight">
                        Weekly<br />Off<br />Days
                      </td>
                      <td className="px-1.5 py-1 border-r border-amber-300 dark:border-amber-700 text-center font-bold text-[11px] leading-tight">
                        Absent<br />Days
                      </td>
                      <td className="px-1.5 py-1 border-r border-amber-300 dark:border-amber-700 text-center font-bold text-[11px] leading-tight">
                        Ext.<br />Duty<br />Hrs
                      </td>
                    </tr>

                    {/* Employee Rows in this Rank */}
                    {group.rows.map((row) => (
                      <tr 
                        key={row.emp_code || row.sr_no} 
                        className="hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Fixed Left Metadata Columns */}
                        <td className="sticky left-0 z-10 bg-[var(--bg-card)] px-2 py-2 border-r border-[var(--border-color)] text-center font-mono text-slate-500">
                          {row.sr_no}
                        </td>
                        <td className="sticky left-[50px] z-10 bg-[var(--bg-card)] px-2 py-2 border-r border-[var(--border-color)] font-semibold text-[11px] truncate">
                          {row.emp_site}
                        </td>
                        <td className="sticky left-[120px] z-10 bg-[var(--bg-card)] px-2 py-2 border-r border-[var(--border-color)] font-bold text-[11px] text-slate-700 dark:text-slate-300">
                          {row.rank}
                        </td>
                        <td className="sticky left-[185px] z-10 bg-[var(--bg-card)] px-2 py-2 border-r border-[var(--border-color)] font-mono font-bold text-[11px]">
                          {row.emp_code}
                        </td>
                        <td className="sticky left-[260px] z-10 bg-[var(--bg-card)] px-3 py-2 border-r border-[var(--border-color)] text-left font-bold text-xs truncate">
                          {row.emp_name}
                        </td>
                        <td className="sticky left-[390px] z-10 bg-[var(--bg-card)] px-2 py-2 border-r border-[var(--border-color)] text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                          {row.duty_type}
                        </td>

                        {/* Calendar Day Attendance Cells */}
                        {data.days.map((d) => {
                          const cell = row.days ? row.days[d.day] : null;
                          const cellText = cell ? cell.status : '-';
                          const hasDetails = cell && (cell.shift || cell.punches);

                          return (
                            <td 
                              key={d.day}
                              onClick={() => {
                                if (cell) {
                                  setSelectedCellInfo({
                                    employee: row.emp_name,
                                    code: row.emp_code,
                                    rank: row.rank,
                                    day: d.day,
                                    shortDay: d.shortDay,
                                    date: `${d.day} ${month}`,
                                    ...cell
                                  });
                                }
                              }}
                              className={`px-1 py-1.5 border-r border-[var(--border-color)] text-[11px] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                                d.shortDay === 'Su' ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''
                              } ${getCellClasses(cell)}`}
                              title={cell?.punches ? `Punches: ${cell.punches}` : undefined}
                            >
                              <div className="flex flex-col items-center">
                                <span>{cellText}</span>
                                {showDetails && hasDetails && (
                                  <span className="text-[8px] text-[var(--text-muted)] scale-90 whitespace-nowrap leading-none mt-0.5 font-normal">
                                    {cell.shift ? cell.shift.split(' - ')[0] : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Summary data cells for this employee */}
                        {(() => {
                          const s = getRowSummary(row);
                          return (
                            <>
                              <td className="px-1 py-1.5 border-r border-[var(--border-color)] text-center font-mono font-medium text-[11px]">
                                {s.nh !== undefined ? s.nh : 0}
                              </td>
                              <td className="px-1 py-1.5 border-r border-amber-200 dark:border-amber-800 bg-[#fef9c3] dark:bg-amber-950/40 text-center font-mono font-bold text-[11px] text-slate-800 dark:text-amber-200">
                                {Number(s.total_worked_hrs || 0).toFixed(1)}
                              </td>
                              <td className="px-1 py-1.5 border-r border-amber-200 dark:border-amber-800 bg-[#fef9c3] dark:bg-amber-950/40 text-center font-mono font-bold text-[11px] text-slate-800 dark:text-amber-200">
                                {Number(s.total_duty_hrs || 0).toFixed(1)}
                              </td>
                              <td className="px-1 py-1.5 border-r border-amber-200 dark:border-amber-800 bg-[#fef9c3] dark:bg-amber-950/40 text-center font-mono font-bold text-[11px] text-slate-800 dark:text-amber-200">
                                {Number(s.total_ot_hrs || 0).toFixed(1)}
                              </td>
                              <td className="px-1 py-1.5 border-r border-orange-200 dark:border-orange-800 bg-[#ffedd5] dark:bg-orange-950/40 text-center font-mono font-bold text-[11px] text-slate-800 dark:text-orange-200">
                                {s.weekly_off_days || 0}
                              </td>
                              <td className="px-1 py-1.5 border-r border-orange-200 dark:border-orange-800 bg-[#ffedd5] dark:bg-orange-950/40 text-center font-mono font-bold text-[11px] text-slate-800 dark:text-orange-200">
                                {s.absent_days || 0}
                              </td>
                              <td className="px-1 py-1.5 border-r border-orange-200 dark:border-orange-800 bg-[#ffedd5] dark:bg-orange-950/40 text-center font-mono font-bold text-[11px] text-slate-800 dark:text-orange-200">
                                {Number(s.ext_duty_hrs || 0).toFixed(1)}
                              </td>
                            </>
                          );
                        })()}
                      </tr>
                    ))}

                    {/* Sub Total Row for this Rank Group */}
                    <tr className="bg-[#fef9c3] dark:bg-amber-950/40 text-slate-900 dark:text-amber-200 font-bold text-[11px] border-t border-b border-amber-200 dark:border-amber-800">
                      <td 
                        colSpan={6} 
                        className="sticky left-0 z-10 bg-[#fef9c3] dark:bg-amber-950 text-right pr-3 py-1.5 border-r border-amber-200 dark:border-amber-800 font-extrabold"
                      >
                        {group.rank} - Sub Total:
                      </td>

                      {data.days.map((d) => {
                        const val = group.subTotals ? group.subTotals[d.day] : 0;
                        const displayVal = (val !== undefined && val !== null && val > 0) ? Number(val).toFixed(1) : (val === 0 ? '0.0' : '-');
                        return (
                          <td 
                            key={d.day} 
                            className="px-1 py-1.5 border-r border-amber-200 dark:border-amber-800 text-center font-mono font-bold text-[11px]"
                          >
                            {displayVal}
                          </td>
                        );
                      })}

                      {/* Sub Total summary values */}
                      {(() => {
                        const gst = getGroupSummaryTotals(group);
                        return (
                          <>
                            <td className="px-1 py-1.5 border-r border-amber-200 dark:border-amber-800 text-center font-mono font-bold text-[11px]">
                              {gst.nh !== undefined ? gst.nh : 0}
                            </td>
                            <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-800 bg-[#fef08a] dark:bg-amber-900/60 text-center font-mono font-extrabold text-[11px] text-slate-900 dark:text-amber-100">
                              {Number(gst.total_worked_hrs || 0).toFixed(1)}
                            </td>
                            <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-800 bg-[#fef08a] dark:bg-amber-900/60 text-center font-mono font-extrabold text-[11px] text-slate-900 dark:text-amber-100">
                              {Number(gst.total_duty_hrs || 0).toFixed(1)}
                            </td>
                            <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-800 bg-[#fef08a] dark:bg-amber-900/60 text-center font-mono font-extrabold text-[11px] text-slate-900 dark:text-amber-100">
                              {Number(gst.total_ot_hrs || 0).toFixed(1)}
                            </td>
                            <td className="px-1 py-1.5 border-r border-orange-300 dark:border-orange-800 bg-[#fed7aa] dark:bg-orange-900/60 text-center font-mono font-extrabold text-[11px] text-slate-900 dark:text-orange-100">
                              {gst.weekly_off_days || 0}
                            </td>
                            <td className="px-1 py-1.5 border-r border-orange-300 dark:border-orange-800 bg-[#fed7aa] dark:bg-orange-900/60 text-center font-mono font-extrabold text-[11px] text-slate-900 dark:text-orange-100">
                              {gst.absent_days || 0}
                            </td>
                            <td className="px-1 py-1.5 border-r border-orange-300 dark:border-orange-800 bg-[#fed7aa] dark:bg-orange-900/60 text-center font-mono font-extrabold text-[11px] text-slate-900 dark:text-orange-100">
                              {Number(gst.ext_duty_hrs || 0).toFixed(1)}
                            </td>
                          </>
                        );
                      })()}
                    </tr>

                  </React.Fragment>
                ))}

                {/* Bottom 3 Summary Rows matching reference screenshot */}
                {(() => {
                  const grandSum = getGrandSummaryTotals(data);
                  return (
                    <>
                      {/* 1. Worked Hours Total Row */}
                      <tr className="bg-[#fef08a] dark:bg-amber-900/60 text-slate-900 dark:text-amber-100 font-extrabold text-[12px] border-t-2 border-amber-300 dark:border-amber-700">
                        <td 
                          colSpan={6} 
                          className="sticky left-0 z-10 bg-[#fef08a] dark:bg-amber-900 text-right pr-3 py-1.5 border-r border-amber-300 dark:border-amber-700 font-extrabold"
                        >
                          Worked Hours Total:
                        </td>

                        {data.days.map((d) => {
                          const val = bottomTotals.worked[d.day] ?? (data.grandTotals ? data.grandTotals[d.day] : 0);
                          return (
                            <td 
                              key={d.day} 
                              className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]"
                            >
                              {Number(val || 0).toFixed(1)}
                            </td>
                          );
                        })}

                        {/* Summary Columns for Worked Hours Total */}
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {grandSum.nh !== undefined ? grandSum.nh : 0}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {Number(grandSum.total_worked_hrs || 0).toFixed(1)}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {Number(grandSum.total_duty_hrs || 0).toFixed(1)}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {Number(grandSum.total_ot_hrs || 0).toFixed(1)}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {grandSum.weekly_off_days || 0}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {grandSum.absent_days || 0}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {Number(grandSum.ext_duty_hrs || 0).toFixed(1)}
                        </td>
                      </tr>

                      {/* 2. Duty Hours Total Row */}
                      <tr className="bg-[#fef08a] dark:bg-amber-900/60 text-slate-900 dark:text-amber-100 font-extrabold text-[12px] border-t border-amber-300 dark:border-amber-700">
                        <td 
                          colSpan={6} 
                          className="sticky left-0 z-10 bg-[#fef08a] dark:bg-amber-900 text-right pr-3 py-1.5 border-r border-amber-300 dark:border-amber-700 font-extrabold"
                        >
                          Duty Hours Total:
                        </td>

                        {data.days.map((d) => {
                          const val = bottomTotals.duty[d.day] ?? 0;
                          return (
                            <td 
                              key={d.day} 
                              className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]"
                            >
                              {Number(val || 0).toFixed(1)}
                            </td>
                          );
                        })}

                        {/* Summary Columns for Duty Hours Total */}
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          -
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {Number(grandSum.total_duty_hrs || 0).toFixed(1)}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {Number(grandSum.total_duty_hrs || 0).toFixed(1)}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          0.0
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          -
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          -
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          -
                        </td>
                      </tr>

                      {/* 3. OT Hours Total Row */}
                      <tr className="bg-[#fef08a] dark:bg-amber-900/60 text-slate-900 dark:text-amber-100 font-extrabold text-[12px] border-t border-amber-300 dark:border-amber-700">
                        <td 
                          colSpan={6} 
                          className="sticky left-0 z-10 bg-[#fef08a] dark:bg-amber-900 text-right pr-3 py-1.5 border-r border-amber-300 dark:border-amber-700 font-extrabold"
                        >
                          OT Hours Total:
                        </td>

                        {data.days.map((d) => {
                          const val = bottomTotals.ot[d.day] ?? 0;
                          return (
                            <td 
                              key={d.day} 
                              className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]"
                            >
                              {Number(val || 0).toFixed(1)}
                            </td>
                          );
                        })}

                        {/* Summary Columns for OT Hours Total */}
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          -
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {Number(grandSum.total_ot_hrs || 0).toFixed(1)}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          0.0
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          {Number(grandSum.total_ot_hrs || 0).toFixed(1)}
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          -
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          -
                        </td>
                        <td className="px-1 py-1.5 border-r border-amber-300 dark:border-amber-700 text-center font-mono font-extrabold text-[11px]">
                          -
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend / Status Indicators Footer (as shown in reference image) */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] px-2 pt-1 gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-[var(--text-main)]">Legend:</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-200"></span>
              <span><strong>8.0</strong> Standard Shift</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="text-red-600 font-bold"><strong>IN</strong> Clocked In / Active</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-600"></span>
              <span className="text-fuchsia-600 font-bold"><strong>12.0 / 4.0</strong> Overtime / Adjusted</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <span><strong>WO</strong> Weekly Off</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span><strong>A</strong> Absent</span>
            </div>
          </div>

          <div className="text-[11px] italic">
            * Click any day cell to view detailed punch verification logs
          </div>
        </div>

      </div>

      {/* Cell Detail Modal */}
      {selectedCellInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">Attendance Punch Details</h3>
              </div>
              <button 
                onClick={() => setSelectedCellInfo(null)}
                className="p-1 rounded-lg hover:bg-[var(--control-hover)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Employee:</span>
                <span className="font-bold text-[var(--text-main)]">{selectedCellInfo.employee} ({selectedCellInfo.code})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Rank / Designation:</span>
                <span className="font-bold text-[var(--text-main)]">{selectedCellInfo.rank}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Date:</span>
                <span className="font-bold text-[var(--text-main)]">{selectedCellInfo.date} ({selectedCellInfo.shortDay})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Marked Status / Hours:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${getCellClasses(selectedCellInfo)}`}>
                  {selectedCellInfo.status} {selectedCellInfo.hours ? `(${selectedCellInfo.hours} hrs)` : ''}
                </span>
              </div>
              {selectedCellInfo.shift && (
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">Shift Schedule:</span>
                  <span className="font-bold text-[var(--text-main)]">{selectedCellInfo.shift}</span>
                </div>
              )}
              {selectedCellInfo.punches && (
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">Punch Timestamps:</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{selectedCellInfo.punches}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCellInfo(null)}
                className="px-4 py-1.5 bg-[var(--btn-primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
