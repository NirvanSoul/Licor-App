# INSTRUCCIONES PASO A PASO - Arreglo Definitivo RLS

## ⚠️ PROBLEMA
El fix anterior todavía causaba recursión porque cualquier lectura de `profiles` dentro de una política de `profiles` causa un bucle infinito en PostgreSQL.

## ✅ SOLUCIÓN DEFINITIVA

He creado una solución completamente nueva que:
1. **Solo permite** que los usuarios lean su propio perfil (sin subqueries)
2. Usa una **función SECURITY DEFINER** para leer otros perfiles de la organización
3. Actualiza el código de la app para usar esta función

---

## 📋 PASOS A SEGUIR (EN ORDEN)

### Paso 1: Ejecuta el nuevo fix de RLS

1. Abre Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de: **`fix_rls_recursion_v2.sql`**
3. Haz clic en **Run**

**Qué hace este script:**
- Elimina TODAS las políticas problemáticas
- Crea solo UNA política simple: usuarios leen su propio perfil
- No hay más recursión porque no hay subqueries

---

### Paso 2: Agrega la función para obtener miembros

1. Mantente en SQL Editor de Supabase
2. Copia y pega el contenido de: **`add_get_org_members_function.sql`**
3. Haz clic en **Run**

**Qué hace este script:**
- Crea una función `get_organization_members(org_id)` 
- Usa `SECURITY DEFINER` para saltarse RLS de forma segura
- La app usará esta función en lugar de consultar directamente `profiles`

---

### Paso 3: Verifica que funcione

1. **Cierra completamente tu navegador** (no solo la pestaña)
2. Abre el navegador de nuevo
3. Ve a tu app: http://localhost:5173 (o el puerto que uses)
4. Inicia sesión con tu cuenta OWNER
5. Abre la consola (F12 → Console)

**Deberías ver:**
```
✅ [AuthContext] Profile data received: { role: "OWNER", organization_id: "abc-123..." }
✅ [AuthContext] Setting role: OWNER
✅ [AuthContext] Setting organizationId: abc-123...
🎯 [UsersSection] Render - role: OWNER organizationId: abc-123... loading: false
```

6. Ve a **Ajustes → Usuarios**
7. Deberías ver:
   - ✅ Tarjeta naranja con el código de organización
   - ✅ Lista de empleados
   - ✅ Tab de solicitudes pendientes

---

## 🔧 CAMBIOS REALIZADOS

### Archivos SQL nuevos:
- `fix_rls_recursion_v2.sql` - Fix definitivo de RLS
- `add_get_org_members_function.sql` - Función para obtener miembros

### Archivos de código actualizados:
- `UsersSection.jsx` - Ahora usa `supabase.rpc('get_organization_members')` en vez de consulta directa

---

## ❓ SI SIGUE SIN FUNCIONAR

1. Verifica en Supabase → Authentication → Users que tu usuario tenga:
   - Un perfil en la tabla `profiles`
   - `role` = "OWNER"
   - `organization_id` no sea null

2. Verifica en Supabase → Table Editor → organizations:
   - Existe una organización con ese ID
   - Tiene un `code` de 6 caracteres

3. Envíame captura de:
   - La consola del navegador (todos los logs)
   - Los datos de tu usuario en Supabase (tabla profiles)
   - Los datos de tu organización en Supabase (tabla organizations)

---

## 🎯 POR QUÉ ESTA SOLUCIÓN FUNCIONA

El problema con los fixes anteriores era que intentaban leer de `profiles` dentro de políticas de `profiles`:

```sql
-- ❌ ESTO CAUSA RECURSIÓN INFINITA (incluso con LIMIT 1)
CREATE POLICY "policy_name" ON profiles
USING (
    organization_id = (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
```

La nueva solución:
```sql
-- ✅ ESTO NO CAUSA RECURSIÓN
CREATE POLICY "users_read_own_profile" ON profiles
USING (auth.uid() = id);  -- Simple comparación, sin subquery
```

Y para leer otros perfiles, usamos una función con `SECURITY DEFINER` que se ejecuta con privilegios elevados y saltea RLS completamente.
