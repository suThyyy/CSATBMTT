# 📋 User Management System - Backend Documentation

## 📌 Tổng Quan Hệ Thống

**Tên Dự Án:** User Management System  
**Framework:** ASP.NET Core 10.0  
**Database:** SQL Server  
**API Documentation:** Swagger (tại `/swagger`)  
**Authentication:** JWT Token  
**Bảo Mật Dữ Liệu:** AES-128 Custom Implementation + Data Masking (4 phương pháp)

---

## 🔧 Công Nghệ & Thư Viện

```xml
- Microsoft.AspNetCore.Authentication.JwtBearer (v9.0.0)
- Microsoft.Data.SqlClient (v5.2.2)
- Microsoft.IdentityModel.Tokens (v8.4.0)
- Swashbuckle.AspNetCore (v7.2.0)
- System.IdentityModel.Tokens.Jwt (v8.4.0)
```

---

## 🗂️ Cấu Trúc Dự Án

```
UserManagementFull/
├── Controllers/                    # API Controllers
│   ├── AuthController.cs          # Đăng ký & Đăng nhập
│   ├── UsersController.cs         # Quản lý người dùng (CRUD)
│   └── MaskingController.cs       # Demo Data Masking
├── Models/                         # Data Models
│   └── Models.cs                  # Entities & DTOs
├── Services/                       # Business Logic
│   ├── UserService.cs             # Xử lý logic người dùng
│   ├── SecurityService.cs         # Mã hóa/Giải mã AES-128 (Custom)
│   ├── Aes128Engine.cs            # Custom AES-128 Implementation
│   ├── JwtService.cs              # Tạo JWT Token
│   └── DataMaskingService.cs      # 4 phương pháp Data Masking
├── Repositories/                   # Data Access Layer
│   └── UserRepository.cs          # Truy vấn Database
├── appsettings.json               # Cấu hình ứng dụng
├── Program.cs                      # Startup configuration
└── UserManagement.csproj          # Project file
```

---

## 🔐 Cấu Hình Bảo Mật (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=UserManagement;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "ThisIsASecretKeyForJwtTokenGeneration2024!",
    "Issuer": "UserManagementAPI",
    "Audience": "UserManagementClient",
    "ExpiryMinutes": 60
  }
}
```

**⚠️ Lưu ý:** Trong production, phải đổi JWT Key và lưu trong environment variables/secrets.

---

## 📊 Data Models

### 1️⃣ User Entity

```csharp
public class User
{
    public int Id { get; set; }
    public string? Username { get; set; }
    public byte[]? EncryptedEmail { get; set; }        // Mã hóa AES-256
    public byte[]? EncryptedPhone { get; set; }        // Mã hóa AES-256
    public byte[]? EncryptedPassword { get; set; }     // Hash PBKDF2
    public int Key { get; set; }                       // User encryption key
    public int RoleId { get; set; }
    public string? RoleName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 2️⃣ Role Entity

```csharp
public class Role
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
}
```

**Danh sách Roles:**

- **Admin (ID: 1):** Full access - view, edit, delete users, lock/unlock accounts
- **Viewer (ID: 3):** Read-only - view users with masking, không thể tắt masking
- **User (ID: 2):** View & edit own account, không thể view/edit users khác

### 3️⃣ Request DTOs

#### RegisterRequest

```csharp
{
  "username": "string (3-50 chars, only alphanumeric & _)",
  "email": "string (valid email format)",
  "phone": "string (10-15 digits, can start with +)",
  "password": "string (6-100 chars)"
}
```

#### LoginRequest

```csharp
{
  "username": "string",
  "password": "string"
}
```

#### UpdateUserRequest

```csharp
{
  "id": "int",
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "phone": "string (10-15 digits)",
  "password": "string (6-100 chars)"
}
```

### 4️⃣ Response DTOs

#### UserResponse

```csharp
{
  "id": "int",
  "username": "string",
  "email": "string (masked or full)",
  "phone": "string (masked or full)",
  "password": "***",
  "role": "string (Admin|Viewer|User)",
  "isActive": "bool",
  "createdAt": "datetime"
}
```

#### LoginResponse

```csharp
{
  "token": "string (JWT token)",
  "username": "string",
  "role": "string",
  "expiresAt": "datetime"
}
```

#### PaginatedUserResponse

```csharp
{
  "total": "int (total users in DB)",
  "skip": "int (offset)",
  "limit": "int (page size)",
  "items": [ UserResponse[] ]
}
```

#### ApiResponse\<T\>

```csharp
{
  "success": "bool",
  "message": "string (error or success message)",
  "data": "T (generic data)"
}
```

---

## 🔌 API Endpoints

### 🔓 Public Endpoints (No Authentication)

#### 1. Register (Đăng ký)

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+84901234567",
  "password": "SecurePass123"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "j***@example.com",
    "phone": "+84***4567",
    "role": "User",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error (400):**

```json
{
  "success": false,
  "message": "Username đã tồn tại"
}
```

---

#### 2. Login (Đăng nhập)

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "john_doe",
    "role": "User",
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

**Error (401):**

```json
{
  "success": false,
  "message": "Tên đăng nhập hoặc mật khẩu không đúng"
}
```

---

### 🔐 Protected Endpoints (Require JWT Token)

**Header:** `Authorization: Bearer {token}`

#### 3. Get Users (Danh sách người dùng - Phân trang)

```http
GET /api/users?mask=true&skip=0&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**

- `mask` (bool, default: true) - Bật/tắt masking dữ liệu
- `skip` (int, default: 0) - Số record bỏ qua
- `limit` (int, default: 10, max: 100) - Số record trả về

**Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "total": 25,
    "skip": 0,
    "limit": 10,
    "items": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "j***@example.com",
        "phone": "+84***4567",
        "role": "User",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
      },
      { ... }
    ]
  }
}
```

**Yêu cầu Roles:** Admin, Viewer

**Lưu ý:**

- **Admin:** Có thể tắt masking (`mask=false`) để xem full data
- **Viewer:** Luôn bị masking, không thể tắt

---

#### 4. Get User By ID

```http
GET /api/users/{id}?mask=true
Authorization: Bearer {token}
```

**Path Parameters:**

- `id` (int) - ID người dùng

**Query Parameters:**

- `mask` (bool, default: true) - Bật/tắt masking

**Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "j***@example.com",
    "phone": "+84***4567",
    "role": "User",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**

- 404: User không tồn tại
- 403: Permission denied (User chỉ xem được thông tin của chính mình)

**Yêu cầu Roles:** Admin, Viewer, User

**Lưu ý:**

- **Admin:** Xem bất kỳ user nào, có thể tắt masking
- **Viewer:** Xem tất cả nhưng luôn bị masking
- **User:** Chỉ xem thông tin của chính mình

---

#### 5. Update User

```http
PUT /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": 1,
  "username": "john_doe_updated",
  "email": "john.new@example.com",
  "phone": "+84987654321",
  "password": "NewSecurePass456"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật thành công"
}
```

**Errors:**

- 400: Validation failed hoặc Username đã tồn tại
- 403: Permission denied (User chỉ cập nhật được thông tin của chính mình)
- 404: User không tồn tại

**Yêu cầu Roles:** Admin, User

**Lưu ý:**

- **Admin:** Cập nhật user bất kỳ
- **User:** Chỉ cập nhật chính mình
- **Viewer:** KHÔNG thể cập nhật

---

#### 6. Delete User

```http
DELETE /api/users/{id}
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Xóa người dùng thành công"
}
```

**Errors:**

- 404: User không tồn tại

**Yêu cầu Roles:** Admin (exclusive)

---

#### 7. Lock/Unlock Account

```http
PATCH /api/users/{id}/active?isActive=true
Authorization: Bearer {token}
```

**Query Parameters:**

- `isActive` (bool) - true: kích hoạt, false: khóa

**Response (200):**

```json
{
  "success": true,
  "message": "Kích hoạt tài khoản thành công" or "Khóa tài khoản thành công"
}
```

**Yêu cầu Roles:** Admin (exclusive)

---

#### 8. Promote User to Viewer (Nâng cấp lên Viewer)

```http
PATCH /api/users/{id}/promote-to-viewer
Authorization: Bearer {token}
```

**Path Parameters:**

- `id` (int) - ID người dùng cần nâng cấp

**Response (200):**

```json
{
  "success": true,
  "message": "Nâng cấp lên Viewer thành công"
}
```

**Errors:**

- 400: User không phải là role User hoặc không tìm thấy
- 404: User không tồn tại

**Yêu cầu Roles:** Admin (exclusive)

**Lưu ý:**

- Chỉ có thể nâng cấp user từ role **User (ID: 2)** lên **Viewer (ID: 3)**
- User không thể nâng cấp lên Admin
- Viewer có thể xem danh sách user nhưng dữ liệu luôn bị mask

---

#### 9. Get Masking Configuration (Admin)

```http
GET /api/admin/masking-config
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Lấy cấu hình masking thành công",
  "data": {
    "enabled": true,
    "algorithm": 1,
    "algorithmName": "Character Masking",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Yêu cầu Roles:** Admin (exclusive)

**Lưu ý:**

- Algorithm: 1=Character Masking, 2=Data Shuffling, 3=Data Substitution, 4=Noise Addition
- Cấu hình này được áp dụng cho tất cả Viewer users

---

#### 10. Update Masking Configuration (Admin)

```http
PUT /api/admin/masking-config
Authorization: Bearer {token}
Content-Type: application/json

{
  "enabled": true,
  "algorithm": 2
}
```

**Request Parameters:**

- `enabled` (bool) - Bật/tắt masking cho Viewer users
- `algorithm` (int) - Thuật toán: 1=CharacterMasking, 2=DataShuffling, 3=DataSubstitution, 4=NoiseAddition

**Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật cấu hình masking thành Data Shuffling",
  "data": ""
}
```

**Errors:**

- 400: Algorithm không hợp lệ

**Yêu cầu Roles:** Admin (exclusive)

---

#### 11. Get Available Masking Algorithms (Admin)

```http
GET /api/admin/masking-algorithms
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Lấy danh sách thuật toán thành công",
  "data": [
    {
      "id": 1,
      "name": "Character Masking",
      "description": "Che giấu ký tự bằng dấu *"
    },
    {
      "id": 2,
      "name": "Data Shuffling",
      "description": "Xáo trộn vị trí các ký tự"
    },
    {
      "id": 3,
      "name": "Data Substitution",
      "description": "Thay thế bằng dữ liệu giả hợp lệ"
    },
    {
      "id": 4,
      "name": "Noise Addition",
      "description": "Thêm ký tự nhiễu vào dữ liệu"
    }
  ]
}
```

**Yêu cầu Roles:** Admin (exclusive)

---

#### 12. Masking Demo (Public Test)

```http
POST /api/masking/demo
Content-Type: application/json

{
  "email": "john@example.com",
  "phone": "+84901234567"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Demo 4 phương pháp masking",
  "data": {
    "original": {
      "email": "john@example.com",
      "phone": "+84901234567"
    },
    "characterMasking": {
      "email": "j***@example.com",
      "phone": "+84***4567",
      "description": "Che giấu ký tự bằng dấu *"
    },
    "datashuffling": {
      "email": "nhjo@example.com",
      "phone": "+84213456789",
      "description": "Xáo trộn vị trí các ký tự"
    },
    "datasubstitution": {
      "email": "alice@example.com",
      "phone": "+84876543210",
      "description": "Thay thế bằng dữ liệu giả hợp lệ"
    },
    "noiseaddition": {
      "email": "jo@h_n@example.com",
      "phone": "+849X0Y1Z2_3W4V5",
      "description": "Thêm ký tự nhiễu vào dữ liệu"
    }
  }
}
```

**Lưu ý:** Endpoint này PUBLIC, không cần authentication

---

#### 13. Get User With All Masking Methods

```http
GET /api/masking/user/{id}
Authorization: Bearer {token}
```

**Response (200):** Trả về user với 4 phương pháp masking khác nhau

**Yêu cầu Roles:** Admin (exclusive)

---

#### 9. Masking Demo (Public Test)

```http
POST /api/masking/demo
Content-Type: application/json

{
  "email": "john@example.com",
  "phone": "+84901234567"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Demo 4 phương pháp masking",
  "data": {
    "original": {
      "email": "john@example.com",
      "phone": "+84901234567"
    },
    "characterMasking": {
      "email": "j***@example.com",
      "phone": "+84***4567",
      "description": "Che giấu ký tự bằng dấu *"
    },
    "datashuffling": {
      "email": "nhjo@example.com",
      "phone": "+84213456789",
      "description": "Xáo trộn vị trí các ký tự"
    },
    "datasubstitution": {
      "email": "alice@example.com",
      "phone": "+84876543210",
      "description": "Thay thế bằng dữ liệu giả hợp lệ"
    },
    "noiseaddition": {
      "email": "jo@h_n@example.com",
      "phone": "+849X0Y1Z2_3W4V5",
      "description": "Thêm ký tự nhiễu vào dữ liệu"
    }
  }
}
```

**Lưu ý:** Endpoint này PUBLIC, không cần authentication

---

#### 9. Get User With All Masking Methods

```http
GET /api/masking/user/{id}
Authorization: Bearer {token}
```

**Response (200):** Trả về user với 4 phương pháp masking khác nhau

**Yêu cầu Roles:** Admin (exclusive)

---

## 🔐 JWT Token

### Cấu Trúc Token

```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "nameid": "1",           // User ID
  "unique_name": "john",   // Username
  "role": "Admin",         // Role
  "userId": "1",           // User ID (custom claim)
  "iat": 1705315800,       // Issued at
  "exp": 1705319400,       // Expiration (60 minutes)
  "iss": "UserManagementAPI",
  "aud": "UserManagementClient"
}
```

### Cách sử dụng

1. **Lấy token:** Login → nhận JWT token
2. **Gửi request:** Thêm header `Authorization: Bearer {token}`
3. **Token hết hạn:** Refresh page hoặc login lại

---

## 🛡️ Bảo Mật Dữ Liệu

### 1️⃣ AES-128 Encryption (Custom Implementation)

**Dữ liệu được mã hóa:** Email, Phone, Password  
**Giải mã:** Tự động khi retrieve từ DB  
**Đặc điểm:**

- Sử dụng implementation tự viết (không dùng thư viện ngoài)
- Sử dụng SBOX, RCON, Key Expansion chuẩn AES
- Hỗ trợ PKCS#7 Padding
- Mã hóa từng khối 16 bytes

**Cơ chế:**

```csharp
// Mã hóa
var encryptedEmail = _securityService.Encrypt(email, userKey);
// Lưu vào DB

// Giải mã
var decryptedEmail = _securityService.Decrypt(encryptedData, userKey);
```

**Thành phần chính trong Aes128Engine:**

- `SBox[]`: Substitution Table (256 bytes)
- `RCon[]`: Round Constants
- `keyExpansion()`: Mở rộng 16-byte key thành 11 round keys
- `EncryptBlock()`: Mã hóa 1 khối 16 bytes (10 vòng)
- `DecryptBlock()`: Giải mã 1 khối 16 bytes (10 vòng ngược)
- `MixColumns() / InvMixColumns()`: Phép hỗn trộn cột
- `xtime() / mulGf()`: Phép toán trên trường Galois GF(2^8)

### 2️⃣ Password Hashing (PBKDF2-SHA256)

```csharp
// Hash password
var hashedPassword = _securityService.HashPassword(plainPassword);
// Lưu hash vào DB, không lưu plaintext

// Xác minh
bool isValid = _securityService.VerifyPassword(inputPassword, storedHash);
```

### 3️⃣ Data Masking (4 Phương Pháp)

#### Phương pháp 1: Character Masking (Che ký tự)

```
john@example.com → j***@example.com
+84901234567 → +84***4567
```

#### Phương pháp 2: Data Shuffling (Xáo trộn)

```
john@example.com → nhjo@example.com
+84901234567 → +84213456789
```

#### Phương pháp 3: Data Substitution (Thay thế)

```
john@example.com → alice@example.com
+84901234567 → +84876543210
```

#### Phương pháp 4: Noise Addition (Thêm nhiễu)

```
john@example.com → jo@h_n@example.com
+84901234567 → +849X0Y1Z2_3W4V5
```

---

## 👥 Role-Based Access Control (RBAC)

| Endpoint                         | Admin | Viewer |     User      |
| -------------------------------- | :---: | :----: | :-----------: |
| GET /users                       |  ✅   |   ✅   |      ❌       |
| GET /users/{id}                  |  ✅   |   ✅   | ✅ (own only) |
| PUT /users/{id}                  |  ✅   |   ❌   | ✅ (own only) |
| DELETE /users/{id}               |  ✅   |   ❌   |      ❌       |
| PATCH /users/{id}/active         |  ✅   |   ❌   |      ❌       |
| PATCH /users/{id}/promote-viewer |  ✅   |   ❌   |      ❌       |
| POST /masking/demo               |  ✅   |   ✅   |      ✅       |
| GET /masking/user/{id}           |  ✅   |   ❌   |      ❌       |
| GET /masking/users               |  ✅   |   ✅   |      ❌       |

---

## ✅ Input Validation

### Username

- Độ dài: 3-50 ký tự
- Pattern: `^[a-zA-Z0-9_]+$` (chỉ alphanumeric và dấu gạch dưới)
- Unique: Không được trùng với username hiện tại

### Email

- Format: Valid email (ví dụ: user@example.com)
- Unique: Không được trùng

### Phone

- Độ dài: 10-15 ký tự
- Pattern: `^[\+]?[0-9]+$` (số, có thể bắt đầu bằng +)
- Ví dụ: `0901234567`, `+84901234567`

### Password

- Độ dài: 6-100 ký tự
- Khác với password cũ nếu không thay đổi

---

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    EncryptedEmail VARBINARY(MAX),
    EncryptedPhone VARBINARY(MAX),
    EncryptedPassword VARBINARY(MAX),
    [Key] INT NOT NULL,
    RoleId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME DEFAULT GETUTCDATE(),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);
```

### Roles Table

```sql
CREATE TABLE Roles (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(MAX)
);

-- Data mặc định
INSERT INTO Roles (Name, Description) VALUES
(1, 'Admin', 'Administrator - Full access'),
(2, 'User', 'Regular user - View and edit own account'),
(3, 'Viewer', 'Read-only - View users with masking');
```

---

## 🚀 Hướng dẫn FE xây dựng giao diện

### 1️⃣ Trang Đăng Ký (Register)

- Form: Username, Email, Phone, Password
- Button: Register
- Link: Đã có tài khoản? Đăng nhập
- Success: Hiển thị message, redirect tới login page
- Error: Hiển thị error message dưới form

### 2️⃣ Trang Đăng Nhập (Login)

- Form: Username, Password
- Button: Login, "Quên mật khẩu?" (không implement BE)
- Link: Chưa có tài khoản? Đăng ký
- Success: Lưu token (localStorage/sessionStorage), redirect tới dashboard
- Error: Hiển thị error message
- Session expired: Logout, redirect tới login page

### 3️⃣ Dashboard (User List - Admin/Viewer)

- Table: ID, Username, Email, Phone, Role, Status, Action
- Pagination: Skip, Limit (10/25/50 per page)
- Masking toggle: Chỉ Admin
- Actions:
  - View details
  - Edit (Admin & User own)
  - Delete (Admin only)
  - Lock/Unlock (Admin only)

### 4️⃣ User Detail Page

- Display: Username, Email, Phone, Role, Status, Created At
- Edit button: Cập nhật thông tin
- Role-based permissions:
  - Admin: xem/edit bất kỳ user
  - Viewer: xem only
  - User: xem/edit chính mình

### 5️⃣ Edit User Form

- Form: Username, Email, Phone, Password
- Validation: Real-time
- Submit: Update user
- Cancel: Back to previous page

### 6️⃣ Header/Navigation

- Logo, App name
- User info: Username, Role
- Logout button
- Links: Dashboard, Profile, Settings (tuỳ chọn)

---

## 🧪 Test Endpoints với Postman/Thunder Client

### 1. Register

```
POST http://localhost:5000/api/auth/register
Body: {
  "username": "testuser",
  "email": "test@example.com",
  "phone": "+84901234567",
  "password": "TestPass123"
}
```

### 2. Login

```
POST http://localhost:5000/api/auth/login
Body: {
  "username": "testuser",
  "password": "TestPass123"
}
Response: Copy token từ response
```

### 3. Get Users (với Token)

```
GET http://localhost:5000/api/users?mask=true&skip=0&limit=10
Headers: {
  "Authorization": "Bearer {token}"
}
```

### 4. Get User By ID

```
GET http://localhost:5000/api/users/1?mask=true
Headers: {
  "Authorization": "Bearer {token}"
}
```

### 5. Update User

```
PUT http://localhost:5000/api/users/1
Headers: {
  "Authorization": "Bearer {token}"
}
Body: {
  "id": 1,
  "username": "testuser_updated",
  "email": "test.updated@example.com",
  "phone": "+84987654321",
  "password": "NewTestPass123"
}
```

### 6. Delete User

```
DELETE http://localhost:5000/api/users/1
Headers: {
  "Authorization": "Bearer {token}"
}
```

### 7. Lock/Unlock Account

```
PATCH http://localhost:5000/api/users/1/active?isActive=false
Headers: {
  "Authorization": "Bearer {token}"
}
```

### 8. Promote User to Viewer

```
PATCH http://localhost:5000/api/users/2/promote-to-viewer
Headers: {
  "Authorization": "Bearer {token}"
}
Response:
{
  "success": true,
  "message": "Nâng cấp lên Viewer thành công"
}
```

### 9. Masking Demo

```
POST http://localhost:5000/api/masking/demo
Body: {
  "email": "john@example.com",
  "phone": "+84901234567"
}
```

---

## 📞 Error Handling

### HTTP Status Codes

| Code | Meaning      | Example                               |
| ---- | ------------ | ------------------------------------- |
| 200  | OK           | Request thành công                    |
| 201  | Created      | Resource tạo thành công               |
| 400  | Bad Request  | Validation failed, duplicate username |
| 401  | Unauthorized | Invalid credentials, token expired    |
| 403  | Forbidden    | Permission denied                     |
| 404  | Not Found    | User không tồn tại                    |
| 500  | Server Error | Internal server error                 |

### Error Response Format

```json
{
  "success": false,
  "message": "Mô tả lỗi chi tiết",
  "data": null
}
```

---

## 📝 Notes cho FE Developer

1. **JWT Storage:** Lưu token an toàn (localStorage hoặc sessionStorage)
2. **Token Expiry:** Token hết hạn sau 60 phút, cần login lại
3. **Masking:** Dữ liệu có thể hiển thị dưới dạng masked tuỳ thuộc role
4. **Validation:** FE nên validate cùng BE để tăng UX
5. **CORS:** Backend cho phép tất cả origins, FE có thể gọi API từ bất kỳ domain nào
6. **Swagger:** Truy cập `http://localhost:5000/` để xem API docs interactive
7. **Error Messages:** Hiển thị message từ API response cho user

---

## 🔗 API Base URL

- **Local:** `http://localhost:5000`
- **Production:** [To be configured]

---

## 📅 Thông Tin Dự Án

- **Phiên bản:** 1.0
- **Ngày tạo:** 15/01/2024
- **Framework:** .NET 10.0
- **Author:** Backend Team

---

**Mọi câu hỏi hoặc thắc mắc, vui lòng liên hệ với Backend Team. 🚀**
