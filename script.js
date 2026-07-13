// ============================================
// CONFIGURATION
// ============================================
const API_BASE = '/api';

// ============================================
// DOM REFERENCES
// ============================================
const form = document.getElementById('uploadForm');
const artistInput = document.getElementById('artist');
const albumInput = document.getElementById('album');
const songInput = document.getElementById('song');
const fileInput = document.getElementById('videoFile');
const uploadBtn = document.getElementById('uploadBtn');
const uploadMessage = document.getElementById('uploadMessage');
const canvasList = document.getElementById('canvasList');
const canvasTableBody = document.getElementById('canvasTableBody');
const loading = document.getElementById('loading');
const emptyMessage = document.getElementById('emptyMessage');
const totalCount = document.getElementById('totalCount');

// ============================================
// FUNCTIONS
// ============================================

// Decode UTF-8 text
function decodeText(text) {
    if (!text) return '';
    try {
        const txt = document.createElement('textarea');
        txt.innerHTML = text;
        return txt.value;
    } catch (e) {
        return text;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show message in the form
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'message-md3 ' + type;
    element.style.display = 'block';
}

// Hide message
function hideMessage(element) {
    element.className = 'message-md3';
    element.textContent = '';
    element.style.display = 'none';
}

// Update total count
function updateTotalCount(count) {
    if (totalCount) {
        totalCount.textContent = count;
    }
}

// Load Canvas list
async function loadCanvasList() {
    try {
        loading.style.display = 'block';
        canvasList.style.display = 'none';
        emptyMessage.style.display = 'none';

        const response = await fetch(`${API_BASE}/list`);
        const data = await response.json();

        loading.style.display = 'none';

        if (data.canvases && data.canvases.length > 0) {
            canvasList.style.display = 'block';
            updateTotalCount(data.canvases.length);
            renderCanvasTable(data.canvases);
        } else {
            emptyMessage.style.display = 'block';
            updateTotalCount(0);
        }
    } catch (error) {
        loading.style.display = 'none';
        console.error('Error loading list:', error);
        emptyMessage.style.display = 'block';
        emptyMessage.innerHTML = `
            <span class="icon">❌</span>
            <p class="text-base">Error loading Canvases</p>
            <p class="text-sm opacity-60 mt-2">${error.message}</p>
        `;
    }
}

// Render Canvas table
function renderCanvasTable(canvases) {
    canvasTableBody.innerHTML = '';
    
    canvases.forEach((canvas) => {
        const artist = decodeText(canvas.artist);
        const album = decodeText(canvas.album);
        const song = decodeText(canvas.song || '');
        
        const isVideo = canvas.type === 'mp4' || canvas.type === 'webm' || canvas.type === 'mov';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                ${isVideo ? `
                    <div class="canvas-preview" onclick="window.open('${canvas.url}', '_blank')" title="View Canvas">
                        <video muted>
                            <source src="${canvas.url}" type="video/${canvas.type}">
                        </video>
                    </div>
                ` : `
                    <div class="canvas-preview flex items-center justify-center" style="background: var(--md-primary-container);" onclick="window.open('${canvas.url}', '_blank')" title="View Canvas">
                        <ion-icon name="image-outline" style="font-size: 1.5rem; color: var(--md-primary);"></ion-icon>
                    </div>
                `}
            </td>
            <td><span class="font-medium">${escapeHtml(artist)}</span></td>
            <td>${escapeHtml(album)}</td>
            <td>${escapeHtml(song) || '<span class="opacity-40 text-sm">No song</span>'}</td>
            <td>
                <a href="${canvas.url}" target="_blank" class="link-md3" title="${canvas.url}">
                    <ion-icon name="open-outline" style="font-size: 1rem;"></ion-icon>
                    View
                </a>
            </td>
            <td>
                <div class="flex items-center justify-center gap-1">
                    <button class="btn-icon-md3" data-url="${canvas.url}" title="Copy URL">
                        <ion-icon name="copy-outline"></ion-icon>
                    </button>
                    <button class="btn-icon-md3 danger" data-id="${canvas.id}" title="Delete">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            </td>
        `;
        canvasTableBody.appendChild(row);
    });

    // EVENT LISTENER: Copy URL
    document.querySelectorAll('.btn-icon-md3[data-url]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const url = this.dataset.url;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    showMessage(uploadMessage, '✅ URL copied to clipboard', 'success');
                    setTimeout(() => hideMessage(uploadMessage), 3000);
                }).catch(() => {
                    fallbackCopy(url);
                });
            } else {
                fallbackCopy(url);
            }
        });
    });

    // EVENT LISTENER: Delete Canvas
    document.querySelectorAll('.btn-icon-md3.danger').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const row = this.closest('tr');
            const songName = row.querySelector('td:nth-child(4)')?.textContent || 'this song';
            
            if (confirm(`Delete the Canvas for "${songName.trim()}"?`)) {
                try {
                    const response = await fetch(`${API_BASE}/delete`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        showMessage(uploadMessage, '✅ Canvas deleted successfully', 'success');
                        setTimeout(() => hideMessage(uploadMessage), 3000);
                        loadCanvasList();
                    } else {
                        showMessage(uploadMessage, '❌ ' + (data.error || 'Error deleting'), 'error');
                    }
                } catch (error) {
                    showMessage(uploadMessage, '❌ Error deleting: ' + error.message, 'error');
                }
            }
        });
    });
}

// Fallback to copy URL
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showMessage(uploadMessage, '✅ URL copied to clipboard', 'success');
        setTimeout(() => hideMessage(uploadMessage), 3000);
    } catch (e) {
        showMessage(uploadMessage, '❌ Could not copy URL', 'error');
    }
    document.body.removeChild(textarea);
}

// ============================================
// EVENT LISTENER: Upload Canvas
// ============================================
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const artist = artistInput.value.trim();
    const album = albumInput.value.trim();
    const song = songInput.value.trim(); // ✅ Now optional
    const file = fileInput.files[0];

    // ✅ Only artist, album, and file are required. Song is optional.
    if (!artist || !album || !file) {
        showMessage(uploadMessage, '❌ Artist, album, and file are required. Song is optional.', 'error');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
        showMessage(uploadMessage, '❌ File must be a video (MP4, WebM, etc.)', 'error');
        return;
    }

    // Validate size (maximum 6MB)
    if (file.size > 6 * 1024 * 1024) {
        showMessage(uploadMessage, '❌ File exceeds 6MB. Please compress the video.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('artist', artist);
    formData.append('album', album);
    if (song) {
        formData.append('song', song); // Only if it has value
    }
    formData.append('video', file);

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<ion-icon name="refresh-outline" class="animate-spin"></ion-icon> Uploading...';
    showMessage(uploadMessage, '⏳ Uploading Canvas...', 'loading');

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showMessage(uploadMessage, `✅ Canvas uploaded successfully!\nURL: ${data.url}`, 'success');
            form.reset();
            loadCanvasList();
            document.querySelector('.list-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            showMessage(uploadMessage, '❌ ' + (data.error || 'Error uploading Canvas'), 'error');
        }
    } catch (error) {
        console.error('Connection error:', error);
        showMessage(uploadMessage, '❌ Connection error: ' + error.message, 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<ion-icon name="cloud-upload-outline"></ion-icon> Upload Canvas';
    }
});

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadCanvasList();
});