/**
 * Telegram Bot API Handler
 * Core functions for sending messages to Telegram.
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
 * Supports MarkdownV2 and HTML parse modes.
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  parseMode: string = 'Markdown'
): Promise<any> {
  const res = await fetch(apiUrl('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });

  const result = await res.json();

  // If Markdown parsing fails, retry without parse_mode
  if (!result.ok && parseMode === 'Markdown') {
    const retryRes = await fetch(apiUrl('sendMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    return retryRes.json();
  }

  return result;
}

/**
 * Send a message with inline keyboard buttons.
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
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<any> {
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
