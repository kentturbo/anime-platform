const API_BASE = 'http://localhost:3000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('session_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = 'login.html';
            return null;
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        window.location.href = 'login.html';
        return null;
    }
}

async function loadSubscriptionStatus() {
    try {
        const response = await fetch(`${API_BASE}/subscription/status`, {
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to load subscription:', error);
        return { active: false };
    }
}

async function loadFiles() {
    try {
        const response = await fetch(`${API_BASE}/files/list`, {
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to load files');
        }

        const data = await response.json();
        return data.files;
    } catch (error) {
        console.error('Failed to load files:', error);
        return [];
    }
}

function renderFiles(files) {
    const grid = document.getElementById('filesGrid');
    grid.innerHTML = '';

    if (files.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <p>No content available yet</p>
            </div>
        `;
        return;
    }

    files.forEach(item => {
        if (item.type === 'folder') {
            const folderEl = document.createElement('div');
            folderEl.className = 'folder-card glass';
            folderEl.innerHTML = `
                <div class="folder-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <div class="folder-name">${item.name}</div>
                <div class="file-size">${item.children?.length || 0} episodes</div>
            `;
            folderEl.addEventListener('click', () => {
                if (item.children) {
                    renderFiles(item.children);
                }
            });
            grid.appendChild(folderEl);
        } else if (item.type === 'file') {
            const fileEl = document.createElement('div');
            fileEl.className = 'file-card';
            fileEl.innerHTML = `
                <div class="file-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                </div>
                <div class="file-name">${item.name}</div>
                <div class="file-size">${item.size}</div>
                <div class="file-actions">
                    <button class="btn-icon play-btn" data-url="${item.url}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </button>
                    <button class="btn-icon download-btn" data-url="${item.url}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                </div>
            `;
            grid.appendChild(fileEl);
        }
    });

    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            openVideoPlayer(url);
        });
    });

    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            window.open(url, '_blank');
        });
    });
}

function openVideoPlayer(url) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    player.src = url;
    modal.style.display = 'flex';
}

function closeVideoPlayer() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    player.pause();
    player.src = '';
    modal.style.display = 'none';
}

document.getElementById('modalClose')?.addEventListener('click', closeVideoPlayer);
document.getElementById('modalOverlay')?.addEventListener('click', closeVideoPlayer);

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('session_token');
        window.location.href = 'login.html';
    }
});

document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.file-card, .folder-card').forEach(card => {
        const name = card.querySelector('.file-name, .folder-name').textContent.toLowerCase();
        card.style.display = name.includes(query) ? 'block' : 'none';
    });
});

(async function init() {
    const user = await checkAuth();
    if (!user) return;

    document.getElementById('userEmail').textContent = user.email;

    const subscription = await loadSubscriptionStatus();

    if (!subscription.active) {
        document.getElementById('noSubscriptionView').style.display = 'flex';
        document.getElementById('contentView').style.display = 'none';
    } else {
        document.getElementById('noSubscriptionView').style.display = 'none';
        document.getElementById('contentView').style.display = 'block';

        if (subscription.expiresAt) {
            const date = new Date(subscription.expiresAt);
            document.getElementById('expiresDate').textContent = date.toLocaleDateString();
        }

        const files = await loadFiles();
        renderFiles(files);
    }
})();
