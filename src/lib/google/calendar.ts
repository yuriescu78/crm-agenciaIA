import { getAuthorizedCalendar } from '@/lib/google';

export async function syncEventToGoogle(eventData: {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
}) {
  try {
    const calendar = await getAuthorizedCalendar();

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startAt,
          timeZone: 'Europe/Madrid', // You can make this dynamic later
        },
        end: {
          dateTime: eventData.endAt,
          timeZone: 'Europe/Madrid',
        },
      },
    });

    return {
      googleEventId: response.data.id,
      link: response.data.htmlLink
    };
  } catch (error) {
    console.error('Error syncing to Google Calendar:', JSON.stringify(error, null, 2));
    console.error('Error message:', (error as any)?.message);
    console.error('Error status:', (error as any)?.status);
    console.error('Error response:', (error as any)?.response?.data);
    return null;
  }
}

export async function getGoogleEvents(timeMin: string, timeMax: string) {
  try {
    const calendar = await getAuthorizedCalendar();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items?.map(event => ({
      id: event.id,
      title: event.summary || 'Sin título',
      description: event.description || '',
      startAt: event.start?.dateTime || event.start?.date,
      endAt: event.end?.dateTime || event.end?.date,
      link: event.htmlLink,
      colorId: event.colorId
    })) || [];
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return [];
  }
}

export async function updateEventInGoogle(eventId: string, eventData: {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
}) {
  try {
    const calendar = await getAuthorizedCalendar();
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startAt,
          timeZone: 'Europe/Madrid',
        },
        end: {
          dateTime: eventData.endAt,
          timeZone: 'Europe/Madrid',
        },
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating Google event:', error);
    throw error;
  }
}

export async function deleteEventFromGoogle(eventId: string) {
  try {
    const calendar = await getAuthorizedCalendar();
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google event:', error);
    throw error;
  }
}
