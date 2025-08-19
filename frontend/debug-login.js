// Login Debug Script
console.log('🔍 Login Debug Script Loaded');

// Debug login function with detailed logging
async function debugLogin(email, password) {
    console.log('🔐 Attempting login...');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password ? password.length : 'undefined');

    try {
        const loginData = { email, password };
        console.log('📤 Sending login data:', loginData);

        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        const responseText = await response.text();
        console.log('📄 Raw response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
            console.log('📊 Parsed response:', data);
        } catch (e) {
            console.log('❌ JSON parse error:', e);
            throw new Error('Invalid JSON response');
        }

        if (!response.ok) {
            console.log('❌ Login failed:', data.error);
            throw new Error(data.error || 'Login failed');
        }

        console.log('✅ Login successful!');
        return data;

    } catch (error) {
        console.log('💥 Login error:', error);
        throw error;
    }
}

// Test if any users exist in database
async function checkUsersExist() {
    console.log('👥 Checking if users exist in database...');
    try {
        const response = await fetch('http://localhost:3000/api/auth/test-users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('👥 Users in database:', data);
        } else {
            console.log('❓ Cannot check users (endpoint might not exist)');
        }
    } catch (error) {
        console.log('❓ Cannot check users:', error);
    }
}

// Override form submission for login
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎯 Setting up login debug...');

    // Wait a bit to ensure other scripts have loaded
    setTimeout(() => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('🔧 Overriding existing login form handlers...');

            // Remove ALL existing event listeners by cloning the element
            const newLoginForm = loginForm.cloneNode(true);
            loginForm.parentNode.replaceChild(newLoginForm, loginForm);

            // Add our debug login handler
            newLoginForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 Debug login form submitted');

                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;

                console.log('📝 Form values:');
                console.log('Email field value:', email);
                console.log('Password field value:', password ? '[HIDDEN]' : 'EMPTY');

                if (!email || !password) {
                    alert('Please fill in both email and password');
                    return;
                }

                try {
                    const result = await debugLogin(email, password);
                    console.log('✅ Login successful, saving data and redirecting...');

                    // Save authentication data with BOTH keys for compatibility
                    localStorage.setItem('authToken', result.token);  // For auth.js compatibility
                    localStorage.setItem('token', result.token);      // For dashboard.js compatibility
                    localStorage.setItem('user', JSON.stringify(result.user));

                    alert('Login successful! Redirecting to dashboard...');

                    // Force redirect using replace to avoid back button issues
                    window.location.replace('dashboard.html');
                } catch (error) {
                    console.error('❌ Login failed:', error);
                    alert(`Login failed: ${error.message}`);
                }
            });

            console.log('✅ Debug login handler installed successfully');
        } else {
            console.log('❌ Login form not found');
        }
    }, 500); // Wait 500ms for other scripts to initialize

    // Check users on page load
    checkUsersExist();
});

// Test functions for console
window.testLogin = function (email, password) {
    if (!email || !password) {
        console.log('Usage: testLogin("your-email@example.com", "your-password")');
        return;
    }
    debugLogin(email, password);
};

window.quickTestLogin = function () {
    const email = prompt('Enter email:');
    const password = prompt('Enter password:');
    if (email && password) {
        debugLogin(email, password);
    }
};

console.log('🔧 Login debug ready!');
console.log('💡 Use testLogin("email", "password") or quickTestLogin() in console');
