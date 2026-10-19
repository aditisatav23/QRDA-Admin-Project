import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  ShieldCheck, 
  LogOut, 
  ShieldAlert, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export default function TopBar({ currentView, setCurrentView, isDark, toggleTheme, isCollapsed, setIsCollapsed }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getBreadcrumbLabel = () => {
    switch (currentView) {
      case 'dashboard': return 'Command Center Dashboard';
      case 'employees': return 'Employees Directory';
      case 'deployment': return 'Standard Deployment Details';
      case 'datamanager': return 'Data Manager - Master Data Records';
      case 'datamanager_A': return 'Data Manager - A-Shift (Morning)';
      case 'datamanager_B': return 'Data Manager - B-Shift (Evening)';
      case 'datamanager_C': return 'Data Manager - C-Shift (Night)';
      case 'datamanager_G': return 'Data Manager - G-Shift (General)';
      case 'datamanager_shifts': return 'Data Manager - Shifts';
      case 'datamanager_sitedesignations': return 'Data Manager - Company Designation';
      case 'datamanager_designation': return 'Data Manager - Designation';
      case 'datamanager_clientsites': return 'Data Manager - Client Sites';
      case 'datamanager_staff': return 'Data Manager - Staff Directory';
      case 'payroll_attendance_sitewise':
      case 'new_attendance': return 'Payroll Attendance Site Wise';
      case 'attendance':
      case 'timelogs': return 'Site Time Logs';
      case 'compliance': return 'Compliance & Audits';
      case 'incidents': return 'Incident Management';
      case 'patrolling': return 'Patrolling & Geofence Map';
      case 'training': return 'Training & LMS Catalog';
      case 'payroll': return 'Invoicing & Payroll';
      default: return 'System Settings';
    }
  };

  const notifications = [
    { id: 1, title: 'Emergency SOS Alert', desc: 'Guard Mahesh Kadam pressed SOS at WIPRO PDC - II', time: '5m ago', type: 'critical' },
    { id: 2, title: 'Shortfall Warning', desc: 'TCL BKC site shortfall increased to -3 guards', time: '18m ago', type: 'warning' },
    { id: 3, title: 'Checkin Verified', desc: 'Superintendent Dinesh Jagtap started Shift 1', time: '1h ago', type: 'info' }
  ];

  return (
    <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-colors duration-200">
      
      {/* Left: Spacer */}
      <div className="flex items-center space-x-3"></div>



      {/* Right: Notifications, Theme Toggle, Profile */}
      <div className="flex items-center space-x-2.5">
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl hover:bg-[var(--control-hover)] text-[var(--text-secondary)] relative transition-colors"
            title="Recent Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[var(--bg-card)]"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border-color)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-main)]">Recent Command Alerts</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                  {notifications.length} Active
                </span>
              </div>

              <div className="divide-y divide-[var(--border-color)] max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-[var(--control-hover)] transition-colors cursor-pointer">
                    <div className="flex items-start space-x-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        n.type === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[var(--text-main)] truncate">{n.title}</p>
                        <p className="text-[11px] text-[var(--text-muted)] leading-snug mt-0.5">{n.desc}</p>
                        <span className="text-[9px] font-mono text-[var(--text-muted)] mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Sun/Moon) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-[var(--control-hover)] text-[var(--text-secondary)] transition-colors"
          title="Toggle Light / Dark Mode"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-[var(--control-hover)] transition-colors border border-[var(--border-color)]"
          >
            <div className="w-7 h-7 rounded-full bg-white dark:bg-[var(--bg-card)] border border-[#e2e8f0] dark:border-[var(--border-color)] text-[#0f172a] dark:text-[var(--text-main)] font-extrabold text-xs flex items-center justify-center shadow-xs">
              A
            </div>
            <span className="hidden sm:inline text-xs font-bold text-[var(--text-main)]">admin</span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border-color)] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2.5 bg-[var(--control-bg)] rounded-xl mx-1.5 mb-1">
                <p className="text-xs font-bold text-[var(--text-main)]">System Superadmin</p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">admin@qrda.com</p>
              </div>

              <button
                onClick={() => setShowProfileMenu(false)}
                className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--control-hover)] flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                <span>Role Management</span>
              </button>

              <button
                onClick={() => setShowProfileMenu(false)}
                className="w-full text-left px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 border-t border-[var(--border-color)] mt-1 pt-2"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
