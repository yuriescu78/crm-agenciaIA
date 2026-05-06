-- Migration: Add Google Drive support to clients and documents
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS google_drive_folder_id text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS google_drive_id text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS google_drive_link text;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.google_drive_folder_id IS 'ID of the specific Google Drive folder for this client';
COMMENT ON COLUMN public.documents.google_drive_id IS 'Google Drive File ID';
COMMENT ON COLUMN public.documents.google_drive_link IS 'Direct link to the file in Google Drive';

ALTER TABLE public.documents ADD CONSTRAINT documents_google_drive_id_key UNIQUE (google_drive_id);

