// Khởi tạo ứng dụng
document.addEventListener("DOMContentLoaded", () => {
  // Inject global styles
  injectGlobalStyles();
  // Đăng ký các route
  router.register("/login", renderLogin, false);
  router.register("/register", renderRegister, false);
  router.register("/dashboard", renderDashboard, true);
  router.register("/profile", renderProfile, true);
  router.register("/user/:id", renderUserDetail, true);
  router.register("/user/:id/edit", renderEditUser, true);
  router.register("/admin/masking-config", renderAdminMaskingConfig, true);
  router.register("/", renderHome, true);
});

// ==================== GLOBAL STYLES ====================
function injectGlobalStyles() {
  if (document.getElementById("app-styles")) return;
  const style = document.createElement("style");
  style.id = "app-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --bg: #f3f4f6;
      --surface: #fff;
      --surface2: #f8fafc;
      --border: #e5e7eb;
      --text: #111827;
      --text-muted: #4b5563;
      --text-dim: #9ca3af;
      --accent: #2563eb;
      --accent-soft: rgba(37,99,235,0.1);
      --accent-hover: #1d4ed8;
      --green: #10b981;
      --green-soft: rgba(16,185,129,0.13);
      --red: #ef4444;
      --red-soft: rgba(239,68,68,0.13);
      --orange: #f59e0b;
      --orange-soft: rgba(245,158,11,0.13);
      --purple: #7056b8;
      --purple-soft: rgba(112,86,184,0.13);
      --amber: #fbbf24;
      --amber-soft: rgba(251,191,36,0.13);
      --radius: 10px;
      --radius-sm: 8px;
      --shadow: 0 10px 28px rgba(17, 24, 39, 0.1);
      --shadow-sm: 0 2px 10px rgba(17, 24, 39, 0.06);
      --info: #3b82f6;
      --warning: #f59e0b;
      --success: #10b981;
      --danger: #ef4444;
      --gradient-bg: #f3f4f6;
    }

    [data-theme="dark"] {
      --bg: #0f172a;
      --surface: #1e293b;
      --surface2: #192132;
      --border: #334155;
      --text: #e5e7eb;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --accent: #60a5fa;
      --accent-soft: rgba(96,165,250,0.13);
      --accent-hover: #2563eb;
      --green: #34d399;
      --green-soft: rgba(52,211,153,0.13);
      --red: #f87171;
      --red-soft: rgba(248,113,113,0.13);
      --orange: #fbbf24;
      --orange-soft: rgba(251,191,36,0.13);
      --purple: #a78bfa;
      --purple-soft: rgba(167,139,250,0.13);
      --amber: #fde68a;
      --amber-soft: rgba(253,230,138,0.13);
      --radius: 10px;
      --radius-sm: 8px;
      --shadow: 0 10px 28px rgba(0,0,0,0.22);
      --shadow-sm: 0 2px 10px rgba(0,0,0,0.18);
      --info: #60a5fa;
      --warning: #fbbf24;
      --success: #34d399;
      --danger: #f87171;
      --gradient-bg: #0f172a;
    }

    body {
      font-family: 'Be Vietnam Pro', sans-serif;
      background: var(--gradient-bg);
      color: var(--text);
      margin: 0;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    /* SKELETON LOADING */
    .skeleton {
      background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
      border-radius: 6px;
      min-height: 18px;
      animation: shimmer 1.2s infinite linear;
    }
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: 200px 0; }
    }

    /* TOAST */
    .toast {
      position: fixed;
      right: 32px;
      bottom: 32px;
      min-width: 220px;
      background: var(--surface);
      color: var(--text);
      border-radius: 10px;
      box-shadow: var(--shadow);
      padding: 16px 24px;
      z-index: 1000;
      font-size: 15px;
      opacity: 0.98;
      display: flex;
      align-items: center;
      gap: 12px;
      border-left: 5px solid var(--success);
      animation: fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1);
    }
    .toast.success { border-left-color: var(--success); }
    .toast.info { border-left-color: var(--info); }
    .toast.warning { border-left-color: var(--warning); }
    .toast.danger { border-left-color: var(--danger); }
    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(40px); }
      100% { opacity: 0.98; transform: translateY(0); }
    }

    /* MODAL CONFIRM */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(30,41,59,0.18);
      backdrop-filter: blur(2px);
      z-index: 1001;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal {
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 32px 36px;
      min-width: 320px;
      max-width: 96vw;
      text-align: center;
      z-index: 1002;
      animation: fadeInUp 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .modal .btn {
      margin: 0 8px;
    }

    /* Responsive sidebar */
    @media (max-width: 900px) {
      .sidebar {
        position: fixed;
        left: -220px;
        transition: left 0.3s;
      }
      .sidebar.open {
        left: 0;
      }
      .main-content {
        margin-left: 0;
      }
      .sidebar-toggle {
        display: block;
      }
    }
    @media (min-width: 901px) {
      .sidebar-toggle {
        display: none;
      }
    }

    /* AUTH PAGES */
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      background-image: radial-gradient(ellipse at 20% 50%, rgba(31,79,163,0.09) 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 20%, rgba(201,138,51,0.07) 0%, transparent 50%);
    }
    .auth-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-sm);
    }
    .auth-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
      justify-content: center;
    }
    .auth-logo-icon {
      width: 40px; height: 40px;
      background: var(--accent-soft);
      border: 1px solid rgba(108,143,255,0.3);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    .auth-logo-icon i,
    .sidebar-logo-icon i,
    .stat-card-icon i,
    .nav-item-icon i {
      line-height: 1;
    }
    .auth-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      text-align: center;
      margin-bottom: 6px;
    }
    .auth-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      text-align: center;
      margin-bottom: 28px;
    }

    /* FORM ELEMENTS */
    .form-group { margin-bottom: 16px; }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 10px 14px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }
    .form-input::placeholder { color: var(--text-dim); }

    /* BUTTONS */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
      text-decoration: none;
    }
    .btn-primary {
      background: var(--accent);
      color: #fff;
    }
    .btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,0.24); }
    .btn-success { background: var(--green); color: #fff; }
    .btn-success:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-danger { background: var(--red); color: #fff; }
    .btn-danger:hover { filter: brightness(1.1); }
    .btn-ghost {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .btn-ghost:hover { background: var(--surface2); color: var(--text); }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn-full { width: 100%; }
    .btn-icon {
      background: transparent; border: none; cursor: pointer;
      color: var(--text-muted); padding: 4px; border-radius: 4px; transition: all 0.15s;
    }
    .btn-icon:hover { color: var(--accent); background: var(--accent-soft); }

    /* LAYOUT */
    .app-shell {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 220px;
      min-height: 100vh;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0;
      z-index: 100;
    }
    .sidebar-logo {
      padding: 22px 20px 16px;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 10px;
      cursor: pointer;
    }
    .sidebar-logo-icon {
      width: 32px; height: 32px;
      background: var(--accent-soft);
      border: 1px solid rgba(108,143,255,0.3);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .sidebar-logo-text {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      line-height: 1.2;
    }
    .sidebar-logo-sub {
      font-size: 10px;
      color: var(--text-dim);
      font-weight: 400;
    }
    .sidebar-nav { padding: 12px 10px; flex: 1; }
    .nav-section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-dim);
      padding: 8px 10px 4px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      text-decoration: none;
      margin-bottom: 2px;
    }
    .nav-item:hover { background: var(--surface2); color: var(--text); }
    .nav-item.active { background: var(--accent-soft); color: var(--accent); }
    .nav-item-icon { width: 18px; text-align: center; font-size: 14px; flex-shrink: 0; }
    .sidebar-footer {
      padding: 14px;
      border-top: 1px solid var(--border);
    }
    .user-info-bar {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      background: var(--surface2);
      border-radius: var(--radius-sm);
      margin-bottom: 8px;
    }
    .user-avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--purple));
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
    }
    .user-name-text { font-size: 12px; font-weight: 600; color: var(--text); line-height: 1.2; }
    .user-role-text { font-size: 11px; color: var(--text-muted); }

    /* MAIN CONTENT */
    .main-content {
      margin-left: 220px;
      flex: 1;
      min-height: 100vh;
      background: var(--bg);
    }
    .page-header {
      padding: 28px 32px 0;
    }
    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 4px;
    }
    .page-subtitle { font-size: 13px; color: var(--text-muted); margin: 0; }
    .page-body { padding: 24px 32px 40px; }
    .content-narrow {
      width: 100%;
      margin: 0 auto;
    }
    .page-body.content-narrow { padding-top: 14px; }
    .content-narrow-profile { max-width: 1240px; }
    .content-narrow-admin { max-width: 1360px; }

    /* CARDS */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 22px;
      box-shadow: var(--shadow-sm);
    }
    .card-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin: 0 0 16px;
    }

    /* STAT CARDS */
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex; flex-direction: column; gap: 8px;
      transition: border-color 0.2s, transform 0.15s;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
    }
    .stat-card:hover { border-color: #cfd6e3; transform: translateY(-1px); box-shadow: var(--shadow-sm); }
    .stat-card-icon {
      width: 38px; height: 38px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    .stat-card-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
    .stat-card-value { font-size: 20px; font-weight: 700; color: var(--text); }
    .stat-card-action {
      font-size: 11px; color: var(--accent); font-weight: 600;
      margin-top: 4px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    /* BADGES / TAGS */
    .badge {
      display: inline-flex; align-items: center;
      padding: 3px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .badge-admin { background: var(--red-soft); color: var(--red); border: 1px solid rgba(248,98,98,0.2); }
    .badge-viewer { background: var(--accent-soft); color: var(--accent); border: 1px solid rgba(108,143,255,0.2); }
    .badge-user { background: var(--green-soft); color: var(--green); border: 1px solid rgba(62,207,142,0.2); }
    .badge-active { background: var(--green-soft); color: var(--green); border: 1px solid rgba(62,207,142,0.2); }
    .badge-locked { background: var(--red-soft); color: var(--red); border: 1px solid rgba(248,98,98,0.2); }
    .badge-mock { background: var(--amber-soft); color: var(--amber); border: 1px solid rgba(245,166,35,0.25); }

    /* TABLE */
    .data-table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      padding: 11px 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-dim);
      background: var(--surface2);
      border-bottom: 1px solid var(--border);
      text-align: left;
    }
    .data-table td {
      padding: 12px 16px;
      font-size: 13.5px;
      color: var(--text);
      border-bottom: 1px solid #edf0f5;
      vertical-align: middle;
    }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tbody tr { transition: background 0.12s; }
    .data-table tbody tr:hover td { background: var(--surface2); }
    .data-table .text-mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      color: var(--text-muted);
    }

    /* ACTION BUTTONS IN TABLE */
    .action-link {
      font-size: 12px; font-weight: 600; cursor: pointer;
      padding: 4px 10px; border-radius: 5px; border: none;
      background: transparent; font-family: inherit;
      transition: all 0.12s;
    }
    .action-view { color: var(--accent); }
    .action-view:hover { background: var(--accent-soft); }
    .action-promote { color: var(--purple); }
    .action-promote:hover { background: var(--purple-soft); }
    .action-lock { color: var(--orange); }
    .action-lock:hover { background: var(--orange-soft); }
    .action-delete { color: var(--red); }
    .action-delete:hover { background: var(--red-soft); }

    /* PAGINATION */
    .pagination-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
      border-top: 1px solid var(--border);
      background: var(--surface2);
    }
    .pagination-info { font-size: 12px; color: var(--text-muted); }
    .pagination-controls { display: flex; align-items: center; gap: 8px; }
    .page-btn {
      padding: 5px 12px; font-size: 12px; font-weight: 600;
      border: 1px solid var(--border); border-radius: 5px;
      background: var(--surface); color: var(--text-muted);
      cursor: pointer; font-family: inherit; transition: all 0.12s;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .page-current {
      font-size: 12px; font-weight: 600; color: var(--text);
      padding: 5px 10px;
      background: var(--accent-soft); border-radius: 5px;
      border: 1px solid rgba(108,143,255,0.25);
    }

    /* ALERTS */
    .alert { padding: 12px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; }
    .alert-error { background: var(--red-soft); border: 1px solid rgba(248,98,98,0.25); color: var(--red); }
    .alert-success { background: var(--green-soft); border: 1px solid rgba(62,207,142,0.25); color: var(--green); }
    .alert-info { background: var(--accent-soft); border: 1px solid rgba(108,143,255,0.25); color: var(--accent); }
    .alert-warning { background: var(--amber-soft); border: 1px solid rgba(245,166,35,0.25); color: var(--amber); }

    /* DIVIDER */
    .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

    /* DETAIL FIELDS */
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .detail-field {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px 16px;
    }
    .detail-field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-dim); margin-bottom: 4px; }
    .detail-field-value { font-size: 14px; font-weight: 600; color: var(--text); }

    /* PROFILE HEADER */
    .profile-hero {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex; align-items: center; gap: 20px;
      margin-bottom: 14px;
    }
    .profile-avatar-big {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--purple));
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
      box-shadow: 0 3px 12px rgba(108,143,255,0.22);
    }
    .profile-main-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.75fr) minmax(360px, 1fr);
      gap: 20px;
      align-items: start;
    }
    .profile-stack {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .profile-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow-sm);
    }
    .profile-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .profile-meta-item {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
    }
    .profile-meta-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      margin-bottom: 4px;
      font-weight: 600;
    }
    .profile-meta-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      line-height: 1.35;
    }
    .profile-field-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .profile-field-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    }
    .profile-field-row:last-child {
      padding-bottom: 0;
      border-bottom: none;
    }
    .profile-field-row .left {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
      min-width: 96px;
    }
    .profile-field-row .right {
      font-size: 13px;
      color: var(--text);
      font-weight: 600;
      text-align: right;
      word-break: break-word;
    }
    .profile-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .security-list {
      margin: 0;
      padding-left: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .security-list li {
      font-size: 13px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
      line-height: 1.45;
    }
    .admin-header-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.75fr) minmax(360px, 1fr);
      gap: 16px;
      margin-bottom: 14px;
    }
    .admin-main-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(420px, 1fr);
      gap: 16px;
      align-items: start;
      margin-bottom: 14px;
    }
    .compact-card {
      padding: 16px;
    }
    .muted-note {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
    }
    @media (max-width: 980px) {
      .profile-main-grid,
      .admin-header-grid,
      .admin-main-grid {
        grid-template-columns: 1fr;
      }
      .profile-meta-grid {
        grid-template-columns: 1fr;
      }
    }

    /* MASKING CONFIG */
    .algo-card {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px 16px;
      transition: border-color 0.15s;
    }
    .algo-card:hover { border-color: var(--accent); }
    .algo-card-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
    .algo-card-desc { font-size: 12px; color: var(--text-muted); }

    /* MASKING DEMO */
    .masking-demo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
    .masking-demo-item {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 16px;
    }
    .masking-demo-title { font-size: 12px; font-weight: 700; margin-bottom: 8px; }
    .masking-demo-desc { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
    .masking-demo-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 6px 10px;
      color: var(--text);
      margin-bottom: 4px;
    }

    /* SPINNER */
    .spinner-wrap { display: flex; justify-content: center; align-items: center; padding: 48px; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* TOGGLE SWITCH */
    .toggle-wrap { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .toggle-input { display: none; }
    .toggle-track {
      width: 40px; height: 22px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 11px;
      position: relative;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    .toggle-input:checked + .toggle-track { background: var(--accent); border-color: var(--accent); }
    .toggle-track::after {
      content: '';
      position: absolute;
      width: 16px; height: 16px;
      background: #fff;
      border-radius: 50%;
      top: 2px; left: 2px;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .toggle-input:checked + .toggle-track::after { transform: translateX(18px); }
    .toggle-label { font-size: 13px; font-weight: 500; color: var(--text); }

    /* BACK LINK */
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600;
      color: var(--text-muted); cursor: pointer;
      margin-bottom: 20px; padding: 6px 0;
      border: none; background: transparent; font-family: inherit;
      transition: color 0.15s;
    }
    .back-link:hover { color: var(--accent); }

    /* SELECT */
    .form-select {
      width: 100%;
      padding: 10px 14px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      font-size: 13.5px;
      font-family: inherit;
      outline: none;
      cursor: pointer;
      transition: border-color 0.2s;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237b8094' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
    }
    .form-select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .form-select option { background: var(--surface2); }

    /* NOT FOUND */
    .not-found-wrap {
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: var(--bg); gap: 12px; text-align: center;
    }
  `;
  document.head.appendChild(style);
}

// ==================== RENDER HOME ====================
function renderHome() {
  const app = document.getElementById("app");
  const user = AuthManager.getUser();

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar("home")}
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Tổng quan</h1>
          <p class="page-subtitle">Xin chào, <strong style="color:var(--text)">${user.username}</strong> — hệ thống quản lý người dùng</p>
        </div>
        <div class="page-body">
          ${renderRuntimeBanner()}
          <div class="stat-grid">
            <div class="stat-card" onclick="Router.redirect('/dashboard')">
            <div class="stat-card-icon" style="background:var(--accent-soft)"><i class="fa-solid fa-users"></i></div>
              <div class="stat-card-label">Người dùng</div>
              <div class="stat-card-value">Danh sách</div>
              <div class="stat-card-action">Xem tất cả <i class="fa-solid fa-arrow-right"></i></div>
            </div>
            <div class="stat-card" onclick="Router.redirect('/profile')">
              <div class="stat-card-icon" style="background:var(--green-soft)"><i class="fa-solid fa-user"></i></div>
              <div class="stat-card-label">Tài khoản</div>
              <div class="stat-card-value">Cá nhân</div>
              <div class="stat-card-action">Xem profile <i class="fa-solid fa-arrow-right"></i></div>
            </div>
            ${AuthManager.isAdmin() ? `
            <div class="stat-card" onclick="Router.redirect('/admin/masking-config')">
              <div class="stat-card-icon" style="background:var(--orange-soft)"><i class="fa-solid fa-gears"></i></div>
              <div class="stat-card-label">Admin</div>
              <div class="stat-card-value">Masking</div>
              <div class="stat-card-action">Cấu hình <i class="fa-solid fa-arrow-right"></i></div>
            </div>
            ` : ""}
          </div>
          <div id="maskingDemoContainer" style="margin-top:24px"></div>
        </div>
      </div>
    </div>
  `;
}

// ==================== RENDER LOGIN ====================
function renderLogin() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-icon"><i class="fa-solid fa-users"></i></div>
        </div>
        <div class="auth-title">Đăng nhập</div>
        <div class="auth-subtitle">Hệ thống quản lý người dùng</div>

        ${renderRuntimeBanner()}

        <form id="loginForm">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input type="text" id="loginUsername" placeholder="john_doe" required class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input type="password" id="loginPassword" placeholder="••••••••" required class="form-input">
          </div>
          <div id="loginError" class="alert alert-error" style="display:none;margin-bottom:12px"></div>
          <button type="submit" class="btn btn-primary btn-full" style="margin-top:4px">Đăng nhập</button>
        </form>

        <p style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:20px">
          Chưa có tài khoản?
          <a href="#/register" style="color:var(--accent);font-weight:600;text-decoration:none">Đăng ký</a>
        </p>
      </div>
    </div>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    const errorDiv = document.getElementById("loginError");

    try {
      const response = await ApiClient.login(username, password);
      AuthManager.setToken(response.data.token);
      AuthManager.setUser({
        id: response.data.id || 1,
        username: response.data.username,
        role: response.data.role,
      });
      Router.redirect("/");
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = "block";
    }
  });
}

// ==================== RENDER REGISTER ====================
function renderRegister() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-icon"><i class="fa-solid fa-user-plus"></i></div>
        </div>
        <div class="auth-title">Tạo tài khoản</div>
        <div class="auth-subtitle">Điền thông tin để đăng ký</div>

        ${renderRuntimeBanner()}

        <form id="registerForm">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập (3–50 ký tự)</label>
            <input type="text" id="regUsername" placeholder="john_doe" required class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="regEmail" placeholder="john@example.com" required class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Số điện thoại</label>
            <input type="tel" id="regPhone" placeholder="+84901234567" required class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu (6–100 ký tự)</label>
            <input type="password" id="regPassword" placeholder="••••••••" required class="form-input">
          </div>
          <div id="registerError" class="alert alert-error" style="display:none;margin-bottom:12px"></div>
          <div id="registerSuccess" class="alert alert-success" style="display:none;margin-bottom:12px"></div>
          <button type="submit" class="btn btn-success btn-full">Đăng ký</button>
        </form>

        <p style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:20px">
          Đã có tài khoản?
          <a href="#/login" style="color:var(--accent);font-weight:600;text-decoration:none">Đăng nhập</a>
        </p>
      </div>
    </div>
  `;

  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("regUsername").value;
    const email = document.getElementById("regEmail").value;
    const phone = document.getElementById("regPhone").value;
    const password = document.getElementById("regPassword").value;
    const errorDiv = document.getElementById("registerError");
    const successDiv = document.getElementById("registerSuccess");

    try {
      const response = await ApiClient.register(username, email, phone, password);
      successDiv.textContent = "Đăng ký thành công! Đang chuyển hướng...";
      successDiv.style.display = "block";
      setTimeout(() => Router.redirect("/login"), 2000);
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = "block";
    }
  });
}

// ==================== RENDER DASHBOARD ====================
async function renderDashboard() {
  const app = document.getElementById("app");
  const user = AuthManager.getUser();

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar("dashboard")}
      <div class="main-content">
        <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <h1 class="page-title">Danh sách người dùng</h1>
            <p class="page-subtitle">Quản lý tất cả tài khoản trong hệ thống</p>
          </div>
          ${AuthManager.isAdmin() ? `
          <label class="toggle-wrap" style="margin-top:6px">
            <input type="checkbox" id="maskToggle" checked class="toggle-input">
            <div class="toggle-track"></div>
            <span class="toggle-label">Bật masking</span>
          </label>
          ` : ""}
        </div>
        <div class="page-body">
          ${AuthManager.isAdmin() ? `
          <div class="card" style="margin-bottom:20px">
            <div class="card-title"><i class="fa-solid fa-gears"></i> Cấu hình Data Masking</div>
            <div id="maskingConfigContent">
              <div class="spinner-wrap" style="padding:24px">
                <div class="spinner"></div>
              </div>
            </div>
          </div>
          ` : ""}

          <div id="loadingSpinner" class="spinner-wrap"><div class="spinner"></div></div>
          <div id="usersTable"></div>
          <div id="pagination"></div>
        </div>
      </div>
    </div>
  `;

  let currentPage = 0;
  const pageSize = 10;
  let maskingEnabled = true;

  async function loadMaskingConfig() {
    if (!AuthManager.isAdmin()) return;

    try {
      const [configRes, algorithmsRes] = await Promise.all([
        ApiClient.getMaskingConfig(),
        ApiClient.getMaskingAlgorithms(),
      ]);

      const currentConfig = configRes.data;
      const algorithms = algorithmsRes.data;

      const html = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px">
          <div class="detail-field">
            <div class="detail-field-label">Trạng thái</div>
            <div class="detail-field-value" style="color:${currentConfig.enabled ? 'var(--green)' : 'var(--red)'}">
              ${currentConfig.enabled ? '<i class="fa-solid fa-circle-check"></i> Đang bật' : '<i class="fa-regular fa-circle-xmark"></i> Đang tắt'}
            </div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">Phương pháp</div>
            <div class="detail-field-value">${currentConfig.algorithmName}</div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">Cập nhật lần cuối</div>
            <div class="detail-field-value" style="font-size:12px;font-weight:500">${new Date(currentConfig.updatedAt).toLocaleString("vi-VN")}</div>
          </div>
        </div>

        <form id="quickMaskingForm" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select id="quickAlgorithmSelect" class="form-select" style="max-width:260px">
            ${algorithms.map((a) => `<option value="${a.id}" ${a.id === currentConfig.algorithm ? "selected" : ""}>${a.name}</option>`).join("")}
          </select>
          <label class="toggle-wrap">
            <input type="checkbox" id="quickEnabledToggle" ${currentConfig.enabled ? "checked" : ""} class="toggle-input">
            <div class="toggle-track"></div>
            <span class="toggle-label" style="font-size:12px">Bật masking</span>
          </label>
          <button type="submit" class="btn btn-primary btn-sm">Lưu</button>
        </form>
        <div id="quickConfigMessage"></div>
      `;

      document.getElementById("maskingConfigContent").innerHTML = html;

      document.getElementById("quickMaskingForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const enabled = document.getElementById("quickEnabledToggle").checked;
        const algorithm = parseInt(document.getElementById("quickAlgorithmSelect").value);
        const msgDiv = document.getElementById("quickConfigMessage");

        try {
          await ApiClient.updateMaskingConfig(enabled, algorithm);
          msgDiv.innerHTML = `<div class="alert alert-success" style="margin-top:10px"><i class="fa-solid fa-circle-check"></i> Cập nhật thành công!</div>`;
          setTimeout(() => loadMaskingConfig(), 1500);
        } catch (error) {
          msgDiv.innerHTML = `<div class="alert alert-error" style="margin-top:10px"><i class="fa-solid fa-circle-xmark"></i> ${error.message}</div>`;
        }
      });
    } catch (error) {
      document.getElementById("maskingConfigContent").innerHTML = `
        <div class="alert alert-error">Lỗi: ${error.message}</div>
      `;
    }
  }

  async function loadUsers() {
    try {
      document.getElementById("loadingSpinner").style.display = "flex";
      const response = await ApiClient.getUsers(maskingEnabled, currentPage * pageSize, pageSize);
      const users = response.data.items;
      const total = response.data.total;

      renderUsersTable(users);
      renderPaginationControls(total);
      document.getElementById("loadingSpinner").style.display = "none";

      if (AuthManager.isAdmin()) {
        await loadMaskingConfig();
      }
    } catch (error) {
      document.getElementById("usersTable").innerHTML = `
        <div class="alert alert-error">Lỗi: ${error.message}</div>
      `;
    }
  }

  function renderUsersTable(users) {
    const tableHtml = `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((u) => `
              <tr>
                <td class="text-mono">#${u.id}</td>
                <td style="font-weight:600">${u.username}</td>
                <td class="text-mono">${u.email}</td>
                <td class="text-mono">${u.phone}</td>
                <td>
                  <span class="badge ${u.role === 'Admin' ? 'badge-admin' : u.role === 'Viewer' ? 'badge-viewer' : 'badge-user'}">
                    ${u.role}
                  </span>
                </td>
                <td>
                  <span class="badge ${u.isActive ? 'badge-active' : 'badge-locked'}">
                    ${u.isActive ? '<i class="fa-solid fa-circle-check"></i> Hoạt động' : '<i class="fa-regular fa-circle-xmark"></i> Bị khóa'}
                  </span>
                </td>
                <td>
                  <button onclick="Router.redirect('/user/${u.id}')" class="action-link action-view">Xem</button>
                  ${AuthManager.isAdmin() && u.role === "User" ? `
                    <button onclick="promoteUserToViewer(${u.id})" class="action-link action-promote">Nâng cấp</button>
                  ` : ""}
                  ${AuthManager.isAdmin() ? `
                    <button onclick="toggleUserActive(${u.id}, ${!u.isActive})" class="action-link action-lock">
                      ${u.isActive ? "Khóa" : "Mở khóa"}
                    </button>
                  ` : ""}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
    document.getElementById("usersTable").innerHTML = tableHtml;
  }

  function renderPaginationControls(total) {
    const totalPages = Math.ceil(total / pageSize);
    const paginationHtml = `
      <div class="pagination-bar" style="border-radius:0 0 var(--radius) var(--radius);margin-top:-1px">
        <span class="pagination-info">
          Hiển thị ${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, total)} trong ${total} người dùng
        </span>
        <div class="pagination-controls">
          <button onclick="previousPage()" ${currentPage === 0 ? "disabled" : ""} class="page-btn"><i class="fa-solid fa-arrow-left"></i> Trước</button>
          <span class="page-current">Trang ${currentPage + 1} / ${totalPages}</span>
          <button onclick="nextPage()" ${currentPage >= totalPages - 1 ? "disabled" : ""} class="page-btn">Tiếp <i class="fa-solid fa-arrow-right"></i></button>
        </div>
      </div>
    `;
    document.getElementById("pagination").innerHTML = paginationHtml;
  }

  window.previousPage = () => { currentPage = Math.max(0, currentPage - 1); loadUsers(); };
  window.nextPage = () => { currentPage++; loadUsers(); };

  window.deleteUserConfirm = async (userId) => {
    if (confirm("Bạn chắc chắn muốn xóa người dùng này?")) {
      try {
        await ApiClient.deleteUser(userId);
        alert("Xóa thành công");
        loadUsers();
      } catch (error) {
        alert("Lỗi: " + error.message);
      }
    }
  };

  window.promoteUserToViewer = async (userId) => {
    if (confirm("Bạn chắc chắn muốn nâng cấp người dùng này lên Viewer?")) {
      try {
        await ApiClient.promoteToViewer(userId);
        alert("Nâng cấp lên Viewer thành công");
        loadUsers();
      } catch (error) {
        alert("Lỗi: " + error.message);
      }
    }
  };

  window.toggleUserActive = async (userId, isActive) => {
    try {
      await ApiClient.toggleUserActive(userId, isActive);
      alert(isActive ? "Mở khóa thành công" : "Khóa thành công");
      loadUsers();
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  const maskToggle = document.getElementById("maskToggle");
  if (maskToggle) {
    maskToggle.addEventListener("change", (e) => {
      maskingEnabled = e.target.checked;
      currentPage = 0;
      loadUsers();
    });
  }

  loadUsers();
}

// ==================== RENDER USER DETAIL ====================
async function renderUserDetail() {
  const userId = parseInt(window.location.hash.split("/")[2]);
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar("dashboard")}
      <div class="main-content">
        <div class="page-header">
          <button onclick="Router.redirect('/dashboard')" class="back-link"><i class="fa-solid fa-arrow-left"></i> Quay lại danh sách</button>
          <h1 class="page-title">Chi tiết người dùng</h1>
        </div>
        <div class="page-body">
          <div id="userDetail">
            <div class="spinner-wrap"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await ApiClient.getUserById(userId);
    const user = response.data;

    if (!AuthManager.canView(userId)) {
      document.getElementById("userDetail").innerHTML = `
        <div class="alert alert-error">Bạn không có quyền xem thông tin người dùng này</div>
      `;
      return;
    }

    const html = `
      <div class="detail-grid" style="margin-bottom:16px">
        <div class="detail-field">
          <div class="detail-field-label">ID</div>
          <div class="detail-field-value" style="font-family:'JetBrains Mono',monospace">#${user.id}</div>
        </div>
        <div class="detail-field">
          <div class="detail-field-label">Tên đăng nhập</div>
          <div class="detail-field-value">${user.username}</div>
        </div>
        <div class="detail-field">
          <div class="detail-field-label">Email</div>
          <div class="detail-field-value" style="font-family:'JetBrains Mono',monospace;font-size:13px">${user.email}</div>
        </div>
        <div class="detail-field">
          <div class="detail-field-label">Số điện thoại</div>
          <div class="detail-field-value" style="font-family:'JetBrains Mono',monospace">${user.phone}</div>
        </div>
        <div class="detail-field">
          <div class="detail-field-label">Role</div>
          <div class="detail-field-value">
            <span class="badge ${user.role === 'Admin' ? 'badge-admin' : user.role === 'Viewer' ? 'badge-viewer' : 'badge-user'}">
              ${user.role}
            </span>
          </div>
        </div>
        <div class="detail-field">
          <div class="detail-field-label">Trạng thái</div>
          <div class="detail-field-value">
            <span class="badge ${user.isActive ? 'badge-active' : 'badge-locked'}">
              ${user.isActive ? '<i class="fa-solid fa-circle-check"></i> Hoạt động' : '<i class="fa-regular fa-circle-xmark"></i> Bị khóa'}
            </span>
          </div>
        </div>
        <div class="detail-field">
          <div class="detail-field-label">Ngày tạo</div>
          <div class="detail-field-value" style="font-size:13px;font-weight:500">${new Date(user.createdAt).toLocaleString("vi-VN")}</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${AuthManager.canEdit(userId) ? `
          <button onclick="Router.redirect('/user/${userId}/edit')" class="btn btn-primary"><i class="fa-solid fa-pen-to-square"></i> Sửa thông tin</button>
        ` : ""}
        ${AuthManager.isAdmin() && userId !== AuthManager.getUser().id ? `
          <button onclick="deleteUserConfirm(${userId})" class="btn btn-danger"><i class="fa-solid fa-trash"></i> Xóa người dùng</button>
        ` : ""}
      </div>
    `;

    document.getElementById("userDetail").innerHTML = html;
  } catch (error) {
    document.getElementById("userDetail").innerHTML = `
      <div class="alert alert-error">Lỗi: ${error.message}</div>
    `;
  }
}

// ==================== RENDER EDIT USER ====================
async function renderEditUser() {
  const userId = parseInt(window.location.hash.split("/")[2]);
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar("profile")}
      <div class="main-content">
        <div class="page-header">
          <button onclick="Router.redirect('/user/${userId}')" class="back-link"><i class="fa-solid fa-arrow-left"></i> Quay lại</button>
          <h1 class="page-title">Chỉnh sửa người dùng</h1>
        </div>
        <div class="page-body">
          <div id="editFormContainer" style="max-width:520px">
            <div class="spinner-wrap"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await ApiClient.getUserById(userId);
    const user = response.data;

    if (!AuthManager.canEdit(userId)) {
      document.getElementById("editFormContainer").innerHTML = `
        <div class="alert alert-error">Bạn không có quyền chỉnh sửa người dùng này</div>
      `;
      return;
    }

    const html = `
      <div class="card">
        <form id="editForm">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input type="text" id="editUsername" value="${user.username}" required class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="editEmail" value="${user.email}" required class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Số điện thoại</label>
            <input type="tel" id="editPhone" value="${user.phone}" required class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu mới <span style="color:var(--text-dim);text-transform:none;font-weight:400">(để trống nếu không đổi)</span></label>
            <input type="password" id="editPassword" placeholder="••••••••" class="form-input">
          </div>

          <div id="editError" class="alert alert-error" style="display:none;margin-bottom:14px"></div>
          <div id="editSuccess" class="alert alert-success" style="display:none;margin-bottom:14px"></div>

          <div style="display:flex;gap:10px">
            <button type="submit" class="btn btn-primary" style="flex:1"><i class="fa-solid fa-floppy-disk"></i> Lưu thay đổi</button>
            <button type="button" onclick="Router.redirect('/user/${userId}')" class="btn btn-ghost" style="flex:1">Hủy</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById("editFormContainer").innerHTML = html;

    document.getElementById("editForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("editUsername").value;
      const email = document.getElementById("editEmail").value;
      const phone = document.getElementById("editPhone").value;
      const password = document.getElementById("editPassword").value;
      const errorDiv = document.getElementById("editError");
      const successDiv = document.getElementById("editSuccess");

      try {
        await ApiClient.updateUser(userId, username, email, phone, password || user.password);
        successDiv.textContent = "Cập nhật thành công!";
        successDiv.style.display = "block";
        errorDiv.style.display = "none";
        setTimeout(() => Router.redirect("/user/" + userId), 1500);
      } catch (error) {
        errorDiv.textContent = "Lỗi: " + error.message;
        errorDiv.style.display = "block";
        successDiv.style.display = "none";
      }
    });
  } catch (error) {
    document.getElementById("editFormContainer").innerHTML = `
      <div class="alert alert-error">Lỗi: ${error.message}</div>
    `;
  }
}

// ==================== HELPER FUNCTIONS ====================
function renderSidebar(activeRoute) {
  const user = AuthManager.getUser();
  const isAdmin = AuthManager.isAdmin();
  const hash = window.location.hash;

  const navItems = [
    { key: "home", icon: '<i class="fa-solid fa-house"></i>', label: "Tổng quan", href: "#/" },
    { key: "dashboard", icon: '<i class="fa-solid fa-table-list"></i>', label: "Người dùng", href: "#/dashboard" },
    { key: "profile", icon: '<i class="fa-solid fa-id-card"></i>', label: "Profile", href: "#/profile" },
  ];
  if (isAdmin) {
    navItems.push({ key: "masking", icon: '<i class="fa-solid fa-shield-halved"></i>', label: "Masking Config", href: "#/admin/masking-config" });
  }

  const currentActive = hash === "#/" || hash === "" ? "home"
    : hash.startsWith("#/dashboard") ? "dashboard"
    : hash.startsWith("#/profile") || hash.includes("/edit") ? "profile"
    : hash.startsWith("#/admin") ? "masking"
    : hash.startsWith("#/user") ? "dashboard"
    : "home";

  return `
    <aside class="sidebar">
      <div class="sidebar-logo" onclick="Router.redirect('/')">
        <div class="sidebar-logo-icon"><i class="fa-solid fa-users"></i></div>
        <div>
          <div class="sidebar-logo-text">UserMgmt</div>
          <div class="sidebar-logo-sub">Management System</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Menu</div>
        ${navItems.map(item => `
          <a href="${item.href}" class="nav-item ${currentActive === item.key ? 'active' : ''}">
            <span class="nav-item-icon">${item.icon}</span>
            ${item.label}
          </a>
        `).join("")}
      </nav>

      <div class="sidebar-footer">
        ${renderRuntimeBadge()}
        <div class="user-info-bar" style="margin-top:${renderRuntimeBadge() ? '8px' : '0'}">
          <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
          <div style="flex:1;min-width:0">
            <div class="user-name-text" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.username}</div>
            <div class="user-role-text">${user.role}</div>
          </div>
        </div>
        <button onclick="AuthManager.logout()" class="btn btn-ghost btn-sm btn-full" style="justify-content:center">
          Đăng xuất
        </button>
      </div>
    </aside>
  `;
}

function renderRuntimeBanner() {
  return "";
}

function renderRuntimeBadge() {
  return "";
}

// ==================== RENDER PROFILE ====================
async function renderProfile() {
  const app = document.getElementById("app");
  const user = AuthManager.getUser();

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar("profile")}
      <div class="main-content">
        <div class="page-header">
          <button onclick="Router.redirect('/')" class="back-link"><i class="fa-solid fa-arrow-left"></i> Trang chính</button>
          <h1 class="page-title">Profile</h1>
          <p class="page-subtitle">Thông tin tài khoản của bạn</p>
        </div>
        <div class="page-body content-narrow content-narrow-profile">
          <div id="profileContainer">
            <div class="spinner-wrap"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await ApiClient.getCurrentUser();
    const profileUser = response.data;

    const html = `
      <div class="profile-main-grid">
        <div class="profile-stack">
          <div class="profile-card">
            <div class="profile-hero" style="padding:0;border:none;margin-bottom:12px;box-shadow:none">
              <div class="profile-avatar-big">${profileUser.username.charAt(0).toUpperCase()}</div>
              <div style="min-width:0">
                <div style="font-size:20px;font-weight:700;color:var(--text);line-height:1.25">${profileUser.username}</div>
                <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <span class="badge ${profileUser.role === 'Admin' ? 'badge-admin' : profileUser.role === 'Viewer' ? 'badge-viewer' : 'badge-user'}">
                    ${profileUser.role}
                  </span>
                  <span class="badge ${profileUser.isActive ? 'badge-active' : 'badge-locked'}">
                    ${profileUser.isActive ? '<i class="fa-solid fa-circle-check"></i> Hoạt động' : '<i class="fa-regular fa-circle-xmark"></i> Bị khóa'}
                  </span>
                </div>
              </div>
            </div>
            <div class="profile-actions">
              <button onclick="Router.redirect('/user/' + ${user.id} + '/edit')" class="btn btn-primary">
                <i class="fa-solid fa-pen-to-square"></i> Chỉnh sửa thông tin
              </button>
              <button onclick="Router.redirect('/')" class="btn btn-ghost">Quay lại</button>
            </div>
          </div>

          <div class="profile-card">
            <div class="card-title" style="margin-bottom:10px"><i class="fa-solid fa-address-card"></i> Thông tin liên hệ</div>
            <div class="profile-field-list">
              <div class="profile-field-row">
                <div class="left">Email</div>
                <div class="right" style="font-family:'JetBrains Mono',monospace;font-size:12.5px">${profileUser.email}</div>
              </div>
              <div class="profile-field-row">
                <div class="left">Số điện thoại</div>
                <div class="right" style="font-family:'JetBrains Mono',monospace;font-size:12.5px">${profileUser.phone}</div>
              </div>
              <div class="profile-field-row">
                <div class="left">Ngày tạo</div>
                <div class="right">${new Date(profileUser.createdAt).toLocaleString("vi-VN")}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-stack">
          <div class="profile-card">
            <div class="card-title" style="margin-bottom:10px"><i class="fa-solid fa-id-badge"></i> Trạng thái tài khoản</div>
            <div class="profile-meta-grid">
              <div class="profile-meta-item">
                <div class="profile-meta-label">User ID</div>
                <div class="profile-meta-value">#${profileUser.id ?? user.id}</div>
              </div>
              <div class="profile-meta-item">
                <div class="profile-meta-label">Role</div>
                <div class="profile-meta-value">${profileUser.role}</div>
              </div>
              <div class="profile-meta-item">
                <div class="profile-meta-label">Trạng thái</div>
                <div class="profile-meta-value">${profileUser.isActive ? "Đang hoạt động" : "Đang bị khóa"}</div>
              </div>
              <div class="profile-meta-item">
                <div class="profile-meta-label">Bảo mật</div>
                <div class="profile-meta-value">Masking + mã hóa dữ liệu</div>
              </div>
            </div>
          </div>

          <div class="card compact-card">
            <div class="card-title"><i class="fa-solid fa-lightbulb"></i> Thông tin bảo mật</div>
            <ul class="security-list">
              <li><span style="color:var(--green)"><i class="fa-solid fa-circle-check"></i></span> Bạn có thể chỉnh sửa thông tin cá nhân của mình</li>
              <li><span style="color:var(--green)"><i class="fa-solid fa-circle-check"></i></span> Mật khẩu được mã hóa an toàn trên server</li>
              <li><span style="color:var(--green)"><i class="fa-solid fa-circle-check"></i></span> Email và số điện thoại bảo vệ bằng AES-256</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    document.getElementById("profileContainer").innerHTML = html;
  } catch (error) {
    document.getElementById("profileContainer").innerHTML = `
      <div class="alert alert-error">Lỗi: ${error.message}</div>
    `;
  }
}

async function renderMaskingDemo() {
  const email = "john@example.com";
  const phone = "+84901234567";

  try {
    const response = await ApiClient.getMaskingDemo(email, phone);
    const data = response.data;

    const html = `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="card-title" style="margin:0"><i class="fa-solid fa-chart-column"></i> Demo Data Masking — 4 Phương Pháp</div>
          <button onclick="document.getElementById('maskingDemoContainer').innerHTML=''" class="btn btn-ghost btn-sm"><i class="fa-solid fa-xmark"></i> Đóng</button>
        </div>

        <div class="detail-field" style="margin-bottom:16px">
          <div class="detail-field-label">Dữ liệu gốc</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:13px;margin-top:4px;color:var(--text)">
            Email: ${data.original.email}<br>Phone: ${data.original.phone}
          </div>
        </div>

        <div class="masking-demo-grid">
          <div class="masking-demo-item" style="border-left:3px solid var(--green)">
            <div class="masking-demo-title" style="color:var(--green)">1 · Character Masking</div>
            <div class="masking-demo-desc">${data.characterMasking.description}</div>
            <div class="masking-demo-value">Email: ${data.characterMasking.email}</div>
            <div class="masking-demo-value">Phone: ${data.characterMasking.phone}</div>
          </div>
          <div class="masking-demo-item" style="border-left:3px solid var(--amber)">
            <div class="masking-demo-title" style="color:var(--amber)">2 · Data Shuffling</div>
            <div class="masking-demo-desc">${data.datashuffling.description}</div>
            <div class="masking-demo-value">Email: ${data.datashuffling.email}</div>
            <div class="masking-demo-value">Phone: ${data.datashuffling.phone}</div>
          </div>
          <div class="masking-demo-item" style="border-left:3px solid var(--purple)">
            <div class="masking-demo-title" style="color:var(--purple)">3 · Data Substitution</div>
            <div class="masking-demo-desc">${data.datasubstitution.description}</div>
            <div class="masking-demo-value">Email: ${data.datasubstitution.email}</div>
            <div class="masking-demo-value">Phone: ${data.datasubstitution.phone}</div>
          </div>
          <div class="masking-demo-item" style="border-left:3px solid var(--red)">
            <div class="masking-demo-title" style="color:var(--red)">4 · Noise Addition</div>
            <div class="masking-demo-desc">${data.noiseaddition.description}</div>
            <div class="masking-demo-value">Email: ${data.noiseaddition.email}</div>
            <div class="masking-demo-value">Phone: ${data.noiseaddition.phone}</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("maskingDemoContainer").innerHTML = html;
  } catch (error) {
    document.getElementById("maskingDemoContainer").innerHTML = `
      <div class="alert alert-error">Lỗi: ${error.message}</div>
    `;
  }
}

// ==================== RENDER ADMIN MASKING CONFIG ====================
async function renderAdminMaskingConfig() {
  if (!AuthManager.isAdmin()) {
    Router.redirect("/");
    return;
  }

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar("masking")}
      <div class="main-content">
        <div class="page-header">
          <button onclick="Router.redirect('/')" class="back-link"><i class="fa-solid fa-arrow-left"></i> Trang chính</button>
          <h1 class="page-title">Cấu hình Data Masking</h1>
          <p class="page-subtitle">Quản lý phương pháp che giấu dữ liệu cho Viewer users</p>
        </div>
        <div class="page-body content-narrow content-narrow-admin">
          <div id="loadingSpinner" class="spinner-wrap"><div class="spinner"></div></div>
          <div id="configContainer"></div>
        </div>
      </div>
    </div>
  `;

  try {
    const [configRes, algorithmsRes] = await Promise.all([
      ApiClient.getMaskingConfig(),
      ApiClient.getMaskingAlgorithms(),
    ]);

    const currentConfig = configRes.data;
    const algorithms = algorithmsRes.data;

    const html = `
      <div class="admin-header-grid">
        <div class="detail-grid">
          <div class="detail-field">
            <div class="detail-field-label">Trạng thái</div>
            <div class="detail-field-value" style="color:${currentConfig.enabled ? 'var(--green)' : 'var(--red)'}">
              ${currentConfig.enabled ? '<i class="fa-solid fa-circle-check"></i> Đang bật' : '<i class="fa-regular fa-circle-xmark"></i> Đang tắt'}
            </div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">Phương pháp hiện tại</div>
            <div class="detail-field-value">${currentConfig.algorithmName}</div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">Cập nhật lần cuối</div>
            <div class="detail-field-value" style="font-size:13px;font-weight:500">${new Date(currentConfig.updatedAt).toLocaleString("vi-VN")}</div>
          </div>
        </div>
        <div class="card compact-card">
          <div class="card-title" style="margin-bottom:8px"><i class="fa-solid fa-circle-info"></i> Tổng quan nhanh</div>
          <div class="muted-note">
            Có <strong style="color:var(--text)">${algorithms.length}</strong> phương pháp masking khả dụng.<br>
            Bạn có thể đổi nhanh trạng thái bật/tắt và thuật toán mặc định tại form bên dưới.
          </div>
        </div>
      </div>

      <div class="admin-main-grid">
        <div class="card" style="height:100%">
          <div class="card-title"><i class="fa-solid fa-screwdriver-wrench"></i> Cập nhật cấu hình</div>
          <form id="configForm">
            <div class="form-group">
              <label class="toggle-wrap">
                <input type="checkbox" id="enabledToggle" ${currentConfig.enabled ? "checked" : ""} class="toggle-input">
                <div class="toggle-track"></div>
                <span class="toggle-label">Bật Data Masking cho Viewer Users</span>
              </label>
              <p style="font-size:12px;color:var(--text-muted);margin:8px 0 0 0">
                Khi bật, tất cả Viewer users sẽ thấy dữ liệu bị che giấu.
              </p>
            </div>
            <div class="form-group">
              <label class="form-label">Chọn phương pháp Masking</label>
              <select id="algorithmSelect" class="form-select">
                ${algorithms.map((algo) => `
                  <option value="${algo.id}" ${algo.id === currentConfig.algorithm ? "selected" : ""}>
                    ${algo.name} — ${algo.description}
                  </option>
                `).join("")}
              </select>
            </div>
            <div style="display:flex;gap:10px">
              <button type="submit" class="btn btn-primary" style="flex:1"><i class="fa-solid fa-floppy-disk"></i> Lưu cấu hình</button>
              <button type="button" onclick="Router.redirect('/')" class="btn btn-ghost" style="flex:1">Hủy</button>
            </div>
          </form>
          <div id="updateMessage"></div>
        </div>

        <div class="card" style="height:100%">
          <div class="card-title"><i class="fa-solid fa-list-check"></i> Danh sách phương pháp</div>
          <div style="display:grid;grid-template-columns:1fr;gap:10px">
            ${algorithms.map((algo) => `
              <div class="algo-card">
                <div class="algo-card-name">${algo.id}. ${algo.name}</div>
                <div class="algo-card-desc">${algo.description}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("configContainer").innerHTML = html;

    document.getElementById("configForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const enabled = document.getElementById("enabledToggle").checked;
      const algorithm = parseInt(document.getElementById("algorithmSelect").value);
      const messageDiv = document.getElementById("updateMessage");

      try {
        await ApiClient.updateMaskingConfig(enabled, algorithm);
        messageDiv.innerHTML = `<div class="alert alert-success" style="margin-top:14px"><i class="fa-solid fa-circle-check"></i> Cập nhật cấu hình thành công!</div>`;
        setTimeout(() => renderAdminMaskingConfig(), 2000);
      } catch (error) {
        messageDiv.innerHTML = `<div class="alert alert-error" style="margin-top:14px"><i class="fa-solid fa-circle-xmark"></i> Lỗi: ${error.message}</div>`;
      }
    });
  } catch (error) {
    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("configContainer").innerHTML = `
      <div class="alert alert-error">Lỗi: ${error.message}</div>
    `;
  }
}