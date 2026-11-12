# 📋 Matriz de Trazabilidad de Requisitos (RTM)

**Proyecto:** puesto-chance-api · **Versión:** 1.0.0 · **Fecha:** 2026-11-12

La matriz vincula formalmente cada **Historia de Usuario (HU)** con su
**Requisito Funcional (RF)**, la **implementación** en el código fuente y los
**casos de prueba** automatizados que la validan (Jest + Supertest).

> Estado de cobertura:
> ✅ **Cubierto** — existe prueba automatizada · ⚠️ **Parcial** — cubierto
> indirectamente por otra prueba · 🔴 **Sin prueba** — requiere caso de prueba nuevo.

---

## 1. Matriz HU ↔ Implementación ↔ Pruebas

| ID  | RF    | Historia de Usuario                                                                                          | Implementación (archivo · función)                                                                                    | Casos de prueba (ID)                                                                                                                                                     | Cobertura |
| --- | ----- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| HU-01 | RF-01 | Como **operario** quiero iniciar sesión con mis credenciales para operar el puesto con un token seguro.       | `src/services/authService.js` · `login` / `src/controllers/authController.js` · `login`                                | `test_login_exitoso`, `test_login_credenciales_invalidas` (`tests/auth.test.js`)                                                                                          | ✅        |
| HU-02 | RF-02 | Como **usuario** quiero que las rutas estén protegidas para que solo personal autenticado consulte la API.    | `src/middlewares/auth.js` · `autenticar` / `src/services/authService.js` · `buscarPorId`                               | `test_ruta_protegida_sin_token` (`tests/auth.test.js`)                                                                                                                    | ✅        |
| HU-03 | RF-03 | Como **usuario** quiero consultar mi perfil para saber con qué rol estoy operando.                            | `src/controllers/authController.js` · `perfil`                                                                         | `test_ruta_protegida_sin_token` (indirecta)                                                                                                                               | ⚠️        |
| HU-04 | RF-04 | Como **ADMIN** quiero crear sorteos de chance y Baloto para programar las ventas del puesto.                  | `src/services/sorteoService.js` · `crear` / `src/controllers/sorteoController.js` · `crear`                             | `test_admin_crea_sorteo` (`tests/caja.test.js`)                                                                                                                           | ✅        |
| HU-05 | RF-05 | Como **vendedor** quiero listar y consultar los sorteos abiertos para saber qué puedo vender hoy.             | `src/services/sorteoService.js` · `listar`, `obtener` / `src/routes/index.js` · `GET /sorteos`                          | — (sin prueba directa)                                                                                                                                                    | 🔴        |
| HU-06 | RF-06 | Como **vendedor** quiero vender tiquetes de chance (1–5 apuestas) para registrar las jugadas de mis clientes. | `src/services/ticketService.js` · `venderChance` / `src/services/chanceService.js` · `validarApuesta`                   | `test_venta_chance`, `test_validacion_apuesta_invalida` (`tests/tickets.test.js`, `tests/chance.test.js`)                                                                  | ✅        |
| HU-07 | RF-07 | Como **vendedor** quiero vender tiquetes de Baloto (1–10 jugadas) incluyendo jugadas aleatorias.              | `src/services/ticketService.js` · `venderBaloto` / `src/services/balotoService.js` · `validarJugada`, `generarAleatoria`| `test_venta_baloto`, `test_jugada_aleatoria_valida`, `test_jugada_numeros_repetidos` (`tests/tickets.test.js`, `tests/baloto.test.js`)                                     | ✅        |
| HU-08 | RF-08 | Como **admin** quiero que las ventas cierren minutos antes de cada sorteo para no vender jugadas fuera de plazo.| `src/services/sorteoService.js` · `verificarVentaPermitida` (usa `MINUTOS_CIERRE_VENTAS`)                              | `test_venta_sorteo_cerrado` (`tests/tickets.test.js`)                                                                                                                     | ✅        |
| HU-09 | RF-09 | Como **admin** quiero que solo el rol VENDEDOR realice ventas para separar responsabilidades del negocio.     | `src/middlewares/auth.js` · `permitir` / `src/routes/index.js` · `permitir('VENDEDOR')`                                 | `test_admin_no_vende` (`tests/tickets.test.js`)                                                                                                                           | ✅        |
| HU-10 | RF-10 | Como **vendedor** quiero anular un tiquete con un motivo para corregir errores inmediatamente después de la venta. | `src/services/ticketService.js` · `anular` (usa `MINUTOS_ANULACION`)                                                 | `test_anulacion_ticket`, `test_anulacion_fuera_de_tiempo` (`tests/tickets.test.js`)                                                                                       | ✅        |
| HU-11 | RF-11 | Como **ADMIN** quiero registrar el resultado de un sorteo para liquidar los premios automáticamente.          | `src/services/sorteoService.js` · `registrarResultado`, `liquidarTicket`                                               | `test_resultado_y_pago_premio` (`tests/tickets.test.js`)                                                                                                                  | ✅        |
| HU-12 | RF-12 | Como **cliente** quiero recibir el premio correcto por mi apuesta de chance según cifras y modalidad.         | `src/services/chanceService.js` · `calcularPremio` (tabla `TABLA_PAGOS`, permutaciones combinadas)                      | `test_premio_directo_4_cifras`, `test_premio_directo_ultimas_cifras`, `test_premio_combinado_divide_por_permutaciones` (`tests/chance.test.js`)                            | ✅        |
| HU-13 | RF-13 | Como **cliente** quiero recibir el premio correcto por mi jugada de Baloto según aciertos y superbalota.      | `src/services/balotoService.js` · `calcularPremio` (tabla `PREMIOS`, acumulado)                                         | `test_premio_por_aciertos` (`tests/baloto.test.js`)                                                                                                                       | ✅        |
| HU-14 | RF-14 | Como **vendedor** quiero consultar un tiquete por su código para verificar si es ganador y en qué estado está.| `src/services/ticketService.js` · `consultar`, `buscar`                                                                 | `test_resultado_y_pago_premio` (verifica `ganador` y `premio` tras el sorteo)                                                                                               | ✅        |
| HU-15 | RF-15 | Como **vendedor** quiero pagar el premio a un ganador antes de que caduque para dejar constancia del desembolso. | `src/services/ticketService.js` · `pagarPremio` (usa `DIAS_CADUCIDAD_PREMIO`)                                         | `test_resultado_y_pago_premio` (incluye rechazo de doble pago, 409)                                                                                                        | ✅        |
| HU-16 | RF-16 | Como **vendedor** quiero ver el resumen de mi caja del día para saber cuánto vendí y cuánto entregué en premios. | `src/services/cajaService.js` · `resumen` / `src/controllers/cajaController.js` · `resumen`                            | `test_resumen_caja_diario` (`tests/caja.test.js`)                                                                                                                         | ✅        |
| HU-17 | RF-17 | Como **vendedor** quiero cerrar mi caja con el efectivo reportado para detectar faltantes o sobrantes.        | `src/services/cajaService.js` · `cerrar`                                                                               | `test_cierre_caja_con_faltante` (`tests/caja.test.js`)                                                                                                                    | ✅        |
| HU-18 | RF-18 | Como **vendedor** quiero listar mis tiquetes filtrando por fecha y estado para revisar mi operación.          | `src/services/ticketService.js` · `listar` / `src/controllers/ticketController.js` · `listar`                           | — (sin prueba directa)                                                                                                                                                    | 🔴        |

## 2. Trazabilidad de reglas de negocio ↔ configuración

| Regla de negocio                             | Implementación                                   | Variable de entorno      | Prueba asociada                  |
| -------------------------------------------- | ------------------------------------------------ | ------------------------ | -------------------------------- |
| Anulación solo dentro de N minutos post-venta | `ticketService.anular`                            | `MINUTOS_ANULACION`      | `test_anulacion_fuera_de_tiempo` |
| Cierre de ventas N minutos antes del sorteo  | `sorteoService.verificarVentaPermitida`           | `MINUTOS_CIERRE_VENTAS`  | `test_venta_sorteo_cerrado`      |
| Apuesta de chance entre mín/máx y múltiplo de 100 | `chanceService.validarApuesta`               | `APUESTA_MIN_CHANCE`, `APUESTA_MAX_CHANCE` | `test_validacion_apuesta_invalida` |
| Valor fijo de jugada de Baloto               | `ticketService.venderBaloto`                      | `VALOR_BALOTO`           | `test_resumen_caja_diario`       |
| Caducidad de premios por días                | `ticketService.pagarPremio`                       | `DIAS_CADUCIDAD_PREMIO`  | (sin prueba directa) 🔴          |
| Tabla de pagos de chance (4500/400/50/5)     | `chanceService.TABLA_PAGOS` + `calcularPremio`    | — (fija en código)       | `test_premio_directo_*`          |
| Tabla de premios Baloto por aciertos         | `balotoService.PREMIOS` + `calcularPremio`        | — (fija en código)       | `test_premio_por_aciertos`       |

## 3. Resumen de cobertura

| Métrica                              | Valor                                  |
| ------------------------------------ | -------------------------------------- |
| Historias de Usuario trazadas        | 18                                     |
| Historias cubiertas con pruebas      | 15 ✅ + 1 ⚠️ (parcial) = **89 %**       |
| Historias sin prueba directa         | 2 🔴                                   |
| Suites de pruebas                    | 5 (`auth`, `chance`, `baloto`, `caja`, `tickets`) |
| Casos de prueba ejecutados           | 20 (todos en verde)                    |

## 4. Gaps detectados y plan de acción

| Gap                                                              | Riesgo | Acción recomendada                                          |
| ---------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| Sin prueba para `GET /sorteos` (HU-05)                            | Bajo   | Agregar test de listado con filtros `tipo`/`estado`          |
| Sin prueba para `GET /tickets` con filtros (HU-18)                | Medio  | Probar visibilidad por rol y filtros `fecha`/`estado`        |
| Sin prueba para caducidad de premios (RF-15 borde `DIAS_CADUCIDAD_PREMIO`) | Medio | Simular sorteo jugado hace +365 días y verificar 410 |
| Sin prueba dedicada para `GET /auth/perfil` (HU-03)               | Bajo   | Test de perfil con token válido e inválido                   |

---

*Matriz elaborada como evidencia del taller de documentación integral.*
