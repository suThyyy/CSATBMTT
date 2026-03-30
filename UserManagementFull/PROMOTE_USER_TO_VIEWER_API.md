# 🚀 Promote User to Viewer - API Documentation

## 📌 Overview

Endpoint mới cho phép **Admin** nâng cấp user từ role **User** lên **Viewer**.

---

## 🔌 API Endpoint

### Promote User to Viewer

```http
PATCH /api/users/{id}/promote-to-viewer
Authorization: Bearer {token}
```

**Method:** PATCH  
**Path:** `/api/users/{id}/promote-to-viewer`  
**Authentication:** Required (JWT Token)  
**Authorization:** Admin only  
**Content-Type:** application/json

---

## 📥 Request

### URL Parameters

| Parameter | Type | Required | Description              |
| --------- | :--: | :------: | ------------------------ |
| `id`      | int  |    ✅    | ID của user cần nâng cấp |

### Headers

```http
Authorization: Bearer {jwt_token}
```

### Request Body

Không cần body (POST/PATCH không có body)

---

## 📤 Response

### Success (200 OK)

```json
{
  "success": true,
  "message": "Nâng cấp lên Viewer thành công",
  "data": ""
}
```

### Error Cases

#### 1. User không tồn tại (404/400)

```json
{
  "success": false,
  "message": "Không tìm thấy người dùng",
  "data": null
}
```

#### 2. User không phải role User (400)

```json
{
  "success": false,
  "message": "Chỉ có thể nâng cấp user từ role User",
  "data": null
}
```

#### 3. Unauthorized (401)

```json
{
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}
```

#### 4. Forbidden - Not Admin (403)

```json
{
  "success": false,
  "message": "Access denied. Admin role required.",
  "data": null
}
```

---

## 💡 Use Cases

### Use Case 1: Promote Regular User to Viewer

**Scenario:** Admin muốn cho một user xem danh sách người dùng (read-only)

**Steps:**

1. Admin login → lấy token
2. Tìm user cần promote (ID = 5)
3. Gọi PATCH /api/users/5/promote-to-viewer
4. User được nâng cấp → có thể xem danh sách

**Kết quả:**

- Role User (ID: 2) → Role Viewer (ID: 3)
- User không thể edit/delete người khác
- User chỉ có thể xem (read-only)

### Use Case 2: Promote Multiple Users

**Scenario:** Nâng cấp 10 users từ User lên Viewer

```javascript
// Pseudo code
const userIds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

for (const id of userIds) {
  await fetch(`/api/users/${id}/promote-to-viewer`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

---

## ⚡ Implementation Details

### Backend Flow

```
1. Admin gửi PATCH request với {id}
   ↓
2. UsersController.PromoteToViewer(id)
   - Kiểm tra Authorization (Admin)
   - Gọi UserService.PromoteUserToViewer(id)
   ↓
3. UserService.PromoteUserToViewer(id)
   - Lấy user từ repository
   - Kiểm tra user tồn tại
   - Kiểm tra role == User (ID: 2)
   - Gọi repository.UpdateUserRole(id, 3, "Viewer")
   ↓
4. UserRepository.UpdateUserRole(id, roleId, roleName)
   - Cập nhật RoleId = 3 trong DB
   - Cập nhật UpdatedAt timestamp
   ↓
5. Trả về success response
```

### SQL Query

```sql
UPDATE Users
SET RoleId = 3,
    UpdatedAt = GETUTCDATE()
WHERE Id = @id
```

---

## 🔒 Security & Validation

### Validation Rules

1. **User tồn tại:** ✅ Kiểm tra user ID có trong DB
2. **Role validation:** ✅ Chỉ promote từ User (ID: 2)
3. **Admin only:** ✅ Chỉ Admin role mới được phép
4. **JWT token:** ✅ Yêu cầu valid token

### Security Checks

```csharp
// 1. Authorize decorator
[Authorize(Roles = "Admin")]

// 2. User validation
if (user == null)
    return Fail("Không tìm thấy người dùng");

// 3. Role validation
if (user.RoleId != 2)  // Must be User role
    return Fail("Chỉ có thể nâng cấp user từ role User");

// 4. Database update
await _userRepository.UpdateUserRole(id, 3, "Viewer");
```

---

## 🧪 Test Cases

### Test 1: Successful Promotion

```csharp
[Test]
public async Task PromoteToViewer_Success()
{
    // Arrange
    var adminToken = LoginAsAdmin();
    var userId = CreateUserWithUserRole();

    // Act
    var response = await PatchAsync(
        $"/api/users/{userId}/promote-to-viewer",
        null,
        adminToken
    );

    // Assert
    Assert.IsTrue(response.Success);
    Assert.AreEqual("Nâng cấp lên Viewer thành công", response.Message);

    // Verify role changed
    var user = GetUser(userId);
    Assert.AreEqual(3, user.RoleId);
    Assert.AreEqual("Viewer", user.RoleName);
}
```

### Test 2: Invalid User ID

```csharp
[Test]
public async Task PromoteToViewer_UserNotFound()
{
    var adminToken = LoginAsAdmin();

    var response = await PatchAsync(
        "/api/users/99999/promote-to-viewer",
        null,
        adminToken
    );

    Assert.IsFalse(response.Success);
    Assert.AreEqual("Không tìm thấy người dùng", response.Message);
}
```

### Test 3: Invalid Role

```csharp
[Test]
public async Task PromoteToViewer_NotUserRole()
{
    var adminToken = LoginAsAdmin();
    var viewerId = CreateUserWithViewerRole();

    var response = await PatchAsync(
        $"/api/users/{viewerId}/promote-to-viewer",
        null,
        adminToken
    );

    Assert.IsFalse(response.Success);
    Assert.AreEqual("Chỉ có thể nâng cấp user từ role User", response.Message);
}
```

### Test 4: Unauthorized (Not Admin)

```csharp
[Test]
public async Task PromoteToViewer_NotAdmin()
{
    var userToken = LoginAsRegularUser();
    var otherUserId = 5;

    var response = await PatchAsync(
        $"/api/users/{otherUserId}/promote-to-viewer",
        null,
        userToken
    );

    // Should return 403 Forbidden
    Assert.AreEqual(403, response.StatusCode);
}
```

---

## 📊 Role Hierarchy

```
Before Promotion:
User (Role ID: 2)
├─ Read: Own profile only
├─ Write: Own profile only
└─ Access: Limited

After Promotion:
Viewer (Role ID: 3)
├─ Read: All users (with masking)
├─ Write: None (read-only)
└─ Access: Dashboard, User list
```

---

## 🔄 Workflow Example

### Scenario: Admin promotes John (User) to Viewer

**Step 1: Admin Login**

```http
POST /api/auth/login
{
  "username": "admin",
  "password": "admin_password"
}

Response:
{
  "token": "eyJhbGci...",
  "role": "Admin",
  "expiresAt": "2024-01-15T11:30:00Z"
}
```

**Step 2: List Users**

```http
GET /api/users?mask=false
Authorization: Bearer {token}

Response:
{
  "items": [
    {
      "id": 5,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "User",  ← Current role
      "isActive": true
    }
  ]
}
```

**Step 3: Promote to Viewer**

```http
PATCH /api/users/5/promote-to-viewer
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Nâng cấp lên Viewer thành công"
}
```

**Step 4: Verify**

```http
GET /api/users/5
Authorization: Bearer {token}

Response:
{
  "id": 5,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "Viewer",  ← Updated role
  "isActive": true
}
```

---

## 🚀 API Usage Examples

### JavaScript/Fetch

```javascript
async function promoteUserToViewer(userId, adminToken) {
  const response = await fetch(
    `http://localhost:5000/api/users/${userId}/promote-to-viewer`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();
  if (data.success) {
    console.log("✅ Promotion successful");
  } else {
    console.error("❌ Error:", data.message);
  }
  return data;
}

// Usage
const result = await promoteUserToViewer(5, token);
```

### Axios

```javascript
async function promoteUserToViewer(userId, adminToken) {
  try {
    const response = await axios.patch(
      `http://localhost:5000/api/users/${userId}/promote-to-viewer`,
      {},
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error:", error.response.data.message);
    throw error;
  }
}
```

### React Hook

```javascript
const usePromoteUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const promote = async (userId, token) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}/promote-to-viewer`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { promote, loading, error };
};
```

---

## 📋 Codebase Changes Summary

### Files Modified

1. **Services/UserService.cs**
   - Added: `PromoteUserToViewer(int id)` method
   - Added to: `IUserService` interface

2. **Repositories/UserRepository.cs**
   - Added: `UpdateUserRole(int id, int roleId, string roleName)` method
   - Added to: `IUserRepository` interface

3. **Controllers/UsersController.cs**
   - Added: `PromoteToViewer(int id)` endpoint
   - Route: `PATCH /api/users/{id}/promote-to-viewer`

4. **BACKEND_DOCUMENTATION.md**
   - Added endpoint documentation
   - Updated RBAC table
   - Added test examples

---

## ✅ Checklist

- ✅ Endpoint implemented in UsersController
- ✅ Service method created with validation
- ✅ Repository method for DB update
- ✅ Error handling for edge cases
- ✅ Authorization check (Admin only)
- ✅ Documentation in BACKEND_DOCUMENTATION.md
- ✅ Test cases provided
- ✅ Code compiles without errors

---

**Status:** ✅ Ready for Testing  
**Version:** 1.0  
**Date:** 30/03/2026
