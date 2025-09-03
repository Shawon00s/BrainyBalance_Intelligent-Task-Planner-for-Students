// Analytics Page - Simplified and Practical Implementation
// API Configuration
const API_BASE = 'http://localhost:3000/api';

// Analytics Charts
let analyticsCharts = {};
let taskData = null;

// Initialize simplified analytics
function initializeSimplifiedAnalytics() {
    loadTaskData();
}

// Load real task data from backend
async function loadTaskData() {
    try {
        showLoadingState();

        const [tasks, analytics] = await Promise.all([
            fetchTaskData('/api/tasks'),
            fetchAnalyticsData('/api/analytics/dashboard?period=month')
        ]);

        taskData = {
            tasks: tasks,
            analytics: analytics
        };

        // Initialize practical charts
        createTaskStatusChart();
        createWeeklyProgressChart();
        createTaskCategoriesChart();
        createPriorityChart();
        updateRecentActivity();

        hideLoadingState();

    } catch (error) {
        console.error('Error loading task data:', error);
        showErrorState();
    }
}

// Fetch task data from backend
async function fetchTaskData(endpoint) {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
}

// Fetch analytics data from backend
async function fetchAnalyticsData(endpoint) {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
}

// Show loading state
function showLoadingState() {
    const loadingHtml = `
        <div class="flex items-center justify-center h-64">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p class="text-gray-400">Loading analytics data...</p>
            </div>
        </div>
    `;

    // Show loading in chart containers
    const chartContainers = [
        'taskStatusChart', 'weeklyProgressChart', 'taskCategoriesChart', 'priorityChart'
    ];

    chartContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container && container.parentElement) {
            container.parentElement.innerHTML = loadingHtml;
        }
    });
}

// Hide loading state
function hideLoadingState() {
    // Restore chart canvases
    const chartConfigs = [
        { id: 'taskStatusChart', html: '<canvas id="taskStatusChart" width="400" height="400"></canvas>' },
        { id: 'weeklyProgressChart', html: '<canvas id="weeklyProgressChart" width="400" height="300"></canvas>' },
        { id: 'taskCategoriesChart', html: '<canvas id="taskCategoriesChart" width="400" height="300"></canvas>' },
        { id: 'priorityChart', html: '<canvas id="priorityChart" width="400" height="300"></canvas>' }
    ];

    chartConfigs.forEach(config => {
        const container = document.querySelector(`#${config.id}`);
        if (container && container.parentElement) {
            container.parentElement.innerHTML = config.html;
        }
    });
}

// Show error state
function showErrorState() {
    const errorHtml = `
        <div class="flex items-center justify-center h-64">
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-red-400 mb-2">Error loading analytics data</p>
                <button onclick="loadTaskData()" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg">
                    Retry
                </button>
            </div>
        </div>
    `;

    const chartContainers = document.querySelectorAll('canvas');
    chartContainers.forEach(canvas => {
        if (canvas.parentElement) {
            canvas.parentElement.innerHTML = errorHtml;
        }
    });
}

// Create Task Status Chart
function createTaskStatusChart() {
    const ctx = document.getElementById('taskStatusChart').getContext('2d');

    analyticsCharts.taskStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // Green for completed
                    'rgba(59, 130, 246, 0.8)',  // Blue for in-progress
                    'rgba(234, 179, 8, 0.8)',   // Yellow for pending
                    'rgba(239, 68, 68, 0.8)'    // Red for overdue
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    updateTaskStatusChart();
}

// Update Task Status Chart with real data
function updateTaskStatusChart() {
    if (!analyticsCharts.taskStatus || !taskData) return;

    const tasks = taskData.tasks || [];
    const today = new Date();

    let completed = 0, inProgress = 0, pending = 0, overdue = 0;

    tasks.forEach(task => {
        const deadline = new Date(task.deadline);

        switch (task.status) {
            case 'completed':
                completed++;
                break;
            case 'in-progress':
                inProgress++;
                break;
            case 'pending':
                if (deadline < today) {
                    overdue++;
                } else {
                    pending++;
                }
                break;
            default:
                pending++;
        }
    });

    const data = [completed, inProgress, pending, overdue];
    analyticsCharts.taskStatus.data.datasets[0].data = data;
    analyticsCharts.taskStatus.update();

    // Update count displays
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('overdueCount').textContent = overdue;
}

// Create Weekly Progress Chart
function createWeeklyProgressChart() {
    const ctx = document.getElementById('weeklyProgressChart').getContext('2d');

    analyticsCharts.weeklyProgress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Tasks Completed',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                }
            }
        }
    });

    updateWeeklyProgressChart();
}

// Update Weekly Progress Chart
function updateWeeklyProgressChart() {
    if (!analyticsCharts.weeklyProgress || !taskData) return;

    const tasks = taskData.tasks || [];
    const weekData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

    const today = new Date();
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1);

    tasks.filter(task => task.status === 'completed').forEach(task => {
        const completedDate = new Date(task.updatedAt);
        if (completedDate >= weekStart) {
            const dayOfWeek = completedDate.getDay();
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Mon-Sun
            weekData[adjustedDay]++;
        }
    });

    analyticsCharts.weeklyProgress.data.datasets[0].data = weekData;
    analyticsCharts.weeklyProgress.update();

    // Update statistics
    const totalCompleted = weekData.reduce((a, b) => a + b, 0);
    const avgDaily = (totalCompleted / 7).toFixed(1);
    const completionRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;
    const bestDayIndex = weekData.indexOf(Math.max(...weekData));
    const bestDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][bestDayIndex];

    document.getElementById('weeklyCompletion').textContent = `${completionRate}%`;
    document.getElementById('avgDailyTasks').textContent = avgDaily;
    document.getElementById('mostProductiveDay').textContent = bestDay;
}

// Create Task Categories Chart
function createTaskCategoriesChart() {
    const ctx = document.getElementById('taskCategoriesChart').getContext('2d');

    analyticsCharts.taskCategories = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Assignment', 'Exam', 'Project', 'Personal'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',  // Blue
                    'rgba(239, 68, 68, 0.8)',   // Red
                    'rgba(34, 197, 94, 0.8)',   // Green
                    'rgba(234, 179, 8, 0.8)'    // Yellow
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    updateTaskCategoriesChart();
}

// Update Task Categories Chart
function updateTaskCategoriesChart() {
    if (!analyticsCharts.taskCategories || !taskData) return;

    const tasks = taskData.tasks || [];
    const categories = { assignment: 0, exam: 0, project: 0, personal: 0 };

    tasks.forEach(task => {
        const category = task.category || 'personal';
        if (categories.hasOwnProperty(category)) {
            categories[category]++;
        }
    });

    const data = [categories.assignment, categories.exam, categories.project, categories.personal];
    analyticsCharts.taskCategories.data.datasets[0].data = data;
    analyticsCharts.taskCategories.update();

    // Update count displays
    document.getElementById('assignmentCount').textContent = categories.assignment;
    document.getElementById('examCount').textContent = categories.exam;
    document.getElementById('projectCount').textContent = categories.project;
    document.getElementById('personalCount').textContent = categories.personal;
}

// Create Priority Chart
function createPriorityChart() {
    const ctx = document.getElementById('priorityChart').getContext('2d');

    analyticsCharts.priority = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Urgent', 'High', 'Medium', 'Low'],
            datasets: [{
                label: 'Tasks',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',   // Red for urgent
                    'rgba(245, 158, 11, 0.8)',  // Orange for high
                    'rgba(234, 179, 8, 0.8)',   // Yellow for medium
                    'rgba(34, 197, 94, 0.8)'    // Green for low
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                }
            }
        }
    });

    updatePriorityChart();
}

// Update Priority Chart
function updatePriorityChart() {
    if (!analyticsCharts.priority || !taskData) return;

    const tasks = taskData.tasks || [];
    const priorities = { urgent: 0, high: 0, medium: 0, low: 0 };

    tasks.forEach(task => {
        const priority = task.priority || 'medium';
        if (priorities.hasOwnProperty(priority)) {
            priorities[priority]++;
        }
    });

    const data = [priorities.urgent, priorities.high, priorities.medium, priorities.low];
    analyticsCharts.priority.data.datasets[0].data = data;
    analyticsCharts.priority.update();

    // Update count displays
    document.getElementById('urgentCount').textContent = priorities.urgent;
    document.getElementById('highCount').textContent = priorities.high;
    document.getElementById('mediumCount').textContent = priorities.medium;
    document.getElementById('lowCount').textContent = priorities.low;
}

// Update Recent Activity
function updateRecentActivity() {
    if (!taskData) return;

    const tasks = taskData.tasks || [];
    const recentTasks = tasks
        .filter(task => task.status === 'completed')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);

    const activityContainer = document.getElementById('recentActivity');

    if (recentTasks.length === 0) {
        activityContainer.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i class="fas fa-tasks text-3xl mb-2"></i>
                <p>No recent activity found</p>
                <p class="text-sm">Complete some tasks to see activity here</p>
            </div>
        `;
        return;
    }

    activityContainer.innerHTML = recentTasks.map(task => {
        const date = new Date(task.updatedAt);
        const timeAgo = getTimeAgo(date);

        return `
            <div class="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg">
                <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <i class="fas fa-check text-green-400 text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-white font-medium">${task.title}</p>
                    <p class="text-gray-400 text-sm">${timeAgo}</p>
                </div>
                <div class="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    ${task.category || 'Personal'}
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to get time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Setup period change handler
function setupPeriodHandler() {
    const taskPeriod = document.getElementById('taskPeriod');
    if (taskPeriod) {
        taskPeriod.addEventListener('change', (e) => {
            loadTaskData(); // Reload data for new period
        });
    }
}

// Refresh analytics data
async function refreshAnalytics() {
    await loadTaskData();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initializeSimplifiedAnalytics();
        setupPeriodHandler();
    }, 1000);
});
