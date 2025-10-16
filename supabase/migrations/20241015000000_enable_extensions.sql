-- Enable required PostgreSQL extensions
-- Run this FIRST before any other migrations

-- Enable UUID extension for generating UUIDs
create extension if not exists "uuid-ossp";

-- Enable pgcrypto for additional cryptographic functions (optional but useful)
create extension if not exists "pgcrypto";

