// Tasks Management JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    if (!localStorage.getItem('userLoggedIn')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize tasks page
    initializeTasksPage();
    setupEventListeners();
    loadTasks();
    updateTaskStats();
});

function initializeTasksPage() {
    // Create default tasks if none exist
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    if (tasks.length === 0) {
        createDefaultTasks();
    }
}

function createDefaultTasks() {
    const defaultTasks = [
        {
            id: '1',
            title: 'Mathematics Assignment - Calculus Chapter 5',
            description: 'Complete problems 1-20 from the textbook and submit solutions',
            priority: 'high',
            category: 'assignment',
            status: 'pending',
            dueDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Physics Study Session',
            description: 'Review quantum mechanics concepts for upcoming midterm',
            priority: 'medium',
            category: 'study',
            status: 'pending',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString()
        },
        {
            id: '3',
            title: 'Chemistry Lab Report',
            description: 'Complete analysis of organic compound synthesis experiment',
            priority: 'high',
            category: 'assignment',
            status: 'completed',
            dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            id: '4',
            title: 'CS Project - Final Implementation',
            description: 'Complete the web application frontend and integrate with backend API',
            priority: 'medium',
            category: 'project',
            status: 'in-progress',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    localStorage.setItem('tasks', JSON.stringify(defaultTasks));
}

function setupEventListeners() {
    // Add task button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', openAddTaskModal);
    }

    // Modal controls
    const closeModal = document.getElementById('closeModal');
    const cancelTask = document.getElementById('cancelTask');
    const addTaskModal = document.getElementById('addTaskModal');

    if (closeModal) closeModal.addEventListener('click', closeAddTaskModal);
    if (cancelTask) cancelTask.addEventListener('click', closeAddTaskModal);
    if (addTaskModal) {
        addTaskModal.addEventListener('click', (e) => {
            if (e.target === addTaskModal) closeAddTaskModal();
        });
    }

    // Add task form
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', handleAddTask);
    }

    // Search and filters
    const searchTasks = document.getElementById('searchTasks');
    const priorityFilter = document.getElementById('priorityFilter');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchTasks) searchTasks.addEventListener('input', applyFilters);
    if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
}

function openAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Set default due date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const defaultDate = tomorrow.toISOString().slice(0, 16);
        const dueDateInput = modal.querySelector('input[name="dueDate"]');
        if (dueDateInput) {
            dueDateInput.value = defaultDate;
        }
    }
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.classList.add('hidden');
        // Reset form
        const form = document.getElementById('addTaskForm');
        if (form) form.reset();
    }
}

function handleAddTask(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const taskData = {
        id: Date.now().toString(),
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        priority: formData.get('priority'),
        category: formData.get('category'),
        dueDate: formData.get('dueDate'),
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    // Validation
    if (!taskData.title) {
        showNotification('Please enter a task title', 'error');
        return;
    }

    if (!taskData.priority) {
        showNotification('Please select a priority level', 'error');
        return;
    }

    if (!taskData.category) {
        showNotification('Please select a category', 'error');
        return;
    }

    if (!taskData.dueDate) {
        showNotification('Please set a due date', 'error');
        return;
    }

    // Save task
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.push(taskData);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Update UI
    loadTasks();
    updateTaskStats();
    closeAddTaskModal();

    showNotification('Task added successfully!', 'success');
}

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskList = document.getElementById('taskList');

    if (!taskList) return;

    taskList.innerHTML = tasks.map(task => createTaskHTML(task)).join('');

    // Add event listeners to task items
    attachTaskEventListeners();
}

function createTaskHTML(task) {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
    const dueDate = new Date(task.dueDate);
    const formattedDate = formatDueDate(dueDate);

    const priorityColors = {
        high: 'red',
        medium: 'yellow',
        low: 'green'
    };

    const categoryColors = {
        assignment: 'blue',
        exam: 'red',
        project: 'green',
        study: 'purple'
    };

    const statusColors = {
        pending: 'yellow',
        'in-progress': 'orange',
        completed: 'green'
    };

    return `
        <div class="p-6 hover:bg-dark-bg/50 transition-colors ${task.status === 'completed' ? 'opacity-50' : ''}" data-task-id="${task.id}">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                        class="task-checkbox w-5 h-5 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-dark-bg">
                    <div class="flex-1">
                        <h3 class="font-medium text-white mb-1 ${task.status === 'completed' ? 'line-through' : ''}">${task.title}</h3>
                        <p class="text-gray-400 text-sm mb-2">${task.description}</p>
                        <div class="flex items-center space-x-4 text-xs">
                            <span class="bg-${priorityColors[task.priority]}-500/20 text-${priorityColors[task.priority]}-400 px-2 py-1 rounded-full">
                                ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                            </span>
                            <span class="bg-${categoryColors[task.category]}-500/20 text-${categoryColors[task.category]}-400 px-2 py-1 rounded-full">
                                ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                            </span>
                            ${task.status === 'completed'
            ? `<span class="text-gray-400"><i class="fas fa-check mr-1"></i>Completed ${getTimeAgo(new Date(task.completedAt || task.dueDate))}</span>`
            : `<span class="text-gray-400 ${isOverdue ? 'text-red-400' : ''}">
                                    <i class="fas fa-clock mr-1"></i>Due: ${formattedDate}
                                   </span>`
        }
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="edit-task text-gray-400 hover:text-blue-400 p-2" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-task text-gray-400 hover:text-red-400 p-2" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="task-menu text-gray-400 hover:text-indigo-400 p-2" title="More Options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function attachTaskEventListeners() {
    // Checkbox change events
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleTaskStatusChange);
    });

    // Edit buttons
    document.querySelectorAll('.edit-task').forEach(button => {
        button.addEventListener('click', handleEditTask);
    });

    // Delete buttons
    document.querySelectorAll('.delete-task').forEach(button => {
        button.addEventListener('click', handleDeleteTask);
    });
}

function handleTaskStatusChange(e) {
    const taskId = e.target.closest('[data-task-id]').dataset.taskId;
    const isCompleted = e.target.checked;

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].status = isCompleted ? 'completed' : 'pending';
        if (isCompleted) {
            tasks[taskIndex].completedAt = new Date().toISOString();
        } else {
            delete tasks[taskIndex].completedAt;
        }

        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTasks();
        updateTaskStats();

        const message = isCompleted ? 'Task completed!' : 'Task marked as pending';
        showNotification(message, isCompleted ? 'success' : 'info');
    }
}

function handleEditTask(e) {
    const taskId = e.target.closest('[data-task-id]').dataset.taskId;
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === taskId);

    if (task) {
        // Pre-fill the modal with task data
        openAddTaskModal();
        const modal = document.getElementById('addTaskModal');
        const form = document.getElementById('addTaskForm');

        // Update modal title
        modal.querySelector('h2').textContent = 'Edit Task';

        // Fill form fields
        form.querySelector('[name="title"]').value = task.title;
        form.querySelector('[name="description"]').value = task.description || '';
        form.querySelector('[name="priority"]').value = task.priority;
        form.querySelector('[name="category"]').value = task.category;
        form.querySelector('[name="dueDate"]').value = task.dueDate.slice(0, 16);

        // Change submit behavior
        form.setAttribute('data-edit-id', taskId);
    }
}

function handleDeleteTask(e) {
    const taskId = e.target.closest('[data-task-id]').dataset.taskId;

    if (confirm('Are you sure you want to delete this task?')) {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const filteredTasks = tasks.filter(task => task.id !== taskId);

        localStorage.setItem('tasks', JSON.stringify(filteredTasks));
        loadTasks();
        updateTaskStats();

        showNotification('Task deleted successfully', 'success');
    }
}

function updateTaskStats() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;

    // Update stat cards
    const statCards = document.querySelectorAll('.bg-gradient-card');

    statCards.forEach(card => {
        const label = card.querySelector('.text-gray-400').textContent;
        const valueElement = card.querySelector('.text-2xl');

        switch (label) {
            case 'Total Tasks':
                valueElement.textContent = totalTasks;
                break;
            case 'Pending':
                valueElement.textContent = pendingTasks;
                break;
            case 'In Progress':
                valueElement.textContent = inProgressTasks;
                break;
            case 'Completed':
                valueElement.textContent = completedTasks;
                break;
        }
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchTasks')?.value.toLowerCase() || '';
    const priorityFilter = document.getElementById('priorityFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm);
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesCategory = !categoryFilter || task.category === categoryFilter;

        return matchesSearch && matchesPriority && matchesStatus && matchesCategory;
    });

    // Update task list
    const taskList = document.getElementById('taskList');
    if (taskList) {
        taskList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');
        attachTaskEventListeners();
    }
}

function formatDueDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (taskDate.getTime() === today.getTime()) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (taskDate.getTime() === tomorrow.getTime()) {
        return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

// Utility function to show notifications
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-6 py-4 rounded-lg shadow-lg transform translate-x-full transition-transform z-50 ${getNotificationClass(type)}`;

    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${getNotificationIcon(type)} text-xl"></i>
            <div class="font-medium">${message}</div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationClass(type) {
    switch (type) {
        case 'success':
            return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
        case 'error':
            return 'bg-gradient-to-r from-red-500 to-pink-600 text-white';
        case 'info':
            return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
        default:
            return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'info':
            return 'fa-info-circle';
        default:
            return 'fa-bell';
    }
}
