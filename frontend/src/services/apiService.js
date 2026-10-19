/**
 * QRDA Admin - API Service Layer
 * Backend: FastAPI running at http://localhost:8001
 * High performance layer with in-memory caching & full day names.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// In-Memory Cache to eliminate page switching latency
const cache = {
  employees: null,
  clients: null,
  sites: null,
  analytics: null,
  timestamp: 0,
};

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${path}: ${err}`);
  }
  return res.json();
}

const FULL_DAY_MAP = {
  sun: 'Sunday', sunday: 'Sunday',
  mon: 'Monday', monday: 'Monday',
  tue: 'Tuesday', tuesday: 'Tuesday',
  wed: 'Wednesday', wednesday: 'Wednesday',
  thu: 'Thursday', thursday: 'Thursday',
  fri: 'Friday', friday: 'Friday',
  sat: 'Saturday', saturday: 'Saturday',
};

function normalizeDayName(raw) {
  if (!raw) return 'Sunday';
  const clean = String(raw).toLowerCase().trim();
  return FULL_DAY_MAP[clean] || FULL_DAY_MAP[clean.slice(0, 3)] || 'Sunday';
}

function normalizeEmployee(e) {
  const isOnboard = e.on_board === 'Active' || e.on_board === true || e.on_board === 1;
  const isAttnApp =
    e.attn_app === 'Yes' || e.app_registered === true ||
    e.attn_app === true || e.attn_app === 1;
  
  const weeklyOff = normalizeDayName(e.weekly_off);

  return {
    oid:        e.id,
    empCode:    e.emp_code || '',
    name:       e.name || '',
    client:     e.client || '',
    branch:     e.branch || '',
    site:       e.site || '',
    skillDesig: e.designation || 'S/SUP',
    clientDesig:e.client_desig || e.designation || 'S/SUP',
    gender:     e.gender || 'Male',
    weeklyOff,  // Full Day Name (e.g. "Sunday", "Monday")
    joinedOn:   e.joined_on || '',
    releavedOn: e.released_on || '',
    onBoard:    isOnboard,
    attnApp:    isAttnApp,
    traineeApp: false,
    email:      e.email || '',
    mobile:     e.mobile || '',
    status:     e.status || (isOnboard ? 'Active' : 'Inactive'),
    others:     e.others || '',
  };
}

function toDbPayload(emp) {
  return {
    emp_code:     emp.empCode,
    name:         emp.name,
    client:       emp.client,
    branch:       emp.branch,
    site:         emp.site,
    designation:  emp.skillDesig,
    client_desig: emp.clientDesig,
    gender:       emp.gender || 'Male',
    weekly_off:   normalizeDayName(emp.weeklyOff),
    joined_on:    emp.joinedOn,
    released_on:  emp.releavedOn || null,
    on_board:     emp.onBoard ? 'Active' : 'Inactive',
    attn_app:     emp.attnApp ? 'Yes' : 'No',
    app_registered: Boolean(emp.attnApp),
    email:        emp.email,
    mobile:       emp.mobile,
  };
}

export const employeeApi = {
  async getAll(forceRefresh = false) {
    if (!forceRefresh && cache.employees && (Date.now() - cache.timestamp < 300000)) {
      return cache.employees;
    }
    try {
      const data = await api('/api/employees');
      const items = Array.isArray(data) ? data : (data.items || data.employees || []);
      const normalized = items.map(normalizeEmployee);
      cache.employees = normalized;
      cache.timestamp = Date.now();
      return normalized;
    } catch (err) {
      console.warn('employeeApi.getAll failed:', err.message);
      return cache.employees || null;
    }
  },

  async getById(id) {
    try { return normalizeEmployee(await api(`/api/employees/${id}`)); }
    catch { return null; }
  },

  async create(payload) {
    cache.employees = null; // Invalidate cache
    return api('/api/employees', { method: 'POST', body: JSON.stringify(toDbPayload(payload)) });
  },

  async update(id, payload) {
    cache.employees = null; // Invalidate cache
    return api(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(toDbPayload(payload)) });
  },

  async release(id, reason = '') {
    cache.employees = null;
    return api(`/api/employees/${id}/release`, { method: 'PUT', body: JSON.stringify({ release_reason: reason }) });
  },

  async reOnboard(id) {
    cache.employees = null;
    return api(`/api/employees/${id}/re-onboard`, { method: 'PUT' });
  },
};

export const locationApi = {
  async getClients(forceRefresh = false) {
    if (!forceRefresh && cache.clients) return cache.clients;
    try {
      const data = await api('/api/companies');
      const list = Array.isArray(data) ? data : (data.companies || data.items || []);
      const result = list.map(c => c.client || c.client_name || c.name).filter(Boolean);
      cache.clients = result;
      return result;
    } catch { return cache.clients || []; }
  },

  async getSites(forceRefresh = false) {
    if (!forceRefresh && cache.sites) return cache.sites;
    try {
      const data = await api('/api/sites');
      const result = Array.isArray(data) ? data : (data.items || data.sites || []);
      cache.sites = result;
      return result;
    } catch { return cache.sites || []; }
  },

  async getHierarchy() {
    try { return await api('/api/hierarchy'); }
    catch { return null; }
  },

  async getCompaniesWithSites() {
    try {
      const data = await api('/api/companies');
      return Array.isArray(data) ? data : (data.companies || data.items || []);
    } catch { return []; }
  },

  async getShifts() {
    try { return await api('/api/shifts'); }
    catch { return []; }
  },
};

export const patrolApi = {
  async getDashboardStats() {
    try { return await api('/api/analytics'); }
    catch { return null; }
  },
  async getTours()         { return []; },
  async getLiveLocations() { return []; },
  async getLogs()          { return []; },
  async search()           { return []; },
};

export const incidentApi = {
  async getAll()  { return []; },
  async resolve() { return null; },
};

export const checklistApi = {
  async getAll()             { return { items: [], total: 0 }; },
  async getSubmissionStats() { return null; },
};

export const exportApi = {
  getCsvUrl: () => `${BASE}/api/export/csv`,
};

export const timelogsApi = {
  async getLogs(site = 'WIPRO GOPANPALLY ICG GATE HYD', month = 'Sep/2026', client = '', branch = '') {
    try {
      const q = new URLSearchParams({ site, month, client: client || '', branch: branch || '' });
      const data = await api(`/api/attendance/timelogs?${q.toString()}`);
      return Array.isArray(data) ? data : (data.items || data.logs || []);
    } catch (err) {
      console.warn('timelogsApi.getLogs error:', err.message);
      return null;
    }
  }
};

const LMS_BASE = import.meta.env.VITE_LMS_API_URL || 'http://localhost:5003';
async function lmsCall(path) {
  const res = await fetch(`${LMS_BASE}${path}`);
  if (!res.ok) throw new Error(`LMS ${res.status}`);
  return res.json();
}
export const lmsApi = {
  async getCourses()        { try { const d = await lmsCall('/lms/courses'); return d.data || d.courses || []; } catch { return []; } },
  async getDashboardStats() { try { return await lmsCall('/lms/dashboard/stats'); } catch { return null; } },
};

export const dataManagerApi = {
  async getShifts(params = {}) {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const q = new URLSearchParams(cleanParams);
      const data = await api(`/api/shifts?${q.toString()}`);
      return data;
    } catch (e) {
      console.warn('dataManagerApi.getShifts error:', e.message);
      return { total: 0, items: [] };
    }
  },
  async createShift(payload) {
    return await api('/api/shifts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async updateShift(id, payload) {
    return await api(`/api/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async getStaff(params = {}) {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const q = new URLSearchParams(cleanParams);
      const data = await api(`/api/staff?${q.toString()}`);
      return data;
    } catch (e) {
      console.warn('dataManagerApi.getStaff error:', e.message);
      return { total: 0, items: [] };
    }
  },
  async getSiteDesignations(params = {}) {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const q = new URLSearchParams(cleanParams);
      const data = await api(`/api/site-designations?${q.toString()}`);
      return data;
    } catch (e) {
      console.warn('dataManagerApi.getSiteDesignations error:', e.message);
      return { total: 0, items: [] };
    }
  },
  async getClientSites(params = {}) {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const q = new URLSearchParams(cleanParams);
      const data = await api(`/api/client-sites?${q.toString()}`);
      return data;
    } catch (e) {
      console.warn('dataManagerApi.getClientSites error:', e.message);
      return { total: 0, items: [] };
    }
  },
  async getDesignations(params = {}) {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const q = new URLSearchParams(cleanParams);
      const data = await api(`/api/data-manager/designations?${q.toString()}`);
      return data;
    } catch (e) {
      console.warn('dataManagerApi.getDesignations error:', e.message);
      return { total: 0, items: [] };
    }
  },
  async getDesignationsMeta() {
    try {
      return await api('/api/designations-meta');
    } catch (e) {
      console.warn('dataManagerApi.getDesignationsMeta error:', e.message);
      return { clients: [], skills: [] };
    }
  },
  async createDesignation(payload) {
    return await api('/api/data-manager/designations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async createCompanyDesignation(payload) {
    return await api('/api/company-designations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async deleteDesignation(id) {
    return await api(`/api/data-manager/designations/${id}`, {
      method: 'DELETE'
    });
  }
};

export const attendanceApi = {
  async search(type = 'subpart', query = '') {
    try {
      const q = new URLSearchParams({ type, query });
      return await api(`/api/attendance/search?${q.toString()}`);
    } catch (e) {
      console.warn('attendanceApi.search error:', e.message);
      return {
        query,
        type,
        employeeMaster: null,
        employeeMasters: [],
        attendanceRows: [],
        bioEmployeeMaster: null,
        bioEmployeeMasters: [],
        attExportLogsDetails: null,
        devicesInQrda: []
      };
    }
  }
};

export const payrollAttendanceApi = {
  async getSiteWise(params = {}) {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      );
      const q = new URLSearchParams(cleanParams);
      return await api(`/api/payroll-attendance/site-wise?${q.toString()}`);
    } catch (e) {
      console.warn('payrollAttendanceApi.getSiteWise error:', e.message);
      return null;
    }
  }
};

const apiService = {
  getEmployees:         () => employeeApi.getAll(),
  createEmployee:       (p) => employeeApi.create(p),
  updateEmployee:       (id, p) => employeeApi.update(id, p),
  getDashboardStats:    () => patrolApi.getDashboardStats(),
  getPatrolTours:       () => patrolApi.getTours(),
  getChecklists:        () => checklistApi.getAll(),
  getDeploymentDetails: () => locationApi.getSites(),
  getTimeLogs:          (site, month, client, branch) => timelogsApi.getLogs(site, month, client, branch),
  getShifts:            (params) => dataManagerApi.getShifts(params),
  getStaff:             (params) => dataManagerApi.getStaff(params),
  getSiteDesignations:  (params) => dataManagerApi.getSiteDesignations(params),
  getClientSites:       (params) => dataManagerApi.getClientSites(params),
  getCompanyDesignations: (params) => dataManagerApi.getSiteDesignations(params),
  getDesignations:      (params) => dataManagerApi.getDesignations(params),
  createDesignation:    (payload) => dataManagerApi.createDesignation(payload),
  createCompanyDesignation: (payload) => dataManagerApi.createCompanyDesignation(payload),
  deleteDesignation:    (id) => dataManagerApi.deleteDesignation(id),
  searchAttendance:     (type, query) => attendanceApi.search(type, query),
  getPayrollAttendanceSiteWise: (params) => payrollAttendanceApi.getSiteWise(params),
};

export default apiService;


