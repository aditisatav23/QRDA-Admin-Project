/**
 * QRDA Enterprise React / ES Module Integration Helper
 */
import { locationApi, employeeApi } from '../services/apiService';

export class QRDAApiClient {
  constructor(baseUrl = 'http://localhost:8001') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getSites() {
    return (await locationApi.getSites()) || [];
  }

  async getEmployees() {
    return (await employeeApi.getAll()) || [];
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
}

export class QRDAWidget {
  static async mount(target, options = {}) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return;

    const client = new QRDAApiClient(options.apiBaseUrl);
    const deployment = await client.getStandardDeployment(options.siteName || 'TCL BKC');

    container.innerHTML = `
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:16px; padding:20px; color:var(--text-main);">
        <h3 style="font-size:16px; font-weight:800; margin-bottom:12px;">🛡️ QRDA Integration Widget: ${deployment.site}</h3>
        <p style="font-size:12px; color:var(--text-muted);">Client: ${deployment.client} | Branch: ${deployment.branch}</p>
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-top:16px;">
          <div style="background:var(--table-header-bg); padding:10px; border-radius:8px; text-align:center;">
            <div style="font-size:10px; color:var(--text-muted);">Required</div>
            <div style="font-size:18px; font-weight:800;">${deployment.total_required}</div>
          </div>
          <div style="background:var(--table-header-bg); padding:10px; border-radius:8px; text-align:center;">
            <div style="font-size:10px; color:var(--text-muted);">Onboard</div>
            <div style="font-size:18px; font-weight:800; color:#34d399;">${deployment.total_onboard}</div>
          </div>
          <div style="background:var(--table-header-bg); padding:10px; border-radius:8px; text-align:center;">
            <div style="font-size:10px; color:var(--text-muted);">Shortfall</div>
            <div style="font-size:18px; font-weight:800; color:#fb7185;">${deployment.total_shortfall}</div>
          </div>
          <div style="background:var(--table-header-bg); padding:10px; border-radius:8px; text-align:center;">
            <div style="font-size:10px; color:var(--text-muted);">Fulfillment</div>
            <div style="font-size:18px; font-weight:800; color:#38bdf8;">${((deployment.total_onboard / deployment.total_required) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    `;
  }
}
