import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function SearchableColumnFilter({
  field,
  label = 'Filter',
  value,
  onChange,
  employees = [],
  options = null,
  placeholder,
  className = '',
  roundedClass = 'rounded-md',
  dropdownClassName = '',
  inputClassName = '',
  direction = 'down'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Extract unique sorted non-empty values for this column or use provided options array
  const uniqueValues = useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      const set = new Set();
      for (let i = 0; i < options.length; i++) {
        if (options[i]) set.add(String(options[i]).trim());
      }
      return Array.from(set).sort();
    }

    if (!employees || !employees.length || !field) return [];
    
    const set = new Set();
    for (let i = 0; i < employees.length; i++) {
      const val = employees[i][field];
      if (val) set.add(String(val).trim());
    }
    return Array.from(set).sort();
  }, [options, employees, field]);

  // Filter dropdown list options based on user typing in the dropdown search box (limit to max 150 items for super fast rendering)
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return uniqueValues.slice(0, 150);
    const lower = searchTerm.toLowerCase().trim();
    const matches = [];
    for (let i = 0; i < uniqueValues.length; i++) {
      if (uniqueValues[i].toLowerCase().includes(lower)) {
        matches.push(uniqueValues[i]);
        if (matches.length >= 150) break;
      }
    }
    return matches;
  }, [uniqueValues, searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative w-full font-sans ${className}`}>
      <div className="flex items-center relative">
        <input
          type="text"
          readOnly
          value={value || ''}
          onClick={() => setIsOpen(prev => !prev)}
          placeholder={placeholder || `Select ${label}...`}
          className={`w-full border border-[var(--input-border)] ${roundedClass || 'rounded-md'} ${inputClassName || 'px-2.5 py-1 pr-6 text-[11px] font-medium'} focus:outline-none focus:border-sky-500 bg-[var(--input-bg)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] truncate cursor-pointer transition-all shadow-2xs`}
        />
        {value ? (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-1 text-[var(--text-muted)] hover:text-[var(--text-main)] p-0.5"
            title="Clear filter"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(prev => !prev);
            }}
            className="absolute right-1 text-[var(--text-muted)] hover:text-[var(--text-main)] p-0.5"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={`absolute left-0 ${direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1'} ${dropdownClassName || 'min-w-[170px] w-max max-w-[240px]'} max-h-60 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md shadow-2xl z-50 flex flex-col overflow-hidden text-xs`}>
          {/* Inner Search Box */}
          <div className="p-1.5 border-b border-[var(--border-color)] bg-[var(--bg-surface-alt)] flex items-center gap-1.5">
            <Search className="w-3 h-3 text-sky-500 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${label}...`}
              className="w-full bg-transparent text-[11px] text-[var(--text-main)] focus:outline-none placeholder:text-[var(--text-muted)]"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setSearchTerm('')}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 max-h-44 divide-y divide-[var(--border-color)]/20">
            <div
              onClick={() => {
                onChange('');
                setSearchTerm('');
                setIsOpen(false);
              }}
              className={`px-2.5 py-1.5 cursor-pointer hover:bg-sky-500/10 text-[10px] font-bold flex justify-between items-center ${
                !value ? 'text-sky-500 bg-sky-500/10' : 'text-[var(--text-muted)]'
              }`}
            >
              <span>(All {label}s)</span>
            </div>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`px-2.5 py-1.5 cursor-pointer hover:bg-sky-500/20 text-[11px] truncate flex justify-between items-center transition-colors ${
                    value === opt ? 'bg-sky-500/20 font-bold text-sky-400' : 'text-[var(--text-main)]'
                  }`}
                  title={opt}
                >
                  <span className="truncate">{opt}</span>
                </div>
              ))
            ) : (
              <div className="px-2.5 py-3 text-center text-[10px] text-[var(--text-muted)] italic">
                No matching values
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
