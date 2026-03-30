using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserManagement.Models;
using UserManagement.Services;

namespace UserManagement.Controllers;

/// <summary>
/// Controller demo 4 phương pháp Data Masking
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class MaskingController : ControllerBase
{
    private readonly DataMaskingService _maskingService;
    private readonly IUserService _userService;

    public MaskingController(DataMaskingService maskingService, IUserService userService)
    {
        _maskingService = maskingService;
        _userService = userService;
    }

    // ══════════════════════════════════════════════════════════════════════
    // DEMO: Áp dụng masking trực tiếp lên input
    // ══════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Demo 4 phương pháp masking trên email và phone bất kỳ
    /// </summary>
    [HttpPost("demo")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<MaskingDemoResponse>), 200)]
    public IActionResult Demo([FromBody] MaskingDemoRequest request)
    {
        var response = new MaskingDemoResponse
        {
            Original = new MaskingItem
            {
                Email = request.Email,
                Phone = request.Phone
            },
            CharacterMasking = new MaskingItem
            {
                Email = _maskingService.MaskEmail(request.Email),
                Phone = _maskingService.MaskPhone(request.Phone),
                Description = "Che giấu ký tự bằng dấu *"
            },
            DataShuffling = new MaskingItem
            {
                Email = _maskingService.ShuffleEmail(request.Email),
                Phone = _maskingService.ShufflePhone(request.Phone),
                Description = "Xáo trộn vị trí các ký tự"
            },
            DataSubstitution = new MaskingItem
            {
                Email = _maskingService.SubstituteEmail(request.Email),
                Phone = _maskingService.SubstitutePhone(request.Phone),
                Description = "Thay thế bằng dữ liệu giả hợp lệ"
            },
            NoiseAddition = new MaskingItem
            {
                Email = _maskingService.AddNoiseToEmail(request.Email),
                Phone = _maskingService.AddNoiseToPhone(request.Phone),
                Description = "Thêm ký tự nhiễu vào dữ liệu"
            }
        };

        return Ok(ApiResponse<MaskingDemoResponse>.Ok(response, "Demo 4 phương pháp masking"));
    }

    // ══════════════════════════════════════════════════════════════════════
    // ÁP DỤNG MASKING LÊN USER THỰC TẾ
    // ══════════════════════════════════════════════════════════════════════

    /// <summary>
    /// [Admin] Xem thông tin user với 4 phương pháp masking khác nhau
    /// </summary>
    [HttpGet("user/{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<UserMaskingCompareResponse>), 200)]
    public async Task<IActionResult> GetUserMasked(int id)
    {
        // Lấy data gốc (không mask)
        var result = await _userService.GetUserById(id, mask: false);
        if (!result.Success)
            return NotFound(result);

        var user = result.Data!;

        var response = new UserMaskingCompareResponse
        {
            UserId = user.Id,
            Username = user.Username,

            Original = new MaskingItem
            {
                Email = user.Email ?? "",
                Phone = user.Phone ?? "",
                Description = "Dữ liệu gốc (chỉ Admin mới thấy)"
            },
            CharacterMasking = new MaskingItem
            {
                Email = _maskingService.MaskEmail(user.Email ?? ""),
                Phone = _maskingService.MaskPhone(user.Phone ?? ""),
                Description = "Che giấu ký tự bằng dấu *"
            },
            DataShuffling = new MaskingItem
            {
                Email = _maskingService.ShuffleEmail(user.Email ?? ""),
                Phone = _maskingService.ShufflePhone(user.Phone ?? ""),
                Description = "Xáo trộn vị trí các ký tự"
            },
            DataSubstitution = new MaskingItem
            {
                Email = _maskingService.SubstituteEmail(user.Email ?? ""),
                Phone = _maskingService.SubstitutePhone(user.Phone ?? ""),
                Description = "Thay thế bằng dữ liệu giả hợp lệ"
            },
            NoiseAddition = new MaskingItem
            {
                Email = _maskingService.AddNoiseToEmail(user.Email ?? ""),
                Phone = _maskingService.AddNoiseToPhone(user.Phone ?? ""),
                Description = "Thêm ký tự nhiễu vào dữ liệu"
            }
        };

        return Ok(ApiResponse<UserMaskingCompareResponse>.Ok(response));
    }

    /// <summary>
    /// [Admin] Xem danh sách users với phương pháp masking tuỳ chọn
    /// </summary>
    [HttpGet("users")]
    [Authorize(Roles = "Admin,Viewer")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetUsersWithMaskingMethod(
        [FromQuery] MaskingMethod method = MaskingMethod.CharacterMasking,
        [FromQuery] int skip = 0,
        [FromQuery] int limit = 10)
    {
        // Lấy data gốc
        var result = await _userService.GetUsers(mask: false, skip, limit);
        if (!result.Success) return BadRequest(result);

        var items = new List<UserResponse>();
        foreach (var user in result.Data!.Items)
        {
            string email = user.Email ?? "";
            string phone = user.Phone ?? "";

            string maskedEmail = method switch
            {
                MaskingMethod.CharacterMasking  => _maskingService.MaskEmail(email),
                MaskingMethod.DataShuffling     => _maskingService.ShuffleEmail(email),
                MaskingMethod.DataSubstitution  => _maskingService.SubstituteEmail(email),
                MaskingMethod.NoiseAddition     => _maskingService.AddNoiseToEmail(email),
                _                               => _maskingService.MaskEmail(email)
            };

            string maskedPhone = method switch
            {
                MaskingMethod.CharacterMasking  => _maskingService.MaskPhone(phone),
                MaskingMethod.DataShuffling     => _maskingService.ShufflePhone(phone),
                MaskingMethod.DataSubstitution  => _maskingService.SubstitutePhone(phone),
                MaskingMethod.NoiseAddition     => _maskingService.AddNoiseToPhone(phone),
                _                               => _maskingService.MaskPhone(phone)
            };

            items.Add(new UserResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = maskedEmail,
                Phone = maskedPhone,
                Password = "***",
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            });
        }

        return Ok(ApiResponse<PaginatedUserResponse>.Ok(new PaginatedUserResponse
        {
            Total = result.Data.Total,
            Skip = skip,
            Limit = limit,
            Items = items
        }, $"Masking method: {method}"));
    }
}

// ── Enums & DTOs ──────────────────────────────────────────────────────────

public enum MaskingMethod
{
    CharacterMasking  = 1,  // Che ký tự bằng *
    DataShuffling     = 2,  // Xáo trộn
    DataSubstitution  = 3,  // Thay thế giả
    NoiseAddition     = 4   // Thêm nhiễu
}

public class MaskingDemoRequest
{
    public string Email { get; set; } = "john.doe@example.com";
    public string Phone { get; set; } = "0912345678";
}

public class MaskingItem
{
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Description { get; set; }
}

public class MaskingDemoResponse
{
    public MaskingItem Original { get; set; } = new();
    public MaskingItem CharacterMasking { get; set; } = new();
    public MaskingItem DataShuffling { get; set; } = new();
    public MaskingItem DataSubstitution { get; set; } = new();
    public MaskingItem NoiseAddition { get; set; } = new();
}

public class UserMaskingCompareResponse
{
    public int UserId { get; set; }
    public string? Username { get; set; }
    public MaskingItem Original { get; set; } = new();
    public MaskingItem CharacterMasking { get; set; } = new();
    public MaskingItem DataShuffling { get; set; } = new();
    public MaskingItem DataSubstitution { get; set; } = new();
    public MaskingItem NoiseAddition { get; set; } = new();
}
