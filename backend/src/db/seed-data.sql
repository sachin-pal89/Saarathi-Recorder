-- Insert sample customers into the database
INSERT INTO customers (id, name, email, address, lending_status) VALUES 
    ('10000000-0000-0000-0000-000000000001', 'John Doe', 'john.doe@email.com', '123 Main Street, Downtown, City 12345', 'active'),
    ('10000000-0000-0000-0000-000000000002', 'Jane Smith', 'jane.smith@email.com', '456 Oak Avenue, Midtown, City 12345', 'pending'),
    ('10000000-0000-0000-0000-000000000003', 'Bob Johnson', 'bob.johnson@email.com', '789 Pine Road, Uptown, City 12345', 'inactive'),
    ('10000000-0000-0000-0000-000000000004', 'Alice Brown', 'alice.brown@email.com', '321 Elm Street, Eastside, City 12345', 'active'),
    ('10000000-0000-0000-0000-000000000005', 'Charlie Wilson', 'charlie.wilson@email.com', '654 Maple Drive, Westside, City 12345', 'pending'),
    ('10000000-0000-0000-0000-000000000006', 'Diana Prince', 'diana.prince@email.com', '987 Cedar Lane, Northside, City 12345', 'active'),
    ('10000000-0000-0000-0000-000000000007', 'Ethan Hunt', 'ethan.hunt@email.com', '147 Birch Court, Southside, City 12345', 'inactive'),
    ('10000000-0000-0000-0000-000000000008', 'Fiona Green', 'fiona.green@email.com', '258 Spruce Street, Central, City 12345', 'pending'),
    ('10000000-0000-0000-0000-000000000009', 'George Miller', 'george.miller@email.com', '369 Willow Way, Riverside, City 12345', 'active'),
    ('10000000-0000-0000-0000-000000000010', 'Helen Davis', 'helen.davis@email.com', '741 Poplar Place, Lakeside, City 12345', 'pending')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, email, name, role) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@saarathi.com', 'Admin User', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'agent@saarathi.com', 'Field Agent', 'user'),
    ('00000000-0000-0000-0000-000000000003', 'demo@saarathi.com', 'Demo User', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert sample recordings
INSERT INTO recordings (id, user_id, customer_id, purpose, recorded_on, duration_sec, mime, file_path) VALUES 
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Initial consultation', NOW() - INTERVAL '2 days', 180, 'audio/mp4', 'recordings/demo/10000000-0000-0000-0000-000000000001/2024-09-13/20000000-0000-0000-0000-000000000001/recording.m4a'),
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Follow-up call', NOW() - INTERVAL '1 day', 240, 'audio/webm', 'recordings/demo/10000000-0000-0000-0000-000000000002/2024-09-14/20000000-0000-0000-0000-000000000002/recording.webm'),
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Loan application review', NOW() - INTERVAL '3 hours', 300, 'audio/mp4', 'recordings/demo/10000000-0000-0000-0000-000000000004/2024-09-15/20000000-0000-0000-0000-000000000003/recording.m4a')
ON CONFLICT (id) DO NOTHING;


