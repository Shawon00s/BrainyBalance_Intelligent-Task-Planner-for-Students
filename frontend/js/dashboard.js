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

                console.log('All tasks loaded:', dashboardData.allTasks);
                console.log('Number of tasks:', dashboardData.allTasks.length);

                // Filter tasks for today (due today or marked for today)
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];

                console.log('Today is:', todayStr);

                // Filter tasks for TODAY ONLY (strict date matching)
                dashboardData.todayTasks = dashboardData.allTasks.filter(task => {
                    if (task.dueDate) {
                        const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
                        return taskDate === todayStr;
                    }
                    return false;
                });

                // Filter overdue tasks (past due dates)
                dashboardData.overdueTasks = dashboardData.allTasks.filter(task => {
                    if (task.dueDate && task.status !== 'completed') {
                        const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
                        return taskDate < todayStr;
                    }
                    return false;
                });

                // Filter upcoming tasks (future dates, next 7 days)
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                nextWeek.setHours(23, 59, 59, 999); // Include the entire last day

                dashboardData.upcomingTasks = dashboardData.allTasks.filter(task => {
                    if (task.dueDate && task.status !== 'completed') {
                        // Handle multiple date formats
                        let taskDate;
                        if (task.dueDate.includes('/')) {
                            // Handle formats like "4/9/2025" or "9/4/2025"
                            const parts = task.dueDate.split('/');
                            if (parts.length === 3) {
                                // Assume MM/DD/YYYY format first
                                const month = parseInt(parts[0]) - 1; // Month is 0-indexed
                                const day = parseInt(parts[1]);
                                const year = parseInt(parts[2]);
                                taskDate = new Date(year, month, day);

                                // If that creates an invalid date, try DD/MM/YYYY
                                if (isNaN(taskDate.getTime()) || month > 11) {
                                    const month2 = parseInt(parts[1]) - 1;
                                    const day2 = parseInt(parts[0]);
                                    taskDate = new Date(year, month2, day2);
                                }
                            }
                        } else {
                            taskDate = new Date(task.dueDate);
                        }

                        const taskDateStr = taskDate.toISOString().split('T')[0];
                        const todayDate = new Date(todayStr + 'T00:00:00.000Z');

                        // Task is upcoming if it's after today and within next 7 days
                        const isAfterToday = taskDate > todayDate;
                        const isWithinWeek = taskDate <= nextWeek;
                        const isUpcoming = isAfterToday && isWithinWeek;

                        console.log(`Task: ${task.title}`);
                        console.log(`  Original Due Date: ${task.dueDate}`);
                        console.log(`  Parsed Date Object: ${taskDate}`);
                        console.log(`  Task Date String: ${taskDateStr}`);
                        console.log(`  Today String: ${todayStr}`);
                        console.log(`  Today Date Object: ${todayDate}`);
                        console.log(`  Next Week: ${nextWeek}`);
                        console.log(`  After Today: ${isAfterToday}`);
                        console.log(`  Within Week: ${isWithinWeek}`);
                        console.log(`  Status: ${task.status}`);
                        console.log(`  Is Upcoming: ${isUpcoming}`);
                        console.log('---');

                        return isUpcoming;
                    }
                    return false;
                });

                console.log(`Found ${dashboardData.upcomingTasks.length} upcoming tasks:`, dashboardData.upcomingTasks);

                // Filter past tasks (completed tasks from last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                dashboardData.pastTasks = dashboardData.allTasks.filter(task => {
                    if (task.status === 'completed') {
                        // If has completion date, use that; otherwise use due date
                        const completedDate = task.completedAt || task.updatedAt || task.dueDate;
                        if (completedDate) {
                            const taskDate = new Date(completedDate);
                            return taskDate >= thirtyDaysAgo && taskDate <= today;
                        }
                    }
                    return false;
                }).sort((a, b) => {
                    // Sort by completion date (most recent first)
                    const dateA = new Date(a.completedAt || a.updatedAt || a.dueDate);
                    const dateB = new Date(b.completedAt || b.updatedAt || b.dueDate);
                    return dateB - dateA;
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

        // Load recent activity
        await loadRecentActivity();

        // Update the dashboard UI
        updateDashboardUI();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        setupFallbackData();
        updateDashboardUI();
    }
}

// Load recent activity data
async function loadRecentActivity() {
    try {
        const recentActivities = [];
        const currentDate = new Date();
        const threeDaysAgo = new Date(currentDate.getTime() - (3 * 24 * 60 * 60 * 1000));

        // Fetch recent tasks (completed, created, or updated in last 3 days)
        try {
            const tasksResponse = await fetch(`${API_BASE}/tasks`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                const tasks = tasksData.tasks || [];

                // Add recently completed tasks
                tasks.filter(task => {
                    if (task.status === 'completed' && task.completedAt) {
                        const completedDate = new Date(task.completedAt);
                        return completedDate >= threeDaysAgo;
                    }
                    return false;
                }).forEach(task => {
                    recentActivities.push({
                        type: 'task_completed',
                        title: `Completed: ${task.title}`,
                        timestamp: new Date(task.completedAt),
                        icon: '✓',
                        priority: task.priority
                    });
                });

                // Add recently created tasks
                tasks.filter(task => {
                    const createdDate = new Date(task.createdAt || task.dateCreated);
                    return createdDate >= threeDaysAgo && task.status !== 'completed';
                }).forEach(task => {
                    recentActivities.push({
                        type: 'task_created',
                        title: `New task: ${task.title}`,
                        timestamp: new Date(task.createdAt || task.dateCreated),
                        icon: '📝',
                        priority: task.priority
                    });
                });
            }
        } catch (error) {
            console.log('Could not fetch recent tasks:', error);
        }

        // Fetch recent pomodoro sessions
        try {
            const last3Days = [];
            for (let i = 0; i < 3; i++) {
                const date = new Date(currentDate.getTime() - (i * 24 * 60 * 60 * 1000));
                last3Days.push(date.toISOString().split('T')[0]);
            }

            for (const date of last3Days) {
                const pomodoroResponse = await fetch(`${API_BASE}/pomodoro/sessions?date=${date}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (pomodoroResponse.ok) {
                    const pomodoroData = await pomodoroResponse.json();
                    const sessions = pomodoroData.sessions || [];

                    sessions.filter(session => session.status === 'completed').forEach(session => {
                        recentActivities.push({
                            type: 'pomodoro_completed',
                            title: `Completed ${session.duration || 25} min focus session`,
                            timestamp: new Date(session.endTime || session.updatedAt),
                            icon: '🍅',
                            priority: 'medium'
                        });
                    });
                }
            }
        } catch (error) {
            console.log('Could not fetch recent pomodoro sessions:', error);
        }

        // Sort activities by timestamp (newest first) and take top 5
        recentActivities.sort((a, b) => b.timestamp - a.timestamp);
        const limitedActivities = recentActivities.slice(0, 5);

        // Store in dashboard data
        dashboardData.recentActivity = limitedActivities;

        // Display the activities
        displayRecentActivity(limitedActivities);

    } catch (error) {
        console.error('Error loading recent activity:', error);
        displayRecentActivity([]);
    }
}

// Display recent activity in the UI
function displayRecentActivity(activities) {
    const activityContainer = document.getElementById('recentActivityList');

    if (!activityContainer) {
        console.log('Recent activity container not found - recentActivityList');
        return;
    }

    if (activities.length === 0) {
        activityContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-history text-3xl mb-3 opacity-50"></i>
                <p class="text-sm">No recent activity found</p>
                <p class="text-xs mt-1">Complete some tasks or start a pomodoro session!</p>
            </div>
        `;
        return;
    }

    const activityHTML = activities.map(activity => {
        const timeAgo = getTimeAgo(activity.timestamp);
        const priorityClass = activity.priority === 'high' ? 'text-red-400' :
            activity.priority === 'medium' ? 'text-yellow-400' :
                'text-green-400';

        return `
            <div class="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg border border-dark-border">
                <div class="flex-shrink-0">
                    <span class="text-xl">${activity.icon}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white truncate">
                        ${activity.title}
                    </p>
                    <p class="text-xs text-gray-400">
                        ${timeAgo}
                    </p>
                </div>
                <div class="flex-shrink-0">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityClass} bg-opacity-20">
                        ${activity.priority || 'normal'}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    activityContainer.innerHTML = activityHTML;
}

// Helper function to format time ago
function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
        return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
    } else if (hours < 24) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else {
        return days === 1 ? '1 day ago' : `${days} days ago`;
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
    updateCurrentDate();
    updateTodayTasks();
    updateOverdueTasks();
    updateUpcomingTasksMain();
    updatePastTasks();
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
        // Use the standardized updateUserDisplay from auth.js for consistency
        if (typeof updateUserDisplay === 'function') {
            updateUserDisplay(user);
        }

        // Handle any dashboard-specific user elements
        const userEmailElement = document.getElementById('userEmail');
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

// Update current date display
function updateCurrentDate() {
    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl) {
        const today = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        currentDateEl.textContent = today.toLocaleDateString('en-US', options);
    }
}

// Update today's tasks display
function updateTodayTasks() {
    try {
        const container = document.getElementById('todayTasksList');
        const countEl = document.getElementById('todayTasksCount');

        if (!container) {
            console.log('todayTasksList element not found');
            return;
        }

        console.log('Dashboard data today tasks:', dashboardData.todayTasks);

        // Update count
        const todayCount = dashboardData.todayTasks ? dashboardData.todayTasks.length : 0;
        if (countEl) countEl.textContent = todayCount;

        if (!dashboardData.todayTasks || dashboardData.todayTasks.length === 0) {
            // If no tasks for today, show a helpful message
            let message = '<div class="text-center text-gray-400 py-8">';
            message += '<i class="fas fa-calendar-check text-3xl mb-3 opacity-50"></i>';
            message += '<p class="text-sm">No tasks scheduled for today</p>';
            message += '<p class="text-xs mt-2 text-green-400">Enjoy your free day or create new tasks!</p>';
            message += '<a href="tasks.html" class="text-indigo-400 hover:text-indigo-300 text-xs mt-2 inline-block">Create task →</a>';
            message += '</div>';
            container.innerHTML = message;
            return;
        }

        container.innerHTML = dashboardData.todayTasks.map(task => `
            <div class="task-item bg-dark-surface p-4 rounded-lg border border-dark-border hover:border-indigo-500/50 transition-colors" data-task-id="${task.id || task._id}">
                <div class="task-content">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="font-semibold text-white mb-1">${escapeHtml(task.title)}</h4>
                            ${task.description ? `<p class="text-sm text-gray-400 mb-2">${escapeHtml(task.description)}</p>` : ''}
                            <div class="flex gap-2 mt-2">
                                <span class="text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(task.priority)}">
                                    ${(task.priority || 'medium').toUpperCase()}
                                </span>
                                <span class="text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(task.status)}">
                                    ${(task.status || 'pending').toUpperCase()}
                                </span>
                                ${task.category ? `<span class="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">${task.category}</span>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center space-x-2 ml-4">
                            ${task.dueDate ? `
                                <div class="text-right">
                                    <p class="text-xs text-gray-400">Due</p>
                                    <p class="text-xs text-white">${formatTaskDate(task.dueDate)}</p>
                                </div>
                            ` : ''}
                            <button onclick="toggleTaskFromDashboard('${task._id || task.id}')" 
                                    class="text-gray-400 hover:text-green-400 transition-colors">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating today tasks:', error);
        const container = document.getElementById('todayTasksList');
        if (container) {
            container.innerHTML = '<div class="text-center py-8"><p class="text-red-400">Error loading tasks</p><p class="text-xs text-gray-400 mt-1">Please refresh the page</p></div>';
        }
    }
}

// Update overdue tasks display
function updateOverdueTasks() {
    try {
        const container = document.getElementById('overdueTasksList');
        const section = document.getElementById('overdueSection');
        const countEl = document.getElementById('overdueTasksCount');

        if (!container || !section) return;

        const overdueCount = dashboardData.overdueTasks ? dashboardData.overdueTasks.length : 0;
        if (countEl) countEl.textContent = overdueCount;

        if (overdueCount === 0) {
            section.classList.add('hidden');
            return;
        }

        // Show overdue section if there are overdue tasks
        section.classList.remove('hidden');

        container.innerHTML = dashboardData.overdueTasks.map(task => {
            const daysOverdue = Math.floor((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
            return `
                <div class="task-item bg-red-900/20 p-4 rounded-lg border border-red-500/30 hover:border-red-400 transition-colors" data-task-id="${task.id || task._id}">
                    <div class="task-content">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-semibold text-white mb-1">${escapeHtml(task.title)}</h4>
                                ${task.description ? `<p class="text-sm text-gray-400 mb-2">${escapeHtml(task.description)}</p>` : ''}
                                <div class="flex gap-2 mt-2">
                                    <span class="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                                        ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue
                                    </span>
                                    <span class="text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(task.priority)}">
                                        ${(task.priority || 'medium').toUpperCase()}
                                    </span>
                                    ${task.category ? `<span class="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">${task.category}</span>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-4">
                                <div class="text-right">
                                    <p class="text-xs text-red-400">Was due</p>
                                    <p class="text-xs text-white">${formatTaskDate(task.dueDate)}</p>
                                </div>
                                <button onclick="toggleTaskFromDashboard('${task._id || task.id}')" 
                                        class="text-gray-400 hover:text-green-400 transition-colors">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error updating overdue tasks:', error);
    }
}

// Update upcoming tasks display
function updateUpcomingTasks() {
    const container = document.getElementById('upcomingTasksList');
    const countEl = document.getElementById('upcomingTasksCount');

    if (!container) return;

    const upcomingCount = dashboardData.upcomingTasks ? dashboardData.upcomingTasks.length : 0;
    if (countEl) countEl.textContent = upcomingCount;

    if (!dashboardData.upcomingTasks || dashboardData.upcomingTasks.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-4">
                <i class="fas fa-calendar-plus text-2xl mb-2 opacity-50"></i>
                <p class="text-sm">No upcoming tasks in the next 7 days</p>
                <a href="tasks.html" class="text-indigo-400 hover:text-indigo-300 text-xs mt-2 inline-block">Plan ahead →</a>
            </div>
        `;
        return;
    }

    // Limit to next 5 upcoming tasks and sort by date
    const upcoming = dashboardData.upcomingTasks
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

    container.innerHTML = upcoming.map(task => {
        const daysUntil = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        return `
            <div class="task-item upcoming bg-dark-surface p-3 rounded-lg border border-dark-border hover:border-indigo-500/50 transition-colors" data-task-id="${task._id}">
                <div class="task-content">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="font-medium text-white text-sm mb-1">${escapeHtml(task.title)}</h4>
                            <div class="flex gap-2 mt-1">
                                <span class="text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(task.priority)}">
                                    ${(task.priority || 'medium').toUpperCase()}
                                </span>
                                <span class="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                                    In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-gray-400">Due</p>
                            <p class="text-xs text-white">${formatTaskDate(task.dueDate)}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update upcoming tasks display (main section)
function updateUpcomingTasksMain() {
    try {
        console.log('updateUpcomingTasksMain called');
        const container = document.getElementById('upcomingTasksMainList');
        const countEl = document.getElementById('upcomingTasksMainCount');

        console.log('Container found:', !!container);
        console.log('Count element found:', !!countEl);
        console.log('Upcoming tasks data:', dashboardData.upcomingTasks);

        if (!container) {
            console.log('upcomingTasksMainList container not found');
            return;
        }

        const upcomingCount = dashboardData.upcomingTasks ? dashboardData.upcomingTasks.length : 0;
        console.log('Upcoming count:', upcomingCount);

        if (countEl) countEl.textContent = upcomingCount; if (!dashboardData.upcomingTasks || dashboardData.upcomingTasks.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-calendar-plus text-3xl mb-3 opacity-50"></i>
                    <p class="text-sm">No upcoming tasks in the next 7 days</p>
                    <a href="tasks.html" class="text-blue-400 hover:text-blue-300 text-xs mt-2 inline-block">Plan ahead →</a>
                </div>
            `;
            return;
        }

        // Show all upcoming tasks (not limited to 5)
        const upcoming = dashboardData.upcomingTasks
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        container.innerHTML = upcoming.map(task => {
            const daysUntil = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            return `
                <div class="task-item bg-dark-surface p-4 rounded-lg border border-dark-border hover:border-blue-500/50 transition-colors" data-task-id="${task._id}">
                    <div class="task-content">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-semibold text-white mb-1">${escapeHtml(task.title)}</h4>
                                ${task.description ? `<p class="text-sm text-gray-400 mb-2">${escapeHtml(task.description)}</p>` : ''}
                                <div class="flex gap-2 mt-2">
                                    <span class="text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(task.priority)}">
                                        ${(task.priority || 'medium').toUpperCase()}
                                    </span>
                                    <span class="text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(task.status)}">
                                        ${(task.status || 'pending').toUpperCase()}
                                    </span>
                                    <span class="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                                        In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}
                                    </span>
                                    ${task.category ? `<span class="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">${task.category}</span>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-4">
                                <div class="text-right">
                                    <p class="text-xs text-gray-400">Due</p>
                                    <p class="text-xs text-white">${formatTaskDate(task.dueDate)}</p>
                                </div>
                                <button onclick="toggleTaskFromDashboard('${task._id || task.id}')" 
                                        class="text-gray-400 hover:text-green-400 transition-colors">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error updating upcoming tasks main:', error);
    }
}

// Update past tasks display
function updatePastTasks() {
    try {
        const container = document.getElementById('pastTasksList');
        const countEl = document.getElementById('pastTasksCount');

        if (!container) return;

        const pastCount = dashboardData.pastTasks ? dashboardData.pastTasks.length : 0;
        if (countEl) countEl.textContent = pastCount;

        if (!dashboardData.pastTasks || dashboardData.pastTasks.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-check-circle text-3xl mb-3 opacity-50"></i>
                    <p class="text-sm">No recently completed tasks</p>
                    <p class="text-xs mt-2">Complete some tasks to see them here!</p>
                </div>
            `;
            return;
        }

        // Show up to 10 most recent completed tasks
        const recentPast = dashboardData.pastTasks.slice(0, 10);

        container.innerHTML = recentPast.map(task => {
            const completedDate = new Date(task.completedAt || task.updatedAt || task.dueDate);
            const daysAgo = Math.floor((new Date() - completedDate) / (1000 * 60 * 60 * 24));

            return `
                <div class="task-item bg-green-900/20 p-4 rounded-lg border border-green-500/30 hover:border-green-400 transition-colors" data-task-id="${task._id}">
                    <div class="task-content">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-semibold text-white mb-1">${escapeHtml(task.title)}</h4>
                                ${task.description ? `<p class="text-sm text-gray-400 mb-2">${escapeHtml(task.description)}</p>` : ''}
                                <div class="flex gap-2 mt-2">
                                    <span class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                                        <i class="fas fa-check mr-1"></i>COMPLETED
                                    </span>
                                    <span class="text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(task.priority)}">
                                        ${(task.priority || 'medium').toUpperCase()}
                                    </span>
                                    <span class="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
                                        ${daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
                                    </span>
                                    ${task.category ? `<span class="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">${task.category}</span>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-4">
                                <div class="text-right">
                                    <p class="text-xs text-green-400">Completed</p>
                                    <p class="text-xs text-white">${formatTaskDate(completedDate)}</p>
                                </div>
                                <i class="fas fa-check-circle text-green-400"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error updating past tasks:', error);
    }
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

// Set up event listeners
function setupEventListeners() {
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

function getPriorityBadgeColor(priority) {
    const colors = {
        'urgent': 'bg-red-500/20 text-red-400',
        'high': 'bg-orange-500/20 text-orange-400',
        'medium': 'bg-yellow-500/20 text-yellow-400',
        'low': 'bg-green-500/20 text-green-400'
    };
    return colors[priority] || colors['medium'];
}

function getStatusBadgeColor(status) {
    const colors = {
        'completed': 'bg-green-500/20 text-green-400',
        'pending': 'bg-yellow-500/20 text-yellow-400',
        'in_progress': 'bg-blue-500/20 text-blue-400',
        'cancelled': 'bg-red-500/20 text-red-400'
    };
    return colors[status] || colors['pending'];
}

function formatTaskDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString();
    }
}

function toggleTaskFromDashboard(taskId) {
    // This function can be implemented to toggle task status from dashboard
    console.log('Toggle task:', taskId);
    // You could make an API call here to update the task status
    // and then refresh the dashboard data
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
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
