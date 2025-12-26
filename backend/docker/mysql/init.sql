-- AviLingo Database Initialization Script
-- This runs automatically when the MySQL container starts for the first time

-- Ensure we're using the correct database
USE avilingo_db;

-- Set character encoding
ALTER DATABASE avilingo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges to the application user
GRANT ALL PRIVILEGES ON avilingo_db.* TO 'avilingo'@'%';
FLUSH PRIVILEGES;

-- Note: Tables are created by Alembic migrations, not here
-- This script is just for initial database setup

