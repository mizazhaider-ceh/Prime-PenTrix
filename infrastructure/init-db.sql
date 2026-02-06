-- Initialize pgvector extension and database schema
-- PostgreSQL-specific syntax (not T-SQL)
-- @dialect: postgresql

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for faster vector similarity search
-- Tables will be created by Prisma migrations
