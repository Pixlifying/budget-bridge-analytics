
-- Create a storage bucket for uploaded documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Create storage policies for the documents bucket
CREATE POLICY "Anyone can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Anyone can update documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents');

CREATE POLICY "Anyone can delete documents" ON storage.objects
FOR DELETE USING (bucket_id = 'documents');

-- Create a table to store document metadata
CREATE TABLE public.uploaded_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on uploaded_documents table
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for uploaded_documents table
CREATE POLICY "Anyone can view uploaded documents" ON public.uploaded_documents
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert uploaded documents" ON public.uploaded_documents
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update uploaded documents" ON public.uploaded_documents
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete uploaded documents" ON public.uploaded_documents
FOR DELETE USING (true);
