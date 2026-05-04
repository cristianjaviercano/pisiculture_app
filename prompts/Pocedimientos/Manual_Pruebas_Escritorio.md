# 🐟 Aquashell Control v3.0 - Manual de Pruebas de Escritorio

Este documento consolida la arquitectura operativa de **Aquashell v3.0**, detallando los flujos de trabajo por rol, las mediciones críticas y las alertas programadas del sistema. Su objetivo es servir como guía para realizar las pruebas de escritorio (Desktop Testing) con los usuarios finales.

---

## 1. Detalles del Proyecto y Arquitectura

**Aquashell Control v3.0** es una aplicación web progresiva (PWA) diseñada bajo una arquitectura *Offline-First* enfocada en el control productivo de estanques acuícolas (específicamente sistemas RAS y semi-intensivos para Tilapia).

-   **Stack Tecnológico:** Vanilla JS, CSS (Tokens System), HTML5.
-   **Almacenamiento Local:** IndexedDB, permitiendo a los operarios registrar datos en campo sin conexión a internet.
-   **Modelo Zootécnico:** Motor de biomasa calibrado con curvas de crecimiento logístico (LMax) y Factor de Conversión Alimenticia (FCA) específico por especie.
-   **Estructura de Permisos:** Control de Acceso Basado en Roles (RBAC) con tres niveles jerárquicos: Operario (Campo), Coordinador (Táctico) y Gerente (Estratégico).

---

## 2. Manual de Operaciones por Rol

### 2.1 👨‍🌾 Nivel Operativo: El Operario (Ejecutor de Campo)

El operario es la fuente de la "verdad en campo". Su vista está simplificada para evitar errores, mostrando únicamente las operaciones físicas.

**Pantallas Habilitadas:**
1.  **Dashboard:** Muestra el "Checklist de Rutina Diaria (Fase 3)" y las alertas rojas de estanques activos.
2.  **Calidad del Agua:** Formulario de registro de 8 parámetros.
3.  **Alimentación:** Formulario para reportar los kilogramos de concentrado entregados.
4.  **Mortalidad:** Formulario de recolección de bajas y posibles causas.
5.  **Muestreo Biométrico:** Formulario para registro quincenal de pesos (g), tallas (cm), inspección de salud e indicador de disparidad (desdoble).

**Flujo de Prueba sugerido para Operario:**
1.  Iniciar sesión con rol `operario`.
2.  Observar que "Mis Fincas", "Insumos" y "Reportes" no están visibles.
3.  Ir al Dashboard y marcar los check-box interactivos de la rutina diaria:
    -   *Bioseguridad e higiene.*
    -   *Inspección visual del comportamiento.*
4.  Ingresar al módulo de **Calidad del Agua**. Intentar guardar un valor de Oxígeno Disuelto de `3.0` mg/L (debería lanzar un error bloqueante en rojo indicando "OD CRÍTICO").
5.  Realizar un muestreo en el módulo de **Biometría** ingresando un listado de pesos aleatorios (Ej: 120, 125, 118, 130).

### 2.2 🧑‍💻 Nivel Táctico: El Coordinador (Supervisor y Planificador)

El coordinador valida los datos del operario y ejecuta el control del ciclo productivo (Entradas y Salidas).

**Pantallas Habilitadas:**
Todas las del operario, más:
1.  **Mis Fincas:** Visión de todos los estanques. Permite ejecutar Fase 2 (Sembrar Lote) y Fase 5 (Cosechar).
2.  **Insumos Sanitarios:** Registro y aplicación de tratamientos o químicos, controlando los "Tiempos de Retiro".

**Flujo de Prueba sugerido para Coordinador:**
1.  Iniciar sesión con rol `coordinador`.
2.  Navegar a **Mis Fincas**. Identificar un estanque vacío y usar el botón **"🌱 Sembrar"** (ingresar cantidad, peso inicial del alevino y costo).
3.  Ingresar a **Insumos**, registrar una aplicación de medicamento para el lote recién sembrado y fijar un tiempo de retiro de 15 días.
4.  Volver a **Mis Fincas**; el lote debe tener una alerta visual indicando **"⛔ RETIRO"**.
5.  En el mismo lote activo, hacer clic en **"Cosechar"**. Se abrirá el modal de Fase 5; ingresar los peces finales, el peso final, y el cliente destino para cerrar el ciclo productivo.

### 2.3 💼 Nivel Estratégico: El Gerente (Control Financiero y KPIs)

El Gerente analiza la rentabilidad y la eficiencia de los procesos. No registra datos; consume la información procesada.

**Pantallas Habilitadas:**
Acceso total. Uso principal del módulo de **Informes & KPIs**.

**Flujo de Prueba sugerido para Gerente:**
1.  Iniciar sesión con rol `gerente`.
2.  Ir a **Informes & KPIs**.
3.  En el selector de lotes, ubicar la sección "🌾 Histórico (Cosechados)" y seleccionar el lote que el Coordinador acaba de cerrar.
4.  Analizar los resultados financieros:
    -   **FCA Acumulado:** (Alimento Total / Biomasa Generada).
    -   **Supervivencia Final:** (Mortalidad restada contra siembra inicial).
    -   **Proyección Financiera:** Revisar el Costo de Semilla, Costo de Alimento, Ingreso Bruto (Proyectado) y el **% de ROI (Retorno de Inversión)**.

---

## 3. Parámetros Críticos (CTQ) y Sistema de Alertas

El sistema (específicamente en `waterQuality.js`) contiene un motor de reglas duras para evitar mortandades masivas y asegurar el bienestar animal.

### 3.1 Oxígeno Disuelto (OD) - *Bloqueante*
*   **Crítico (Hard Min):** `< 4.0 mg/L`
*   **Alerta Temprana (Warn Min):** `< 5.0 mg/L`
*   **Rango Óptimo:** `6.0 - 9.0 mg/L`
*   **Alerta en Pantalla:** Si baja de 4.0, el sistema *bloquea* el formulario de alimentación (no se debe alimentar sin oxígeno) y muestra: **"OD CRÍTICO — Detén toda alimentación. Activa aireación de emergencia."**

### 3.2 Temperatura del Agua
*   **Crítico Inferior:** `< 18 °C` (Reduce el metabolismo drásticamente).
*   **Óptimo:** `25 - 30 °C`.
*   **Crítico Superior:** `> 36 °C`.
*   **Tip Recomendado:** "Temperatura baja reduce el metabolismo. Aumenta el período de ayuno." o "Temperatura alta aumenta el estrés. Reduce la alimentación al 50%."

### 3.3 Amonio Total (TAN) - *Bloqueante*
*   **Óptimo:** `< 1.0 mg/L`
*   **Alerta Temprana (Warn Max):** `> 1.8 mg/L`
*   **Crítico (Hard Max):** `> 2.5 mg/L`
*   **Alerta en Pantalla:** El TAN elevado es tóxico para las branquias. Si supera 2.5, el sistema indica: **"TAN CRÍTICO — Suspende alimentación. Notifica al Coordinador ahora."**

### 3.4 Otros Parámetros de Monitoreo (Alertas no bloqueantes)
*   **pH:** Óptimo `6.5 - 8.5`. Alertas en `< 6.0` (acidez) o `> 9.0` (alcalinidad, posible floración de algas letal).
*   **Nitrito (NO₂):** Crítico en `> 1.0 mg/L` (Síndrome de la sangre marrón).
*   **Alcalinidad:** Óptimo `100 - 300 mg/L`. Alerta si `< 80 mg/L` (pérdida de poder buffer del agua).
*   **Disco Secchi:** Alerta si `< 30 cm` (demasiado turbio/exceso de plancton) o `> 90 cm` (falta de plancton primario).

---

## 4. Próximos Pasos para la Prueba de Escritorio

1.  **Entorno:** Ingresar a la URL proporcionada por Vercel desde un computador portátil.
2.  **Limpieza de Datos:** Si se desea empezar de cero, el coordinador puede limpiar el almacenamiento temporal del navegador (`Application > Storage > Clear site data`).
3.  **Ejecución Simulada:** Jugar a interpretar los tres roles en paralelo. Pedir al "Operario" que ingrese un dato falso de oxígeno crítico y observar cómo reacciona el sistema, luego pedir al "Coordinador" que tome acciones.
