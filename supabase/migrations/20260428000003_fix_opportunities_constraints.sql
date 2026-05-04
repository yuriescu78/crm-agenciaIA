
-- Eliminar restricción de etapa antigua si existe para permitir las nuevas etapas de preventa
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_stage_check;

-- Añadir la restricción con los valores correctos usados en el frontend
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_stage_check 
CHECK (stage IN (
  'Nuevo lead',
  'Contactado',
  'Reunión agendada',
  'Diagnóstico',
  'Propuesta en preparación',
  'Propuesta enviada',
  'Negociación',
  'Ganada',
  'Perdida'
));
