import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check, ChevronDown } from 'lucide-react';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function MonthYearPicker({ value = 'Sep/2026', onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial value (e.g. "Sep/2026")
  const parseValue = (val) => {
    if (!val) return { month: 'Sep', year: 2026 };
    const parts = val.split('/');
    if (parts.length === 2) {
      return { month: parts[0].trim(), year: parseInt(parts[1].trim(), 10) || 2026 };
    }
    return { month: 'Sep', year: 2026 };
  };

  const current = parseValue(value);
  const [pickerYear, setPickerYear] = useState(current.year);

  // Sync pickerYear when value changes
  useEffect(() => {
    const p = parseValue(value);
    setPickerYear(p.year);
  }, [value]);

  // Click outside listener to close popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectMonth = (month) => {
    const formatted = `${month}/${pickerYear}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    const curMonth = MONTH_NAMES[now.getMonth()];
    const curYear = now.getFullYear();
    setPickerYear(curYear);
    onChange(`${curMonth}/${curYear}`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-4 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-400 dark:hover:border-sky-500 transition-all flex items-center space-x-2 text-[13px] font-normal text-slate-800 dark:text-slate-100 cursor-pointer shadow-none select-none"
        title="Click to select Attendance Month & Year"
      >
        <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
        <span className="font-medium tracking-tight">
          {value}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
          {/* Year Navigator */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setPickerYear(prev => prev - 1)}
              className="p-1 rounded hover:bg-[var(--control-hover)] text-[var(--text-secondary)] transition-colors"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-black font-mono text-[var(--text-main)]">
                {pickerYear}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">Year</span>
            </div>
            <button
              type="button"
              onClick={() => setPickerYear(prev => prev + 1)}
              className="p-1 rounded hover:bg-[var(--control-hover)] text-[var(--text-secondary)] transition-colors"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Grid (3 columns x 4 rows) */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_NAMES.map((m) => {
              const isSelected = current.month === m && current.year === pickerYear;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMonth(m)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1 ${
                    isSelected
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-[var(--text-main)] hover:bg-[var(--control-hover)] bg-[var(--bg-surface-alt)] border border-[var(--border-color)]'
                  }`}
                >
                  <span>{m}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
            <button
              type="button"
              onClick={handleSetCurrentMonth}
              className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Today's Month
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
