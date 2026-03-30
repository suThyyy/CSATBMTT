using System.ComponentModel.DataAnnotations;

namespace UserManagement.Models;

// ── Database Entities ──────────────────────────────────────────────────────

public class User
{
    public int Id { get; set; }
    public string? Username { get; set; }
    public byte[]? EncryptedEmail { get; set; }
    public byte[]? EncryptedPhone { get; set; }
    public byte[]? EncryptedPassword { get; set; }
    public int Key { get; set; }
    public int RoleId { get; set; }
    public string? RoleName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class Role
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
}

// ── Request DTOs ───────────────────────────────────────────────────────────

public class RegisterRequest
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username chỉ được chứa chữ, số và dấu gạch dưới")]
    public required string Username { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [StringLength(15, MinimumLength = 10)]
    [RegularExpression(@"^[\+]?[0-9]+$", ErrorMessage = "Phone chỉ được chứa số và dấu + ở đầu")]
    public required string Phone { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public required string Password { get; set; }
}

public class LoginRequest
{
    [Required]
    public required string Username { get; set; }

    [Required]
    public required string Password { get; set; }
}

public class UpdateUserRequest
{
    public int Id { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 3)]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username chỉ được chứa chữ, số và dấu gạch dưới")]
    public required string Username { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [StringLength(15, MinimumLength = 10)]
    [RegularExpression(@"^[\+]?[0-9]+$", ErrorMessage = "Phone chỉ được chứa số và dấu + ở đầu")]
    public required string Phone { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public required string Password { get; set; }
}

// ── Response DTOs ──────────────────────────────────────────────────────────

public class UserResponse
{
    public int Id { get; set; }
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Password { get; set; }
    public string? Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PaginatedUserResponse
{
    public int Total { get; set; }
    public int Skip { get; set; }
    public int Limit { get; set; }
    public List<UserResponse> Items { get; set; } = new();
}

public class LoginResponse
{
    public string Token { get; set; } = "";
    public string Username { get; set; } = "";
    public string Role { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "Success") =>
        new() { Success = true, Message = message, Data = data };

    public static ApiResponse<T> Fail(string message) =>
        new() { Success = false, Message = message };
}

// ── Masking Configuration ──────────────────────────────────────────────────

public enum MaskingAlgorithm
{
    None = 0,                  // Không mask
    CharacterMasking = 1,      // Che ký tự bằng *
    DataShuffling = 2,         // Xáo trộn
    DataSubstitution = 3,      // Thay thế giả
    NoiseAddition = 4          // Thêm nhiễu
}

public class MaskingConfig
{
    public int Id { get; set; }
    public bool Enabled { get; set; } = true;
    public MaskingAlgorithm Algorithm { get; set; } = MaskingAlgorithm.CharacterMasking;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class MaskingConfigRequest
{
    [Required]
    public bool Enabled { get; set; }

    [Required]
    public MaskingAlgorithm Algorithm { get; set; } = MaskingAlgorithm.CharacterMasking;
}

public class MaskingConfigResponse
{
    public bool Enabled { get; set; }
    public MaskingAlgorithm Algorithm { get; set; }
    public string AlgorithmName { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}
