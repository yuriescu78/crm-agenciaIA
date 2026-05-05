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
    console.error('Error syncing to Google Calendar:', error);
    // Don't throw, just log. We don't want to break the CRM if Google fails.
    return null;
  }
}
