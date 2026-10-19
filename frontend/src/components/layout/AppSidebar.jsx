import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  GraduationCap, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Clock,
  Database,
  CalendarCheck,
  Award,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

export default function AppSidebar({ currentView, setCurrentView, isCollapsed, setIsCollapsed }) {
  const isDataManagerActive = currentView === 'datamanager' || currentView.startsWith('datamanager_') || currentView === 'shifts';
  const [dataManagerExpanded, setDataManagerExpanded] = useState(true);
  const prevDataManagerActiveRef = React.useRef(isDataManagerActive);

  const isNewAttendanceActive = currentView === 'new_attendance' || currentView === 'payroll_attendance_sitewise' || currentView.startsWith('new_attendance_');
  const [newAttendanceExpanded, setNewAttendanceExpanded] = useState(true);
  const prevNewAttendanceActiveRef = React.useRef(isNewAttendanceActive);

  useEffect(() => {
    if (isDataManagerActive && !prevDataManagerActiveRef.current) {
      setDataManagerExpanded(true);
    }
    prevDataManagerActiveRef.current = isDataManagerActive;
  }, [isDataManagerActive]);

  useEffect(() => {
    if (isNewAttendanceActive && !prevNewAttendanceActiveRef.current) {
      setNewAttendanceExpanded(true);
    }
    prevNewAttendanceActiveRef.current = isNewAttendanceActive;
  }, [isNewAttendanceActive]);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, category: 'Main' },
    { id: 'employees', label: 'Employees Directory', icon: Users, category: 'Main' },
    { id: 'deployment', label: 'Standard Deployment', icon: Layers, category: 'Main' },
    { 
      id: 'datamanager', 
      label: 'Data Manager', 
      icon: Database, 
      category: 'Main',
      subItems: [
        { id: 'datamanager_shifts', label: 'Shifts', icon: Clock },
        { id: 'datamanager_sitedesignations', label: 'Company Designation', icon: ShieldCheck },
        { id: 'datamanager_designation', label: 'Designation', icon: Award },
        { id: 'datamanager_clientsites', label: 'Client Sites', icon: Building2 },
        { id: 'datamanager_staff', label: 'Staff', icon: Users }
      ]
    },
    
    { 
      id: 'new_attendance', 
      label: 'New Attendance', 
      icon: CalendarCheck, 
      category: 'Operations',
      subItems: [
        { id: 'payroll_attendance_sitewise', label: 'Payroll Attendance Site Wise', icon: FileSpreadsheet }
      ]
    },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, category: 'Operations' },
    { id: 'timelogs', label: 'Site Time Logs', icon: Clock, category: 'Operations' },
    { id: 'compliance', label: 'Compliance & Audits', icon: ShieldCheck, category: 'Operations' },
    { id: 'incidents', label: 'Incident Reports', icon: ShieldAlert, category: 'Operations', badge: '2 SOS' },
    { id: 'patrolling', label: 'Patrol & Geofencing', icon: MapPin, category: 'Operations' },
    
    { id: 'training', label: 'Training & LMS', icon: GraduationCap, category: 'Management' },
    { id: 'payroll', label: 'Invoicing & Payroll', icon: FileText, category: 'Management' },
    { id: 'settings', label: 'System Settings', icon: Settings, category: 'Management' }
  ];

  return (
    <aside 
      className={`bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col justify-between transition-all duration-300 z-40 relative select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div>
        <div className={`h-16 flex items-center border-b border-[var(--border-color)] transition-all ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {!isCollapsed && (
            <div 
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-3 cursor-pointer overflow-hidden"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-900 to-sky-600 dark:from-sky-500 dark:to-blue-700 flex items-center justify-center text-white font-black text-base shadow-md shrink-0">
                Q
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight font-serif text-[var(--text-main)] leading-none">
                  QRDA
                </span>
                <span className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 tracking-wider uppercase">
                  Enterprise Portal
                </span>
              </div>
            </div>
          )}

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-[var(--control-bg)] hover:bg-[var(--control-hover)] text-[var(--text-main)] border border-[var(--border-color)] transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDataManager = item.id === 'datamanager';
            const isNewAttendance = item.id === 'new_attendance';
            const isExpanded = isDataManager 
              ? dataManagerExpanded 
              : isNewAttendance 
                ? newAttendanceExpanded 
                : true;

            const isStaffActive = currentView === 'datamanager_staff';
            const isShiftsActive = currentView === 'datamanager_shifts' || currentView === 'shifts' || currentView === 'datamanager';
            const isSiteDesignationsActive = currentView === 'datamanager_sitedesignations';
            const isDesignationActive = currentView === 'datamanager_designation';
            const isClientSitesActive = currentView === 'datamanager_clientsites';
            const isPayrollAttendanceActive = currentView === 'payroll_attendance_sitewise' || currentView === 'new_attendance';

            const isSubActive = isDataManager
              ? (isStaffActive || isShiftsActive || isSiteDesignationsActive || isDesignationActive || isClientSitesActive)
              : isNewAttendance
                ? isPayrollAttendanceActive
                : false;

            const isParentActive = isDataManager
              ? isDataManagerActive
              : isNewAttendance
                ? isNewAttendanceActive
                : currentView === item.id;
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);

            // Active state indicators
            const isParentSolidActive = hasSubItems
              ? (isParentActive && (!isExpanded || !isSubActive))
              : isParentActive;
            const isParentSubtleActive = hasSubItems && isSubActive && isExpanded && !isCollapsed;
            
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (isDataManager) {
                      setDataManagerExpanded(prev => !prev);
                      setCurrentView('datamanager_shifts');
                    } else if (isNewAttendance) {
                      setNewAttendanceExpanded(prev => !prev);
                      setCurrentView('payroll_attendance_sitewise');
                    } else {
                      setCurrentView(item.id);
                    }
                  }}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                  } py-2.5 rounded-2xl text-xs font-bold transition-all group cursor-pointer ${
                    isParentSolidActive
                      ? 'bg-[#4f46e5] text-white shadow-md ring-1 ring-black/10'
                      : isParentSubtleActive
                        ? 'bg-[#4f46e5]/10 text-[#4f46e5] dark:text-indigo-400 font-extrabold border border-[#4f46e5]/20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-main)]'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isParentSolidActive 
                        ? 'text-white'
                        : isParentSubtleActive
                          ? 'text-[#4f46e5] dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-[var(--text-main)]'
                    }`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center space-x-1.5">
                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                          {item.badge}
                        </span>
                      )}
                      {hasSubItems && (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDataManager) setDataManagerExpanded(prev => !prev);
                            if (isNewAttendance) setNewAttendanceExpanded(prev => !prev);
                          }}
                          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-transform"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-0' : '-rotate-90'
                          }`} />
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Sub Items (Expandable) */}
                {hasSubItems && !isCollapsed && isExpanded && (
                  <div className="ml-5 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-1 my-1">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = currentView === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => setCurrentView(sub.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-[#4f46e5] text-white shadow-sm font-bold ring-1 ring-black/10'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                            <span>{sub.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer User Widget */}
      <div className="p-3 border-t border-[var(--border-color)]">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-xl bg-[var(--table-header-bg)] border border-[var(--border-color)]`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-900 to-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            A
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--text-main)] truncate">Superadmin</p>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Online</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
