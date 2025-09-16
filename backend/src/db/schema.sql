-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    address TEXT,
    lending_status TEXT DEFAULT 'pending' CHECK (lending_status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    recorded_on TIMESTAMPTZ NOT NULL,
    duration_sec INTEGER DEFAULT 0,
    mime TEXT NOT NULL,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recording_segments table
CREATE TABLE IF NOT EXISTS recording_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    index INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    mime TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recording_id, index)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_customer_id ON recordings(customer_id);
CREATE INDEX IF NOT EXISTS idx_recordings_recorded_on ON recordings(recorded_on);
CREATE INDEX IF NOT EXISTS idx_recording_segments_recording_id ON recording_segments(recording_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (id, email, name, role) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@saarathi.com', 'Admin User', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'agent@saarathi.com', 'Field Agent', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO customers (id, name, email, address, lending_status) VALUES 
    ('10000000-0000-0000-0000-000000000001', 'John Doe', 'john.doe@email.com', '123 Main St, City, State 12345', 'active'),
    ('10000000-0000-0000-0000-000000000002', 'Jane Smith', 'jane.smith@email.com', '456 Oak Ave, City, State 12345', 'pending'),
    ('10000000-0000-0000-0000-000000000003', 'Bob Johnson', 'bob.johnson@email.com', '789 Pine Rd, City, State 12345', 'inactive'),
    ('10000000-0000-0000-0000-000000000004', 'Alice Brown', 'alice.brown@email.com', '321 Elm St, City, State 12345', 'active'),
    ('10000000-0000-0000-0000-000000000005', 'Charlie Wilson', 'charlie.wilson@email.com', '654 Maple Dr, City, State 12345', 'pending')
ON CONFLICT (id) DO NOTHING;


