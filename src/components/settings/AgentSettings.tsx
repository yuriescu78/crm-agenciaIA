"use client";

import { useState, useEffect } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  Settings2, 
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function AgentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramInfo, setTelegramInfo] = useState<{ linked: boolean; chatId?: string; code?: string }>({ linked: false });
  const [agentConfig, setAgentConfig] = useState({
    model: 'groq-llama-3-70b',
    temperature: 0.7,
    instructions: `Eres ElitorBot, el Copiloto Comercial del sistema ELITOR.IA CRM. Tu papel es ser un asistente ejecutivo de alto nivel: resolutivo, impecable y proactivo.

### 🎭 PERSONALIDAD Y TONO
- Sé serio y profesional, pero cercano. Usa "tú" para dirigirte al usuario.
- Evita el lenguaje excesivamente robótico o servil (no digas "A sus órdenes", di "Entendido, ya está hecho").
- Sé extremadamente conciso. El tiempo del usuario vale oro.
- Usa emojis con elegancia para estructurar la información (ej: 📈 para datos, 📅 para citas, ✅ para tareas hechas).

### 🚀 COMPORTAMIENTO PROACTIVO
- Si el usuario te saluda, no solo digas "hola", dale un breve resumen de lo más importante que tiene hoy (tareas urgentes o reuniones próximas).
- No esperes instrucciones detalladas. Si el usuario pide "Agéname con Juan mañana", tú busca a Juan, mira el calendario y propón una hora o regístralo directamente si es obvio.
- Si una operación falla, no des excusas técnicas largas. Explica el problema y ofrece una solución.

### 🚫 REGLAS DE ORO
- NUNCA muestres IDs técnicos de la base de datos (UUIDs). Usa nombres o títulos legibles.
- Formatea siempre las listas con negritas para que se lean rápido en el móvil.
- Si falta un dato (como la prioridad), elige tú la más lógica y avisa al usuario.`
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    console.log('--- fetchConfig START ---');
    
    // Safety timeout: stop loading after 5 seconds no matter what
    const timeoutId = setTimeout(() => {
      console.warn('fetchConfig timeout reached');
      setLoading(false);
    }, 5000);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Error de sesión', { description: sessionError.message });
        return;
      }

      const user = session?.user;
      console.log('User session:', user?.id);
      
      if (!user) {
        console.warn('No user found in session');
        return;
      }

      // 1. Check telegram status
      try {
        const { data: tgUser, error: tgError } = await supabase
          .from('telegram_users')
          .select('telegram_user_id')
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle();

        if (tgError) console.error('Telegram user fetch error:', tgError);
        if (tgUser) {
          setTelegramInfo({ linked: true, chatId: tgUser.telegram_user_id });
        } else {
          // Fetch or generate a REAL linking code
          const { data: existingCode, error: codeError } = await supabase
            .from('telegram_link_codes')
            .select('code')
            .eq('user_id', user.id)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

          if (codeError) console.error('Link code fetch error:', codeError);

          if (existingCode) {
            setTelegramInfo({ linked: false, code: existingCode.code });
          } else {
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { error: insertError } = await supabase
              .from('telegram_link_codes')
              .insert({
                code: newCode,
                user_id: user.id,
                expires_at: new Date(Date.now() + 15 * 60000).toISOString()
              });
            
            if (!insertError) {
              setTelegramInfo({ linked: false, code: newCode });
            } else {
              console.error('Insert code error:', insertError);
            }
          }
        }
      } catch (err) {
        console.error('Error in telegram info fetch:', err);
      }

      // 2. Fetch agent preferences from user metadata or profile
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('agent_config')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) console.error('Profile fetch error:', profileError);

        if (profile?.agent_config) {
          console.log('Agent config found:', profile.agent_config);
          setAgentConfig(prev => ({ ...prev, ...profile.agent_config }));
        }
      } catch (err) {
        console.error('Error in profile fetch:', err);
      }

    } catch (error: any) {
      console.error('Error fetching agent config:', error);
      toast.error('Error de conexión', { description: 'No se pudo conectar con el servidor de la IA.' });
    } finally {
      console.log('--- fetchConfig FINISHED ---');
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleSaveAgent = async () => {
    setSaving(true);
    console.log("AGENT_SETTINGS: Intentando guardar configuración...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No autenticado');

      // Creamos una promesa que falla a los 7 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar con la base de datos')), 7000)
      );

      // Ejecutamos la actualización con el timeout
      const updatePromise = supabase
        .from('users')
        .update({ 
          agent_config: agentConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      const result: any = await Promise.race([updatePromise, timeoutPromise]);
      
      if (result.error) throw result.error;

      console.log("AGENT_SETTINGS: Guardado exitoso.");
      toast.success('Configuración guardada', {
        description: 'El cerebro del agente ha sido actualizado.'
      });
    } catch (error: any) {
      console.error('AGENT_SETTINGS: Error al guardar:', error);
      toast.error('Error al guardar', { 
        description: error.message || 'No se pudo conectar con la base de datos.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const copyLinkingCode = () => {
    if (telegramInfo.code) {
      navigator.clipboard.writeText(`/vincular ${telegramInfo.code}`);
      toast.success('Comando copiado', {
        description: 'Pégalo en el chat de Telegram con el bot.'
      });
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm font-medium text-neutral-500">Conectando con el agente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Telegram Bot Connection Card */}
      <div className="nc-card p-0 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">Conexión con Telegram</h3>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight">Vincula tu cuenta para el asistente móvil</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {telegramInfo.linked ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm text-green-600">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-green-900">Bot Vinculado Correctamente</h4>
                  <p className="text-[12px] text-green-700">Chat ID: {telegramInfo.chatId || 'Desconocido'}</p>
                </div>
              </div>
              <Button variant="outline" className="h-9 text-[11px] font-black border-green-200 text-green-700 hover:bg-green-100">
                Desvincular
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                  <Terminal size={20} />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-blue-900">Instrucciones de Vinculación</h4>
                  <p className="text-[12px] text-blue-700 mt-1">
                    Busca a nuestro bot en Telegram e inicia una conversación. Copia y envía el siguiente comando:
                  </p>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <code className="flex-1 p-3 bg-white border border-blue-200 rounded-xl font-mono text-[13px] text-blue-800 font-bold">
                      /vincular {telegramInfo.code}
                    </code>
                    <Button onClick={copyLinkingCode} variant="outline" className="h-12 w-12 p-0 rounded-xl bg-white border-blue-200 hover:bg-blue-100 text-blue-600">
                      <Copy size={18} />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-8">
                 <div className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-black text-neutral-400 uppercase">Estado Bot</span>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                       <span className="text-[13px] font-bold text-neutral-700">Online</span>
                    </div>
                 </div>
                 <div className="w-px h-8 bg-neutral-100" />
                 <div className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-black text-neutral-400 uppercase">Comandos</span>
                    <span className="text-[13px] font-bold text-neutral-700">6 Activos</span>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Agent Brain Config */}
      <div className="nc-card p-0 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">Cerebro de la IA</h3>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight">Personaliza el comportamiento del agente</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[12px] font-black text-neutral-400 uppercase ml-1">Modelo LLM</label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-3 text-neutral-400" size={16} />
                <select 
                  className="w-full pl-10 h-12 bg-neutral-50 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all rounded-xl text-[14px] font-bold text-neutral-900 appearance-none"
                  value={agentConfig.model}
                  onChange={(e) => setAgentConfig({...agentConfig, model: e.target.value})}
                >
                  <option value="groq-llama-3-70b">Groq Llama 3 (70B) - Ultra Rápido</option>
                  <option value="groq-llama-3-8b">Groq Llama 3 (8B) - Instantáneo</option>
                  <option value="gpt-4o">GPT-4o (OpenAI)</option>
                  <option value="claude-3-5-haiku-20241022">Anthropic Claude 3.5 Haiku</option>
                  <option value="claude-haiku-4-5-20251001">Anthropic Claude 4.5 Haiku (Beta)</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[12px] font-black text-neutral-400 uppercase ml-1">Creatividad (Temp)</label>
              <div className="flex items-center gap-4 h-12 bg-neutral-50 px-4 rounded-xl border border-neutral-200">
                <Zap className="text-amber-500 shrink-0" size={16} />
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  className="flex-1 accent-primary-600"
                  value={agentConfig.temperature}
                  onChange={(e) => setAgentConfig({...agentConfig, temperature: parseFloat(e.target.value)})}
                />
                <span className="text-[13px] font-bold text-neutral-700 min-w-[30px]">{agentConfig.temperature}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[12px] font-black text-neutral-400 uppercase">Instrucciones del Sistema</label>
              <span className="text-[11px] font-bold text-primary-500">PRO MODO</span>
            </div>
            <textarea 
              className="w-full p-4 bg-neutral-50 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all rounded-2xl text-[13px] leading-relaxed font-medium text-neutral-900 min-h-[120px]"
              value={agentConfig.instructions}
              onChange={(e) => setAgentConfig({...agentConfig, instructions: e.target.value})}
              placeholder="Describe cómo quieres que actúe tu asistente..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSaveAgent}
              disabled={saving}
              className="nc-btn nc-btn-primary h-11 px-8 shadow-lg shadow-primary-500/20"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : 'Guardar Configuración'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
