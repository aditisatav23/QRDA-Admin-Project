import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  minWidth = 'min-w-[180px]',
  disabled = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  direction = 'down'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options to array of { label, value }
  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          label: String(opt.label ?? opt.name ?? opt.value ?? ''),
          value: String(opt.value ?? opt.label ?? '')
        };
      }
      return {
        label: String(opt),
        value: String(opt)
      };
    }).filter(opt => opt.value !== '');
  }, [options]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const lower = searchTerm.toLowerCase().trim();
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(lower)
    );
  }, [normalizedOptions, searchTerm]);

  // Selected label
  const selectedOption = useMemo(() => {
    return normalizedOptions.find(opt => opt.value === value);
  }, [normalizedOptions, value]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(-1);
      // Small timeout to ensure DOM element is ready
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option-index]');
      const activeItem = items[highlightedIndex];
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (selectedValue) => {
    onChange?.(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block ${minWidth} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 pl-2.5 pr-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none text-left ${
          isOpen
            ? 'border-sky-500 ring-1 ring-sky-500 bg-[var(--control-bg)] text-[var(--text-main)] shadow-sm'
            : 'border-[var(--border-color)] bg-[var(--control-bg)] text-[var(--text-main)] hover:border-sky-400 dark:hover:border-sky-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : value || (
            <span className="text-[var(--text-muted)] font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-sky-500' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute left-0 ${
            direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
          } w-full min-w-[220px] max-w-[340px] bg-[var(--bg-card)] dark:bg-slate-900 border border-[var(--border-color)] dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 ${dropdownClassName}`}
        >
          {/* Search Box Header */}
          <div className="p-2 border-b border-[var(--border-color)] dark:border-slate-800 bg-[var(--bg-surface-alt)] dark:bg-slate-950/40 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-[var(--text-main)] dark:text-slate-100 placeholder:text-[var(--text-muted)] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-0.5 rounded transition-colors"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options Counter if searching */}
          {searchTerm.trim() && (
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex justify-between">
              <span>Matching results</span>
              <span>{filteredOptions.length} found</span>
            </div>
          )}

          {/* Options List */}
          <div 
            ref={listRef}
            className="overflow-y-auto max-h-56 py-1 divide-y divide-transparent"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    data-option-index={idx}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={opt.label}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-4 text-center text-xs text-[var(--text-muted)] italic">
                No matching options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
