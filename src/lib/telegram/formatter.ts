/**
 * Telegram Message Formatter
 * Utility functions to format CRM data for clean Telegram display.
 */

/**
 * Format a client object for Telegram display.
 */
export function formatClient(client: any): string {
  const lines = [
    `👤 *${client.first_name || ''} ${client.last_name || ''}*`.trim(),
  ];
  if (client.company) lines.push(`🏢 ${client.company}`);
  if (client.email) lines.push(`📧 ${client.email}`);
  if (client.phone) lines.push(`📱 ${client.phone}`);
  if (client.status) lines.push(`📌 Estado: ${client.status}`);
  return lines.join('\n');
}

/**
 * Format a list of clients.
 */
export function formatClientList(clients: any[]): string {
  if (!clients.length) return '📭 No se encontraron clientes.';
  return clients.map((c, i) => `${i + 1}. ${c.first_name} ${c.last_name || ''} — ${c.company || 'Sin empresa'}`).join('\n');
}

/**
 * Format a task for Telegram display.
 */
export function formatTask(task: any): string {
  const priorityEmoji: Record<string, string> = {
    Alta: '🔴',
    Media: '🟡',
    Baja: '🟢',
  };
  const emoji = priorityEmoji[task.priority] || '⚪';
  const clientName = task.clients
    ? `${task.clients.first_name} ${task.clients.last_name || ''}`.trim()
    : 'Sin cliente';

  return [
    `${emoji} *${task.title}*`,
    task.description ? `📝 ${task.description}` : '',
    `📅 ${task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}`,
    `👤 ${clientName}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Format a list of tasks.
 */
export function formatTaskList(tasks: any[]): string {
  if (!tasks.length) return '✅ No hay tareas pendientes.';
  return tasks.map((t) => formatTask(t)).join('\n\n');
}

/**
 * Format a calendar event for Telegram display.
 */
export function formatEvent(event: any): string {
  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);
  return [
    `📅 *${event.title}*`,
    `🕐 ${startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
    event.description ? `📝 ${event.description}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Escape special characters for Telegram MarkdownV2.
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
