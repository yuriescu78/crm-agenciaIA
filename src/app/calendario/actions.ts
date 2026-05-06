'use server';

import { getGoogleEvents, syncEventToGoogle } from '@/lib/google/calendar';

export async function fetchGoogleEventsAction(timeMin: string, timeMax: string) {
  try {
    const googleEvents = await getGoogleEvents(timeMin, timeMax);
    
    // Fetch local events to match clients
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: localEvents } = await supabase
      .from('calendar_events')
      .select('*, clients(first_name, last_name)')
      .gte('start_at', timeMin)
      .lte('end_at', timeMax);

    // Merge or enrich google events
    const enrichedEvents = googleEvents.map(ge => {
      // Find a local event that starts at the same time and has same title
      const match = localEvents?.find(le => 
        new Date(le.start_at).getTime() === new Date(ge.startAt).getTime() &&
        le.title === ge.title
      );

      if (match) {
        return {
          ...ge,
          clientId: match.client_id,
          clientName: match.clients ? `${match.clients.first_name} ${match.clients.last_name}` : null,
          localId: match.id
        };
      }
      return ge;
    });

    return enrichedEvents;
  } catch (error) {
    console.error('Failed to fetch events from Google:', error);
    return [];
  }
}

export async function createGoogleEventAction(eventData: { title: string; description?: string; startAt: string; endAt: string; }) {
  try {
    const res = await syncEventToGoogle(eventData);
    return { success: true, data: res };
  } catch (error) {
    console.error('Failed to create event in Google:', error);
    return { success: false, error: 'Failed to create event' };
  }
}

export async function updateGoogleEventAction(eventId: string, eventData: { title: string; description?: string; startAt: string; endAt: string; }) {
  try {
    const { updateEventInGoogle } = await import('@/lib/google/calendar');
    const res = await updateEventInGoogle(eventId, eventData);
    return { success: true, data: res };
  } catch (error) {
    console.error('Failed to update event in Google:', error);
    return { success: false, error: 'Failed to update event' };
  }
}

export async function deleteGoogleEventAction(eventId: string) {
  try {
    const { deleteEventFromGoogle } = await import('@/lib/google/calendar');
    await deleteEventFromGoogle(eventId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete event in Google:', error);
    return { success: false, error: 'Failed to delete event' };
  }
}
