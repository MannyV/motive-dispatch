CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE atoz_dispatch_intelligence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dsp_id VARCHAR(50) DEFAULT 'DSP_NY_01',
    location_identifier TEXT UNIQUE NOT NULL,
    structured_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Note: In a production Supabase project you may also want to set RLS policies here
