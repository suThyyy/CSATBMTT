using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserManagement.Models;
using UserManagement.Services;

namespace UserManagement.Controllers;

/// <summary>
/// Controller quản lý người dùng (yêu cầu xác thực JWT)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IMaskingConfigService _maskingConfigService;

    public UsersController(IUserService userService, IMaskingConfigService maskingConfigService)
    {
        _userService = userService;
        _maskingConfigService = maskingConfigService;
    }

    /// <summary>
    /// Lấy danh sách người dùng có phân trang.
    /// - Admin: có thể bật mask=false để xem đầy đủ
    /// - Viewer: luôn bị mask theo cấu hình Admin đã set
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Viewer")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedUserResponse>), 200)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] bool mask = true,
        [FromQuery] int skip = 0,
        [FromQuery] int limit = 10)
    {
        if (limit > 100) limit = 100;

        var result = await _userService.GetUsers(false, skip, limit);
        if (!result.Success)
            return Ok(result);

        // Áp dụng masking cho Viewer hoặc Admin khi mask=true
        if ((IsAdmin() && mask) || IsViewer())
        {
            var maskingConfigResp = await _maskingConfigService.GetConfig();
            var config = new MaskingConfig
            {
                Enabled = maskingConfigResp.Data!.Enabled,
                Algorithm = maskingConfigResp.Data.Algorithm
            };

            foreach (var item in result.Data!.Items)
            {
                item.Email = _maskingConfigService.ApplyMaskingToEmail(item.Email ?? "", config);
                item.Phone = _maskingConfigService.ApplyMaskingToPhone(item.Phone ?? "", config);
            }
        }

        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin cá nhân của user hiện tại (dựa vào token JWT).
    /// Tất cả role (Admin, Viewer, User) đều có thể sử dụng.
    /// Dữ liệu không bị mask vì đây là thông tin của chính mình.
    /// </summary>
    [HttpGet("me")]
    [Authorize(Roles = "Admin,Viewer,User")]
    [ProducesResponseType(typeof(ApiResponse<UserResponse>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCurrentUser()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId <= 0)
            return Unauthorized(ApiResponse<string>.Fail("Không thể xác định user từ token"));

        var result = await _userService.GetUserById(currentUserId, false);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin người dùng theo ID.
    /// - Admin: xem tất cả, có thể bật mask=false
    /// - Viewer: xem tất cả nhưng luôn bị mask theo config
    /// - User: chỉ xem thông tin của chính mình, có thể tắt mask
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Viewer,User")]
    [ProducesResponseType(typeof(ApiResponse<UserResponse>), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetUser(int id, [FromQuery] bool mask = true)
    {
        if (IsUser() && GetCurrentUserId() != id)
            return Forbid();

        // Lấy user từ service (không mask trước)
        var result = await _userService.GetUserById(id, false);
        if (!result.Success)
            return NotFound(result);

        // Áp dụng masking config cho Viewer hoặc Admin khi mask=true
        if ((IsAdmin() && mask) || IsViewer())
        {
            var maskingConfigResp = await _maskingConfigService.GetConfig();
            var config = new MaskingConfig
            {
                Enabled = maskingConfigResp.Data!.Enabled,
                Algorithm = maskingConfigResp.Data.Algorithm
            };

            result.Data!.Email = _maskingConfigService.ApplyMaskingToEmail(result.Data.Email ?? "", config);
            result.Data.Phone = _maskingConfigService.ApplyMaskingToPhone(result.Data.Phone ?? "", config);
        }
        // User xem chính mình: áp dụng mask nếu mask=true
        else if (IsUser() && GetCurrentUserId() == id && mask)
        {
            var maskingConfigResp = await _maskingConfigService.GetConfig();
            var config = new MaskingConfig
            {
                Enabled = maskingConfigResp.Data!.Enabled,
                Algorithm = maskingConfigResp.Data.Algorithm
            };

            result.Data!.Email = _maskingConfigService.ApplyMaskingToEmail(result.Data.Email ?? "", config);
            result.Data.Phone = _maskingConfigService.ApplyMaskingToPhone(result.Data.Phone ?? "", config);
        }

        return Ok(result);
    }

    /// <summary>
    /// Cập nhật thông tin người dùng.
    /// - Admin: cập nhật bất kỳ ai
    /// - User: chỉ cập nhật thông tin của chính mình
    /// - Viewer: KHÔNG được phép cập nhật
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,User")]
    [ProducesResponseType(typeof(ApiResponse<string>), 200)]
    [ProducesResponseType(typeof(ApiResponse<string>), 400)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest request)
    {
        if (IsUser() && GetCurrentUserId() != id)
            return Forbid();

        var result = await _userService.UpdateUser(id, request);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    /// <summary>[Admin] Xóa người dùng theo ID</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<string>), 200)]
    [ProducesResponseType(typeof(ApiResponse<string>), 404)]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var result = await _userService.DeleteUser(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>[Admin] Khóa hoặc mở khóa tài khoản người dùng</summary>
    [HttpPatch("{id}/active")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<string>), 200)]
    public async Task<IActionResult> SetActive(int id, [FromQuery] bool isActive)
    {
        var result = await _userService.SetUserActive(id, isActive);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>[Admin] Nâng cấp user lên Viewer (chỉ nâng cấp từ User → Viewer)</summary>
    [HttpPatch("{id}/promote-to-viewer")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<string>), 200)]
    [ProducesResponseType(typeof(ApiResponse<string>), 400)]
    public async Task<IActionResult> PromoteToViewer(int id)
    {
        var result = await _userService.PromoteUserToViewer(id);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private bool IsAdmin() => User.IsInRole("Admin");
    private bool IsViewer() => User.IsInRole("Viewer");
    private bool IsUser() => User.IsInRole("User");

    private int GetCurrentUserId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "userId");
        return claim != null ? int.Parse(claim.Value) : 0;
    }
}
