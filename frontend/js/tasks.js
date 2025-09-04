// Tasks Management JavaScript
let tasks = [];
let currentFilter = 'all';
let currentSort = 'deadline';

document.addEventListener('DOMContentLoaded', function () {
    console.log('Tasks page loaded');

    // Check authentication and redirect if not logged in
    if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
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
    console.log('Setting up event listeners...');

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

    // Edit task form
    const editTaskForm = document.getElementById('editTaskForm');
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', handleEditTask);
    }

    // Close edit modal button
    const closeEditModal = document.getElementById('closeEditModal');
    if (closeEditModal) {
        closeEditModal.addEventListener('click', closeEditTaskModal);
    }

    // Cancel edit task button
    const cancelEditTask = document.getElementById('cancelEditTask');
    if (cancelEditTask) {
        cancelEditTask.addEventListener('click', closeEditTaskModal);
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

    // Search input with enhanced features
    const searchInput = document.getElementById('searchTasks');
    console.log('Search input element:', searchInput);

    if (searchInput) {
        console.log('Adding search event listeners...');
        searchInput.addEventListener('input', handleSearch);

        // Add keyboard shortcuts
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                // Focus first task result if available
                const firstTask = document.querySelector('.task-card');
                if (firstTask) {
                    firstTask.focus();
                }
            }
        });

        // Add focus/blur events for better UX
        searchInput.addEventListener('focus', () => {
            searchInput.parentElement.classList.add('ring-2', 'ring-indigo-500');
        });

        searchInput.addEventListener('blur', () => {
            searchInput.parentElement.classList.remove('ring-2', 'ring-indigo-500');
        });
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
    console.log('loadTasks called, current tasks array length:', tasks.length);

    try {
        showLoading('Loading tasks...');
        const response = await apiCall('/tasks');
        tasks = response.tasks || [];
        console.log('Loaded from API:', tasks.length, 'tasks');
        displayTasks();
        updateTaskStats();
        hideLoading();
    } catch (error) {
        hideLoading();
        console.log('API failed, loading sample tasks for testing:', error.message);

        // Only load sample tasks if array is empty to avoid duplicates
        if (tasks.length === 0) {
            // Load sample tasks for testing when API is not available
            tasks = [
                {
                    id: 1,
                    title: "Complete CSE327 Assignment",
                    description: "Finish the software requirements specification document",
                    deadline: "2025-09-10T23:59:00",
                    priority: "high",
                    category: "assignment",
                    status: "pending",
                    estimatedTime: 120,
                    tags: ["university", "software engineering", "urgent"]
                },
                {
                    id: 2,
                    title: "Study for Mathematics Exam",
                    description: "Review calculus and linear algebra chapters",
                    deadline: "2025-09-15T09:00:00",
                    priority: "medium",
                    category: "exam",
                    status: "in-progress",
                    estimatedTime: 180,
                    tags: ["mathematics", "exam", "calculus"]
                },
                {
                    id: 3,
                    title: "Research Project Literature Review",
                    description: "Find and review 10 academic papers for the final project",
                    deadline: "2025-09-20T17:00:00",
                    priority: "medium",
                    category: "project",
                    status: "pending",
                    estimatedTime: 240,
                    tags: ["research", "literature", "academic"]
                },
                {
                    id: 4,
                    title: "Programming Lab Exercise",
                    description: "Complete the data structures implementation",
                    deadline: "2025-09-08T15:30:00",
                    priority: "high",
                    category: "assignment",
                    status: "completed",
                    estimatedTime: 90,
                    tags: ["programming", "data structures", "lab"]
                },
                {
                    id: 5,
                    title: "Group Project Meeting",
                    description: "Weekly team meeting to discuss project progress",
                    deadline: "2025-09-05T14:00:00",
                    priority: "low",
                    category: "study",
                    status: "pending",
                    estimatedTime: 60,
                    tags: ["meeting", "teamwork", "discussion"]
                }
            ];
            console.log('Loaded sample tasks:', tasks.length);
        } else {
            console.log('Tasks array already has data, not loading samples');
        }

        displayTasks();
        updateTaskStats();
        showNotification('Using sample data (API unavailable)', 'info');
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
        const index = tasks.findIndex(task => (task._id || task.id) === taskId);
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
        tasks = tasks.filter(task => (task._id || task.id) !== taskId);
        displayTasks();
        updateTaskStats();

        showNotification('Task deleted successfully!', 'success');
    } catch (error) {
        showNotification('Failed to delete task: ' + error.message, 'error');
    }
}

async function toggleTaskStatus(taskId) {
    const task = tasks.find(t => (t._id || t.id) === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    // For demo/sample data, update locally since API isn't available
    if (task.id && !task._id) {
        task.status = newStatus;
        displayTasks();
        updateTaskStats();
        showNotification(`Task ${newStatus}!`, 'success');
        return;
    }

    // For real API data
    await updateTask(taskId, { status: newStatus });
}

function handleFilterChange() {
    displayTasks();
}

// Search functionality
let searchDebounceTimer;

function handleSearch() {
    console.log('handleSearch called');

    // Clear existing timer
    clearTimeout(searchDebounceTimer);

    // Debounce search to avoid too many calls
    searchDebounceTimer = setTimeout(() => {
        console.log('Executing search after debounce');
        displayTasks();
        updateSearchResults();
    }, 300);
}

function updateSearchResults() {
    const searchInput = document.getElementById('searchTasks');
    const filteredTasks = filterTasks(tasks);

    // Update search result counter (you can add this to UI if needed)
    console.log(`Search results: ${filteredTasks.length} task(s) found`);
    console.log('Total tasks in array:', tasks.length);
    console.log('Current search term:', searchInput ? searchInput.value : 'none');

    // Show clear button if search has content
    if (searchInput && searchInput.value.trim()) {
        addClearSearchButton();
    } else {
        removeClearSearchButton();
    }
}

function addClearSearchButton() {
    const searchContainer = document.getElementById('searchTasks').parentElement;
    let clearBtn = searchContainer.querySelector('.clear-search-btn');

    if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.className = 'clear-search-btn absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors';
        clearBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearBtn.onclick = clearSearch;
        searchContainer.appendChild(clearBtn);
    }
}

function removeClearSearchButton() {
    const searchContainer = document.getElementById('searchTasks').parentElement;
    const clearBtn = searchContainer.querySelector('.clear-search-btn');
    if (clearBtn) {
        clearBtn.remove();
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchTasks');
    if (searchInput) {
        searchInput.value = '';
        removeClearSearchButton();
        displayTasks();
    }
}

function filterTasks(tasks) {
    let filtered = [...tasks];
    console.log('Starting filterTasks with', filtered.length, 'tasks');

    // Search filter - Enhanced to search multiple fields
    const searchInput = document.getElementById('searchTasks');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        console.log('Searching for:', searchTerm);

        filtered = filtered.filter(task => {
            // Search in title, description, category, and tags
            const titleMatch = task.title && task.title.toLowerCase().includes(searchTerm);
            const descriptionMatch = task.description && task.description.toLowerCase().includes(searchTerm);
            const categoryMatch = task.category && task.category.toLowerCase().includes(searchTerm);
            const tagsMatch = task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            // Also search in priority and status for more comprehensive results
            const priorityMatch = task.priority && task.priority.toLowerCase().includes(searchTerm);
            const statusMatch = task.status && task.status.toLowerCase().includes(searchTerm);

            const isMatch = titleMatch || descriptionMatch || categoryMatch || tagsMatch || priorityMatch || statusMatch;

            if (isMatch) {
                console.log('Match found:', task.title);
            }

            return isMatch;
        });

        console.log('Filtered results after search:', filtered.length, 'out of', tasks.length);
    }

    // Priority filter
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter && priorityFilter.value) {
        const initialCount = filtered.length;
        filtered = filtered.filter(task => task.priority === priorityFilter.value);
        console.log('Priority filter applied:', priorityFilter.value, '- reduced from', initialCount, 'to', filtered.length);
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter && statusFilter.value) {
        const initialCount = filtered.length;
        filtered = filtered.filter(task => task.status === statusFilter.value);
        console.log('Status filter applied:', statusFilter.value, '- reduced from', initialCount, 'to', filtered.length);
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && categoryFilter.value) {
        const initialCount = filtered.length;
        filtered = filtered.filter(task => task.category === categoryFilter.value);
        console.log('Category filter applied:', categoryFilter.value, '- reduced from', initialCount, 'to', filtered.length);
    }

    console.log('Final filtered result:', filtered.length, 'tasks');
    return filtered;
}

function displayTasks() {
    console.log('displayTasks called');
    const container = document.getElementById('taskList');
    console.log('Task container element:', container);

    if (!container) {
        console.error('taskList container not found!');
        return;
    }

    let filteredTasks = filterTasks(tasks);
    filteredTasks = applyCurrentFilters(filteredTasks);
    filteredTasks = sortTasks(filteredTasks);

    console.log('Filtered tasks:', filteredTasks.length);
    console.log('Tasks to display:', filteredTasks);

    // Check if we're in search mode
    const searchInput = document.getElementById('searchTasks');
    const isSearching = searchInput && searchInput.value.trim();
    const hasFilters = checkActiveFilters();

    if (filteredTasks.length === 0) {
        let message = 'Create your first task to get started!';
        let actionButton = `
            <button onclick="openAddTaskModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors">
                Add New Task
            </button>
        `;

        if (isSearching) {
            message = `No tasks found for "${searchInput.value.trim()}"`;
            actionButton = `
                <button onclick="clearSearch()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors mr-2">
                    Clear Search
                </button>
                <button onclick="openAddTaskModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors">
                    Add New Task
                </button>
            `;
        } else if (hasFilters) {
            message = 'No tasks match your current filters.';
            actionButton = `
                <button onclick="clearAllFilters()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors mr-2">
                    Clear Filters
                </button>
                <button onclick="openAddTaskModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors">
                    Add New Task
                </button>
            `;
        }

        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-gray-400 text-6xl mb-4">📝</div>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">No tasks found</h3>
                <p class="text-gray-400 mb-6">${message}</p>
                ${actionButton}
            </div>
        `;
        return;
    }

    // Show search results summary
    if (isSearching || hasFilters) {
        const totalTasks = tasks.length;
        const resultSummary = `
            <div class="mb-4 p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                <p class="text-indigo-300 text-sm">
                    <i class="fas fa-info-circle mr-2"></i>
                    Showing ${filteredTasks.length} of ${totalTasks} tasks
                    ${isSearching ? `for "${searchInput.value.trim()}"` : ''}
                </p>
            </div>
        `;
        console.log('Updating container with search results and summary');
        container.innerHTML = resultSummary + filteredTasks.map(task => createTaskCard(task)).join('');
    } else {
        console.log('Updating container with all tasks (no search/filter)');
        container.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');
    }

    console.log('Container innerHTML updated, current length:', container.innerHTML.length);
}

function checkActiveFilters() {
    const priorityFilter = document.getElementById('priorityFilter');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    return (priorityFilter && priorityFilter.value) ||
        (statusFilter && statusFilter.value) ||
        (categoryFilter && categoryFilter.value) ||
        currentFilter !== 'all';
}

function clearAllFilters() {
    // Clear dropdown filters
    const priorityFilter = document.getElementById('priorityFilter');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    if (priorityFilter) priorityFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';

    // Reset current filter
    currentFilter = 'all';

    // Update filter buttons appearance
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-dark-card', 'text-gray-300');
    });

    // Refresh display
    displayTasks();
}

function createTaskCard(task) {
    const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
    const timeLeft = getTimeLeft(task.deadline);
    const taskId = task._id || task.id; // Handle both API and sample data

    return `
        <div class="p-6 hover:bg-dark-bg/50 transition-colors border-b border-dark-border">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <input type="checkbox" 
                           ${task.status === 'completed' ? 'checked' : ''} 
                           onchange="toggleTaskStatus('${taskId}')"
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
                    <button onclick="syncTaskToCalendar('${taskId}')" 
                            class="text-gray-400 hover:text-green-400 p-2 sync-task-btn" 
                            title="Sync to Google Calendar">
                        <i class="fab fa-google"></i>
                    </button>
                    -->
                    <button onclick="editTask('${taskId}')" class="text-gray-400 hover:text-blue-400 p-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTask('${taskId}')" class="text-gray-400 hover:text-red-400 p-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function applyCurrentFilters(taskList) {
    // This function handles the current filter buttons (all, pending, completed, overdue, today)
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
            case 'deadline': {
                // Show upcoming (future) tasks first (nearest deadline first).
                // Tasks without deadline go to the end.
                const now = Date.now();
                const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
                const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;

                const aIsFuture = aTime >= now;
                const bIsFuture = bTime >= now;

                if (aIsFuture && !bIsFuture) return -1; // a is upcoming, b is past -> a first
                if (!aIsFuture && bIsFuture) return 1;  // b is upcoming -> b first

                if (aIsFuture && bIsFuture) {
                    // both upcoming -> nearest deadline first
                    return aTime - bTime;
                }

                // both past/overdue -> show most recently overdue first (closest to now)
                return bTime - aTime;
            }
            case 'priority': {
                const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
            }
            case 'title':
                return (a.title || '').localeCompare(b.title || '');
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

    // Populate the edit form with current task data
    document.getElementById('editTaskId').value = task._id;
    document.getElementById('editTaskTitle').value = task.title || '';
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskPriority').value = task.priority || '';
    document.getElementById('editTaskCategory').value = task.category || '';
    document.getElementById('editTaskEstimatedTime').value = task.estimatedTime || 60;

    // Handle tags - convert array to string if needed
    const tagsValue = Array.isArray(task.tags) ? task.tags.join(', ') : task.tags || '';
    document.getElementById('editTaskTags').value = tagsValue;

    // Set the due date in the date picker
    if (task.dueDate && window.editDatePicker) {
        const dueDate = new Date(task.dueDate);
        window.editDatePicker.setDate(dueDate);
    }

    // Show the edit modal
    const modal = document.getElementById('editTaskModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

async function handleEditTask(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const taskId = formData.get('taskId');

    // Validate required fields
    const title = formData.get('title').trim();
    const priority = formData.get('priority');
    const category = formData.get('category');
    const dueDate = formData.get('dueDate');

    if (!title || !priority || !category || !dueDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Prepare update data
    const updateData = {
        title: title,
        description: formData.get('description').trim(),
        priority: priority,
        category: category,
        dueDate: dueDate,
        estimatedTime: parseInt(formData.get('estimatedTime')) || 60
    };

    // Handle tags
    const tagsInput = formData.get('tags').trim();
    if (tagsInput) {
        updateData.tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else {
        updateData.tags = [];
    }

    // Use existing updateTask function
    await updateTask(taskId, updateData);
    closeEditTaskModal();
}

function closeEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('editTaskForm').reset();

        // Clear the date picker
        if (window.editDatePicker) {
            window.editDatePicker.clear();
        }
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
