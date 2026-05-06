-- Migration: Remove restrictive constraints from documents table
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_type_check;

-- Ensure google_drive_id has a unique index for upsert to work correctly
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'documents' AND indexname = 'documents_google_drive_id_idx') THEN
        CREATE UNIQUE INDEX documents_google_drive_id_idx ON public.documents (google_drive_id);
    END IF;
END $$;
