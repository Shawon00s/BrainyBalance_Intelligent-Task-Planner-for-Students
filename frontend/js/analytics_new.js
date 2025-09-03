// Analytics Dashboard - Comprehensive Data Visualization
// API Configuration
const API_BASE = 'http://localhost:3000/api';

// Chart instances
let analyticsCharts = {};
let taskData = null;
let analyticsData = null;

// Initialize analytics dashboard
document.addEventListener('DOMContentLoaded', function () {
    initializeAnalytics();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Period selector change
    document.getElementById('analyticsPeriodSelector')?.addEventListener('change', function () {
        const period = this.value;
        loadAnalyticsData(period);
    });

    // Time usage period change
    document.getElementById('timeUsagePeriod')?.addEventListener('change', function () {
        updateTimeUsageChart();
    });

    // Productivity metric change
    document.getElementById('productivityMetric')?.addEventListener('change', function () {
        updateProductivityChart();
    });

    // Comparison period change
    document.getElementById('comparisonPeriod')?.addEventListener('change', function () {
        updateComparisonChart();
    });

    // Export report button
    document.getElementById('exportReportBtn')?.addEventListener('click', exportAnalyticsReport);
}

// Initialize analytics
async function initializeAnalytics() {
    try {
        showLoadingStates();
        await loadAnalyticsData(7); // Default to last 7 days
    } catch (error) {
        console.error('Error initializing analytics:', error);
        showErrorStates();
    }
}

// Load analytics data from backend
async function loadAnalyticsData(period = 7) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Fetch all analytics data
        const [
            tasksResponse,
            analyticsResponse,
            timeUsageResponse,
            focusSessionsResponse,
            subjectsResponse
        ] = await Promise.all([
            fetch(`${API_BASE}/tasks?period=${period}`, { headers }),
            fetch(`${API_BASE}/analytics/overview?period=${period}`, { headers }),
            fetch(`${API_BASE}/analytics/time-usage?period=${period}`, { headers }),
            fetch(`${API_BASE}/analytics/focus-sessions?period=${period}`, { headers }),
            fetch(`${API_BASE}/analytics/subjects?period=${period}`, { headers })
        ]);

        if (!tasksResponse.ok || !analyticsResponse.ok) {
            throw new Error('Failed to fetch analytics data');
        }

        const tasks = await tasksResponse.json();
        const analytics = await analyticsResponse.json();
        const timeUsage = await timeUsageResponse.json();
        const focusSessions = await focusSessionsResponse.json();
        const subjects = await subjectsResponse.json();

        // Store data
        taskData = tasks;
        analyticsData = {
            overview: analytics,
            timeUsage: timeUsage,
            focusSessions: focusSessions,
            subjects: subjects
        };

        // Update all visualizations
        updateKeyMetrics();
        createAllCharts();
        updateActivityFeed();
        generateInsights();

    } catch (error) {
        console.error('Error loading analytics data:', error);
        showErrorStates();
    }
}

// Update key metrics
function updateKeyMetrics() {
    if (!analyticsData?.overview) return;

    const overview = analyticsData.overview;

    // Total Study Hours
    document.getElementById('totalStudyHours').textContent = `${overview.totalStudyHours || 0}h`;
    document.getElementById('studyHoursTrend').innerHTML =
        `<i class="fas fa-${overview.studyHoursTrend >= 0 ? 'arrow-up text-green-400' : 'arrow-down text-red-400'}"></i> 
         ${Math.abs(overview.studyHoursTrend || 0)}% vs last period`;

    // Tasks Completed
    document.getElementById('tasksCompleted').textContent = overview.tasksCompleted || 0;
    document.getElementById('tasksCompletedTrend').innerHTML =
        `<i class="fas fa-${overview.tasksTrend >= 0 ? 'arrow-up text-green-400' : 'arrow-down text-red-400'}"></i> 
         ${Math.abs(overview.tasksTrend || 0)}% vs last period`;

    // Average Grade
    document.getElementById('averageGrade').textContent = `${overview.averageGrade || 0}%`;
    document.getElementById('averageGradeTrend').innerHTML =
        `<i class="fas fa-${overview.gradeTrend >= 0 ? 'arrow-up text-green-400' : 'arrow-down text-red-400'}"></i> 
         ${Math.abs(overview.gradeTrend || 0)}% vs last period`;

    // Productivity Score
    document.getElementById('productivityScore').textContent = overview.productivityScore || 0;
    document.getElementById('productivityTrend').innerHTML =
        `<i class="fas fa-${overview.productivityTrend >= 0 ? 'arrow-up text-green-400' : 'arrow-down text-red-400'}"></i> 
         ${Math.abs(overview.productivityTrend || 0)}% vs last period`;
}

// Create all charts
function createAllCharts() {
    createDailyStudyChart();
    createWeeklyProgressChart();
    createTaskTypeChart();
    createPriorityChart();
    createStatusChart();
    createTimeUsageChart();
    createSubjectChart();
    createProductivityChart();
    createFocusChart();
    createComparisonChart();
}

// Daily Study Hours Chart
function createDailyStudyChart() {
    const ctx = document.getElementById('dailyStudyChart');
    if (!ctx || !analyticsData?.overview?.dailyHours) return;

    if (analyticsCharts.dailyStudyChart) {
        analyticsCharts.dailyStudyChart.destroy();
    }

    const data = analyticsData.overview.dailyHours;
    const labels = data.map(item => new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    const values = data.map(item => item.hours);

    analyticsCharts.dailyStudyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Study Hours',
                data: values,
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Update daily average
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    document.getElementById('dailyAverage').textContent = `${average.toFixed(1)}h`;
}

// Weekly Progress Chart
function createWeeklyProgressChart() {
    const ctx = document.getElementById('weeklyProgressChart');
    if (!ctx || !analyticsData?.overview?.weeklyProgress) return;

    if (analyticsCharts.weeklyProgressChart) {
        analyticsCharts.weeklyProgressChart.destroy();
    }

    const data = analyticsData.overview.weeklyProgress;
    const labels = data.map(item => `Week ${item.week}`);
    const completed = data.map(item => item.completed);
    const total = data.map(item => item.total);

    analyticsCharts.weeklyProgressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Completed',
                    data: completed,
                    backgroundColor: '#10b981'
                },
                {
                    label: 'Total',
                    data: total,
                    backgroundColor: '#374151'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Update weekly metrics
    const totalCompleted = completed.reduce((a, b) => a + b, 0);
    const totalTasks = total.reduce((a, b) => a + b, 0);
    const completionRate = totalTasks > 0 ? (totalCompleted / totalTasks * 100).toFixed(1) : 0;
    const avgWeeklyTasks = totalTasks / data.length;

    document.getElementById('weeklyCompletion').textContent = `${completionRate}%`;
    document.getElementById('avgWeeklyTasks').textContent = avgWeeklyTasks.toFixed(1);
}

// Task Type Chart (Exam, Assignment, Project)
function createTaskTypeChart() {
    const ctx = document.getElementById('taskTypeChart');
    if (!ctx || !taskData?.tasks) return;

    if (analyticsCharts.taskTypeChart) {
        analyticsCharts.taskTypeChart.destroy();
    }

    // Count tasks by type
    const typeCounts = {
        exam: 0,
        assignment: 0,
        project: 0,
        personal: 0
    };

    taskData.tasks.forEach(task => {
        const type = (task.category || task.type || 'personal').toLowerCase();
        if (typeCounts.hasOwnProperty(type)) {
            typeCounts[type]++;
        } else {
            typeCounts.personal++;
        }
    });

    analyticsCharts.taskTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Exams', 'Assignments', 'Projects', 'Personal'],
            datasets: [{
                data: [typeCounts.exam, typeCounts.assignment, typeCounts.project, typeCounts.personal],
                backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Update counts
    document.getElementById('examCount').textContent = typeCounts.exam;
    document.getElementById('assignmentCount').textContent = typeCounts.assignment;
    document.getElementById('projectCount').textContent = typeCounts.project;
    document.getElementById('personalCount').textContent = typeCounts.personal;
}

// Priority Chart
function createPriorityChart() {
    const ctx = document.getElementById('priorityChart');
    if (!ctx || !taskData?.tasks) return;

    if (analyticsCharts.priorityChart) {
        analyticsCharts.priorityChart.destroy();
    }

    // Count tasks by priority
    const priorityCounts = {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
    };

    taskData.tasks.forEach(task => {
        const priority = (task.priority || 'low').toLowerCase();
        if (priorityCounts.hasOwnProperty(priority)) {
            priorityCounts[priority]++;
        } else {
            priorityCounts.low++;
        }
    });

    analyticsCharts.priorityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Urgent', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [priorityCounts.urgent, priorityCounts.high, priorityCounts.medium, priorityCounts.low],
                backgroundColor: ['#dc2626', '#f97316', '#eab308', '#22c55e']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Update counts
    document.getElementById('urgentCount').textContent = priorityCounts.urgent;
    document.getElementById('highCount').textContent = priorityCounts.high;
    document.getElementById('mediumCount').textContent = priorityCounts.medium;
    document.getElementById('lowCount').textContent = priorityCounts.low;
}

// Status Chart
function createStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx || !taskData?.tasks) return;

    if (analyticsCharts.statusChart) {
        analyticsCharts.statusChart.destroy();
    }

    // Count tasks by status
    const statusCounts = {
        completed: 0,
        'in-progress': 0,
        pending: 0,
        overdue: 0
    };

    const now = new Date();
    taskData.tasks.forEach(task => {
        let status = (task.status || 'pending').toLowerCase();

        // Check if task is overdue
        if (status !== 'completed' && task.dueDate && new Date(task.dueDate) < now) {
            status = 'overdue';
        }

        if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
        } else {
            statusCounts.pending++;
        }
    });

    analyticsCharts.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
            datasets: [{
                data: [statusCounts.completed, statusCounts['in-progress'], statusCounts.pending, statusCounts.overdue],
                backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Update counts
    document.getElementById('completedCount').textContent = statusCounts.completed;
    document.getElementById('inProgressCount').textContent = statusCounts['in-progress'];
    document.getElementById('pendingCount').textContent = statusCounts.pending;
    document.getElementById('overdueCount').textContent = statusCounts.overdue;
}

// Time Usage Chart
function createTimeUsageChart() {
    const ctx = document.getElementById('timeUsageChart');
    if (!ctx || !analyticsData?.timeUsage) return;

    if (analyticsCharts.timeUsageChart) {
        analyticsCharts.timeUsageChart.destroy();
    }

    const data = analyticsData.timeUsage;

    analyticsCharts.timeUsageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Study Time', 'Task Work', 'Break Time', 'Focus Sessions'],
            datasets: [{
                data: [data.studyTime || 0, data.taskWork || 0, data.breakTime || 0, data.focusTime || 0],
                backgroundColor: ['#3b82f6', '#10b981', '#eab308', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Update time values
    document.getElementById('studyTimeValue').textContent = `${data.studyTime || 0}h`;
    document.getElementById('taskTimeValue').textContent = `${data.taskWork || 0}h`;
    document.getElementById('breakTimeValue').textContent = `${data.breakTime || 0}h`;
    document.getElementById('focusTimeValue').textContent = `${data.focusTime || 0}h`;
}

// Subject Performance Chart
function createSubjectChart() {
    const ctx = document.getElementById('subjectChart');
    if (!ctx || !analyticsData?.subjects) return;

    if (analyticsCharts.subjectChart) {
        analyticsCharts.subjectChart.destroy();
    }

    const subjects = analyticsData.subjects;
    const labels = subjects.map(s => s.name);
    const scores = subjects.map(s => s.averageScore);

    analyticsCharts.subjectChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Performance',
                data: scores,
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                pointBackgroundColor: '#06b6d4'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    pointLabels: { color: '#94a3b8' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Find best subject
    if (subjects.length > 0) {
        const bestSubject = subjects.reduce((prev, current) =>
            (prev.averageScore > current.averageScore) ? prev : current
        );
        document.getElementById('bestSubject').textContent = bestSubject.name;
    }
}

// Productivity Chart
function createProductivityChart() {
    const ctx = document.getElementById('productivityChart');
    if (!ctx || !analyticsData?.overview?.productivityTrend) return;

    if (analyticsCharts.productivityChart) {
        analyticsCharts.productivityChart.destroy();
    }

    const data = analyticsData.overview.productivityTrend;
    const labels = data.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const values = data.map(item => item.score);

    analyticsCharts.productivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Productivity Score',
                data: values,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Update productivity metrics
    const currentScore = values[values.length - 1] || 0;
    const previousScore = values[values.length - 2] || 0;
    const change = currentScore - previousScore;
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    document.getElementById('productivityChange').textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    document.getElementById('productivityAverage').textContent = average.toFixed(1);
}

// Focus Session Chart
function createFocusChart() {
    const ctx = document.getElementById('focusChart');
    if (!ctx || !analyticsData?.focusSessions) return;

    if (analyticsCharts.focusChart) {
        analyticsCharts.focusChart.destroy();
    }

    const data = analyticsData.focusSessions;
    const labels = data.sessions.map(s => new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const durations = data.sessions.map(s => s.duration);

    analyticsCharts.focusChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Session Duration (min)',
                data: durations,
                backgroundColor: '#ec4899'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Update focus metrics
    document.getElementById('totalSessions').textContent = data.totalSessions || 0;
    document.getElementById('avgSessionDuration').textContent = `${data.averageDuration || 0} min`;
    document.getElementById('focusSuccessRate').textContent = `${data.successRate || 0}%`;
}

// Comparison Chart
function createComparisonChart() {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx || !analyticsData?.overview?.comparison) return;

    if (analyticsCharts.comparisonChart) {
        analyticsCharts.comparisonChart.destroy();
    }

    const comparison = analyticsData.overview.comparison;

    analyticsCharts.comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Tasks', 'Study Hours', 'Focus Sessions', 'Efficiency'],
            datasets: [
                {
                    label: 'Current Period',
                    data: [comparison.current.tasks, comparison.current.hours, comparison.current.focus, comparison.current.efficiency],
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'Previous Period',
                    data: [comparison.previous.tasks, comparison.previous.hours, comparison.previous.focus, comparison.previous.efficiency],
                    backgroundColor: '#6b7280'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#94a3b8' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Update comparison metrics
    document.getElementById('currentTasks').textContent = comparison.current.tasks;
    document.getElementById('currentHours').textContent = `${comparison.current.hours}h`;
    document.getElementById('currentFocus').textContent = comparison.current.focus;
    document.getElementById('currentEfficiency').textContent = `${comparison.current.efficiency}%`;

    // Calculate percentage changes
    const taskChange = ((comparison.current.tasks - comparison.previous.tasks) / comparison.previous.tasks * 100).toFixed(1);
    const hoursChange = ((comparison.current.hours - comparison.previous.hours) / comparison.previous.hours * 100).toFixed(1);
    const focusChange = ((comparison.current.focus - comparison.previous.focus) / comparison.previous.focus * 100).toFixed(1);
    const efficiencyChange = ((comparison.current.efficiency - comparison.previous.efficiency) / comparison.previous.efficiency * 100).toFixed(1);

    document.getElementById('taskChangePercent').textContent = `${taskChange >= 0 ? '+' : ''}${taskChange}%`;
    document.getElementById('hoursChangePercent').textContent = `${hoursChange >= 0 ? '+' : ''}${hoursChange}%`;
    document.getElementById('focusChangePercent').textContent = `${focusChange >= 0 ? '+' : ''}${focusChange}%`;
    document.getElementById('efficiencyChangePercent').textContent = `${efficiencyChange >= 0 ? '+' : ''}${efficiencyChange}%`;
}

// Update activity feed
async function updateActivityFeed() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/analytics/recent-activity`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const activities = await response.json();
            displayRecentActivity(activities);
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

function displayRecentActivity(activities) {
    const container = document.getElementById('recentActivityFeed');
    if (!container) return;

    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i class="fas fa-inbox text-2xl mb-4"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }

    container.innerHTML = activities.map(activity => `
        <div class="flex items-start space-x-3 p-3 bg-dark-surface/30 rounded-lg">
            <div class="bg-${activity.color || 'blue'}-500/20 p-2 rounded-lg">
                <i class="fas fa-${activity.icon || 'circle'} text-${activity.color || 'blue'}-400"></i>
            </div>
            <div class="flex-1">
                <div class="text-white text-sm">${activity.description}</div>
                <div class="text-gray-400 text-xs mt-1">${formatTimeAgo(activity.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

// Generate AI insights
async function generateInsights() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/analytics/insights`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const insights = await response.json();
            displayInsights(insights);
        }
    } catch (error) {
        console.error('Error generating insights:', error);
    }
}

function displayInsights(insights) {
    const container = document.getElementById('studyInsights');
    if (!container) return;

    if (!insights || insights.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i class="fas fa-lightbulb text-2xl mb-4"></i>
                <p>No insights available yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = insights.map(insight => `
        <div class="p-4 bg-dark-surface/30 rounded-lg border-l-4 border-${insight.type === 'positive' ? 'green' : insight.type === 'warning' ? 'yellow' : 'blue'}-400">
            <div class="flex items-start space-x-3">
                <i class="fas fa-${insight.icon || 'lightbulb'} text-${insight.type === 'positive' ? 'green' : insight.type === 'warning' ? 'yellow' : 'blue'}-400 mt-1"></i>
                <div>
                    <div class="text-white text-sm">${insight.title}</div>
                    <div class="text-gray-400 text-xs mt-1">${insight.description}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility functions
function showLoadingStates() {
    // Show loading spinners in all metric cards
    const loadingElements = document.querySelectorAll('[id$="Hours"], [id$="Completed"], [id$="Grade"], [id$="Score"]');
    loadingElements.forEach(el => {
        if (el) el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    });
}

function showErrorStates() {
    // Show error states
    const errorElements = document.querySelectorAll('[id$="Hours"], [id$="Completed"], [id$="Grade"], [id$="Score"]');
    errorElements.forEach(el => {
        if (el) el.textContent = 'Error';
    });
}

function refreshChart(chartId) {
    // Refresh specific chart
    loadAnalyticsData(document.getElementById('analyticsPeriodSelector')?.value || 7);
}

function loadRecentActivity() {
    updateActivityFeed();
}

function exportAnalyticsReport() {
    // Export functionality
    console.log('Exporting analytics report...');
    // Implementation would go here
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

// Chart update functions for period changes
function updateTimeUsageChart() {
    const period = document.getElementById('timeUsagePeriod')?.value;
    // Reload time usage data for the selected period
    loadAnalyticsData(document.getElementById('analyticsPeriodSelector')?.value || 7);
}

function updateProductivityChart() {
    const metric = document.getElementById('productivityMetric')?.value;
    // Update productivity chart based on selected metric
    createProductivityChart();
}

function updateComparisonChart() {
    const period = document.getElementById('comparisonPeriod')?.value;
    // Update comparison chart based on selected period
    createComparisonChart();
}
