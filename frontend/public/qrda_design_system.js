/**
 * ================================================================================
 * QRDA ENTERPRISE DESIGN SYSTEM & THEME MANAGER - SINGLE FILE SCRIPT
 * ================================================================================
 * This self-contained script injects a premium enterprise design system (Light/Dark
 * modes, glassmorphism, responsive cards, data tables, buttons, and toasts)
 * into ANY external website or web application with ZERO external CSS dependencies.
 *
 * QUICK EMBED IN ANY OTHER PROJECT:
 * --------------------------------------------------------------------------------
 * <script src="qrda_design_system.js"></script>
 * <script>
 *   QRDADesignSystem.init({ defaultTheme: 'light' });
 * </script>
 * ================================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QRDADesignSystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DESIGN_SYSTEM_CSS = `
    /* ─── 1. CSS VARIABLES & DESIGN TOKENS ─── */
    :root {
      --qrda-font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --qrda-primary: #4f46e5;
      --qrda-primary-hover: #4338ca;
      --qrda-primary-light: #e0e7ff;
      --qrda-emerald: #10b981;
      --qrda-emerald-hover: #059669;
      --qrda-emerald-light: #d1fae5;
      --qrda-amber: #f59e0b;
      --qrda-amber-light: #fef3c7;
      --qrda-rose: #f43f5e;
      --qrda-rose-light: #ffe4e6;
      
      /* Light Mode Palette */
      --qrda-bg: #f8fafc;
      --qrda-surface: #ffffff;
      --qrda-surface-border: #e2e8f0;
      --qrda-text-main: #0f172a;
      --qrda-text-sub: #64748b;
      --qrda-table-header-bg: #f1f5f9;
      --qrda-table-hover: #f8fafc;
      --qrda-shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
      --qrda-shadow-md: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
      --qrda-glass-bg: rgba(255, 255, 255, 0.85);
    }

    [data-theme="dark"] {
      /* Dark Mode Palette */
      --qrda-bg: #0b0f19;
      --qrda-surface: #111827;
      --qrda-surface-border: #1f2937;
      --qrda-text-main: #f8fafc;
      --qrda-text-sub: #94a3b8;
      --qrda-table-header-bg: #1e293b;
      --qrda-table-hover: #1b2436;
      --qrda-shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
      --qrda-shadow-md: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      --qrda-glass-bg: rgba(17, 24, 39, 0.85);
    }

    /* Base Reset */
    .qrda-ds-body {
      font-family: var(--qrda-font);
      background-color: var(--qrda-bg);
      color: var(--qrda-text-main);
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* ─── 2. CARDS & CONTAINERS ─── */
    .qrda-card {
      background: var(--qrda-surface);
      border: 1px solid var(--qrda-surface-border);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--qrda-shadow-md);
      backdrop-filter: blur(12px);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .qrda-card-interactive:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px -5px rgba(79, 70, 229, 0.15);
    }

    .qrda-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      color: #ffffff;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.25);
    }

    /* ─── 3. BUTTON SYSTEM ─── */
    .qrda-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: var(--qrda-font);
      font-size: 14px;
      font-weight: 600;
      padding: 10px 18px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .qrda-btn-primary {
      background: var(--qrda-primary);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    }
    .qrda-btn-primary:hover {
      background: var(--qrda-primary-hover);
      transform: translateY(-1px);
    }

    .qrda-btn-emerald {
      background: var(--qrda-emerald);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    }
    .qrda-btn-emerald:hover {
      background: var(--qrda-emerald-hover);
    }

    .qrda-btn-outline {
      background: transparent;
      border: 1.5px solid var(--qrda-surface-border);
      color: var(--qrda-text-main);
    }
    .qrda-btn-outline:hover {
      background: var(--qrda-table-header-bg);
    }

    /* ─── 4. KPI STAT WIDGETS ─── */
    .qrda-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }
    .qrda-kpi-card {
      background: var(--qrda-surface);
      border: 1px solid var(--qrda-surface-border);
      border-radius: 14px;
      padding: 18px;
    }
    .qrda-kpi-val {
      font-size: 26px;
      font-weight: 800;
      color: var(--qrda-text-main);
      margin-top: 6px;
    }
    .qrda-kpi-lbl {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--qrda-text-sub);
    }

    /* ─── 5. DATA TABLES ─── */
    .qrda-table-wrap {
      width: 100%;
      overflow-x: auto;
      border: 1px solid var(--qrda-surface-border);
      border-radius: 14px;
      background: var(--qrda-surface);
    }
    .qrda-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 14px;
    }
    .qrda-table th {
      background: var(--qrda-table-header-bg);
      color: var(--qrda-text-sub);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--qrda-surface-border);
    }
    .qrda-table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--qrda-surface-border);
      color: var(--qrda-text-main);
    }
    .qrda-table tr:hover td {
      background: var(--qrda-table-hover);
    }

    /* ─── 6. BADGES ─── */
    .qrda-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
    }
    .qrda-badge-success { background: var(--qrda-emerald-light); color: #047857; }
    .qrda-badge-warning { background: var(--qrda-amber-light); color: #b45309; }
    .qrda-badge-info { background: var(--qrda-primary-light); color: #3730a3; }

    /* ─── 7. TOAST NOTIFICATIONS ─── */
    #qrda-toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .qrda-toast {
      background: var(--qrda-surface);
      color: var(--qrda-text-main);
      border: 1px solid var(--qrda-surface-border);
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: qrdaSlideIn 0.3s ease forwards;
    }
    @keyframes qrdaSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;

  class QRDADesignSystem {
    static init(options = {}) {
      this.injectStyles();
      const theme = options.defaultTheme || localStorage.getItem('qrda_theme') || 'dark';
      this.setTheme(theme);
    }

    static injectStyles() {
      if (document.getElementById('qrda-design-system-css')) return;
      const style = document.createElement('style');
      style.id = 'qrda-design-system-css';
      style.textContent = DESIGN_SYSTEM_CSS;
      document.head.appendChild(style);

      // Add Font preconnect link if needed
      if (!document.getElementById('qrda-font-link')) {
        const link = document.createElement('link');
        link.id = 'qrda-font-link';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
        document.head.appendChild(link);
      }

      // Add Toast Container
      if (!document.getElementById('qrda-toast-container')) {
        const toastBox = document.createElement('div');
        toastBox.id = 'qrda-toast-container';
        document.body.appendChild(toastBox);
      }
    }

    static setTheme(themeName) {
      document.documentElement.setAttribute('data-theme', themeName);
      if (themeName === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('qrda_theme', themeName);
      localStorage.setItem('app_theme', themeName);
    }

    static toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      this.setTheme(next);
      this.showToast(`Switched to ${next.toUpperCase()} theme mode!`, 'info');
      return next;
    }

    static showToast(message, type = 'success') {
      const container = document.getElementById('qrda-toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'qrda-toast';
      const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
      toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }
  }

  return QRDADesignSystem;
});
