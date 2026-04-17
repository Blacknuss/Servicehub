CREATE DATABASE ServiceHub;
GO
USE ServiceHub;
GO

CREATE LOGIN SH_Admin WITH PASSWORD = 'ServiceHub123!';
CREATE USER SH_Admin FOR LOGIN SH_Admin;
ALTER ROLE db_owner ADD MEMBER SH_Admin;
GO


CREATE TABLE Users (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    FullName      NVARCHAR(100)  NOT NULL,
    Email         NVARCHAR(150)  NOT NULL UNIQUE,
    Phone         NVARCHAR(20),
    PasswordHash  NVARCHAR(255)  NOT NULL,
    Role          NVARCHAR(20)   NOT NULL DEFAULT 'client',
    CreatedAt     DATETIME2      NOT NULL DEFAULT GETDATE(),
    IsVerified    BIT            NOT NULL DEFAULT 0
);
GO