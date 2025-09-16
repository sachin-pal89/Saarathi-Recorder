-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recording_segments ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Customers are visible to all authenticated users
CREATE POLICY "Authenticated users can view customers" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify customers
CREATE POLICY "Admins can modify customers" ON customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can only see their own recordings
CREATE POLICY "Users can view own recordings" ON recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recordings" ON recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings" ON recordings
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can see all recordings
CREATE POLICY "Admins can view all recordings" ON recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Recording segments follow the same rules as recordings
CREATE POLICY "Users can view own recording segments" ON recording_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recordings 
            WHERE id = recording_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own recording segments" ON recording_segments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM recordings 
            WHERE id = recording_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own recording segments" ON recording_segments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM recordings 
            WHERE id = recording_id AND user_id = auth.uid()
        )
    );

-- Admins can see all recording segments
CREATE POLICY "Admins can view all recording segments" ON recording_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' FROM users WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


