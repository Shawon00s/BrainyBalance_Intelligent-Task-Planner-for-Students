import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

class GoogleCalendarService {
    constructor() {
        this.oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    }

    // Generate Google OAuth2 authorization URL
    getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    // Exchange authorization code for tokens
    async getTokens(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            return tokens;
        } catch (error) {
            throw new Error(`Failed to get tokens: ${error.message}`);
        }
    }

    // Set credentials for the OAuth2 client
    setCredentials(tokens) {
        this.oauth2Client.setCredentials(tokens);
    }

    // Get user's calendar list
    async getCalendars() {
        try {
            const response = await this.calendar.calendarList.list();
            return response.data.items;
        } catch (error) {
            throw new Error(`Failed to fetch calendars: ${error.message}`);
        }
    }

    // Create a calendar event
    async createEvent(calendarId, eventData) {
        try {
            const event = {
                summary: eventData.title,
                description: eventData.description || '',
                start: {
                    dateTime: eventData.startDateTime,
                    timeZone: eventData.timeZone || 'UTC',
                },
                end: {
                    dateTime: eventData.endDateTime,
                    timeZone: eventData.timeZone || 'UTC',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 }, // 1 day before
                        { method: 'popup', minutes: 30 }, // 30 minutes before
                    ],
                },
            };

            // Add location if provided
            if (eventData.location) {
                event.location = eventData.location;
            }

            // Add recurrence if provided
            if (eventData.recurrence) {
                event.recurrence = eventData.recurrence;
            }

            const response = await this.calendar.events.insert({
                calendarId: calendarId,
                resource: event,
            });

            return response.data;
        } catch (error) {
            throw new Error(`Failed to create event: ${error.message}`);
        }
    }

    // Update a calendar event
    async updateEvent(calendarId, eventId, eventData) {
        try {
            const event = {
                summary: eventData.title,
                description: eventData.description || '',
                start: {
                    dateTime: eventData.startDateTime,
                    timeZone: eventData.timeZone || 'UTC',
                },
                end: {
                    dateTime: eventData.endDateTime,
                    timeZone: eventData.timeZone || 'UTC',
                },
            };

            const response = await this.calendar.events.update({
                calendarId: calendarId,
                eventId: eventId,
                resource: event,
            });

            return response.data;
        } catch (error) {
            throw new Error(`Failed to update event: ${error.message}`);
        }
    }

    // Delete a calendar event
    async deleteEvent(calendarId, eventId) {
        try {
            await this.calendar.events.delete({
                calendarId: calendarId,
                eventId: eventId,
            });
            return true;
        } catch (error) {
            throw new Error(`Failed to delete event: ${error.message}`);
        }
    }

    // Get events from calendar
    async getEvents(calendarId, timeMin, timeMax) {
        try {
            const response = await this.calendar.events.list({
                calendarId: calendarId,
                timeMin: timeMin,
                timeMax: timeMax,
                singleEvents: true,
                orderBy: 'startTime',
            });

            return response.data.items;
        } catch (error) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }
    }

    // Sync task to Google Calendar
    async syncTaskToCalendar(calendarId, task) {
        try {
            // Convert task to calendar event format
            const eventData = {
                title: `📚 ${task.title}`,
                description: `Task: ${task.description || task.title}\n\nPriority: ${task.priority}\nStatus: ${task.status}\n\nCreated via BrainyBalance`,
                startDateTime: task.dueDate ? new Date(task.dueDate).toISOString() : new Date().toISOString(),
                endDateTime: task.dueDate ? new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            const event = await this.createEvent(calendarId, eventData);
            return event;
        } catch (error) {
            throw new Error(`Failed to sync task to calendar: ${error.message}`);
        }
    }

    // Sync pomodoro session to Google Calendar
    async syncPomodoroToCalendar(calendarId, session) {
        try {
            const eventData = {
                title: `🍅 Focus Session - ${session.task || 'Study Time'}`,
                description: `Pomodoro Session\nDuration: ${session.duration} minutes\nTask: ${session.task || 'General study'}\n\nCreated via BrainyBalance`,
                startDateTime: new Date(session.startTime).toISOString(),
                endDateTime: new Date(session.endTime || session.startTime + (session.duration * 60 * 1000)).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            const event = await this.createEvent(calendarId, eventData);
            return event;
        } catch (error) {
            throw new Error(`Failed to sync pomodoro to calendar: ${error.message}`);
        }
    }
}

export default GoogleCalendarService;
