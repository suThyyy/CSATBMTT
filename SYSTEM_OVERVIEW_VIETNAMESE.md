# 📋 HỆ THỐNG QUẢN LÝ NGƯỜI DÙNG - TỔNG QUAN TOÀN DIỆN

## 🎯 Giới Thiệu Dự Án

**Tên Dự Án:** User Management System  
**Phiên Bản:** 1.0  
**Ngôn Ngữ Backend:** C# (.NET 10)  
**Framework:** ASP.NET Core  
**Cơ Sở Dữ Liệu:** SQL Server  
**Ngôn Ngữ Frontend:** JavaScript Vanilla + HTML/CSS  
**Tính Năng Đặc Biệt:** Mã hóa dữ liệu + Data Masking động + Quản lý quyền hạn

---

## 📊 TỔNG QUAN HỆ THỐNG

### 1. Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (FE3)                           │
│              JavaScript + HTML/CSS + Router                 │
│                    ↓ (HTTP Rest API)                        │
│─────────────────────────────────────────────────────────────┤
│                    BACKEND API                              │
│              ASP.NET Core 10.0 + SQL Server                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Controllers (4 API Endpoints)                       │   │
│  │  ├─ AuthController (Login/Register - Public)        │   │
│  │  ├─ UsersController (CRUD Users - Protected)        │   │
│  │  ├─ MaskingController (Data Masking Demo)           │   │
│  │  └─ AdminController (Cấu hình Masking)             │   │
│  │                                                      │   │
│  │ Bảo Mật:                                            │   │
│  │  ├─ JWT Token Authentication                        │   │
│  │  ├─ AES-128 Encryption (Custom)                     │   │
│  │  ├─ PBKDF2 Password Hashing                         │   │
│  │  └─ Data Masking (4 Algorithms)                     │   │
│  │                                                      │   │
│  │ Database Layer:                                      │   │
│  │  ├─ UserRepository (Truy vấn Users)                 │   │
│  │  └─ MaskingConfigRepository (Cấu hình Masking)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│                    SQL Server Database                       │
│           Users Table + MaskingConfig Table                 │
└─────────────────────────────────────────────────────────────┘
```

### 2. Công Nghệ Sử Dụng

#### Backend
- **Framework:** ASP.NET Core 10.0
- **Authentication:** JWT (JSON Web Token)
- **Mã Hóa:** Custom AES-128
- **Hash Mật Khẩu:** PBKDF2-SHA256
- **Database:** SQL Server với ADO.NET
- **API Documentation:** Swagger UI

#### Frontend
- **HTML/CSS:** Giao diện người dùng
- **JavaScript Vanilla:** Logic ứng dụng
- **Router:** Định tuyến các trang
- **API Client:** Gọi các endpoint backend

---

## ✨ CÁC CHỨC NĂNG CHÍNH

### 🔑 Chứng Năng 1: Quản Lý Xác Thực & Ủy Quyền

#### 1.1 Đăng Ký (Register)
- **Endpoint:** `POST /api/auth/register`
- **Yêu Cầu:**
  - Username: 3-50 ký tự (chỉ a-z, 0-9, _)
  - Email: Định dạng email hợp lệ
  - Phone: 10-15 chữ số (có thể có +)
  - Password: 6-100 ký tự
- **Xử Lý:**
  - Validate dữ liệu đầu vào
  - Kiểm tra username chưa tồn tại
  - Hash mật khẩu với PBKDF2
  - Mã hóa email và phone bằng AES-128
  - Tạo user key ngẫu nhiên
  - Lưu vào database
- **Trả Về:** Token JWT + Thông tin user

#### 1.2 Đăng Nhập (Login)
- **Endpoint:** `POST /api/auth/login`
- **Yêu Cầu:**
  - Username
  - Password
- **Xử Lý:**
  - Tìm user theo username
  - Xác minh mật khẩu
  - Tạo JWT token với có thời hạn
  - Trả về token cho client
- **Trả Về:** JWT Token + Vai trò + Thời hạn

### 👥 Chức Năng 2: Quản Lý Người Dùng

#### 2.1 Xem Danh Sách Người Dùng
- **Endpoint:** `GET /api/users`
- **Quyền Hạn:**
  - ✅ Admin: Xem toàn bộ dữ liệu gốc (không mask)
  - ✅ Viewer: Xem dữ liệu được mask theo cấu hình Admin
  - ❌ User: Không thể truy cập
- **Truy Vấn:**
  - Lấy tất cả users từ database
  - Nếu role là Viewer → Áp dụng data masking

#### 2.2 Xem Chi Tiết Người Dùng
- **Endpoint:** `GET /api/users/{id}`
- **Tương Tự:** Danh sách người dùng nhưng với 1 record

#### 2.3 Cập Nhật Thông Tin
- **Endpoint:** `PUT /api/users/{id}`
- **Có Thể Cập Nhật:**
  - Username
  - Email
  - Phone
  - Password (sẽ được hash lại)
- **Quyền Hạn:**
  - User: Chỉ update thông tin của chính mình
  - Admin: Update bất kỳ user

#### 2.4 Xóa Người Dùng
- **Endpoint:** `DELETE /api/users/{id}`
- **Quyền Hạn:** Chỉ Admin

#### 2.5 Thay Đổi Trạng Thái Tài Khoản
- **Endpoint:** `PATCH /api/users/{id}/active`
- **Chức Năng:** Lock/Unlock tài khoản
- **Quyền Hạn:** Chỉ Admin

#### 2.6 Nâng Cấp Người Dùng Thành Viewer
- **Endpoint:** `PATCH /api/users/{id}/promote-to-viewer`
- **Chức Năng:** Thay đổi vai trò từ User thành Viewer
- **Quyền Hạn:** Chỉ Admin

### 🎭 Chức Năng 3: Hệ Thống Vai Trò & Quyền Hạn

#### Vai Trò Có Sẵn:

| ID | Tên | Mô Tả | Quyền Hạn |
|---|---|---|---|
| 1 | **Admin** | Quản trị viên hệ thống | ✅ Xem tất cả dữ liệu gốc<br>✅ CRUD users<br>✅ Lock/Unlock tài khoản<br>✅ Cấu hình masking động<br>✅ Nâng cấp vai trò |
| 2 | **User** | Người dùng bình thường | ✅ Xem/chỉnh sửa thông tin cá nhân<br>❌ Xem thông tin người khác<br>❌ Quản lý người dùng khác |
| 3 | **Viewer** | Người xem với dữ liệu che giấu | ✅ Xem danh sách người dùng<br>✅ Dữ liệu luôn bị mask<br>❌ Không thể tắt masking<br>❌ Quản lý người dùng |

### 🔒 Chức Năng 4: Data Masking (Che Giấu Dữ Liệu)

#### Mục Đích:
- Bảo vệ dữ liệu nhạy cảm (email, phone)
- Người dùng Viewer chỉ xem dữ liệu che giấu
- Admin có thể chọn thuật toán từ 4 cách khác nhau

#### 4 Phương Pháp Masking:

##### 1️⃣ Character Masking (Che Ký Tự)
```
Nguyên tắc: Thay thế các ký tự nhạy cảm bằng dấu *
Ví dụ Email:
  - Gốc:    john@example.com
  - Mask:   j***@example.com

Ví dụ Phone:
  - Gốc:    +84886543210
  - Mask:   +84****3210
```
- **Ưu điểm:** Đơn giản, dễ hiểu
- **Nhược điểm:** Vẫn có thể nhận ra pattern

##### 2️⃣ Data Shuffling (Xáo Trộn)
```
Nguyên tắc: Sắp xếp lại vị trí các ký tự ngẫu nhiên
Ví dụ Email:
  - Gốc:    john@example.com
  - Mask:   omhj@elpmaxe.cmo (xáo trộn ký tự)

Ví dụ Phone:
  - Gốc:    +84886543210
  - Mask:   +82345408865 (sắp xếp lại)
```
- **Ưu điểm:** Không mất dữ liệu, khó nhận ra pattern
- **Nhược điểm:** Không hợp lệ làm email/phone

##### 3️⃣ Data Substitution (Thay Thế)
```
Nguyên tắc: Thay số liệu gốc bằng dữ liệu giả tương tự
Ví dụ Email:
  - Gốc:    john@example.com
  - Mask:   emma@example.com (thay username ngoẫu nhiên)

Ví dụ Phone:
  - Gốc:    +84886543210
  - Mask:   +84912345678 (thay số điện thoại giả)
```
- **Ưu điểm:** Trông hợp lệ, chuẩn xác
- **Nhược điểm:** Tạo thêm dữ liệu, phức tạp hơn

##### 4️⃣ Noise Addition (Thêm Nhiễu)
```
Nguyên tắc: Thêm các ký tự nhiễu vào dữ liệu
Ví dụ Email:
  - Gốc:    john@example.com
  - Mask:   jx9@example.c#m (thêm nhiễu x9 và #)

Ví dụ Phone:
  - Gốc:    +84886543210
  - Mask:   +8#4@86X5Y3210 (thêm ký tự ngẫu nhiên)
```
- **Ưu điểm:** Bảo vệ dữ liệu tốt
- **Nhược điểm:** Không còn hợp lệ

#### Admin Có Thể:
- ✅ Bật/Tắt masking toàn hệ thống
- ✅ Chọn 1 trong 4 thuật toán
- ✅ Cấu hình tập trung (1 cấu hình cho tất cả Viewer)
- ✅ Viewer không thể thay đổi cấu hình

---

## 🔐 BẢO MẬT - CHI TIẾT TRIỂN KHAI

### 1. Kiến Trúc Bảo Mật 4 Lớp

```
┌─────────────────────────────────────────────┐
│         LỚP 1: HASHING (PBKDF2-SHA256)      │
│  Mật khẩu → Hash một chiều không thể reverse│
│  Salt ngẫu nhiên 32 bytes = hash khác nhau  │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│      LỚP 2: ENCRYPTION KEYS                 │
│  Master Key = SHA256(appsettings.json)      │
│  User Key = RandomInt(100k - 2.1B)          │
│  Derived Key = SHA256(Master + User)        │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│  LỚP 3: AES-128 CUSTOM ENCRYPTION           │
│  Email, Phone, Password Hash được mã hóa    │
│  Mỗi user có key riêng để mã/giải mã        │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│   LỚP 4: DATA MASKING (4 Thuật Toán)        │
│  Viewer xem dữ liệu che giấu                │
│  Admin cấu hình từ 4 thuật toán khác nhau   │
└─────────────────────────────────────────────┘
```

### 2. Mã Hóa Mật Khẩu - PBKDF2-SHA256

#### Quy Trình Tạo Hash:

```
Input: "MyPassword123"
  ↓
Bước 1: Sinh salt ngẫu nhiên (32 bytes)
  salt = RandomNumberGenerator.GetBytes(32)
  
Bước 2: Tạo hash từ password + salt
  hash = PBKDF2(password, salt, iterations=10000, algorithm=SHA256)
  
Bước 3: Lưu dạng "salt:hash" trong database
  storedHash = Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash)
```

#### Xác Minh Password:
```
Input: "MyPassword123" (từ login form)
  ↓
Bước 1: Lấy storedHash từ database
Bước 2: Tách salt từ "salt:hash"
Bước 3: Hash password đầu vào với salt từ database
  newHash = PBKDF2(password, salt, iterations=10000, algorithm=SHA256)
Bước 4: So sánh newHash với hash từ database
  ✅ Nếu bằng → Password đúng
  ❌ Nếu khác → Password sai
```

### 3. Khoá Mã Hóa Dữ Liệu

#### Master Key
```
Nguồn:   appsettings.json["Jwt"]["Key"]
         = "ThisIsASecretKeyForJwtTokenGeneration2024!"
         
Lấy:    masterKey = SHA256(configKey) = 32 bytes (256 bits)

Công Dụng: Seed sinh master key dùng cho tất cả user
```

#### User Key (Khóa Người Dùng)
```
Sinh: randomInt = RandomNumberGenerator.GetInt32(100_000, int.MaxValue)
      (Phạm vi: 100,000 to 2,147,483,647)

Lưu: Lưu trong cột Users.Key

Công Dụng: Mỗi user có key riêng để mã hóa dữ liệu cá nhân
```

#### Derived Key (Khoá Dẫn Xuất)
```
Công thức:
  combined = masterKey (32 bytes) + userKey (4 bytes) = 36 bytes
  derivedKey = SHA256(combined) = 32 bytes

Công Dụng: Dùng làm key cho AES-128 encryption
```

### 4. Mã Hóa Dữ Liệu - AES-128 Custom

#### Được Mã Hóa:
- ✅ Email (byte[] EncryptedEmail)
- ✅ Phone (byte[] EncryptedPhone)  
- ✅ Password Hash (byte[] EncryptedPassword)

#### Không Được Mã Hóa:
- ❌ Username (công khai, dùng để login)
- ❌ User ID (cần truy vấn database)
- ❌ Role, IsActive, Timestamps

#### Quy Trình Mã Hóa:

```
Input: "john@example.com", Derived Key: 32 bytes
  ↓
Bước 1: Sinh IV (Initialization Vector) ngẫu nhiên 16 bytes
  iv = RandomNumberGenerator.GetBytes(16)

Bước 2: Tạo AES cipher với key + IV
  cipher = new AesManaged { Key = derivedKey, IV = iv }

Bước 3: Encrypt dữ liệu
  encryptedBytes = cipher.CreateEncryptor().TransformFinalBlock(data)

Bước 4: Kết hợp IV + Encrypted Data
  result = iv + encryptedBytes
    (16 bytes IV + N bytes encrypted = N+16 bytes)

Lưu vào Database: Lưu toàn bộ (IV + Encrypted Data)
```

#### Quy Trình Giải Mã:

```
Input: byte[] encryptedData từ database
  ↓
Bước 1: Lấy IV (16 bytes đầu tiên)
  iv = encryptedData[0:16]

Bước 2: Lấy dữ liệu mã hóa (từ byte thứ 16 trở đi)
  cipherText = encryptedData[16:]

Bước 3: Tạo AES cipher với key + IV
  cipher = new AesManaged { Key = derivedKey, IV = iv }

Bước 4: Decrypt
  decryptor = cipher.CreateDecryptor()
  plaintext = decryptor.TransformFinalBlock(cipherText)

Output: "john@example.com"
```

### 5. JWT Token Authentication

#### Tạo Token:

```
JWT Token gồm 3 phần: HEADER.PAYLOAD.SIGNATURE

HEADER:
{
  "alg": "HS256",
  "typ": "JWT"
}

PAYLOAD (Claims):
{
  "sub": "42",                    // User ID
  "name": "john_doe",            // Username
  "role": "Admin",               // Role
  "iat": 1711900000,             // Issued At
  "exp": 1711903600,             // Expiration (60 phút)
  "iss": "UserManagementAPI",    // Issuer
  "aud": "UserManagementClient"  // Audience
}

SIGNATURE:
  HMACSHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    secret_key
  )
```

#### Xác Minh Token:

```
Client gửi: Authorization: Bearer {token}
  ↓
Bước 1: Tách token từ header
Bước 2: Validate signature bằng secret key
Bước 3: Kiểm tra exp (Expiration time)
  ✅ Nếu hợp lệ → Lấy claims từ payload
  ❌ Nếu hết hạn → Yêu cầu login lại
Bước 4: Kiểm tra quyền hạn dựa trên role trong claims
```

#### Cấu Hình JWT:
```json
"Jwt": {
  "Key": "ThisIsASecretKeyForJwtTokenGeneration2024!",
  "Issuer": "UserManagementAPI",
  "Audience": "UserManagementClient",
  "ExpiryMinutes": 60
}
```

### 6. Quyền Hạn Truy Cập (Authorization)

#### Role-Based Access Control:

| Endpoint | Method | Admin | Viewer | User | Công khai |
|----------|--------|-------|--------|------|-----------|
| /api/auth/register | POST | ❌ | ❌ | ❌ | ✅ |
| /api/auth/login | POST | ❌ | ❌ | ❌ | ✅ |
| /api/users | GET | ✅ | ✅ | ❌ | ❌ |
| /api/users/{id} | GET | ✅ | ✅ | ❌ | ❌ |
| /api/users/{id} | PUT | ✅ | ❌ | ✅* | ❌ |
| /api/users/{id} | DELETE | ✅ | ❌ | ❌ | ❌ |
| /api/users/{id}/active | PATCH | ✅ | ❌ | ❌ | ❌ |
| /api/users/{id}/promote-to-viewer | PATCH | ✅ | ❌ | ❌ | ❌ |
| /api/admin/masking-config | GET | ✅ | ❌ | ❌ | ❌ |
| /api/admin/masking-config | PUT | ✅ | ❌ | ❌ | ❌ |

*User chỉ update thông tin của chính mình

### 7. Best Practices Bảo Mật Được Áp Dụng

#### ✅ Được Thực Hiện
- ✅ Mã hóa dữ liệu nhạy cảm (Email, Phone)
- ✅ Hash mật khẩu không thể reverse (PBKDF2)
- ✅ Salt ngẫu nhiên cho mỗi user
- ✅ JWT token với thời hạn (60 phút)
- ✅ Role-based access control
- ✅ Data masking cho Viewer
- ✅ Custom AES-128 encryption

#### ⚠️ Cần Chú Ý (Production)
- ⚠️ JWT Secret Key phải lưu trong Environment Variables
- ⚠️ Không hardcode secret key trong appsettings.json
- ⚠️ HTTPS bắt buộc cho production
- ⚠️ CORS phải được cấu hình đúng
- ⚠️ Rate limiting cho login endpoint
- ⚠️ Audit log cho các thao tác quan trọng

---

## 📱 CẤU TRÚC DATABASE

### Users Table

```sql
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    EncryptedEmail VARBINARY(MAX) NOT NULL,      -- AES-128 mã hóa
    EncryptedPhone VARBINARY(MAX) NOT NULL,      -- AES-128 mã hóa
    EncryptedPassword VARBINARY(MAX) NOT NULL,   -- Hash + mã hóa
    Key INT NOT NULL DEFAULT 0,                   -- User-specific encryption key
    RoleId INT NOT NULL DEFAULT 2,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);
```

### Roles Table

```sql
CREATE TABLE Roles (
    Id INT PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(MAX)
);

-- Dữ liệu mặc định
INSERT INTO Roles VALUES
  (1, 'Admin', 'Quản trị viên hệ thống'),
  (2, 'User', 'Người dùng bình thường'),
  (3, 'Viewer', 'Xem với dữ liệu được che giấu');
```

### MaskingConfig Table

```sql
CREATE TABLE MaskingConfig (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Enabled BIT NOT NULL DEFAULT 1,
    Algorithm INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Các giá trị Algorithm
-- 1 = CharacterMasking (Che ký tự)
-- 2 = DataShuffling (Xáo trộn)
-- 3 = DataSubstitution (Thay thế)
-- 4 = NoiseAddition (Thêm nhiễu)
```

---

## 🚀 QUY TRÌNH HOẠT ĐỘNG CHÍNH

### Quy Trình Đăng Ký (Register)

```
Client
  ↓ POST /api/auth/register
  │ { username, email, phone, password }
  ↓
AuthController.Register()
  ├── Validate input
  ├── Check username exists
  ├── Hash password (PBKDF2)
  ├── Sinh user key ngẫu nhiên
  ├── Derive key = SHA256(masterKey + userKey)
  ├── Encrypt email (AES-128)
  ├── Encrypt phone (AES-128)
  ├── Encrypt password hash (AES-128)
  ↓
UserRepository.CreateUser()
  └── SaveToDatabase(user)
  ↓
Return JWT Token
```

### Quy Trình Xem Danh Sách Users (Viewer)

```
Viewer client
  ↓ GET /api/users + Bearer {token}
  ↓
UsersController.GetUsers()
  ├── Validate JWT token
  ├── Check role = Viewer
  ├── Get all users từ database
  │
  ├── Decrypt email & phone mỗi user
  │ (decrypt bằng derived key = SHA256(masterKey + userKey))
  │
  ├── Get masking config từ database
  │   (Enabled & Algorithm từ MaskingConfig)
  │
  ├── Nếu enabled = true:
  │   ├── Nếu Algorithm = 1 → Character Masking
  │   ├── Nếu Algorithm = 2 → Data Shuffling
  │   ├── Nếu Algorithm = 3 → Data Substitution
  │   └── Nếu Algorithm = 4 → Noise Addition
  │
  ↓
Return [{ id, username, masked_email, masked_phone }]
```

### Quy Trình Cấu Hình Masking (Admin)

```
Admin client
  ↓ PUT /api/admin/masking-config + Bearer {token}
  │ { enabled: true, algorithm: 2 }
  ↓
AdminController.UpdateMaskingConfig()
  ├── Validate JWT token
  ├── Check role = Admin
  ├── Validate algorithm (1-4)
  ↓
MaskingConfigRepository.UpdateConfig()
  ├── Cập nhật MaskingConfig table
  │ (SET Enabled = true, Algorithm = 2, UpdatedAt = NOW())
  ↓
Return { success: true, message: "Cấu hình đã cập nhật" }

--- Từ giờ ---
Tất cả Viewer sẽ xem dữ liệu theo Algorithm 2 (Data Shuffling)
```

---

## 🎯 TÓM TẮT ĐIỂM QUAN TRỌNG

### Bảo Mật Mạnh
- ✅ 4 lớp bảo mật (Hashing + Encryption + Keys + Masking)
- ✅ AES-128 custom implementation
- ✅ Mỗi user có key riêng
- ✅ PBKDF2 + Salt cho mật khẩu
- ✅ JWT token xác thực

### Linh Hoạt Quản Lý
- ✅ 3 vai trò khác nhau (Admin, User, Viewer)
- ✅ Cấu hình masking động
- ✅ 4 thuật toán masking lựa chọn
- ✅ Admin kiểm soát toàn bộ

### User Experience
- ✅ API đơn giản, dễ sử dụng
- ✅ Swagger documentation
- ✅ Error handling chi tiết
- ✅ Consistent API response format

### Scalability
- ✅ Database SQL Server
- ✅ ADO.NET direct connection
- ✅ Async/await operations
- ✅ Dependency injection

---

## 📞 Liên Hệ & Support

Để biết thêm chi tiết:
- Xem: BACKEND_DOCUMENTATION.md (API Endpoints)
- Xem: SECURITY_ENCRYPTION_FLOW.md (Chi tiết bảo mật)
- Xem: MASKING_CONFIG_FEATURE.md (Masking Configuration)
- Xem: API_DOCUMENTATION.md (API Reference)
