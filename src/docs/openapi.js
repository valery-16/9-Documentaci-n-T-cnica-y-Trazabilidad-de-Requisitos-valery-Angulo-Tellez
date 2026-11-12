/**
 * Especificación OpenAPI 3.0 de la API del Puesto de Chance.
 *
 * Esta especificación alimenta la documentación interactiva servida por
 * Swagger UI en la ruta /api-docs (ver src/app.js).
 *
 * Para probar los endpoints protegidos desde Swagger UI, use el botón
 * "Authorize" e ingrese el token devuelto por POST /api/v1/auth/login
 * (sin la palabra "Bearer").
 */

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Puesto de Chance — API',
    description:
      'API REST para la gestión de un puesto de venta de **Chance** y **Baloto**: ' +
      'administración de sorteos, venta de tiquetes, registro de resultados, ' +
      'liquidación y pago de premios, y cierre de caja por vendedor.\n\n' +
      '**Autenticación:** todas las rutas excepto `login` y `health` requieren ' +
      'el header `Authorization: Bearer <token>`.\n\n' +
      '**Roles:** `ADMIN` administra sorteos y resultados; `VENDEDOR` vende, ' +
      'anula, paga premios y cierra su caja.',
    version: '1.0.0',
  },
  servers: [{ url: '/', description: 'Servidor local' }],
  tags: [
    { name: 'Autenticación', description: 'Login y perfil del usuario' },
    { name: 'Sorteos', description: 'Administración de sorteos y resultados' },
    { name: 'Tiquetes', description: 'Venta, consulta, anulación y pago de premios' },
    { name: 'Caja', description: 'Resumen y cierre de caja diario' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido en POST /api/v1/auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string', example: 'Mensaje del error' } },
      },
      LoginRequest: {
        type: 'object',
        required: ['usuario', 'password'],
        properties: {
          usuario: { type: 'string', example: 'vendedor1' },
          password: { type: 'string', example: 'vende123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          usuario: { $ref: '#/components/schemas/Perfil' },
        },
      },
      Perfil: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          usuario: { type: 'string', example: 'vendedor1' },
          nombre: { type: 'string', example: 'Ana Pérez' },
          rol: { type: 'string', enum: ['ADMIN', 'VENDEDOR'] },
        },
      },
      Sorteo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          tipo: { type: 'string', enum: ['CHANCE', 'BALOTO'] },
          nombre: { type: 'string', example: 'Lotería de Bogotá' },
          fecha: { type: 'string', format: 'date-time' },
          estado: { type: 'string', enum: ['ABIERTO', 'JUGADO'] },
          resultado: {
            description:
              'Chance: cadena de 4 dígitos. Baloto: jugada con 5 números y superbalota.',
            oneOf: [{ type: 'string' }, { type: 'object' }],
            nullable: true,
          },
          acumulado: { type: 'integer', example: 4500000000 },
        },
      },
      CrearSorteoRequest: {
        type: 'object',
        required: ['tipo', 'nombre', 'fecha'],
        properties: {
          tipo: { type: 'string', enum: ['CHANCE', 'BALOTO'] },
          nombre: { type: 'string', example: 'Lotería del Valle' },
          fecha: { type: 'string', format: 'date-time', example: '2026-12-01T22:00:00.000Z' },
          acumulado: { type: 'integer', description: 'Solo aplica a BALOTO', example: 4500000000 },
        },
      },
      ResultadoRequest: {
        type: 'object',
        required: ['resultado'],
        properties: {
          resultado: {
            description:
              'Chance: cadena de 4 dígitos (p. ej. `"1234"`). ' +
              'Baloto: `{ "numeros": [1,2,3,4,5], "superbalota": 6 }`.',
            oneOf: [{ type: 'string', example: '1234' }, { type: 'object' }],
          },
        },
      },
      ApuestaChance: {
        type: 'object',
        required: ['numero', 'valor'],
        properties: {
          numero: { type: 'string', description: '1 a 4 dígitos', example: '1234' },
          modalidad: { type: 'string', enum: ['DIRECTO', 'COMBINADO'], default: 'DIRECTO' },
          valor: {
            type: 'integer',
            description: 'COP. Entre 500 y 50000, múltiplo de 100',
            example: 2000,
          },
        },
      },
      VenderChanceRequest: {
        type: 'object',
        required: ['sorteoId', 'apuestas'],
        properties: {
          sorteoId: { type: 'integer', example: 1 },
          apuestas: {
            type: 'array',
            minItems: 1,
            maxItems: 5,
            items: { $ref: '#/components/schemas/ApuestaChance' },
          },
          cliente: { type: 'string', example: 'María López' },
        },
      },
      JugadaBaloto: {
        type: 'object',
        properties: {
          aleatoria: { type: 'boolean', description: 'Genera la jugada automáticamente ("Balotazo")' },
          numeros: {
            type: 'array',
            description: 'Exactamente 5 números entre 1 y 43, sin repetir',
            items: { type: 'integer', minimum: 1, maximum: 43 },
            example: [1, 2, 3, 4, 5],
          },
          superbalota: { type: 'integer', minimum: 1, maximum: 16, example: 6 },
        },
      },
      VenderBalotoRequest: {
        type: 'object',
        required: ['sorteoId', 'jugadas'],
        properties: {
          sorteoId: { type: 'integer', example: 3 },
          jugadas: {
            type: 'array',
            minItems: 1,
            maxItems: 10,
            items: { $ref: '#/components/schemas/JugadaBaloto' },
          },
          cliente: { type: 'string', example: 'Carlos Ruiz' },
        },
      },
      Tiquete: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          codigo: { type: 'string', example: 'CH-A1B2C3D4', description: 'Prefijo CH- (chance) o BL- (baloto)' },
          tipo: { type: 'string', enum: ['CHANCE', 'BALOTO'] },
          sorteoId: { type: 'integer' },
          vendedorId: { type: 'integer' },
          cliente: { type: 'string', nullable: true },
          total: { type: 'integer', example: 3000 },
          estado: { type: 'string', enum: ['ACTIVO', 'ANULADO', 'PAGADO', 'CADUCADO'] },
          premio: { type: 'integer', nullable: true, example: 4500000 },
          creadoEn: { type: 'string', format: 'date-time' },
        },
      },
      AnulacionRequest: {
        type: 'object',
        required: ['motivo'],
        properties: { motivo: { type: 'string', example: 'Cliente cambió el número' } },
      },
      ResumenCaja: {
        type: 'object',
        properties: {
          vendedorId: { type: 'integer' },
          fecha: { type: 'string', format: 'date', example: '2026-11-12' },
          tiquetesVendidos: { type: 'integer' },
          tiquetesAnulados: { type: 'integer' },
          ventasChance: { type: 'integer' },
          ventasBaloto: { type: 'integer' },
          totalVendido: { type: 'integer' },
          premiosPagados: { type: 'integer' },
          totalPagado: { type: 'integer' },
          saldoEsperado: { type: 'integer', description: 'totalVendido − totalPagado' },
          cerrada: { type: 'boolean' },
        },
      },
      CierreRequest: {
        type: 'object',
        required: ['efectivoReportado'],
        properties: {
          efectivoReportado: { type: 'integer', description: 'Efectivo contado (COP)', example: 10700 },
          fecha: { type: 'string', format: 'date', example: '2026-11-12' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Autenticación'],
        summary: 'Verificación de salud del servicio',
        security: [],
        responses: {
          200: {
            description: 'Servicio operativo',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    estado: { type: 'string', example: 'ok' },
                    hora: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Autenticar un usuario y obtener un JWT',
        description: 'Usuarios semilla: `admin/admin123`, `vendedor1/vende123`, `vendedor2/vende456`.',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Token y perfil del usuario',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          400: respuestaError('Falta usuario o contraseña'),
          401: respuestaError('Credenciales inválidas'),
          403: respuestaError('Usuario inactivo'),
        },
      },
    },
    '/api/v1/auth/perfil': {
      get: {
        tags: ['Autenticación'],
        summary: 'Perfil del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Perfil',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Perfil' } } },
          },
          401: respuestaError('Token requerido, inválido o expirado'),
        },
      },
    },
    '/api/v1/sorteos': {
      get: {
        tags: ['Sorteos'],
        summary: 'Listar sorteos',
        security: [{ bearerAuth: [] }],
        parameters: [
          filtroQuery('tipo', 'Filtrar por tipo de sorteo', ['CHANCE', 'BALOTO']),
          filtroQuery('estado', 'Filtrar por estado del sorteo', ['ABIERTO', 'JUGADO']),
        ],
        responses: {
          200: {
            description: 'Lista de sorteos',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Sorteo' } },
              },
            },
          },
          401: respuestaError('Token requerido, inválido o expirado'),
        },
      },
      post: {
        tags: ['Sorteos'],
        summary: 'Crear un sorteo (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearSorteoRequest' } } },
        },
        responses: {
          201: {
            description: 'Sorteo creado en estado ABIERTO',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Sorteo' } } },
          },
          400: respuestaError('Tipo inválido, nombre obligatorio, fecha inválida o no futura'),
          401: respuestaError('Token requerido, inválido o expirado'),
          403: respuestaError('Solo ADMIN puede crear sorteos'),
        },
      },
    },
    '/api/v1/sorteos/{id}': {
      get: {
        tags: ['Sorteos'],
        summary: 'Consultar un sorteo',
        security: [{ bearerAuth: [] }],
        parameters: [paramRuta('id', 'Identificador del sorteo')],
        responses: {
          200: {
            description: 'Sorteo encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Sorteo' } } },
          },
          401: respuestaError('Token requerido, inválido o expirado'),
          404: respuestaError('Sorteo no encontrado'),
        },
      },
    },
    '/api/v1/sorteos/{id}/resultado': {
      post: {
        tags: ['Sorteos'],
        summary: 'Registrar el resultado de un sorteo (ADMIN)',
        description:
          'Marca el sorteo como JUGADO y liquida automáticamente el premio de ' +
          'todos los tiquetes ACTIVO del sorteo.',
        security: [{ bearerAuth: [] }],
        parameters: [paramRuta('id', 'Identificador del sorteo')],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResultadoRequest' } } },
        },
        responses: {
          200: {
            description: 'Sorteo actualizado con el resultado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Sorteo' } } },
          },
          400: respuestaError('Formato de resultado inválido para el tipo de sorteo'),
          401: respuestaError('Token requerido, inválido o expirado'),
          403: respuestaError('Solo ADMIN puede registrar resultados'),
          404: respuestaError('Sorteo no encontrado'),
          409: respuestaError('El sorteo ya tiene resultado'),
        },
      },
    },
    '/api/v1/tickets/chance': {
      post: {
        tags: ['Tiquetes'],
        summary: 'Vender un tiquete de chance (VENDEDOR)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VenderChanceRequest' } } },
        },
        responses: {
          201: {
            description: 'Tiquete creado en estado ACTIVO',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Tiquete' } } },
          },
          400: respuestaError('Apuestas inválidas (formato, valores, cantidad)'),
          401: respuestaError('Token requerido, inválido o expirado'),
          403: respuestaError('Solo VENDEDOR puede vender'),
          404: respuestaError('Sorteo no encontrado'),
          409: respuestaError('El sorteo no está abierto o las ventas ya cerraron'),
        },
      },
    },
    '/api/v1/tickets/baloto': {
      post: {
        tags: ['Tiquetes'],
        summary: 'Vender un tiquete de Baloto (VENDEDOR)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VenderBalotoRequest' } } },
        },
        responses: {
          201: {
            description: 'Tiquete creado en estado ACTIVO (total = jugadas × VALOR_BALOTO)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Tiquete' } } },
          },
          400: respuestaError('Jugadas inválidas (cantidad, rango, duplicados)'),
          401: respuestaError('Token requerido, inválido o expirado'),
          403: respuestaError('Solo VENDEDOR puede vender'),
          404: respuestaError('Sorteo no encontrado'),
          409: respuestaError('El sorteo no está abierto o las ventas ya cerraron'),
        },
      },
    },
    '/api/v1/tickets': {
      get: {
        tags: ['Tiquetes'],
        summary: 'Listar tiquetes',
        description: 'ADMIN ve todos los tiquetes; VENDEDOR solo los suyos.',
        security: [{ bearerAuth: [] }],
        parameters: [
          filtroQuery('fecha', 'Filtrar por fecha de venta (YYYY-MM-DD)'),
          filtroQuery('estado', 'Filtrar por estado del tiquete', ['ACTIVO', 'ANULADO', 'PAGADO', 'CADUCADO']),
        ],
        responses: {
          200: {
            description: 'Lista de tiquetes',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Tiquete' } },
              },
            },
          },
          401: respuestaError('Token requerido, inválido o expirado'),
        },
      },
    },
    '/api/v1/tickets/{codigo}': {
      get: {
        tags: ['Tiquetes'],
        summary: 'Consultar un tiquete',
        description:
          'Devuelve el tiquete, los datos del sorteo y la marca `ganador` si el ' +
          'sorteo ya se jugó (true si `premio > 0`).',
        security: [{ bearerAuth: [] }],
        parameters: [paramRuta('codigo', 'Código del tiquete (CH-… o BL-…)', 'CH-A1B2C3D4')],
        responses: {
          200: {
            description: 'Tiquete con estado de ganador',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Tiquete' } } },
          },
          401: respuestaError('Token requerido, inválido o expirado'),
          404: respuestaError('Tiquete no encontrado'),
        },
      },
    },
    '/api/v1/tickets/{codigo}/anular': {
      post: {
        tags: ['Tiquetes'],
        summary: 'Anular un tiquete',
        description:
          'Solo el vendedor que lo vendió (dentro de los minutos configurados ' +
          'tras la venta) o un ADMIN (sin límite de tiempo). El sorteo no debe estar jugado.',
        security: [{ bearerAuth: [] }],
        parameters: [paramRuta('codigo', 'Código del tiquete', 'CH-A1B2C3D4')],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AnulacionRequest' } } },
        },
        responses: {
          200: {
            description: 'Tiquete ANULADO con registro del motivo',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Tiquete' } } },
          },
          400: respuestaError('Motivo no indicado'),
          401: respuestaError('Token requerido, inválido o expirado'),
          403: respuestaError('Tiquete de otro vendedor'),
          404: respuestaError('Tiquete no encontrado'),
          409: respuestaError('Estado no permite la anulación, sorteo jugado o fuera del plazo'),
        },
      },
    },
    '/api/v1/tickets/{codigo}/pagar': {
      post: {
        tags: ['Tiquetes'],
        summary: 'Pagar el premio de un tiquete ganador (VENDEDOR)',
        security: [{ bearerAuth: [] }],
        parameters: [paramRuta('codigo', 'Código del tiquete', 'CH-A1B2C3D4')],
        responses: {
          200: {
            description: 'Pago registrado y tiquete marcado PAGADO',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    ticketId: { type: 'integer' },
                    codigo: { type: 'string' },
                    usuarioId: { type: 'integer' },
                    valor: { type: 'integer' },
                    fecha: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          401: respuestaError('Token requerido, inválido o expirado'),
          403: respuestaError('Solo VENDEDOR puede pagar premios'),
          404: respuestaError('Tiquete no encontrado'),
          409: respuestaError('Sorteo sin jugar, tiquete sin premio, ya pagado o no activo'),
          410: respuestaError('Premio caducado (pasaron los días configurados)'),
        },
      },
    },
    '/api/v1/caja/resumen': {
      get: {
        tags: ['Caja'],
        summary: 'Resumen de caja del día',
        description:
          'Cada usuario ve su propia caja. ADMIN puede consultar la de un ' +
          'vendedor con el parámetro `vendedorId`.',
        security: [{ bearerAuth: [] }],
        parameters: [
          filtroQuery('fecha', 'Fecha del resumen (YYYY-MM-DD, por defecto hoy)'),
          { name: 'vendedorId', in: 'query', schema: { type: 'integer' }, description: 'Solo ADMIN' },
        ],
        responses: {
          200: {
            description: 'Resumen de la caja',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResumenCaja' } } },
          },
          401: respuestaError('Token requerido, inválido o expirado'),
        },
      },
    },
    '/api/v1/caja/cierre': {
      post: {
        tags: ['Caja'],
        summary: 'Cerrar la caja del día (VENDEDOR)',
        description:
          'Compara el efectivo reportado con el saldo esperado y genera un ' +
          'cierre con estado CUADRADA, SOBRANTE o FALTANTE. Solo se permite un cierre por día.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CierreRequest' } } },
        },
        responses: {
          201: {
            description: 'Cierre registrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResumenCaja' } } },
          },
          400: respuestaError('Efectivo reportado inválido'),
          401: respuestaError('Token requerido, inválido o expirado'),
          403: respuestaError('Solo VENDEDOR puede cerrar caja'),
          409: respuestaError('La caja del día ya fue cerrada'),
        },
      },
    },
  },
};

/** Construye una respuesta de error reutilizable para la especificación. */
function respuestaError(descripcion) {
  return {
    description: descripcion,
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/Error' } },
    },
  };
}

/** Construye un parámetro de ruta para la especificación. */
function paramRuta(nombre, descripcion, ejemplo) {
  return {
    name: nombre,
    in: 'path',
    required: true,
    schema: { type: 'string' },
    description: descripcion,
    example: ejemplo,
  };
}

/** Construye un parámetro de query (filtro) para la especificación. */
function filtroQuery(nombre, descripcion, enumeracion) {
  const schema = { type: 'string' };
  if (enumeracion) schema.enum = enumeracion;
  return { name: nombre, in: 'query', schema, description: descripcion };
}

module.exports = spec;
