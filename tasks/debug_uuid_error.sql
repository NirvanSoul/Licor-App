-- Verificación de la tabla profiles para el usuario actual
SELECT id, email, role, organization_id 
FROM public.profiles 
WHERE id = auth.uid();

-- Verificación de la estructura de la tabla orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';
