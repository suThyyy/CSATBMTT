# User Management API - Tài Liệu Chi Tiết

**Phiên bản:** v1  
**Ngôn ngữ:** C# (.NET 10)  
**Framework:** ASP.NET Core with JWT Authentication  
**Bảo mật:** AES-128 Custom Implementation + 4 Data Masking Methods

---

## Mục Lục

1. [Tổng Quan Hệ Thống](#tổng-quan-hệ-thống)
2. [Cấu Trúc Dữ Liệu](#cấu-trúc-dữ-liệu)
3. [Authentication & Authorization](#authentication--authorization)
4. [Các Endpoint API](#các-endpoint-api)
5. [Mã Lỗi & HTTP Status Codes](#mã-lỗi--http-status-codes)

---

## Tổng Quan Hệ Thống

### Các Vai Trò (Roles)

| Role ID | Tên | Mô Tả |
|---------|-----|-------|
| 1 | Admin | Quản lý toàn bộ hệ thống, xem dữ liệu gốc không mask |
| 2 | User | Người dùng thường, chỉ xem/chỉnh sửa thông tin cá nhân |
| 3 | Viewer | Xem danh sách người dùng nhưng dữ liệu luôn bị mask |

### Tính Năng Bảo Mật

- **Mã Hóa Email & Phone:** AES-128 Custom Implementation
- **Mã Hóa Mật Khẩu:** Hash với key riêng cho mỗi user
- **JWT Token:** Xác thực cho tất cả endpoint (trừ register & login)
- **Data Masking:** 4 phương pháp che giấu dữ liệu nhạy cảm

### 4 Phương Pháp Data Masking

```
1. Character Masking (1)    : Che ký tự bằng dấu *
                             Ví dụ: john@example.com → j***@example.com
                             
2. Data Shuffling (2)       : Xáo trộn vị trí các ký tự
                             Ví dụ: john@example.com → omhj@elpmaxe.cmo
                             
3. Data Substitution (3)    : Thay thế bằng dữ liệu giả hợp lệ
                             Ví dụ: john@example.com → emma@example.com
                             
4. Noise Addition (4)       : Thêm ký tự nhiễu vào dữ liệu
                             Ví dụ: john@example.com → jx9@example.c#m
```

---

## Cấu Trúc Dữ Liệu

### 1. User Entity (Database)

```csharp
public class User
{
    public int Id                   { get; set; }      // User ID duy nhất
    public string? Username         { get; set; }      // Tên đăng nhập (không encrypt)
    public byte[]? EncryptedEmail   { get; set; }      // Email được mã hóa
    public byte[]? EncryptedPhone   { get; set; }      // Phone được mã hóa
    public byte[]? EncryptedPassword { get; set; }     // Mật khẩu được mã hóa
    public int Key                  { get; set; }      // Key dùng để mã/giải mã (AES-128)
    public int RoleId               { get; set; }      // ID vai trò
    public string? RoleName         { get; set; }      // Tên vai trò (Admin, Viewer, User)
    public bool IsActive            { get; set; }      // Trạng thái tài khoản
    public DateTime CreatedAt       { get; set; }      // Ngày tạo
    public DateTime UpdatedAt       { get; set; }      // Ngày cập nhật
}
```

### 2. Cấu Trúc Response Chung (Wrapper)

Tất cả API trả về dạng:

```json
{
  "success": true,                          // boolean: Thành công hay thất bại
  "message": "Mô tả kết quả hoạt động",   // string: Thông báo cho client
  "data": { ... }                           // object/array: Dữ liệu trả về
}
```

**Ví dụ Response Thành Công:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "john_doe",
    "role": "Admin",
    "expiresAt": "2026-03-30T14:30:00Z"
  }
}
```

**Ví dụ Response Lỗi:**
```json
{
  "success": false,
  "message": "Tên đăng nhập hoặc mật khẩu không đúng",
  "data": null
}
```

---

## Authentication & Authorization

### Cách Sử Dụng JWT Token

1. **Lấy Token:** Gọi `/api/auth/login` để nhận token
2. **Gửi Token:** Thêm vào header của mọi request:
   ```
   Authorization: Bearer {token}
   ```

3. **Token Payload:**
   ```json
   {
     "nameid": "1",                    // User ID
     "unique_name": "john_doe",        // Username
     "role": "Admin",                  // Role name
     "userId": "1",                    // User ID (custom claim)
     "exp": 1740659400,                // Thời gian hết hạn
     "iss": "UserManagementAPI",       // Issuer
     "aud": "UserManagementClient"     // Audience
   }
   ```

### Validation Rules

| Field | Độ dài | Pattern | Ghi chú |
|-------|--------|---------|---------|
| Username | 3-50 | `^[a-zA-Z0-9_]+$` | Chỉ chữ, số, dấu gạch dưới |
| Email | - | RFC 5322 | Email hợp lệ |
| Phone | 10-15 | `^[\+]?[0-9]+$` | Số, có thể có + ở đầu |
| Password | 6-100 | - | Bất kỳ ký tự |

---

## Các Endpoint API

---

## 📌 AUTHENTICATION CONTROLLER (`/api/auth`)

### 1. Đăng Ký Tài Khoản

```
POST /api/auth/register

Role required: KHÔNG (Public)
```

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+84912345678",
  "password": "secretPassword123"
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
    "email": "john@example.com",        // được mask
    "phone": "+8491234****",             // được mask
    "password": "***",
    "role": "User",                      // vai trò mặc định
    "isActive": true,
    "createdAt": "2026-03-30T10:00:00Z"
  }
}
```

**Error Responses:**

| Status | Lỗi | Giải pháp |
|--------|-----|----------|
| 400 | Username đã tồn tại | Chọn username khác |
| 400 | Invalid email format | Kiểm tra định dạng email |
| 400 | Phone không hợp lệ | Nhập số điện thoại hợp lệ |
| 400 | Password quá ngắn | Mật khẩu tối thiểu 6 ký tự |

---

### 2. Đăng Nhập

```
POST /api/auth/login

Role required: KHÔNG (Public)
```

**Request:**
```json
{
  "username": "john_doe",
  "password": "secretPassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiJqb2huX2RvZSIsInJvbGUiOiJVc2VyIiwidXNlcklkIjoiMSIsImV4cCI6MTc0MDY1OTQwMCwiaXNzIjoiVXNlck1hbmFnZW1lbnRBUEkiLCJhdWQiOiJVc2VyTWFuYWdlbWVudENsaWVudCJ9.abc123xyz",
    "username": "john_doe",
    "role": "User",
    "expiresAt": "2026-03-30T11:00:00Z"  // Token hết hạn sau 60 phút
  }
}
```

**Error Responses:**

| Status | Lỗi | Giải pháp |
|--------|-----|----------|
| 401 | Tên đăng nhập hoặc mật khẩu không đúng | Kiểm tra thông tin |
| 401 | Tài khoản đã bị khóa | Liên hệ admin |

---

## 👥 USERS CONTROLLER (`/api/users`)

> **⚠️ Tất cả endpoint yêu cầu JWT Token trong header `Authorization: Bearer {token}`**

### 1. Lấy Danh Sách Người Dùng (Phân Trang)

```
GET /api/users?mask=true&skip=0&limit=10

Role required: Admin, Viewer
```

**Query Parameters:**

| Param | Type | Default | Mô Tả |
|-------|------|---------|-------|
| mask | boolean | true | Áp dụng masking cho dữ liệu |
| skip | integer | 0 | Số bản ghi cần bỏ qua |
| limit | integer | 10 | Số bản ghi trên 1 trang (tối đa 100) |

**Response (200 OK):**
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
        "email": "j***@example.com",     // Đã mask (mặc định)
        "phone": "0912***678",            // Đã mask (mặc định)
        "password": "***",
        "role": "Admin",
        "isActive": true,
        "createdAt": "2026-03-30T10:00:00Z"
      },
      {
        "id": 2,
        "username": "jane_smith",
        "email": "j***@example.com",
        "phone": "0917***345",
        "password": "***",
        "role": "User",
        "isActive": true,
        "createdAt": "2026-03-30T11:00:00Z"
      }
    ]
  }
}
```

**Quyền Hạn:**
- **Admin với `mask=false`:** Xem email & phone gốc không mask
- **Admin với `mask=true`:** Email & phone được mask theo thuật toán mặc định
- **Viewer:** Luôn thấy dữ liệu mask, không thể tắt `mask=false`

---

### 2. Lấy Thông Tin Người Dùng Hiện Tại

```
GET /api/users/me

Role required: Admin, Viewer, User
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",         // Dữ liệu gốc không mask
    "phone": "+84912345678",
    "password": "***",
    "role": "Admin",
    "isActive": true,
    "createdAt": "2026-03-30T10:00:00Z"
  }
}
```

**Ghi chú:** Endpoint này luôn trả về dữ liệu gốc (không mask) vì người dùng xem thông tin của chính mình.

---

### 3. Lấy Thông Tin Người Dùng Theo ID

```
GET /api/users/{id}?mask=true

Role required: Admin, Viewer, User
```

**Path Parameters:**

| Param | Type | Mô Tả |
|-------|------|-------|
| id | integer (required) | User ID cần lấy |

**Query Parameters:**

| Param | Type | Default | Mô Tả |
|-------|------|---------|-------|
| mask | boolean | true | Áp dụng masking |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 2,
    "username": "jane_smith",
    "email": "j***@example.com",        // Masked
    "phone": "0917***345",
    "password": "***",
    "role": "User",
    "isActive": true,
    "createdAt": "2026-03-30T11:00:00Z"
  }
}
```

**Quyền Hạn:**
- **Admin:** Xem bất kỳ user nào + có thể tắt mask
- **Viewer:** Xem bất kỳ user nào nhưng luôn bị mask
- **User:** Chỉ xem thông tin của chính mình, có thể tắt mask

**Error Responses:**

| Status | Lỗi | Giải pháp |
|--------|-----|----------|
| 404 | Không tìm thấy người dùng | Kiểm tra ID |
| 403 | Forbidden | User không thể xem thông tin người khác |

---

### 4. Cập Nhật Thông Tin Người Dùng

```
PUT /api/users/{id}

Role required: Admin, User
```

**Path Parameters:**

| Param | Type | Mô Tả |
|-------|------|-------|
| id | integer (required) | User ID cần cập nhật |

**Request Body:**
```json
{
  "id": 1,
  "username": "john_doe_updated",
  "email": "newemail@example.com",
  "phone": "+84912345679",
  "password": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật thành công",
  "data": ""
}
```

**Quyền Hạn:**
- **Admin:** Cập nhật bất kỳ user nào
- **User:** Chỉ cập nhật thông tin của chính mình
- **Viewer:** KHÔNG được phép cập nhật

**Validation Rules:**
- Username: Chưa được sử dụng (nếu thay đổi)
- Email: Định dạng RFC 5322 hợp lệ
- Phone: Định dạng `^[\+]?[0-9]+$` hợp lệ (10-15 ký tự)
- Password: Tối thiểu 6 ký tự

**Error Responses:**

| Status | Lỗi | Giải pháp |
|--------|-----|----------|
| 400 | Username đã tồn tại | Chọn username khác |
| 400 | Email không hợp lệ | Email format không đúng |
| 403 | Forbidden | User không thể cập nhật người khác |

---

### 5. Xóa Người Dùng

```
DELETE /api/users/{id}

Role required: Admin
```

**Path Parameters:**

| Param | Type | Mô Tả |
|-------|------|-------|
| id | integer (required) | User ID cần xóa |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Xóa người dùng thành công",
  "data": ""
}
```

**Error Responses:**

| Status | Lỗi |
|--------|-----|
| 404 | Không tìm thấy người dùng |

---

### 6. Khóa/Mở Khóa Tài Khoản

```
PATCH /api/users/{id}/active?isActive=true

Role required: Admin
```

**Path Parameters:**

| Param | Type | Mô Tả |
|-------|------|-------|
| id | integer (required) | User ID |

**Query Parameters:**

| Param | Type | Default | Mô Tả |
|-------|------|---------|-------|
| isActive | boolean | true | true = mở khóa, false = khóa |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Kích hoạt tài khoản thành công",
  "data": ""
}
```

hoặc

```json
{
  "success": true,
  "message": "Khóa tài khoản thành công",
  "data": ""
}
```

**Ghi chú:** Khi tài khoản bị khóa (`isActive=false`), user sẽ không thể đăng nhập.

---

### 7. Nâng Cấp User lên Viewer

```
PATCH /api/users/{id}/promote-to-viewer

Role required: Admin
```

**Path Parameters:**

| Param | Type | Mô Tả |
|-------|------|-------|
| id | integer (required) | User ID cần nâng cấp |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Nâng cấp lên Viewer thành công",
  "data": ""
}
```

**Quyền Hạn:**
- Chỉ nâng cấp từ role **User** (RoleId=2) lên **Viewer** (RoleId=3)
- Không thể nâng cấp user đã là Viewer hoặc Admin

**Error Responses:**

| Status | Lỗi | Giải pháp |
|--------|-----|----------|
| 400 | Chỉ có thể nâng cấp user từ role User | User không phải role User |
| 404 | Không tìm thấy người dùng | Kiểm tra ID |

---

## 🔐 ADMIN CONTROLLER (`/api/admin`)

> **⚠️ Tất cả endpoint yêu cầu Role: Admin**

### 1. Lấy Cấu Hình Masking Hiện Tại

```
GET /api/admin/masking-config

Role required: Admin
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "enabled": true,
    "algorithm": 1,                     // 1=Character Masking
    "algorithmName": "Character Masking",
    "updatedAt": "2026-03-30T10:00:00Z"
  }
}
```

---

### 2. Cập Nhật Cấu Hình Masking

```
PUT /api/admin/masking-config

Role required: Admin
```

**Request Body:**
```json
{
  "enabled": true,
  "algorithm": 2                        // 2=Data Shuffling
}
```

**Algorithm Values:**

| Giá Trị | Tên | Mô Tả |
|--------|-----|-------|
| 1 | Character Masking | Che ký tự bằng * |
| 2 | Data Shuffling | Xáo trộn vị trí ký tự |
| 3 | Data Substitution | Thay thế dữ liệu giả |
| 4 | Noise Addition | Thêm ký tự nhiễu |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cấu hình đã được cập nhật",
  "data": ""
}
```

**Error Responses:**

| Status | Lỗi |
|--------|-----|
| 400 | Invalid algorithm value |

---

### 3. Lấy Danh Sách Thuật Toán Masking

```
GET /api/admin/masking-algorithms

Role required: Admin
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Danh sách thuật toán masking",
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

---

## 🎭 MASKING CONTROLLER (`/api/masking`)

> **⚠️ Tất cả endpoint yêu cầu JWT Token (trừ `/demo`)**

### 1. Demo 4 Phương Pháp Masking

```
POST /api/masking/demo

Role required: KHÔNG (Public - AllowAnonymous)
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "phone": "0912345678"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Demo 4 phương pháp masking",
  "data": {
    "original": {
      "email": "john.doe@example.com",
      "phone": "0912345678",
      "description": null
    },
    "characterMasking": {
      "email": "j***@example.com",
      "phone": "0912***678",
      "description": "Che giấu ký tự bằng dấu *"
    },
    "dataShuffling": {
      "email": "omdoe.nj@elpmaxe.cmo",
      "phone": "8763543210",
      "description": "Xáo trộn vị trí các ký tự"
    },
    "dataSubstitution": {
      "email": "emma.wilson@example.com",
      "phone": "0987654321",
      "description": "Thay thế bằng dữ liệu giả hợp lệ"
    },
    "noiseAddition": {
      "email": "jx9*@example.c#m",
      "phone": "091234x678",
      "description": "Thêm ký tự nhiễu vào dữ liệu"
    }
  }
}
```

---

### 2. Xem User với Tất Cả Phương Pháp Masking

```
GET /api/masking/user/{id}

Role required: Admin
```

**Path Parameters:**

| Param | Type | Mô Tả |
|-------|------|-------|
| id | integer (required) | User ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "userId": 1,
    "username": "john_doe",
    "original": {
      "email": "john@example.com",
      "phone": "+84912345678",
      "description": "Dữ liệu gốc (chỉ Admin mới thấy)"
    },
    "characterMasking": {
      "email": "j***@example.com",
      "phone": "+8491234****",
      "description": "Che giấu ký tự bằng dấu *"
    },
    "dataShuffling": {
      "email": "@elpmaxe.moc@ndog.nj",
      "phone": "876543210148",
      "description": "Xáo trộn vị trí các ký tự"
    },
    "dataSubstitution": {
      "email": "emma@example.com",
      "phone": "+84987654321",
      "description": "Thay thế bằng dữ liệu giả hợp lệ"
    },
    "noiseAddition": {
      "email": "jx#@example.co$m",
      "phone": "+849123456a8",
      "description": "Thêm ký tự nhiễu vào dữ liệu"
    }
  }
}
```

---

### 3. Xem Danh Sách Users với Phương Pháp Masking Cụ Thể

```
GET /api/masking/users?method=1&skip=0&limit=10

Role required: Admin, Viewer
```

**Query Parameters:**

| Param | Type | Default | Mô Tả |
|-------|------|---------|-------|
| method | integer | 1 | 1=Character, 2=Shuffling, 3=Substitution, 4=Noise |
| skip | integer | 0 | Số bản ghi cần bỏ qua |
| limit | integer | 10 | Số bản ghi trên 1 trang |

**Method Values:**

| Giá Trị | Tên |
|--------|-----|
| 1 | CharacterMasking |
| 2 | DataShuffling |
| 3 | DataSubstitution |
| 4 | NoiseAddition |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Masking method: CharacterMasking",
  "data": {
    "total": 5,
    "skip": 0,
    "limit": 10,
    "items": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "j***@example.com",
        "phone": "0912***678",
        "password": "***",
        "role": "Admin",
        "isActive": true,
        "createdAt": "2026-03-30T10:00:00Z"
      },
      {
        "id": 2,
        "username": "jane_smith",
        "email": "j***@example.com",
        "phone": "0917***345",
        "password": "***",
        "role": "User",
        "isActive": true,
        "createdAt": "2026-03-30T11:00:00Z"
      }
    ]
  }
}
```

---

## Mã Lỗi & HTTP Status Codes

### HTTP Status Codes

| Code | Ý Nghĩa |
|------|---------|
| **200 OK** | Request thành công |
| **201 Created** | Tài nguyên được tạo thành công |
| **400 Bad Request** | Request không hợp lệ (validation error) |
| **401 Unauthorized** | Token không hợp lệ hoặc hết hạn |
| **403 Forbidden** | User không có quyền hạn |
| **404 Not Found** | Resource không tìm thấy |
| **500 Internal Server Error** | Lỗi server |

### Các Lỗi Thường Gặp

#### Authentication Errors

```json
{
  "success": false,
  "message": "Tên đăng nhập hoặc mật khẩu không đúng",
  "data": null
}
```

```json
{
  "success": false,
  "message": "Tài khoản đã bị khóa",
  "data": null
}
```

```json
{
  "success": false,
  "message": "Token hết hạn",
  "data": null
}
```

#### Validation Errors

```json
{
  "success": false,
  "message": "Username chỉ được chứa chữ, số và dấu gạch dưới",
  "data": null
}
```

```json
{
  "success": false,
  "message": "Phone chỉ được chứa số và dấu + ở đầu",
  "data": null
}
```

#### Authorization Errors

```json
{
  "success": false,
  "message": "Forbidden",
  "data": null
}
```

---

## Ví Dụ Các Luồng Sử Dụng

### Luồng 1: Đăng Ký & Đăng Nhập (User Mới)

```
1. POST /api/auth/register
   ↓ (201 Created)
   
2. POST /api/auth/login
   ↓ (200 OK) - Nhận token
   
3. GET /api/users/me (Header: Authorization Bearer {token})
   ↓ (200 OK) - Xem thông tin cá nhân
```

### Luồng 2: Admin Quản Lý Users

```
1. POST /api/auth/login (Admin account)
   ↓ (200 OK) - Nhận admin token
   
2. GET /api/users?mask=false (Xem toàn bộ data gốc)
   ↓ (200 OK) - Danh sách users không mask
   
3. GET /api/users/{id}?mask=false (Xem detail user)
   ↓ (200 OK) - Chi tiết user không mask
   
4. PUT /api/users/{id} (Cập nhật user)
   ↓ (200 OK) - User updated
   
5. PATCH /api/users/{id}/active?isActive=false (Khóa account)
   ↓ (200 OK) - Account locked
```

### Luồng 3: Admin Cấu Hình Data Masking

```
1. POST /api/auth/login (Admin account)
   ↓ (200 OK) - Nhận admin token
   
2. GET /api/admin/masking-algorithms
   ↓ (200 OK) - Xem danh sách thuật toán
   
3. PUT /api/admin/masking-config
   Body: { "enabled": true, "algorithm": 3 }
   ↓ (200 OK) - Cấu hình cập nhật
   
4. GET /api/admin/masking-config
   ↓ (200 OK) - Xác nhận cấu hình mới
```

### Luồng 4: Viewer Xem Dữ Liệu Masked

```
1. POST /api/auth/login (Viewer account)
   ↓ (200 OK) - Nhận viewer token
   
2. GET /api/users (không thể dùng mask=false)
   ↓ (200 OK) - Danh sách users luôn bị mask
   
3. GET /api/users/{id} (không thể dùng mask=false)
   ↓ (200 OK) - Chi tiết user luôn bị mask
   
4. GET /api/masking/user/{id}
   ↓ (200 OK) - Xem tất cả phương pháp masking
```

---

## JWT Token Configuration

**File:** `appsettings.json`

```json
{
  "Jwt": {
    "Key": "ThisIsASecretKeyForJwtTokenGeneration2024!",
    "Issuer": "UserManagementAPI",
    "Audience": "UserManagementClient",
    "ExpiryMinutes": 60
  }
}
```

| Config | Giá Trị | Ghi Chú |
|--------|--------|--------|
| Key | String bí mật | Dùng để ký token |
| Issuer | UserManagementAPI | Kiểm tra trong token validation |
| Audience | UserManagementClient | Kiểm tra trong token validation |
| ExpiryMinutes | 60 | Token hết hạn sau 60 phút |

---

## CORS Configuration

API cho phép tất cả origins:

```csharp
options.AddPolicy("AllowAll", policy =>
    policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
```

**Endpoint Swagger UI:** `http://localhost:5000/` (hoặc port tương ứng)

---

## Database Schema

### Users Table

```sql
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    EncryptedEmail VARBINARY(MAX),
    EncryptedPhone VARBINARY(MAX),
    EncryptedPassword VARBINARY(MAX) NOT NULL,
    Key INT NOT NULL,
    RoleId INT NOT NULL,
    RoleName NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
)
```

### Roles Table

```sql
CREATE TABLE Roles (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(50) NOT NULL,
    Description NVARCHAR(500)
)
```

**Dữ liệu mẫu:**
```sql
INSERT INTO Roles (Name, Description) VALUES
(1, 'Admin', 'Quản lý toàn bộ hệ thống'),
(2, 'User', 'Người dùng thường'),
(3, 'Viewer', 'Xem danh sách người dùng')
```

### MaskingConfig Table

```sql
CREATE TABLE MaskingConfigs (
    Id INT PRIMARY KEY IDENTITY,
    Enabled BIT DEFAULT 1,
    Algorithm INT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
)
```

---

## Security Best Practices

1. **JWT Token:**
   - Luôn gửi token qua HTTPS
   - Lưu trữ token safely trên client (localStorage không an toàn)
   - Kiểm tra expiration time

2. **Password:**
   - Mật khẩu được hash trước khi mã hóa
   - Mỗi user có key AES-128 riêng
   - Không bao giờ log password

3. **Data Masking:**
   - Email, Phone luôn được mã hóa trong database
   - Viewer role luôn nhìn thấy masked data
   - Admin có thể tắt masking nếu cần xem dữ liệu gốc

4. **API Security:**
   - CORS chỉ cho phép authorized origins (production)
   - Rate limiting nên được implement
   - SQL injection được ngăn chặn thông qua parameterized queries

---

## Troubleshooting

### Token Expired

**Lỗi:** `401: Token hết hạn`

**Giải pháp:** Gọi lại `/api/auth/login` để lấy token mới

### Username Already Exists

**Lỗi:** `400: Username đã tồn tại`

**Giải pháp:** Chọn username khác

### Invalid Email Format

**Lỗi:** `400: Email không hợp lệ`

**Giải pháp:** Email phải theo RFC 5322 (ví dụ: user@example.com)

### Forbidden Error

**Lỗi:** `403: Forbidden`

**Giải pháp:** User không có quyền hạn thực hiện action này

### User Not Found

**Lỗi:** `404: Không tìm thấy người dùng`

**Giải pháp:** Kiểm tra lại User ID

---

## Liên Hệ & Hỗ Trợ

- **API Base URL:** `http://localhost:5000` (development)
- **Swagger/OpenAPI:** `http://localhost:5000/swagger/index.html`
- **Database:** SQL Server UserManagement

---

**Tài liệu được cập nhật ngày: 30/03/2026**
