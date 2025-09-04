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
        // Use updateUserDisplay for consistent handling
        updateUserDisplay(user);

        // Update email elements separately
        const userEmailElements = document.querySelectorAll('.user-email');
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

        // If backend returned a token (legacy or immediate-verify flow), keep old behavior
        if (data.token) {
            setToken(data.token);
            if (data.user) setUser(data.user);

            showNotification('Registration successful!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            return;
        }

        // Otherwise, user must verify via OTP. Backend returns a user object with id.
        if (data.user && data.user.id) {
            showNotification('Registration created. Check your email for OTP to verify your account.', 'info');
            // Store a small marker so verify page can read user info if needed
            localStorage.setItem('pendingUser', JSON.stringify({ id: data.user.id, email: data.user.email }));
            // Redirect to OTP verification page with userId
            setTimeout(() => {
                window.location.href = `verify-otp.html?userId=${data.user.id}`;
            }, 1200);
            return;
        }

        // Fallback
        showNotification(data.message || 'Registration successful. Please verify your email.', 'success');

    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Registration error:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on a protected page
    const protectedPages = ['dashboard.html', 'tasks.html', 'schedule.html', 'pomodoro.html', 'analytics.html', 'ai-recommendations.html'];
    const currentPage = window.location.pathname.split('/').pop();

    // Only check authentication for protected pages
    if (protectedPages.includes(currentPage)) {
        if (!requireAuth()) {
            return;
        }
        // Display user info if authenticated
        displayUserInfo();
    }

    // Google Login button handler
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function () {
            try {
                // Get Google OAuth URL from backend
                const res = await fetch('http://localhost:3000/api/calendar/auth-url', {
                    credentials: 'include',
                    headers: { 'Authorization': '' }
                });
                const data = await res.json();
                if (data.authUrl) {
                    window.location.href = data.authUrl;
                } else {
                    showNotification('Failed to get Google login URL', 'error');
                }
            } catch (err) {
                showNotification('Google login error', 'error');
            }
        });
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

// Load user profile and update UI
async function loadUserProfile() {
    try {
        const response = await apiCall('/auth/profile');
        if (response.user) {
            setUser(response.user);
            updateUserDisplay(response.user);
            return response.user;
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
    }
    return null;
}

// Update user display in navigation
function updateUserDisplay(user) {
    if (!user) return;

    console.log('Updating user display for:', user.name); // Debug log

    // Get first name from full name
    const firstName = user.name ? user.name.split(' ')[0] : 'User';

    // Update user name displays
    const userNameElements = document.querySelectorAll('.user-name');
    console.log('Found user-name elements:', userNameElements.length); // Debug log
    userNameElements.forEach(element => {
        element.textContent = firstName;
        console.log('Updated element text to:', firstName); // Debug log
    });

    // Generate avatar using DiceBear API
    const avatarUrl = generateAvatarUrl(user, 'avataaars', 32);
    console.log('Generated avatar URL:', avatarUrl); // Debug log

    // Update profile images with DiceBear avatars
    const profileImages = document.querySelectorAll('.profile-image');
    console.log('Found profile-image elements:', profileImages.length); // Debug log
    profileImages.forEach(img => {
        if (img.tagName === 'IMG') {
            img.src = avatarUrl;
            img.alt = user.name || 'User';
            img.onerror = function () {
                // Fallback to initials if DiceBear fails
                this.src = `https://via.placeholder.com/32x32/6366f1/ffffff?text=${getUserInitials(user)}`;
            };
            console.log('Updated image src to:', avatarUrl); // Debug log
        }
    });

    // Update any elements with user initials (as fallback)
    const userInitials = getUserInitials(user);
    const initialElements = document.querySelectorAll('.user-initials');
    initialElements.forEach(element => {
        element.textContent = userInitials;
    });
}

// Helper function to get user initials
function getUserInitials(user) {
    if (!user || !user.name) return 'U';
    return user.name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2); // Limit to 2 characters
}

// Generate avatar URL using DiceBear API
function generateAvatarUrl(user, style = 'avataaars', size = 32) {
    if (!user) return `https://via.placeholder.com/${size}x${size}/6366f1/ffffff?text=U`;

    const seed = user.email || user.name || 'default';
    const availableStyles = [
        'avataaars',     // Cartoon-style avatars
        'personas',      // Professional looking avatars  
        'initials',      // Just initials
        'identicon',     // Geometric patterns
        'bottts',        // Robot avatars
        'shapes'         // Abstract shapes
    ];

    // Ensure the style is valid
    const avatarStyle = availableStyles.includes(style) ? style : 'avataaars';

    // Additional customization options
    const options = {
        seed: encodeURIComponent(seed),
        backgroundColor: '6366f1',
        radius: '50',
        size: size
    };

    // Build query string
    const queryString = Object.entries(options)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    return `https://api.dicebear.com/7.x/${avatarStyle}/svg?${queryString}`;
}

// Function to change avatar style (can be called from UI)
function changeAvatarStyle(style) {
    const user = getUser();
    if (!user) return;

    const avatarUrl = generateAvatarUrl(user, style);
    const profileImages = document.querySelectorAll('.profile-image');

    profileImages.forEach(img => {
        if (img.tagName === 'IMG') {
            img.src = avatarUrl;
            img.onerror = function () {
                // Fallback to initials if DiceBear fails
                this.src = `https://via.placeholder.com/32x32/6366f1/ffffff?text=${getUserInitials(user)}`;
            };
        }
    });
}
