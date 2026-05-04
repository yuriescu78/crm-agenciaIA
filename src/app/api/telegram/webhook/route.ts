/**
 * Telegram Webhook Route
 * Receives Telegram updates and processes them through the LLM-powered agent.
 * Supports text messages, /vincular command, and callback queries.
 */

import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/agent/runner';
import { sendTelegramMessage } from '@/lib/telegram/handler';
import { authorizeTelegramUser, linkTelegramUser } from '@/lib/telegram/auth';

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // Handle text messages
    if (update.message?.text) {
      const telegramId = update.message.from.id;
      const chatId = update.message.chat.id;
      const text = update.message.text;

      // Handle /start command
      if (text === '/start') {
        await sendTelegramMessage(
          chatId,
          '👋 ¡Hola! Soy el asistente de NexusCRM.\n\n' +
          'Para empezar, necesitas vincular tu cuenta. ' +
          'Genera un código en la web y envíamelo con:\n\n' +
          '`/vincular TU_CODIGO`\n\n' +
          'Una vez vinculado, puedes pedirme cosas como:\n' +
          '• "Muestra mis clientes"\n' +
          '• "Crea una tarea para mañana"\n' +
          '• "¿Qué tengo en la agenda de hoy?"\n' +
          '• "Resumen del día"'
        );
        return NextResponse.json({ ok: true });
      }

      // Handle /vincular command
      const cleanText = text.trim();
      if (cleanText.startsWith('/vincular')) {
        const parts = cleanText.split(' ');
        const code = parts.length > 1 ? parts[1] : null;

        if (!code) {
          await sendTelegramMessage(
            chatId,
            '❌ Por favor, indica el código de vinculación.\n\nEjemplo: `/vincular 123456`'
          );
          return NextResponse.json({ ok: true });
        }

        const result = await linkTelegramUser(telegramId, code);

        if (result.success) {
          await sendTelegramMessage(
            chatId,
            '✅ ¡Cuenta vinculada correctamente! Ya puedes usar el CRM desde aquí.\n\n' +
            'Prueba con: "Resumen del día" o "Muestra mis clientes"'
          );
        } else {
          await sendTelegramMessage(chatId, `❌ ${result.error}`);
        }
        return NextResponse.json({ ok: true });
      }

      // Authorize user
      const auth = await authorizeTelegramUser(telegramId);
      if (!auth) {
        await sendTelegramMessage(
          chatId,
          '🔒 [NexusCRM] Tu cuenta de Telegram no está vinculada al sistema.\n\n' +
          'Genera un código en la sección "Telegram" de la web y envíamelo aquí con este formato:\n\n' +
          '`/vincular TU_CODIGO`'
        );
        return NextResponse.json({ ok: true });
      }

      // Process message through LLM agent
      const response = await processUserMessage(text, {
        crmUserId: auth.crmUserId,
        telegramId,
      });

      await sendTelegramMessage(chatId, response);
      return NextResponse.json({ ok: true });
    }

    // Ignore non-text updates (photos, stickers, etc.)
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en webhook:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'NexusCRM Telegram Bot',
    provider: process.env.LLM_PROVIDER || 'groq',
    model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
  });
}
