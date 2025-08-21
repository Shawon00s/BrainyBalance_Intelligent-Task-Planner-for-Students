// Google Calendar Integration JavaScript
const API_BASE = 'http://localhost:3000/api';

class GoogleCalendarIntegration {
    constructor() {
        this.isConnected = false;
        this.calendars = [];
        this.syncSettings = {
            syncTasks: true,
            syncPomodoro: true,
            syncSchedule: true,
            autoSync: false
        };
    }

    // Initialize calendar integration
    async init() {
        await this.checkConnectionStatus();
        this.setupEventListeners();
    }

    // Check if Google Calendar is connected
    async checkConnectionStatus() {
        try {
            const response = await fetch(`${API_BASE}/calendar/status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.isConnected = data.connected;
                this.syncSettings = data.syncSettings || this.syncSettings;

                if (this.isConnected) {
                    await this.loadCalendars();
                }

                this.updateUI();
                return data;
            }
        } catch (error) {
            console.error('Error checking calendar status:', error);
            this.updateUI();
        }
    }

    // Connect to Google Calendar
    async connect() {
        try {
            // Get authorization URL
            const response = await fetch(`${API_BASE}/calendar/auth-url`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Open authorization window
                const authWindow = window.open(
                    data.authUrl,
                    'google-calendar-auth',
                    'width=500,height=600,scrollbars=yes,resizable=yes'
                );

                // Listen for authorization completion
                const checkClosed = setInterval(() => {
                    if (authWindow.closed) {
                        clearInterval(checkClosed);
                        // Recheck connection status after auth window closes
                        setTimeout(() => {
                            this.checkConnectionStatus();
                        }, 1000);
                    }
                }, 1000);

            } else {
                throw new Error('Failed to get authorization URL');
            }
        } catch (error) {
            console.error('Error connecting to Google Calendar:', error);
            this.showNotification('Failed to connect to Google Calendar', 'error');
        }
    }

    // Handle OAuth callback (for popup windows)
    async handleCallback(code) {
        try {
            const response = await fetch(`${API_BASE}/calendar/callback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });

            if (response.ok) {
                const data = await response.json();
                this.isConnected = true;
                await this.loadCalendars();
                this.updateUI();
                this.showNotification('Google Calendar connected successfully!', 'success');
                return data;
            } else {
                throw new Error('Failed to complete authorization');
            }
        } catch (error) {
            console.error('Error handling OAuth callback:', error);
            this.showNotification('Failed to connect to Google Calendar', 'error');
        }
    }

    // Disconnect from Google Calendar
    async disconnect() {
        try {
            const response = await fetch(`${API_BASE}/calendar/disconnect`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.isConnected = false;
                this.calendars = [];
                this.updateUI();
                this.showNotification('Google Calendar disconnected', 'success');
            } else {
                throw new Error('Failed to disconnect');
            }
        } catch (error) {
            console.error('Error disconnecting from Google Calendar:', error);
            this.showNotification('Failed to disconnect from Google Calendar', 'error');
        }
    }

    // Load user's calendars
    async loadCalendars() {
        try {
            const response = await fetch(`${API_BASE}/calendar/calendars`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.calendars = data.calendars;
                this.updateCalendarDropdown();
            }
        } catch (error) {
            console.error('Error loading calendars:', error);
        }
    }

    // Update sync settings
    async updateSyncSettings(settings) {
        try {
            const response = await fetch(`${API_BASE}/calendar/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ syncSettings: settings })
            });

            if (response.ok) {
                this.syncSettings = { ...this.syncSettings, ...settings };
                this.showNotification('Sync settings updated', 'success');
            }
        } catch (error) {
            console.error('Error updating sync settings:', error);
            this.showNotification('Failed to update sync settings', 'error');
        }
    }

    // Sync a task to Google Calendar
    async syncTask(taskId, task) {
        try {
            const response = await fetch(`${API_BASE}/calendar/sync/task/${taskId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task })
            });

            if (response.ok) {
                this.showNotification('Task synced to Google Calendar', 'success');
                return await response.json();
            } else {
                throw new Error('Failed to sync task');
            }
        } catch (error) {
            console.error('Error syncing task:', error);
            this.showNotification('Failed to sync task to calendar', 'error');
        }
    }

    // Sync a pomodoro session to Google Calendar
    async syncPomodoro(sessionId, session) {
        try {
            const response = await fetch(`${API_BASE}/calendar/sync/pomodoro/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session })
            });

            if (response.ok) {
                this.showNotification('Pomodoro session synced to Google Calendar', 'success');
                return await response.json();
            } else {
                throw new Error('Failed to sync pomodoro');
            }
        } catch (error) {
            console.error('Error syncing pomodoro:', error);
            this.showNotification('Failed to sync pomodoro to calendar', 'error');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Connect button
        const connectBtn = document.getElementById('connect-google-calendar');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connect());
        }

        // Disconnect button
        const disconnectBtn = document.getElementById('disconnect-google-calendar');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnect());
        }

        // Sync settings checkboxes
        const syncTasksCheckbox = document.getElementById('sync-tasks');
        if (syncTasksCheckbox) {
            syncTasksCheckbox.addEventListener('change', (e) => {
                this.updateSyncSettings({ syncTasks: e.target.checked });
            });
        }

        const syncPomodoroCheckbox = document.getElementById('sync-pomodoro');
        if (syncPomodoroCheckbox) {
            syncPomodoroCheckbox.addEventListener('change', (e) => {
                this.updateSyncSettings({ syncPomodoro: e.target.checked });
            });
        }

        const autoSyncCheckbox = document.getElementById('auto-sync');
        if (autoSyncCheckbox) {
            autoSyncCheckbox.addEventListener('change', (e) => {
                this.updateSyncSettings({ autoSync: e.target.checked });
            });
        }
    }

    // Update UI based on connection status
    updateUI() {
        const connectBtn = document.getElementById('connect-google-calendar');
        const disconnectBtn = document.getElementById('disconnect-google-calendar');
        const syncSettings = document.getElementById('calendar-sync-settings');
        const statusIndicator = document.getElementById('calendar-status');

        if (this.isConnected) {
            if (connectBtn) connectBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'block';
            if (syncSettings) syncSettings.style.display = 'block';
            if (statusIndicator) {
                statusIndicator.innerHTML = `
                    <div class="flex items-center text-green-600 dark:text-green-400">
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Connected to Google Calendar
                    </div>
                `;
            }
        } else {
            if (connectBtn) connectBtn.style.display = 'block';
            if (disconnectBtn) disconnectBtn.style.display = 'none';
            if (syncSettings) syncSettings.style.display = 'none';
            if (statusIndicator) {
                statusIndicator.innerHTML = `
                    <div class="flex items-center text-red-600 dark:text-red-400">
                        <div class="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Not connected to Google Calendar
                    </div>
                `;
            }
        }

        // Update sync settings checkboxes
        const syncTasksCheckbox = document.getElementById('sync-tasks');
        if (syncTasksCheckbox) syncTasksCheckbox.checked = this.syncSettings.syncTasks;

        const syncPomodoroCheckbox = document.getElementById('sync-pomodoro');
        if (syncPomodoroCheckbox) syncPomodoroCheckbox.checked = this.syncSettings.syncPomodoro;

        const autoSyncCheckbox = document.getElementById('auto-sync');
        if (autoSyncCheckbox) autoSyncCheckbox.checked = this.syncSettings.autoSync;
    }

    // Update calendar dropdown
    updateCalendarDropdown() {
        const dropdown = document.getElementById('calendar-dropdown');
        if (dropdown && this.calendars.length > 0) {
            dropdown.innerHTML = this.calendars.map(cal =>
                `<option value="${cal.id}">${cal.summary}</option>`
            ).join('');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500 text-white' :
                type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
            }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize Google Calendar integration
const googleCalendar = new GoogleCalendarIntegration();

// Export for use in other files
window.GoogleCalendarIntegration = GoogleCalendarIntegration;
window.googleCalendar = googleCalendar;
