using UserManagement.Models;
using UserManagement.Repositories;

namespace UserManagement.Services;

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

    public MaskingConfigService(IMaskingConfigRepository repository, DataMaskingService maskingService)
    {
        _repository = repository;
        _maskingService = maskingService;
    }

    public async Task<ApiResponse<MaskingConfigResponse>> GetConfig()
    {
        var config = await _repository.GetConfig();

        if (config == null)
        {
            // Return default config if not set
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

    public async Task<ApiResponse<string>> UpdateConfig(MaskingConfigRequest request)
    {
        // Validate
        if (request.Enabled && !Enum.IsDefined(typeof(MaskingAlgorithm), request.Algorithm))
            return ApiResponse<string>.Fail("Thuật toán masking không hợp lệ");

        if (request.Enabled && request.Algorithm == MaskingAlgorithm.None)
            return ApiResponse<string>.Fail("Nếu bật mask, phải chọn thuật toán");

        await _repository.UpdateConfig(request.Enabled, request.Algorithm);

        var message = request.Enabled
            ? $"Cập nhật cấu hình masking thành {GetAlgorithmName(request.Algorithm)}"
            : "Tắt masking cho Viewer";

        return ApiResponse<string>.Ok("", message);
    }

    /// <summary>Áp dụng masking config cho email dữ liệu</summary>
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

    /// <summary>Áp dụng masking config cho phone dữ liệu</summary>
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

    private string GetAlgorithmName(MaskingAlgorithm algorithm) => algorithm switch
    {
        MaskingAlgorithm.None => "Không mask",
        MaskingAlgorithm.CharacterMasking => "Character Masking (Che ký tự)",
        MaskingAlgorithm.DataShuffling => "Data Shuffling (Xáo trộn)",
        MaskingAlgorithm.DataSubstitution => "Data Substitution (Thay thế)",
        MaskingAlgorithm.NoiseAddition => "Noise Addition (Thêm nhiễu)",
        _ => "Không xác định"
    };
}
