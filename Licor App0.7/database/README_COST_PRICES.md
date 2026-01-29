# Instalación de la Tabla `cost_prices`

## 🎯 Propósito

Este script crea la tabla `cost_prices` necesaria para que el cálculo de **Costo de Mercancía** funcione en el modal de Rentabilidad & Inventario.

## 📋 Paso a Paso

### 1. Abre Supabase Dashboard

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión
3. Selecciona tu proyecto **Licor App**

### 2. Ejecuta el Patch SQL

1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"**
3. Copia todo el contenido del archivo: `patch_create_cost_prices.sql`
4. Pega en el editor
5. Haz clic en **"Run"** o presiona `Ctrl+Enter`

### 3. Verifica la Creación

1. Ve a **"Table Editor"** en el menú lateral
2. Busca la tabla **`cost_prices`**
3. Deberías ver las siguientes columnas:
   - `id` (uuid)
   - `organization_id` (uuid)
   - `product_id` (uuid)
   - `emission` (text)
   - `subtype` (text)
   - `cost` (numeric)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## ✅ Verificación

Para verificar que todo funciona correctamente:

### Opción A: Verificación Manual en Supabase

Ejecuta este query en el SQL Editor:

```sql
-- Verificar que la tabla existe y tiene la estructura correcta
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'cost_prices' 
ORDER BY ordinal_position;
```

Deberías ver 8 filas con las columnas mencionadas arriba.

### Opción B: Verificación en la App

1. Abre tu app Licor
2. Ve a **Inventario**
3. Agrega cualquier producto (ej: 1 Caja de Polar)
4. Debería aparecer un modal pidiendo **"Precio de Costo"**
5. Ingresa un costo de prueba (ej: $20)
6. Confirma y guarda
7. Ve a Supabase → Table Editor → `cost_prices`
8. Deberías ver un registro nuevo

## 🔧 Troubleshooting

### Error: "relation 'organizations' does not exist"

**Solución**: Ejecuta primero los patches de las tablas base:
- `create_organizations.sql`
- `create_products.sql`

### Error: "permission denied for table cost_prices"

**Solución**: Verifica que los permisos se aplicaron correctamente. Re-ejecuta la sección 8 del script:

```sql
GRANT ALL ON public.cost_prices TO postgres;
GRANT ALL ON public.cost_prices TO service_role;
GRANT ALL ON public.cost_prices TO authenticated;
GRANT ALL ON public.cost_prices TO anon;
```

### La tabla existe pero no aparece el modal en la app

**Solución**: 
1. Recarga la página con `Ctrl+F5`
2. Verifica la consola del navegador por errores
3. Verifica que `fetchCostPrices` no tenga errores en la consola

## 📊 Cómo Funciona

Una vez completado:

1. **Cuando agregas inventario**, la app te pedirá el costo
2. **Los costos se guardan** en `cost_prices`
3. **Cuando vendes**, el sistema busca el costo registrado
4. **Calcula proporcionalmente** si vendes en diferente emisión
   - Ejemplo: Si Caja = $20 (36 unidades), Media Caja = $10 (18 unidades)
5. **Muestra en el modal** el total del costo de mercancía vendida

## 📁 Archivos Relacionados

- **SQL Patch**: `patch_create_cost_prices.sql`
- **Código que usa la tabla**: 
  - `src/services/api.js` → `fetchCostPrices()`
  - `src/context/ProductContext.jsx` → `getCostPrice()`
  - `src/components/InventoryFab.jsx` → UI para registrar costos
  - `src/pages/Cash/hooks/useCashAnalytics.js` → Cálculo de COGS

## ❓ Preguntas Frecuentes

**¿Necesito ejecutar esto cada vez?**  
No, solo una vez. La tabla quedará en Supabase permanentemente.

**¿Qué pasa si ya tenía ventas antes?**  
Las ventas antiguas mostrarán costo $0 si no registraste los costos antes. Solo las ventas después de registrar costos mostrarán valores correctos.

**¿Puedo actualizar los costos después?**  
Sí, cuando agregues inventario del mismo producto, puedes actualizar el costo.

**¿Los costos se sincronizan entre dispositivos?**  
Sí, están en Supabase y se sincronizan en tiempo real.
