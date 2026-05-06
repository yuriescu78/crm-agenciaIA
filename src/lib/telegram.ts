/**
 * Telegram Bot API Helper
 * Sends messages, inline keyboards, and manages bot communication.
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no está configurado en .env.local');
  return token;
}

function apiUrl(method: string): string {
  return `${TELEGRAM_API}${getToken()}/${method}`;
}

/**
 * Send a plain text message to a Telegram chat.
 */
export async function sendMessage(chatId: string | number, text: string, parseMode: string = 'Markdown'): Promise<any> {
  const res = await fetch(apiUrl('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
  return res.json();
}

/**
 * Send a message with inline keyboard buttons.
 * buttons is an array of rows, each row is an array of { text, callback_data }
 */
export async function sendMessageWithButtons(
  chatId: string | number,
  text: string,
  buttons: { text: string; callback_data: string }[][],
  parseMode: string = 'Markdown'
): Promise<any> {
  const res = await fetch(apiUrl('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      reply_markup: {
        inline_keyboard: buttons,
      },
    }),
  });
  return res.json();
}

/**
 * Answer a callback query (dismiss the "loading" spinner on button press)
 */
export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<any> {
  const res = await fetch(apiUrl('answerCallbackQuery'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || '',
    }),
  });
  return res.json();
}

/**
 * Send the main menu with all available actions.
 */
export async function sendMainMenu(chatId: string | number): Promise<any> {
  const text = `🏢 *ELITOR.IA CRM — Menú Principal*\n\nSelecciona una opción para gestionar tu CRM:`;

  const buttons = [
    [
      { text: '👥 Clientes', callback_data: 'menu_clients' },
      { text: '📋 Tareas', callback_data: 'menu_tasks' },
    ],
    [
      { text: '📅 Calendario', callback_data: 'menu_calendar' },
      { text: '📊 Pipeline', callback_data: 'menu_pipeline' },
    ],
    [
      { text: '📈 Resumen del Día', callback_data: 'action_daily_summary' },
    ],
  ];

  return sendMessageWithButtons(chatId, text, buttons);
}

/**
 * Send a sub-menu for a specific entity (clients, tasks, etc.).
 */
export async function sendEntityMenu(chatId: string | number, entity: 'clients' | 'tasks' | 'calendar' | 'pipeline'): Promise<any> {
  const menus: Record<string, { title: string; buttons: { text: string; callback_data: string }[][] }> = {
    clients: {
      title: '👥 *Gestión de Clientes*',
      buttons: [
        [
          { text: '📋 Listar Clientes', callback_data: 'action_list_clients' },
          { text: '🔍 Buscar Cliente', callback_data: 'action_search_client' },
        ],
        [
          { text: '➕ Nuevo Cliente', callback_data: 'action_create_client' },
        ],
        [{ text: '⬅️ Volver al Menú', callback_data: 'menu_main' }],
      ],
    },
    tasks: {
      title: '📋 *Gestión de Tareas*',
      buttons: [
        [
          { text: '📋 Tareas de Hoy', callback_data: 'action_tasks_today' },
          { text: '🔴 Urgentes', callback_data: 'action_tasks_urgent' },
        ],
        [
          { text: '📋 Todas las Tareas', callback_data: 'action_list_tasks' },
          { text: '➕ Nueva Tarea', callback_data: 'action_create_task' },
        ],
        [{ text: '⬅️ Volver al Menú', callback_data: 'menu_main' }],
      ],
    },
    calendar: {
      title: '📅 *Calendario*',
      buttons: [
        [
          { text: '📅 Próximos Eventos', callback_data: 'action_list_events' },
          { text: '➕ Nuevo Evento', callback_data: 'action_create_event' },
        ],
        [{ text: '⬅️ Volver al Menú', callback_data: 'menu_main' }],
      ],
    },
    pipeline: {
      title: '📊 *Pipeline de Gestión*',
      buttons: [
        [
          { text: '📊 Ver Pipeline', callback_data: 'action_list_pipeline' },
          { text: '➕ Nueva Oportunidad', callback_data: 'action_create_opportunity' },
        ],
        [{ text: '⬅️ Volver al Menú', callback_data: 'menu_main' }],
      ],
    },
  };

  const menu = menus[entity];
  return sendMessageWithButtons(chatId, menu.title, menu.buttons);
}

/**
 * Register the webhook URL with Telegram.
 * Call this once when deploying.
 */
export async function setWebhook(url: string): Promise<any> {
  const res = await fetch(apiUrl('setWebhook'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}
