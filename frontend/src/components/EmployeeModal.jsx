import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, UserCheck, ShieldCheck, Edit3 } from 'lucide-react';
import SearchableColumnFilter from './SearchableColumnFilter';

// Date conversion helpers to ensure HTML date inputs work cleanly with DD-MMM-YYYY strings
const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[1].length === 3) {
    const day = parts[0].padStart(2, '0');
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const month = months[parts[1].toLowerCase()] || '01';
    const year = parts[2].length === 2 ? `19${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
};

const toDisplayDate = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function EmployeeModal({ isOpen, onClose, onSave, editingEmployee, employees = [] }) {
  const [formData, setFormData] = useState({
    oid: '',
    client: 'Tata Communications',
    branch: 'Mumbai',
    site: 'TCL BKC',
    empCode: '',
    name: '',
    skillDesig: 'S/SUP',
    clientDesig: 'S/SUP',
    email: '',
    mobile: '',
    weeklyOff: 'Saturday',
    joinedOn: '19-Apr-1997',
    releavedOn: '',
    onBoard: true,
    attnApp: true,
    traineeApp: false,
  });

  const clientOptions = useMemo(() => {
    const list = (employees || []).map(e => e.client).filter(Boolean);
    return [...new Set(['Tata Communications', 'Wipro', 'Infosys', ...list])];
  }, [employees]);

  const branchOptions = useMemo(() => {
    const list = (employees || []).map(e => e.branch).filter(Boolean);
    return [...new Set(['Mumbai', 'Pune', 'Main', ...list])];
  }, [employees]);

  const siteOptions = useMemo(() => {
    const list = (employees || []).map(e => e.site).filter(Boolean);
    return [...new Set(['TCL BKC', 'TCL VSB', 'WIPRO PDC - II', ...list])];
  }, [employees]);

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        ...editingEmployee,
        releavedOn: editingEmployee.releavedOn || ''
      });
    } else {
      setFormData({
        oid: String(Math.floor(100 + Math.random() * 900)),
        client: 'Tata Communications',
        branch: 'Mumbai',
        site: 'TCL BKC',
        empCode: String(Math.floor(60000 + Math.random() * 10000)),
        name: '',
        skillDesig: 'S/SUP',
        clientDesig: 'S/SUP',
        email: '',
        mobile: '',
        weeklyOff: 'Saturday',
        joinedOn: '19-Apr-1997',
        releavedOn: '',
        onBoard: true,
        attnApp: true,
        traineeApp: false,
      });
    }
  }, [editingEmployee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-color)] w-full max-w-2xl overflow-hidden text-[var(--text-main)] transition-colors duration-200">
        
        {/* Compact Header */}
        <div className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md border border-sky-500/20">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)]">
                {editingEmployee ? `Edit Employee Record (${formData.empCode || formData.name})` : 'Create New Employee Record'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded hover:bg-[var(--control-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Compact 2-Column Grid */}
        <form onSubmit={handleSubmit} className="p-5 text-xs space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* Emp Code */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Emp Code *</label>
              <input
                type="text"
                name="empCode"
                value={formData.empCode}
                onChange={handleChange}
                required
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {/* Employee Name */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Employee Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Dinesh Jagtap"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-semibold"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Mobile Number *</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                placeholder="e.g. 9874561221"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="employee@domain.com"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Client */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Client *</label>
              <SearchableColumnFilter
                label="Client"
                value={formData.client}
                onChange={(val) => setFormData(prev => ({ ...prev, client: val }))}
                options={clientOptions}
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Branch *</label>
              <SearchableColumnFilter
                label="Branch"
                value={formData.branch}
                onChange={(val) => setFormData(prev => ({ ...prev, branch: val }))}
                options={branchOptions}
              />
            </div>

            {/* Site */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Site *</label>
              <SearchableColumnFilter
                label="Site"
                value={formData.site}
                onChange={(val) => setFormData(prev => ({ ...prev, site: val }))}
                options={siteOptions}
              />
            </div>

            {/* Skill / Designation */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Designation <span className="text-red-500 font-bold">*</span></label>
              <select
                name="skillDesig"
                value={formData.skillDesig}
                onChange={handleChange}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="S/SUP">S/SUP (Supervisor)</option>
                <option value="L/SG">L/SG (Lady Security Guard)</option>
                <option value="S/G">S/G (Security Guard)</option>
                <option value="ASM">ASM (Assistant Security Manager)</option>
                <option value="S/OFF">S/OFF (Security Officer)</option>
              </select>
            </div>

            {/* Weekly Off */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Weekly Off</label>
              <select
                name="weeklyOff"
                value={formData.weeklyOff || 'Sunday'}
                onChange={handleChange}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>

            {/* Joined On */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Joined On</label>
              <input
                type="date"
                name="joinedOn"
                value={toInputDate(formData.joinedOn)}
                onChange={(e) => setFormData(prev => ({ ...prev, joinedOn: toDisplayDate(e.target.value) || e.target.value }))}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-sans cursor-pointer"
              />
            </div>

            {/* Releaved On */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Releaved On</label>
              <input
                type="date"
                name="releavedOn"
                value={toInputDate(formData.releavedOn)}
                onChange={(e) => setFormData(prev => ({ ...prev, releavedOn: toDisplayDate(e.target.value) || e.target.value }))}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-500 font-sans cursor-pointer"
              />
            </div>

            {/* On Board Status Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md">
              <span className="font-bold text-xs text-[var(--text-main)]">On Board Status</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, onBoard: !prev.onBoard }))}
                className={`px-3 py-1 rounded text-[10px] font-extrabold transition-all border ${
                  formData.onBoard
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/40'
                }`}
              >
                {formData.onBoard ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* App Registered Toggle Bar */}
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md">
            <div>
              <span className="font-bold text-xs text-[var(--text-main)] block">Attendance App Registered</span>
              <span className="text-[10px] text-[var(--text-muted)]">Enable or disable mobile application access for guard</span>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => {
                const isRegistered = prev.appRegistered || prev.attnApp;
                const nextState = !isRegistered;
                return {
                  ...prev,
                  appRegistered: nextState,
                  attnApp: nextState,
                  onBoard: true
                };
              })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                (formData.appRegistered || formData.attnApp) ? 'bg-sky-500' : 'bg-slate-500'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  (formData.appRegistered || formData.attnApp) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[var(--border-color)] rounded-md text-[var(--text-main)] hover:bg-[var(--control-hover)] transition-colors font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Record</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
