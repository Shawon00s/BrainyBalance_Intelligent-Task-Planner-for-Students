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
        // Load user profile
        await loadUserProfile();

        // Load dashboard data
        await loadDashboardData();

        // Load notifications
        await loadNotifications();

        // Set up event listeners
        setupEventListeners();

        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard. Please try again.');
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        user = await response.json();
        updateUserInfo();
    } catch (error) {
        console.error('Error loading profile:', error);
        throw error;
    }
}

// Load comprehensive dashboard data
async function loadDashboardData() {
    try {
        // Get current date
        const today = new Date().toISOString().split('T')[0];

        // Load analytics data
        const analyticsResponse = await fetch(`${API_BASE}/analytics/dashboard`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (analyticsResponse.ok) {
            dashboardData.analytics = await analyticsResponse.json();
        }

        // Load today's tasks
        const tasksResponse = await fetch(`${API_BASE}/tasks?startDate=${today}&endDate=${today}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (tasksResponse.ok) {
            dashboardData.todayTasks = await tasksResponse.json();
        }

        // Load upcoming tasks (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const upcomingResponse = await fetch(`${API_BASE}/tasks?startDate=${today}&endDate=${nextWeek.toISOString().split('T')[0]}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (upcomingResponse.ok) {
            dashboardData.upcomingTasks = await upcomingResponse.json();
        }

        // Load recent pomodoro sessions
        const pomodoroResponse = await fetch(`${API_BASE}/pomodoro/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (pomodoroResponse.ok) {
            dashboardData.pomodoroStats = await pomodoroResponse.json();
        }

        // Update dashboard displays
        updateQuickStats();
        updateTodayTasks();
        updateUpcomingTasks();
        updateProductivityChart();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        throw error;
    }
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE}/notifications/unread`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            notifications = await response.json();
            updateNotifications();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
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
        // Total tasks today
        const totalTasksToday = dashboardData.todayTasks ? dashboardData.todayTasks.length : 0;
        const completedTasksToday = dashboardData.todayTasks ?
            dashboardData.todayTasks.filter(task => task.status === 'completed').length : 0;

        // Update DOM elements
        updateStatElement('totalTasks', totalTasksToday);
        updateStatElement('completedTasks', completedTasksToday);
        updateStatElement('pendingTasks', totalTasksToday - completedTasksToday);

        // Productivity score
        if (dashboardData.analytics && dashboardData.analytics.todayScore !== undefined) {
            updateStatElement('productivityScore', Math.round(dashboardData.analytics.todayScore));
        }

        // Pomodoro sessions
        if (dashboardData.pomodoroStats) {
            updateStatElement('pomodoroSessions', dashboardData.pomodoroStats.sessionsToday || 0);
        }

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
    const container = document.getElementById('todayTasksList');
    if (!container) return;

    if (!dashboardData.todayTasks || dashboardData.todayTasks.length === 0) {
        container.innerHTML = '<p class="no-tasks">No tasks for today</p>';
        return;
    }

    container.innerHTML = dashboardData.todayTasks.map(task => `
        <div class="task-item ${task.status}" data-task-id="${task._id}">
            <div class="task-content">
                <h4>${escapeHtml(task.title)}</h4>
                <p>${escapeHtml(task.description || '')}</p>
                <div class="task-meta">
                    <span class="priority priority-${task.priority}">${task.priority}</span>
                    <span class="category">${escapeHtml(task.category || '')}</span>
                    ${task.dueDate ? `<span class="due-date">${formatDate(task.dueDate)}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button onclick="toggleTaskStatus('${task._id}', '${task.status}')" 
                        class="btn btn-sm ${task.status === 'completed' ? 'btn-secondary' : 'btn-primary'}">
                    ${task.status === 'completed' ? 'Mark Pending' : 'Complete'}
                </button>
            </div>
        </div>
    `).join('');
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
    const container = document.getElementById('notificationsList');
    if (!container) return;

    if (!notifications || notifications.length === 0) {
        container.innerHTML = '<p class="no-notifications">No new notifications</p>';
        return;
    }

    container.innerHTML = notifications.slice(0, 5).map(notification => `
        <div class="notification-item ${notification.type}" data-notification-id="${notification._id}">
            <div class="notification-content">
                <h5>${escapeHtml(notification.title)}</h5>
                <p>${escapeHtml(notification.message)}</p>
                <small>${formatDateTime(notification.createdAt)}</small>
            </div>
            <button onclick="markNotificationRead('${notification._id}')" class="btn btn-sm btn-outline">
                Mark Read
            </button>
        </div>
    `).join('');
}

// Update productivity chart (simple version)
function updateProductivityChart() {
    const chartContainer = document.getElementById('productivityChart');
    if (!chartContainer) return;

    if (!dashboardData.analytics || !dashboardData.analytics.weeklyData) {
        chartContainer.innerHTML = '<p>No productivity data available</p>';
        return;
    }

    // Simple bar chart representation
    const weeklyData = dashboardData.analytics.weeklyData;
    const maxScore = Math.max(...weeklyData.map(d => d.score));

    chartContainer.innerHTML = `
        <div class="chart-bars">
            ${weeklyData.map(day => `
                <div class="chart-bar">
                    <div class="bar" style="height: ${(day.score / maxScore) * 100}%"></div>
                    <span class="day-label">${day.day.substring(0, 3)}</span>
                </div>
            `).join('')}
        </div>
    `;
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
