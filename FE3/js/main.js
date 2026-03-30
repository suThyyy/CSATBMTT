// Khởi tạo ứng dụng
document.addEventListener("DOMContentLoaded", () => {
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

// ==================== RENDER HOME ====================
function renderHome() {
  const app = document.getElementById("app");
  const user = AuthManager.getUser();

  app.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <nav class="bg-white shadow-md">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-blue-600">👥 User Management</h1>
                    <div class="flex items-center gap-4">
                        <span class="text-gray-700"><strong>${user.username}</strong> (${user.role})</span>
                        <button onclick="AuthManager.logout()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </nav>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <h2 class="text-3xl font-bold text-blue-600">📋</h2>
                        <p class="text-gray-700 mt-2">Danh sách người dùng</p>
                        <button onclick="Router.redirect('/dashboard')" class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                            Xem danh sách
                        </button>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <h2 class="text-3xl font-bold text-green-600">👤</h2>
                        <p class="text-gray-700 mt-2">Thông tin cá nhân</p>
                        <button onclick="Router.redirect('/profile')" class="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                            Xem chi tiết
                        </button>
                    </div>

                    ${
                      AuthManager.isAdmin()
                        ? `
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <h2 class="text-3xl font-bold text-orange-600">⚙️</h2>
                        <p class="text-gray-700 mt-2">Cấu hình Masking</p>
                        <button onclick="Router.redirect('/admin/masking-config')" class="mt-4 w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
                            Quản lý cấu hình
                        </button>
                    </div>
                    `
                        : ""
                    }
                </div>

                <div id="maskingDemoContainer"></div>
            </div>
        </div>
    `;
}

// ==================== RENDER LOGIN ====================
function renderLogin() {
  const app = document.getElementById("app");
  app.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h2 class="text-3xl font-bold text-center text-gray-900 mb-6">🔐 Đăng Nhập</h2>

                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                        <input type="text" id="loginUsername" placeholder="john_doe" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                        <input type="password" id="loginPassword" placeholder="••••••••" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>

                    <div id="loginError" class="text-red-600 text-sm hidden"></div>

                    <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition">
                        Đăng Nhập
                    </button>
                </form>

                <p class="text-center text-gray-600 mt-6">
                    Chưa có tài khoản? 
                    <a href="#/register" class="text-blue-600 hover:text-blue-800 font-semibold">Đăng ký</a>
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
      errorDiv.classList.remove("hidden");
    }
  });
}

// ==================== RENDER REGISTER ====================
function renderRegister() {
  const app = document.getElementById("app");
  app.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h2 class="text-3xl font-bold text-center text-gray-900 mb-6">📝 Đăng Ký</h2>

                <form id="registerForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (3-50 ký tự)</label>
                        <input type="text" id="regUsername" placeholder="john_doe" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="regEmail" placeholder="john@example.com" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input type="tel" id="regPhone" placeholder="+84901234567" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu (6-100 ký tự)</label>
                        <input type="password" id="regPassword" placeholder="••••••••" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>

                    <div id="registerError" class="text-red-600 text-sm hidden"></div>
                    <div id="registerSuccess" class="text-green-600 text-sm hidden"></div>

                    <button type="submit" class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold transition">
                        Đăng Ký
                    </button>
                </form>

                <p class="text-center text-gray-600 mt-6">
                    Đã có tài khoản? 
                    <a href="#/login" class="text-green-600 hover:text-green-800 font-semibold">Đăng nhập</a>
                </p>
            </div>
        </div>
    `;

  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("regUsername").value;
      const email = document.getElementById("regEmail").value;
      const phone = document.getElementById("regPhone").value;
      const password = document.getElementById("regPassword").value;
      const errorDiv = document.getElementById("registerError");
      const successDiv = document.getElementById("registerSuccess");

      try {
        const response = await ApiClient.register(
          username,
          email,
          phone,
          password,
        );
        successDiv.textContent = "Đăng ký thành công! Đang chuyển hướng...";
        successDiv.classList.remove("hidden");
        setTimeout(() => Router.redirect("/login"), 2000);
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove("hidden");
      }
    });
}

// ==================== RENDER DASHBOARD ====================
async function renderDashboard() {
  const app = document.getElementById("app");
  const user = AuthManager.getUser();

  app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            ${renderNavbar()}
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-bold text-gray-900">Danh sách người dùng</h2>
                    ${
                      AuthManager.isAdmin()
                        ? `
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" id="maskToggle" checked 
                                    class="w-4 h-4 text-blue-600">
                                <span class="text-gray-700">Bật masking</span>
                            </label>
                        </div>
                    `
                        : ""
                    }
                </div>

                <!-- Admin Masking Config Section -->
                ${
                  AuthManager.isAdmin()
                    ? `
                <div id="maskingConfigPanel" class="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h3 class="text-xl font-bold text-gray-900 mb-4">⚙️ Cấu Hình Data Masking</h3>
                  <div id="maskingConfigContent" class="flex justify-center py-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </div>
                `
                    : ""
                }

                <div id="loadingSpinner" class="flex justify-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <div id="usersTable"></div>
                <div id="pagination" class="mt-8"></div>
            </div>
        </div>
    `;

  let currentPage = 0;
  const pageSize = 10;
  let maskingEnabled = true;

  // Load masking config if admin
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="p-3 bg-blue-50 rounded">
            <p class="text-xs text-gray-600">Trạng thái</p>
            <p class="text-lg font-bold text-blue-600">${currentConfig.enabled ? "✓ Bật" : "✗ Tắt"}</p>
          </div>
          <div class="p-3 bg-green-50 rounded">
            <p class="text-xs text-gray-600">Phương pháp</p>
            <p class="text-lg font-bold text-green-600">${currentConfig.algorithmName}</p>
          </div>
          <div class="p-3 bg-gray-50 rounded">
            <p class="text-xs text-gray-600">Cập nhật</p>
            <p class="text-xs text-gray-700">${new Date(currentConfig.updatedAt).toLocaleString("vi-VN")}</p>
          </div>
        </div>

        <form id="quickMaskingForm" class="flex gap-2">
          <select id="quickAlgorithmSelect" class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            ${algorithms.map((a) => `<option value="${a.id}" ${a.id === currentConfig.algorithm ? "selected" : ""}>${a.name}</option>`).join("")}
          </select>
          <label class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded cursor-pointer">
            <input type="checkbox" id="quickEnabledToggle" ${currentConfig.enabled ? "checked" : ""} class="w-4 h-4">
            <span class="text-sm font-medium">Bật</span>
          </label>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-semibold">
            💾 Lưu
          </button>
        </form>

        <div id="quickConfigMessage"></div>
      `;

      document.getElementById("maskingConfigContent").innerHTML = html;

      // Handle quick form submission
      document
        .getElementById("quickMaskingForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const enabled = document.getElementById("quickEnabledToggle").checked;
          const algorithm = parseInt(
            document.getElementById("quickAlgorithmSelect").value,
          );
          const msgDiv = document.getElementById("quickConfigMessage");

          try {
            await ApiClient.updateMaskingConfig(enabled, algorithm);
            msgDiv.innerHTML = `<div class="mt-2 text-green-600 text-sm font-semibold">✓ Cập nhật thành công!</div>`;
            setTimeout(() => loadMaskingConfig(), 1500);
          } catch (error) {
            msgDiv.innerHTML = `<div class="mt-2 text-red-600 text-sm font-semibold">✗ ${error.message}</div>`;
          }
        });
    } catch (error) {
      document.getElementById("maskingConfigContent").innerHTML = `
        <div class="text-red-600 text-sm">Lỗi: ${error.message}</div>
      `;
    }
  }

  async function loadUsers() {
    try {
      document.getElementById("loadingSpinner").classList.remove("hidden");
      const response = await ApiClient.getUsers(
        maskingEnabled,
        currentPage * pageSize,
        pageSize,
      );
      const users = response.data.items;
      const total = response.data.total;

      renderUsersTable(users);
      renderPaginationControls(total);
      document.getElementById("loadingSpinner").classList.add("hidden");

      // Load masking config
      if (AuthManager.isAdmin()) {
        await loadMaskingConfig();
      }
    } catch (error) {
      document.getElementById("usersTable").innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Lỗi: ${error.message}
                </div>
            `;
    }
  }

  function renderUsersTable(users) {
    const tableHtml = `
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-100 border-b">
                        <tr>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Username</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Hành động</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${users
                          .map(
                            (u) => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-3 text-sm text-gray-600">${u.id}</td>
                                <td class="px-6 py-3 text-sm font-medium text-gray-900">${u.username}</td>
                                <td class="px-6 py-3 text-sm text-gray-600">${u.email}</td>
                                <td class="px-6 py-3 text-sm text-gray-600">${u.phone}</td>
                                <td class="px-6 py-3 text-sm">
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                                      u.role === "Admin"
                                        ? "bg-red-100 text-red-800"
                                        : u.role === "Viewer"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-green-100 text-green-800"
                                    }">
                                        ${u.role}
                                    </span>
                                </td>
                                <td class="px-6 py-3 text-sm">
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                                      u.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }">
                                        ${u.isActive ? "✓ Hoạt động" : "✗ Bị khóa"}
                                    </span>
                                </td>
                                <td class="px-6 py-3 text-sm space-x-2">
                                    <button onclick="Router.redirect('/user/${u.id}')" 
                                        class="text-blue-600 hover:text-blue-800 font-semibold">Xem</button>
                                    ${
                                      AuthManager.isAdmin() && u.role === "User"
                                        ? `
                                        <button onclick="promoteUserToViewer(${u.id})"
                                            class="text-purple-600 hover:text-purple-800 font-semibold">📈 Nâng cấp</button>
                                    `
                                        : ""
                                    }
                                    ${
                                      AuthManager.isAdmin()
                                        ? `
                                        <button onclick="toggleUserActive(${u.id}, ${!u.isActive})"
                                            class="text-orange-600 hover:text-orange-800 font-semibold">
                                            ${u.isActive ? "Khóa" : "Mở khóa"}
                                        </button>
                                    `
                                        : ""
                                    }
                                </td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
    document.getElementById("usersTable").innerHTML = tableHtml;
  }

  function renderPaginationControls(total) {
    const totalPages = Math.ceil(total / pageSize);
    const paginationHtml = `
            <div class="flex justify-between items-center">
                <div class="text-gray-600">
                    Hiển thị ${currentPage * pageSize + 1} đến ${Math.min((currentPage + 1) * pageSize, total)} trong ${total} người dùng
                </div>
                <div class="flex gap-2">
                    <button onclick="previousPage()" ${currentPage === 0 ? "disabled" : ""}
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50">← Trước</button>
                    <span class="px-4 py-2 text-gray-700">Trang ${currentPage + 1}/${totalPages}</span>
                    <button onclick="nextPage()" ${currentPage >= totalPages - 1 ? "disabled" : ""}
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50">Tiếp →</button>
                </div>
            </div>
        `;
    document.getElementById("pagination").innerHTML = paginationHtml;
  }

  window.previousPage = () => {
    currentPage = Math.max(0, currentPage - 1);
    loadUsers();
  };

  window.nextPage = () => {
    currentPage++;
    loadUsers();
  };

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
        <div class="min-h-screen bg-gray-50">
            ${renderNavbar()}
            
            <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onclick="Router.redirect('/dashboard')" class="text-blue-600 hover:text-blue-800 mb-6 font-semibold">
                    ← Quay lại danh sách
                </button>
                
                <div id="userDetail" class="bg-white rounded-lg shadow-md p-8">
                    <div class="flex justify-center py-8">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Bạn không có quyền xem thông tin người dùng này
                </div>
            `;
      return;
    }

    const html = `
            <h2 class="text-3xl font-bold text-gray-900 mb-6">Chi tiết người dùng</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700">ID</label>
                    <p class="mt-1 text-gray-900 font-semibold">${user.id}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                    <p class="mt-1 text-gray-900 font-semibold">${user.username}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <p class="mt-1 text-gray-900 font-semibold">${user.email}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <p class="mt-1 text-gray-900 font-semibold">${user.phone}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Role</label>
                    <p class="mt-1 text-gray-900 font-semibold">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === "Admin"
                            ? "bg-red-100 text-red-800"
                            : user.role === "Viewer"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }">
                            ${user.role}
                        </span>
                    </p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Trạng thái</label>
                    <p class="mt-1 text-gray-900 font-semibold">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }">
                            ${user.isActive ? "✓ Hoạt động" : "✗ Bị khóa"}
                        </span>
                    </p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Ngày tạo</label>
                    <p class="mt-1 text-gray-900 font-semibold">${new Date(user.createdAt).toLocaleString("vi-VN")}</p>
                </div>
            </div>

            <div class="mt-8 flex gap-4">
                ${
                  AuthManager.canEdit(userId)
                    ? `
                    <button onclick="Router.redirect('/user/${userId}/edit')" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold">
                        ✏️ Sửa thông tin
                    </button>
                `
                    : ""
                }
                ${
                  AuthManager.isAdmin() && userId !== AuthManager.getUser().id
                    ? `
                    <button onclick="deleteUserConfirm(${userId})" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold">
                        🗑️ Xóa người dùng
                    </button>
                `
                    : ""
                }
            </div>
        `;

    document.getElementById("userDetail").innerHTML = html;
  } catch (error) {
    document.getElementById("userDetail").innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                Lỗi: ${error.message}
            </div>
        `;
  }
}

// ==================== RENDER EDIT USER ====================
async function renderEditUser() {
  const userId = parseInt(window.location.hash.split("/")[2]);
  const app = document.getElementById("app");

  app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            ${renderNavbar()}
            
            <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onclick="Router.redirect('/user/${userId}')" class="text-blue-600 hover:text-blue-800 mb-6 font-semibold">
                    ← Quay lại
                </button>
                
                <div id="editFormContainer" class="bg-white rounded-lg shadow-md p-8">
                    <div class="flex justify-center py-8">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Bạn không có quyền chỉnh sửa người dùng này
                </div>
            `;
      return;
    }

    const html = `
            <h2 class="text-3xl font-bold text-gray-900 mb-6">Chỉnh sửa người dùng</h2>
            
            <form id="editForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                    <input type="text" id="editUsername" value="${user.username}" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="editEmail" value="${user.email}" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input type="tel" id="editPhone" value="${user.phone}" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới (để trống nếu không thay đổi)</label>
                    <input type="password" id="editPassword" placeholder="••••••••"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div id="editError" class="text-red-600 text-sm hidden"></div>
                <div id="editSuccess" class="text-green-600 text-sm hidden"></div>

                <div class="flex gap-4 mt-6">
                    <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition">
                        💾 Lưu thay đổi
                    </button>
                    <button type="button" onclick="Router.redirect('/user/${userId}')" class="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 font-semibold transition">
                        Hủy
                    </button>
                </div>
            </form>
        `;

    document.getElementById("editFormContainer").innerHTML = html;

    document
      .getElementById("editForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("editUsername").value;
        const email = document.getElementById("editEmail").value;
        const phone = document.getElementById("editPhone").value;
        const password = document.getElementById("editPassword").value;
        const errorDiv = document.getElementById("editError");
        const successDiv = document.getElementById("editSuccess");

        try {
          await ApiClient.updateUser(
            userId,
            username,
            email,
            phone,
            password || user.password,
          );
          successDiv.textContent = "Cập nhật thành công!";
          successDiv.classList.remove("hidden");
          setTimeout(() => Router.redirect("/user/" + userId), 1500);
        } catch (error) {
          errorDiv.textContent = "Lỗi: " + error.message;
          errorDiv.classList.remove("hidden");
        }
      });
  } catch (error) {
    document.getElementById("editFormContainer").innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                Lỗi: ${error.message}
            </div>
        `;
  }
}

// ==================== HELPER FUNCTIONS ====================
function renderNavbar() {
  const user = AuthManager.getUser();
  return `
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div class="flex items-center gap-8">
                    <h1 class="text-2xl font-bold text-blue-600 cursor-pointer" onclick="Router.redirect('/')">👥 User Management</h1>
                    <div class="flex gap-6">
                        <a href="#/dashboard" class="text-gray-700 hover:text-blue-600 font-semibold">📊 Dashboard</a>
                        <a href="#/profile" class="text-gray-700 hover:text-green-600 font-semibold">👤 Profile</a>
                        ${
                          AuthManager.isAdmin()
                            ? `<a href="#/admin/masking-config" class="text-gray-700 hover:text-orange-600 font-semibold">⚙️ Cấu hình</a>`
                            : ""
                        }
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-gray-700"><strong>${user.username}</strong> (${user.role})</span>
                    <button onclick="AuthManager.logout()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                        Đăng xuất
                    </button>
                </div>
            </div>
        </nav>
    `;
}

// ==================== RENDER PROFILE ====================
async function renderProfile() {
  const app = document.getElementById("app");
  const user = AuthManager.getUser();

  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavbar()}
      
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onclick="Router.redirect('/')" class="text-blue-600 hover:text-blue-800 mb-6 font-semibold">
          ← Quay lại trang chính
        </button>
        
        <div id="profileContainer" class="bg-white rounded-lg shadow-md p-8">
          <div class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await ApiClient.getCurrentUser();
    const profileUser = response.data;

    const html = `
      <div class="space-y-6">
        <!-- Profile Header -->
        <div class="text-center pb-6 border-b">
          <div class="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl mb-4">
            👤
          </div>
          <h2 class="text-3xl font-bold text-gray-900">${profileUser.username}</h2>
          <p class="text-gray-600 mt-1">
            <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              profileUser.role === "Admin"
                ? "bg-red-100 text-red-800"
                : profileUser.role === "Viewer"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
            }">
              ${profileUser.role}
            </span>
          </p>
        </div>

        <!-- Profile Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-4 bg-gray-50 rounded-lg">
            <label class="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <p class="text-lg font-semibold text-gray-900 break-all">${profileUser.email}</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <label class="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
            <p class="text-lg font-semibold text-gray-900">${profileUser.phone}</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <label class="block text-sm font-medium text-gray-600 mb-1">Trạng thái</label>
            <p class="text-lg font-semibold">
              <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                profileUser.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }">
                ${profileUser.isActive ? "✓ Hoạt động" : "✗ Bị khóa"}
              </span>
            </p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <label class="block text-sm font-medium text-gray-600 mb-1">Ngày tạo</label>
            <p class="text-sm text-gray-900">${new Date(profileUser.createdAt).toLocaleString("vi-VN")}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 pt-6 border-t">
          <button onclick="Router.redirect('/user/' + ${user.id} + '/edit')" 
            class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition">
            ✏️ Chỉnh sửa thông tin
          </button>
          <button onclick="Router.redirect('/')" 
            class="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 font-semibold transition">
            Quay lại
          </button>
        </div>

        <!-- Additional Info -->
        <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 class="font-semibold text-blue-900 mb-2">💡 Thông tin thêm</h3>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• Bạn có thể chỉnh sửa thông tin cá nhân của mình bằng nút "Chỉnh sửa"</li>
            <li>• Mật khẩu được mã hóa an toàn trên server</li>
            <li>• Email và số điện thoại được bảo vệ bằng mã hóa AES-256</li>
            <li>• Nếu tài khoản bị khóa, bạn sẽ không thể đăng nhập</li>
          </ul>
        </div>
      </div>
    `;

    document.getElementById("profileContainer").innerHTML = html;
  } catch (error) {
    document.getElementById("profileContainer").innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Lỗi: ${error.message}
      </div>
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
            <div class="bg-white rounded-lg shadow-md p-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-6">📊 Demo Data Masking - 4 Phương Pháp</h3>
                
                <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                    <p class="text-gray-700"><strong>Dữ liệu gốc:</strong></p>
                    <p class="text-gray-600">Email: ${data.original.email}</p>
                    <p class="text-gray-600">Phone: ${data.original.phone}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <h4 class="font-bold text-green-700 mb-2">1️⃣ Character Masking (Che ký tự)</h4>
                        <p class="text-gray-600 mb-2">${data.characterMasking.description}</p>
                        <p class="font-mono bg-white p-2 rounded">Email: ${data.characterMasking.email}</p>
                        <p class="font-mono bg-white p-2 rounded">Phone: ${data.characterMasking.phone}</p>
                    </div>

                    <div class="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <h4 class="font-bold text-yellow-700 mb-2">2️⃣ Data Shuffling (Xáo trộn)</h4>
                        <p class="text-gray-600 mb-2">${data.datashuffling.description}</p>
                        <p class="font-mono bg-white p-2 rounded">Email: ${data.datashuffling.email}</p>
                        <p class="font-mono bg-white p-2 rounded">Phone: ${data.datashuffling.phone}</p>
                    </div>

                    <div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                        <h4 class="font-bold text-purple-700 mb-2">3️⃣ Data Substitution (Thay thế)</h4>
                        <p class="text-gray-600 mb-2">${data.datasubstitution.description}</p>
                        <p class="font-mono bg-white p-2 rounded">Email: ${data.datasubstitution.email}</p>
                        <p class="font-mono bg-white p-2 rounded">Phone: ${data.datasubstitution.phone}</p>
                    </div>

                    <div class="p-4 bg-pink-50 rounded-lg border-l-4 border-pink-500">
                        <h4 class="font-bold text-pink-700 mb-2">4️⃣ Noise Addition (Thêm nhiễu)</h4>
                        <p class="text-gray-600 mb-2">${data.noiseaddition.description}</p>
                        <p class="font-mono bg-white p-2 rounded">Email: ${data.noiseaddition.email}</p>
                        <p class="font-mono bg-white p-2 rounded">Phone: ${data.noiseaddition.phone}</p>
                    </div>
                </div>

                <button onclick="document.getElementById('maskingDemoContainer').innerHTML = ''" class="mt-6 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                    Đóng
                </button>
            </div>
        `;

    document.getElementById("maskingDemoContainer").innerHTML = html;
  } catch (error) {
    document.getElementById("maskingDemoContainer").innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                Lỗi: ${error.message}
            </div>
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
    <div class="min-h-screen bg-gray-50">
      ${renderNavbar()}
      
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onclick="Router.redirect('/')" class="text-blue-600 hover:text-blue-800 mb-6 font-semibold">
          ← Quay lại trang chính
        </button>
        
        <div class="bg-white rounded-lg shadow-md p-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-6">⚙️ Cấu Hình Data Masking</h2>
          
          <div id="loadingSpinner" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          
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
      <div class="space-y-8">
        <!-- Current Configuration -->
        <div class="border-b pb-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">📊 Cấu Hình Hiện Tại</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-gray-600">Trạng thái</p>
              <p class="text-2xl font-bold text-blue-600 mt-1">
                ${currentConfig.enabled ? "✓ Bật" : "✗ Tắt"}
              </p>
            </div>
            <div class="p-4 bg-green-50 rounded-lg">
              <p class="text-sm text-gray-600">Phương pháp hiện tại</p>
              <p class="text-2xl font-bold text-green-600 mt-1">${currentConfig.algorithmName}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600">Cập nhật lần cuối</p>
              <p class="text-sm text-gray-700 mt-1">${new Date(
                currentConfig.updatedAt,
              ).toLocaleString("vi-VN")}</p>
            </div>
          </div>
        </div>

        <!-- Update Configuration -->
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-4">🔧 Cập Nhật Cấu Hình</h3>
          <form id="configForm" class="space-y-4">
            <!-- Toggle Enabled -->
            <div class="p-4 border border-gray-300 rounded-lg">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="enabledToggle" ${
                  currentConfig.enabled ? "checked" : ""
                }
                  class="w-5 h-5 text-blue-600 rounded">
                <span class="text-gray-700 font-semibold">Bật Data Masking cho Viewer Users</span>
              </label>
              <p class="text-sm text-gray-600 mt-2">Khi bật, tất cả Viewer users sẽ thấy dữ liệu bị che giấu</p>
            </div>

            <!-- Algorithm Selection -->
            <div class="p-4 border border-gray-300 rounded-lg">
              <label class="block text-sm font-medium text-gray-700 mb-2">Chọn phương pháp Masking</label>
              <select id="algorithmSelect" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                ${algorithms
                  .map(
                    (algo) => `
                  <option value="${algo.id}" ${
                    algo.id === currentConfig.algorithm ? "selected" : ""
                  }>
                    ${algo.name} - ${algo.description}
                  </option>
                `,
                  )
                  .join("")}
              </select>
              <p class="text-sm text-gray-600 mt-2">Phương pháp được chọn sẽ áp dụng cho tất cả Viewer users</p>
            </div>

            <!-- Buttons -->
            <div class="flex gap-4 mt-6">
              <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition">
                💾 Lưu Cấu Hình
              </button>
              <button type="button" onclick="Router.redirect('/')" class="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 font-semibold transition">
                Hủy
              </button>
            </div>
          </form>

          <div id="updateMessage"></div>
        </div>

        <!-- Algorithm Details -->
        <div class="border-t pt-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">📋 Danh Sách Phương Pháp Masking</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${algorithms
              .map(
                (algo) => `
              <div class="p-4 border border-gray-300 rounded-lg hover:shadow-md transition">
                <h4 class="font-bold text-gray-900">${algo.id}. ${algo.name}</h4>
                <p class="text-sm text-gray-600 mt-2">${algo.description}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    document.getElementById("loadingSpinner").classList.add("hidden");
    document.getElementById("configContainer").innerHTML = html;

    // Handle form submission
    document
      .getElementById("configForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const enabled = document.getElementById("enabledToggle").checked;
        const algorithm = parseInt(
          document.getElementById("algorithmSelect").value,
        );
        const messageDiv = document.getElementById("updateMessage");

        try {
          await ApiClient.updateMaskingConfig(enabled, algorithm);
          messageDiv.innerHTML = `
          <div class="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✓ Cập nhật cấu hình thành công!
          </div>
        `;
          setTimeout(() => renderAdminMaskingConfig(), 2000);
        } catch (error) {
          messageDiv.innerHTML = `
          <div class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            ✗ Lỗi: ${error.message}
          </div>
        `;
        }
      });
  } catch (error) {
    document.getElementById("loadingSpinner").classList.add("hidden");
    document.getElementById("configContainer").innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Lỗi: ${error.message}
      </div>
    `;
  }
}
