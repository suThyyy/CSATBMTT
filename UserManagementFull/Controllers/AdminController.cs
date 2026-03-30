using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserManagement.Models;
using UserManagement.Services;

namespace UserManagement.Controllers;

/// <summary>
/// Admin controller - quản lý cấu hình hệ thống
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly IMaskingConfigService _maskingConfigService;

    public AdminController(IMaskingConfigService maskingConfigService)
    {
        _maskingConfigService = maskingConfigService;
    }

    // ── Masking Configuration ──────────────────────────────────────────────

    /// <summary>
    /// [Admin] Lấy cấu hình masking hiện tại
    /// </summary>
    [HttpGet("masking-config")]
    [ProducesResponseType(typeof(ApiResponse<MaskingConfigResponse>), 200)]
    public async Task<IActionResult> GetMaskingConfig()
    {
        var result = await _maskingConfigService.GetConfig();
        return Ok(result);
    }

    /// <summary>
    /// [Admin] Cập nhật cấu hình masking cho Viewer
    /// - Enabled: true/false (bật/tắt masking)
    /// - Algorithm: Thuật toán masking (nếu Enabled = true)
    ///   * CharacterMasking (1): Che ký tự bằng *
    ///   * DataShuffling (2): Xáo trộn vị trí ký tự
    ///   * DataSubstitution (3): Thay thế bằng dữ liệu giả
    ///   * NoiseAddition (4): Thêm ký tự nhiễu
    /// </summary>
    [HttpPut("masking-config")]
    [ProducesResponseType(typeof(ApiResponse<string>), 200)]
    [ProducesResponseType(typeof(ApiResponse<string>), 400)]
    public async Task<IActionResult> UpdateMaskingConfig([FromBody] MaskingConfigRequest request)
    {
        var result = await _maskingConfigService.UpdateConfig(request);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// [Admin] Lấy danh sách thuật toán masking có sẵn
    /// </summary>
    [HttpGet("masking-algorithms")]
    [ProducesResponseType(typeof(ApiResponse<List<MaskingAlgorithmInfo>>), 200)]
    public IActionResult GetMaskingAlgorithms()
    {
        var algorithms = new List<MaskingAlgorithmInfo>
        {
            new() { Id = (int)MaskingAlgorithm.CharacterMasking, Name = "Character Masking", Description = "Che giấu ký tự bằng dấu *" },
            new() { Id = (int)MaskingAlgorithm.DataShuffling, Name = "Data Shuffling", Description = "Xáo trộn vị trí các ký tự" },
            new() { Id = (int)MaskingAlgorithm.DataSubstitution, Name = "Data Substitution", Description = "Thay thế bằng dữ liệu giả hợp lệ" },
            new() { Id = (int)MaskingAlgorithm.NoiseAddition, Name = "Noise Addition", Description = "Thêm ký tự nhiễu vào dữ liệu" }
        };

        return Ok(ApiResponse<List<MaskingAlgorithmInfo>>.Ok(algorithms, "Danh sách thuật toán masking"));
    }
}

// ── DTO ────────────────────────────────────────────────────────────────────

public class MaskingAlgorithmInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
}
