import React, { useState } from 'react';
import { ChevronDown, User, ShieldCheck, Sun, Moon, LogOut, CheckCircle } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, isDark, toggleTheme }) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const navItems = [
    { name: 'Attendance', options: ['Daily Attendance', 'Attendance Summary', 'Shift Roster'] },
    { name: 'Employees', options: ['Employees List', 'Standard Deployment Details', 'Onboarding', 'Resignation'] },
    { name: 'Compliance', options: ['Document Checklist', 'Audit Reports', 'PF & ESIC Compliance'] },
    { name: 'Incident', options: ['Report Incident', 'Incident History', 'Action Items'] },
    { name: 'Invoicing', options: ['Generate Invoice', 'Invoice List', 'Billing Master'] },
    { name: 'Patrolling', options: ['Checkpoints', 'Patrol Activity', 'Geofence Map'] },
    { name: 'Training', options: ['Course Catalog', 'Trainee List', 'Certificates'] },
    { name: 'Payroll', options: ['Salary Slip', 'Bonus & Overtime', 'Payout Summary'] },
    { name: 'Track Employees', options: ['Live GPS Tracking', 'Route History', 'Site Check-ins'] }
  ];

  const handleSelectSubOption = (navName, subOption) => {
    if (subOption === 'Standard Deployment Details') {
      setCurrentView('deployment');
    } else if (subOption === 'Employees List' || navName === 'Employees') {
      setCurrentView('employees');
    }
    setActiveDropdown(null);
  };

  return (
    <header className="bg-[var(--bg-header)] text-[var(--text-header)] border-b border-slate-300 dark:border-slate-800 shadow-xs relative z-50 transition-colors duration-200">
      <div className="max-w-[1920px] mx-auto px-4 py-2 flex items-center justify-between">
        
        {/* Left: Brand Logo & Nav */}
        <div className="flex items-center space-x-6">
          <div 
            className="text-2xl font-extrabold tracking-tight cursor-pointer font-serif select-none"
            onClick={() => setCurrentView('employees')}
          >
            QRDA
          </div>

          <nav className="hidden lg:flex items-center space-x-1 text-xs font-medium">
            {navItems.map((item) => {
              const isActive = (item.name === 'Employees' && (currentView === 'employees' || currentView === 'deployment'));
              return (
                <div key={item.name} className="relative">
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded transition-all ${
                      isActive
                        ? 'font-bold bg-sky-200/80 dark:bg-sky-950/70 text-sky-900 dark:text-sky-300'
                        : 'hover:bg-[var(--control-hover)]'
                    }`}
                  >
                    <span>{item.name}</span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeDropdown === item.name && (
                    <div className="absolute left-0 mt-1 w-56 bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-color)] py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      {item.options.map((option) => {
                        const isSubActive =
                          (option === 'Employees List' && currentView === 'employees') ||
                          (option === 'Standard Deployment Details' && currentView === 'deployment');
                        return (
                          <button
                            key={option}
                            onClick={() => handleSelectSubOption(item.name, option)}
                            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                              isSubActive
                                ? 'bg-sky-100/80 dark:bg-sky-950/60 font-semibold text-sky-800 dark:text-sky-300'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--control-hover)]'
                            }`}
                          >
                            <span>{option}</span>
                            {isSubActive && <CheckCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right: View Switcher, Theme Toggle, Admin */}
        <div className="flex items-center space-x-3">
          {/* View Switcher Pills */}
          <div className="flex bg-sky-200/60 dark:bg-slate-800 p-0.5 rounded-md border border-sky-300/60 dark:border-slate-700 text-xs">
            <button
              onClick={() => setCurrentView('employees')}
              className={`px-3 py-1 rounded-sm transition-all font-semibold ${
                currentView === 'employees'
                  ? 'bg-banner text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => setCurrentView('deployment')}
              className={`px-3 py-1 rounded-sm transition-all font-semibold ${
                currentView === 'deployment'
                  ? 'bg-banner text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Deployment Details
            </button>
          </div>

          {/* Theme Toggle (Sun/Moon) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-[var(--control-hover)] transition-colors text-[var(--text-secondary)]"
            title="Toggle Light / Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Admin Profile */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('admin')}
              className="flex items-center space-x-1.5 text-xs font-semibold hover:bg-[var(--control-hover)] px-2.5 py-1.5 rounded transition-colors text-[var(--text-secondary)]"
            >
              <User className="w-4 h-4" />
              <span>admin</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {activeDropdown === 'admin' && (
              <div className="absolute right-0 mt-1 w-48 bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-color)] py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-[var(--border-color)]">
                  <p className="text-xs font-bold text-[var(--text-main)]">System Superadmin</p>
                  <p className="text-[10px] text-[var(--text-muted)]">admin@qrda.com</p>
                </div>
                <button
                  onClick={() => setActiveDropdown(null)}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--control-hover)] flex items-center space-x-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                  <span>Role Management</span>
                </button>
                <button
                  onClick={() => setActiveDropdown(null)}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 border-t border-[var(--border-color)] mt-1 pt-1.5"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
