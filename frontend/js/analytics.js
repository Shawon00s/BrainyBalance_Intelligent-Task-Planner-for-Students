// Minimal analytics script: fetches real data and renders two charts and key metrics
const API_BASE = 'http://localhost:3000/api';

let charts = {};

function requireAuthToken() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
        console.log('No authentication token found, redirecting to login...');
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function () {
    if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    // Initialize analytics if authenticated
    loadAnalytics();
});

async function fetchJson(url, token) {
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
        if (res.status === 401) {
            console.log('Authentication failed, redirecting to login...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }
        throw new Error(`${res.status} ${res.statusText}`);
    }
    return res.json();
}

async function loadAnalytics() {
    const token = requireAuthToken();
    if (!token) return;

    const period = document.getElementById('analyticsPeriodSelector')?.value || '7';
    let periodStr = 'week';
    if (Number(period) <= 7) periodStr = 'week';
    else if (Number(period) <= 90) periodStr = 'month';
    else periodStr = 'year';

    try {
        const [dashboard, tasks, insights] = await Promise.all([
            fetchJson(`${API_BASE}/analytics/dashboard?period=${periodStr}`, token),
            fetchJson(`${API_BASE}/tasks?sortBy=updatedAt&order=desc`, token),
            fetchJson(`${API_BASE}/analytics/insights`, token).catch(() => null)
        ]);

        // Map and render metrics
        const summary = dashboard.summary || {};
        document.getElementById('totalStudyHours').textContent = Math.round((summary.totalWorkMinutes || 0) / 60) + 'h';
        document.getElementById('tasksCompleted').textContent = summary.totalTasksCompleted || 0;
        document.getElementById('focusSessions').textContent = summary.totalPomodoroSessions || 0;
        document.getElementById('productivityScore').textContent = Math.round(summary.averageProductivityScore || 0) + '%';

        // Daily study chart
        const analyticsArr = Array.isArray(dashboard.analytics) ? dashboard.analytics : [];
        const dailyLabels = analyticsArr.map(d => new Date(d.date).toLocaleDateString());
        const dailyValues = analyticsArr.map(d => ((d.totalWorkMinutes || 0) / 60).toFixed(2));
        renderLineChart('dailyStudyChart', dailyLabels, dailyValues, 'Study Hours');

        // Task status pie/doughnut
        const tasksList = Array.isArray(tasks.tasks) ? tasks.tasks : (Array.isArray(tasks) ? tasks : []);
        const statusCounts = tasksList.reduce((acc, t) => {
            const s = (t.status || 'pending').toLowerCase();
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});
        const statusLabels = Object.keys(statusCounts);
        const statusValues = statusLabels.map(k => statusCounts[k]);
        renderDoughnutChart('statusChart', statusLabels, statusValues);

        // Recent activity
        const activities = (tasksList || []).slice(0, 6).map(t => ({
            title: t.title || t.name || 'Untitled',
            subtitle: t.status || t.priority || '',
            time: t.updatedAt || t.createdAt
        }));
        renderRecentActivity(activities);

        // Insights (if provided)
        if (insights && (insights.insights || insights.length)) {
            const arr = insights.insights || insights;
            const container = document.getElementById('studyInsights');
            container.innerHTML = arr.map(s => `<div class="p-3 bg-dark-surface/20 rounded">${escapeHtml(s)}</div>`).join('');
        }

    } catch (err) {
        console.error('Load analytics failed:', err);
        document.getElementById('totalStudyHours').textContent = 'Error';
    }
}

function renderLineChart(canvasId, labels, values, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label, data: values, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.15)', fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderDoughnutChart(canvasId, labels, values) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderRecentActivity(items) {
    const c = document.getElementById('recentActivityFeed');
    if (!c) return;
    c.innerHTML = items.map(i => `
        <div class="p-2 bg-dark-surface/10 rounded flex justify-between">
            <div>
                <div class="text-sm text-white">${escapeHtml(i.title)}</div>
                <div class="text-xs text-gray-400">${escapeHtml(i.subtitle)}</div>
            </div>
            <div class="text-xs text-gray-400">${i.time ? new Date(i.time).toLocaleString() : ''}</div>
        </div>
    `).join('');
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// Wire controls
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('analyticsPeriodSelector').addEventListener('change', loadAnalytics);
    document.getElementById('exportReportBtn').addEventListener('click', () => alert('Export not implemented'));
    loadAnalytics();
});
