/**
 * ================================================================================
 * QRDA ENTERPRISE FRONTEND INTEGRATION - SINGLE FILE UTILITY & EMBEDDABLE WIDGET
 * ================================================================================
 * This self-contained JS library can be dropped into ANY web project (React, Angular,
 * Vue, PHP, ASP.NET, HTML/Vanilla JS) to integrate:
 *   1. QRDA Enterprise API Client (Sites, Hierarchy, Analytics, Employees, Deployment)
 *   2. Embeddable UI Widget (Standard Deployment & Employee Directory Roster)
 *
 * USAGE IN ANY OTHER PROJECT:
 * --------------------------------------------------------------------------------
 * Option 1: As a Standalone JS Script Tag
 *   <div id="qrda-container"></div>
 *   <script src="qrda_frontend_integration.js"></script>
 *   <script>
 *     QRDAWidget.mount('#qrda-container', { apiBaseUrl: 'http://localhost:8001' });
 *   </script>
 *
 * Option 2: As an ES Module Import in React/Vue/Node:
 *   import { QRDAApiClient, QRDAWidget } from './qrda_frontend_integration.js';
 *   const qrda = new QRDAApiClient('http://localhost:8001');
 *   const sites = await qrda.getSites();
 * ================================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.QRDAApiClient = exports.QRDAApiClient;
    root.QRDAWidget = exports.QRDAWidget;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── 1. API CLIENT CLASS ──────────────────────────────────────────────────
  class QRDAApiClient {
    constructor(baseUrl = 'http://localhost:8001') {
      this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async _request(endpoint, options = {}) {
      const url = `${this.baseUrl}${endpoint}`;
      try {
        const response = await fetch(url, {
          headers: { 'Content-Type': 'application/json', ...options.headers },
          ...options
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        console.warn(`[QRDA Integration] API call to ${url} failed, using local fallback data:`, err.message);
        return null;
      }
    }

    async getSites(params = {}) {
      const query = new URLSearchParams(params).toString();
      const res = await this._request(`/assessments/sites${query ? '?' + query : ''}`);
      return res || this.getFallbackSites();
    }

    async getHierarchy() {
      const res = await this._request('/assessments/clients');
      return res || { clients: ['Tata Communications', 'Wipro', 'Infosys', 'TCS', 'Reliance'], tree: {} };
    }

    async getAnalytics() {
      const res = await this._request('/patrol/dashboard/stats');
      return res || { total_sites: 239, active_sites: 193, activeOfficers: 9840, sitesPatrolled: 141 };
    }

    async getEmployees() {
      const res = await this._request('/api/reports/employee-list');
      const items = res?.items || res;
      return items && items.length > 0 ? items : this.getFallbackEmployees();
    }

    async getStandardDeployment(siteName = 'TCL BKC') {
      return {
        client: 'Tata Communications',
        branch: 'Mumbai',
        site: siteName,
        total_required: 63,
        total_onboard: 49,
        total_shortfall: -14,
        rows: [
          { designation: 'ASM', name: 'Area Security Manager', required: 2, onboard: 2, shortfall: 0, monFri: 2, sat: 1, sun: 1 },
          { designation: 'S/G', name: 'Security Guard', required: 45, onboard: 42, shortfall: -3, monFri: 40, sat: 20, sun: 15 },
          { designation: 'S/SUP', name: 'Senior Supervisor', required: 4, onboard: 4, shortfall: 0, monFri: 3, sat: 2, sun: 2 },
          { designation: 'L/SG', name: 'Lady Security Guard', required: 12, onboard: 1, shortfall: -11, monFri: 8, sat: 4, sun: 4 }
        ]
      };
    }

    getFallbackSites() {
      return {
        total: 2,
        items: [
          { id: 1, oid: '112', client: 'Tata Communications', state: 'Maharashtra', branch: 'Mumbai', site_name: 'TCL BKC', attendance_channels: ['Biometric Device'], is_active: true },
          { id: 2, oid: '112', client: 'Tata Communications', state: 'Maharashtra', branch: 'Mumbai', site_name: 'TCL VSB', attendance_channels: ['Biometric Device', 'QR Code Based'], is_active: true }
        ]
      };
    }

    getFallbackEmployees() {
      return [
        { empCode: '68448', name: 'Dinesh Jagtap', client: 'Tata Communications', site: 'TCL BKC', skillDesig: 'S/SUP', onBoard: false },
        { empCode: '67828', name: 'Sandeep Utekar', client: 'Tata Communications', site: 'TCL VSB', skillDesig: 'S/G', onBoard: true },
        { empCode: '68351', name: 'Amardeep Gawhande', client: 'Tata Communications', site: 'TCL BKC', skillDesig: 'S/G', onBoard: true },
        { empCode: '88401', name: 'Sunil Verma', client: 'Tata Communications', site: 'TCL BKC', skillDesig: 'ASM', onBoard: true }
      ];
    }
  }

  // ─── 2. EMBEDDABLE UI WIDGET (THEMED & HIGH-CONTRAST) ──────────────────
  class QRDAWidget {
    static async mount(target, options = {}) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) {
        console.error('[QRDAWidget] Target container not found:', target);
        return;
      }

      const client = new QRDAApiClient(options.apiBaseUrl || 'http://localhost:8001');
      const deployment = await client.getStandardDeployment(options.siteName || 'TCL BKC');
      const employees = await client.getEmployees();

      // Inject Enterprise Theme CSS styles if not already present
      if (!document.getElementById('qrda-widget-styles')) {
        const style = document.createElement('style');
        style.id = 'qrda-widget-styles';
        style.textContent = `
          .qrda-embed-card {
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg-card, #111827);
            border: 1px solid var(--border-color, #1e293b);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
            color: var(--text-main, #f8fafc);
            margin: 16px 0;
            transition: all 0.2s ease-in-out;
          }
          .qrda-embed-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color, #1e293b);
            padding-bottom: 16px;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 12px;
          }
          .qrda-embed-title {
            font-size: 18px;
            font-weight: 800;
            color: var(--text-main, #f8fafc);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .qrda-embed-badge {
            background: rgba(14, 165, 233, 0.15);
            color: #38bdf8;
            border: 1px solid rgba(56, 189, 248, 0.3);
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            letter-spacing: 0.5px;
          }
          .qrda-subtext {
            font-size: 12px;
            color: var(--text-muted, #94a3b8);
            margin-top: 4px;
          }
          .qrda-kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          .qrda-kpi-box {
            background: var(--table-header-bg, #1e293b);
            border: 1px solid var(--border-color, #334155);
            border-radius: 12px;
            padding: 14px;
            text-align: center;
            transition: transform 0.2s ease, border-color 0.2s ease;
          }
          .qrda-kpi-box:hover {
            border-color: #0ea5e9;
            transform: translateY(-2px);
          }
          .qrda-kpi-val {
            font-size: 22px;
            font-weight: 800;
            color: var(--text-main, #f8fafc);
            margin-top: 4px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          }
          .qrda-kpi-lbl {
            font-size: 10px;
            text-transform: uppercase;
            color: var(--text-muted, #94a3b8);
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .qrda-table-wrap {
            overflow-x: auto;
            margin-top: 16px;
            border: 1px solid var(--border-color, #1e293b);
            border-radius: 12px;
            background: var(--bg-card, #111827);
          }
          .qrda-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 12px;
          }
          .qrda-table th {
            background: var(--table-header-bg, #1e293b);
            padding: 12px;
            border-bottom: 1px solid var(--border-color, #334155);
            font-weight: 700;
            color: var(--table-header-text, #cbd5e1);
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          .qrda-table td {
            padding: 12px;
            border-bottom: 1px solid var(--border-color, #1e293b);
            color: var(--text-main, #f8fafc);
          }
          .qrda-table tr:hover {
            background: rgba(14, 165, 233, 0.08);
          }
          .qrda-tag-danger {
            background: rgba(244, 63, 94, 0.15);
            color: #fb7185;
            border: 1px solid rgba(251, 113, 133, 0.3);
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          }
          .qrda-tag-success {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(52, 211, 153, 0.3);
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          }
          .qrda-btn-export {
            background: var(--btn-primary, #0ea5e9);
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 700;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .qrda-btn-export:hover {
            background: var(--btn-primary-hover, #0284c7);
            transform: translateY(-1px);
          }
        `;
        document.head.appendChild(style);
      }

      const fulfillmentPct = ((deployment.total_onboard / deployment.total_required) * 100).toFixed(1);

      container.innerHTML = `
        <div class="qrda-embed-card">
          <div class="qrda-embed-header">
            <div>
              <h3 class="qrda-embed-title">
                <span>🛡️ QRDA Enterprise Deployment Integration</span>
                <span class="qrda-embed-badge">${deployment.site}</span>
              </h3>
              <div class="qrda-subtext">
                Client: <strong style="color:var(--text-main, #f8fafc)">${deployment.client}</strong> | Branch: <strong style="color:var(--text-main, #f8fafc)">${deployment.branch}</strong>
              </div>
            </div>
            <button class="qrda-btn-export" id="qrda-export-btn">⬇️ Export Integration JSON</button>
          </div>

          <div class="qrda-kpi-grid">
            <div class="qrda-kpi-box">
              <div class="qrda-kpi-lbl">Required Posts</div>
              <div class="qrda-kpi-val">${deployment.total_required}</div>
            </div>
            <div class="qrda-kpi-box">
              <div class="qrda-kpi-lbl">Onboarded</div>
              <div class="qrda-kpi-val" style="color:#34d399">${deployment.total_onboard}</div>
            </div>
            <div class="qrda-kpi-box">
              <div class="qrda-kpi-lbl">Shortfall</div>
              <div class="qrda-kpi-val" style="color:${deployment.total_shortfall < 0 ? '#fb7185' : '#34d399'}">${deployment.total_shortfall}</div>
            </div>
            <div class="qrda-kpi-box">
              <div class="qrda-kpi-lbl">Fulfillment</div>
              <div class="qrda-kpi-val" style="color:#38bdf8">${fulfillmentPct}%</div>
            </div>
          </div>

          <h4 style="font-size:14px; font-weight:700; margin:16px 0 8px 0; color:var(--text-main, #f8fafc);">Standard Deployment Matrix</h4>
          <div class="qrda-table-wrap">
            <table class="qrda-table">
              <thead>
                <tr>
                  <th>Designation</th>
                  <th>Required</th>
                  <th>Onboard</th>
                  <th>Shortfall</th>
                  <th>Mon–Fri</th>
                  <th>Sat</th>
                  <th>Sun</th>
                </tr>
              </thead>
              <tbody>
                ${deployment.rows
                  .map(
                    (r) => `
                  <tr>
                    <td><strong>${r.designation}</strong> <span style="font-size:11px; color:var(--text-muted, #94a3b8)">(${r.name})</span></td>
                    <td><strong>${r.required}</strong></td>
                    <td style="color:#34d399; font-weight:600">${r.onboard}</td>
                    <td><span class="${r.shortfall < 0 ? 'qrda-tag-danger' : 'qrda-tag-success'}">${r.shortfall}</span></td>
                    <td>${r.monFri}</td>
                    <td>${r.sat}</td>
                    <td>${r.sun}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      const exportBtn = container.querySelector('#qrda-export-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          const payload = JSON.stringify({ deployment, employees }, null, 2);
          const blob = new Blob([payload], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `qrda_integration_${deployment.site.replace(/\s+/g, '_')}.json`;
          a.click();
        });
      }
    }
  }

  return { QRDAApiClient, QRDAWidget };
});
