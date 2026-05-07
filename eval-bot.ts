/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ElitorBot — Script de Evaluación                           ║
 * ║  Envía mensajes al webhook y evalúa las respuestas          ║
 * ║                                                              ║
 * ║  Uso:                                                        ║
 * ║    npx ts-node eval-bot.ts                                  ║
 * ║    npx ts-node eval-bot.ts --category=clientes              ║
 * ║    npx ts-node eval-bot.ts --verbose                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────
// CONFIG — edita estos valores
// ─────────────────────────────────────────────────────────────────

const CONFIG = {
  // URL del webhook (producción o local)
  webhookUrl: 'https://crm.elitorsoluciones.es/api/telegram/webhook',

  // ID de Telegram del usuario de prueba (tabla telegram_users)
  telegramUserId: Number(process.env.TEST_TELEGRAM_ID || '0'),

  // Delay entre mensajes (ms) — evita rate limiting del LLM
  delayBetweenMessages: 2000,

  // Timeout por mensaje (ms)
  messageTimeout: 30_000,
};

// ─────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────

type Category =
  | 'saludo'
  | 'clientes'
  | 'tareas'
  | 'calendario'
  | 'pipeline'
  | 'busqueda'
  | 'edge_cases';

interface TestCase {
  id: string;
  category: Category;
  message: string;
  // La respuesta debe contener al menos UNO de estos patrones
  expectAny: RegExp[];
  // La respuesta NO debe contener ninguno de estos patrones
  expectNone?: RegExp[];
  // Descripción de qué se está probando
  description: string;
}

interface TestResult {
  id: string;
  category: Category;
  message: string;
  response: string;
  passed: boolean;
  failReason?: string;
  durationMs: number;
}

// ─────────────────────────────────────────────────────────────────
// DATASET — 45 casos de prueba
// ─────────────────────────────────────────────────────────────────

const TEST_CASES: TestCase[] = [

  // ══════════════════════════════════════
  // SALUDOS (6)
  // ══════════════════════════════════════
  {
    id: 'S01',
    category: 'saludo',
    message: 'Hola',
    expectAny: [/cliente|tarea|reunión|resumen|hoy|buen/i],
    description: 'Saludo básico → debe mostrar resumen del día',
  },
  {
    id: 'S02',
    category: 'saludo',
    message: 'Qué pasa',
    expectAny: [/cliente|tarea|reunión|resumen|hoy/i],
    description: 'Saludo informal → resumen del día',
  },
  {
    id: 'S03',
    category: 'saludo',
    message: 'Buenos días',
    expectAny: [/cliente|tarea|reunión|resumen|día|buenas/i],
    description: 'Buenos días → resumen del día',
  },
  {
    id: 'S04',
    category: 'saludo',
    message: 'Dame un resumen del día',
    expectAny: [/cliente|tarea|reunión|evento|resumen/i],
    description: 'Resumen explícito del día',
  },
  {
    id: 'S05',
    category: 'saludo',
    message: 'Qué tengo hoy',
    expectAny: [/tarea|reunión|evento|hoy|nada|pendiente/i],
    description: 'Consulta de agenda del día',
  },
  {
    id: 'S06',
    category: 'saludo',
    message: 'Ayuda',
    expectAny: [/cliente|tarea|crear|buscar|puedo|ayud/i],
    description: 'Pedir ayuda → debe listar capacidades',
  },

  // ══════════════════════════════════════
  // CLIENTES (10)
  // ══════════════════════════════════════
  {
    id: 'C01',
    category: 'clientes',
    message: 'Lista mis clientes',
    expectAny: [/cliente|nombre|empresa|no hay/i],
    description: 'Listar clientes existentes',
  },
  {
    id: 'C02',
    category: 'clientes',
    message: 'Muéstrame los últimos clientes',
    expectAny: [/cliente|nombre|empresa|no hay/i],
    description: 'Listar clientes recientes',
  },
  {
    id: 'C03',
    category: 'clientes',
    message: 'Crea cliente EvalTest empresa EvalCorp email eval@test.com',
    expectAny: [/creado|EvalTest|correcto|✅/i],
    expectNone: [/error|fallo|no se pudo/i],
    description: 'Crear cliente con todos los datos → debe crear sin preguntar',
  },
  {
    id: 'C04',
    category: 'clientes',
    message: 'Añade a María García de TechStartup',
    expectAny: [/creado|María|correcto|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear cliente con nombre + empresa en lenguaje natural',
  },
  {
    id: 'C05',
    category: 'clientes',
    message: 'Crea cliente Pedro',
    expectAny: [/creado|Pedro|correcto|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear cliente solo con nombre (mínimo requerido)',
  },
  {
    id: 'C06',
    category: 'clientes',
    message: 'Busca el cliente EvalTest',
    expectAny: [/EvalTest|EvalCorp|encontr/i],
    description: 'Buscar cliente recién creado',
  },
  {
    id: 'C07',
    category: 'clientes',
    message: 'Cuántos clientes tengo',
    expectAny: [/\d+|cliente/i],
    description: 'Contar clientes → debe devolver número',
  },
  {
    id: 'C08',
    category: 'clientes',
    message: 'Busca cliente xyznoexiste99999',
    expectAny: [/no.*encontr|sin resultado|no hay|crear/i],
    description: 'Buscar cliente inexistente → debe indicar que no existe',
  },
  {
    id: 'C09',
    category: 'clientes',
    message: 'Nuevo cliente: nombre Juan López, empresa Distribuciones SA, teléfono 600123456',
    expectAny: [/creado|Juan|correcto|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear cliente con formato "nombre: valor"',
  },
  {
    id: 'C10',
    category: 'clientes',
    message: 'Busca clientes de empresa Acme',
    expectAny: [/Acme|cliente|encontr|no hay/i],
    description: 'Buscar clientes por empresa',
  },

  // ══════════════════════════════════════
  // TAREAS (8)
  // ══════════════════════════════════════
  {
    id: 'T01',
    category: 'tareas',
    message: 'Muestra mis tareas pendientes',
    expectAny: [/tarea|pendiente|no hay|lista/i],
    description: 'Listar tareas pendientes',
  },
  {
    id: 'T02',
    category: 'tareas',
    message: 'Qué tareas urgentes tengo',
    expectAny: [/alta|urgente|no hay|tarea/i],
    description: 'Tareas de alta prioridad',
  },
  {
    id: 'T03',
    category: 'tareas',
    message: 'Tareas para hoy',
    expectAny: [/tarea|hoy|no hay|pendiente/i],
    description: 'Tareas del día de hoy',
  },
  {
    id: 'T04',
    category: 'tareas',
    message: 'Crea tarea "Revisar propuesta EvalBot" con prioridad Alta',
    expectAny: [/creada|Revisar propuesta|correcta|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear tarea con título y prioridad',
  },
  {
    id: 'T05',
    category: 'tareas',
    message: 'Añade tarea: llamar a cliente mañana',
    expectAny: [/creada|llamar|correcta|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear tarea con lenguaje natural',
  },
  {
    id: 'T06',
    category: 'tareas',
    message: 'Crea tarea urgente: preparar presentación',
    expectAny: [/creada|presentación|alta|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear tarea urgente → debe asignar prioridad Alta',
  },
  {
    id: 'T07',
    category: 'tareas',
    message: 'Cuántas tareas pendientes tengo',
    expectAny: [/\d+|tarea|pendiente|no hay/i],
    description: 'Contar tareas pendientes',
  },
  {
    id: 'T08',
    category: 'tareas',
    message: 'Tareas vencidas',
    expectAny: [/vencida|pendiente|no hay|tarea/i],
    description: 'Listar tareas vencidas',
  },

  // ══════════════════════════════════════
  // CALENDARIO (7)
  // ══════════════════════════════════════
  {
    id: 'E01',
    category: 'calendario',
    message: 'Qué reuniones tengo hoy',
    expectAny: [/reunión|evento|no hay|hoy|agenda/i],
    description: 'Agenda del día',
  },
  {
    id: 'E02',
    category: 'calendario',
    message: 'Agenda del lunes',
    expectAny: [/lunes|reunión|evento|no hay|agenda/i],
    description: 'Agenda de un día de la semana',
  },
  {
    id: 'E03',
    category: 'calendario',
    message: 'Agenda reunión con EvalCorp el viernes a las 11',
    expectAny: [/creado|agendad|reunión|viernes|✅/i],
    expectNone: [/error|fallo|no se pudo/i],
    description: 'Crear reunión con fecha relativa "el viernes"',
  },
  {
    id: 'E04',
    category: 'calendario',
    message: 'Crea evento: llamada con cliente mañana a las 9',
    expectAny: [/creado|agendad|llamada|mañana|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear evento tipo llamada con fecha "mañana"',
  },
  {
    id: 'E05',
    category: 'calendario',
    message: 'Programa recordatorio para el jueves',
    expectAny: [/creado|recordatorio|jueves|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear recordatorio con fecha relativa',
  },
  {
    id: 'E06',
    category: 'calendario',
    message: 'Qué tengo el próximo lunes',
    expectAny: [/lunes|reunión|evento|no hay/i],
    description: 'Consultar agenda de un día futuro',
  },
  {
    id: 'E07',
    category: 'calendario',
    message: 'Agenda reunión importante con AC2 Innovacion pasado mañana a las 16h',
    expectAny: [/creado|agendad|AC2|reunión|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear reunión "pasado mañana" con cliente mencionado',
  },

  // ══════════════════════════════════════
  // PIPELINE (6)
  // ══════════════════════════════════════
  {
    id: 'P01',
    category: 'pipeline',
    message: 'Muestra el pipeline',
    expectAny: [/oportunidad|pipeline|etapa|contacto|no hay/i],
    description: 'Listar oportunidades del pipeline',
  },
  {
    id: 'P02',
    category: 'pipeline',
    message: 'Qué oportunidades tengo abiertas',
    expectAny: [/oportunidad|pipeline|no hay/i],
    description: 'Listar oportunidades abiertas',
  },
  {
    id: 'P03',
    category: 'pipeline',
    message: 'Crea oportunidad "Proyecto EvalTest" valor 15000',
    expectAny: [/creada|Proyecto EvalTest|oportunidad|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear oportunidad con título y valor',
  },
  {
    id: 'P04',
    category: 'pipeline',
    message: 'Nueva oportunidad con EvalCorp por 5000 euros',
    expectAny: [/creada|EvalCorp|oportunidad|✅/i],
    expectNone: [/error|fallo/i],
    description: 'Crear oportunidad con empresa y valor en lenguaje natural',
  },
  {
    id: 'P05',
    category: 'pipeline',
    message: 'Oportunidades en etapa propuesta enviada',
    expectAny: [/oportunidad|propuesta|no hay/i],
    description: 'Filtrar pipeline por etapa',
  },
  {
    id: 'P06',
    category: 'pipeline',
    message: 'Cuánto vale el pipeline total',
    expectAny: [/€|euro|\d+|pipeline|valor/i],
    description: 'Valor total del pipeline',
  },

  // ══════════════════════════════════════
  // EDGE CASES (8)
  // ══════════════════════════════════════
  {
    id: 'X01',
    category: 'edge_cases',
    message: 'xyzcomandomuyraroquenoexiste',
    expectAny: [/no.*entend|no.*reconoc|ayud|puedo/i],
    expectNone: [/error 500|undefined|null/i],
    description: 'Comando sin sentido → debe responder educadamente',
  },
  {
    id: 'X02',
    category: 'edge_cases',
    message: 'Elimina todos mis clientes',
    expectAny: [/confirm|segur|¿|borrar|eliminar/i],
    description: 'Acción destructiva masiva → debe pedir confirmación',
  },
  {
    id: 'X03',
    category: 'edge_cases',
    message: '',
    expectAny: [/./], // Cualquier respuesta
    description: 'Mensaje vacío → no debe crashear',
  },
  {
    id: 'X04',
    category: 'edge_cases',
    message: '🎉🚀💯',
    expectAny: [/./],
    description: 'Solo emojis → debe responder sin error',
  },
  {
    id: 'X05',
    category: 'edge_cases',
    message: 'Crea cliente',
    expectAny: [/nombre|cómo|llama|dato|falta/i],
    description: 'Crear cliente sin datos → debe pedir el nombre',
  },
  {
    id: 'X06',
    category: 'edge_cases',
    message: 'Busca cliente con id 00000000-0000-0000-0000-000000000000',
    expectAny: [/no.*encontr|no hay|sin resultado/i],
    description: 'Buscar por UUID inexistente',
  },
  {
    id: 'X07',
    category: 'edge_cases',
    message: 'Cuál es mi nombre de usuario',
    expectAny: [/yuriescu|yuri|usuario|perfil|no.*sé/i],
    description: 'Preguntar datos del usuario logueado',
  },
  {
    id: 'X08',
    category: 'edge_cases',
    message: 'En qué fecha estamos',
    expectAny: [/\d{4}|\d+.*mayo|hoy|fecha/i],
    description: 'Consultar fecha actual → debe responder con la fecha',
  },
];

// ─────────────────────────────────────────────────────────────────
// FUNCIONES CORE
// ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendMessage(text: string): Promise<string> {
  const payload = {
    update_id: Date.now(),
    message: {
      message_id: Math.floor(Math.random() * 100000),
      from: {
        id: CONFIG.telegramUserId,
        is_bot: false,
        first_name: 'EvalBot',
        language_code: 'es',
      },
      chat: {
        id: CONFIG.telegramUserId,
        first_name: 'EvalBot',
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: text || '(vacío)',
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.messageTimeout);

  try {
    const res = await fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const body = await res.json().catch(() => ({}));

    // El webhook puede devolver la respuesta de distintas formas
    return (
      body?.text ||
      body?.message ||
      body?.result?.text ||
      JSON.stringify(body)
    );
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}

function evaluateResult(tc: TestCase, response: string): { passed: boolean; failReason?: string } {
  // Verificar que algún patrón positivo coincide
  const anyMatch = tc.expectAny.some((pattern) => pattern.test(response));
  if (!anyMatch) {
    return {
      passed: false,
      failReason: `Respuesta no contiene ningún patrón esperado: ${tc.expectAny.map((p) => p.toString()).join(' | ')}`,
    };
  }

  // Verificar que ningún patrón negativo coincide
  if (tc.expectNone) {
    const noneMatch = tc.expectNone.find((pattern) => pattern.test(response));
    if (noneMatch) {
      return {
        passed: false,
        failReason: `Respuesta contiene patrón no permitido: ${noneMatch}`,
      };
    }
  }

  return { passed: true };
}

// ─────────────────────────────────────────────────────────────────
// REPORTE
// ─────────────────────────────────────────────────────────────────

function printReport(results: TestResult[], verbose: boolean) {
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);
  const errors = results.filter((r) => r.response.startsWith('ERROR:'));

  // Agrupar por categoría
  const byCategory = results.reduce((acc, r) => {
    const cat = TEST_CASES.find((tc) => tc.id === r.id)!.category;
    if (!acc[cat]) acc[cat] = { passed: 0, failed: 0 };
    r.passed ? acc[cat].passed++ : acc[cat].failed++;
    return acc;
  }, {} as Record<string, { passed: number; failed: number }>);

  console.log('\n');
  console.log('═'.repeat(65));
  console.log('  ELITORBOT — REPORTE DE EVALUACIÓN');
  console.log('═'.repeat(65));
  console.log(`  Fecha: ${new Date().toLocaleString('es-ES')}`);
  console.log(`  Webhook: ${CONFIG.webhookUrl}`);
  console.log('─'.repeat(65));

  // Resultados por categoría
  console.log('\n  RESULTADOS POR CATEGORÍA:\n');
  for (const [cat, counts] of Object.entries(byCategory)) {
    const total = counts.passed + counts.failed;
    const pct = Math.round((counts.passed / total) * 100);
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    const emoji = pct === 100 ? '✅' : pct >= 70 ? '⚠️ ' : '❌';
    console.log(`  ${emoji} ${cat.padEnd(12)} ${bar} ${pct}% (${counts.passed}/${total})`);
  }

  console.log('\n' + '─'.repeat(65));

  // Tests fallidos
  if (failed.length > 0) {
    console.log('\n  ❌ TESTS FALLIDOS:\n');
    for (const r of failed) {
      const tc = TEST_CASES.find((t) => t.id === r.id)!;
      console.log(`  [${r.id}] ${tc.description}`);
      console.log(`        Mensaje:  "${r.message}"`);
      console.log(`        Respuesta: "${r.response.substring(0, 120)}..."`);
      console.log(`        Motivo:   ${r.failReason}`);
      console.log();
    }
  }

  // Tests verbose (todos)
  if (verbose) {
    console.log('\n  📋 TODOS LOS RESULTADOS:\n');
    for (const r of results) {
      const icon = r.passed ? '✅' : '❌';
      console.log(`  ${icon} [${r.id}] "${r.message.substring(0, 50)}"`);
      console.log(`        → "${r.response.substring(0, 100)}"`);
      console.log(`        (${r.durationMs}ms)`);
    }
  }

  // Resumen final
  console.log('═'.repeat(65));
  const totalPct = Math.round((passed.length / results.length) * 100);
  const finalEmoji = totalPct === 100 ? '🏆' : totalPct >= 80 ? '✅' : totalPct >= 60 ? '⚠️ ' : '❌';
  console.log(`\n  ${finalEmoji}  RESULTADO FINAL: ${passed.length}/${results.length} tests pasados (${totalPct}%)`);
  if (errors.length > 0) {
    console.log(`  ⚠️  ${errors.length} errores de conexión/timeout`);
  }
  console.log('\n' + '═'.repeat(65) + '\n');

  // Guardar reporte JSON
  const report = {
    date: new Date().toISOString(),
    webhook: CONFIG.webhookUrl,
    summary: {
      total: results.length,
      passed: passed.length,
      failed: failed.length,
      errors: errors.length,
      passRate: `${totalPct}%`,
    },
    byCategory,
    results: results.map((r) => ({
      ...r,
      tc: TEST_CASES.find((tc) => tc.id === r.id),
    })),
  };

  require('fs').writeFileSync(
    `eval-report-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );
  console.log('  📄 Reporte JSON guardado en eval-report-*.json\n');
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const categoryFilter = args.find((a) => a.startsWith('--category='))?.split('=')[1];
  const idFilter = args.find((a) => a.startsWith('--id='))?.split('=')[1];

  // Filtrar casos si se especifica
  let cases = TEST_CASES;
  if (categoryFilter) {
    cases = cases.filter((tc) => tc.category === categoryFilter);
    console.log(`\n  🔍 Filtrando por categoría: ${categoryFilter} (${cases.length} tests)`);
  }
  if (idFilter) {
    cases = cases.filter((tc) => tc.id === idFilter);
    console.log(`\n  🔍 Ejecutando solo: ${idFilter}`);
  }

  // Validar configuración
  if (CONFIG.telegramUserId === 0) {
    console.error('\n  ❌ ERROR: Debes configurar TEST_TELEGRAM_ID en el env o en CONFIG');
    console.error('     export TEST_TELEGRAM_ID=<tu_telegram_id>\n');
    process.exit(1);
  }

  console.log(`\n  🤖 ElitorBot Evaluador — ${cases.length} tests`);
  console.log(`  📡 Webhook: ${CONFIG.webhookUrl}`);
  console.log(`  ⏱️  Delay entre mensajes: ${CONFIG.delayBetweenMessages}ms\n`);

  const results: TestResult[] = [];

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const prefix = `  [${i + 1}/${cases.length}] [${tc.id}]`;
    process.stdout.write(`${prefix} "${tc.message.substring(0, 45)}"... `);

    const start = Date.now();
    let response = '';
    let passed = false;
    let failReason: string | undefined;

    try {
      response = await sendMessage(tc.message);
      const evaluation = evaluateResult(tc, response);
      passed = evaluation.passed;
      failReason = evaluation.failReason;
    } catch (err: any) {
      response = `ERROR: ${err.message}`;
      passed = false;
      failReason = `Excepción: ${err.message}`;
    }

    const durationMs = Date.now() - start;
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} (${durationMs}ms)`);

    if (!passed && !verbose) {
      console.log(`        ↳ ${failReason}`);
      console.log(`        ↳ Resp: "${response.substring(0, 100)}"`);
    }

    results.push({ id: tc.id, category: tc.category, message: tc.message, response, passed, failReason, durationMs });

    // Delay entre mensajes para no saturar el LLM
    if (i < cases.length - 1) {
      await sleep(CONFIG.delayBetweenMessages);
    }
  }

  printReport(results, verbose);

  // Exit code: 0 si todos pasan, 1 si hay fallos
  process.exit(results.every((r) => r.passed) ? 0 : 1);
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
