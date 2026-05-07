/**
 * Tool Parameter Normalizer
 * 
 * Capa intermedia entre el LLM y la ejecución de tools.
 * Resuelve el problema de que modelos pequeños (8B) envíen
 * nombres de campo en español en vez de inglés.
 * 
 * En vez de depender de que el modelo acierte siempre los nombres
 * exactos del schema, este normalizador:
 * 1. Mapea sinónimos en español a los campos reales del schema
 * 2. Normaliza formatos de fecha
 * 3. Normaliza valores de enums (prioridad, estado, etapa)
 * 
 * Esto es la mejor práctica para bots multiidioma con tool calling:
 * el modelo se encarga de ENTENDER la intención, el normalizador
 * se encarga de que los datos encajen en el schema.
 */

// ============================================================
// MAPEO DE CAMPOS: español → inglés
// ============================================================

/**
 * Mapeo global de nombres de campo en español a sus equivalentes en el schema.
 * Se aplica recursivamente a cualquier tool call.
 */
const FIELD_ALIASES: Record<string, string> = {
  // Campos de cliente
  nombre: 'first_name',
  nombre_cliente: 'first_name',
  primer_nombre: 'first_name',
  apellido: 'last_name',
  apellidos: 'last_name',
  empresa: 'company',
  compañia: 'company',
  compania: 'company',
  correo: 'email',
  correo_electronico: 'email',
  telefono: 'phone',
  teléfono: 'phone',
  movil: 'phone',
  móvil: 'phone',

  // Campos de tarea
  titulo: 'title',
  título: 'title',
  descripcion: 'description',
  descripción: 'description',
  prioridad: 'priority',
  fecha: 'dueDate',
  fecha_limite: 'dueDate',
  fecha_vencimiento: 'dueDate',
  vencimiento: 'dueDate',
  cliente: 'clientId',
  cliente_id: 'clientId',
  id_cliente: 'clientId',

  // Campos de evento/calendario
  inicio: 'startAt',
  fecha_inicio: 'startAt',
  hora_inicio: 'startAt',
  comienzo: 'startAt',
  fin: 'endAt',
  fecha_fin: 'endAt',
  hora_fin: 'endAt',
  final: 'endAt',
  tipo: 'type',
  tipo_evento: 'type',

  // Campos de oportunidad
  etapa: 'stage',
  fase: 'stage',
  estado: 'stage',
  valor: 'estimatedValue',
  valor_estimado: 'estimatedValue',
  importe: 'estimatedValue',
  probabilidad: 'probability',
  oportunidad: 'opportunityId',
  oportunidad_id: 'opportunityId',
  id_oportunidad: 'opportunityId',

  // Campos de tarea (completar)
  tarea: 'taskId',
  tarea_id: 'taskId',
  id_tarea: 'taskId',

  // Filtros
  hoy: 'today',
  urgente: 'urgent',
  urgentes: 'urgent',
  limite: 'limit',
  límite: 'limit',
  solo_no_leidas: 'unreadOnly',
  no_leidas: 'unreadOnly',
  todos: 'all',
  todas: 'all',
  confirmado: 'confirmed',
  confirmacion: 'confirmed',
  consulta: 'query',
  busqueda: 'query',
  búsqueda: 'query',
  buscar: 'query',
};

// ============================================================
// NORMALIZACIÓN DE VALORES
// ============================================================

/**
 * Mapeo de valores de prioridad en español a los valores del enum.
 */
const PRIORITY_ALIASES: Record<string, string> = {
  alta: 'Alta',
  high: 'Alta',
  urgente: 'Alta',
  media: 'Media',
  medium: 'Media',
  normal: 'Media',
  baja: 'Baja',
  low: 'Baja',
};

/**
 * Mapeo de etapas del pipeline.
 * El modelo puede usar variaciones; las normalizamos.
 */
const STAGE_ALIASES: Record<string, string> = {
  'nuevo': 'Contacto Inicial',
  'nuevo lead': 'Contacto Inicial',
  'lead': 'Contacto Inicial',
  'contacto inicial': 'Contacto Inicial',
  'contactado': 'Contactado',
  'reunion agendada': 'Reunión Agendada',
  'reunión agendada': 'Reunión Agendada',
  'reunion': 'Reunión Agendada',
  'diagnostico': 'Diagnóstico',
  'diagnóstico': 'Diagnóstico',
  'analisis': 'Diagnóstico',
  'análisis': 'Diagnóstico',
  'propuesta en preparacion': 'Propuesta en Preparación',
  'propuesta en preparación': 'Propuesta en Preparación',
  'preparando propuesta': 'Propuesta en Preparación',
  'propuesta enviada': 'Propuesta Enviada',
  'enviada': 'Propuesta Enviada',
  'negociacion': 'Negociación',
  'negociación': 'Negociación',
  'ganado': 'Ganado',
  'ganada': 'Ganado',
  'cerrado': 'Ganado',
  'perdido': 'Perdido',
  'perdida': 'Perdido',
  'dormido': 'Dormido',
  'dormida': 'Dormido',
  'pausado': 'Dormido',
  'pausada': 'Dormido',
};

// ============================================================
// FUNCIONES DE NORMALIZACIÓN
// ============================================================

/**
 * Normaliza los parámetros de una tool call.
 * 1. Renombra campos en español a inglés
 * 2. Normaliza valores de enums
 * 3. Normaliza fechas
 */
export function normalizeToolParams(
  toolName: string,
  params: Record<string, any>
): Record<string, any> {
  // Paso 1: renombrar campos
  const renamed = renameFields(params);

  // Paso 2: normalizar valores específicos por campo
  if (renamed.priority && typeof renamed.priority === 'string') {
    renamed.priority = PRIORITY_ALIASES[renamed.priority.toLowerCase()] || renamed.priority;
  }

  if (renamed.stage && typeof renamed.stage === 'string') {
    renamed.stage = STAGE_ALIASES[renamed.stage.toLowerCase()] || renamed.stage;
  }

  // Paso 3: normalizar fechas
  if (renamed.dueDate && typeof renamed.dueDate === 'string') {
    renamed.dueDate = normalizeDate(renamed.dueDate);
  }
  if (renamed.startAt && typeof renamed.startAt === 'string') {
    renamed.startAt = normalizeDateTime(renamed.startAt);
  }
  if (renamed.endAt && typeof renamed.endAt === 'string') {
    renamed.endAt = normalizeDateTime(renamed.endAt);
  }
  if (renamed.date && typeof renamed.date === 'string') {
    renamed.date = normalizeDate(renamed.date);
  }

  // Paso 4: normalizar booleanos que el modelo envía como string
  for (const boolField of ['today', 'urgent', 'unreadOnly', 'all', 'confirmed']) {
    if (boolField in renamed && typeof renamed[boolField] === 'string') {
      renamed[boolField] = ['true', 'sí', 'si', 'yes', '1'].includes(
        renamed[boolField].toLowerCase()
      );
    }
  }

  // Paso 5: normalizar números que el modelo envía como string
  for (const numField of ['limit', 'estimatedValue', 'probability']) {
    if (numField in renamed && typeof renamed[numField] === 'string') {
      const parsed = Number(renamed[numField]);
      if (!isNaN(parsed)) renamed[numField] = parsed;
    }
  }

  return renamed;
}

/**
 * Renombra campos usando el mapeo de aliases.
 * Si un campo ya tiene el nombre correcto, lo deja como está.
 * Si un campo está en español, lo renombra al equivalente inglés.
 * Si un campo no está en el mapeo, lo deja como está (podría ser válido).
 */
function renameFields(params: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    // Normalizar la key: minúsculas, sin espacios, guiones bajos
    const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
    const mappedKey = FIELD_ALIASES[normalizedKey] || key;

    // Si ya existe el campo correcto, no sobrescribir
    // (el modelo mandó tanto "first_name" como "nombre")
    if (!(mappedKey in result)) {
      result[mappedKey] = value;
    }
  }

  return result;
}

/**
 * Normaliza una fecha a formato ISO 8601 (YYYY-MM-DD).
 * Acepta: "mañana", "hoy", "2026-05-07", "07/05/2026", "7 mayo", etc.
 */
function normalizeDate(input: string): string {
  const lower = input.toLowerCase().trim();
  const now = new Date();

  // Palabras clave
  if (lower === 'hoy' || lower === 'today') {
    return toISODate(now);
  }
  if (lower === 'mañana' || lower === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toISODate(tomorrow);
  }

  // Días de la semana
  const dayMap: Record<string, number> = {
    domingo: 0, lunes: 1, martes: 2, miércoles: 3, miercoles: 3,
    jueves: 4, viernes: 5, sábado: 6, sabado: 6,
  };
  if (dayMap[lower] !== undefined) {
    return toISODate(nextWeekday(dayMap[lower]));
  }

  // Si empieza con "el " + día de la semana
  const elMatch = lower.match(/^el\s+(\w+)$/);
  if (elMatch && dayMap[elMatch[1]] !== undefined) {
    return toISODate(nextWeekday(dayMap[elMatch[1]]));
  }

  // Si ya es ISO, devolverlo
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    return input.substring(0, 10);
  }

  // Formato DD/MM/YYYY
  const slashMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Si no reconocemos el formato, devolver como está y que Zod lo valide
  return input;
}

/**
 * Normaliza una fecha+hora a ISO 8601.
 * Si solo recibe fecha, añade hora por defecto.
 */
function normalizeDateTime(input: string): string {
  const dateOnly = normalizeDate(input);

  // Si ya tiene hora (contiene T o tiene longitud > 10)
  if (input.includes('T') || input.length > 10) {
    const timeMatch = input.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const [, hours, minutes] = timeMatch;
      // Siempre incluir timezone de España para que Postgres lo acepte
      return `${dateOnly}T${hours.padStart(2, '0')}:${minutes}:00+02:00`;
    }
    // Si ya tiene timezone (+XX:XX o Z), devolver como está
    if (input.includes('+') || input.endsWith('Z')) return input;
    return `${input}+02:00`;
  }

  // Solo fecha → añadir hora por defecto con timezone
  return `${dateOnly}T09:00:00+02:00`;
}

/**
 * Devuelve la próxima fecha para un día de la semana dado.
 * Si hoy es ese día, devuelve la semana siguiente.
 */
function nextWeekday(targetDay: number): Date {
  const now = new Date();
  const currentDay = now.getDay();
  let daysAhead = targetDay - currentDay;
  if (daysAhead <= 0) daysAhead += 7; // Siempre futuro
  const result = new Date(now);
  result.setDate(result.getDate() + daysAhead);
  return result;
}

function toISODate(date: Date): string {
  return date.toISOString().substring(0, 10);
}
