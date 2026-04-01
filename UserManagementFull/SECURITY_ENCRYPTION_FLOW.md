# 📚 SECURITY ENCRYPTION FLOW DOCUMENTATION

## 🎯 Mục Lục

1. [Tổng Quan Kiến Trúc Bảo Mật](#tổng-quan-kiến-trúc-bảo-mật)
2. [Các Thành Phần Bảo Mật](#các-thành-phần-bảo-mật)
3. [Flow Đăng Ký (Register)](#flow-đăng-ký-register)
4. [Flow Đăng Nhập (Login)](#flow-đăng-nhập-login)
5. [Flow Cập Nhật Người Dùng (Update)](#flow-cập-nhật-người-dùng-update)
6. [Flow Mã Hóa/Giải Mã](#flow-mã-hóagiải-mã)
7. [Flow Mặt Nạ Dữ Liệu (Data Masking)](#flow-mặt-nạ-dữ-liệu-data-masking)
8. [Sơ Đồ Kiến Trúc](#sơ-đồ-kiến-trúc)

---

## 🔐 Tổng Quan Kiến Trúc Bảo Mật

Hệ thống quản lý người dùng của bạn sử dụng **3 lớp bảo mật**:

```
┌─────────────────────────────────────────────────────────────┐
│                    LỚP BẢO VỆ DỮ LIỆU                       │
├─────────────────────────────────────────────────────────────┤
│ Lớp 1: HASHING (PBKDF2-SHA256)                              │
│        └─ Biến mật khẩu thành hash không thể reverse        │
│                                                              │
│ Lớp 2: ENCRYPTION (AES-128 Custom)                          │
│        └─ Mã hóa email, phone, password hash                │
│                                                              │
│ Lớp 3: USER KEY (Random 32-bit)                             │
│        └─ Mỗi user có khóa riêng để giải mã                │
│                                                              │
│ Lớp 4: DATA MASKING (4 phương pháp)                         │
│        └─ Che giấu dữ liệu khi truy vấn (Viewer role)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Các Thành Phần Bảo Mật

### 1️⃣ **Master Key**

- **Nơi lưu**: `appsettings.json` → `Jwt:Key`
- **Giá trị**: `"ThisIsASecretKeyForJwtTokenGeneration2024!"`
- **Công dụng**: Seed để sinh master key 32 bytes qua SHA256
- **Tính toán**:
  ```
  masterKey = SHA256(configKey)
  = 32 bytes (256 bits)
  ```

### 2️⃣ **User Key**

- **Sinh bằng**: `RandomNumberGenerator.GetInt32(100_000, int.MaxValue)`
- **Phạm vi**: 100,000 to 2,147,483,647
- **Công dụng**: Mỗi user có key riêng để mã hóa email, phone, password
- **Lưu ở**: Cột `Users.Key` trong database

### 3️⃣ **Derived Key** (Key cho từng user)

- **Cộng từ**: Master Key + User Key
- **Tính toán**:
  ```
  combined = masterKey (32 bytes) + userKey (4 bytes) = 36 bytes
  derivedKey = SHA256(combined) = 32 bytes
  ```
- **Công dụng**: Dùng để mã hóa AES-128

### 4️⃣ **Salt (cho Password)**

- **Sinh bằng**: `RandomNumberGenerator.GetBytes(32)`
- **Phạm vi**: Ngẫu nhiên 32 bytes
- **Công dụng**: Giúp cùng password có hash khác nhau
- **Lưu ở**: Phần đầu của `storedHash = "salt:hash"`

---

## ➡️ FLOW ĐĂNG KÝ (REGISTER)

### **Bước 1: Nhận dữ liệu từ client**

```
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+84123456789",
  "password": "MyPassword123"
}
```

### **Bước 2: Validate dữ liệu**

- ✅ Username: 3-50 ký tự, chỉ chứa a-z, 0-9, \_
- ✅ Email: Hợp lệ theo EmailAddress format
- ✅ Phone: 10-15 ký tự, chỉ chứa số và dấu +
- ✅ Password: 6-100 ký tự
- ⚠️ Kiểm tra username NOT EXIST

### **Bước 3: Hash Password**

```
Input: "MyPassword123"

Step 1: Sinh salt ngẫu nhiên
       salt = RandomNumberGenerator.GetBytes(32)
       salt = [0xA1, 0xB2, 0xC3, ...]  (32 bytes)

Step 2: Hash bằng PBKDF2-SHA256
       hash = PBKDF2(
         password: "MyPassword123".GetBytes(),
         salt: salt,
         iterations: 100_000,
         algorithm: SHA256,
         outputLength: 32
       )
       hash = [0x1F, 0x2E, 0x3D, ...]  (32 bytes)

Step 3: Kết hợp salt + hash
       storedHash = Base64(salt) + ":" + Base64(hash)
       = "oKK0zMz...XYZ:H5Jd9mK...ABC"
```

### **Bước 4: Sinh User Key**

```
userKey = RandomNumberGenerator.GetInt32(100_000, int.MaxValue)
userKey = 427653
```

### **Bước 5: Derive Key từ Master Key + User Key**

```
masterKey = SHA256("ThisIsASecret...") = 32 bytes

combined = masterKey (32 bytes) + userKey (4 bytes)
         = [0xA1...] + [int 427653] = 36 bytes

derivedKey = SHA256(combined) = 32 bytes
derivedKey = [0x5C, 0x7F, 0x2A, ...]
```

### **Bước 6: Mã hóa dữ liệu nhạy cảm**

```
// Mã hóa Email
plainEmail = "john@example.com"
encryptedEmail = AES128.EncryptData(plainEmail, derivedKey)
               = byte[] [0x8F, 0x1A, 0x4B, ...]

// Mã hóa Phone
plainPhone = "+84123456789"
encryptedPhone = AES128.EncryptData(plainPhone, derivedKey)
               = byte[] [0x3C, 0x9E, 0x7F, ...]

// Mã hóa Password Hash
plainHash = "oKK0zMz...XYZ:H5Jd9mK...ABC"
encryptedPassword = AES128.EncryptData(plainHash, derivedKey)
                  = byte[] [0x5B, 0x2D, 0x6F, ...]
```

### **Bước 7: Lưu vào Database**

```sql
INSERT INTO Users (
  Username,           -- "john_doe" (không mã hóa)
  EncryptedEmail,     -- byte[] [0x8F, 0x1A, 0x4B, ...]
  EncryptedPhone,     -- byte[] [0x3C, 0x9E, 0x7F, ...]
  EncryptedPassword,  -- byte[] [0x5B, 0x2D, 0x6F, ...]
  [Key],              -- 427653
  RoleId,             -- 2 (User)
  IsActive,           -- 1 (true)
  CreatedAt,          -- 2026-03-31T10:30:00Z
  UpdatedAt           -- 2026-03-31T10:30:00Z
)
VALUES (
  'john_doe',
  0x8F1A4B...,
  0x3C9E7F...,
  0x5B2D6F...,
  427653,
  2,
  1,
  '2026-03-31T10:30:00Z',
  '2026-03-31T10:30:00Z'
)
```

### **Bước 8: Trả response (Masked)**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "username": "john_doe",
    "email": "j***@example.com", // ← MASKED
    "phone": "+841***456789", // ← MASKED
    "password": "****", // ← HIDDEN
    "role": "User",
    "isActive": true,
    "createdAt": "2026-03-31T10:30:00Z"
  },
  "message": "Đăng ký thành công"
}
```

---

## ➡️ FLOW ĐĂNG NHẬP (LOGIN)

### **Bước 1: Nhận dữ liệu từ client**

```
POST /api/auth/login
{
  "username": "john_doe",
  "password": "MyPassword123"
}
```

### **Bước 2: Tìm user trong database**

```sql
SELECT * FROM Users
WHERE Username = 'john_doe'

Kết quả:
{
  Id: 5,
  Username: "john_doe",
  EncryptedPassword: byte[] [0x5B, 0x2D, 0x6F, ...],
  Key: 427653,
  ...
}
```

### **Bước 3: Giải mã Password Hash từ Database**

```
encryptedPassword = byte[] [0x5B, 0x2D, 0x6F, ...]
userKey = 427653

derivedKey = SHA256(masterKey + userKey) = 32 bytes

decryptedPassword = AES128.DecryptData(
  encryptedPassword,
  derivedKey
)
= "oKK0zMz...XYZ:H5Jd9mK...ABC"  (hash đã lưu)
```

### **Bước 4: Xác minh Password**

```
Input Password: "MyPassword123"
Stored Hash: "oKK0zMz...XYZ:H5Jd9mK...ABC"

Parse hash:
  salt = Base64Decode("oKK0zMz...XYZ")
  expectedHash = Base64Decode("H5Jd9mK...ABC")

Hash input password với salt đó:
  inputHash = PBKDF2(
    password: "MyPassword123".GetBytes(),
    salt: salt đã lưu,
    iterations: 100_000,
    algorithm: SHA256,
    outputLength: 32
  )

So sánh:
  inputHash == expectedHash ?
  → YES: Đăng nhập thành công ✅
  → NO:  Sai mật khẩu ❌
```

### **Bước 5: Tạo JWT Token**

```
Nếu password đúng, tạo JWT token:

payload = {
  "sub": "john_doe",
  "id": 5,
  "role": "User",
  "iat": 1711866600,
  "exp": 1711870200  (60 minutes sau)
}

token = JWT.Sign(payload, secretKey)
      = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
```

### **Bước 6: Trả response**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
    "userId": 5,
    "username": "john_doe",
    "role": "User"
  },
  "message": "Đăng nhập thành công"
}
```

---

## ➡️ FLOW CẬP NHẬT NGƯỜI DÙNG (UPDATE)

### **Bước 1: Nhận dữ liệu từ client**

```
PUT /api/users/{id}
{
  "username": "john_doe_new",
  "email": "john.new@example.com",
  "phone": "+84987654321",
  "password": "MyPassword123"
}
```

### **Bước 2: Lấy User hiện tại từ Database**

```sql
SELECT * FROM Users WHERE Id = 5
```

### **Bước 3: Giải mã Password Hash cũ**

```
encryptedPasswordOld = byte[] [0x5B, 0x2D, 0x6F, ...]
userKeyOld = 427653

decryptedPasswordOld = AES128.DecryptData(
  encryptedPasswordOld,
  SHA256(masterKey + userKeyOld)
)
= "oKK0zMz...XYZ:H5Jd9mK...ABC"
```

### **Bước 4: Kiểm tra xem Password có thay đổi không?**

```
inputPassword = "MyPassword123"
storedHash = "oKK0zMz...XYZ:H5Jd9mK...ABC"

VerifyPassword(inputPassword, storedHash):
  inputHash = PBKDF2(...)
  return inputHash == expectedHash

Kết quả: TRUE (password giống)
  → Không cần hash mới, dùng key cũ

Nếu: FALSE (password khác)
  → Cần sinh user key mới
  → Hash password mới
```

### **Bước 5: Hash Password Mới (nếu thay đổi)**

```
Giả sử password mới: "NewPassword456"

userKeyNew = RandomNumberGenerator.GetInt32(...)
           = 592841

salt = RandomNumberGenerator.GetBytes(32)

hashedPasswordNew = PBKDF2(
  password: "NewPassword456".GetBytes(),
  salt: salt,
  iterations: 100_000,
  algorithm: SHA256,
  outputLength: 32
)

storedHashNew = Base64(salt) + ":" + Base64(hashedPasswordNew)
```

### **Bước 6: Mã hóa dữ liệu mới**

```
userKeyNew = 592841
derivedKeyNew = SHA256(masterKey + userKeyNew)

encryptedEmailNew = AES128.EncryptData(
  "john.new@example.com",
  derivedKeyNew
)

encryptedPhoneNew = AES128.EncryptData(
  "+84987654321",
  derivedKeyNew
)

encryptedPasswordNew = AES128.EncryptData(
  storedHashNew,
  derivedKeyNew
)
```

### **Bước 7: Cập nhật Database**

```sql
UPDATE Users SET
  Username = 'john_doe_new',
  EncryptedEmail = 0x...,  -- byte[] mới
  EncryptedPhone = 0x...,  -- byte[] mới
  EncryptedPassword = 0x...,  -- byte[] mới
  [Key] = 592841,  -- key mới
  UpdatedAt = '2026-03-31T11:00:00Z'
WHERE Id = 5
```

---

## ➡️ FLOW MÃ HÓA/GIẢI MÃ

### **Quy Trình Mã Hóa (AES-128 Custom)**

```
┌─────────────────────────────────────────────┐
│         INPUT: "john@example.com"           │
│        + Derived Key: 32 bytes              │
└─────────────────────────────────────────────┘
                      ↓
         ┌────────────────────────┐
         │ Step 1: UTF-8 Encode   │
         │ plainText → byte array │
         │ [0x6A, 0x6F, 0x68...] │
         └────────────────────────┘
                      ↓
         ┌────────────────────────┐
         │ Step 2: PKCS#7 Padding │
         │ Pad to 16-byte block   │
         │ Length: 16 bytes       │
         └────────────────────────┘
                      ↓
         ┌────────────────────────────────────┐
         │ Step 3: Key Expansion (AES)        │
         │ 1 key → 11 round keys (10 rounds)  │
         │ RoundKey[0..10]                    │
         └────────────────────────────────────┘
                      ↓
         ┌────────────────────────────────────┐
         │ Step 4: Encrypt Block by Block     │
         │ For each 16-byte block:            │
         │   1. AddRoundKey với RoundKey[0]   │
         │   2. 9 rounds:                     │
         │      - SubBytes (S-Box)            │
         │      - ShiftRows                   │
         │      - MixColumns                  │
         │      - AddRoundKey                 │
         │   3. Final Round                   │
         │      - SubBytes, ShiftRows         │
         │      - AddRoundKey với RoundKey[10]│
         └────────────────────────────────────┘
                      ↓
         ┌────────────────────────┐
         │ Step 5: Convert to Hex │
         │ byte[] → hex string    │
         │ "8F1A4B2C..."          │
         └────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│      OUTPUT: "8F1A4B2C..." (hex string)     │
│      STORE: Convert to byte array in DB     │
└─────────────────────────────────────────────┘
```

### **Quy Trình Giải Mã (AES-128 Custom)**

```
┌────────────────────────────────────┐
│  INPUT: hex string "8F1A4B2C..."   │
│  + Derived Key: 32 bytes           │
└────────────────────────────────────┘
                 ↓
    ┌──────────────────────────┐
    │ Step 1: Hex to Byte Array│
    │ "8F1A4B..." → [0x8F...] │
    └──────────────────────────┘
                 ↓
    ┌──────────────────────────────┐
    │ Step 2: Key Expansion        │
    │ 1 key → 11 round keys        │
    └──────────────────────────────┘
                 ↓
    ┌──────────────────────────────┐
    │ Step 3: Decrypt Block        │
    │ For each block:              │
    │   1. AddRoundKey Round 10    │
    │   2. 9 reverse rounds:       │
    │      - InvShiftRows          │
    │      - InvSubBytes (Inv S-Box)
    │      - AddRoundKey           │
    │      - InvMixColumns         │
    │   3. Final InvShiftRows      │
    │      - InvSubBytes           │
    │      - AddRoundKey Round 0   │
    └──────────────────────────────┘
                 ↓
    ┌──────────────────────────────┐
    │ Step 4: Remove PKCS#7 Padding│
    │ Get original length          │
    └──────────────────────────────┘
                 ↓
    ┌──────────────────────────────┐
    │ Step 5: UTF-8 Decode        │
    │ byte[] → string             │
    └──────────────────────────────┘
                 ↓
┌────────────────────────────────────┐
│      OUTPUT: "john@example.com"    │
└────────────────────────────────────┘
```

---

## ➡️ FLOW MẶT NẠ DỮ LIỆU (DATA MASKING)

### **Khi Lấy User (GetUsers / GetUserById)**

```
┌─────────────────────────────────────────┐
│  Yêu cầu: GET /api/users?mask=true     │
│           (Role: Viewer)                │
└─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────┐
│ Step 1: Lấy User từ Database             │
│ SELECT * FROM Users WHERE ...            │
│ Kết quả:                                 │
│ {                                        │
│   EncryptedEmail: [0x8F...],            │
│   EncryptedPhone: [0x3C...],            │
│   Key: 427653                           │
│ }                                        │
└──────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────┐
│ Step 2: Giải mã                          │
│ DecryptData([0x8F...], derivedKey)      │
│ → "john@example.com"                     │
│                                          │
│ DecryptData([0x3C...], derivedKey)      │
│ → "+84123456789"                         │
└──────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────┐
│ Step 3: Kiểm tra Role + Masking Config        │
│                                                │
│ if (role == "Viewer" && maskingEnabled)      │
│   apply masking based on maskingConfig       │
│ else                                          │
│   return plaintext                           │
└────────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────┐
│ Step 4: Áp dụng Masking (4 phương pháp)         │
│                                                  │
│ Algorithm = CharacterMasking                    │
│   Email: "john@example.com" → "j***@example.com"
│   Phone: "+84123456789" → "+841***456789"       │
│                                                  │
│ Algorithm = DataShuffling                       │
│   Email: "john@example.com" → "nhjo@example.com"
│   Phone: "+84123456789" → "+843***215689"       │
│                                                  │
│ Algorithm = DataSubstitution                    │
│   Email: "john@example.com" → "sarah@outlook..."
│   Phone: "+84123456789" → "+33123456789"        │
│                                                  │
│ Algorithm = NoiseAddition                       │
│   Email: "john@example.com" → "jt@#n@exkl.com" │
│   Phone: "+84123456789" → "+8#1%3@5$789"        │
└──────────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────┐
│ Step 5: Trả Response                     │
│ {                                        │
│   id: 5,                                 │
│   username: "john_doe",                  │
│   email: "j***@example.com",  ← MASKED  │
│   phone: "+841***456789",      ← MASKED  │
│   role: "Viewer"                         │
│ }                                        │
└──────────────────────────────────────────┘
```

### **Các Phương Pháp Masking Chi Tiết**

#### **1. Character Masking (Che Giấu Ký Tự)**

```
Email:
  Input:  "john@example.com"
  Output: "j***@example.com"

  Rules: Giữ lại ký tự đầu + domain, che ký tự giữa

Phone:
  Input:  "+84123456789"
  Output: "+841***456789"

  Rules: Giữ lại 2 số đầu + dấu + + 2 số cuối, che số giữa
```

#### **2. Data Shuffling (Xáo Trộn Dữ Liệu)**

```
Email:
  Input:  "john@example.com"
  Output: "nhjo@example.com"  (local part xáo trộn)

  Rules: Xáo trộn random phần local, giữ domain

Phone:
  Input:  "+84123456789"
  Output: "+843***215689"  (số giữa xáo trộn)

  Rules: Giữ prefix + 2 đầu + 2 cuối, xáo trộn giữa
```

#### **3. Data Substitution (Thay Thế Dữ Liệu Giả)**

```
Email:
  Input:  "john@example.com"
  Output: "sarah.wilson@outlook.com"  (data giả hợp lệ)

  Rules: Dùng hash gốc làm seed chọn fake data
         Deterministic (lần sau giống nhau)

Phone:
  Input:  "+84123456789"
  Output: "+33123456789"  (fake phone hợp lệ)

  Rules: Thay country code, giữ cấu trúc
```

#### **4. Noise Addition (Thêm Nhiễu)**

```
Email:
  Input:  "john@example.com"
  Output: "jt@#n@exkl.com"  (thêm ký tự nhiễu)

  Rules: Random thêm/xóa ký tự

Phone:
  Input:  "+84123456789"
  Output: "+8#1%3@5$789"  (thêm ký tự đặc biệt)

  Rules: Thêm ký tự nhiễu giữa
```

---

## 📊 SƠ ĐỒ KIẾN TRÚC

### **Kiến Trúc Tổng Thể**

```
┌────────────────────────────────────────────────────────────┐
│                      CLIENT (Web/Mobile)                    │
└────────────────────────────────────────────────────────────┘
                             ↕️
┌────────────────────────────────────────────────────────────┐
│                   API CONTROLLER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AuthController│  │UsersController│  │MaskingController│ │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
                             ↕️
┌────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ UserService                                         │   │
│  │ └ Register, Login, GetUsers, UpdateUser, Delete    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SecurityService (Encryption/Hashing)                │   │
│  │ ├─ Encrypt() / Decrypt() → AES-128                 │   │
│  │ ├─ HashPassword() / VerifyPassword() → PBKDF2      │   │
│  │ ├─ GenerateUserKey() → Random                      │   │
│  │ └─ DeriveKey() → SHA256                            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ DataMaskingService (4 phương pháp)                  │   │
│  │ ├─ MaskEmail() / MaskPhone() → Character Masking   │   │
│  │ ├─ ShuffleEmail() / ShufflePhone() → Data Shuffle  │   │
│  │ ├─ SubstituteEmail() / SubstitutePhone() → Sub     │   │
│  │ └─ AddNoiseToEmail() / AddNoiseToPhone() → Noise   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ MaskingConfigService                                │   │
│  │ └─ GetConfig(), UpdateConfig()                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ JwtService                                          │   │
│  │ └─ GenerateToken(), ValidateToken()                │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                             ↕️
┌────────────────────────────────────────────────────────────┐
│                  REPOSITORY LAYER                           │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ UserRepository   │  │ MaskingConfigRepository      │   │
│  │ ├─ GetUsers()    │  │ ├─ GetConfig()               │   │
│  │ ├─ GetUserById() │  │ └─ UpdateConfig()            │   │
│  │ ├─ CreateUser()  │  └──────────────────────────────┘   │
│  │ ├─ UpdateUser()  │                                      │
│  │ └─ DeleteUser()  │                                      │
│  └──────────────────┘                                      │
└────────────────────────────────────────────────────────────┘
                             ↕️
┌────────────────────────────────────────────────────────────┐
│                    DATABASE (SQL Server)                    │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ Users Table      │  │ MaskingConfig Table          │   │
│  │ ├─ Id            │  │ ├─ Id                        │   │
│  │ ├─ Username      │  │ ├─ Enabled                   │   │
│  │ ├─ EncryptedEmail│  │ ├─ Algorithm                 │   │
│  │ ├─ EncryptedPhone│  │ └─ UpdatedAt                 │   │
│  │ ├─ EncryptedPwd  │  └──────────────────────────────┘   │
│  │ ├─ Key           │  ┌──────────────────────────────┐   │
│  │ ├─ RoleId        │  │ Roles Table                  │   │
│  │ └─ IsActive      │  │ ├─ Id                        │   │
│  └──────────────────┘  │ ├─ Name (Admin/User/Viewer)  │   │
│                        │ └─ Description               │   │
│                        └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### **Flow Tích Hợp: Register → Login → Retrieve**

```
                        REGISTER
┌─────────────────────────────────────────────┐
│ 1. Client gửi: username, email, phone, pwd  │
│ 2. AuthController.Register()                │
│ 3. UserService.Register():                  │
│    ├─ GenerateUserKey()                     │
│    ├─ HashPassword(pwd) → PBKDF2           │
│    ├─ DeriveKey(userKey) → SHA256          │
│    ├─ Encrypt(email, key) → AES-128        │
│    ├─ Encrypt(phone, key) → AES-128        │
│    └─ Encrypt(passwordHash, key) → AES-128│
│ 4. UserRepository.CreateUser() → DB        │
│ 5. Response trả về (masked)                │
└─────────────────────────────────────────────┘
                         ↓
                        LOGIN
┌─────────────────────────────────────────────┐
│ 1. Client gửi: username, password           │
│ 2. AuthController.Login()                   │
│ 3. UserService.Login():                     │
│    ├─ GetUserByUsername()                   │
│    ├─ DeriveKey(userKey)                    │
│    ├─ Decrypt(encryptedPwd, key) → hash    │
│    ├─ VerifyPassword(inputPwd, hash)       │
│    └─ JwtService.GenerateToken()           │
│ 4. Response trả về JWT token               │
└─────────────────────────────────────────────┘
                         ↓
                      RETRIEVE
┌──────────────────────────────────────────────────┐
│ 1. Client gửi: JWT token, ?mask=true           │
│ 2. UsersController.GetUsers()                  │
│ 3. UserService.GetUsers():                     │
│    ├─ GetUsers() từ DB                        │
│    ├─ For each user:                          │
│    │  ├─ DeriveKey(userKey)                   │
│    │  ├─ Decrypt(email, key)                  │
│    │  ├─ Decrypt(phone, key)                  │
│    │  └─ Apply Masking nếu mask=true          │
│    │     (dựa trên maskingConfig + role)       │
│ 4. Response trả về (masked/unmasked)          │
└──────────────────────────────────────────────────┘
```

---

## 🔒 Bảng So Sánh: Data Trong Database vs Response

### **Dữ Liệu Trong Database:**

```
Users Table:
┌────┬────────────┬──────────────┬──────────────┬─────────────────┬─────┬────────┐
│ Id │ Username   │EncryptedEmail│EncryptedPhone│EncryptedPassword│ Key │RoleId │
├────┼────────────┼──────────────┼──────────────┼─────────────────┼─────┼────────┤
│ 5  │john_doe    │ 0x8F1A4B2C.. │ 0x3C9E7F1D.. │ 0x5B2D6F9A..    │42765│   2    │
└────┴────────────┴──────────────┴──────────────┴─────────────────┴─────┴────────┘

Lưu ý:
- Username: Plaintext (cần để tìm kiếm)
- Email, Phone, Password: Mã hóa AES-128
- Key: Sinh ngẫu nhiên dùng để decrypt
```

### **Response sau Decrypt (Role = Admin)**

```json
{
  "id": 5,
  "username": "john_doe",
  "email": "john@example.com", // ← Giải mã
  "phone": "+84123456789", // ← Giải mã
  "password": "oKK0zMz...XYZ:...", // ← Giải mã (hash)
  "role": "Admin",
  "isActive": true
}
```

### **Response sau Decrypt + Masking (Role = Viewer)**

```json
{
  "id": 5,
  "username": "john_doe",
  "email": "j***@example.com", // ← Masked
  "phone": "+841***456789", // ← Masked
  "password": "****", // ← Hidden
  "role": "Viewer",
  "isActive": true
}
```

---

## 🎓 Tóm Tắt Luồng Bảo Mật

| Bước | Hành Động        | Thuật Toán    | Input             | Output      |
| ---- | ---------------- | ------------- | ----------------- | ----------- |
| 1    | Hash Password    | PBKDF2-SHA256 | "MyPassword123"   | "salt:hash" |
| 2    | Sinh User Key    | Random        | None              | 427653      |
| 3    | Derive Key       | SHA256        | Master + User Key | 32 bytes    |
| 4    | Encrypt Email    | AES-128       | Email + Key       | byte[]      |
| 5    | Encrypt Phone    | AES-128       | Phone + Key       | byte[]      |
| 6    | Encrypt Password | AES-128       | Hash + Key        | byte[]      |
| 7    | Lưu Database     | SQL Insert    | Encrypted data    | OK          |
| 8    | Login: Decrypt   | AES-128       | Encrypted + Key   | "salt:hash" |
| 9    | Login: Verify    | PBKDF2        | Input pwd + hash  | true/false  |
| 10   | Retrieve: Mask   | Masking       | Data + Config     | Masked data |

---

## 📝 Ghi Chú Quan Trọng

1. **Master Key**: Lấy từ `appsettings.json` - Bảo mật tuyệt đối!
2. **User Key**: Sinh ngẫu nhiên - Mỗi user có key riêng
3. **Derived Key**: Kết hợp Master Key + User Key
4. **PBKDF2**: 100,000 iterations - Chống brute force
5. **Data Masking**: Chỉ áp dụng cho Role = Viewer
6. **AES-128**: Custom implementation - Không dùng built-in library
7. **Salt**: Ngẫu nhiên 32 bytes - Giữ cùng password, hash khác nhau

---

## 🔍 Diagram UML - Luồng Dữ Liệu

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                          │
│              (Register / Login / Update)                    │
└────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │ VALIDATION    │
                    └───────────────┘
                            ↓
            ┌───────────────────────────────┐
            │   GENERATE / VERIFY PASSWORD   │
            │                               │
            │  ├─ PBKDF2-SHA256 Hash       │
            │  ├─ Salt (32 bytes)          │
            │  └─ Iterations (100,000)     │
            └───────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │   DERIVE ENCRYPTION KEY       │
            │                               │
            │  ├─ Master Key (from config) │
            │  ├─ User Key (random)        │
            │  └─ Derived Key (SHA256)     │
            └───────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │   ENCRYPT SENSITIVE DATA      │
            │                               │
            │  ├─ Email (AES-128)          │
            │  ├─ Phone (AES-128)          │
            │  └─ Password Hash (AES-128)  │
            └───────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │   SAVE TO DATABASE            │
            │                               │
            │  ├─ Encrypted Email/Phone    │
            │  ├─ User Key                 │
            │  └─ Role & Status            │
            └───────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │   DECRYPT ON RETRIEVE         │
            │                               │
            │  ├─ Load from DB              │
            │  ├─ Get User Key              │
            │  └─ Decrypt Data (AES-128)   │
            └───────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │   APPLY DATA MASKING          │
            │                               │
            │  ├─ Check Role                │
            │  ├─ Check Config              │
            │  └─ Apply Algorithm (4 types)│
            └───────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │   RETURN RESPONSE             │
            │                               │
            │  ├─ Masked/Unmasked Data      │
            │  ├─ JWT Token (if login)      │
            │  └─ Status Message            │
            └───────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                    CLIENT RESPONSE                         │
└────────────────────────────────────────────────────────────┘
```

---

## 📚 Các File Liên Quan

```
SecurityService.cs
├─ Encrypt() / Decrypt() - AES-128
├─ HashPassword() - PBKDF2
├─ VerifyPassword() - PBKDF2
├─ GenerateUserKey() - Random
└─ DeriveKey() - SHA256

Aes128Engine.cs
├─ EncryptData() - AES-128 custom
├─ DecryptData() - AES-128 custom
├─ KeyExpansion() - AES key scheduling
├─ EncryptBlock() - 10 rounds
└─ DecryptBlock() - Inverse rounds

DataMaskingService.cs
├─ MaskEmail() / MaskPhone() - Character Masking
├─ ShuffleEmail() / ShufflePhone() - Data Shuffling
├─ SubstituteEmail() / SubstitutePhone() - Substitution
└─ AddNoiseToEmail() / AddNoiseToPhone() - Noise Addition

UserService.cs
├─ Register() - Đăng ký
├─ Login() - Đăng nhập
├─ GetUsers() - Lấy danh sách
├─ GetUserById() - Lấy chi tiết
└─ UpdateUser() - Cập nhật

UserRepository.cs
├─ CreateUser() - INSERT
├─ GetUserById() - SELECT
├─ GetUsers() - SELECT với pagination
├─ UpdateUser() - UPDATE
└─ DeleteUser() - DELETE
```

---

**Tài liệu này cung cấp cái nhìn toàn diện về quy trình bảo mật, mã hóa và mặt nạ dữ liệu trong project User Management của bạn!** 🛡️
