// Tasks Management JavaScript
let tasks = [];
let currentFilter = 'all';
let currentSort = 'deadline';

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!isAuthenticated()) {
        return;
    }

    // Initialize tasks page
    initializeTasksPage();
    setupEventListeners();
    loadUserProfile(); // Load user profile
    loadTasks();
});

function initializeTasksPage() {
    displayUserInfo();

    // Set up date inputs with default values
    const dueDateInput = document.getElementById('dueDatePicker');
    if (dueDateInput) {
        // Date picker will handle minimum date and default values
        // This is now handled by flatpickr configuration
    }
}

function setupEventListeners() {
    // Add task form
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', handleAddTask);
    }

    // Add task button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', openAddTaskModal);
    }

    // Close modal button
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closeAddTaskModal);
    }

    // Cancel task button
    const cancelTask = document.getElementById('cancelTask');
    if (cancelTask) {
        cancelTask.addEventListener('click', closeAddTaskModal);
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            setFilter(filter);
        });
    });

    // Filter dropdowns
    const priorityFilter = document.getElementById('priorityFilter');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    if (priorityFilter) {
        priorityFilter.addEventListener('change', handleFilterChange);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFilterChange);
    }

    // Sort dropdown
    const sortSelect = document.getElementById('sortTasks');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            displayTasks();
        });
    }

    // Search input
    const searchInput = document.getElementById('searchTasks');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshTasks');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadTasks);
    }

    // Export button
    const exportBtn = document.getElementById('exportTasks');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTasks);
    }
}

async function loadTasks() {
    try {
        showLoading('Loading tasks...');
        const response = await apiCall('/tasks');
        tasks = response.tasks || [];
        displayTasks();
        updateTaskStats();
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Failed to load tasks: ' + error.message, 'error');
    }
}

async function handleAddTask(e) {
    console.log('handleAddTask called');
    e.preventDefault();

    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        deadline: formData.get('dueDate'),
        priority: formData.get('priority'),
        category: formData.get('category'),
        estimatedTime: parseInt(formData.get('estimatedTime')) || 60,
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
    };

    console.log('Task data:', taskData);

    // Validation
    if (!taskData.title || !taskData.deadline) {
        console.log('Validation failed:', { title: taskData.title, deadline: taskData.deadline });
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    console.log('Validation passed, making API call...');

    try {
        showLoading('Creating task...');
        const response = await apiCall('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });

        // Add to local tasks array
        tasks.unshift(response.task);
        displayTasks();
        updateTaskStats();

        // Reset form and close modal
        e.target.reset();
        const modal = document.getElementById('addTaskModal');
        if (modal) modal.classList.add('hidden');

        showNotification('Task created successfully!', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Failed to create task: ' + error.message, 'error');
    }
}

async function updateTask(taskId, updates) {
    try {
        const response = await apiCall(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        // Update local tasks array
        const index = tasks.findIndex(task => task._id === taskId);
        if (index !== -1) {
            tasks[index] = response.task;
            displayTasks();
            updateTaskStats();
        }

        showNotification('Task updated successfully!', 'success');
    } catch (error) {
        showNotification('Failed to update task: ' + error.message, 'error');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        await apiCall(`/tasks/${taskId}`, {
            method: 'DELETE'
        });

        // Remove from local tasks array
        tasks = tasks.filter(task => task._id !== taskId);
        displayTasks();
        updateTaskStats();

        showNotification('Task deleted successfully!', 'success');
    } catch (error) {
        showNotification('Failed to delete task: ' + error.message, 'error');
    }
}

async function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(taskId, { status: newStatus });
}

function handleFilterChange() {
    displayTasks();
}

function handleSearch() {
    displayTasks();
}

function filterTasks(tasks) {
    let filtered = [...tasks];

    // Search filter
    const searchInput = document.getElementById('searchTasks');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    // Priority filter
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter && priorityFilter.value) {
        filtered = filtered.filter(task => task.priority === priorityFilter.value);
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter && statusFilter.value) {
        filtered = filtered.filter(task => task.status === statusFilter.value);
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && categoryFilter.value) {
        filtered = filtered.filter(task => task.category === categoryFilter.value);
    }

    // Current filter (if using filter buttons)
    if (currentFilter !== 'all') {
        switch (currentFilter) {
            case 'pending':
                filtered = filtered.filter(task => task.status === 'pending');
                break;
            case 'completed':
                filtered = filtered.filter(task => task.status === 'completed');
                break;
            case 'overdue':
                const now = new Date();
                filtered = filtered.filter(task =>
                    task.status !== 'completed' && new Date(task.deadline) < now
                );
                break;
        }
    }

    return filtered;
}

function displayTasks() {
    const container = document.getElementById('taskList');
    if (!container) return;

    let filteredTasks = filterTasks(tasks);
    filteredTasks = sortTasks(filteredTasks);

    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-gray-400 text-6xl mb-4">📝</div>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">No tasks found</h3>
                <p class="text-gray-400 mb-4">${currentFilter === 'all' ? 'Create your first task to get started!' : 'No tasks match your current filter.'}</p>
                <button onclick="openAddTaskModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors">
                    Add New Task
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');
}

function createTaskCard(task) {
    const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
    const timeLeft = getTimeLeft(task.deadline);

    return `
        <div class="p-6 hover:bg-dark-bg/50 transition-colors border-b border-dark-border">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <input type="checkbox" 
                           ${task.status === 'completed' ? 'checked' : ''} 
                           onchange="toggleTaskStatus('${task._id}')"
                           class="w-5 h-5 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-dark-bg">
                    <div class="flex-1">
                        <h3 class="font-medium text-white mb-1 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}">${task.title}</h3>
                        ${task.description ? `<p class="text-gray-400 text-sm mb-2">${task.description}</p>` : ''}
                        <div class="flex items-center space-x-4 text-xs">
                            <span class="px-2 py-1 rounded-full ${getPriorityBadgeColor(task.priority)}">
                                ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                            </span>
                            <span class="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                                ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                            </span>
                            <span class="text-gray-400 ${isOverdue ? 'text-red-400' : ''}">
                                <i class="fas fa-clock mr-1"></i>Due: ${formatDeadline(task.deadline)}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <!-- Temporarily disabled Google Calendar sync
                    <button onclick="syncTaskToCalendar('${task._id}')" 
                            class="text-gray-400 hover:text-green-400 p-2 sync-task-btn" 
                            title="Sync to Google Calendar">
                        <i class="fab fa-google"></i>
                    </button>
                    -->
                    <button onclick="editTask('${task._id}')" class="text-gray-400 hover:text-blue-400 p-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTask('${task._id}')" class="text-gray-400 hover:text-red-400 p-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function filterTasks(taskList) {
    switch (currentFilter) {
        case 'pending':
            return taskList.filter(task => task.status === 'pending');
        case 'completed':
            return taskList.filter(task => task.status === 'completed');
        case 'overdue':
            return taskList.filter(task =>
                new Date(task.deadline) < new Date() && task.status !== 'completed'
            );
        case 'today':
            const today = new Date().toDateString();
            return taskList.filter(task =>
                new Date(task.deadline).toDateString() === today
            );
        default:
            return taskList;
    }
}

function sortTasks(taskList) {
    return taskList.sort((a, b) => {
        switch (currentSort) {
            case 'deadline':
                return new Date(a.deadline) - new Date(b.deadline);
            case 'priority':
                const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'title':
                return a.title.localeCompare(b.title);
            case 'created':
                return new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return 0;
        }
    });
}

function setFilter(filter) {
    currentFilter = filter;

    // Update filter button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });

    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
        activeBtn.classList.add('bg-indigo-600', 'text-white');
    }

    displayTasks();
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const container = document.getElementById('tasksContainer');

    if (!searchTerm) {
        displayTasks();
        return;
    }

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.category.toLowerCase().includes(searchTerm) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );

    container.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');
}

function updateTaskStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;

    // Update stats in UI
    const statsElements = {
        'totalTasksCount': totalTasks,
        'completedTasksCount': completedTasks,
        'pendingTasksCount': pendingTasks,
        'inProgressTasksCount': inProgressTasks
    };

    Object.entries(statsElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    if (progressBar && progressPercent) {
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        progressBar.style.width = percentage + '%';
        progressPercent.textContent = percentage + '%';
    }
}

function openAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('taskTitle').focus();
    }
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('addTaskForm').reset();
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    // For now, let's use a simple prompt. In a real app, you'd use a proper modal
    const newTitle = prompt('Edit task title:', task.title);
    if (newTitle && newTitle !== task.title) {
        updateTask(taskId, { title: newTitle });
    }
}

function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showNotification('Tasks exported successfully!', 'success');
}

// Utility functions
function getBorderColor(priority) {
    switch (priority) {
        case 'urgent': return 'border-red-500';
        case 'high': return 'border-orange-500';
        case 'medium': return 'border-yellow-500';
        case 'low': return 'border-green-500';
        default: return 'border-gray-300';
    }
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'urgent': return 'bg-red-500';
        case 'high': return 'bg-orange-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-green-500';
        default: return 'bg-gray-500';
    }
}

function getPriorityBadgeColor(priority) {
    switch (priority) {
        case 'high': return 'bg-red-500/20 text-red-400';
        case 'medium': return 'bg-yellow-500/20 text-yellow-400';
        case 'low': return 'bg-green-500/20 text-green-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
}

function formatDeadline(deadline) {
    const date = new Date(deadline);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

function getTimeLeft(deadline) {
    const now = new Date();
    const due = new Date(deadline);
    const diffMs = due - now;

    if (diffMs < 0) return 'Overdue';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
    return 'Due soon';
}

function showLoading(message = 'Loading...') {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.textContent = message;
        loading.classList.remove('hidden');
    }
}

function hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.classList.add('hidden');
    }
}

// Modal event listeners
document.addEventListener('click', function (e) {
    const modal = document.getElementById('addTaskModal');
    if (e.target === modal) {
        closeAddTaskModal();
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeAddTaskModal();
    }
});

// Google Calendar Integration Functions
async function syncTaskToCalendar(taskId) {
    try {
        // Find the task in the current tasks array
        const task = tasks.find(t => t._id === taskId);
        if (!task) {
            showMessage('Task not found', 'error');
            return;
        }

        // Show loading state
        const syncBtn = document.querySelector(`button[onclick="syncTaskToCalendar('${taskId}')"]`);
        if (syncBtn) {
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            syncBtn.disabled = true;
        }

        // Check if Google Calendar is connected
        const statusResponse = await fetch(`${API_BASE}/calendar/status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (!statusData.connected) {
                showMessage('Please connect Google Calendar first', 'error');
                if (syncBtn) {
                    syncBtn.innerHTML = '<i class="fab fa-google"></i>';
                    syncBtn.disabled = false;
                }
                return;
            }
        }

        // Sync the task
        const response = await fetch(`${API_BASE}/calendar/sync/task/${taskId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ task })
        });

        if (response.ok) {
            showMessage('Task synced to Google Calendar successfully!', 'success');
            // Update button to show synced state
            if (syncBtn) {
                syncBtn.innerHTML = '<i class="fas fa-check"></i>';
                syncBtn.classList.remove('hover:text-green-400');
                syncBtn.classList.add('text-green-400');
                syncBtn.title = 'Synced to Google Calendar';
                setTimeout(() => {
                    syncBtn.innerHTML = '<i class="fab fa-google"></i>';
                    syncBtn.disabled = false;
                }, 2000);
            }
        } else {
            const errorData = await response.json();
            showMessage(errorData.error || 'Failed to sync task to calendar', 'error');
            if (syncBtn) {
                syncBtn.innerHTML = '<i class="fab fa-google"></i>';
                syncBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error syncing task to calendar:', error);
        showMessage('Failed to sync task to calendar', 'error');
        const syncBtn = document.querySelector(`button[onclick="syncTaskToCalendar('${taskId}')"]`);
        if (syncBtn) {
            syncBtn.innerHTML = '<i class="fab fa-google"></i>';
            syncBtn.disabled = false;
        }
    }
}
