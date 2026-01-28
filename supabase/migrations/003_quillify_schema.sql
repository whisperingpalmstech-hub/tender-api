-- Create humanizer_usage table
CREATE TABLE IF NOT EXISTS public.humanizer_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_name TEXT,
    char_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for humanizer_usage
ALTER TABLE public.humanizer_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own usage" 
ON public.humanizer_usage FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage" 
ON public.humanizer_usage FOR SELECT 
USING (auth.uid() = user_id);

-- Create subscriptions table (simple mock for now)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    plan_type TEXT DEFAULT 'free', -- 'free', 'premium'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their subscription" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Function to handle new user signup (auto-create free subscription)
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type)
  VALUES (new.id, 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_subscription();
