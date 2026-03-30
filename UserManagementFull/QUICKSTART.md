# 📋 QUICK START - Admin-Configurable Masking

## 🎯 Tính Năng Hoàn Thành

**Yêu cầu:** Admin chọn thuật toán masking cho Viewer users

**Status:** ✅ **HOÀN THÀNH & SẴN DÙNG**

---

## 🚀 Bắt Đầu Nhanh (5 Phút)

### 1️⃣ Tạo Database Table

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

### 2️⃣ Rebuild & Run

```bash
dotnet build
dotnet run
```

### 3️⃣ Test Admin API (Swagger)

Open: `http://localhost:5000/swagger`

**Test 1 - Get Current Config:**

```
GET /api/admin/masking-config
```

**Test 2 - Change Algorithm to Data Shuffling:**

```
PUT /api/admin/masking-config
Body: {
  "enabled": true,
  "algorithm": 2
}
```

**Test 3 - Viewer Sees Masked Data:**

```
GET /api/users
(as Viewer user)
→ Email/Phone will be shuffled
```

---

## 📱 API Endpoints

### Admin Only (3 endpoints)

| Method | Endpoint                        | Purpose            |
| ------ | ------------------------------- | ------------------ |
| `GET`  | `/api/admin/masking-config`     | Get current config |
| `PUT`  | `/api/admin/masking-config`     | Update config      |
| `GET`  | `/api/admin/masking-algorithms` | List algorithms    |

### Algorithms (4 available)

```
1 = Character Masking      (j***@example.com)
2 = Data Shuffling         (nhjo@example.moc)
3 = Data Substitution      (alice@example.com)
4 = Noise Addition         (jo@h_n@example.com)
```

---

## 💡 How It Works

```
┌──────────────┐
│ Admin Sets   │
│ Algorithm=2  │
└────────┬─────┘
         ↓
   ┌─────────────┐
   │   Database  │
   │   Config    │
   └────────┬────┘
            ↓
    ┌───────────────┐
    │ Viewer Calls  │
    │ GET /users    │
    └───────┬───────┘
            ↓
    ┌───────────────────────┐
    │ UsersController Checks│
    │ GetConfig() → Shuffle │
    └───────┬───────────────┘
            ↓
    ┌───────────────────┐
    │ Return Shuffled   │
    │ Email & Phone     │
    └───────────────────┘
```

---

## 📊 File Changes Summary

| Component                      | Change                                                     |
| ------------------------------ | ---------------------------------------------------------- |
| **Models.cs**                  | ✅ Added MaskingAlgorithm enum, MaskingConfig entity, DTOs |
| **MaskingConfigRepository.cs** | ✅ NEW - Database access                                   |
| **MaskingConfigService.cs**    | ✅ NEW - Business logic                                    |
| **AdminController.cs**         | ✅ NEW - API endpoints                                     |
| **UsersController.cs**         | ✅ UPDATED - Apply masking config                          |
| **Program.cs**                 | ✅ UPDATED - DI registration                               |
| **UserManagement.sql**         | ✅ UPDATED - New table                                     |
| **Documentation**              | ✅ 3 new doc files                                         |

---

## 🧪 Quick Test

### Step 1: Admin Login

```bash
POST http://localhost:5000/api/auth/login
{
  "username": "admin",
  "password": "AdminPass123"
}
```

Save the `token` from response.

### Step 2: Get List of Algorithms

```bash
GET http://localhost:5000/api/admin/masking-algorithms
Authorization: Bearer {token}
```

Response shows all 4 algorithms.

### Step 3: Set to Data Shuffling (Algorithm 2)

```bash
PUT http://localhost:5000/api/admin/masking-config
Authorization: Bearer {token}
Content-Type: application/json

{
  "enabled": true,
  "algorithm": 2
}
```

### Step 4: Viewer Login

```bash
POST http://localhost:5000/api/auth/login
{
  "username": "viewer",
  "password": "ViewerPass123"
}
```

Save the viewer `token`.

### Step 5: Viewer Gets Users

```bash
GET http://localhost:5000/api/users
Authorization: Bearer {viewer_token}
```

**Result:** Emails and phones are SHUFFLED! ✅

---

## 🔐 Security Features

✅ **Admin Control:**

- Only Admin can change config
- Endpoints require `[Authorize(Roles = "Admin")]`

✅ **Viewer Cannot Bypass:**

- `mask=false` parameter ignored for Viewer
- Always sees masked data per config

✅ **Instant Changes:**

- Changes apply immediately
- All future requests use new config

✅ **Database Persistence:**

- Config saved to database
- Survives app restart

---

## 🎨 Algorithm Examples

### Input

```
Email:  john@example.com
Phone:  +84901234567
```

### Character Masking

```
Email:  j***@example.com
Phone:  +84***4567
```

### Data Shuffling

```
Email:  nhjo@example.moc     (shuffled)
Phone:  +84413256709         (shuffled)
```

### Data Substitution

```
Email:  alice@example.com    (replaced)
Phone:  +84876543210         (replaced)
```

### Noise Addition

```
Email:  jo@h_n@example.com   (with noise)
Phone:  +849X0Y1Z2_3W4V5     (with noise)
```

---

## 📁 Documentation Files

| File                               | Content                        |
| ---------------------------------- | ------------------------------ |
| `BACKEND_DOCUMENTATION.md`         | Complete API docs (updated)    |
| `MASKING_CONFIG_FEATURE.md`        | Feature details & architecture |
| `MASKING_CONFIG_IMPLEMENTATION.md` | Implementation summary         |
| `MASKING_CONFIG_TESTS.md`          | Test cases & examples          |

---

## ⚡ Common Tasks

### Change Algorithm at Runtime

```bash
PUT /api/admin/masking-config
{"enabled": true, "algorithm": 3}
```

Immediately all Viewers see substituted data.

### Disable Masking Temporarily

```bash
PUT /api/admin/masking-config
{"enabled": false, "algorithm": 1}
```

Viewers see full email/phone.

### Admin Views Full Data

```bash
GET /api/users?mask=false
Authorization: Bearer {admin_token}
```

Admin only - Viewer cannot use this.

### Check Current Config

```bash
GET /api/admin/masking-config
Authorization: Bearer {admin_token}
```

Returns current enabled status and algorithm.

---

## 🐛 Troubleshooting

| Problem                         | Solution                             |
| ------------------------------- | ------------------------------------ |
| 403 Forbidden on Admin endpoint | Use Admin token, not Viewer          |
| 401 Unauthorized                | Include Authorization header         |
| Data not masked                 | Check config is enabled=true         |
| Same data always                | Config might not be saved - check DB |
| Invalid Algorithm error         | Use values 1-4 only                  |

---

## ✨ Key Features

✅ Admin sets algorithm for all Viewers at once  
✅ Viewer always sees masked data (cannot bypass)  
✅ Changes take effect immediately  
✅ Database persists configuration  
✅ 4 different masking algorithms  
✅ Full RBAC with role-based access  
✅ Comprehensive error handling  
✅ Swagger documentation included

---

## 📞 Need Help?

1. **Check Swagger:** http://localhost:5000/swagger
2. **Read MASKING_CONFIG_FEATURE.md** for architecture
3. **See MASKING_CONFIG_TESTS.md** for test examples
4. **Review BACKEND_DOCUMENTATION.md** for API details

---

## 🎉 You're Ready!

Your User Management System now has:

✅ **Custom AES-128 Encryption**  
✅ **Role-Based Access Control** (Admin/Viewer/User)  
✅ **Role Promotion API** (User → Viewer)  
✅ **Admin-Configurable Data Masking** ← NEW!

**Next Steps:**

1. Run `dotnet build`
2. Execute SQL script to create MaskingConfig table
3. Run `dotnet run`
4. Test endpoints in Swagger
5. Deploy to production!

🚀 **Production Ready!**
