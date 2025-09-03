// Analytics Dashboard - Comprehensive Data Visualization
// API Configuration
const API_BASE = 'http://localhost:3000/api';

// Chart instances
let analyticsCharts = {};
let taskData = null;
let analyticsData = null;

// Initialize analytics dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeAnalytics();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Period selector change
    document.getElementById('analyticsPeriodSelector')?.addEventListener('change', function() {
        const period = this.value;
        loadAnalyticsData(period);
    });

    // Time usage period change
    document.getElementById('timeUsagePeriod')?.addEventListener('change', function() {
        updateTimeUsageChart();
    });

    // Productivity metric change
    document.getElementById('productivityMetric')?.addEventListener('change', function() {
        updateProductivityChart();
    });

    // Comparison period change
    document.getElementById('comparisonPeriod')?.addEventListener('change', function() {
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
