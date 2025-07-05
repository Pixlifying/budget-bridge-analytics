
-- Create a table for user admin settings
CREATE TABLE public.user_admin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.user_admin ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is a simple authentication system)
CREATE POLICY "Allow all operations on user_admin" 
  ON public.user_admin 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at column
CREATE TRIGGER update_user_admin_updated_at
  BEFORE UPDATE ON public.user_admin
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user
INSERT INTO public.user_admin (username, email) 
VALUES ('admin', 'cscrspura@gmail.com');
