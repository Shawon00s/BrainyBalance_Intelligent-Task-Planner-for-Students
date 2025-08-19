// Debug version of auth functions for troubleshooting
console.log('🔧 Debug auth script loaded');

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';
console.log('🌐 API_BASE_URL:', API_BASE_URL);

// Test function to check backend connectivity
async function testBackendConnection() {
    console.log('🔍 Testing backend connection...');

    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend connected:', data);
            return true;
        } else {
            console.log('❌ Backend responded with error:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Backend connection failed:', error);
        return false;
    }
}

// Enhanced API call function with detailed logging
async function debugApiCall(endpoint, options = {}) {
    console.log('🚀 Making API call to:', endpoint);
    console.log('📤 Options:', options);

    const token = localStorage.getItem('authToken');
    console.log('🔑 Token present:', !!token);

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

    console.log('📋 Final options:', finalOptions);
    console.log('🌐 Full URL:', `${API_BASE_URL}${endpoint}`);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);
        console.log('📡 Response received:', response.status, response.statusText);

        const text = await response.text();
        console.log('📄 Response text:', text);

        let data;
        try {
            data = JSON.parse(text);
            console.log('📊 Parsed data:', data);
        } catch (parseError) {
            console.log('❌ JSON parse error:', parseError);
            throw new Error('Invalid JSON response from server');
        }

        if (!response.ok) {
            console.log('❌ Response not ok:', data);
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        console.log('✅ API call successful:', data);
        return data;
    } catch (error) {
        console.log('💥 API call error:', error);
        throw error;
    }
}

// Enhanced register function with detailed logging
async function debugRegisterUser(userData) {
    console.log('👤 Registering user:', userData);

    try {
        // First test backend connection
        const backendOk = await testBackendConnection();
        if (!backendOk) {
            throw new Error('Cannot connect to backend server. Make sure it\'s running on port 3000.');
        }

        const data = await debugApiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        console.log('✅ Registration successful!');
        alert('Registration successful! Redirecting to dashboard...');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.log('💥 Registration failed:', error);
        alert(`Registration failed: ${error.message}`);
    }
}

// Test registration function
window.testRegistration = function () {
    const testUser = {
        name: 'Test User',
        email: 'test' + Date.now() + '@example.com',
        password: 'password123'
    };

    console.log('🧪 Testing registration with:', testUser);
    debugRegisterUser(testUser);
};

// Test backend connection on load
window.addEventListener('load', function () {
    console.log('🔄 Page loaded, testing backend...');
    testBackendConnection();
});

console.log('🔧 Debug script ready. Use testRegistration() in console to test.');
