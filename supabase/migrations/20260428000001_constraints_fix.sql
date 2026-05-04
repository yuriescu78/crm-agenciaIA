
-- Eliminar restricción de estado antigua si existe para permitir los nuevos estados
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_status_check;

-- Hacer el email único
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_email_key;
ALTER TABLE public.clients ADD CONSTRAINT clients_email_key UNIQUE (email);

-- Hacer la combinación de nombre y apellidos única
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_name_unique;
ALTER TABLE public.clients ADD CONSTRAINT clients_name_unique UNIQUE (first_name, last_name);
