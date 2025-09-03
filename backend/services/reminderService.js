import cron from 'node-cron';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Reminder from '../models/Reminder.js';
import Notification from '../models/Notification.js';
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

                // Create in-app notification
                const notification = new Notification({
                    userId: task.userId._id,
                    type: 'deadline_warning',
                    title: 'Task Deadline Approaching',
                    message: `"${task.title}" is due in 6 hours (${task.deadline.toLocaleString()})`,
                    relatedEntityId: task._id,
                    relatedEntityType: 'task',
                    priority: task.priority === 'urgent' ? 'high' : 'medium'
                });
                await notification.save();

                reminder.sentAt = new Date();
                await reminder.save();
                console.log(`reminderService - Reminder and notification recorded for task ${task._id}`);
            } catch (err) {
                console.error('reminderService - Failed to send reminder for task', task._id, err);
            }
        }
    } catch (error) {
        console.error('reminderService - Error in findAndSendReminders:', error);
    }
}

async function createDeadlineNotifications() {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find tasks due today that don't have deadline notifications yet
        const tasksDueToday = await Task.find({
            deadline: { $gte: today, $lt: tomorrow },
            status: { $ne: 'completed' }
        }).populate('userId');

        for (const task of tasksDueToday) {
            // Check if notification already exists for this task today
            const existingNotification = await Notification.findOne({
                userId: task.userId._id,
                relatedEntityId: task._id,
                type: 'deadline_warning',
                createdAt: { $gte: today }
            });

            if (!existingNotification) {
                const hoursLeft = Math.ceil((task.deadline - now) / (1000 * 60 * 60));
                let message = `"${task.title}" is due today`;
                if (hoursLeft > 0) {
                    message += ` in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
                } else {
                    message += ' and is overdue';
                }

                const notification = new Notification({
                    userId: task.userId._id,
                    type: 'deadline_warning',
                    title: 'Task Due Today',
                    message: message,
                    relatedEntityId: task._id,
                    relatedEntityType: 'task',
                    priority: 'high'
                });
                await notification.save();
                console.log(`Created deadline notification for task ${task._id}`);
            }
        }

        // Find overdue tasks
        const overdueTasks = await Task.find({
            deadline: { $lt: today },
            status: { $ne: 'completed' }
        }).populate('userId');

        for (const task of overdueTasks) {
            // Check if overdue notification already exists for this task
            const existingNotification = await Notification.findOne({
                userId: task.userId._id,
                relatedEntityId: task._id,
                type: 'deadline_warning',
                message: { $regex: 'overdue' },
                createdAt: { $gte: today }
            });

            if (!existingNotification) {
                const daysOverdue = Math.floor((now - task.deadline) / (1000 * 60 * 60 * 24));
                const message = `"${task.title}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`;

                const notification = new Notification({
                    userId: task.userId._id,
                    type: 'deadline_warning',
                    title: 'Overdue Task',
                    message: message,
                    relatedEntityId: task._id,
                    relatedEntityType: 'task',
                    priority: 'high'
                });
                await notification.save();
                console.log(`Created overdue notification for task ${task._id}`);
            }
        }
    } catch (error) {
        console.error('Error creating deadline notifications:', error);
    }
}

export function startReminderScheduler() {
    // Run every minute
    cron.schedule('* * * * *', () => {
        console.log('reminderService - Cron tick:', new Date().toISOString());
        findAndSendReminders();
        createDeadlineNotifications();
    });
    console.log('reminderService - Scheduler started (runs every minute)');
}
