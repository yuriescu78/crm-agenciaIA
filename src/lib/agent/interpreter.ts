/**
 * Intent Interpreter Service
 * Maps natural language messages to structured CRM actions.
 */

export interface InterpretedIntent {
  intent: 'create_client' | 'search_client' | 'add_note' | 'create_task' | 'list_tasks' | 'update_stage' | 'unknown';
  params: Record<string, any>;
  originalMessage: string;
}

export async function interpretIntent(message: string): Promise<InterpretedIntent> {
  const msg = message.toLowerCase();
  
  // Basic Rule-based matching for MVP (would be replaced by LLM call)
  
  if (msg.includes('crea cliente') || msg.includes('nuevo cliente')) {
    return {
      intent: 'create_client',
      params: { raw: message },
      originalMessage: message
    };
  }

  if (msg.includes('busca cliente') || msg.includes('buscar')) {
    return {
      intent: 'search_client',
      params: { query: message.split(' ').slice(2).join(' ') },
      originalMessage: message
    };
  }

  if (msg.includes('añade nota') || msg.includes('nota a')) {
    return {
      intent: 'add_note',
      params: { content: message },
      originalMessage: message
    };
  }

  if (msg.includes('crea tarea') || msg.includes('nueva tarea')) {
    return {
      intent: 'create_task',
      params: { title: message },
      originalMessage: message
    };
  }

  if (msg.includes('qué tareas') || msg.includes('tareas hoy')) {
    return {
      intent: 'list_tasks',
      params: {},
      originalMessage: message
    };
  }

  if (msg.includes('pasa a') || msg.includes('cambia estado')) {
    return {
      intent: 'update_stage',
      params: { raw: message },
      originalMessage: message
    };
  }

  return {
    intent: 'unknown',
    params: {},
    originalMessage: message
  };
}

// Logic to execute CRM actions based on intent
export async function executeCRMAction(interpreted: InterpretedIntent, userId: string) {
  console.log(`Executing action ${interpreted.intent} for user ${userId}`);
  
  switch (interpreted.intent) {
    case 'create_client':
      // Call Supabase to create client
      break;
    case 'add_note':
      // Call Supabase to create activity
      break;
    case 'create_task':
      // Call Supabase to create task
      break;
    default:
      return "No estoy seguro de cómo realizar esa acción. ¿Podrías ser más específico?";
  }

  return `Entendido. He procesado tu solicitud de: ${interpreted.intent}`;
}
