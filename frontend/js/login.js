const API_BASE = 'http://localhost:3000/api';

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

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('loginError');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    setButtonLoading('loginBtn', 'loginBtnText', 'loginBtnLoader', true);
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (data.requiresTelegram) {
                showError('loginError', data.error + '. Please complete registration first.');
                setTimeout(() => {
                    window.location.href = 'register.html';
                }, 2000);
                return;
            }
            throw new Error(data.error || 'Login failed');
        }
        
        localStorage.setItem('session_token', data.token);
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        setButtonLoading('loginBtn', 'loginBtnText', 'loginBtnLoader', false);
    }
});
