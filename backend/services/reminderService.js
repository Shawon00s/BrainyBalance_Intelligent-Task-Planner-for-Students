import cron from 'node-cron';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Reminder from '../models/Reminder.js';
import { sendEmail } from './emailService.js';

// Check window (in milliseconds) to consider tasks whose scheduled reminder falls within the last minute
const CHECK_WINDOW_MS = 60 * 1000; // 1 minute
const REMINDER_BEFORE_MS = 6 * 60 * 60 * 1000; // 6 hours

async function findAndSendReminders() {
    try {
        const now = new Date();
        // Find tasks whose deadline is approximately 6 hours from now
        const targetStart = new Date(now.getTime() + REMINDER_BEFORE_MS - CHECK_WINDOW_MS);
        const targetEnd = new Date(now.getTime() + REMINDER_BEFORE_MS + CHECK_WINDOW_MS);

        console.log('reminderService - Checking tasks with deadlines between', targetStart, 'and', targetEnd);

        const tasks = await Task.find({
            deadline: { $gte: targetStart, $lte: targetEnd }
        }).populate('userId');

        for (const task of tasks) {
            // Check if a reminder has already been recorded for this task
            const existing = await Reminder.findOne({ taskId: task._id, type: 'deadline_reminder' });
            if (existing && existing.sentAt) {
                console.log(`reminderService - Reminder already sent for task ${task._id}`);
                continue;
            }

            // If there's an existing scheduled reminder but not sent, and scheduledAt is in future, skip
            if (existing && existing.scheduledAt > now) {
                console.log(`reminderService - Reminder scheduled for future for task ${task._id}`);
                continue;
            }

            // Create or update reminder record
            const scheduledAt = new Date(task.deadline.getTime() - REMINDER_BEFORE_MS);
            const reminder = existing || new Reminder({ taskId: task._id, userId: task.userId._id, scheduledAt });

            try {
                console.log(`reminderService - Sending reminder for task ${task._id} to user ${task.userId.email}`);

                const subject = `Reminder: '${task.title}' is due in 6 hours`;
                const html = `
                    <p>Hi ${task.userId.name || task.userId.email},</p>
                    <p>This is a friendly reminder that your task <strong>${task.title}</strong> is due on <strong>${task.deadline.toLocaleString()}</strong> (in ~6 hours).</p>
                    <p>Description: ${task.description || 'No description'}</p>
                    <p>Good luck!</p>
                `;

                await sendEmail({ to: task.userId.email, subject, html });

                reminder.sentAt = new Date();
                await reminder.save();
                console.log(`reminderService - Reminder recorded for task ${task._id}`);
            } catch (err) {
                console.error('reminderService - Failed to send reminder for task', task._id, err);
            }
        }
    } catch (error) {
        console.error('reminderService - Error in findAndSendReminders:', error);
    }
}

export function startReminderScheduler() {
    // Run every minute
    cron.schedule('* * * * *', () => {
        console.log('reminderService - Cron tick:', new Date().toISOString());
        findAndSendReminders();
    });
    console.log('reminderService - Scheduler started (runs every minute)');
}
