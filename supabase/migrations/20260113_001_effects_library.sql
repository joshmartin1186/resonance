-- Effect Library Schema for Resonance
-- Phase 4: Effect Library & Rendering

-- Effect categories enum-like table
CREATE TABLE effect_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed effect categories
INSERT INTO effect_categories (id, name, description, icon, sort_order) VALUES
  ('geometric', 'Geometric', 'Scale, rotate, translate, mirror, kaleidoscope effects', 'shapes', 1),
  ('distortion', 'Distortion', 'Wave, ripple, twirl, pixelate, glitch effects', 'zap', 2),
  ('color', 'Color', 'Hue shift, saturation, contrast, gradient effects', 'palette', 3),
  ('blur', 'Blur & Focus', 'Gaussian, motion blur, radial blur, depth of field', 'eye-off', 4),
  ('pattern', 'Pattern Overlay', 'Noise, scanlines, vignette, grain effects', 'grid', 5);

-- Main effects table
CREATE TABLE effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES effect_categories(id) NOT NULL,

  -- FFmpeg configuration
  ffmpeg_filter TEXT NOT NULL, -- e.g., "hue=h={{hue}}:s={{saturation}}"

  -- Parameters schema (JSON array of parameter definitions)
  parameters JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"name": "hue", "type": "number", "min": 0, "max": 360, "default": 0}]

  -- Audio sync configuration (which audio features can drive this effect)
  audio_sync_options JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"parameter": "hue", "features": ["pitch", "spectral_centroid"], "mappings": ["linear", "exponential"]}]

  -- Rendering info
  layer_types TEXT[] DEFAULT ARRAY['footage', 'generative']::TEXT[],
  requires_gpu BOOLEAN DEFAULT false,
  render_complexity INTEGER DEFAULT 1 CHECK (render_complexity BETWEEN 1 AND 5),

  -- Preview
  preview_thumbnail_url TEXT,
  preview_video_url TEXT,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_effects_category ON effects(category_id);
CREATE INDEX idx_effects_slug ON effects(slug);
CREATE INDEX idx_effects_active ON effects(is_active) WHERE is_active = true;
CREATE INDEX idx_effects_tags ON effects USING GIN(tags);

-- Effect presets (saved parameter combinations)
CREATE TABLE effect_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effect_id UUID REFERENCES effects(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id),

  name TEXT NOT NULL,
  description TEXT,

  -- Saved parameter values
  parameters JSONB NOT NULL, -- {"hue": 180, "saturation": 1.2}

  -- Audio sync settings
  audio_sync JSONB, -- {"hue": {"feature": "pitch", "mapping": "linear", "min": 0, "max": 360}}

  is_system_preset BOOLEAN DEFAULT false, -- System presets have NULL organization_id
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_presets_effect ON effect_presets(effect_id);
CREATE INDEX idx_presets_org ON effect_presets(organization_id);

-- Seed some initial effects

-- GEOMETRIC EFFECTS
INSERT INTO effects (name, slug, description, category_id, ffmpeg_filter, parameters, audio_sync_options, tags) VALUES
(
  'Scale',
  'scale',
  'Zoom in or out on the video',
  'geometric',
  'scale=w={{width}}:h={{height}}',
  '[{"name": "width", "type": "number", "min": 100, "max": 4000, "default": 1920},
    {"name": "height", "type": "number", "min": 100, "max": 4000, "default": 1080}]',
  '[{"parameter": "width", "features": ["energy", "rms"], "mappings": ["linear"]}]',
  ARRAY['zoom', 'size', 'resize']
),
(
  'Rotate',
  'rotate',
  'Rotate the video by degrees',
  'geometric',
  'rotate={{angle}}*PI/180',
  '[{"name": "angle", "type": "number", "min": -360, "max": 360, "default": 0}]',
  '[{"parameter": "angle", "features": ["tempo", "spectral_centroid"], "mappings": ["linear", "oscillate"]}]',
  ARRAY['spin', 'turn', 'rotation']
),
(
  'Mirror',
  'mirror',
  'Mirror the video horizontally or vertically',
  'geometric',
  'hflip={{horizontal}},vflip={{vertical}}',
  '[{"name": "horizontal", "type": "boolean", "default": true},
    {"name": "vertical", "type": "boolean", "default": false}]',
  '[]',
  ARRAY['flip', 'reflect', 'symmetry']
),
(
  'Kaleidoscope',
  'kaleidoscope',
  'Create kaleidoscope effect with multiple reflections',
  'geometric',
  'v360=input=e:output=e:roll={{roll}}:pitch={{pitch}},split=4[a][b][c][d];[a]hflip[ah];[b]vflip[bv];[c]hflip,vflip[cv];[ah][bv][cv][d]hstack=4',
  '[{"name": "roll", "type": "number", "min": 0, "max": 360, "default": 0},
    {"name": "pitch", "type": "number", "min": -90, "max": 90, "default": 0}]',
  '[{"parameter": "roll", "features": ["pitch", "spectral_centroid"], "mappings": ["linear", "oscillate"]}]',
  ARRAY['mirror', 'psychedelic', 'symmetry']
);

-- DISTORTION EFFECTS
INSERT INTO effects (name, slug, description, category_id, ffmpeg_filter, parameters, audio_sync_options, tags) VALUES
(
  'Wave Distortion',
  'wave',
  'Apply wave distortion effect',
  'distortion',
  'geq=lum_expr=''lum(X+{{amplitude}}*sin(2*PI*Y/{{wavelength}}),Y)''',
  '[{"name": "amplitude", "type": "number", "min": 0, "max": 50, "default": 10},
    {"name": "wavelength", "type": "number", "min": 10, "max": 200, "default": 50}]',
  '[{"parameter": "amplitude", "features": ["energy", "rms"], "mappings": ["linear", "exponential"]}]',
  ARRAY['wobble', 'wavy', 'liquid']
),
(
  'Pixelate',
  'pixelate',
  'Reduce resolution for pixelated effect',
  'distortion',
  'scale=w=iw/{{factor}}:h=ih/{{factor}},scale=w={{factor}}*iw:h={{factor}}*ih:flags=neighbor',
  '[{"name": "factor", "type": "number", "min": 2, "max": 32, "default": 8}]',
  '[{"parameter": "factor", "features": ["energy", "transients"], "mappings": ["inverse", "threshold"]}]',
  ARRAY['8bit', 'retro', 'blocky']
),
(
  'Glitch',
  'glitch',
  'Digital glitch distortion effect',
  'distortion',
  'noise=alls={{noise_strength}}:allf=t,rgbashift=rh={{shift}}:bh=-{{shift}}',
  '[{"name": "noise_strength", "type": "number", "min": 0, "max": 100, "default": 20},
    {"name": "shift", "type": "number", "min": 0, "max": 20, "default": 5}]',
  '[{"parameter": "noise_strength", "features": ["transients", "energy"], "mappings": ["threshold", "linear"]}]',
  ARRAY['digital', 'error', 'vhs', 'corrupt']
);

-- COLOR EFFECTS
INSERT INTO effects (name, slug, description, category_id, ffmpeg_filter, parameters, audio_sync_options, tags) VALUES
(
  'Hue Rotate',
  'hue-rotate',
  'Shift colors around the color wheel',
  'color',
  'hue=h={{hue}}',
  '[{"name": "hue", "type": "number", "min": -180, "max": 180, "default": 0}]',
  '[{"parameter": "hue", "features": ["pitch", "spectral_centroid", "key"], "mappings": ["linear", "exponential"]}]',
  ARRAY['color', 'shift', 'rainbow']
),
(
  'Saturation',
  'saturation',
  'Adjust color saturation',
  'color',
  'eq=saturation={{saturation}}',
  '[{"name": "saturation", "type": "number", "min": 0, "max": 3, "default": 1}]',
  '[{"parameter": "saturation", "features": ["energy", "rms"], "mappings": ["linear"]}]',
  ARRAY['vivid', 'desaturate', 'gray']
),
(
  'Brightness/Contrast',
  'brightness-contrast',
  'Adjust brightness and contrast',
  'color',
  'eq=brightness={{brightness}}:contrast={{contrast}}',
  '[{"name": "brightness", "type": "number", "min": -1, "max": 1, "default": 0},
    {"name": "contrast", "type": "number", "min": 0, "max": 2, "default": 1}]',
  '[{"parameter": "brightness", "features": ["energy", "rms"], "mappings": ["linear"]},
    {"parameter": "contrast", "features": ["spectral_contrast"], "mappings": ["linear"]}]',
  ARRAY['light', 'dark', 'exposure']
),
(
  'Color Invert',
  'invert',
  'Invert all colors (negative)',
  'color',
  'negate',
  '[]',
  '[]',
  ARRAY['negative', 'inverse', 'flip']
);

-- BLUR EFFECTS
INSERT INTO effects (name, slug, description, category_id, ffmpeg_filter, parameters, audio_sync_options, tags) VALUES
(
  'Gaussian Blur',
  'blur',
  'Smooth gaussian blur',
  'blur',
  'gblur=sigma={{sigma}}',
  '[{"name": "sigma", "type": "number", "min": 0, "max": 50, "default": 5}]',
  '[{"parameter": "sigma", "features": ["energy", "rms"], "mappings": ["inverse", "threshold"]}]',
  ARRAY['soft', 'smooth', 'dreamy']
),
(
  'Motion Blur',
  'motion-blur',
  'Directional motion blur',
  'blur',
  'avgblur=sizeX={{amount}}:sizeY=1',
  '[{"name": "amount", "type": "number", "min": 0, "max": 100, "default": 10}]',
  '[{"parameter": "amount", "features": ["tempo", "transients"], "mappings": ["linear"]}]',
  ARRAY['speed', 'movement', 'action']
),
(
  'Radial Blur',
  'radial-blur',
  'Circular blur from center',
  'blur',
  'zoompan=z={{zoom}}:d=1:x=iw/2:y=ih/2,gblur=sigma={{blur}}',
  '[{"name": "zoom", "type": "number", "min": 1, "max": 2, "default": 1.1},
    {"name": "blur", "type": "number", "min": 0, "max": 20, "default": 5}]',
  '[{"parameter": "zoom", "features": ["energy", "rms"], "mappings": ["linear"]}]',
  ARRAY['zoom', 'spiral', 'focus']
);

-- PATTERN EFFECTS
INSERT INTO effects (name, slug, description, category_id, ffmpeg_filter, parameters, audio_sync_options, tags) VALUES
(
  'Film Grain',
  'grain',
  'Add film grain texture',
  'pattern',
  'noise=alls={{amount}}:allf=t',
  '[{"name": "amount", "type": "number", "min": 0, "max": 50, "default": 10}]',
  '[{"parameter": "amount", "features": ["energy"], "mappings": ["linear"]}]',
  ARRAY['film', 'texture', 'vintage', 'analog']
),
(
  'Vignette',
  'vignette',
  'Darken edges for vintage look',
  'pattern',
  'vignette=angle={{angle}}:mode=backward',
  '[{"name": "angle", "type": "number", "min": 0, "max": 1.5, "default": 0.5}]',
  '[{"parameter": "angle", "features": ["energy"], "mappings": ["inverse"]}]',
  ARRAY['border', 'frame', 'vintage', 'focus']
),
(
  'Scanlines',
  'scanlines',
  'CRT monitor scanline effect',
  'pattern',
  'drawgrid=w=0:h={{spacing}}:t=1:c=black@{{opacity}}',
  '[{"name": "spacing", "type": "number", "min": 2, "max": 10, "default": 4},
    {"name": "opacity", "type": "number", "min": 0, "max": 1, "default": 0.3}]',
  '[]',
  ARRAY['crt', 'retro', 'tv', 'lines']
);

-- Add RLS policies
ALTER TABLE effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE effect_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE effect_presets ENABLE ROW LEVEL SECURITY;

-- Effects and categories are readable by everyone (public library)
CREATE POLICY "Effects are public" ON effects FOR SELECT USING (true);
CREATE POLICY "Categories are public" ON effect_categories FOR SELECT USING (true);

-- Presets: users can see system presets or their own org's presets
CREATE POLICY "Presets visibility" ON effect_presets
  FOR SELECT USING (
    is_system_preset = true
    OR organization_id IS NULL
    OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Only authenticated users in their org can create presets
CREATE POLICY "Presets insert" ON effect_presets
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Presets update" ON effect_presets
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Presets delete" ON effect_presets
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER effects_updated_at
  BEFORE UPDATE ON effects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER effect_presets_updated_at
  BEFORE UPDATE ON effect_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
