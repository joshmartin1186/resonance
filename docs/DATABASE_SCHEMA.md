# Resonance - Database Schema

## Multi-Tenant Architecture

Every table (except auth.users) includes `organization_id` for data isolation.

## Core Tables

### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  
  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing' 
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  subscription_plan TEXT DEFAULT 'free',
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  
  -- Usage tracking
  generations_this_month INTEGER DEFAULT 0,
  generations_limit INTEGER DEFAULT 3,
  
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own org" ON users
  FOR ALL USING (organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));
```

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  audio_duration DECIMAL,
  
  resolution TEXT DEFAULT '1080p',
  style_preference TEXT DEFAULT 'organic',
  footage_visibility DECIMAL DEFAULT 0.6,
  effect_intensity DECIMAL DEFAULT 0.5,
  
  status TEXT DEFAULT 'draft' 
    CHECK (status IN ('draft', 'queued', 'analyzing', 'orchestrating', 'rendering', 'completed', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### generations
```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  
  seed TEXT NOT NULL UNIQUE,
  generation_number INTEGER,
  audio_analysis JSONB,
  visual_plan JSONB,
  
  video_url TEXT,
  thumbnail_url TEXT,
  duration DECIMAL,
  file_size BIGINT,
  render_time_seconds INTEGER,
  
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### system_logs
```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  generation_id UUID REFERENCES generations(id),
  
  action_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'warning', 'error')),
  severity TEXT DEFAULT 'info',
  
  message TEXT NOT NULL,
  details JSONB,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security

Every table has RLS enabled with organization isolation:

```sql
CREATE POLICY "Org isolation" ON {table_name}
  FOR ALL USING (organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));
```