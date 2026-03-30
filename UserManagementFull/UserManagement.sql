-- =============================================
-- UserManagement Database Setup Script
-- SQL Server
-- =============================================

CREATE DATABASE UserManagement;
GO

USE UserManagement;
GO

-- Roles table
CREATE TABLE Roles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(200)
);

-- Users table
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    EncryptedEmail VARBINARY(MAX),
    EncryptedPhone VARBINARY(MAX),
    EncryptedPassword VARBINARY(MAX),
    [Key] INT NOT NULL,
    RoleId INT NOT NULL DEFAULT 2,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);

-- Masking Configuration table (for Admin to control masking for Viewers)
CREATE TABLE MaskingConfig (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Enabled BIT NOT NULL DEFAULT 1,
    Algorithm INT NOT NULL DEFAULT 1,  -- 1=CharacterMasking, 2=DataShuffling, 3=DataSubstitution, 4=NoiseAddition
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Seed roles
INSERT INTO Roles (Name, Description) VALUES ('Admin', 'System administrator with full access');
INSERT INTO Roles (Name, Description) VALUES ('User', 'Regular user with limited access');
INSERT INTO Roles (Name, Description) VALUES ('Viewer', 'Read-only access, cannot edit data');
GO

-- Seed default masking configuration
INSERT INTO MaskingConfig (Enabled, Algorithm, CreatedAt, UpdatedAt) 
VALUES (1, 1, GETUTCDATE(), GETUTCDATE());
GO
