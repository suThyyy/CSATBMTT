using System.Security.Cryptography;
using System.Text;

namespace UserManagement.Services;

/// <summary>
/// Dịch vụ bảo mật: mã hóa/giải mã dữ liệu nhạy cảm lưu vào DB
/// Sử dụng AES-128 tự viết (Custom Implementation) để mã hóa và PBKDF2 để hash password
/// </summary>
public class SecurityService
{
    private readonly byte[] _masterKey;
    private readonly Aes128Engine _aesEngine;

    public SecurityService(IConfiguration configuration)
    {
        // Master key lấy từ config (Jwt:Key), dùng để derive key con
        var configKey = configuration["Jwt:Key"] ?? "DefaultMasterKey2024!";
        _masterKey = SHA256.HashData(Encoding.UTF8.GetBytes(configKey));
        _aesEngine = new Aes128Engine();
    }

    // ── Mã hóa / Giải mã AES-128 (Custom Implementation) ───────────────────

    /// <summary>Mã hóa chuỗi bằng AES-128 tự viết, trả về byte[]</summary>
    public byte[] Encrypt(string plainText, int userKey)
    {
        var key = DeriveKey(userKey);
        var plainBytes = Encoding.UTF8.GetBytes(plainText);

        // Mã hóa trực tiếp bằng AES-128 engine, không dùng thư viện ngoài
        // Sử dụng EncryptDataHex để giữ format hex (compatible với DB hiện tại)
        var encryptedHex = _aesEngine.EncryptDataHex(plainText, Convert.ToHexString(key).ToLower());

        // Chuyển hex string thành byte array
        return Convert.FromHexString(encryptedHex);
    }

    /// <summary>Giải mã byte[] bằng AES-128 tự viết</summary>
    public string Decrypt(byte[] cipherData, int userKey)
    {
        var key = DeriveKey(userKey);

        // Chuyển byte array thành hex string
        var encryptedHex = Convert.ToHexString(cipherData).ToLower();

        // Giải mã bằng AES-128 engine
        // Sử dụng DecryptDataHex vì dữ liệu lưu trong DB ở dạng hex
        return _aesEngine.DecryptDataHex(encryptedHex, Convert.ToHexString(key).ToLower());
    }


    // ── Hash Password ──────────────────────────────────────────────────────

    /// <summary>Hash password bằng PBKDF2-SHA256 với salt ngẫu nhiên</summary>
    public string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(32);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32);

        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    /// <summary>Xác minh password với hash đã lưu</summary>
    public bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2) return false;

        var salt = Convert.FromBase64String(parts[0]);
        var expectedHash = Convert.FromBase64String(parts[1]);

        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32);

        return CryptographicOperations.FixedTimeEquals(hash, expectedHash);
    }

    // ── User Key ───────────────────────────────────────────────────────────

    /// <summary>Tạo user key ngẫu nhiên dùng để encrypt dữ liệu của user đó</summary>
    public int GenerateUserKey()
    {
        return RandomNumberGenerator.GetInt32(100_000, int.MaxValue);
    }

    /// <summary>Tạo hash của email dùng để kiểm tra duplicate (không phụ thuộc vào user key)</summary>
    public string GetEmailHash(string email)
    {
        var normalizedEmail = email.ToLower().Trim();
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedEmail));
        return Convert.ToBase64String(hashBytes);
    }

    // ── Private ────────────────────────────────────────────────────────────

    /// <summary>Derive key từ master key + user key</summary>
    private byte[] DeriveKey(int userKey)
    {
        // Kết hợp master key + user key để tạo key riêng cho mỗi user
        var combined = new byte[_masterKey.Length + 4];
        Buffer.BlockCopy(_masterKey, 0, combined, 0, _masterKey.Length);
        BitConverter.GetBytes(userKey).CopyTo(combined, _masterKey.Length);
        return SHA256.HashData(combined);
    }
}
