# 🏗️ CẤU TRÚC MODULE CỦA PROJECT

## 📌 Tổng Quan

Project được chia thành **2 phần chính:**

1. **Backend:** ASP.NET Core 10.0 + SQL Server
2. **Frontend:** JavaScript Vanilla + HTML/CSS

---

## 🔙 BACKEND MODULES (C# .NET)

### 📂 Tier 1: CONTROLLERS (API Endpoints)

**Vị Trí:** `/Controllers/`
**Vai Trò:** Tiếp nhận request từ client, gọi Services, trả về response

#### 1️⃣ AuthController.cs

```
Endpoint Prefix: /api/auth
Công khai: ✅ (Không cần JWT)
```

| Method | Endpoint    | Chức Năng             | Request         | Response                           |
| ------ | ----------- | --------------------- | --------------- | ---------------------------------- |
| POST   | `/register` | Đăng ký tài khoản mới | RegisterRequest | ApiResponse<UserResponse> + Token  |
| POST   | `/login`    | Đăng nhập             | LoginRequest    | ApiResponse<LoginResponse> + Token |

**Dependency:**

```csharp
- IUserService (Register, Login)
```

---

#### 2️⃣ UsersController.cs

```
Endpoint Prefix: /api/users
Bảo vệ: ✅ JWT + Role
```

| Method | Endpoint                  | Quyền         | Chức Năng                    |
| ------ | ------------------------- | ------------- | ---------------------------- |
| GET    | `/`                       | Admin, Viewer | Danh sách users (có masking) |
| GET    | `/{id}`                   | Admin, Viewer | Chi tiết 1 user (có masking) |
| PUT    | `/{id}`                   | Admin, User\* | Cập nhật user                |
| DELETE | `/{id}`                   | Admin         | Xóa user                     |
| PATCH  | `/{id}/active`            | Admin         | Lock/Unlock tài khoản        |
| PATCH  | `/{id}/promote-to-viewer` | Admin         | Nâng cấp vai trò             |

**Dependency:**

```csharp
- IUserService (CRUD, GetUsers, GetUserById, etc.)
- IMaskingConfigService (ApplyMaskingToEmail, ApplyMaskingToPhone)
```

---

#### 3️⃣ AdminController.cs

```
Endpoint Prefix: /api/admin
Bảo vệ: ✅ JWT + Role = Admin
```

| Method | Endpoint              | Chức Năng                     |
| ------ | --------------------- | ----------------------------- |
| GET    | `/masking-config`     | Lấy cấu hình masking hiện tại |
| PUT    | `/masking-config`     | Cập nhật cấu hình masking     |
| GET    | `/masking-algorithms` | Lấy danh sách thuật toán      |

**Dependency:**

```csharp
- IMaskingConfigService (GetConfig, UpdateConfig)
```

---

#### 4️⃣ MaskingController.cs

```
Endpoint Prefix: /api/masking
Bảo vệ: ✅ JWT
```

| Method | Endpoint     | Chức Năng                       |
| ------ | ------------ | ------------------------------- |
| POST   | `/demo`      | Demo các phương pháp masking    |
| GET    | `/user/{id}` | Xem user với masking            |
| GET    | `/users`     | Xem danh sách users với masking |

**Dependency:**

```csharp
- IUserService
- DataMaskingService
```

---

### 📂 Tier 2: SERVICES (Business Logic)

**Vị Trị:** `/Services/`
**Vai Trò:** Xử lý logic ứng dụng, gọi Repositories, gọi các service khác

#### 1️⃣ UserService.cs

```
Interface: IUserService
Chức Năng: Xử lý User (Auth, CRUD, Masking)
```

**Public Methods:**

```csharp
// ── Authentication ──
Task<ApiResponse<LoginResponse>> Login(LoginRequest request)
Task<ApiResponse<UserResponse>> Register(RegisterRequest request)

// ── CRUD ──
Task<ApiResponse<PaginatedUserResponse>> GetUsers(bool mask, int skip, int limit)
Task<ApiResponse<UserResponse>> GetUserById(int id, bool mask)
Task<ApiResponse<string>> UpdateUser(int id, UpdateUserRequest request)
Task<ApiResponse<string>> DeleteUser(int id)

// ── User Management ──
Task<ApiResponse<string>> SetUserActive(int id, bool isActive)
Task<ApiResponse<string>> PromoteUserToViewer(int id)
```

**Dependency:**

```csharp
- IUserRepository (Data access)
- SecurityService (Encrypt/Decrypt, Hash)
- DataMaskingService (Mask email, phone)
- JwtService (Generate token)
```

---

#### 2️⃣ SecurityService.cs

```
Vai Trò: Mã hóa, giải mã, hash password
Không có Interface (Singleton)
```

**Public Methods:**

```csharp
// ── Encryption ──
byte[] Encrypt(string data, int userKey)
string Decrypt(byte[] encryptedData, int userKey)

// ── Password Hashing ──
string HashPassword(string password)
bool VerifyPassword(string password, string storedHash)

// ── Helper ──
string GenerateUserKey()
```

**Cơ Chế:**

- Master Key = SHA256(Jwt:Key từ appsettings.json)
- User Key = Random Int (100k - 2.1B)
- Derived Key = SHA256(Master + User) → dùng cho AES-128

---

#### 3️⃣ Aes128Engine.cs

```
Vai Trò: Custom AES-128 Implementation
Được dùng bởi: SecurityService
```

**Public Methods:**

```csharp
byte[] Encrypt(string plainText, byte[] key, byte[] iv)
string Decrypt(byte[] cipherText, byte[] key, byte[] iv)
```

**Chi tiết:**

- AES-128 ECB mode (IV + Ciphertext)
- Sử dụng RandomNumberGenerator cho IV
- Kết hợp IV + Encrypted Data = Result

---

#### 4️⃣ JwtService.cs

```
Vai Trò: Tạo & Xác minh JWT Token
Được dùng bởi: UserService, Controllers
```

**Public Methods:**

```csharp
string GenerateToken(User user)
```

**Token Claims:**

```json
{
  "sub": "UserId",
  "name": "Username",
  "role": "Admin|User|Viewer",
  "iat": "IssuedAt",
  "exp": "ExpirationTime",
  "iss": "UserManagementAPI",
  "aud": "UserManagementClient"
}
```

---

#### 5️⃣ DataMaskingService.cs

```
Vai Trò: 4 Phương pháp che giấu dữ liệu
Được dùng bởi: UserService, MaskingConfigService
```

**4 Phương Pháp:**

```csharp
// 1️⃣ CHARACTER MASKING (Che ký tự)
public string MaskEmail(string email)      // j***@example.com
public string MaskPhone(string phone)      // +84****3210
public string MaskPassword(string _)       // ***

// 2️⃣ DATA SHUFFLING (Xáo trộn)
public string ShuffleEmail(string email)   // nhjo@example.com
public string ShufflePhone(string phone)   // +82345408865
private string ShuffleString(string input) // Core shuffle logic

// 3️⃣ DATA SUBSTITUTION (Thay thế)
public string SubstituteEmail(string email)   // sarah.wilson@outlook.com
public string SubstitutePhone(string phone)   // +84912345678

// 4️⃣ NOISE ADDITION (Thêm nhiễu)
public string AddNoiseToEmail(string email)   // jx9@example.c#m
public string AddNoiseToPhone(string phone)   // +8#4@86X5Y3210
private string AddNoiseToString(...)          // Core noise logic
```

---

#### 6️⃣ MaskingConfigService.cs

```
Vai Trò: Điều phối masking, cấu hình động
Được dùng bởi: AdminController, UsersController
```

**Public Methods:**

```csharp
// ── Configuration ──
Task<ApiResponse<MaskingConfigResponse>> GetConfig()
Task<ApiResponse<string>> UpdateConfig(MaskingConfigRequest request)

// ── Apply Masking ──
string ApplyMaskingToEmail(string email, MaskingConfig config)
string ApplyMaskingToPhone(string phone, MaskingConfig config)
```

**Logic:**

```csharp
// Quyết định dùng phương pháp nào
config.Algorithm switch {
    1 => _maskingService.MaskEmail/Phone(),
    2 => _maskingService.ShuffleEmail/Phone(),
    3 => _maskingService.SubstituteEmail/Phone(),
    4 => _maskingService.AddNoiseToEmail/Phone(),
    _ => email/phone
}
```

**Dependency:**

```csharp
- IMaskingConfigRepository (Get/Update config từ DB)
- DataMaskingService (Thực hiện masking)
```

---

### 📂 Tier 3: REPOSITORIES (Data Access)

**Vị Trí:** `/Repositories/`
**Vai Trò:** Truy cập database, tách SQL khỏi business logic

#### 1️⃣ UserRepository.cs

```
Interface: IUserRepository
Database: Users Table + Roles Table
```

**Public Methods:**

```csharp
// ── Query ──
Task<List<User>> GetUsers(int skip, int limit)
Task<User?> GetUserById(int id)
Task<User?> GetUserByUsername(string username)
Task<bool> UsernameExists(string username)

// ── Mutation ──
Task CreateUser(User user)
Task UpdateUser(User user)
Task DeleteUser(int id)

// ── User Management ──
Task SetUserActive(int id, bool isActive)
Task UpdateUserRole(int id, int roleId)
```

**Database Access:**

```csharp
using var connection = new SqlConnection(_connectionString);
using var command = connection.CreateCommand();
command.CommandText = "...";
await command.ExecuteReaderAsync();
```

---

#### 2️⃣ MaskingConfigRepository.cs

```
Interface: IMaskingConfigRepository
Database: MaskingConfig Table
```

**Public Methods:**

```csharp
Task<MaskingConfig?> GetConfig()
Task UpdateConfig(bool enabled, MaskingAlgorithm algorithm)
```

**Database Access:**

```sql
-- Get
SELECT TOP 1 Id, Enabled, Algorithm, CreatedAt, UpdatedAt
FROM MaskingConfig
ORDER BY Id DESC

-- Update
IF EXISTS (SELECT 1 FROM MaskingConfig)
    UPDATE MaskingConfig SET Enabled = @enabled, Algorithm = @algorithm
ELSE
    INSERT INTO MaskingConfig (Enabled, Algorithm, CreatedAt, UpdatedAt)
```

---

### 📂 Tier 4: MODELS (Data Structures)

**Vị Trí:** `/Models/Models.cs`
**Vai Trò:** Định nghĩa entities & DTOs

#### Entities (Database)

```csharp
public class User
{
    public int Id { get; set; }
    public string? Username { get; set; }
    public byte[]? EncryptedEmail { get; set; }      // AES-128
    public byte[]? EncryptedPhone { get; set; }      // AES-128
    public byte[]? EncryptedPassword { get; set; }   // Hash + AES-128
    public int Key { get; set; }                      // User key
    public int RoleId { get; set; }
    public string? RoleName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class Role
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class MaskingConfig
{
    public int Id { get; set; }
    public bool Enabled { get; set; }
    public MaskingAlgorithm Algorithm { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

#### Request DTOs (Từ Client)

```csharp
public class RegisterRequest
{
    public string Username { get; set; }            // 3-50 chars
    public string Email { get; set; }               // Valid format
    public string Phone { get; set; }               // 10-15 digits
    public string Password { get; set; }            // 6-100 chars
}

public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}

public class UpdateUserRequest
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Password { get; set; }
}

public class MaskingConfigRequest
{
    public bool Enabled { get; set; }
    public MaskingAlgorithm Algorithm { get; set; }
}
```

#### Response DTOs (Tới Client)

```csharp
public class UserResponse
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }        // May be masked
    public string Phone { get; set; }        // May be masked
    public string Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class LoginResponse
{
    public string Token { get; set; }
    public string Username { get; set; }
    public string Role { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class MaskingConfigResponse
{
    public bool Enabled { get; set; }
    public MaskingAlgorithm Algorithm { get; set; }
    public string AlgorithmName { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T Data { get; set; }
}
```

#### Enums

```csharp
public enum MaskingAlgorithm
{
    None = 0,                    // Không mask
    CharacterMasking = 1,        // Che ký tự
    DataShuffling = 2,           // Xáo trộn
    DataSubstitution = 3,        // Thay thế
    NoiseAddition = 4            // Thêm nhiễu
}
```

---

### 📂 Core Files

#### Program.cs

```csharp
Vai Trò: Startup configuration, Dependency Injection
```

**Chính:**

```csharp
// Services Registration
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMaskingConfigService, MaskingConfigService>();
builder.Services.AddScoped<DataMaskingService>();
builder.Services.AddScoped<SecurityService>();
builder.Services.AddScoped<JwtService>();

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IMaskingConfigRepository, MaskingConfigRepository>();

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => ...);

// CORS, Swagger, etc.
```

---

#### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=UserManagement;..."
  },
  "Jwt": {
    "Key": "ThisIsASecretKeyForJwtTokenGeneration2024!",
    "Issuer": "UserManagementAPI",
    "Audience": "UserManagementClient",
    "ExpiryMinutes": 60
  }
}
```

---

## 🎨 FRONTEND MODULES (JavaScript)

### 📂 Vị Trí: `/FE3/js/`

#### 1️⃣ config.js

```
Vai Trò: Cấu hình global (API URL, constants)
```

**Chứa:**

```javascript
export const API_BASE_URL = "https://localhost:5001/api";
export const ROUTES = { ... };
export const ROLES = { ADMIN: 1, USER: 2, VIEWER: 3 };
```

---

#### 2️⃣ api.js

```
Vai Trò: HTTP client, gọi backend API
```

**Functions:**

```javascript
// Authentication
async register(userData)
async login(username, password)

// Users
async getUsers(options)
async getUserById(id)
async updateUser(id, userData)
async deleteUser(id)

// Admin
async updateMaskingConfig(config)
async getMaskingConfig()

// Utils
setAuthToken(token)
clearAuthToken()
```

**Cơ Chế:**

```javascript
// Thêm JWT token vào header
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
}
```

---

#### 3️⃣ auth.js

```
Vai Trò: Quản lý authentication logic
```

**Functions:**

```javascript
async handleRegister(formData)
async handleLogin(username, password)
async handleLogout()
isAuthenticated()
getCurrentUser()
getCurrentRole()
canAccess(requiredRole)
```

---

#### 4️⃣ router.js

```
Vai Trò: Client-side routing (SPA)
```

**Functions:**

```javascript
defineRoutes();
navigateTo(path);
getCurrentRoute();
onRouteChange(callback);
```

**Routes:**

```javascript
/              → Home / Login page
/register      → Register page
/dashboard     → User dashboard
/admin         → Admin dashboard
/users         → Users list
```

---

#### 5️⃣ main.js

```
Vai Trò: Entry point, khởi tạo ứng dụng
```

**Chứa:**

```javascript
// Initialize
initializeApp();

// Event listeners
setupEventListeners();

// App state
appState = {
  user: null,
  token: null,
  role: null,
  users: [],
  maskingConfig: null,
};
```

---

### 📂 Vị Trí: `/FE3/pages/`

```
Vai Trò: HTML templates cho từng page
```

**Files:**

```
index.html          → Login / Register page
dashboard.html      → User dashboard
users-list.html     → View users (Admin/Viewer)
admin-settings.html → Admin settings (Masking config)
```

---

### 📂 Vị Trí: `/FE3/assets/`

```
Vai Trò: Static resources (CSS, images, etc.)
```

---

## 📊 DEPENDENCY DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                  CONTROLLERS                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │AuthController│  │UsersController│ │AdminController│ │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘  │
└────────┼──────────────────┼──────────────────┼──────────┘
         │                  │                  │
         └──────────┬───────┴────────┬─────────┘
                    │                │
         ┌──────────▼────────────────▼──────────┐
         │       SERVICES                       │
         │  ┌──────────────────────────────┐   │
         │  │ UserService                  │   │
         │  ├─ Login, Register, CRUD       │   │
         │  └──────┬───────────────────────┘   │
         │         │                           │
         │  ┌──────▼──────────────────────┐   │
         │  │ MaskingConfigService        │   │
         │  ├─ GetConfig, UpdateConfig    │   │
         │  ├─ ApplyMaskingToEmail/Phone  │   │
         │  └──────┬───────────────────────┘   │
         │         │                           │
         │  ┌──────▼──────────────────────┐   │
         │  │ SecurityService             │   │
         │  ├─ Encrypt, Decrypt           │   │
         │  ├─ HashPassword, Verify       │   │
         │  └──────┬───────────────────────┘   │
         │         │                           │
         │  ┌──────▼──────────────────────┐   │
         │  │ DataMaskingService          │   │
         │  ├─ 4 masking methods          │   │
         │  └──────────────────────────────┘   │
         │                                     │
         │  ┌──────────────────────────────┐   │
         │  │ JwtService                   │   │
         │  ├─ GenerateToken              │   │
         │  └──────────────────────────────┘   │
         │                                     │
         │  ┌──────────────────────────────┐   │
         │  │ Aes128Engine                 │   │
         │  ├─ Custom AES-128 cipher      │   │
         │  └──────────────────────────────┘   │
         └────────┬────────────────┬────────────┘
                  │                │
         ┌────────▼────────────────▼─────────┐
         │       REPOSITORIES                │
         │  ┌──────────────────────────┐    │
         │  │ UserRepository           │    │
         │  ├─ CRUD User operations    │    │
         │  └──────────────────────────┘    │
         │                                  │
         │  ┌──────────────────────────┐    │
         │  │MaskingConfigRepository   │    │
         │  ├─ Get/UpdateMaskingConfig │    │
         │  └──────────────────────────┘    │
         └────────┬────────────────────────┘
                  │
         ┌────────▼────────────────┐
         │    SQL SERVER DATABASE  │
         │                         │
         │  • Users Table          │
         │  • Roles Table          │
         │  • MaskingConfig Table  │
         └─────────────────────────┘
```

---

## 🔗 MODULE INTERACTION FLOW

### Flow 1: User Registration

```
Client
  ↓ POST /api/auth/register
  ↓
AuthController.Register()
  ├─ Call IUserService.Register()
  │   ├─ Validate input
  │   ├─ Call SecurityService.HashPassword()
  │   ├─ Call SecurityService.Encrypt() (email, phone)
  │   ├─ Call IUserRepository.CreateUser()
  │   │   └─ SQL INSERT INTO Users
  │   └─ Call JwtService.GenerateToken()
  └─ Return ApiResponse<UserResponse>
  ↓
Client (token saved)
```

---

### Flow 2: Admin Updates Masking Config

```
Client (Admin)
  ↓ PUT /api/admin/masking-config
  ↓
AdminController.UpdateMaskingConfig()
  ├─ Call IMaskingConfigService.UpdateConfig()
  │   ├─ Validate algorithm
  │   └─ Call IMaskingConfigRepository.UpdateConfig()
  │       └─ SQL UPDATE MaskingConfig
  └─ Return ApiResponse<string>
  ↓
Config Updated in Database
```

---

### Flow 3: Viewer Sees Masked Data

```
Client (Viewer)
  ↓ GET /api/users
  ↓
UsersController.GetUsers()
  ├─ Check role = Viewer ✅
  ├─ Call IUserService.GetUsers()
  │   ├─ Call IUserRepository.GetUsers()
  │   │   └─ SQL SELECT FROM Users
  │   └─ Decrypt email, phone (SecurityService)
  ├─ Call IMaskingConfigService.GetConfig()
  │   ├─ Call IMaskingConfigRepository.GetConfig()
  │   │   └─ SQL SELECT FROM MaskingConfig
  │   └─ Return MaskingConfig
  ├─ For each user: ApplyMaskingToEmail/Phone
  │   └─ Call appropriate DataMaskingService method
  └─ Return masked data
  ↓
Client (sees masked emails & phones)
```

---

## 🎯 SUMMARY

| Module                      | Loại       | Chủ Yếu                | Dependencies                                |
| --------------------------- | ---------- | ---------------------- | ------------------------------------------- |
| **AuthController**          | HTTP       | Auth (Register, Login) | UserService, JwtService                     |
| **UsersController**         | HTTP       | CRUD Users             | UserService, MaskingConfigService           |
| **AdminController**         | HTTP       | Admin Config           | MaskingConfigService                        |
| **MaskingController**       | HTTP       | Demo Masking           | UserService, DataMaskingService             |
| **UserService**             | Logic      | User operations        | UserRepository, SecurityService, JwtService |
| **MaskingConfigService**    | Logic      | Masking orchestration  | MaskingConfigRepository, DataMaskingService |
| **SecurityService**         | Logic      | Encryption/Hashing     | Aes128Engine                                |
| **DataMaskingService**      | Logic      | 4 masking methods      | (None)                                      |
| **JwtService**              | Logic      | Token generation       | (None)                                      |
| **UserRepository**          | Data       | User queries           | SQL Server                                  |
| **MaskingConfigRepository** | Data       | Masking config queries | SQL Server                                  |
| **FE3/api.js**              | HTTP       | API client             | Backend API                                 |
| **FE3/auth.js**             | Logic      | Auth logic             | api.js                                      |
| **FE3/router.js**           | Navigation | Page routing           | (None)                                      |
| **FE3/config.js**           | Config     | Constants              | (None)                                      |
| **FE3/main.js**             | Init       | App initialization     | All JS modules                              |

---

## 📍 File Count by Module

```
Controllers/     → 4 files (Auth, Users, Admin, Masking)
Services/        → 6 files (User, Security, Masking, JWT, AES, MaskingConfig)
Repositories/    → 2 files (User, MaskingConfig)
Models/          → 1 file (All DTOs & Entities)
Frontend JS/     → 5 files (api, auth, router, config, main)
Frontend Pages/  → 4+ HTML templates
```

**Total Backend Code:** ~13 files  
**Total Frontend Code:** ~10 files  
**Total Documentation:** ~8+ markdown files
