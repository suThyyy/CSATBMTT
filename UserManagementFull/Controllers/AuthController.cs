using Microsoft.AspNetCore.Mvc;
using UserManagement.Models;
using UserManagement.Services;

namespace UserManagement.Controllers;

/// <summary>
/// Controller xử lý đăng ký và đăng nhập
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;

    public AuthController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>Đăng ký tài khoản mới (mặc định role: User)</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<UserResponse>), 201)]
    [ProducesResponseType(typeof(ApiResponse<string>), 400)]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await _userService.Register(request);
        if (!result.Success)
            return BadRequest(result);
        return CreatedAtAction(nameof(Register), result);
    }

    /// <summary>Đăng nhập và nhận JWT Token</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), 200)]
    [ProducesResponseType(typeof(ApiResponse<string>), 401)]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _userService.Login(request);
        if (!result.Success)
            return Unauthorized(result);
        return Ok(result);
    }
}
