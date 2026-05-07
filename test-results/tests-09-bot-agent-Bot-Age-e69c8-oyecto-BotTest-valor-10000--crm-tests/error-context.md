# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/09-bot-agent.spec.ts >> Bot Agent — Evaluación funcional >> [P02] pipeline: "Crea oportunidad "Proyecto BotTest" valor 10000"
- Location: tests/tests/09-bot-agent.spec.ts:196:9

# Error details

```
Error: Esperaba patrón /creada|Proyecto BotTest|oportunidad/i en la respuesta del bot

expect(received).toMatch(expected)

Expected pattern: /creada|Proyecto BotTest|oportunidad/i
Received string:  "{\"ok\":true}"
```

# Test source

```ts
  115 |     message: 'Crea oportunidad "Proyecto BotTest" valor 10000',
  116 |     expectPattern: /creada|Proyecto BotTest|oportunidad/i,
  117 |     category: 'pipeline',
  118 |     cleanup: true,
  119 |   },
  120 | 
  121 |   // ── Búsquedas ──
  122 |   {
  123 |     id: 'B01',
  124 |     message: 'Busca algo que no existe xyznoexiste123',
  125 |     expectPattern: /no.*encontr|sin resultado|no hay/i,
  126 |     category: 'busqueda',
  127 |   },
  128 | 
  129 |   // ── Comandos complejos ──
  130 |   {
  131 |     id: 'X01',
  132 |     message: 'Dame un resumen del día',
  133 |     expectPattern: /cliente|tarea|reunión|resumen|hoy/i,
  134 |     category: 'saludo',
  135 |   },
  136 |   {
  137 |     id: 'X02',
  138 |     message: 'Cuántos clientes tengo',
  139 |     expectPattern: /\d+|client/i,
  140 |     category: 'clientes',
  141 |   },
  142 | ];
  143 | 
  144 | // ─────────────────────────────────────────
  145 | // Runner — llama al webhook como si fuera Telegram
  146 | // ─────────────────────────────────────────
  147 | 
  148 | test.describe('Bot Agent — Evaluación funcional', () => {
  149 |   const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  150 |   const TELEGRAM_ID = process.env.TEST_TELEGRAM_ID || '123456789';
  151 |   const WEBHOOK_URL = `${BASE_URL}/api/telegram/webhook`;
  152 | 
  153 |   /**
  154 |    * Simula un mensaje de Telegram al webhook.
  155 |    * El webhook espera el formato de Telegram Bot API.
  156 |    */
  157 |   async function sendTelegramMessage(text: string): Promise<string> {
  158 |     const telegramPayload = {
  159 |       update_id: Date.now(),
  160 |       message: {
  161 |         message_id: Date.now(),
  162 |         from: {
  163 |           id: Number(TELEGRAM_ID),
  164 |           is_bot: false,
  165 |           first_name: 'TestUser',
  166 |           language_code: 'es',
  167 |         },
  168 |         chat: {
  169 |           id: Number(TELEGRAM_ID),
  170 |           first_name: 'TestUser',
  171 |           type: 'private',
  172 |         },
  173 |         date: Math.floor(Date.now() / 1000),
  174 |         text,
  175 |       },
  176 |     };
  177 | 
  178 |     const response = await fetch(WEBHOOK_URL, {
  179 |       method: 'POST',
  180 |       headers: { 'Content-Type': 'application/json' },
  181 |       body: JSON.stringify(telegramPayload),
  182 |     });
  183 | 
  184 |     if (!response.ok) {
  185 |       throw new Error(`Webhook respondió ${response.status}: ${await response.text()}`);
  186 |     }
  187 | 
  188 |     const body = await response.json();
  189 |     // El webhook puede responder directamente o enviar via Telegram API
  190 |     // Si responde JSON con text, lo usamos
  191 |     return body?.text || body?.message || JSON.stringify(body);
  192 |   }
  193 | 
  194 |   // ── Ejecutar cada test case ──
  195 |   for (const tc of TEST_CASES) {
  196 |     test(`[${tc.id}] ${tc.category}: "${tc.message}"`, async () => {
  197 |       console.log(`\n🧪 [${tc.id}] Enviando: "${tc.message}"`);
  198 | 
  199 |       let response: string;
  200 |       try {
  201 |         response = await sendTelegramMessage(tc.message);
  202 |       } catch (err) {
  203 |         // Si el webhook falla, marcamos como skip (no fail)
  204 |         console.log(`⚠️ Webhook no respondió: ${err}`);
  205 |         test.skip(true, 'Webhook no disponible');
  206 |         return;
  207 |       }
  208 | 
  209 |       console.log(`📩 Respuesta: ${response.substring(0, 200)}...`);
  210 | 
  211 |       // Verificar que la respuesta coincide con el patrón esperado
  212 |       expect(
  213 |         response,
  214 |         `Esperaba patrón ${tc.expectPattern} en la respuesta del bot`
> 215 |       ).toMatch(tc.expectPattern);
      |         ^ Error: Esperaba patrón /creada|Proyecto BotTest|oportunidad/i en la respuesta del bot
  216 |     });
  217 |   }
  218 | });
  219 | 
```