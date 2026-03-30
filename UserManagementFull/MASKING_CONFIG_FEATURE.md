# 🔐 Admin-Configurable Data Masking Feature

## 📋 Tổng Quan

Tính năng này cho phép **Admin** cấu hình và kiểm soát thuật toán masking dữ liệu cho tất cả **Viewer** users. Thay vì sử dụng một thuật toán cố định, Viewer sẽ xem dữ liệu được mask theo lựa chọn của Admin.

---

## 🎯 Mục Đích

1. **Bảo mật dữ liệu:** Admin có thể bật/tắt masking toàn hệ thống
2. **Linh hoạt:** Admin chọn thuật toán phù hợp với yêu cầu bảo mật
3. **Quản lý tập trung:** Một cấu hình cho tất cả Viewer users
4. **Kiểm soát:** Viewer không thể thay đổi cấu hình masking

---

## 🏗️ Kiến Trúc Thực Hiện

### Database Schema

```sql
CREATE TABLE MaskingConfig (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Enabled BIT NOT NULL DEFAULT 1,
    Algorithm INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

**Cột:**

- `Id`: Khóa chính (luôn có 1 record cấu hình)
- `Enabled`: true = bật masking, false = tắt masking
- `Algorithm`:
  - 1 = Character Masking (Che giấu ký tự)
  - 2 = Data Shuffling (Xáo trộn)
  - 3 = Data Substitution (Thay thế)
  - 4 = Noise Addition (Thêm nhiễu)
- `CreatedAt`: Thời gian tạo
- `UpdatedAt`: Thời gian cập nhật

### Các Lớp Thực Hiện

#### 1. Repository Layer - `MaskingConfigRepository.cs`

```csharp
public interface IMaskingConfigRepository
{
    Task<MaskingConfig?> GetConfig();
    Task UpdateConfig(bool enabled, MaskingAlgorithm algorithm);
}

public class MaskingConfigRepository : IMaskingConfigRepository
{
    private readonly string _connectionString;

    // Lấy cấu hình hiện tại (record mới nhất)
    public async Task<MaskingConfig?> GetConfig()
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT TOP 1 Id, Enabled, Algorithm, CreatedAt, UpdatedAt FROM MaskingConfig ORDER BY Id DESC";

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new MaskingConfig
            {
                Id = reader.GetInt32(0),
                Enabled = reader.GetBoolean(1),
                Algorithm = (MaskingAlgorithm)reader.GetInt32(2),
                CreatedAt = reader.GetDateTime(3),
                UpdatedAt = reader.GetDateTime(4)
            };
        }
        return null;
    }

    // Cập nhật cấu hình (insert hoặc update)
    public async Task UpdateConfig(bool enabled, MaskingAlgorithm algorithm)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            IF EXISTS (SELECT 1 FROM MaskingConfig)
                UPDATE MaskingConfig SET Enabled = @enabled, Algorithm = @algorithm, UpdatedAt = GETUTCDATE()
            ELSE
                INSERT INTO MaskingConfig (Enabled, Algorithm, CreatedAt, UpdatedAt)
                VALUES (@enabled, @algorithm, GETUTCDATE(), GETUTCDATE())
        ";

        command.Parameters.AddWithValue("@enabled", enabled);
        command.Parameters.AddWithValue("@algorithm", (int)algorithm);

        await command.ExecuteNonQueryAsync();
    }
}
```

#### 2. Service Layer - `MaskingConfigService.cs`

```csharp
public interface IMaskingConfigService
{
    Task<ApiResponse<MaskingConfigResponse>> GetConfig();
    Task<ApiResponse<string>> UpdateConfig(MaskingConfigRequest request);
    string ApplyMaskingToEmail(string email, MaskingConfig? config);
    string ApplyMaskingToPhone(string phone, MaskingConfig? config);
}

public class MaskingConfigService : IMaskingConfigService
{
    private readonly IMaskingConfigRepository _repository;
    private readonly DataMaskingService _maskingService;

    // Lấy cấu hình (trả về default nếu chưa set)
    public async Task<ApiResponse<MaskingConfigResponse>> GetConfig()
    {
        var config = await _repository.GetConfig();

        if (config == null)
        {
            // Trả về cấu hình mặc định
            return ApiResponse<MaskingConfigResponse>.Ok(new MaskingConfigResponse
            {
                Enabled = true,
                Algorithm = MaskingAlgorithm.CharacterMasking,
                AlgorithmName = "Character Masking",
                UpdatedAt = DateTime.UtcNow
            }, "Sử dụng cấu hình mặc định");
        }

        return ApiResponse<MaskingConfigResponse>.Ok(new MaskingConfigResponse
        {
            Enabled = config.Enabled,
            Algorithm = config.Algorithm,
            AlgorithmName = GetAlgorithmName(config.Algorithm),
            UpdatedAt = config.UpdatedAt
        });
    }

    // Cập nhật cấu hình
    public async Task<ApiResponse<string>> UpdateConfig(MaskingConfigRequest request)
    {
        if (request.Enabled && request.Algorithm == MaskingAlgorithm.None)
            return ApiResponse<string>.Fail("Nếu bật mask, phải chọn thuật toán");

        await _repository.UpdateConfig(request.Enabled, request.Algorithm);

        var message = request.Enabled
            ? $"Cập nhật cấu hình masking thành {GetAlgorithmName(request.Algorithm)}"
            : "Tắt masking cho Viewer";

        return ApiResponse<string>.Ok("", message);
    }

    // Áp dụng masking vào email
    public string ApplyMaskingToEmail(string email, MaskingConfig? config)
    {
        if (config == null || !config.Enabled)
            return email;

        return config.Algorithm switch
        {
            MaskingAlgorithm.CharacterMasking => _maskingService.MaskEmail(email),
            MaskingAlgorithm.DataShuffling => _maskingService.ShuffleEmail(email),
            MaskingAlgorithm.DataSubstitution => _maskingService.SubstituteEmail(email),
            MaskingAlgorithm.NoiseAddition => _maskingService.AddNoiseToEmail(email),
            _ => email
        };
    }

    // Áp dụng masking vào phone
    public string ApplyMaskingToPhone(string phone, MaskingConfig? config)
    {
        if (config == null || !config.Enabled)
            return phone;

        return config.Algorithm switch
        {
            MaskingAlgorithm.CharacterMasking => _maskingService.MaskPhone(phone),
            MaskingAlgorithm.DataShuffling => _maskingService.ShufflePhone(phone),
            MaskingAlgorithm.DataSubstitution => _maskingService.SubstitutePhone(phone),
            MaskingAlgorithm.NoiseAddition => _maskingService.AddNoiseToPhone(phone),
            _ => phone
        };
    }
}
```

#### 3. Controller Layer - `AdminController.cs`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IMaskingConfigService _maskingConfigService;

    // GET: /api/admin/masking-config
    // Lấy cấu hình masking hiện tại
    [HttpGet("masking-config")]
    public async Task<IActionResult> GetMaskingConfig()
    {
        var result = await _maskingConfigService.GetConfig();
        return Ok(result);
    }

    // PUT: /api/admin/masking-config
    // Cập nhật cấu hình masking
    [HttpPut("masking-config")]
    public async Task<IActionResult> UpdateMaskingConfig([FromBody] MaskingConfigRequest request)
    {
        var result = await _maskingConfigService.UpdateConfig(request);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // GET: /api/admin/masking-algorithms
    // Lấy danh sách thuật toán có sẵn
    [HttpGet("masking-algorithms")]
    public IActionResult GetMaskingAlgorithms()
    {
        var algorithms = new List<object>
        {
            new { id = 1, name = "Character Masking", description = "Che giấu ký tự bằng dấu *" },
            new { id = 2, name = "Data Shuffling", description = "Xáo trộn vị trí các ký tự" },
            new { id = 3, name = "Data Substitution", description = "Thay thế bằng dữ liệu giả hợp lệ" },
            new { id = 4, name = "Noise Addition", description = "Thêm ký tự nhiễu vào dữ liệu" }
        };

        return Ok(ApiResponse<object>.Ok(algorithms));
    }
}
```

#### 4. Data Models - `Models.cs`

```csharp
// Enum cho thuật toán masking
public enum MaskingAlgorithm
{
    None = 0,
    CharacterMasking = 1,
    DataShuffling = 2,
    DataSubstitution = 3,
    NoiseAddition = 4
}

// Entity lưu trữ cấu hình
public class MaskingConfig
{
    public int Id { get; set; }
    public bool Enabled { get; set; }
    public MaskingAlgorithm Algorithm { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Request DTO cho cập nhật cấu hình
public class MaskingConfigRequest
{
    public bool Enabled { get; set; }
    public MaskingAlgorithm Algorithm { get; set; }
}

// Response DTO cho lấy cấu hình
public class MaskingConfigResponse
{
    public bool Enabled { get; set; }
    public MaskingAlgorithm Algorithm { get; set; }
    public string? AlgorithmName { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

---

## 🔄 Quy Trình Hoạt Động

### Workflow: Admin Set Config → Viewer Sees Masked Data

```
1. Admin gọi: PUT /api/admin/masking-config
   ├─ Body: { "enabled": true, "algorithm": 2 }
   ├─ MaskingConfigService.UpdateConfig()
   └─ MaskingConfigRepository.UpdateConfig() → Insert/Update DB

2. Viewer gọi: GET /api/users
   ├─ UsersController.GetUsers()
   ├─ IMaskingConfigService.GetConfig() → Lấy config từ DB
   ├─ Foreach user:
   │  ├─ ApplyMaskingToEmail(email, config)
   │  └─ ApplyMaskingToPhone(phone, config)
   └─ Return masked user list

3. Viewer nhận data đã mask theo config của Admin ✓
```

### Ví Dụ Chi Tiết

**Step 1: Admin Set Config**

```bash
curl -X PUT "http://localhost:5000/api/admin/masking-config" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "algorithm": 2}'
```

Response:

```json
{
  "success": true,
  "message": "Cập nhật cấu hình masking thành Data Shuffling",
  "data": ""
}
```

**Step 2: Viewer Request Users**

```bash
curl -X GET "http://localhost:5000/api/users" \
  -H "Authorization: Bearer {viewer_token}"
```

Response:

```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "total": 3,
    "items": [
      {
        "id": 1,
        "username": "john",
        "email": "njho@example.moc",  // ← Được shuffle theo config
        "phone": "+84914567230",      // ← Được shuffle theo config
        "role": "User"
      },
      ...
    ]
  }
}
```

---

## 🔐 Bảo Mật & Quyền Hạn

| Role   | Có thể                                                  | Không thể                         |
| ------ | ------------------------------------------------------- | --------------------------------- |
| Admin  | ✅ GET/PUT masking-config, xem full data nếu mask=false | ❌ Không                          |
| Viewer | ✅ Xem data (luôn masked)                               | ❌ Thay đổi config, xem full data |
| User   | ✅ Xem chính mình, có thể toggle mask                   | ❌ Thay đổi config                |

---

## 📊 Các Thuật Toán Masking

### 1️⃣ Character Masking (Che giấu ký tự)

```
Original: john@example.com
Masked:   j***@example.com
```

- Giữ 1 ký tự đầu, che giấu còn lại bằng `*`
- Để lại domain không thay đổi

### 2️⃣ Data Shuffling (Xáo trộn)

```
Original: john@example.com
Masked:   nhjo@example.moc  // Ký tự được xáo trộn
```

- Xáo trộn vị trí các ký tự ngẫu nhiên
- Vẫn dùng các ký tự gốc, chỉ thay đổi thứ tự

### 3️⃣ Data Substitution (Thay thế)

```
Original: john@example.com
Masked:   alice@example.com  // Dữ liệu giả ngẫu nhiên
```

- Thay thế bằng dữ liệu giả hợp lệ
- Email/phone hợp lệ nhưng không thực sự tồn tại

### 4️⃣ Noise Addition (Thêm nhiễu)

```
Original: john@example.com
Masked:   jo@h_n@example.com  // Thêm ký tự nhiễu
```

- Thêm ký tự ngẫu nhiên vào giữa dữ liệu
- Làm cho dữ liệu khó nhận diện

---

## 🛠️ Dependency Injection Setup

**Program.cs:**

```csharp
builder.Services.AddScoped<IMaskingConfigRepository, MaskingConfigRepository>();
builder.Services.AddScoped<IMaskingConfigService, MaskingConfigService>();
```

---

## 📈 Quy Trình Kiểm Thử

### Test Case 1: Admin Bật Masking

```csharp
[Fact]
public async Task AdminCanEnableMasking()
{
    // Arrange
    var request = new MaskingConfigRequest
    {
        Enabled = true,
        Algorithm = MaskingAlgorithm.DataShuffling
    };

    // Act
    var result = await _maskingConfigService.UpdateConfig(request);

    // Assert
    Assert.True(result.Success);
    Assert.Contains("Data Shuffling", result.Message);
}
```

### Test Case 2: Viewer Thấy Masked Data

```csharp
[Fact]
public async Task ViewerSeesOnlyMaskedData()
{
    // Arrange - Set config to mask
    var config = new MaskingConfig
    {
        Enabled = true,
        Algorithm = MaskingAlgorithm.CharacterMasking
    };

    // Act
    var email = "john@example.com";
    var masked = _maskingConfigService.ApplyMaskingToEmail(email, config);

    // Assert
    Assert.Equal("j***@example.com", masked);
}
```

### Test Case 3: Admin Có Thể Tắt Masking

```csharp
[Fact]
public async Task AdminCanDisableMasking()
{
    // Arrange
    var request = new MaskingConfigRequest { Enabled = false };

    // Act
    var result = await _maskingConfigService.UpdateConfig(request);

    // Assert
    Assert.True(result.Success);
    Assert.Contains("Tắt masking", result.Message);
}
```

---

## 🔧 Cấu Hình Cơ Sở Dữ Liệu

**Tạo table:**

```sql
CREATE TABLE MaskingConfig (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Enabled BIT NOT NULL DEFAULT 1,
    Algorithm INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Seed default config
INSERT INTO MaskingConfig (Enabled, Algorithm) VALUES (1, 1);
```

**Drop table (nếu cần):**

```sql
DROP TABLE IF EXISTS MaskingConfig;
```

---

## 📝 Ghi Chú & Hạn Chế

✅ **Ưu điểm:**

- Admin có quyền kiểm soát toàn bộ
- Viewer không thể bypass masking
- Dễ dàng thay đổi thuật toán
- Cấu hình tập trung (1 config cho tất cả)

⚠️ **Hạn chế:**

- Chỉ có 1 cấu hình chung (không phân biệt user)
- Không thể set config per-role hoặc per-user
- Masking luôn áp dụng cho tất cả Viewer

---

## 🚀 Tương Lai

**Nâng cấp có thể:**

1. **Per-User Config:** Mỗi user có cấu hình masking riêng
2. **Schedule Masking:** Tự động thay đổi thuật toán theo thời gian
3. **Audit Log:** Ghi nhận tất cả thay đổi config
4. **Role-based Masking:** Cấu hình khác nhau cho Viewer/User

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra `/api/admin/masking-config` để xem config hiện tại
2. Xem logs để tìm lỗi database
3. Kiểm tra roles của user (Admin mới có quyền cập nhật config)
