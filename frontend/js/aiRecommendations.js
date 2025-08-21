// AI Recommendations JavaScript
let recommendations = [];
let currentRecommendation = null;

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!isAuthenticated()) {
        return;
    }

    // Initialize AI recommendations page
    initializeAIRecommendations();
    setupEventListeners();
    loadRecommendations();
    loadStats();
});

function initializeAIRecommendations() {
    console.log('Initializing AI Recommendations page...');
}

function setupEventListeners() {
    // Generate recommendations button
    document.getElementById('generateRecommendations').addEventListener('click', generateRecommendations);
    document.getElementById('generateFirst')?.addEventListener('click', generateRecommendations);

    // Filter change handlers
    document.getElementById('filterType').addEventListener('change', filterRecommendations);
    document.getElementById('filterPriority').addEventListener('change', filterRecommendations);

    // Modal handlers
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('applyRecommendation').addEventListener('click', applyCurrentRecommendation);
    document.getElementById('dismissRecommendation').addEventListener('click', dismissCurrentRecommendation);

    // Click outside modal to close
    document.getElementById('recommendationModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

async function loadRecommendations() {
    try {
        showLoading();

        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/ai-recommendations', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load recommendations');
        }

        const data = await response.json();
        recommendations = data.recommendations || [];

        hideLoading();
        displayRecommendations(recommendations);

    } catch (error) {
        console.error('Error loading recommendations:', error);
        hideLoading();
        showNotification('Failed to load AI recommendations', 'error');
    }
}

async function loadStats() {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/ai-recommendations/stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load stats');
        }

        const data = await response.json();
        updateStatsDisplay(data);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStatsDisplay(data) {
    const { overall, typeDistribution } = data;

    document.getElementById('activeCount').textContent = overall.active || 0;
    document.getElementById('appliedToday').textContent = overall.applied || 0;

    // Calculate average confidence
    if (typeDistribution && typeDistribution.length > 0) {
        const avgConf = typeDistribution.reduce((sum, type) => sum + type.avgConfidence, 0) / typeDistribution.length;
        document.getElementById('avgConfidence').textContent = Math.round(avgConf) + '%';
    } else {
        document.getElementById('avgConfidence').textContent = '0%';
    }

    // Calculate success rate
    const successRate = overall.total > 0 ? Math.round((overall.applied / overall.total) * 100) : 0;
    document.getElementById('successRate').textContent = successRate + '%';
}

async function generateRecommendations() {
    try {
        showLoading();

        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/ai-recommendations/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to generate recommendations');
        }

        const data = await response.json();

        hideLoading();
        showNotification(`Generated ${data.count} new AI recommendations!`, 'success');

        // Reload recommendations and stats
        await loadRecommendations();
        await loadStats();

    } catch (error) {
        console.error('Error generating recommendations:', error);
        hideLoading();
        showNotification('Failed to generate AI recommendations', 'error');
    }
}

function displayRecommendations(recs) {
    const grid = document.getElementById('recommendationsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!recs || recs.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    grid.innerHTML = recs.map(recommendation => createRecommendationCard(recommendation)).join('');

    // Add click handlers
    recs.forEach(rec => {
        const card = document.getElementById(`rec-${rec._id}`);
        if (card) {
            card.addEventListener('click', () => openRecommendationModal(rec));
        }
    });
}

function createRecommendationCard(rec) {
    const priorityClass = `priority-${rec.priority}`;
    const typeIcon = getTypeIcon(rec.type);
    const typeLabel = getTypeLabel(rec.type);
    const confidenceWidth = rec.confidence;
    const confidenceColor = getConfidenceColor(rec.confidence);

    return `
        <div id="rec-${rec._id}" class="ai-card glass-effect rounded-xl p-6 cursor-pointer ${priorityClass} fade-in">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br ${typeIcon.gradient} rounded-lg flex items-center justify-center">
                        <i class="${typeIcon.icon} text-white"></i>
                    </div>
                    <div>
                        <span class="inline-block px-2 py-1 text-xs rounded-full ${getPriorityBadgeColor(rec.priority)} mb-1">
                            ${rec.priority.toUpperCase()}
                        </span>
                        <p class="text-gray-400 text-sm">${typeLabel}</p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="flex items-center space-x-1 mb-1">
                        <i class="fas fa-brain text-purple-400 text-sm"></i>
                        <span class="text-sm font-medium text-purple-400">${rec.confidence}%</span>
                    </div>
                    <div class="w-16 h-2 bg-gray-600 rounded-full">
                        <div class="h-full ${confidenceColor} rounded-full confidence-bar" style="width: ${confidenceWidth}%"></div>
                    </div>
                </div>
            </div>
            
            <h3 class="font-semibold text-white mb-2 line-clamp-2">${rec.title}</h3>
            <p class="text-gray-400 text-sm mb-4 line-clamp-3">${rec.description}</p>
            
            <div class="flex items-center justify-between">
                <div class="text-xs text-gray-500">
                    <i class="fas fa-clock mr-1"></i>
                    ${formatTimeAgo(rec.createdAt)}
                </div>
                <div class="flex items-center space-x-2">
                    ${rec.isApplied ?
            '<span class="text-green-400 text-sm"><i class="fas fa-check mr-1"></i>Applied</span>' :
            '<span class="text-blue-400 text-sm hover:text-blue-300 transition-colors">View Details <i class="fas fa-arrow-right ml-1"></i></span>'
        }
                </div>
            </div>
        </div>
    `;
}

function getTypeIcon(type) {
    const icons = {
        'task_priority': { icon: 'fas fa-sort-amount-down', gradient: 'from-red-500 to-red-600' },
        'study_time': { icon: 'fas fa-clock', gradient: 'from-blue-500 to-blue-600' },
        'workload_balance': { icon: 'fas fa-balance-scale', gradient: 'from-green-500 to-green-600' },
        'deadline_alert': { icon: 'fas fa-exclamation-triangle', gradient: 'from-orange-500 to-orange-600' },
        'pattern_suggestion': { icon: 'fas fa-chart-line', gradient: 'from-purple-500 to-purple-600' },
        'schedule_optimization': { icon: 'fas fa-calendar-check', gradient: 'from-indigo-500 to-indigo-600' }
    };
    return icons[type] || { icon: 'fas fa-lightbulb', gradient: 'from-gray-500 to-gray-600' };
}

function getTypeLabel(type) {
    const labels = {
        'task_priority': 'Task Priority',
        'study_time': 'Study Time',
        'workload_balance': 'Workload Balance',
        'deadline_alert': 'Deadline Alert',
        'pattern_suggestion': 'Pattern Suggestion',
        'schedule_optimization': 'Schedule Optimization'
    };
    return labels[type] || 'General';
}

function getPriorityBadgeColor(priority) {
    const colors = {
        'urgent': 'bg-red-500/20 text-red-400',
        'high': 'bg-orange-500/20 text-orange-400',
        'medium': 'bg-yellow-500/20 text-yellow-400',
        'low': 'bg-green-500/20 text-green-400'
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-400';
}

function getConfidenceColor(confidence) {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    if (confidence >= 40) return 'bg-orange-500';
    return 'bg-red-500';
}

function filterRecommendations() {
    const typeFilter = document.getElementById('filterType').value;
    const priorityFilter = document.getElementById('filterPriority').value;

    let filtered = recommendations;

    if (typeFilter) {
        filtered = filtered.filter(rec => rec.type === typeFilter);
    }

    if (priorityFilter) {
        filtered = filtered.filter(rec => rec.priority === priorityFilter);
    }

    displayRecommendations(filtered);
}

function openRecommendationModal(recommendation) {
    currentRecommendation = recommendation;

    const modal = document.getElementById('recommendationModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');

    title.textContent = recommendation.title;
    content.innerHTML = createModalContent(recommendation);

    modal.classList.remove('hidden');

    // Update button states
    const applyBtn = document.getElementById('applyRecommendation');
    const dismissBtn = document.getElementById('dismissRecommendation');

    if (recommendation.isApplied) {
        applyBtn.disabled = true;
        applyBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Already Applied';
        applyBtn.classList.add('opacity-50');
    } else {
        applyBtn.disabled = false;
        applyBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Apply Recommendation';
        applyBtn.classList.remove('opacity-50');
    }
}

function createModalContent(rec) {
    const typeIcon = getTypeIcon(rec.type);
    const typeLabel = getTypeLabel(rec.type);

    return `
        <div class="space-y-6">
            <div class="flex items-center space-x-4">
                <div class="w-16 h-16 bg-gradient-to-br ${typeIcon.gradient} rounded-xl flex items-center justify-center">
                    <i class="${typeIcon.icon} text-white text-2xl"></i>
                </div>
                <div>
                    <h4 class="text-lg font-semibold text-white">${typeLabel}</h4>
                    <div class="flex items-center space-x-4 mt-1">
                        <span class="inline-block px-3 py-1 text-sm rounded-full ${getPriorityBadgeColor(rec.priority)}">
                            ${rec.priority.toUpperCase()} PRIORITY
                        </span>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-brain text-purple-400"></i>
                            <span class="text-purple-400 font-medium">${rec.confidence}% Confidence</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-dark-surface rounded-lg p-4">
                <h5 class="font-medium text-white mb-2">Description</h5>
                <p class="text-gray-300 leading-relaxed">${rec.description}</p>
            </div>
            
            ${rec.data && Object.keys(rec.data).length > 0 ? `
                <div class="bg-dark-surface rounded-lg p-4">
                    <h5 class="font-medium text-white mb-3">Additional Details</h5>
                    <div class="space-y-2">
                        ${formatRecommendationData(rec.data)}
                    </div>
                </div>
            ` : ''}
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="bg-blue-500/10 rounded-lg p-3">
                    <div class="text-blue-400 font-medium mb-1">Created</div>
                    <div class="text-gray-300">${formatDateTime(rec.createdAt)}</div>
                </div>
                <div class="bg-purple-500/10 rounded-lg p-3">
                    <div class="text-purple-400 font-medium mb-1">Expires</div>
                    <div class="text-gray-300">${rec.expiresAt ? formatDateTime(rec.expiresAt) : 'Never'}</div>
                </div>
            </div>
        </div>
    `;
}

function formatRecommendationData(data) {
    let html = '';

    for (const [key, value] of Object.entries(data)) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        if (Array.isArray(value)) {
            html += `
                <div class="flex justify-between">
                    <span class="text-gray-400">${formattedKey}:</span>
                    <span class="text-gray-300">${value.join(', ')}</span>
                </div>
            `;
        } else if (typeof value === 'object' && value !== null) {
            html += `
                <div class="text-gray-400 mb-1">${formattedKey}:</div>
                <div class="ml-4 space-y-1">
                    ${formatRecommendationData(value)}
                </div>
            `;
        } else {
            html += `
                <div class="flex justify-between">
                    <span class="text-gray-400">${formattedKey}:</span>
                    <span class="text-gray-300">${value}</span>
                </div>
            `;
        }
    }

    return html;
}

function closeModal() {
    document.getElementById('recommendationModal').classList.add('hidden');
    currentRecommendation = null;
}

async function applyCurrentRecommendation() {
    if (!currentRecommendation) return;

    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/ai-recommendations/${currentRecommendation._id}/apply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to apply recommendation');
        }

        const data = await response.json();

        showNotification('Recommendation applied successfully!', 'success');
        closeModal();

        // Reload recommendations
        await loadRecommendations();
        await loadStats();

    } catch (error) {
        console.error('Error applying recommendation:', error);
        showNotification('Failed to apply recommendation', 'error');
    }
}

async function dismissCurrentRecommendation() {
    if (!currentRecommendation) return;

    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/ai-recommendations/${currentRecommendation._id}/dismiss`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to dismiss recommendation');
        }

        showNotification('Recommendation dismissed', 'info');
        closeModal();

        // Reload recommendations
        await loadRecommendations();
        await loadStats();

    } catch (error) {
        console.error('Error dismissing recommendation:', error);
        showNotification('Failed to dismiss recommendation', 'error');
    }
}

// Utility functions
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showLoading() {
    document.getElementById('loadingIndicator').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingIndicator').classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all transform translate-x-full`;

    // Set color based on type
    switch (type) {
        case 'success':
            notification.className += ' bg-green-500 text-white';
            break;
        case 'error':
            notification.className += ' bg-red-500 text-white';
            break;
        case 'warning':
            notification.className += ' bg-yellow-500 text-black';
            break;
        default:
            notification.className += ' bg-blue-500 text-white';
    }

    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
