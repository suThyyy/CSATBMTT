# 🏗️ SYSTEM ARCHITECTURE DOCUMENTATION

**Hệ Thống Quản Lý Người Dùng Với Mã Hóa Dữ Liệu & Data Masking**

---

## 📑 Mục Lục

1. [Kiến Trúc Tổng Thể](#1-kiến-trúc-tổng-thể)
2. [Các Thành Phần Chính](#2-các-thành-phần-chính)
3. [Kiến Trúc Lớp (Layered Architecture)](#3-kiến-trúc-lớp-layered-architecture)
4. [Kiến Trúc Bảo Mật](#4-kiến-trúc-bảo-mật)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Quy Trình Xử Lý Dữ Liệu](#8-quy-trình-xử-lý-dữ-liệu)
9. [Dependency & Integration](#9-dependency--integration)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. KIẾN TRÚC TỔNG THỂ

### 1.1 Sơ Đồ Kiến Trúc Toàn Hệ Thống

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Frontend (FE3)                           │  │
│  │  ├─ index.html (HTML5 Semantic)                            │  │
│  │  ├─ js/router.js (Client-side routing)                     │  │
│  │  ├─ js/main.js (Form handling & validation)                │  │
│  │  ├─ js/auth.js (JWT token management)                      │  │
│  │  ├─ js/api.js (HTTP API client)                            │  │
│  │  └─ css/styles.css (Responsive design)                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ (HTTP REST API)
                        Content-Type: application/json
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVER LAYER                                   │
│                   ASP.NET Core 10.0                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              API LAYER (Controllers)                        │  │
│  │  ├─ AuthController.cs                                       │  │
│  │  │  ├─ POST /api/auth/register (Public)                    │  │
│  │  │  └─ POST /api/auth/login (Public)                       │  │
│  │  │                                                           │  │
│  │  ├─ UsersController.cs                                      │  │
│  │  │  ├─ GET  /api/users (Admin, Viewer)                     │  │
│  │  │  ├─ GET  /api/users/{id} (Admin, Viewer)                │  │
│  │  │  ├─ PUT  /api/users/{id} (Admin, User)                  │  │
│  │  │  ├─ DELETE /api/users/{id} (Admin)                      │  │
│  │  │  ├─ PATCH /api/users/{id}/active (Admin)                │  │
│  │  │  └─ PATCH /api/users/{id}/promote-to-viewer (Admin)     │  │
│  │  │                                                           │  │
│  │  ├─ AdminController.cs                                      │  │
│  │  │  ├─ GET  /api/admin/masking-config (Admin)              │  │
│  │  │  ├─ PUT  /api/admin/masking-config (Admin)              │  │
│  │  │  └─ GET  /api/admin/masking-algorithms (Admin)          │  │
│  │  │                                                           │  │
│  │  └─ MaskingController.cs                                    │  │
│  │     ├─ POST /api/masking/demo (JWT)                        │  │
│  │     ├─ GET  /api/masking/user/{id} (JWT)                   │  │
│  │     └─ GET  /api/masking/users (JWT)                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↕                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           SERVICE LAYER (Business Logic)                   │  │
│  │  ├─ UserService.cs                                          │  │
│  │  │  ├─ Register(RegisterRequest)                            │  │
│  │  │  ├─ Login(LoginRequest)                                  │  │
│  │  │  ├─ GetUsers(mask)                                       │  │
│  │  │  ├─ GetUserById(id, mask)                                │  │
│  │  │  ├─ UpdateUser(id, request)                              │  │
│  │  │  ├─ DeleteUser(id)                                       │  │
│  │  │  ├─ SetUserActive(id)                                    │  │
│  │  │  └─ PromoteUserToViewer(id)                              │  │
│  │  │                                                           │  │
│  │  ├─ SecurityService.cs                                      │  │
│  │  │  ├─ Encrypt(plainText, userKey)                          │  │
│  │  │  ├─ Decrypt(cipherData, userKey)                         │  │
│  │  │  ├─ GetEmailHash(email)                                  │  │
│  │  │  ├─ GenerateUserKey()                                    │  │
│  │  │  ├─ HashPassword(password)                               │  │
│  │  │  ├─ VerifyPassword(password, hash)                       │  │
│  │  │  └─ DeriveKey(userKey)                                   │  │
│  │  │                                                           │  │
│  │  ├─ DataMaskingService.cs                                   │  │
│  │  │  ├─ ApplyMasking(data, algorithm)                        │  │
│  │  │  ├─ MaskEmail(email, algorithm)                          │  │
│  │  │  └─ MaskPhone(phone, algorithm)                          │  │
│  │  │                                                           │  │
│  │  ├─ MaskingConfigService.cs                                 │  │
│  │  │  ├─ GetConfig()                                          │  │
│  │  │  └─ UpdateConfig(algorithm)                              │  │
│  │  │                                                           │  │
│  │  └─ JwtService.cs                                           │  │
│  │     ├─ GenerateToken(userId)                                │  │
│  │     └─ ValidateToken(token)                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↕                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         REPOSITORY LAYER (Data Access)                     │  │
│  │  ├─ IUserRepository                                         │  │
│  │  │  ├─ GetUsers()                                           │  │
│  │  │  ├─ GetUserById(id)                                      │  │
│  │  │  ├─ GetUserByUsername(username)                          │  │
│  │  │  ├─ UsernameExists(username)                             │  │
│  │  │  ├─ EmailExists(emailHash)                               │  │
│  │  │  ├─ CreateUser(user)                                     │  │
│  │  │  ├─ UpdateUser(user)                                     │  │
│  │  │  ├─ DeleteUser(id)                                       │  │
│  │  │  ├─ SetUserActive(id, isActive)                          │  │
│  │  │  └─ UpdateUserRole(id, roleId)                           │  │
│  │  │                                                           │  │
│  │  └─ IMaskingConfigRepository                                │  │
│  │     ├─ GetConfig()                                          │  │
│  │     └─ UpdateConfig(config)                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↕                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            ENCRYPTION & CRYPTO LAYER                       │  │
│  │  ├─ Aes128Engine.cs (Custom AES-128 Implementation)         │  │
│  │  │  ├─ EncryptData(plainData, key) → Base64                │  │
│  │  │  ├─ DecryptData(base64Encrypted, key)                   │  │
│  │  │  ├─ EncryptDataHex(plainData, key) → Hex                │  │
│  │  │  ├─ DecryptDataHex(hexEncrypted, key)                   │  │
│  │  │  ├─ DeriveKeyFromPassword(password, salt)               │  │
│  │  │  └─ KeyExpansion(key) → 11 round keys                   │  │
│  │  │                                                           │  │
│  │  └─ System.Security.Cryptography                            │  │
│  │     ├─ SHA256 (Master key hashing)                          │  │
│  │     ├─ RandomNumberGenerator (IV & User Key)               │  │
│  │     └─ Rfc2898DeriveBytes (PBKDF2 for passwords)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                                  │
│                    SQL Server 2019+                                  │
│                                                                      │
│  ┌─────────────────────────────┬──────────────────────────────────┐ │
│  │   Users Table               │  MaskingConfig Table             │ │
│  ├─────────────────────────────┼──────────────────────────────────┤ │
│  │ • Id (PK)                   │ • Id (PK)                        │ │
│  │ • Username (UNIQUE)         │ • Enabled (BIT)                  │ │
│  │ • EncryptedEmail (BINARY)   │ • Algorithm (INT)                │ │
│  │ • EncryptedPhone (BINARY)   │ • CreatedAt (DATETIME2)          │ │
│  │ • EncryptedPassword (BINARY)│ • UpdatedAt (DATETIME2)          │ │
│  │ • EmailHash (UNIQUE)        │                                  │ │
│  │ • Key (INT)                 │  Roles Table                     │ │
│  │ • RoleId (FK)               │ ├─ Id (PK)                       │ │
│  │ • IsActive (BIT)            │ ├─ Name (UNIQUE)                 │ │
│  │ • CreatedAt (DATETIME2)     │ └─ Description                   │ │
│  │ • UpdatedAt (DATETIME2)     │                                  │ │
│  └─────────────────────────────┴──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Ngôn Ngữ & Công Nghệ

| Thành Phần | Công Nghệ | Phiên Bản |
|-----------|----------|---------|
| **Framework** | ASP.NET Core | 10.0 |
| **Ngôn Ngữ Backend** | C# | 13.0 |
| **Database** | SQL Server | 2019+ |
| **Frontend** | Vanilla JavaScript | ES6+ |
| **Authentication** | JWT (HS256) | OpenID Connect compatible |
| **Encryption** | Custom AES-128 | CBC mode with PBKDF2 |
| **Build Tool** | .NET CLI | dotnet |
| **Package Manager** | NuGet | Integrated in VS |

---

## 2. CÁC THÀNH PHẦN CHÍNH

### 2.1 Core Components Map

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. AuthController                                          │
│     ├─ Receive: RegisterRequest or LoginRequest            │
│     ├─ Call: UserService.Register() or Login()             │
│     └─ Return: ApiResponse<UserResponse> + JWT Token       │
│                                                              │
│  2. JwtService                                              │
│     ├─ GenerateToken(userId, roleName)                     │
│     └─ Return: Bearer token with 60-min expiry             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              ENCRYPTION & KEY MANAGEMENT                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Security Service Layer                                  │
│     ├─ Master Key (from appsettings.json → Jwt:Key)        │
│     └─ Hash with SHA256 → 32 bytes                         │
│                                                              │
│  2. Per-User Key Management                                 │
│     ├─ Generate: Random int (100K to 2.1B)                │
│     ├─ Derive: Combine Master Key + User Key              │
│     └─ Result: 32-byte derived key per user                │
│                                                              │
│  3. Data Encryption Flow                                    │
│     Plaintext → (PBKDF2 key + IV) → AES-128 → Ciphertext  │
│     IV (16) + Ciphertext → Base64/Hex → Store in DB       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  DATA MASKING FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Admin configures: MaskingConfig (1=Char, 2=Shuffle...) │
│                                                              │
│  2. Viewer requests user data:                             │
│     ├─ Retrieve User (EncryptedEmail, EncryptedPhone)     │
│     ├─ Decrypt with UserService                           │
│     ├─ Get MaskingConfig Algorithm                        │
│     ├─ Apply DataMaskingService.ApplyMasking()            │
│     └─ Return masked email/phone to Viewer                │
│                                                              │
│  3. Admin sees original data (no masking)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibility Matrix

| Component | Input | Processing | Output |
|-----------|-------|-----------|--------|
| **AuthController** | RegisterRequest/LoginRequest | Route validation | JWT Token |
| **UserService** | User data | CRUD + encryption | ApiResponse |
| **SecurityService** | Plain data + key | AES-128 + PBKDF2 | Encrypted bytes |
| **UserRepository** | SQL queries | ADO.NET execution | User objects |
| **Aes128Engine** | Plaintext + key | Custom AES-128 | Ciphertext (Hex/Base64) |
| **DataMaskingService** | Decrypted data | Apply algorithm | Masked string |
| **JwtService** | User claims | Sign with HS256 | JWT token |

---

## 3. KIẾN TRÚC LỚP (LAYERED ARCHITECTURE)

### 3.1 4-Tier Architecture

```
TIER 4: PRESENTATION (Frontend)
┌─────────────────────────────────────┐
│ HTML Forms + JavaScript Logic       │
│ - Register Form (validation)        │
│ - Login Form                        │
│ - User List/Edit Page               │
│ - Admin Dashboard                   │
└─────────────────────────────────────┘
              ↓ HTTP REST API ↑
TIER 3: API/CONTROLLER LAYER
┌─────────────────────────────────────┐
│ 4 Controllers (endpoints)            │
│ ├─ AuthController                   │
│ ├─ UsersController                  │
│ ├─ AdminController                  │
│ └─ MaskingController                │
│                                      │
│ Responsibility:                      │
│ - Route HTTP requests               │
│ - Validate input                    │
│ - Call services                     │
│ - Format responses                  │
└─────────────────────────────────────┘
              ↓ Service calls ↑
TIER 2: SERVICE LAYER
┌─────────────────────────────────────┐
│ 5 Services (business logic)          │
│ ├─ UserService                      │
│ ├─ SecurityService                  │
│ ├─ DataMaskingService               │
│ ├─ MaskingConfigService             │
│ └─ JwtService                       │
│                                      │
│ Responsibility:                      │
│ - Implement business rules          │
│ - Orchestrate encryption            │
│ - Apply validation                  │
│ - Manage workflows                  │
└─────────────────────────────────────┘
              ↓ Repository calls ↑
TIER 1: DATA ACCESS LAYER
┌─────────────────────────────────────┐
│ 2 Repositories (interfaces)          │
│ ├─ IUserRepository                  │
│ └─ IMaskingConfigRepository         │
│                                      │
│ Responsibility:                      │
│ - CRUD operations                   │
│ - SQL query execution               │
│ - Connection management             │
│ - Data mapping                      │
└─────────────────────────────────────┘
              ↓ ADO.NET ↑
PERSISTENCE: SQL Server Database
┌─────────────────────────────────────┐
│ Three Tables:                        │
│ ├─ Users (encrypted fields)         │
│ ├─ Roles (lookup)                   │
│ └─ MaskingConfig (admin settings)   │
└─────────────────────────────────────┘
```

### 3.2 Separation of Concerns

```
UserController (API)
    ↓ validates input, checks auth
    
UserService (Business Logic)
    ├─ Implements Register flow
    ├─ Calls SecurityService for encryption
    ├─ Calls UserRepository for DB
    └─ Calls DataMaskingService for masking
    
SecurityService (Encryption)
    ├─ Encrypt/Decrypt using Aes128Engine
    ├─ Hash passwords with PBKDF2
    └─ Manage keys (Master + Derived)
    
Aes128Engine (Crypto Core)
    ├─ Custom AES-128 implementation
    ├─ Key expansion (11 rounds)
    └─ CBC mode with random IV
    
UserRepository (Data Access)
    ├─ Execute SQL queries
    └─ Map SqlDataReader to Model objects
    
SQL Server (Persistence)
    └─ Store encrypted data
```

---

## 4. KIẾN TRÚC BẢO MẬT

### 4.1 Security Layers

```
┌───────────────────────────────────┐
│  LAYER 1: AUTHENTICATION          │
│  - JWT Token (60-min expiry)      │
│  - HS256 signing                  │
│  - Claims: userId, userName, role │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  LAYER 2: AUTHORIZATION           │
│  - Role-based access control      │
│  - [Authorize("Admin")]           │
│  - [Authorize("Admin,Viewer")]    │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  LAYER 3: DATA ENCRYPTION         │
│  - AES-128 CBC mode               │
│  - Per-user encryption key        │
│  - Random IV for each encrypt     │
│  - Decryption only with user key  │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  LAYER 4: PASSWORD HASHING        │
│  - PBKDF2-HMAC-SHA256            │
│  - 100K iterations                │
│  - 32-byte random salt            │
│  - Never store plaintext          │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  LAYER 5: DATA MASKING            │
│  - For Viewer role only           │
│  - 4 masking algorithms           │
│  - Configurable by Admin          │
│  - Applied at retrieval time      │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  LAYER 6: EMAIL UNIQUENESS        │
│  - EmailHash column (UNIQUE)      │
│  - SHA256(email.ToLower())        │
│  - Prevent email duplicate        │
│  - EmailExists() validation       │
└───────────────────────────────────┘
```

### 4.2 Key Management

```
appsettings.json
│
└─ "Jwt:Key": "ThisIsASecretKey...2024!"
   │
   └─ SHA256 Hash
      │
      └─ masterKey (32 bytes)
         │
         ├─ Combined with User.Key (4 bytes)
         │
         └─ SHA256 Hash again
            │
            └─ derivedKey (32 bytes)
               │
               └─ Used for AES-128 encryption
                  │
                  └─ Encrypt(Email/Phone/Password)
```

### 4.3 Encryption Flow Detail

```
REGISTRATION:
  1. User submits: username, email, phone, password
  2. Hash password: PBKDF2(password, salt) → passwordHash
  3. Generate random key: int userKey = Random(100K, 2.1B)
  4. Compute emailHash: SHA256(email.ToLower())
  5. Encrypt email: Encrypt(email, userKey) → byte[]
  6. Encrypt phone: Encrypt(phone, userKey) → byte[]
  7. Encrypt passwordHash: Encrypt(passwordHash, userKey) → byte[]
  8. Store in DB:
     {
       Username: "john_doe",
       EncryptedEmail: 0x7F5A8C9D... (hex),
       EncryptedPhone: 0x3E2A7B1F... (hex),
       EncryptedPassword: 0x9D4C6E2K... (hex),
       EmailHash: "/5mW+cQ8s=" (base64),
       Key: 987654321,
       RoleId: 2 (User),
       CreatedAt: 2026-04-01
     }

RETRIEVAL:
  1. Fetch user from DB
  2. Get derived key: derivedKey = Derive(masterKey, user.Key)
  3. Decrypt email: Decrypt(encryptedEmail, derivedKey)
  4. Decrypt phone: Decrypt(encryptedPhone, derivedKey)
  5. Check role:
     - If Admin: Return plain email/phone
     - If Viewer: Apply masking algorithm
  6. Return to client
```

---

## 5. DATABASE SCHEMA

### 5.1 Tables Definition

```sql
-- USERS TABLE
┌─────────────────────────────────────────────────────────────┐
│ Users                                                        │
├─────────────────────────────────────────────────────────────┤
│ Id (INT) [PK]                  Auto-increment               │
│ Username (NVARCHAR(50)) [UK]   Not null, must be unique     │
│ EncryptedEmail (VARBINARY)     Encrypted with AES-128       │
│ EncryptedPhone (VARBINARY)     Encrypted with AES-128       │
│ EncryptedPassword (VARBINARY)  PBKDF2 hash encrypted        │
│ EmailHash (NVARCHAR(256)) [UK] SHA256 for duplicate check   │
│ Key (INT)                      Random user key (100K-2.1B)  │
│ RoleId (INT) [FK→Roles.Id]     1=Admin, 2=User, 3=Viewer   │
│ IsActive (BIT)                 0=Locked, 1=Active           │
│ CreatedAt (DATETIME2) [UK]     Audit timestamp              │
│ UpdatedAt (DATETIME2) [UK]     Last modification            │
└─────────────────────────────────────────────────────────────┘

-- ROLES TABLE
┌─────────────────────────────────────────────────────────────┐
│ Roles                                                        │
├─────────────────────────────────────────────────────────────┤
│ Id (INT) [PK]                  1, 2, 3                      │
│ Name (NVARCHAR(50)) [UK]       'Admin', 'User', 'Viewer'   │
│ Description (NVARCHAR(200))    Role purpose description     │
└─────────────────────────────────────────────────────────────┘

-- MASKING_CONFIG TABLE
┌─────────────────────────────────────────────────────────────┐
│ MaskingConfig                                                │
├─────────────────────────────────────────────────────────────┤
│ Id (INT) [PK]                  Single row (Id=1)            │
│ Enabled (BIT)                  1=Masking active             │
│ Algorithm (INT)                1=CharMask, 2=Shuffle...     │
│ CreatedAt (DATETIME2)          When rule created            │
│ UpdatedAt (DATETIME2)          When rule modified           │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Sample Data

```
-- Roles Seed
INSERT INTO Roles VALUES (1, 'Admin', 'System administrator');
INSERT INTO Roles VALUES (2, 'User', 'Regular user');
INSERT INTO Roles VALUES (3, 'Viewer', 'Read-only access');

-- Masking Config Seed
INSERT INTO MaskingConfig VALUES (1, 1, 1, GETUTCDATE(), GETUTCDATE());

-- Users Example (encrypted)
INSERT INTO Users VALUES (
  15, 'admin', 0x7F5A8C..., 0x3E2A7B..., 0x9D4C6E...,
  '/5mW+cQ8s=', 112345678, 1, 1, '2026-04-01', '2026-04-01'
);
```

### 5.3 Indexes & Constraints

```
-- Unique Constraints
ALTER TABLE Users 
ADD CONSTRAINT UQ_Username UNIQUE (Username);

ALTER TABLE Users 
ADD CONSTRAINT UQ_EmailHash UNIQUE (EmailHash);

ALTER TABLE Roles 
ADD CONSTRAINT UQ_RoleName UNIQUE (Name);

-- Foreign Keys
ALTER TABLE Users 
ADD CONSTRAINT FK_Users_RoleId 
FOREIGN KEY (RoleId) REFERENCES Roles(Id);

-- Indexes for Performance
CREATE INDEX IDX_Users_Username ON Users(Username);
CREATE INDEX IDX_Users_EmailHash ON Users(EmailHash);
CREATE INDEX IDX_Users_RoleId ON Users(RoleId);
```

---

## 6. API ENDPOINTS

### 6.1 REST API Specification

#### **Authentication Endpoints**

```
POST /api/auth/register
├─ Access: Public
├─ Request:
│  {
│    "username": "john_doe",
│    "email": "john@example.com",
│    "phone": "+84123456789",
│    "password": "MyPassword123"
│  }
├─ Response (201 Created):
│  {
│    "success": true,
│    "message": "Đăng ký thành công",
│    "data": {
│      "id": 15,
│      "username": "john_doe",
│      "email": "john@example.com",
│      "phone": "+84123456789",
│      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
│    }
│  }
└─ Errors:
   - 400: Username already exists
   - 400: Email already in use
   - 400: Invalid email format
   - 400: Invalid phone format

POST /api/auth/login
├─ Access: Public
├─ Request:
│  {
│    "username": "john_doe",
│    "password": "MyPassword123"
│  }
├─ Response (200 OK):
│  {
│    "success": true,
│    "data": {
│      "userId": 15,
│      "username": "john_doe",
│      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
│      "expiresIn": 3600
│    }
│  }
└─ Errors:
   - 401: Invalid credentials
   - 404: User not found
   - 403: Account locked
```

#### **User Management Endpoints**

```
GET /api/users?skip=0&limit=10
├─ Access: Admin, Viewer [JWT Required]
├─ Query Parameters: skip (offset), limit (page size)
├─ Response (200 OK):
│  {
│    "success": true,
│    "data": {
│      "total": 8,
│      "skip": 0,
│      "limit": 10,
│      "items": [
│        {
│          "id": 15,
│          "username": "user1",
│          "email": "j***@example.com" (if Viewer),
│          "phone": "+84****3210" (if Viewer),
│          "role": "User",
│          "isActive": true
│        }
│      ]
│    }
│  }
└─ Errors: 401 Unauthorized, 403 Forbidden

GET /api/users/{id}
├─ Access: Admin, Viewer [JWT Required]
├─ Path: /api/users/15
├─ Response (200 OK): Single user object
└─ Errors: 404 Not Found, 401, 403

PUT /api/users/{id}
├─ Access: Admin, User(self) [JWT Required]
├─ Request:
│  {
│    "username": "john_updated",
│    "email": "john_new@example.com",
│    "phone": "+84987654321",
│    "password": "NewPassword456"
│  }
├─ Response (200 OK): Updated user
└─ Errors: 400 Email already in use, 401, 403

DELETE /api/users/{id}
├─ Access: Admin [JWT Required]
├─ Response (204 No Content)
└─ Errors: 404 Not Found, 401, 403

PATCH /api/users/{id}/active
├─ Access: Admin [JWT Required]
├─ Request: { "isActive": false }
├─ Response (200 OK): User with updated status
└─ Errors: 404, 401, 403

PATCH /api/users/{id}/promote-to-viewer
├─ Access: Admin [JWT Required]
├─ Response (200 OK): User with Viewer role
└─ Errors: 404, 401, 403
```

#### **Admin Configuration Endpoints**

```
GET /api/admin/masking-config
├─ Access: Admin [JWT Required]
├─ Response (200 OK):
│  {
│    "success": true,
│    "data": {
│      "id": 1,
│      "enabled": true,
│      "algorithm": 1,
│      "algorithmName": "Character Masking"
│    }
│  }
└─ Errors: 401, 403

PUT /api/admin/masking-config
├─ Access: Admin [JWT Required]
├─ Request: { "algorithm": 2 }
├─ Response (200 OK): Updated config
└─ Errors: 400 Invalid algorithm, 401, 403

GET /api/admin/masking-algorithms
├─ Access: Admin [JWT Required]
├─ Response (200 OK):
│  {
│    "success": true,
│    "data": [
│      { "id": 1, "name": "Character Masking" },
│      { "id": 2, "name": "Data Shuffling" },
│      { "id": 3, "name": "Data Substitution" },
│      { "id": 4, "name": "Noise Addition" }
│    ]
│  }
└─ Errors: 401, 403
```

### 6.2 Response Format (ApiResponse<T>)

```csharp
{
  "success": boolean,
  "message": "String (optional)",
  "data": T | null,
  "errors": [{ "field": "String", "message": "String" }]
}
```

---

## 7. FRONTEND ARCHITECTURE

### 7.1 Frontend Structure

```
FE3/
├── index.html
│   └─ Single page application entry point
│
├── js/
│   ├── router.js
│   │   ├─ defineRoutes() - Hash-based routing
│   │   ├─ navigateTo(path) - Navigate without page reload
│   │   └─ getCurrentRoute() - Get current path
│   │
│   ├── main.js
│   │   ├─ renderRegister() - Registration form
│   │   ├─ renderLogin() - Login form
│   │   ├─ renderUserList() - User management page
│   │   ├─ renderUserEdit() - Edit user form
│   │   ├─ validatePhoneFormat() - Phone validation
│   │   └─ Event listeners & form handlers
│   │
│   ├── api.js
│   │   ├─ fetch() wrapper with JWT
│   │   ├─ apiCall(method, path, data)
│   │   └─ Error handling
│   │
│   ├── auth.js
│   │   ├─ storeToken(token) - Save JWT to localStorage
│   │   ├─ getToken() - Retrieve JWT
│   │   ├─ isAuthenticated() - Check if logged in
│   │   ├─ logout() - Clear token & redirect
│   │   └─ hasRole(role) - Role-based UI rendering
│   │
│   └── config.js
│       └─ API_URL = "http://localhost:5000/api"
│
└── css/
    └── styles.css
        ├─ Responsive design
        ├─ Dark mode support (CSS variables)
        └─ Form styling & validation feedback
```

### 7.2 Frontend Flow Diagram

```
User opens index.html
        ↓
Router checks #hash
        ↓
┌─────────────┬──────────────┬─────────────┐
│  #/login    │  #/register  │  #/users    │
└─────────────┴──────────────┴─────────────┘
        ↓
Render appropriate page
        ↓
User fills form
        ↓
JavaScript validates client-side
        ├─ Username: 3-50 chars
        ├─ Email: valid format
        ├─ Phone: regex + length
        └─ Password: 6-100 chars
        ↓
Submit to /api/auth/register (or other endpoint)
        ↓
API Client (api.js)
├─ Add JWT to Authorization header
├─ Make fetch request
└─ Handle response/errors
        ↓
Server processes & returns response
        ↓
JavaScript updates DOM
└─ Success: Save token, navigate
└─ Error: Display error message
```

### 7.3 Data Flow on UI

```
REGISTRATION FORM:
  Input: username, email, phone, password
    ↓
  validatePhoneFormat(phone) - Client-side check
    ↓
  POST /api/auth/register (api.js)
    ↓
  Server: Encrypt, hash, validate duplicate
    ↓
  Response: { token, userId, message }
    ↓
  auth.js: storeToken(token)
    ↓
  router.js: navigateTo("#/users")
    ↓
  main.js: renderUserList()

LOGIN FORM:
  Input: username, password
    ↓
  POST /api/auth/login
    ↓
  Server: Verify password, generate JWT
    ↓
  Response: { token }
    ↓
  auth.js: storeToken(token)
    ↓
  navigateTo("#/users") or protected route

USER LIST PAGE:
  GET /api/users (with JWT in header)
    ↓
  Server: Check role, decrypt, apply masking if Viewer
    ↓
  Response: Users array (masked or not)
    ↓
  main.js: Render table
```

---

## 8. QUY TRÌNH XỬ LÝ DỮ LIỆU

### 8.1 Registration Flow (Chi Tiết)

```
STEP 1: Client validates
  ├─ Username length: 3-50
  ├─ Username regex: /^[a-zA-Z0-9_]+$/
  ├─ Email format: EmailAddress validator
  ├─ Phone regex: /^[\+]?[0-9]+$/ AND length 10-15
  └─ Password length: 6-100

STEP 2: POST /api/auth/register
  ├─ AuthController - Route received
  └─ Validate again server-side

STEP 3: UserService.Register()
  ├─ Check: UsernameExists(username) → No
  ├─ Check: EmailExists(emailHash) → No
  ├─ Generate: userKey = Random(100K, 2.1B)
  ├─ Hash password: PBKDF2(password, salt)
  ├─ Encrypt email: Encrypt(email, userKey) → byte[]
  ├─ Encrypt phone: Encrypt(phone, userKey) → byte[]
  ├─ Encrypt passwordHash: Encrypt(hash, userKey) → byte[]
  ├─ EmailHash = SHA256(email.ToLower())
  └─ Create User object

STEP 4: UserRepository.CreateUser()
  ├─ INSERT INTO Users (
  │   Username, EncryptedEmail, EncryptedPhone,
  │   EncryptedPassword, EmailHash, Key, RoleId,
  │   IsActive, CreatedAt, UpdatedAt
  │  )
  └─ OUTPUT INSERTED.Id

STEP 5: JwtService.GenerateToken()
  ├─ Claims: userId, userName, role
  ├─ Algorithm: HS256
  ├─ Expiry: 60 minutes
  └─ Return: Base64 JWT

STEP 6: Return API Response
  ├─ HTTP 200
  ├─ { success: true, data: { id, username, token } }
  └─ Client receives

STEP 7: Client-side
  ├─ auth.js: storeToken(token)
  ├─ localStorage.setItem('token', token)
  └─ router.js: navigateTo("#/users")
```

### 8.2 Data Retrieval with Masking

```
GET /api/users
  ├─ ClientSide: Include 'Authorization: Bearer <token>'

AuthController.GetUsers()
  ├─ Extract JWT claims
  ├─ Validate token not expired
  ├─ Get role from claims
  └─ Call UserService.GetUsers(mask: role == "Viewer")

UserService.GetUsers(mask)
  ├─ UserRepository.GetUsers() → List<User>
  ├─ For each User:
  │  ├─ DecryptAndBuild(user, mask)
  │  ├─ Decrypt email: Decrypt(encryptedEmail, user.Key)
  │  ├─ Decrypt phone: Decrypt(encryptedPhone, user.Key)
  │  └─ If mask == true:
  │     ├─ Get MaskingConfig.Algorithm
  │     ├─ Call DataMaskingService.ApplyMasking()
  │     └─ email = MaskEmail(email, algorithm)
  │
  └─ Return PaginatedUserResponse

Response to Client
  ├─ HTTP 200
  ├─ {
  │    data: {
  │      items: [
  │        {
  │          id: 16,
  │          username: "user1",
  │          email: "u***@hotmail.com" (if Viewer),
  │          phone: "+84****3210" (if Viewer)
  │        }
  │      ]
  │    }
  │  }
  └─ Client renders table
```

---

## 9. DEPENDENCY & INTEGRATION

### 9.1 Dependency Injection Setup

```csharp
// Program.cs (Startup)
services.AddScoped<IUserRepository, UserRepository>();
services.AddScoped<IMaskingConfigRepository, MaskingConfigRepository>();
services.AddScoped<IUserService, UserService>();
services.AddScoped<SecurityService>();
services.AddScoped<DataMaskingService>();
services.AddScoped<MaskingConfigService>();
services.AddScoped<JwtService>();
services.AddSingleton<Aes128Engine>();

// IUserService constructor
public UserService(
  IUserRepository userRepository,
  SecurityService securityService,
  DataMaskingService dataMaskingService
)
```

### 9.2 Service Dependencies Graph

```
AuthController
├─ IUserService
│  ├─ IUserRepository
│  │  └─ SqlConnection (ADO.NET)
│  ├─ SecurityService
│  │  ├─ Aes128Engine
│  │  │  ├─ Rfc2898DeriveBytes (PBKDF2)
│  │  │  └─ RandomNumberGenerator
│  │  └─ SHA256
│  └─ DataMaskingService
│
UsersController
├─ IUserService (same as above)
└─ IMaskingConfigService
   └─ IMaskingConfigRepository

AdminController
├─ IMaskingConfigService
│  └─ IMaskingConfigRepository

JwtService
└─ IConfiguration (appsettings.json)
```

### 9.3 External Libraries

```
NuGet Packages (Auto-referenced by ASP.NET Core 10):
├─ System.Security.Cryptography (AES, SHA256, PBKDF2)
├─ System.IdentityModel.Tokens.Jwt (JWT handling)
├─ Microsoft.Data.SqlClient (SQL Server connection)
└─ System.ComponentModel.DataAnnotations (Validation)
```

---

## 10. DEPLOYMENT ARCHITECTURE

### 10.1 Development Environment

```
Local Machine
├─ Visual Studio / VS Code
├─ .NET SDK 10.0
├─ SQL Server Express / LocalDB
└─ dotnet CLI

Development Server:
├─ Command: dotnet run --project UserManagement.csproj
├─ URL: http://localhost:5000
├─ HTTPS: https://localhost:5001
└─ Swagger UI: http://localhost:5000/swagger/index.html
```

### 10.2 Database Connection

```csharp
// appsettings.json
"ConnectionStrings": {
  "DefaultConnection": 
    "Server=.;Database=UserManagement;
     Trusted_Connection=True;TrustServerCertificate=True;"
}

// .NET Connection Resolution
SqlConnection conn = new SqlConnection(connectionString);
```

### 10.3 Production Deployment Stack (Recommended)

```
┌──────────────────────────────────────────┐
│        Frontend (Static Files)           │
│  - Hosted on CDN or separate web server  │
│  - index.html + js/* + css/*             │
│  - HTTPS enforced                        │
└──────────────────────────────────────────┘
              ↓ REST API calls ↓
┌──────────────────────────────────────────┐
│    ASP.NET Core Application (IIS)        │
│  - Running on Windows Server 2019+       │
│  - Or Docker container                   │
│  - Behind reverse proxy (nginx?)         │
│  - HTTPS/TLS 1.3                         │
└──────────────────────────────────────────┘
              ↓ Database queries ↓
┌──────────────────────────────────────────┐
│  SQL Server 2019+ (Enterprise/Standard)  │
│  - Encrypted connections (TDE)           │
│  - Regular backups                       │
│  - High availability setup
└──────────────────────────────────────────┘
```

### 10.4 SSL/TLS Security

```
appsettings.json (Production):
{
  "Https": {
    "Url": "https://api.yourdomain.com:443",
    "Certificate": {
      "Path": "/path/to/certificate.pfx",
      "Password": "***"
    }
  },
  "Security": {
    "HSTSMaxAge": 31536000,
    "TrustServerCertificate": false
  }
}

Program.cs:
app.UseHttpsRedirection();
app.UseHsts();
```

---

## 11. BUILD & DEPLOYMENT COMMANDS

### Development

```bash
# Restore dependencies
dotnet restore

# Build solution
dotnet build
dotnet build UserManagementFull.sln

# Run application
dotnet run --project UserManagement.csproj

# Run with watch (auto-reload)
dotnet watch run
```

### Testing

```bash
# Run unit tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true
```

### Production Build

```bash
# Publish release build
dotnet publish -c Release -o ./publish

# Create Docker image
docker build -t usermanagement:1.0 .

# Deploy to IIS
# Copy publish/* to IIS App Pool directory
```

---

## 12. MONITORING & LOGGING

### 12.1 Logging Configuration

```csharp
// Program.cs
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddEventSourceLogger();

// Usage in service
_logger.LogInformation($"User {userId} registered");
_logger.LogError("Encryption failed: {error}", ex.Message);
```

### 12.2 Health Check Endpoints

```
GET /health
├─ Database connectivity
├─ API response time
└─ Returns 200 if healthy
```

---

## 13. DOCUMENTO DIAGRAMS

### Entity Relationship Diagram (ERD)

```
Users                    Roles
┌─────────────────┐    ┌─────────────┐
│ Id (PK)         │    │ Id (PK)     │
│ Username (UK)   │    │ Name (UK)   │
│ Email (Enc)     │    │ Description │
│ Phone (Enc)     │    └─────────────┘
│ Password (Enc)  │          ↑
│ EmailHash (UK)  │          │
│ Key             │          │ RoleId (FK)
│ RoleId (FK)  ───┼──────────┘
│ IsActive        │
│ CreatedAt       │
│ UpdatedAt       │
└─────────────────┘

MaskingConfig
┌──────────────┐
│ Id (PK)      │
│ Enabled      │
│ Algorithm    │
│ CreatedAt    │
│ UpdatedAt    │
└──────────────┘
```

### Sequence Diagram (Registration)

```
Client              AuthController    UserService        SecurityService    UserRepository    DB
  │                     │                │                   │                  │           │
  │ POST /register      │                │                   │                  │           │
  ├────────────────────>│                │                   │                  │           │
  │                     │ Validate input │                   │                  │           │
  │                     │ Register()     │                   │                  │           │
  │                     ├───────────────>│                   │                  │           │
  │                     │                │ Encrypt email     │                  │           │
  │                     │                ├──────────────────>│                  │           │
  │                     │                │ <─── encrypted ───┤                  │           │
  │                     │                │ Hash password     │                  │           │
  │                     │                ├──────────────────>│                  │           │
  │                     │                │ <─── hash ────────┤                  │           │
  │                     │                │ CreateUser()      │                  │           │
  │                     │                ├─────────────────────────────────────>│           │
  │                     │                │                   │         INSERT        │
  │                     │                │                   │         Users       │
  │                     │                │                   │                  ├──────────>│
  │                     │                │                   │                  │<──────────┤
  │                     │                │                   │                  │  Id=15    │
  │                     │ <───────────────────────────────────────────────────────┤           │
  │                     │ GenerateToken()│                   │                  │           │
  │                     ├───────────────────────────────────────────────────────>│           │
  │ <─ 200 + Token ─────┤                │                   │                  │           │
  │ localStorage.token  │                │                   │                  │           │
```

---

## 14. QUICK REFERENCE

### Key Classes Map

| Class | File | Purpose |
|-------|------|---------|
| `AuthController` | Controllers/ | API endpoints for login/register |
| `UsersController` | Controllers/ | CRUD endpoints for users |
| `UserService` | Services/ | Business logic for users |
| `SecurityService` | Services/ | Encryption & key management |
| `Aes128Engine` | Services/ | Custom AES-128 implementation |
| `UserRepository` | Repositories/ | SQL queries for users |
| `User` | Models/ | User entity |

### Key Methods

| Method | Class | Returns |
|--------|-------|---------|
| `Register()` | UserService | ApiResponse<UserResponse> |
| `Encrypt()` | SecurityService | byte[] |
| `Decrypt()` | SecurityService | string |
| `GetEmailHash()` | SecurityService | string |
| `EncryptBlock()` | Aes128Engine | byte[] |
| `CreateUser()` | UserRepository | int (userId) |

---

**Document Version:** 1.0  
**Last Updated:** April 1, 2026  
**Author:** System Architecture Team
