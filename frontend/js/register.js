const API_BASE = 'http://localhost:3000/api';
let registrationEmail = '';

function showStep(stepNumber) {
    document.querySelectorAll('.auth-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    document.querySelectorAll('.step-item').forEach((item, index) => {
        item.classList.remove('active', 'completed');
        if (index + 1 === stepNumber) {
            item.classList.add('active');
        } else if (index + 1 < stepNumber) {
            item.classList.add('completed');
        }
    });
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideError(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

function setButtonLoading(btnId, textId, loaderId, loading) {
    const btn = document.getElementById(btnId);
    const text = document.getElementById(textId);
    const loader = document.getElementById(loaderId);
    
    btn.disabled = loading;
    text.style.display = loading ? 'none' : 'inline';
    loader.style.display = loading ? 'inline-block' : 'none';
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('registerError');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showError('registerError', 'Passwords do not match');
        return;
    }
    
    if (password.length < 8) {
        showError('registerError', 'Password must be at least 8 characters');
        return;
    }
    
    setButtonLoading('registerBtn', 'registerBtnText', 'registerBtnLoader', true);
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        registrationEmail = email;
        document.getElementById('userEmail').textContent = email;
        showStep(2);
    } catch (error) {
        showError('registerError', error.message);
    } finally {
        setButtonLoading('registerBtn', 'registerBtnText', 'registerBtnLoader', false);
    }
});

const codeInputs = document.querySelectorAll('.code-input');
codeInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < codeInputs.length - 1) {
            codeInputs[index + 1].focus();
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            codeInputs[index - 1].focus();
        }
    });
});

document.getElementById('verifyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('verifyError');
    
    const code = Array.from(codeInputs).map(input => input.value).join('');
    
    if (code.length !== 6) {
        showError('verifyError', 'Please enter the complete 6-digit code');
        return;
    }
    
    setButtonLoading('verifyBtn', 'verifyBtnText', 'verifyBtnLoader', true);
    
    try {
        const response = await fetch(`${API_BASE}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registrationEmail, code })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
        }
        
        document.getElementById('telegramChannelLink').href = data.telegramChannelLink;
        showStep(3);
    } catch (error) {
        showError('verifyError', error.message);
    } finally {
        setButtonLoading('verifyBtn', 'verifyBtnText', 'verifyBtnLoader', false);
    }
});

document.getElementById('telegramForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('telegramError');
    
    const telegramId = document.getElementById('telegramId').value;
    
    if (!telegramId || isNaN(telegramId)) {
        showError('telegramError', 'Please enter a valid Telegram User ID');
        return;
    }
    
    setButtonLoading('linkTelegramBtn', 'linkTelegramBtnText', 'linkTelegramBtnLoader', true);
    
    try {
        const response = await fetch(`${API_BASE}/auth/link-telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registrationEmail, telegramId })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to link Telegram');
        }
        
        localStorage.setItem('session_token', data.token);
        showStep(4);
    } catch (error) {
        showError('telegramError', error.message);
    } finally {
        setButtonLoading('linkTelegramBtn', 'linkTelegramBtnText', 'linkTelegramBtnLoader', false);
    }
});

document.getElementById('resendCode')?.addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: registrationEmail, 
                password: 'resend-placeholder'
            })
        });
        
        alert('Verification code resent to your email');
    } catch (error) {
        console.error('Resend error:', error);
    }
});
