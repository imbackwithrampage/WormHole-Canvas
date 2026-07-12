// ============================================
// CONFIGURACIÓN
// ============================================
const API_BASE = '/api';

// ============================================
// DOM REFERENCIAS
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

// ============================================
// FUNCIONES
// ============================================

// Mostrar mensaje en el formulario
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'message ' + type;
}

// Ocultar mensaje
function hideMessage(element) {
    element.className = 'message';
    element.textContent = '';
}

// Cargar lista de Canvas
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
            renderCanvasTable(data.canvases);
        } else {
            emptyMessage.style.display = 'block';
        }
    } catch (error) {
        loading.style.display = 'none';
        console.error('Error al cargar la lista:', error);
        emptyMessage.style.display = 'block';
        emptyMessage.innerHTML = '<p>❌ Error al cargar los Canvas. Intenta recargar la página.</p>';
    }
}

// Renderizar tabla de Canvas
function renderCanvasTable(canvases) {
    canvasTableBody.innerHTML = '';
    canvases.forEach((canvas, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(canvas.artist)}</td>
            <td>${escapeHtml(canvas.album)}</td>
            <td>${escapeHtml(canvas.song)}</td>
            <td>
                <a href="${canvas.url}" target="_blank" class="url-link">${canvas.url}</a>
            </td>
            <td>
                <button class="btn-copy" data-url="${canvas.url}" title="Copiar URL">📋</button>
                <button class="btn-delete" data-id="${canvas.id}" title="Eliminar">🗑️</button>
            </td>
        `;
        canvasTableBody.appendChild(row);
    });

    // Event listeners para copiar URL
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', function() {
            const url = this.dataset.url;
            navigator.clipboard.writeText(url).then(() => {
                showMessage(uploadMessage, '✅ URL copiada al portapapeles', 'success');
                setTimeout(() => hideMessage(uploadMessage), 3000);
            }).catch(() => {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = url;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showMessage(uploadMessage, '✅ URL copiada al portapapeles', 'success');
                setTimeout(() => hideMessage(uploadMessage), 3000);
            });
        });
    });

    // Event listeners para eliminar
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            if (confirm(`¿Eliminar este Canvas de "${this.closest('tr').querySelector('td:nth-child(3)').textContent}"?`)) {
                try {
                    const response = await fetch(`${API_BASE}/delete`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    const data = await response.json();
                    if (data.success) {
                        showMessage(uploadMessage, '✅ Canvas eliminado correctamente', 'success');
                        setTimeout(() => hideMessage(uploadMessage), 3000);
                        loadCanvasList(); // Recargar lista
                    } else {
                        showMessage(uploadMessage, '❌ ' + data.error, 'error');
                    }
                } catch (error) {
                    showMessage(uploadMessage, '❌ Error al eliminar: ' + error.message, 'error');
                }
            }
        });
    });
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENT LISTENERS
// ============================================

// En script.js, actualizar la función de submit

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const artist = artistInput.value.trim();
    const album = albumInput.value.trim();
    const song = songInput.value.trim();
    const file = fileInput.files[0];

    if (!artist || !album || !song || !file) {
        showMessage(uploadMessage, '❌ Por favor, completa todos los campos', 'error');
        return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('video/')) {
        showMessage(uploadMessage, '❌ El archivo debe ser un video (MP4, WebM, etc.)', 'error');
        return;
    }

    // Validar tamaño (máximo 20MB)
    if (file.size > 20 * 1024 * 1024) {
        showMessage(uploadMessage, '❌ El archivo excede 20MB', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('artist', artist);
    formData.append('album', album);
    formData.append('song', song);
    formData.append('video', file);

    uploadBtn.disabled = true;
    uploadBtn.textContent = '⏳ Subiendo...';
    showMessage(uploadMessage, '⏳ Subiendo Canvas...', 'loading');

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
            // ⚠️ NO pongas Content-Type manualmente, el navegador lo pone automáticamente con el boundary
        });

        const data = await response.json();

        if (data.success) {
            showMessage(uploadMessage, `✅ Canvas subido correctamente!\nURL: ${data.url}`, 'success');
            form.reset();
            loadCanvasList();
        } else {
            showMessage(uploadMessage, '❌ ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showMessage(uploadMessage, '❌ Error de conexión: ' + error.message, 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '🚀 Subir Canvas';
    }
});

// ============================================
// INICIALIZAR
// ============================================
loadCanvasList();