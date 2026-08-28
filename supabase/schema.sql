-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (public profile for auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);

-- 2. Documents Table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content_json JSONB DEFAULT '{}'::jsonb,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger for immutability of document id and owner_id
CREATE OR REPLACE FUNCTION check_document_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id != OLD.id THEN
    RAISE EXCEPTION 'Cannot change document id';
  END IF;
  IF NEW.owner_id != OLD.owner_id THEN
    RAISE EXCEPTION 'Cannot change document owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_document_immutable_fields
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION check_document_update();

-- 3. Document Shares Table
CREATE TABLE public.document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- 4. Helper Function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_document_access(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT document_id FROM document_shares WHERE user_id = uid;
$$;

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents owner all access" 
ON public.documents 
FOR ALL 
USING (owner_id = auth.uid()) 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Shared users can select documents" 
ON public.documents 
FOR SELECT 
USING (id IN (SELECT has_document_access(auth.uid())));

CREATE POLICY "Shared users can update documents" 
ON public.documents 
FOR UPDATE 
USING (id IN (SELECT has_document_access(auth.uid()))) 
WITH CHECK (id IN (SELECT has_document_access(auth.uid())));

-- Enable RLS on document_shares
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document owners can select shares" 
ON public.document_shares 
FOR SELECT 
USING (
  document_id IN (
    SELECT id FROM public.documents WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Document owners can insert shares" 
ON public.document_shares 
FOR INSERT 
WITH CHECK (
  document_id IN (
    SELECT id FROM public.documents WHERE owner_id = auth.uid()
  )
  AND shared_by = auth.uid()
  AND user_id <> auth.uid()
);

CREATE POLICY "Document owners can delete shares" 
ON public.document_shares 
FOR DELETE 
USING (
  document_id IN (
    SELECT id FROM public.documents WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Shared users can view their own shares" 
ON public.document_shares 
FOR SELECT 
USING (user_id = auth.uid());
