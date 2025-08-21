// Authentication JavaScript
const API_BASE_URL = 'http://localhost:3000/api';

// Utility function to get token from localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Utility function to set token in localStorage
function setToken(token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token); // For dashboard.js compatibility
}

// Utility function to remove token from localStorage
function removeToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token'); // Remove both keys
    localStorage.removeItem('user');
}

// Utility function to get user from localStorage
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Utility function to set user in localStorage
function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// API call function with authentication
async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Check if user is authenticated
function isAuthenticated() {
    const token = getToken();
    const user = getUser();

    // Basic check - both token and user must exist
    if (!token || !user) {
        return false;
    }

    // Additional check - token should not be expired (basic validation)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        if (payload.exp && payload.exp < now) {
            // Token is expired
            removeToken();
            return false;
        }
    } catch (error) {
        // Invalid token format
        removeToken();
        return false;
    }

    return true;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        console.log('Authentication required, redirecting to login...');
        // Add a small delay to prevent immediate redirects
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 100);
        return false;
    }
    return true;
}

// Logout function
function logout() {
    removeToken();
    window.location.href = 'login.html';
}

// Display user info in navigation
function displayUserInfo() {
    const user = getUser();
    if (user) {
        const userNameElements = document.querySelectorAll('.user-name');
        const userEmailElements = document.querySelectorAll('.user-email');

        userNameElements.forEach(el => el.textContent = user.name);
        userEmailElements.forEach(el => el.textContent = user.email);
    }
}

// Login function
async function loginUser(email, password) {
    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        setToken(data.token);
        setUser(data.user);

        showNotification('Login successful!', 'success');

        // Only redirect on successful login
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Login error:', error);
    }
}

// Register function
async function registerUser(userData) {
    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        setToken(data.token);
        setUser(data.user);

        showNotification('Registration successful!', 'success');

        // Only redirect on successful registration
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Registration error:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on a protected page
    const protectedPages = ['dashboard.html', 'tasks.html', 'schedule.html', 'pomodoro.html', 'analytics.html'];
    const currentPage = window.location.pathname.split('/').pop();

    // Only check authentication for protected pages
    if (protectedPages.includes(currentPage)) {
        if (!requireAuth()) {
            return;
        }
        // Display user info if authenticated
        displayUserInfo();
    }

    // REMOVED: Automatic redirect from login page
    // This was causing the unwanted page changes

    // Clear any invalid tokens on login page
    if (currentPage === 'login.html') {
        // Check if current auth is valid, if not, clear it
        if (!isAuthenticated()) {
            removeToken(); // Clean up any invalid tokens
        }
    }

    // Tab switching
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginTab && registerTab && loginForm && registerForm) {
        loginTab.addEventListener('click', function () {
            loginTab.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
            loginTab.classList.remove('text-gray-400');
            registerTab.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
            registerTab.classList.add('text-gray-400');

            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        });

        registerTab.addEventListener('click', function () {
            registerTab.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
            registerTab.classList.remove('text-gray-400');
            loginTab.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
            loginTab.classList.add('text-gray-400');

            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });
    }

    // Password visibility toggle
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPassword = document.getElementById('loginPassword');

    if (toggleLoginPassword && loginPassword) {
        toggleLoginPassword.addEventListener('click', function () {
            const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassword.setAttribute('type', type);

            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
    const registerPassword = document.getElementById('registerPassword');

    if (toggleRegisterPassword && registerPassword) {
        toggleRegisterPassword.addEventListener('click', function () {
            const type = registerPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            registerPassword.setAttribute('type', type);

            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Form submission handlers
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            // Basic validation
            if (!email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            showNotification('Logging in...', 'info');
            await loginUser(email, password);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;

            // Validation
            if (!firstName || !lastName || !email || !password || !confirmPassword) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }

            if (password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }

            if (!terms) {
                showNotification('Please agree to the terms and conditions', 'error');
                return;
            }

            showNotification('Creating account...', 'info');

            await registerUser({
                name: `${firstName} ${lastName}`,
                email,
                password
            });
        });
    }

    // Logout button handler
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
});

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${getNotificationClass(type)}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${getNotificationIcon(type)}</span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function getNotificationClass(type) {
    switch (type) {
        case 'success':
            return 'bg-green-500 text-white';
        case 'error':
            return 'bg-red-500 text-white';
        case 'warning':
            return 'bg-yellow-500 text-white';
        default:
            return 'bg-blue-500 text-white';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return '✓';
        case 'error':
            return '✗';
        case 'warning':
            return '⚠';
        default:
            return 'ℹ';
    }
}
