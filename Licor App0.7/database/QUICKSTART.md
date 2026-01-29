# 🚀 INICIO RÁPIDO - Orden de Ejecución

## ⚠️ IMPORTANTE: Sigue este orden exacto

### 1️⃣ PRIMERO: Ejecutar el Patch Principal (OBLIGATORIO)

**Archivo**: `patch_create_cost_prices.sql`

**Pasos**:
1. Abre Supabase → SQL Editor → New Query
2. Copia **TODO** el contenido de `patch_create_cost_prices.sql`
3. Pega y ejecuta (Run / Ctrl+Enter)
4. Deberías ver: "Success. No rows returned"

✅ Esto crea la tabla `cost_prices` en tu base de datos.

---

### 2️⃣ SEGUNDO: Verificar que Funcionó (RECOMENDADO)

**Archivo**: `verify_cost_prices.sql`

**Pasos**:
1. Abre Supabase → SQL Editor → New Query
2. Copia **TODO** el contenido de `verify_cost_prices.sql`
3. Pega y ejecuta
4. Verás varios resultados mostrando ✅ en cada check

✅ Esto confirma que la tabla está correctamente configurada.

---

### 3️⃣ TERCERO: Registrar Costos en la App (OBLIGATORIO)

**No uses SQL, usa la app**:

1. Abre tu app Licor
2. Ve a **Inventario**
3. Agrega cualquier producto (ejemplo: 1 Caja de Polar)
4. Aparecerá modal "Precio de Costo"
5. Ingresa el costo (ejemplo: $20)
6. Confirma

✅ Esto registra los costos en la tabla.

---

### 4️⃣ CUARTO: Verificar que el Cálculo Funciona (VERIFICACIÓN)

1. Ve a **Caja** en la app
2. Abre el modal de **Rentabilidad & Inventario**
3. **Verifica:**
   - Ingresos (Semana): Debe mostrar tus ventas
   - **Costo Mercancía**: Debe mostrar un valor > $0 ✅
   - Ganancia Neta: Debe ser correcto

✅ ¡Listo! El sistema funciona.

---

## 🔧 Script Opcional: `test_cost_calculation.sql`

**NO LO NECESITAS AHORA**. Es solo para testing manual avanzado.

Si quieres usarlo más adelante:
1. Primero ejecuta el PASO 1 de ese script para obtener tus IDs
2. Reemplaza `'YOUR_ORGANIZATION_ID'` y `'YOUR_PRODUCT_ID'` con los IDs reales
3. Luego ejecuta el PASO 2

---

## 📋 Resumen de Archivos

| Orden | Archivo | ¿Ejecutar? | ¿Dónde? |
|-------|---------|------------|---------|
| 1 | `patch_create_cost_prices.sql` | ✅ SÍ | Supabase SQL Editor |
| 2 | `verify_cost_prices.sql` | ✅ Recomendado | Supabase SQL Editor |
| 3 | **Usa la App** | ✅ SÍ | App → Inventario |
| 4 | **Verifica** | ✅ SÍ | App → Caja |
| - | `test_cost_calculation.sql` | ⚠️ Opcional | Solo si quieres testear manualmente |

---

## ✅ TU SIGUIENTE PASO

**Ejecuta SOLO `patch_create_cost_prices.sql` en Supabase SQL Editor**

Después, registra costos en la app y listo.
