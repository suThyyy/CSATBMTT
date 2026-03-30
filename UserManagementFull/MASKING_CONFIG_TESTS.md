# 🧪 Admin Masking Configuration - Test Cases & Examples

## 📋 Test Scenarios

### Scenario 1: Admin Sets Masking to Character Masking

**Goal:** Admin selects Character Masking algorithm for all Viewers

**Steps:**

1. **Admin logs in and gets token**

   ```bash
   POST /api/auth/login
   {
     "username": "admin",
     "password": "AdminPass123"
   }
   Response: { "token": "eyJhbGc..." }
   ```

2. **Admin checks current config**

   ```bash
   GET /api/admin/masking-config
   Authorization: Bearer {admin_token}
   ```

   Response:

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

3. **Admin views available algorithms**

   ```bash
   GET /api/admin/masking-algorithms
   Authorization: Bearer {admin_token}
   ```

   Response:

   ```json
   {
     "success": true,
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
         "description": "Thay thế bằng dữ liệu giả"
       },
       {
         "id": 4,
         "name": "Noise Addition",
         "description": "Thêm ký tự nhiễu"
       }
     ]
   }
   ```

4. **Admin keeps current config (Character Masking = algorithm 1)**

   ```bash
   PUT /api/admin/masking-config
   Authorization: Bearer {admin_token}
   Content-Type: application/json

   {
     "enabled": true,
     "algorithm": 1
   }
   ```

   Response:

   ```json
   {
     "success": true,
     "message": "Cập nhật cấu hình masking thành Character Masking"
   }
   ```

---

### Scenario 2: Viewer Requests Users and Sees Masked Data

**Goal:** Verify Viewer sees data masked with Character Masking

**Steps:**

1. **Viewer logs in**

   ```bash
   POST /api/auth/login
   {
     "username": "viewer_user",
     "password": "ViewerPass123"
   }
   Response: { "token": "eyJhbGc..." }
   ```

2. **Viewer requests user list**

   ```bash
   GET /api/users?skip=0&limit=10
   Authorization: Bearer {viewer_token}
   ```

   Response:

   ```json
   {
     "success": true,
     "message": "Lấy danh sách người dùng thành công",
     "data": {
       "total": 3,
       "skip": 0,
       "limit": 10,
       "items": [
         {
           "id": 1,
           "username": "admin",
           "email": "a***@example.com", // ← Masked with Character Masking
           "phone": "+84***4567", // ← Masked with Character Masking
           "role": "Admin",
           "isActive": true,
           "createdAt": "2024-01-15T09:00:00Z"
         },
         {
           "id": 2,
           "username": "john",
           "email": "j***@example.com", // ← Masked
           "phone": "+84***1234", // ← Masked
           "role": "User",
           "isActive": true,
           "createdAt": "2024-01-15T09:05:00Z"
         },
         {
           "id": 3,
           "username": "alice",
           "email": "a***@example.com", // ← Masked
           "phone": "+84***5678", // ← Masked
           "role": "User",
           "isActive": true,
           "createdAt": "2024-01-15T09:10:00Z"
         }
       ]
     }
   }
   ```

3. **Viewer tries to disable masking (should NOT work)**

   ```bash
   GET /api/users?mask=false&skip=0&limit=10
   Authorization: Bearer {viewer_token}
   ```

   Response: Still masked! (Viewer cannot disable masking)

   ```json
   {
     "data": {
       "items": [
         {
           "email": "a***@example.com", // Still masked!
           "phone": "+84***4567" // Still masked!
         }
       ]
     }
   }
   ```

---

### Scenario 3: Admin Changes to Data Shuffling

**Goal:** Admin changes algorithm to Data Shuffling

**Steps:**

1. **Admin updates config to Data Shuffling (algorithm 2)**

   ```bash
   PUT /api/admin/masking-config
   Authorization: Bearer {admin_token}
   Content-Type: application/json

   {
     "enabled": true,
     "algorithm": 2
   }
   ```

   Response:

   ```json
   {
     "success": true,
     "message": "Cập nhật cấu hình masking thành Data Shuffling"
   }
   ```

2. **Verify config was updated**

   ```bash
   GET /api/admin/masking-config
   Authorization: Bearer {admin_token}
   ```

   Response:

   ```json
   {
     "success": true,
     "data": {
       "enabled": true,
       "algorithm": 2,
       "algorithmName": "Data Shuffling",
       "updatedAt": "2024-01-15T10:45:00Z"
     }
   }
   ```

3. **Viewer requests users again - NOW SEES SHUFFLED DATA**

   ```bash
   GET /api/users?skip=0&limit=10
   Authorization: Bearer {viewer_token}
   ```

   Response:

   ```json
   {
     "success": true,
     "data": {
       "items": [
         {
           "id": 1,
           "username": "admin",
           "email": "mlaxep@example.moc", // ← Now shuffled!
           "phone": "+84134765209", // ← Now shuffled!
           "role": "Admin"
         },
         {
           "id": 2,
           "username": "john",
           "email": "nhjo@example.moc", // ← Now shuffled!
           "phone": "+84412356789", // ← Now shuffled!
           "role": "User"
         },
         {
           "id": 3,
           "username": "alice",
           "email": "calie@example.moc", // ← Now shuffled!
           "phone": "+84876543210", // ← Now shuffled!
           "role": "User"
         }
       ]
     }
   }
   ```

---

### Scenario 4: Admin Disables Masking Completely

**Goal:** Admin turns off masking - Viewer should see full data

**Steps:**

1. **Admin disables masking**

   ```bash
   PUT /api/admin/masking-config
   Authorization: Bearer {admin_token}
   Content-Type: application/json

   {
     "enabled": false,
     "algorithm": 2
   }
   ```

   Response:

   ```json
   {
     "success": true,
     "message": "Tắt masking cho Viewer"
   }
   ```

2. **Viewer requests users - SEES FULL DATA**

   ```bash
   GET /api/users
   Authorization: Bearer {viewer_token}
   ```

   Response:

   ```json
   {
     "success": true,
     "data": {
       "items": [
         {
           "id": 1,
           "username": "admin",
           "email": "admin@example.com", // ← Full email!
           "phone": "+84901234567", // ← Full phone!
           "role": "Admin"
         },
         {
           "id": 2,
           "username": "john",
           "email": "john@example.com", // ← Full email!
           "phone": "+84901234567", // ← Full phone!
           "role": "User"
         }
       ]
     }
   }
   ```

---

### Scenario 5: Admin Can Toggle Masking Visibility

**Goal:** Admin can use mask=false to see full data

**Steps:**

1. **Config is: enabled=true, algorithm=2 (Data Shuffling)**

2. **Admin requests with mask=false**

   ```bash
   GET /api/users?mask=false
   Authorization: Bearer {admin_token}
   ```

   Response:

   ```json
   {
     "success": true,
     "data": {
       "items": [
         {
           "id": 1,
           "username": "admin",
           "email": "admin@example.com", // Full data (mask=false)
           "phone": "+84901234567" // Full data
         }
       ]
     }
   }
   ```

3. **Admin requests with mask=true (default)**

   ```bash
   GET /api/users?mask=true
   Authorization: Bearer {admin_token}
   ```

   Response:

   ```json
   {
     "success": true,
     "data": {
       "items": [
         {
           "id": 1,
           "username": "admin",
           "email": "mlaxep@example.moc", // Shuffled (as per config)
           "phone": "+84134765209" // Shuffled
         }
       ]
     }
   }
   ```

---

### Scenario 6: Get Individual User with Masking Config

**Goal:** Test GetUserById with masking config applied

**Steps:**

1. **Admin gets specific user WITHOUT masking**

   ```bash
   GET /api/users/2?mask=false
   Authorization: Bearer {admin_token}
   ```

   Response:

   ```json
   {
     "success": true,
     "data": {
       "id": 2,
       "username": "john",
       "email": "john@example.com", // Full
       "phone": "+84901234567", // Full
       "role": "User"
     }
   }
   ```

2. **Viewer gets specific user WITH masking**

   ```bash
   GET /api/users/2
   Authorization: Bearer {viewer_token}
   ```

   Response:

   ```json
   {
     "success": true,
     "data": {
       "id": 2,
       "username": "john",
       "email": "nhjo@example.moc", // Shuffled (current config)
       "phone": "+84412356789", // Shuffled
       "role": "User"
     }
   }
   ```

---

## 🔄 Complete User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ DAY 1: Admin Sets Initial Masking                           │
└─────────────────────────────────────────────────────────────┘

1. Admin Login
   └─ Gets JWT token for Admin role

2. Admin Checks Current Config
   GET /api/admin/masking-config
   └─ Response: algorithm=1 (Character Masking)

3. Admin Updates to Shuffling
   PUT /api/admin/masking-config
   Body: { "enabled": true, "algorithm": 2 }
   └─ Updated successfully

┌─────────────────────────────────────────────────────────────┐
│ DAY 2: Viewer Logs In and Accesses System                   │
└─────────────────────────────────────────────────────────────┘

1. Viewer Login
   └─ Gets JWT token for Viewer role

2. Viewer Requests User List
   GET /api/users
   └─ Email/Phone are SHUFFLED (per Admin's config)

3. Viewer Tries to Disable Masking
   GET /api/users?mask=false
   └─ STILL SHUFFLED (Viewer cannot bypass masking)

4. Viewer Gets Specific User
   GET /api/users/2
   └─ Email/Phone are SHUFFLED

┌─────────────────────────────────────────────────────────────┐
│ DAY 3: Admin Changes Strategy                               │
└─────────────────────────────────────────────────────────────┘

1. Admin Updates Config
   PUT /api/admin/masking-config
   Body: { "enabled": true, "algorithm": 4 }
   └─ Changed to Noise Addition (algorithm 4)

2. Viewer Requests Users Again
   GET /api/users
   └─ Email/Phone now show NOISE ADDITION (new algorithm)

3. Viewer Can't Override
   GET /api/users?mask=false
   └─ Still masked with Noise Addition

┌─────────────────────────────────────────────────────────────┐
│ DAY 4: Admin Disables Masking for Audit                     │
└─────────────────────────────────────────────────────────────┘

1. Admin Turns Off Masking
   PUT /api/admin/masking-config
   Body: { "enabled": false, "algorithm": 4 }
   └─ Masking disabled

2. Viewer Sees Full Data
   GET /api/users
   └─ Email/Phone are UNMASKED

3. Audit Complete, Admin Re-enables
   PUT /api/admin/masking-config
   Body: { "enabled": true, "algorithm": 2 }
   └─ Back to Data Shuffling
```

---

## ⚠️ Error Cases

### Error 1: Invalid Algorithm

```bash
PUT /api/admin/masking-config
{
  "enabled": true,
  "algorithm": 99  // Invalid!
}
```

Response:

```json
{
  "success": false,
  "message": "Thuật toán masking không hợp lệ",
  "data": null
}
```

### Error 2: Enabled but No Algorithm

```bash
PUT /api/admin/masking-config
{
  "enabled": true,
  "algorithm": 0  // None!
}
```

Response:

```json
{
  "success": false,
  "message": "Nếu bật mask, phải chọn thuật toán",
  "data": null
}
```

### Error 3: Viewer Tries to Update Config (Forbidden)

```bash
PUT /api/admin/masking-config
Authorization: Bearer {viewer_token}  // Viewer token!
{
  "enabled": false,
  "algorithm": 1
}
```

Response:

```
403 Forbidden
```

### Error 4: Non-Authenticated User (No Token)

```bash
GET /api/admin/masking-config
// No Authorization header
```

Response:

```
401 Unauthorized
```

---

## 📊 Masking Output Examples

### Original Data

```
Email: john.smith@corporatemail.com
Phone: +84 (901) 234-5678
```

### After Character Masking (Algorithm 1)

```
Email: j***@corporatemail.com
Phone: +84***5678
```

### After Data Shuffling (Algorithm 2)

```
Email: moc.liameltroproc@htimsj.nho  (letters shuffled)
Phone: 8765432109+84  (digits shuffled)
```

### After Data Substitution (Algorithm 3)

```
Email: alice.johnson@example.com  (different data, valid format)
Phone: +86 (852) 963-7410  (different data, valid format)
```

### After Noise Addition (Algorithm 4)

```
Email: j#oh@n.s$mith@corporatemail.com  (with noise chars)
Phone: +8X4 (9@0Y1) Z23#4-56_78  (with noise chars)
```

---

## ✅ Test Checklist

- [ ] Admin can GET masking config
- [ ] Admin can GET list of available algorithms
- [ ] Admin can PUT to change algorithm
- [ ] Config persists in database
- [ ] Viewer sees masked data immediately after config change
- [ ] Viewer cannot bypass masking with mask=false
- [ ] Admin can see full data with mask=false
- [ ] Admin can see masked data with mask=true
- [ ] Individual user endpoint respects config
- [ ] All algorithms apply correctly
- [ ] Database table created with default seed
- [ ] Error handling for invalid algorithm
- [ ] 403 Forbidden for non-Admin users
- [ ] 401 Unauthorized for no token
- [ ] Configuration change doesn't affect other features

---

## 🚀 Running Tests

1. **Setup Database**

   ```sql
   CREATE TABLE MaskingConfig (
       Id INT IDENTITY(1,1) PRIMARY KEY,
       Enabled BIT NOT NULL DEFAULT 1,
       Algorithm INT NOT NULL DEFAULT 1,
       CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
       UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
   );

   INSERT INTO MaskingConfig (Enabled, Algorithm) VALUES (1, 1);
   ```

2. **Start Application**

   ```bash
   dotnet run
   ```

3. **Open Swagger**

   ```
   http://localhost:5000/swagger
   ```

4. **Run test scenarios above**
   - Use Swagger UI to execute requests
   - Or use curl/Postman with provided examples

5. **Verify Results**
   - Check database records
   - Verify masked data format
   - Confirm role-based access control
