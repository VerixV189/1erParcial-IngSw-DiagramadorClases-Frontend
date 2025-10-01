-- Create users profile table for additional user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Create projects table for UML diagrams
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagram_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "projects_select_own" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Create classes table for UML class definitions
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stereotype TEXT, -- <<interface>>, <<abstract>>, etc.
  attributes JSONB DEFAULT '[]', -- Array of {name, type, visibility, isStatic}
  methods JSONB DEFAULT '[]', -- Array of {name, returnType, parameters, visibility, isStatic, isAbstract}
  position JSONB DEFAULT '{"x": 0, "y": 0}', -- Position on canvas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Classes policies (through project ownership)
CREATE POLICY "classes_select_own" ON public.classes FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = classes.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "classes_insert_own" ON public.classes FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = classes.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "classes_update_own" ON public.classes FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = classes.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "classes_delete_own" ON public.classes FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = classes.project_id AND projects.user_id = auth.uid()));

-- Create relationships table for UML relationships
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  target_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('inheritance', 'composition', 'aggregation', 'association', 'dependency', 'realization')),
  source_multiplicity TEXT, -- "1", "0..1", "1..*", "*", etc.
  target_multiplicity TEXT,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on relationships
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Relationships policies (through project ownership)
CREATE POLICY "relationships_select_own" ON public.relationships FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = relationships.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "relationships_insert_own" ON public.relationships FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = relationships.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "relationships_update_own" ON public.relationships FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = relationships.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "relationships_delete_own" ON public.relationships FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = relationships.project_id AND projects.user_id = auth.uid()));

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers to all tables
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER relationships_updated_at BEFORE UPDATE ON public.relationships FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
