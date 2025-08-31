import express from 'express';
import GoogleCalendarService from '../services/googleCalendarService.js';
import CalendarIntegration from '../models/CalendarIntegration.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const googleCalendar = new GoogleCalendarService();

// Get Google Calendar authorization URL
router.get('/auth-url', async (req, res) => {
    try {
        const authUrl = googleCalendar.getAuthUrl();
        res.json({ authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ error: 'Failed to generate authorization URL' });
    }
});

// Handle Google OAuth callback
router.post('/callback', authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        // Exchange code for tokens
        const tokens = await googleCalendar.getTokens(code);

        // Save or update calendar integration
        await CalendarIntegration.findOneAndUpdate(
            { userId },
            {
                userId,
                googleTokens: tokens,
                syncEnabled: true,
                lastSyncAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'Google Calendar connected successfully' });
    } catch (error) {
        console.error('Error handling OAuth callback:', error);
        res.status(500).json({ error: 'Failed to connect Google Calendar' });
    }
});

// Get calendar integration status
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const integration = await CalendarIntegration.findOne({ userId });

        if (!integration || !integration.googleTokens) {
            return res.json({ connected: false });
        }

        res.json({
            connected: true,
            syncEnabled: integration.syncEnabled,
            selectedCalendarId: integration.selectedCalendarId,
            syncSettings: integration.syncSettings,
            lastSyncAt: integration.lastSyncAt
        });
    } catch (error) {
        console.error('Error getting calendar status:', error);
        res.status(500).json({ error: 'Failed to get calendar status' });
    }
});

// Get user's Google Calendars
router.get('/calendars', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const integration = await CalendarIntegration.findOne({ userId });

        if (!integration || !integration.googleTokens) {
            return res.status(400).json({ error: 'Google Calendar not connected' });
        }

        // Set credentials and get calendars
        googleCalendar.setCredentials(integration.googleTokens);
        const calendars = await googleCalendar.getCalendars();

        res.json({ calendars });
    } catch (error) {
        console.error('Error fetching calendars:', error);
        res.status(500).json({ error: 'Failed to fetch calendars' });
    }
});

// Update sync settings
router.put('/settings', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { selectedCalendarId, syncSettings } = req.body;

        const integration = await CalendarIntegration.findOneAndUpdate(
            { userId },
            {
                ...(selectedCalendarId && { selectedCalendarId }),
                ...(syncSettings && { syncSettings })
            },
            { new: true }
        );

        if (!integration) {
            return res.status(404).json({ error: 'Calendar integration not found' });
        }

        res.json({ success: true, integration });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Manually sync a task to Google Calendar
router.post('/sync/task/:taskId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskId } = req.params;
        const { task } = req.body;

        const integration = await CalendarIntegration.findOne({ userId });
        if (!integration || !integration.googleTokens || !integration.syncEnabled) {
            return res.status(400).json({ error: 'Google Calendar not connected or sync disabled' });
        }

        // Set credentials and sync task
        googleCalendar.setCredentials(integration.googleTokens);
        const event = await googleCalendar.syncTaskToCalendar(integration.selectedCalendarId, task);

        // Save sync record
        integration.syncedEvents.push({
            eventId: taskId,
            googleEventId: event.id,
            eventType: 'task'
        });
        await integration.save();

        res.json({ success: true, event });
    } catch (error) {
        console.error('Error syncing task:', error);
        res.status(500).json({ error: 'Failed to sync task to calendar' });
    }
});

// Manually sync a pomodoro session to Google Calendar
router.post('/sync/pomodoro/:sessionId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        const { session } = req.body;

        const integration = await CalendarIntegration.findOne({ userId });
        if (!integration || !integration.googleTokens || !integration.syncEnabled) {
            return res.status(400).json({ error: 'Google Calendar not connected or sync disabled' });
        }

        // Set credentials and sync session
        googleCalendar.setCredentials(integration.googleTokens);
        const event = await googleCalendar.syncPomodoroToCalendar(integration.selectedCalendarId, session);

        // Save sync record
        integration.syncedEvents.push({
            eventId: sessionId,
            googleEventId: event.id,
            eventType: 'pomodoro'
        });
        await integration.save();

        res.json({ success: true, event });
    } catch (error) {
        console.error('Error syncing pomodoro:', error);
        res.status(500).json({ error: 'Failed to sync pomodoro to calendar' });
    }
});

// Disconnect Google Calendar
router.delete('/disconnect', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        await CalendarIntegration.findOneAndUpdate(
            { userId },
            {
                googleTokens: null,
                syncEnabled: false,
                selectedCalendarId: 'primary',
                syncedEvents: []
            }
        );

        res.json({ success: true, message: 'Google Calendar disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting calendar:', error);
        res.status(500).json({ error: 'Failed to disconnect Google Calendar' });
    }
});

// Get sync history
router.get('/sync-history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const integration = await CalendarIntegration.findOne({ userId });

        if (!integration) {
            return res.json({ syncedEvents: [] });
        }

        res.json({
            syncedEvents: integration.syncedEvents,
            lastSyncAt: integration.lastSyncAt
        });
    } catch (error) {
        console.error('Error fetching sync history:', error);
        res.status(500).json({ error: 'Failed to fetch sync history' });
    }
});

export default router;
