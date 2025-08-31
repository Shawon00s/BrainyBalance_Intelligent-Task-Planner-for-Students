document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const userIdInput = document.getElementById('userId');
    const verifyForm = document.getElementById('verifyForm');
    const otpInput = document.getElementById('otp');
    const resendBtn = document.getElementById('resendBtn');
    const messageEl = document.getElementById('message');

    if (userId && userIdInput) userIdInput.value = userId;

    // Load pending user info if available
    const pendingUser = localStorage.getItem('pendingUser');
    if (pendingUser) {
        const user = JSON.parse(pendingUser);
        if (user.email) {
            const emailDisplay = document.createElement('p');
            emailDisplay.className = 'text-gray-400 text-sm text-center mb-4';
            emailDisplay.innerHTML = `<i class="fas fa-envelope mr-1"></i>Code sent to: ${user.email}`;
            verifyForm.insertBefore(emailDisplay, verifyForm.firstChild);
        }
    }

    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageEl.textContent = '';
        messageEl.className = 'text-sm text-center text-red-400';

        const otp = otpInput.value.trim();
        const uid = userIdInput.value;

        if (!otp || !uid) {
            messageEl.textContent = 'Missing OTP or user information.';
            return;
        }

        if (otp.length !== 6) {
            messageEl.textContent = 'Please enter a 6-digit verification code.';
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, otp })
            });
            const data = await res.json();

            if (res.ok) {
                // Store token and clean up pending user
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('token', data.token);
                }
                localStorage.removeItem('pendingUser');

                messageEl.className = 'text-sm text-center text-green-400';
                messageEl.textContent = 'Email verified successfully! Redirecting...';

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                messageEl.textContent = data.error || 'Verification failed';
            }
        } catch (err) {
            console.error('verify error', err);
            messageEl.textContent = 'Server error. Please try again.';
        }
    });

    resendBtn.addEventListener('click', async () => {
        messageEl.textContent = '';
        messageEl.className = 'text-sm text-center text-blue-400';

        const uid = userIdInput.value;
        if (!uid) {
            messageEl.className = 'text-sm text-center text-red-400';
            messageEl.textContent = 'User ID missing.';
            return;
        }

        try {
            resendBtn.disabled = true;
            resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Sending...';

            const res = await fetch('http://localhost:3000/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid })
            });
            const data = await res.json();

            if (res.ok) {
                messageEl.className = 'text-sm text-center text-green-400';
                messageEl.textContent = 'New verification code sent. Check your email.';
            } else {
                messageEl.className = 'text-sm text-center text-red-400';
                messageEl.textContent = data.error || 'Failed to resend verification code';
            }
        } catch (err) {
            console.error('resend error', err);
            messageEl.className = 'text-sm text-center text-red-400';
            messageEl.textContent = 'Server error. Please try again.';
        } finally {
            resendBtn.disabled = false;
            resendBtn.innerHTML = '<i class="fas fa-redo mr-1"></i>Resend Code';
        }
    });
});
