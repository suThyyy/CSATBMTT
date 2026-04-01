using UserManagement.Models;
using UserManagement.Repositories;
using UserManagement.Services;

namespace UserManagement.Services;

public interface IUserService
{
    Task<ApiResponse<LoginResponse>> Login(LoginRequest request);
    Task<ApiResponse<UserResponse>> Register(RegisterRequest request);
    Task<ApiResponse<PaginatedUserResponse>> GetUsers(bool mask, int skip, int limit);
    Task<ApiResponse<UserResponse>> GetUserById(int id, bool mask);
    Task<ApiResponse<string>> UpdateUser(int id, UpdateUserRequest request);
    Task<ApiResponse<string>> DeleteUser(int id);
    Task<ApiResponse<string>> SetUserActive(int id, bool isActive);
    Task<ApiResponse<string>> PromoteUserToViewer(int id);
}

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly SecurityService _securityService;
    private readonly DataMaskingService _dataMaskingService;
    private readonly JwtService _jwtService;

    public UserService(
        IUserRepository userRepository,
        SecurityService securityService,
        DataMaskingService dataMaskingService,
        JwtService jwtService)
    {
        _userRepository = userRepository;
        _securityService = securityService;
        _dataMaskingService = dataMaskingService;
        _jwtService = jwtService;
    }

    // ── Auth ───────────────────────────────────────────────────────────────

    public async Task<ApiResponse<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _userRepository.GetUserByUsername(request.Username);
        if (user == null)
            return ApiResponse<LoginResponse>.Fail("Tên đăng nhập hoặc mật khẩu không đúng");

        if (!user.IsActive)
            return ApiResponse<LoginResponse>.Fail("Tài khoản đã bị khóa");

        var decryptedPassword = user.EncryptedPassword != null
            ? _securityService.Decrypt(user.EncryptedPassword, user.Key)
            : "";

        if (!_securityService.VerifyPassword(request.Password, decryptedPassword))
            return ApiResponse<LoginResponse>.Fail("Tên đăng nhập hoặc mật khẩu không đúng");

        var tokenResponse = _jwtService.GenerateToken(user);
        return ApiResponse<LoginResponse>.Ok(tokenResponse, "Đăng nhập thành công");
    }

    // ── Register ───────────────────────────────────────────────────────────

    public async Task<ApiResponse<UserResponse>> Register(RegisterRequest request)
    {
        if (await _userRepository.UsernameExists(request.Username))
            return ApiResponse<UserResponse>.Fail("Username đã tồn tại");

        // Kiểm tra email trùng bằng hash email (không phụ thuộc vào user key)
        var emailHash = _securityService.GetEmailHash(request.Email);
        if (await _userRepository.EmailExists(emailHash))
            return ApiResponse<UserResponse>.Fail("Email đã được sử dụng");

        var userKey = _securityService.GenerateUserKey();
        var hashedPassword = _securityService.HashPassword(request.Password);

        var user = new User
        {
            Username = request.Username,
            EncryptedEmail = _securityService.Encrypt(request.Email, userKey),
            EncryptedPhone = _securityService.Encrypt(request.Phone, userKey),
            EncryptedPassword = _securityService.Encrypt(hashedPassword, userKey),
            EmailHash = emailHash,
            Key = userKey,
            RoleId = 2,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var id = await _userRepository.CreateUser(user);
        user.Id = id;
        user.RoleName = "User";

        return ApiResponse<UserResponse>.Ok(
            BuildResponse(user, request.Email, request.Phone, request.Password, mask: true),
            "Đăng ký thành công");
    }

    // ── CRUD ───────────────────────────────────────────────────────────────

    public async Task<ApiResponse<PaginatedUserResponse>> GetUsers(bool mask, int skip, int limit)
    {
        var users = await _userRepository.GetUsers(skip, limit);
        var total = await _userRepository.GetUserCount();
        var items = new List<UserResponse>();
        for (int i = 0; i < users.Count; i++)
            items.Add(DecryptAndBuild(users[i], mask));

        return ApiResponse<PaginatedUserResponse>.Ok(new PaginatedUserResponse
        {
            Total = total,
            Skip = skip,
            Limit = limit,
            Items = items
        });
    }

    public async Task<ApiResponse<UserResponse>> GetUserById(int id, bool mask)
    {
        var user = await _userRepository.GetUserById(id);
        if (user == null)
            return ApiResponse<UserResponse>.Fail("Không tìm thấy người dùng");

        return ApiResponse<UserResponse>.Ok(DecryptAndBuild(user, mask));
    }

    public async Task<ApiResponse<string>> UpdateUser(int id, UpdateUserRequest request)
    {
        var existing = await _userRepository.GetUserById(id);
        if (existing == null)
            return ApiResponse<string>.Fail("Không tìm thấy người dùng");

        if (existing.Username != request.Username &&
            await _userRepository.UsernameExists(request.Username, id))
            return ApiResponse<string>.Fail("Username đã tồn tại");

        var oldPasswordHash = existing.EncryptedPassword != null
            ? _securityService.Decrypt(existing.EncryptedPassword, existing.Key)
            : "";

        int newKey = existing.Key;
        string newPasswordHash = oldPasswordHash;

        // Only update password if it's provided and not empty
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            if (!_securityService.VerifyPassword(request.Password, oldPasswordHash))
            {
                newKey = _securityService.GenerateUserKey();
                newPasswordHash = _securityService.HashPassword(request.Password);
            }
        }

        // Kiểm tra email trùng khi update bằng email hash
        var newEmailHash = _securityService.GetEmailHash(request.Email);
        if (existing.EmailHash != newEmailHash)
        {
            // Email đã thay đổi, check xem email mới có bị dùng không
            if (await _userRepository.EmailExists(newEmailHash, id))
                return ApiResponse<string>.Fail("Email đã được sử dụng");
        }

        existing.Username = request.Username;
        existing.EncryptedEmail = _securityService.Encrypt(request.Email, newKey);
        existing.EncryptedPhone = _securityService.Encrypt(request.Phone, newKey);
        existing.EncryptedPassword = _securityService.Encrypt(newPasswordHash, newKey);
        existing.EmailHash = newEmailHash;
        existing.Key = newKey;
        existing.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateUser(existing);
        return ApiResponse<string>.Ok("", "Cập nhật thành công");
    }

    public async Task<ApiResponse<string>> DeleteUser(int id)
    {
        var user = await _userRepository.GetUserById(id);
        if (user == null)
            return ApiResponse<string>.Fail("Không tìm thấy người dùng");

        await _userRepository.DeleteUser(id);
        return ApiResponse<string>.Ok("", "Xóa người dùng thành công");
    }

    public async Task<ApiResponse<string>> SetUserActive(int id, bool isActive)
    {
        var user = await _userRepository.GetUserById(id);
        if (user == null)
            return ApiResponse<string>.Fail("Không tìm thấy người dùng");

        await _userRepository.SetUserActive(id, isActive);
        return ApiResponse<string>.Ok("", isActive ? "Kích hoạt tài khoản thành công" : "Khóa tài khoản thành công");
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private UserResponse DecryptAndBuild(User user, bool mask)
    {
        var email = user.EncryptedEmail != null ? _securityService.Decrypt(user.EncryptedEmail, user.Key) : "";
        var phone = user.EncryptedPhone != null ? _securityService.Decrypt(user.EncryptedPhone, user.Key) : "";

        if (mask)
        {
            email = _dataMaskingService.MaskEmail(email);
            phone = _dataMaskingService.MaskPhone(phone);
        }

        return BuildResponse(user, email, phone, "***", mask: false);
    }

    private static UserResponse BuildResponse(User user, string email, string phone, string password, bool mask) =>
        new()
        {
            Id = user.Id,
            Username = user.Username,
            Email = email,
            Phone = phone,
            Password = "***",
            Role = user.RoleName,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

    public async Task<ApiResponse<string>> PromoteUserToViewer(int id)
    {
        var user = await _userRepository.GetUserById(id);
        if (user == null)
            return ApiResponse<string>.Fail("Không tìm thấy người dùng");

        // Chỉ cho phép promote user từ role User (ID: 2) lên Viewer (ID: 3)
        if (user.RoleId != 2)
            return ApiResponse<string>.Fail("Chỉ có thể nâng cấp user từ role User");

        await _userRepository.UpdateUserRole(id, 3, "Viewer");
        return ApiResponse<string>.Ok("", "Nâng cấp lên Viewer thành công");
    }
}
