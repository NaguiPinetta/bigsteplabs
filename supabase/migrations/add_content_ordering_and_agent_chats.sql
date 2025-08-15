-- =====================================================
-- ADD CONTENT ORDERING AND AGENT CHATS
-- =====================================================

-- Add order_index to lessons table if it doesn't exist
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create unit_content_items table to handle both lessons and agent chats
CREATE TABLE IF NOT EXISTS unit_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'agent_chat')),
  content_id UUID, -- References lessons.id or agents.id
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for unit_content_items
CREATE INDEX IF NOT EXISTS idx_unit_content_items_unit_id ON unit_content_items(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_content_items_content_type ON unit_content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_unit_content_items_order_index ON unit_content_items(order_index);
CREATE INDEX IF NOT EXISTS idx_unit_content_items_is_published ON unit_content_items(is_published);

-- Create updated_at trigger for unit_content_items
CREATE OR REPLACE FUNCTION update_unit_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unit_content_items_updated_at_trigger
  BEFORE UPDATE ON unit_content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_content_items_updated_at();

-- Enable RLS on unit_content_items
ALTER TABLE unit_content_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for unit_content_items
CREATE POLICY "Users can view published unit content items" ON unit_content_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin full access to unit content items" ON unit_content_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'Admin'
    )
  );

-- Grant permissions
GRANT ALL ON unit_content_items TO authenticated;

-- Add order_index to unit_agents table if it doesn't exist
ALTER TABLE unit_agents ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create index for unit_agents order_index
CREATE INDEX IF NOT EXISTS idx_unit_agents_order_index ON unit_agents(order_index);

-- Create function to reorder content items
CREATE OR REPLACE FUNCTION reorder_unit_content_items(
  p_unit_id UUID,
  p_content_type TEXT,
  p_item_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  item_id UUID;
  new_order INTEGER := 0;
BEGIN
  -- Update order_index for each item in the provided order
  FOREACH item_id IN ARRAY p_item_ids
  LOOP
    UPDATE unit_content_items 
    SET order_index = new_order
    WHERE unit_id = p_unit_id 
    AND content_type = p_content_type 
    AND id = item_id;
    
    new_order := new_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to reorder modules
CREATE OR REPLACE FUNCTION reorder_modules(p_module_ids UUID[])
RETURNS VOID AS $$
DECLARE
  module_id UUID;
  new_order INTEGER := 0;
BEGIN
  -- Update order_index for each module in the provided order
  FOREACH module_id IN ARRAY p_module_ids
  LOOP
    UPDATE modules 
    SET order_index = new_order
    WHERE id = module_id;
    
    new_order := new_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to reorder units within a module
CREATE OR REPLACE FUNCTION reorder_units(p_unit_ids UUID[])
RETURNS VOID AS $$
DECLARE
  unit_id UUID;
  new_order INTEGER := 0;
BEGIN
  -- Update order_index for each unit in the provided order
  FOREACH unit_id IN ARRAY p_unit_ids
  LOOP
    UPDATE units 
    SET order_index = new_order
    WHERE id = unit_id;
    
    new_order := new_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on reorder functions
GRANT EXECUTE ON FUNCTION reorder_unit_content_items(UUID, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_modules(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_units(UUID[]) TO authenticated;

-- Verify the changes
SELECT 
  'Tables Updated' as check_type,
  COUNT(*) as table_count,
  '✅ unit_content_items table created, order_index added to lessons and unit_agents' as status
FROM information_schema.tables 
WHERE table_name IN ('unit_content_items') 
AND table_schema = 'public';

-- Success message
SELECT '✅ Content ordering and Agent Chat support added successfully!' as status; 