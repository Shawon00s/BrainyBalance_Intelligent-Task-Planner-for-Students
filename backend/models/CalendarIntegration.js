import mongoose from 'mongoose';

const calendarIntegrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    googleTokens: {
        access_token: String,
        refresh_token: String,
        scope: String,
        token_type: String,
        expiry_date: Number
    },
    selectedCalendarId: {
        type: String,
        default: 'primary'
    },
    syncEnabled: {
        type: Boolean,
        default: false
    },
    syncSettings: {
        syncTasks: {
            type: Boolean,
            default: true
        },
        syncPomodoro: {
            type: Boolean,
            default: true
        },
        syncSchedule: {
            type: Boolean,
            default: true
        },
        autoSync: {
            type: Boolean,
            default: false
        }
    },
    lastSyncAt: {
        type: Date,
        default: null
    },
    syncedEvents: [{
        eventId: String,
        googleEventId: String,
        eventType: {
            type: String,
            enum: ['task', 'pomodoro', 'schedule']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for faster queries
calendarIntegrationSchema.index({ userId: 1 });
calendarIntegrationSchema.index({ 'syncedEvents.eventId': 1 });

const CalendarIntegration = mongoose.model('CalendarIntegration', calendarIntegrationSchema);

export default CalendarIntegration;
