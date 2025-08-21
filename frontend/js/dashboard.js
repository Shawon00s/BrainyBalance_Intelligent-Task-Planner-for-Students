// Dashboard functionality with comprehensive backend integration
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard();
});

// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Global variables
let user = null;
let dashboardData = {};
let notifications = [];

// Initialize dashboard
async function initializeDashboard() {
    try {
        console.log('Initializing dashboard...');

        // Check authentication again
        if (!isAuthenticated()) {
            console.log('Authentication check failed during initialization');
            window.location.href = 'login.html';
            return;
        }

        // Load user profile
        console.log('Loading user profile...');
        await loadUserProfile();

        // Load dashboard data (with fallbacks)
        console.log('Loading dashboard data...');
        await loadDashboardData();

        // Load notifications (with fallbacks)
        console.log('Loading notifications...');
        await loadNotifications();

        // Set up event listeners
        console.log('Setting up event listeners...');
        setupEventListeners();

        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Don't show error, just use fallback data
        setupFallbackData();
        setupEventListeners();
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const data = await response.json();
        user = data.user;
        updateUserInfo();
    } catch (error) {
        console.error('Error loading profile:', error);
        // Use fallback user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            user = JSON.parse(storedUser);
            updateUserInfo();
        } else {
            // Create a basic user object
            user = {
                name: 'User',
                email: 'user@example.com',
                role: 'student'
            };
            updateUserInfo();
        }
    }
}

// Load comprehensive dashboard data
async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');

        // Initialize empty data structure
        dashboardData = {
            analytics: { totalTasks: 0, completedTasks: 0, activeProjects: 0, studyHours: 0 },
            allTasks: [],
            todayTasks: [],
            upcomingTasks: [],
            pomodoroStats: { sessionsToday: 0, totalFocusTime: 0 }
        };

        // Get current date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Try to load analytics data
        try {
            const analyticsResponse = await fetch(`${API_BASE}/analytics/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (analyticsResponse.ok) {
                const analyticsData = await analyticsResponse.json();
                dashboardData.analytics = {
                    totalTasks: analyticsData.summary?.totalTasksCreated || 0,
                    completedTasks: analyticsData.summary?.totalTasksCompleted || 0,
                    activeProjects: 0,
                    studyHours: Math.round((analyticsData.summary?.totalWorkMinutes || 0) / 60),
                    todayScore: analyticsData.summary?.averageProductivityScore || 0
                };
            }
        } catch (error) {
            console.log('Analytics endpoint not available, using default data');
        }

        // Try to load all tasks
        try {
            const tasksResponse = await fetch(`${API_BASE}/tasks`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                dashboardData.allTasks = tasksData.tasks || tasksData;

                // Filter tasks for today
                dashboardData.todayTasks = dashboardData.allTasks.filter(task => {
                    if (task.dueDate) {
                        const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
                        return taskDate === todayStr;
                    }
                    return false;
                });

                // Filter upcoming tasks (next 7 days)
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                dashboardData.upcomingTasks = dashboardData.allTasks.filter(task => {
                    if (task.dueDate) {
                        const taskDate = new Date(task.dueDate);
                        return taskDate > today && taskDate <= nextWeek;
                    }
                    return false;
                });

                // Update analytics with actual task data
                const totalTasks = dashboardData.allTasks.length;
                const completedTasks = dashboardData.allTasks.filter(task => task.status === 'completed').length;

                dashboardData.analytics.totalTasks = totalTasks;
                dashboardData.analytics.completedTasks = completedTasks;
            }
        } catch (error) {
            console.log('Tasks endpoint not available, using default data');
        }

        // Try to load pomodoro stats for today
        try {
            const today = new Date().toISOString().split('T')[0];
            const pomodoroResponse = await fetch(`${API_BASE}/pomodoro/sessions?date=${today}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (pomodoroResponse.ok) {
                const pomodoroData = await pomodoroResponse.json();
                const todaySessions = pomodoroData.sessions || [];
                const completedSessions = todaySessions.filter(session => session.status === 'completed');

                dashboardData.pomodoroStats = {
                    sessionsToday: completedSessions.length,
                    totalFocusTime: completedSessions.reduce((sum, session) =>
                        sum + (session.totalWorkDuration || 0), 0)
                };
            }
        } catch (error) {
            console.log('Pomodoro endpoint not available, using default data');
        }

        // Update the dashboard UI
        updateDashboardUI();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        setupFallbackData();
        updateDashboardUI();
    }
}

// Setup fallback data when API calls fail
function setupFallbackData() {
    dashboardData = {
        analytics: {
            totalTasks: 12,
            completedTasks: 8,
            activeProjects: 3,
            studyHours: 24
        },
        todayTasks: [
            { id: 1, title: "Complete Math Assignment", status: "pending", priority: "high" },
            { id: 2, title: "Review English Notes", status: "completed", priority: "medium" }
        ],
        upcomingTasks: [
            { id: 3, title: "Science Project", dueDate: "2025-08-25", priority: "high" },
            { id: 4, title: "History Essay", dueDate: "2025-08-26", priority: "medium" }
        ],
        pomodoroStats: {
            sessionsToday: 4,
            totalFocusTime: 120
        }
    };
}

// Update dashboard UI with current data
function updateDashboardUI() {
    updateQuickStats();
    updateTodayTasks();
    updateUpcomingTasks();
    updateProductivityChart();
}

// Load notifications
async function loadNotifications() {
    try {
        console.log('Loading notifications...');
        const response = await fetch(`${API_BASE}/notifications/unread`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            notifications = await response.json();
            updateNotifications();
        } else {
            // Use fallback notifications
            notifications = [
                { id: 1, message: "Welcome to BrainyBalance!", type: "info", createdAt: new Date().toISOString() }
            ];
            updateNotifications();
        }
    } catch (error) {
        console.log('Notifications endpoint not available, using default data');
        // Use fallback notifications
        notifications = [
            { id: 1, message: "Welcome to BrainyBalance!", type: "info", createdAt: new Date().toISOString() }
        ];
        updateNotifications();
    }
}

// Update user info display
function updateUserInfo() {
    if (user) {
        const userNameElement = document.getElementById('userName');
        const userEmailElement = document.getElementById('userEmail');

        if (userNameElement) {
            userNameElement.textContent = user.name || user.username || 'User';
        }
        if (userEmailElement) {
            userEmailElement.textContent = user.email || '';
        }
    }
}

// Update quick stats
function updateQuickStats() {
    try {
        // Total tasks and completed tasks from all tasks
        const totalTasks = dashboardData.allTasks ? dashboardData.allTasks.length : 0;
        const completedTasks = dashboardData.allTasks ?
            dashboardData.allTasks.filter(task => task.status === 'completed').length : 0;

        // Today's tasks
        const todayTasks = dashboardData.todayTasks ? dashboardData.todayTasks.length : 0;
        const todayCompleted = dashboardData.todayTasks ?
            dashboardData.todayTasks.filter(task => task.status === 'completed').length : 0;

        // Update DOM elements
        updateStatElement('totalTasks', totalTasks);
        updateStatElement('completedTasks', completedTasks);
        updateStatElement('pendingTasks', totalTasks - completedTasks);

        // Productivity score - calculate completion rate
        let productivityScore = 0;
        if (totalTasks > 0) {
            productivityScore = Math.round((completedTasks / totalTasks) * 100);
        } else if (dashboardData.analytics && dashboardData.analytics.todayScore !== undefined) {
            productivityScore = dashboardData.analytics.todayScore;
        }
        updateStatElement('productivityScore', productivityScore + '%');

        // Pomodoro sessions
        if (dashboardData.pomodoroStats) {
            updateStatElement('pomodoroSessions', dashboardData.pomodoroStats.sessionsToday || 0);
        }

        console.log('Dashboard stats updated:', {
            totalTasks,
            completedTasks,
            productivityScore,
            pomodoroSessions: dashboardData.pomodoroStats?.sessionsToday || 0
        });

    } catch (error) {
        console.error('Error updating quick stats:', error);
    }
}

// Update stat element helper
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Update today's tasks display
function updateTodayTasks() {
    try {
        const container = document.getElementById('todayTasksList');
        if (!container) {
            console.log('todayTasksList element not found');
            return;
        }

        if (!dashboardData.todayTasks || dashboardData.todayTasks.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">No tasks for today</p>';
            return;
        }

        container.innerHTML = dashboardData.todayTasks.map(task => `
            <div class="task-item bg-gray-700 p-3 rounded mb-2" data-task-id="${task.id || task._id}">
                <div class="task-content">
                    <h4 class="font-semibold">${escapeHtml(task.title)}</h4>
                    ${task.description ? `<p class="text-sm text-gray-400">${escapeHtml(task.description)}</p>` : ''}
                    <div class="flex gap-2 mt-2">
                        <span class="text-xs px-2 py-1 rounded bg-blue-600">${task.priority || 'normal'}</span>
                        ${task.status ? `<span class="text-xs px-2 py-1 rounded ${task.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}">${task.status}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating today tasks:', error);
        const container = document.getElementById('todayTasksList');
        if (container) {
            container.innerHTML = '<p class="text-red-400 text-center py-4">Error loading tasks</p>';
        }
    }
}

// Update upcoming tasks display
function updateUpcomingTasks() {
    const container = document.getElementById('upcomingTasksList');
    if (!container) return;

    if (!dashboardData.upcomingTasks || dashboardData.upcomingTasks.length === 0) {
        container.innerHTML = '<p class="no-tasks">No upcoming tasks</p>';
        return;
    }

    // Filter out today's tasks and limit to next 5
    const today = new Date().toISOString().split('T')[0];
    const upcoming = dashboardData.upcomingTasks
        .filter(task => task.dueDate && task.dueDate.split('T')[0] > today)
        .slice(0, 5);

    if (upcoming.length === 0) {
        container.innerHTML = '<p class="no-tasks">No upcoming tasks</p>';
        return;
    }

    container.innerHTML = upcoming.map(task => `
        <div class="task-item upcoming" data-task-id="${task._id}">
            <div class="task-content">
                <h4>${escapeHtml(task.title)}</h4>
                <div class="task-meta">
                    <span class="priority priority-${task.priority}">${task.priority}</span>
                    <span class="due-date">${formatDate(task.dueDate)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update notifications display
function updateNotifications() {
    try {
        const container = document.getElementById('notificationsList');
        if (!container) {
            console.log('notificationsList element not found');
            return;
        }

        if (!notifications || notifications.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">No new notifications</p>';
            return;
        }

        container.innerHTML = notifications.slice(0, 5).map(notification => `
            <div class="notification-item bg-gray-700 p-3 rounded mb-2" data-notification-id="${notification.id || notification._id}">
                <div class="notification-content">
                    ${notification.title ? `<h5 class="font-semibold">${escapeHtml(notification.title)}</h5>` : ''}
                    <p class="text-sm">${escapeHtml(notification.message)}</p>
                    <small class="text-gray-400">${formatDateTime(notification.createdAt)}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating notifications:', error);
        const container = document.getElementById('notificationsList');
        if (container) {
            container.innerHTML = '<p class="text-red-400 text-center py-4">Error loading notifications</p>';
        }
    }
}

// Update productivity chart (simple version)
function updateProductivityChart() {
    try {
        const chartContainer = document.getElementById('productivityChart');
        if (!chartContainer) {
            console.log('productivityChart element not found');
            return;
        }

        if (!dashboardData.analytics || !dashboardData.analytics.weeklyData) {
            chartContainer.innerHTML = '<p class="text-gray-400 text-center py-4">No productivity data available</p>';
            return;
        }

        // Simple bar chart representation
        const weeklyData = dashboardData.analytics.weeklyData;
        const maxScore = Math.max(...weeklyData.map(d => d.score));

        chartContainer.innerHTML = `
            <div class="chart-bars flex justify-around items-end h-32">
                ${weeklyData.map(day => `
                    <div class="chart-bar flex flex-col items-center">
                        <div class="bg-blue-500 w-8 mb-2" style="height: ${(day.score / maxScore) * 100}%"></div>
                        <span class="text-xs text-gray-400">${day.day.substring(0, 3)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error updating productivity chart:', error);
        const chartContainer = document.getElementById('productivityChart');
        if (chartContainer) {
            chartContainer.innerHTML = '<p class="text-red-400 text-center py-4">Error loading chart</p>';
        }
    }
}

// Add utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleString();
    } catch (error) {
        return dateString;
    }
}

// Toggle task status
async function toggleTaskStatus(taskId, currentStatus) {
    try {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update task');
        }

        // Reload dashboard data
        await loadDashboardData();
        showSuccess('Task updated successfully');

    } catch (error) {
        console.error('Error updating task:', error);
        showError('Failed to update task');
    }
}

// Mark notification as read
async function markNotificationRead(notificationId) {
    try {
        const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to mark notification as read');
        }

        // Remove from notifications array
        notifications = notifications.filter(n => n._id !== notificationId);
        updateNotifications();

    } catch (error) {
        console.error('Error marking notification as read:', error);
        showError('Failed to mark notification as read');
    }
}

// Quick task creation
async function createQuickTask() {
    const title = document.getElementById('quickTaskTitle');
    const priority = document.getElementById('quickTaskPriority');

    if (!title || !title.value.trim()) {
        showError('Please enter a task title');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title.value.trim(),
                priority: priority ? priority.value : 'medium',
                dueDate: new Date().toISOString().split('T')[0]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create task');
        }

        // Clear form
        title.value = '';
        if (priority) priority.value = 'medium';

        // Reload dashboard data
        await loadDashboardData();
        showSuccess('Task created successfully');

    } catch (error) {
        console.error('Error creating task:', error);
        showError('Failed to create task');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Quick task form
    const quickTaskForm = document.getElementById('quickTaskForm');
    if (quickTaskForm) {
        quickTaskForm.addEventListener('submit', function (e) {
            e.preventDefault();
            createQuickTask();
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            initializeDashboard();
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function showSuccess(message) {
    showMessage(message, 'success');
}

function showError(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    // Create or update message element
    let messageEl = document.getElementById('dashboardMessage');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'dashboardMessage';
        messageEl.className = 'message';
        document.body.insertBefore(messageEl, document.body.firstChild);
    }

    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    messageEl.style.display = 'block';

    // Auto hide after 3 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// Global functions for onclick handlers
window.toggleTaskStatus = toggleTaskStatus;
window.markNotificationRead = markNotificationRead;
window.createQuickTask = createQuickTask;
