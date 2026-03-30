using Microsoft.Data.SqlClient;
using UserManagement.Models;

namespace UserManagement.Repositories;

public interface IMaskingConfigRepository
{
    Task<MaskingConfig?> GetConfig();
    Task UpdateConfig(bool enabled, MaskingAlgorithm algorithm);
}

public class MaskingConfigRepository : IMaskingConfigRepository
{
    private readonly string _connectionString;

    public MaskingConfigRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new ArgumentNullException("DefaultConnection connection string is missing");
    }

    public async Task<MaskingConfig?> GetConfig()
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var sql = "SELECT TOP 1 Id, Enabled, Algorithm, CreatedAt, UpdatedAt FROM MaskingConfig ORDER BY Id DESC";
        using var command = new SqlCommand(sql, connection);
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

    public async Task UpdateConfig(bool enabled, MaskingAlgorithm algorithm)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Kiểm tra xem đã có config chưa
        var existingConfig = await GetConfig();

        if (existingConfig != null)
        {
            // Update existing config
            var sql = @"
                UPDATE MaskingConfig
                SET Enabled = @enabled, Algorithm = @algorithm, UpdatedAt = @updatedAt
                WHERE Id = @id";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", existingConfig.Id);
            command.Parameters.AddWithValue("@enabled", enabled);
            command.Parameters.AddWithValue("@algorithm", (int)algorithm);
            command.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);
            await command.ExecuteNonQueryAsync();
        }
        else
        {
            // Insert new config
            var sql = @"
                INSERT INTO MaskingConfig (Enabled, Algorithm, CreatedAt, UpdatedAt)
                VALUES (@enabled, @algorithm, @createdAt, @updatedAt)";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@enabled", enabled);
            command.Parameters.AddWithValue("@algorithm", (int)algorithm);
            command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);
            command.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);
            await command.ExecuteNonQueryAsync();
        }
    }
}
