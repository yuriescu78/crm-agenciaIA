-- Migration to add progress and value to tasks for enhanced UI
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC DEFAULT 0;

-- Update existing tasks to have some progress based on status if needed
UPDATE public.tasks SET progress = 100 WHERE status = 'Completada' AND progress = 0;
UPDATE public.tasks SET progress = 50 WHERE status = 'En curso' AND progress = 0;
