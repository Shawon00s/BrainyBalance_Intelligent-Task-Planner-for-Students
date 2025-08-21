// Profile Management JavaScript

document.addEventListener('DOMContentLoaded', function () {
    setupProfileEventListeners();
});

function setupProfileEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }

    // Profile picture upload
    const profilePicture = document.getElementById('profilePicture');
    if (profilePicture) {
        profilePicture.addEventListener('change', handleProfilePictureUpload);
    }
}

async function loadUserProfile() {
    try {
        showLoading('Loading profile...');

        const user = getUser();
        if (user) {
            // Populate form with user data
            populateProfileForm(user);
        }

        // Load additional profile data from API
        const response = await apiCall('/auth/profile');
        if (response.user) {
            populateProfileForm(response.user);
            updateAccountStats(response.stats);
        }

        hideLoading();
    } catch (error) {
        console.error('Failed to load profile:', error);
        hideLoading();
        showNotification('Failed to load profile data', 'error');
    }
}

function populateProfileForm(user) {
    // Basic info
    if (user.name) {
        const nameParts = user.name.split(' ');
        const firstNameField = document.getElementById('firstName');
        const lastNameField = document.getElementById('lastName');

        if (firstNameField) firstNameField.value = nameParts[0] || '';
        if (lastNameField) lastNameField.value = nameParts.slice(1).join(' ') || '';
    }

    const emailField = document.getElementById('email');
    if (emailField && user.email) {
        emailField.value = user.email;
    }

    // Academic info
    const universityField = document.getElementById('university');
    if (universityField && user.university) {
        universityField.value = user.university;
    }

    const majorField = document.getElementById('major');
    if (majorField && user.major) {
        majorField.value = user.major;
    }

    const yearField = document.getElementById('yearOfStudy');
    if (yearField && user.yearOfStudy) {
        yearField.value = user.yearOfStudy;
    }

    const bioField = document.getElementById('bio');
    if (bioField && user.bio) {
        bioField.value = user.bio;
    }

    // Update display name in navbar
    updateDisplayName(user.name || 'Student');
}

function updateDisplayName(name) {
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = name;
    });
}

function updateAccountStats(stats) {
    if (!stats) return;

    const memberSinceElement = document.getElementById('memberSince');
    const tasksCompletedElement = document.getElementById('tasksCompleted');
    const studySessionsElement = document.getElementById('studySessions');
    const totalStudyTimeElement = document.getElementById('totalStudyTime');

    if (memberSinceElement && stats.memberSince) {
        memberSinceElement.textContent = new Date(stats.memberSince).toLocaleDateString();
    }

    if (tasksCompletedElement && stats.tasksCompleted !== undefined) {
        tasksCompletedElement.textContent = stats.tasksCompleted;
    }

    if (studySessionsElement && stats.studySessions !== undefined) {
        studySessionsElement.textContent = stats.studySessions;
    }

    if (totalStudyTimeElement && stats.totalStudyTime !== undefined) {
        const hours = Math.round(stats.totalStudyTime / 60);
        totalStudyTimeElement.textContent = `${hours} hours`;
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        university: formData.get('university'),
        major: formData.get('major'),
        yearOfStudy: formData.get('yearOfStudy'),
        bio: formData.get('bio')
    };

    // Combine first and last name
    profileData.name = `${profileData.firstName} ${profileData.lastName}`.trim();

    try {
        showLoading('Updating profile...');

        const response = await apiCall('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        // Update local user data
        setUser(response.user);

        // Update display name
        updateDisplayName(response.user.name);

        hideLoading();
        showNotification('Profile updated successfully!', 'success');

    } catch (error) {
        hideLoading();
        showNotification('Failed to update profile: ' + error.message, 'error');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('New password must be at least 6 characters', 'error');
        return;
    }

    try {
        showLoading('Changing password...');

        await apiCall('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        // Clear form
        e.target.reset();

        hideLoading();
        showNotification('Password changed successfully!', 'success');

    } catch (error) {
        hideLoading();
        showNotification('Failed to change password: ' + error.message, 'error');
    }
}

async function handleProfilePictureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image file too large. Please select a file under 5MB', 'error');
        return;
    }

    try {
        showLoading('Uploading profile picture...');

        const formData = new FormData();
        formData.append('profilePicture', file);

        const response = await fetch(`${API_BASE_URL}/auth/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload profile picture');
        }

        const data = await response.json();

        // Update profile picture display
        updateProfilePicture(data.profilePictureUrl);

        hideLoading();
        showNotification('Profile picture updated successfully!', 'success');

    } catch (error) {
        hideLoading();
        showNotification('Failed to upload profile picture: ' + error.message, 'error');
    }
}

function updateProfilePicture(imageUrl) {
    // Update all profile images on the page
    const profileImages = document.querySelectorAll('img[alt="Profile"]');
    profileImages.forEach(img => {
        img.src = imageUrl;
    });
}

// Quick Actions
async function exportUserData() {
    try {
        showLoading('Exporting user data...');

        const response = await apiCall('/auth/export-data');

        // Create and download file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `brainybalance_data_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);

        hideLoading();
        showNotification('User data exported successfully!', 'success');

    } catch (error) {
        hideLoading();
        showNotification('Failed to export data: ' + error.message, 'error');
    }
}

function clearCache() {
    try {
        // Clear localStorage except for auth tokens
        const token = getToken();
        const user = getUser();

        localStorage.clear();

        // Restore auth data
        if (token) setToken(token);
        if (user) setUser(user);

        // Clear any other caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }

        showNotification('Cache cleared successfully!', 'success');

    } catch (error) {
        showNotification('Failed to clear cache: ' + error.message, 'error');
    }
}

function deleteAccount() {
    const confirmed = confirm(
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.'
    );

    if (!confirmed) return;

    const doubleConfirm = prompt(
        'Type "DELETE" to confirm account deletion:'
    );

    if (doubleConfirm !== 'DELETE') {
        showNotification('Account deletion cancelled', 'info');
        return;
    }

    deleteAccountConfirmed();
}

async function deleteAccountConfirmed() {
    try {
        showLoading('Deleting account...');

        await apiCall('/auth/delete-account', {
            method: 'DELETE'
        });

        // Clear all local data
        localStorage.clear();

        hideLoading();
        showNotification('Account deleted successfully. You will be redirected to the login page.', 'success');

        // Redirect to login after delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);

    } catch (error) {
        hideLoading();
        showNotification('Failed to delete account: ' + error.message, 'error');
    }
}

// Utility functions
function showLoading(message = 'Loading...') {
    // You can implement a loading indicator here
    console.log(message);
}

function hideLoading() {
    // Hide loading indicator
    console.log('Loading complete');
}
