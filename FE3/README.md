# 📚 Frontend Documentation - User Management System

## 🎯 Tổng Quan

Project frontend xây dựng giao diện quản lý người dùng với:

- **HTML5** - Cấu trúc semantic
- **Tailwind CSS** - Styling hiện đại (CDN)
- **JavaScript Vanilla** - Logic & API calls (không cần framework)
- **Axios** - HTTP client để gọi API

---

## 📁 Cấu Trúc Project

```
FE3/
├── index.html                 # Main entry point
├── js/
│   ├── config.js             # Cấu hình API & constants
│   ├── auth.js               # Quản lý authentication
│   ├── api.js                # API client (Axios wrapper)
│   ├── router.js             # Simple SPA router
│   └── main.js               # Tất cả các page components
└── README.md                 # Tài liệu này
```

---

## 🚀 Cách Chạy

### 1. Yêu Cầu

- Backend đang chạy tại: `http://localhost:5000`
- Browser hiện đại (Chrome, Firefox, Safari, Edge)
- Không cần build process

### 2. Chạy Ứng Dụng

**Cách 1: Dùng Live Server (VS Code)**

```
1. Cài extension "Live Server"
2. Click chuột phải vào index.html → "Open with Live Server"
3. Truy cập: http://127.0.0.1:5500
```

**Cách 2: Dùng Python**

```bash
# Python 3
python -m http.server 8000

# Truy cập: http://localhost:8000
```

**Cách 3: Dùng Node.js**

```bash
npm install -g http-server
http-server
# Truy cập: http://localhost:8080
```

---

## 📄 File Config (config.js)

```javascript
const API_CONFIG = {
  BASE_URL: "http://localhost:5000/api", // API backend
  TOKEN_KEY: "auth_token", // localStorage key
  USER_KEY: "current_user", // localStorage key
  ROLE_KEY: "user_role", // localStorage key
};

const ROLES = {
  ADMIN: "Admin", // Admin role
  USER: "User", // Regular user
  VIEWER: "Viewer", // Read-only user
};

const PUBLIC_ROUTES = ["/login", "/register"]; // Routes không cần auth

const ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
  },
  USERS: {
    GET_ALL: "/users",
    GET_BY_ID: "/users/{id}",
    UPDATE: "/users/{id}",
    DELETE: "/users/{id}",
    TOGGLE_ACTIVE: "/users/{id}/active",
  },
  MASKING: {
    DEMO: "/masking/demo",
    USER: "/masking/user/{id}",
  },
};
```

**Chỉnh sửa:** Nếu backend chạy ở domain khác, sửa `BASE_URL` trong config.js

---

## 🔐 Authentication (auth.js)

### AuthManager Class

```javascript
// Lưu token JWT
AuthManager.setToken(token);

// Lấy token
const token = AuthManager.getToken();

// Lưu thông tin user
AuthManager.setUser({ id: 1, username: "john", role: "Admin" });

// Lấy thông tin user
const user = AuthManager.getUser();

// Lấy role
const role = AuthManager.getRole();

// Kiểm tra đã login chưa
if (AuthManager.isAuthenticated()) {
  // User đã login
}

// Kiểm tra role
if (AuthManager.isAdmin()) {
}
if (AuthManager.isViewer()) {
}
if (AuthManager.isUser()) {
}

// Kiểm tra quyền xem user
if (AuthManager.canView(userId)) {
}

// Kiểm tra quyền chỉnh sửa user
if (AuthManager.canEdit(userId)) {
}

// Kiểm tra quyền xóa user
if (AuthManager.canDelete(userId)) {
}

// Logout
AuthManager.logout(); // Clear localStorage + redirect to login
```

### Flow Authentication

1. **Register** → Nhập username, email, phone, password → Gọi `/auth/register`
2. **Login** → Nhập username, password → Gọi `/auth/login` → Lưu token
3. **Protected Page** → Kiểm tra token → Nếu hết hạn → Redirect `/login`
4. **Logout** → Xóa token → Redirect `/login`

---

## 🌐 API Client (api.js)

### ApiClient Class - Tất cả methods tĩnh

```javascript
// AUTHENTICATION
await ApiClient.register(username, email, phone, password);
await ApiClient.login(username, password);

// USERS
await ApiClient.getUsers((mask = true), (skip = 0), (limit = 10));
await ApiClient.getUserById(id, (mask = true));
await ApiClient.updateUser(id, username, email, phone, password);
await ApiClient.deleteUser(id);
await ApiClient.toggleUserActive(id, isActive);

// MASKING
await ApiClient.getMaskingDemo(email, phone);
await ApiClient.getUserWithMasking(id);
```

### Ví dụ sử dụng

```javascript
try {
  // Login
  const response = await ApiClient.login("john_doe", "password123");
  AuthManager.setToken(response.data.token);
  AuthManager.setUser({
    id: response.data.id,
    username: response.data.username,
    role: response.data.role,
  });

  // Get users
  const users = await ApiClient.getUsers(true, 0, 10);
  console.log(users.data.items);
} catch (error) {
  console.error(error.message); // Lỗi từ server hoặc mạng
}
```

### Error Handling

- **401 Unauthorized** → Token hết hạn → Logout tự động
- **403 Forbidden** → Không có quyền
- **404 Not Found** → Resource không tồn tại
- **400 Bad Request** → Validation error
- Network error → Hiển thị "Lỗi kết nối mạng"

---

## 🧭 Router (router.js)

### Simple SPA Router - Hash-based

```javascript
// Đăng ký route
router.register(
  "/path",
  () => {
    /* render function */
  },
  (requireAuth = true),
);

// Redirect
Router.redirect("/dashboard");

// Get current route
router.currentRoute; // '/dashboard'

// Routes tự động match từ hash
// http://localhost:8000#/dashboard → /dashboard
// http://localhost:8000#/user/1 → /user/:id (với id=1)
```

### Các Route hiện tại

```
/login          - Trang đăng nhập (public)
/register       - Trang đăng ký (public)
/               - Trang chủ dashboard (protected)
/dashboard      - Danh sách người dùng (protected)
/user/:id       - Chi tiết user (protected)
/user/:id/edit  - Chỉnh sửa user (protected)
```

---

## 🎨 Pages & Components (main.js)

### 1️⃣ Login Page (`/login`)

```javascript
renderLogin(); // Gọi từ router
```

**Features:**

- Form: username, password
- Button: "Đăng Nhập"
- Link: Chuyển sang "Đăng Ký"
- Validation: Real-time
- Error display: Hiển thị lỗi dưới form
- Success: Save token → redirect `/`

### 2️⃣ Register Page (`/register`)

```javascript
renderRegister(); // Gọi từ router
```

**Features:**

- Form: username, email, phone, password
- Button: "Đăng Ký"
- Link: Chuyển sang "Đăng Nhập"
- Validation: Real-time
- Error display: Hiển thị lỗi
- Success: Hiển thị message → redirect `/login`

### 3️⃣ Home/Dashboard (`/`)

```javascript
renderHome(); // Gọi từ router
```

**Features:**

- Navbar: Logo, user info, logout button
- Quick links: View users, View profile, Demo masking
- Welcome message: Chào mừng user

### 4️⃣ Users List (`/dashboard`)

```javascript
renderDashboard(); // Gọi từ router
```

**Features:**

- Table: ID, Username, Email, Phone, Role, Status, Actions
- Pagination: Skip/Limit (10 per page)
- Masking toggle: Chỉ Admin
- Role badges: Color-coded
- Status badges: Active/Inactive
- Actions:
  - View (tất cả role)
  - Edit (Admin + chính mình)
  - Delete (Admin only)
  - Lock/Unlock (Admin only)
- Loading spinner: Khi fetch data
- Error handling: Hiển thị error message

### 5️⃣ User Detail (`/user/:id`)

```javascript
renderUserDetail(); // Gọi từ router
```

**Features:**

- Display: ID, Username, Email, Phone, Role, Status, Created At
- Buttons:
  - Edit (nếu có quyền)
  - Delete (Admin only)
- Back button: Quay lại dashboard
- Permission check: Kiểm tra quyền xem

### 6️⃣ Edit User (`/user/:id/edit`)

```javascript
renderEditUser(); // Gọi từ router
```

**Features:**

- Form: Username, Email, Phone, Password (optional)
- Validation: Real-time
- Submit: Call `updateUser` API
- Success: Redirect `/user/:id`
- Error: Hiển thị error message
- Cancel: Quay lại chi tiết user
- Pre-filled: Lấy data từ API

### 7️⃣ Masking Demo (Modal)

```javascript
renderMaskingDemo(); // Call từ home page
```

**Features:**

- Show 4 masking methods:
  1. Character Masking: `j***@example.com`
  2. Data Shuffling: `nhjo@example.com`
  3. Data Substitution: `alice@example.com`
  4. Noise Addition: `jo@h_n@example.com`
- Close button: Đóng modal

---

## 🎯 Functionality Map

### User Registration Flow

```
User → Click "Đăng ký" → renderRegister()
→ Fill form (username, email, phone, password)
→ Submit → ApiClient.register()
→ Success: Show message → Redirect /login
→ Error: Show error message
```

### User Login Flow

```
User → Click "Đăng nhập" → renderLogin()
→ Fill form (username, password)
→ Submit → ApiClient.login()
→ Success:
    - AuthManager.setToken(token)
    - AuthManager.setUser(user)
    - Redirect /
→ Error: Show error message
```

### View User List Flow

```
User → renderDashboard()
→ ApiClient.getUsers(mask, skip, limit)
→ Render table with pagination
→ Click actions:
    - View: Router.redirect(/user/:id)
    - Edit: Router.redirect(/user/:id/edit)
    - Delete: Confirm → ApiClient.deleteUser()
    - Lock/Unlock: ApiClient.toggleUserActive()
```

### Update User Flow

```
User → Click Edit → renderEditUser()
→ Fetch user data: ApiClient.getUserById()
→ Pre-fill form
→ User edits + Submit
→ ApiClient.updateUser()
→ Success: Show message → Redirect /user/:id
→ Error: Show error message
```

---

## 🔒 Role-Based Access Control

| Feature                    | Admin | Viewer | User |
| -------------------------- | :---: | :----: | :--: |
| View all users             |  ✅   |   ✅   |  ❌  |
| View user detail           |  ✅   |   ✅   | ✅\* |
| Edit user                  |  ✅   |   ❌   | ✅\* |
| Delete user                |  ✅   |   ❌   |  ❌  |
| Lock/Unlock user           |  ✅   |   ❌   |  ❌  |
| Toggle masking (dashboard) |  ✅   |   ❌   |  ❌  |
| View masking methods       |  ✅   |   ❌   |  ❌  |

**Note:** `✅*` = Chỉ có thể xem/edit chính mình

### Implementation

```javascript
// Check permission
if (!AuthManager.canView(userId)) {
  // Show error message
}

if (!AuthManager.canEdit(userId)) {
  // Hide edit button
}

if (!AuthManager.isAdmin()) {
  // Hide admin-only features
}
```

---

## 🎨 UI Components

### Navbar

```javascript
function renderNavbar() {
  return `
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <h1 class="text-2xl font-bold text-blue-600">👥 User Management</h1>
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
```

### Loading Spinner

```html
<div class="flex justify-center py-8">
  <div
    class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
  ></div>
</div>
```

### Error Message

```html
<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
  Lỗi: ${error.message}
</div>
```

### Success Message

```html
<div
  class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
>
  Thành công!
</div>
```

### Role Badge

```html
<span
  class="px-2 py-1 rounded-full text-xs font-semibold ${
    user.role === 'Admin' ? 'bg-red-100 text-red-800' :
    user.role === 'Viewer' ? 'bg-blue-100 text-blue-800' :
    'bg-green-100 text-green-800'
}"
>
  ${user.role}
</span>
```

---

## 📝 Input Validation

### Client-side Validation

```javascript
// Username: 3-50 chars, alphanumeric + underscore
const usernamePattern = /^[a-zA-Z0-9_]{3,50}$/;

// Email: Standard email format
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone: 10-15 digits, can start with +
const phonePattern = /^[\+]?[0-9]{10,15}$/;

// Password: 6-100 chars
const passwordPattern = /^.{6,100}$/;
```

**Note:** Backend cũng validate, front-end validation chỉ để UX

### Example Form Validation

```javascript
const username = document.getElementById("username").value;
if (!usernamePattern.test(username)) {
  showError("Username phải 3-50 ký tự, chỉ chứa chữ số, chữ cái và _");
  return;
}
```

---

## 🔄 State Management

### localStorage

```javascript
// Login state
localStorage.setItem("auth_token", token);
localStorage.setItem("current_user", JSON.stringify(user));
localStorage.setItem("user_role", role);

// Logout
localStorage.removeItem("auth_token");
localStorage.removeItem("current_user");
localStorage.removeItem("user_role");
```

### Check Auth Status

```javascript
// On page load
if (!AuthManager.isAuthenticated()) {
  Router.redirect("/login");
}

// On protected route
if (route.requireAuth && !AuthManager.isAuthenticated()) {
  Router.redirect("/login");
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: New User Registration

```
1. Go to /register
2. Fill: username=testuser, email=test@example.com, phone=0901234567, password=Test123
3. Click "Đăng Ký"
4. See success message
5. Redirected to /login
```

### Scenario 2: User Login

```
1. Go to /login
2. Enter: username=testuser, password=Test123
3. Click "Đăng Nhập"
4. Token saved in localStorage
5. Redirected to home page
```

### Scenario 3: View Users (Admin)

```
1. Login as Admin
2. Go to /dashboard
3. See table with all users
4. Toggle masking checkbox
5. See email/phone masked/unmasked
```

### Scenario 4: Edit Own Profile (User)

```
1. Login as regular User
2. Click "/user/1/edit"
3. Update email, phone, password
4. Click "Lưu thay đổi"
5. Redirected back to user detail
6. See updated info
```

### Scenario 5: Delete User (Admin)

```
1. Login as Admin
2. Go to /dashboard
3. Find user → Click "Xóa"
4. Confirm delete
5. User removed from table
```

### Scenario 6: Lock Account (Admin)

```
1. Login as Admin
2. Go to /dashboard
3. Find active user → Click "Khóa"
4. Account status changes to "✗ Bị khóa"
5. User can't login anymore
```

---

## 🚨 Error Handling

### Common Errors

| Error            | Cause              | Solution                                      |
| ---------------- | ------------------ | --------------------------------------------- |
| 401 Unauthorized | Token expired      | Login again                                   |
| 403 Forbidden    | No permission      | Check role permissions                        |
| 404 Not Found    | User doesn't exist | Refresh page                                  |
| 400 Bad Request  | Invalid input      | Check form validation                         |
| Network error    | Backend down       | Check if backend is running at localhost:5000 |

### Error Display

```javascript
try {
  const response = await ApiClient.getUsers();
} catch (error) {
  // Error message từ API
  const message = error.message;

  // Show in UI
  const errorDiv = document.getElementById("error");
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
}
```

---

## 🎓 Code Examples

### Example 1: Fetch và Display Users

```javascript
async function loadUsers(mask = true, skip = 0, limit = 10) {
  try {
    const response = await ApiClient.getUsers(mask, skip, limit);
    const users = response.data.items;

    // Render table
    users.forEach((user) => {
      // Create row
    });
  } catch (error) {
    console.error(error.message);
  }
}
```

### Example 2: Update User

```javascript
async function updateUserProfile(userId, updates) {
  try {
    await ApiClient.updateUser(
      userId,
      updates.username,
      updates.email,
      updates.phone,
      updates.password,
    );

    alert("Cập nhật thành công!");
    Router.redirect("/user/" + userId);
  } catch (error) {
    alert("Lỗi: " + error.message);
  }
}
```

### Example 3: Check Permission & Render

```javascript
function renderUserActions(user) {
  let html = '<button onclick="viewUser(${user.id})">Xem</button>';

  if (AuthManager.canEdit(user.id)) {
    html += '<button onclick="editUser(${user.id})">Sửa</button>';
  }

  if (AuthManager.canDelete(user.id)) {
    html += '<button onclick="deleteUser(${user.id})">Xóa</button>';
  }

  return html;
}
```

---

## 📱 Responsive Design

Project sử dụng Tailwind CSS grid system:

```html
<!-- Mobile first, then tablet/desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Columns -->
</div>

<!-- Tailwind breakpoints -->
sm: 640px md: 768px lg: 1024px xl: 1280px 2xl: 1536px
```

---

## 🔧 Troubleshooting

### Issue: "Lỗi kết nối mạng"

**Solution:**

1. Check if backend is running: `http://localhost:5000`
2. Check if `BASE_URL` in config.js is correct
3. Check browser console for CORS errors

### Issue: "401 Unauthorized" / Auto logout

**Solution:**

1. Token expired (60 minutes) → Login again
2. Token không được lưu → Check localStorage
3. Backend session timed out → Check backend logs

### Issue: Buttons don't work

**Solution:**

1. Check console for JavaScript errors
2. Check network tab for failed API calls
3. Check if required fields are filled in forms

### Issue: Page doesn't load after register

**Solution:**

1. Backend validation failed → Check form inputs
2. Database error → Check backend logs
3. Network issue → Check console errors

---

## 📞 Contact & Support

Nếu gặp vấn đề:

1. Check console (F12 → Console tab)
2. Check network tab (F12 → Network tab)
3. Check backend logs
4. Contact backend team

---

## 📝 Notes

- **No Build Process**: Chạy trực tiếp HTML file, không cần npm install
- **CDN Libraries**: Tailwind CSS & Axios từ CDN, tự động load
- **localStorage**: Token & user info lưu ở localStorage (client-side)
- **SPA**: Single Page Application, không reload page, dùng hash routing
- **Responsive**: Tất cả pages responsive, hoạt động tốt trên mobile/tablet

---

## 🔗 Useful Links

- **Backend API**: http://localhost:5000
- **Swagger Docs**: http://localhost:5000/swagger
- **Frontend**: http://localhost:8000 (hoặc port khác)
- **Tailwind CSS Docs**: https://tailwindcss.com
- **Axios Docs**: https://axios-http.com

---

**Happy coding! 🚀**
