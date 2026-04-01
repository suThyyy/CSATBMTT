using Microsoft.Data.SqlClient;
using UserManagement.Models;

namespace UserManagement.Repositories;

public interface IUserRepository
{
    Task<List<User>> GetUsers(int skip = 0, int limit = 10);
    Task<int> GetUserCount();
    Task<User?> GetUserById(int id);
    Task<User?> GetUserByUsername(string username);
    Task<bool> UsernameExists(string username, int? excludeId = null);
    Task<bool> EmailExists(string emailHash, int? excludeId = null);
    Task<int> CreateUser(User user);
    Task UpdateUser(User user);
    Task DeleteUser(int id);
    Task SetUserActive(int id, bool isActive);
    Task UpdateUserRole(int id, int roleId, string roleName);
}

public class UserRepository : IUserRepository
{
    private readonly string _connectionString;

    private const string BaseQuery = @"
        SELECT u.Id, u.Username, u.EncryptedEmail, u.EncryptedPhone, u.EncryptedPassword,
               u.EmailHash, u.[Key], u.RoleId, r.Name AS RoleName, u.IsActive, u.CreatedAt, u.UpdatedAt
        FROM Users u
        INNER JOIN Roles r ON u.RoleId = r.Id";

    public UserRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new ArgumentNullException("DefaultConnection connection string is missing");
    }

    public async Task<List<User>> GetUsers(int skip = 0, int limit = 10)
    {
        var users = new List<User>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var sql = BaseQuery + " ORDER BY u.Id OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@skip", skip);
        command.Parameters.AddWithValue("@limit", limit);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            users.Add(MapUser(reader));

        return users;
    }

    public async Task<int> GetUserCount()
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var command = new SqlCommand("SELECT COUNT(*) FROM Users", connection);
        return Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    public async Task<User?> GetUserById(int id)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = BaseQuery + " WHERE u.Id = @id";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);
        using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapUser(reader) : null;
    }

    public async Task<User?> GetUserByUsername(string username)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = BaseQuery + " WHERE u.Username = @username";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@username", username);
        using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapUser(reader) : null;
    }

    public async Task<bool> UsernameExists(string username, int? excludeId = null)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var query = "SELECT COUNT(*) FROM Users WHERE Username = @username";
        if (excludeId.HasValue) query += " AND Id != @excludeId";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@username", username);
        if (excludeId.HasValue)
            command.Parameters.AddWithValue("@excludeId", excludeId.Value);
        return Convert.ToInt32(await command.ExecuteScalarAsync()) > 0;
    }

    public async Task<bool> EmailExists(string emailHash, int? excludeId = null)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var query = "SELECT COUNT(*) FROM Users WHERE EmailHash = @emailHash";
        if (excludeId.HasValue) query += " AND Id != @excludeId";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@emailHash", emailHash ?? "" as object);
        if (excludeId.HasValue)
            command.Parameters.AddWithValue("@excludeId", excludeId.Value);
        return Convert.ToInt32(await command.ExecuteScalarAsync()) > 0;
    }

    public async Task<int> CreateUser(User user)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = @"
            INSERT INTO Users (Username, EncryptedEmail, EncryptedPhone, EncryptedPassword, EmailHash, [Key], RoleId, IsActive, CreatedAt, UpdatedAt)
            OUTPUT INSERTED.Id
            VALUES (@username, @email, @phone, @password, @emailHash, @key, @roleId, 1, @createdAt, @updatedAt)";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@username", user.Username);
        command.Parameters.AddWithValue("@email", user.EncryptedEmail);
        command.Parameters.AddWithValue("@phone", user.EncryptedPhone);
        command.Parameters.AddWithValue("@password", user.EncryptedPassword);
        command.Parameters.AddWithValue("@emailHash", user.EmailHash ?? "" as object);
        command.Parameters.AddWithValue("@key", user.Key);
        command.Parameters.AddWithValue("@roleId", user.RoleId);
        command.Parameters.AddWithValue("@createdAt", user.CreatedAt);
        command.Parameters.AddWithValue("@updatedAt", user.UpdatedAt);
        return Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    public async Task UpdateUser(User user)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = @"
            UPDATE Users
            SET Username = @username, EncryptedEmail = @email, EncryptedPhone = @phone,
                EncryptedPassword = @password, EmailHash = @emailHash, [Key] = @key, UpdatedAt = @updatedAt
            WHERE Id = @id";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", user.Id);
        command.Parameters.AddWithValue("@username", user.Username);
        command.Parameters.AddWithValue("@email", user.EncryptedEmail);
        command.Parameters.AddWithValue("@phone", user.EncryptedPhone);
        command.Parameters.AddWithValue("@password", user.EncryptedPassword);
        command.Parameters.AddWithValue("@emailHash", user.EmailHash ?? "" as object);
        command.Parameters.AddWithValue("@key", user.Key);
        command.Parameters.AddWithValue("@updatedAt", user.UpdatedAt);
        await command.ExecuteNonQueryAsync();
    }

    public async Task DeleteUser(int id)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var command = new SqlCommand("DELETE FROM Users WHERE Id = @id", connection);
        command.Parameters.AddWithValue("@id", id);
        await command.ExecuteNonQueryAsync();
    }

    public async Task SetUserActive(int id, bool isActive)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = "UPDATE Users SET IsActive = @isActive, UpdatedAt = @updatedAt WHERE Id = @id";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@isActive", isActive);
        command.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);
        await command.ExecuteNonQueryAsync();
    }

    public async Task UpdateUserRole(int id, int roleId, string roleName)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = "UPDATE Users SET RoleId = @roleId, UpdatedAt = @updatedAt WHERE Id = @id";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@roleId", roleId);
        command.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);
        await command.ExecuteNonQueryAsync();
    }

    private static User MapUser(SqlDataReader r) => new()
    {
        Id = r.GetInt32(0),
        Username = r.GetString(1),
        EncryptedEmail = r.IsDBNull(2) ? null : (byte[])r.GetValue(2),
        EncryptedPhone = r.IsDBNull(3) ? null : (byte[])r.GetValue(3),
        EncryptedPassword = r.IsDBNull(4) ? null : (byte[])r.GetValue(4),
        EmailHash = r.IsDBNull(5) ? null : r.GetString(5),
        Key = r.GetInt32(6),
        RoleId = r.GetInt32(7),
        RoleName = r.GetString(8),
        IsActive = r.GetBoolean(9),
        CreatedAt = r.GetDateTime(10),
        UpdatedAt = r.GetDateTime(11)
    };
}
