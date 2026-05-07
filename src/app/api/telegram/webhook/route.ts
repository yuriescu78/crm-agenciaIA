/**
 * Telegram Webhook Route (v2 - con idempotencia y protección de errores)
 * 
 * Cambios respecto a v1:
 * - Protección contra mensajes duplicados (by update_id)
 * - Respuesta 200 inmediata al webhook para evitar timeouts de Telegram
 * - Errores nunca exponen datos técnicos al usuario
 * - Voice transcription con fallback limpio
 */

import { NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/agent/runner';
import { sendTelegramMessage } from '@/lib/telegram/handler';
import { authorizeTelegramUser, linkTelegramUser } from '@/lib/telegram/auth';
import {
  getUnreadNotificationsForTelegram,
  markAllAsRead,
} from '@/lib/telegram/notifications';

// Protección contra mensajes duplicados.
// Telegram puede reenviar webhooks si no respondemos rápido.
// Guardamos los últimos N update_ids procesados en memoria.
// En producción con múltiples instancias, usar Redis o Supabase.
const PROCESSED_UPDATES = new Set<number>();
const MAX_PROCESSED_CACHE = 1000;

function isDuplicate(updateId: number): boolean {
  if (PROCESSED_UPDATES.has(updateId)) return true;

  PROCESSED_UPDATES.add(updateId);

  // Evitar que el Set crezca indefinidamente
  if (PROCESSED_UPDATES.size > MAX_PROCESSED_CACHE) {
    const oldest = PROCESSED_UPDATES.values().next().value;
    if (oldest !== undefined) PROCESSED_UPDATES.delete(oldest);
  }

  return false;
}

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // 1. Protección contra duplicados
    if (update.update_id && isDuplicate(update.update_id)) {
      return NextResponse.json({ ok: true });
    }

    // 2. Extraer texto (de mensaje de texto o de audio)
    let text = update.message?.text || '';

    if (update.message?.voice) {
      text = await transcribeVoice(update.message);
      if (!text) {
        const chatId = update.message.chat.id;
        await sendTelegramMessage(
          chatId,
          '❌ No he podido entender el audio. ¿Puedes escribirlo?'
        );
        return NextResponse.json({ ok: true });
      }
    }

    if (!text) {
      // Ignorar updates sin texto (fotos, stickers, etc.)
      return NextResponse.json({ ok: true });
    }

    const telegramId = update.message.from.id;
    const chatId = update.message.chat.id;

    // 3. Comandos que no necesitan autenticación
    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        '👋 ¡Hola! Soy el asistente de ELITOR.IA CRM.\n\n' +
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

    // 4. Comando /vincular
    const cleanText = text.trim();
    if (cleanText.startsWith('/vincular')) {
      await handleLinkCommand(chatId, telegramId, cleanText);
      return NextResponse.json({ ok: true });
    }

    // 5. Autenticación
    const auth = await authorizeTelegramUser(telegramId);
    if (!auth) {
      await sendTelegramMessage(
        chatId,
        '🔒 Tu cuenta de Telegram no está vinculada al CRM.\n\n' +
          'Genera un código en la web (sección Telegram) y envíamelo con:\n\n' +
          '`/vincular TU_CODIGO`'
      );
      return NextResponse.json({ ok: true });
    }

    // 6. Comandos rápidos (no pasan por el LLM → 0 tokens)
    if (text === '/notificaciones') {
      const response = await getUnreadNotificationsForTelegram(auth.crmUserId);
      await sendTelegramMessage(chatId, response);
      return NextResponse.json({ ok: true });
    }

    if (text === '/leidas') {
      const response = await markAllAsRead(auth.crmUserId);
      await sendTelegramMessage(chatId, response);
      return NextResponse.json({ ok: true });
    }

    // 7. Procesar a través del LLM
    const response = await processUserMessage(text, {
      crmUserId: auth.crmUserId,
      telegramId,
    });

    await sendTelegramMessage(chatId, response);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en webhook:', err);

    // Intentar notificar al usuario si tenemos chatId
    try {
      const body = await req.clone().json().catch(() => null);
      const chatId = body?.message?.chat?.id;
      if (chatId) {
        await sendTelegramMessage(
          chatId,
          '❌ Ha ocurrido un error interno. Inténtalo de nuevo en unos segundos.'
        );
      }
    } catch {
      // Si ni siquiera podemos parsear el body, silenciar
    }

    // Siempre devolver 200 a Telegram para que no reintente
    return NextResponse.json({ ok: true });
  }
}

/**
 * Transcribe un mensaje de voz usando Groq Whisper.
 * Devuelve el texto o null si falla.
 */
async function transcribeVoice(
  message: { voice: { file_id: string }; chat: { id: number } }
): Promise<string | null> {
  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramToken) return null;

    // 1. Obtener ruta del archivo
    const fileRes = await fetch(
      `https://api.telegram.org/bot${telegramToken}/getFile?file_id=${message.voice.file_id}`
    );
    const fileData = await fileRes.json();
    if (!fileData.ok) return null;

    // 2. Descargar audio
    const audioRes = await fetch(
      `https://api.telegram.org/file/bot${telegramToken}/${fileData.result.file_path}`
    );
    const audioBlob = await audioRes.blob();

    // 3. Transcribir con Groq Whisper
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice.ogg');
    formData.append('model', 'whisper-large-v3-turbo');

    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: formData,
      }
    );

    const groqData = await groqRes.json();
    return groqData.text || null;
  } catch (err) {
    console.error('Error transcribiendo audio:', err);
    return null;
  }
}

/**
 * Maneja el comando /vincular CODE
 */
async function handleLinkCommand(
  chatId: number,
  telegramId: number,
  text: string
): Promise<void> {
  const parts = text.split(' ');
  const code = parts.length > 1 ? parts[1] : null;

  if (!code) {
    await sendTelegramMessage(
      chatId,
      '❌ Indica el código de vinculación.\n\nEjemplo: `/vincular 123456`'
    );
    return;
  }

  const result = await linkTelegramUser(telegramId, code);

  if (result.success) {
    await sendTelegramMessage(
      chatId,
      '✅ ¡Cuenta vinculada! Ya puedes usar el CRM desde aquí.\n\n' +
        'Prueba con: "Resumen del día" o "Muestra mis clientes"'
    );
  } else {
    await sendTelegramMessage(chatId, `❌ ${result.error}`);
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ELITOR.IA CRM Telegram Bot',
    version: 'v2',
  });
}
