// Clear localStorage and fix page redirects
console.log('🧹 Clearing localStorage...');

// Clear all auth-related data
localStorage.removeItem('authToken');
localStorage.removeItem('user');

// Clear any other potentially problematic data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('auth') || key.includes('token') || key.includes('user')) {
        keysToRemove.push(key);
    }
}

keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('🗑️ Removed:', key);
});

console.log('✅ localStorage cleared!');
console.log('🔄 Please refresh the page to test the fixed login form.');

// Test function to verify no auto-redirects
window.testNoRedirect = function () {
    console.log('🧪 Testing redirect behavior...');
    console.log('Current page:', window.location.pathname);
    console.log('Is authenticated:', isAuthenticated());
    console.log('Token exists:', !!localStorage.getItem('authToken'));
    console.log('User exists:', !!localStorage.getItem('user'));
};

// Call test function
testNoRedirect();
