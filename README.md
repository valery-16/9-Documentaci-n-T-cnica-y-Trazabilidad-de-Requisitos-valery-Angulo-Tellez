# 🎰 Puesto de Chance — API

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT%20Bearer-000000?logo=jsonwebtokens&logoColor=white)
![Jest](https://img.shields.io/badge/Tests-Jest%20·%2020%20passing-C21325?logo=jest&logoColor=white)
![Swagger](https://img.shields.io/badge/Docs-Swagger%20OpenAPI-85EA2D?logo=swagger&logoColor=white)
![Status](https://img.shields.io/badge/status-en%20desarrollo-blue)

---

## 1. Descripción general

**puesto-chance-api** es una API REST que digitaliza la operación de un puesto
de venta de juegos de azar (Chance y Baloto). Permite gestionar sorteos,
vender tiquetes con validación de reglas de negocio, registrar los resultados
de cada sorteo, liquidar automáticamente los premios, pagar los premios a los
ganadores dentro del plazo legal y cuadrar la caja diaria de cada vendedor.

El sistema maneja **dos roles de usuario**:

| Rol         | Permisos                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------- |
| `ADMIN`     | Administra sorteos, registra resultados y puede consultar/anular cualquier tiquete.           |
| `VENDEDOR`  | Vende tiquetes de chance y baloto, consulta sus ventas, anula y paga premios, cierra su caja. |

Toda la autenticación se realiza con **JWT Bearer Tokens**.

## 2. Stack tecnológico

| Tecnología        | Uso en el proyecto                                  |
| ----------------- | --------------------------------------------------- |
| Node.js + Express | Servidor HTTP y enrutamiento REST                   |
| JWT + bcryptjs    | Autenticación por token y hash de contraseñas       |
| CORS + Morgan     | Habilitación de CORS y logging de peticiones        |
| dotenv            | Configuración mediante variables de entorno         |
| Jest + Supertest  | Pruebas automatizadas de unidad e integración       |
| Swagger UI        | Documentación interactiva de la API (`/api-docs`)   |

## 3. Prerrequisitos del sistema

Antes de instalar el proyecto verifique tener:

- **Node.js 18 o superior** — [https://nodejs.org](https://nodejs.org)
- **npm 9 o superior** (viene incluido con Node.js)
- **Git** — [https://git-scm.com](https://git-scm.com)
- Un cliente REST para probar la API (Postman, Insomnia, Thunder Client o cURL)
- Puertos libres: la API escucha por defecto en el puerto **3000** (configurable con `PORT`)

## 4. Instalación local paso a paso

```bash
# 1. Clonar el repositorio
git clone <URL-DEL-REPOSITORIO>
cd documentacionApi

# 2. Instalar las dependencias
npm install

# 3. Crear su archivo de variables de entorno a partir del ejemplo
#    (Linux/Mac)
cp .env.example .env
#    (Windows PowerShell)
copy .env.example .env

# 4. Editar .env y cambiar JWT_SECRET por un valor seguro propio

# 5. Iniciar en modo desarrollo (se reinicia al guardar cambios)
npm run dev

#    ...o en modo producción
npm start
```

Al arrancar verá en consola:

```
Puesto de chance API escuchando en http://localhost:3000
```

Verificación rápida:

```bash
# Salud del servicio (no requiere token)
curl http://localhost:3000/health

# Login con un usuario semilla
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"vendedor1","password":"vende123"}'
```

## 5. Variables de entorno

El proyecto se configura **completamente por variables de entorno**.
Vea el archivo [`.env.example`](./.env.example) con la definición de todas
las variables, sus valores de ejemplo y una explicación de cada una:

| Variable                | Default           | Descripción                                        |
| ----------------------- | ----------------- | -------------------------------------------------- |
| `PORT`                  | `3000`            | Puerto HTTP del servidor                           |
| `JWT_SECRET`            | `cambiar-este-secreto` | Secreto de firma de los tokens JWT            |
| `JWT_EXPIRES_IN`        | `8h`              | Tiempo de vida del token                           |
| `ZONA_HORARIA`          | `America/Bogota`  | Zona horaria para ventas, sorteos y cierres        |
| `MINUTOS_ANULACION`     | `10`              | Ventana de anulación de un tiquete                 |
| `MINUTOS_CIERRE_VENTAS` | `15`              | Cierre de ventas minutos antes del sorteo          |
| `APUESTA_MIN_CHANCE`    | `500`             | Apuesta mínima por número (COP)                    |
| `APUESTA_MAX_CHANCE`    | `50000`           | Apuesta máxima por número (COP)                    |
| `VALOR_BALOTO`          | `5700`            | Valor fijo de cada jugada de Baloto (COP)          |
| `DIAS_CADUCIDAD_PREMIO` | `365`             | Plazo para reclamar un premio                      |

> ⚠️ **Nunca suba su `.env` real al repositorio.** El `.env.example` solo
> documenta los nombres y valores de referencia.

## 6. Documentación interactiva de la API

La API está documentada con la especificación **OpenAPI 3.0** y se explora
de forma interactiva con Swagger UI:

1. Levante el servidor (`npm run dev`)
2. Abra **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

Desde esa página puede autenticarse con el botón **Authorize**
(el token devuelto por `POST /api/v1/auth/login`) y ejecutar cada
endpoint directamente desde el navegador.

### Resumen de endpoints

Base URL: `/api/v1` · Autenticación: `Authorization: Bearer <token>`

| Método | Ruta                          | Rol        | Descripción                                     |
| ------ | ----------------------------- | ---------- | ----------------------------------------------- |
| POST   | `/auth/login`                 | Público    | Autentica y devuelve un JWT                     |
| GET    | `/auth/perfil`                | Autenticado| Devuelve el perfil del usuario autenticado      |
| GET    | `/sorteos`                    | Autenticado| Lista sorteos (filtros: `tipo`, `estado`)       |
| GET    | `/sorteos/:id`                | Autenticado| Consulta un sorteo                              |
| POST   | `/sorteos`                    | ADMIN      | Crea un sorteo                                  |
| POST   | `/sorteos/:id/resultado`      | ADMIN      | Registra el resultado y liquida los premios     |
| POST   | `/tickets/chance`             | VENDEDOR   | Vende un tiquete de chance (1–5 apuestas)       |
| POST   | `/tickets/baloto`             | VENDEDOR   | Vende un tiquete de Baloto (1–10 jugadas)       |
| GET    | `/tickets`                    | Autenticado| Lista tiquetes (ADMIN ve todos; filtros `fecha`, `estado`) |
| GET    | `/tickets/:codigo`            | Autenticado| Consulta un tiquete y su estado de ganador      |
| POST   | `/tickets/:codigo/anular`     | Autenticado| Anula un tiquete con reglas de tiempo y rol     |
| POST   | `/tickets/:codigo/pagar`      | VENDEDOR   | Paga el premio de un tiquete ganador            |
| GET    | `/caja/resumen`               | Autenticado| Resumen de caja del día (ADMIN puede pasar `vendedorId`) |
| POST   | `/caja/cierre`                | VENDEDOR   | Realiza el cierre de caja del día               |

### Usuarios semilla (datos de prueba)

Al arrancar, la API carga en memoria estos usuarios de demostración:

| Usuario     | Contraseña  | Rol      |
| ----------- | ----------- | -------- |
| `admin`     | `admin123`  | ADMIN    |
| `vendedor1` | `vende123`  | VENDEDOR |
| `vendedor2` | `vende456`  | VENDEDOR |

> ⚠️ Los datos viven **en memoria**: al reiniciar el proceso se restablecen.

## 7. Reglas de negocio principales

**Chance** — el número ganador son las últimas cifras del resultado del sorteo
(4 dígitos). Tabla de pagos (multiplicador sobre lo apostado):

| Cifras jugadas | Multiplicador |
| -------------- | ------------- |
| 4              | × 4500        |
| 3              | × 400         |
| 2              | × 50          |
| 1              | × 5           |

- Modalidad **DIRECTO**: gana si el número coincide exactamente con las
  últimas cifras del resultado.
- Modalidad **COMBINADO** (3 o 4 cifras, no repetidas): gana si el resultado
  termina en cualquiera de las permutaciones del número; el premio se divide
  entre todas las permutaciones.
- Cada apuesta debe valer entre `$500` y `$50.000` COP y ser múltiplo de 100.

**Baloto** — cada jugada son 5 números (1–43, sin repetir) + 1 superbalota
(1–16). Premio fijo por aciertos; 5+1 gana el **ACUMULADO**.

**Tiquetes** — se anulan solo dentro de los `MINUTOS_ANULACION` siguientes a
la venta (o siempre, si es ADMIN) y solo si el sorteo no se ha jugado. Los
premios se pagan mientras el tiquete esté `ACTIVO` y no hayan pasado
`DIAS_CADUCIDAD_PREMIO` desde el sorteo.

## 8. Estructura del proyecto

```text
documentacionApi/
├── docs/
│   └── RTM.md                  # Matriz de trazabilidad de requisitos
├── src/
│   ├── config/index.js         # Configuración por variables de entorno
│   ├── controllers/            # Controladores HTTP (auth, sorteos, tickets, caja)
│   ├── data/store.js           # "Base de datos" en memoria + datos semilla
│   ├── docs/openapi.js         # Especificación OpenAPI 3.0
│   ├── middlewares/            # auth (JWT + roles) y errorHandler
│   ├── routes/index.js         # Mapa de rutas REST
│   ├── services/               # Lógica de negocio (auth, chance, baloto,
│   │                           #   ticket, sorteo, caja)
│   ├── utils/                  # AppError y utilidades de fechas
│   ├── app.js                  # Configuración de Express
│   └── server.js               # Punto de entrada
├── tests/                      # Pruebas Jest + Supertest (5 suites, 20 tests)
├── .env.example                # Plantilla de variables de entorno
└── package.json
```

## 9. Pruebas

```bash
# Ejecutar la batería completa (20 pruebas)
npm test
```

Las pruebas de integración usan `NODE_ENV=test`, que desactiva el log de
Morgan, y reinician el almacén en memoria antes de cada suite para que sean
repetibles. El detalle de qué prueba cubre qué requisito está en
[`docs/RTM.md`](./docs/RTM.md).

## 10. Matriz de trazabilidad

La vinculación formal entre **Historias de Usuario ↔ Implementación ↔
Pruebas** está documentada en [`docs/RTM.md`](./docs/RTM.md).

---

Proyecto educativo — Taller de documentación integral de software.
