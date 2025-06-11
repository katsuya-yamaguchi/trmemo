-- Create body_stats table for weight and body fat percentage tracking
CREATE TABLE IF NOT EXISTS body_stats (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight <= 999.99),
    body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    recorded_at DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Ensure one record per user per date
    UNIQUE(user_id, recorded_at)
);

-- Create indexes for better query performance
CREATE INDEX idx_body_stats_user_id ON body_stats(user_id);
CREATE INDEX idx_body_stats_recorded_at ON body_stats(recorded_at);
CREATE INDEX idx_body_stats_user_recorded ON body_stats(user_id, recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE body_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own body stats" ON body_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body stats" ON body_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body stats" ON body_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body stats" ON body_stats
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_body_stats_updated_at
--     BEFORE UPDATE ON body_stats
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- -- Grant permissions
-- GRANT ALL ON body_stats TO authenticated;
-- GRANT USAGE ON SEQUENCE body_stats_id_seq TO authenticated;