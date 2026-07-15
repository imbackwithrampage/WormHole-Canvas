import os
import sys
import subprocess

def run_cmd(args):
    print(f"Running: {' '.join(args)}")
    res = subprocess.run(args, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error executing command: {res.stderr}")
        return False, res.stderr
    return True, res.stdout

def main():
    # 1. Ensure upstream remote exists
    _, remotes = run_cmd(["git", "remote"])
    if "upstream" not in remotes:
        success, err = run_cmd(["git", "remote", "add", "upstream", "https://github.com/Arturo254/Canvas-Artwork.git"])
        if not success:
            sys.exit(1)
            
    # 2. Fetch upstream
    success, _ = run_cmd(["git", "fetch", "upstream"])
    if not success:
        sys.exit(1)
        
    # 3. Checkout files from upstream/main
    files_to_sync = ["index.html", "script.js", "styles.css"]
    success, _ = run_cmd(["git", "checkout", "upstream/main", "--"] + files_to_sync)
    if not success:
        sys.exit(1)

    # 4. Apply replacements to index.html
    if os.path.exists("index.html"):
        print("Processing index.html...")
        with open("index.html", "r", encoding="utf-8") as f:
            content = f.read()

        # HTML lang attribute
        content = content.replace('<html lang="es">', '<html lang="en">')
        
        # Titles and Branding
        content = content.replace("OpenTune · Canvas Studio", "WormHole · Canvas Studio")
        content = content.replace("Herramienta para <strong>desarrolladores</strong> y administradores de contenido de OpenTune.", "Tool for <strong>developers</strong> and content administrators of WormHole.")
        content = content.replace('title="Cerrar aviso"', 'title="Close notice"')
        content = content.replace('<div class="brand-mark">OT</div>', '<div class="brand-mark">WH</div>')
        content = content.replace("<p>Subí y gestioná los canvases animados de OpenTune</p>", "<p>Upload and manage the animated canvases of WormHole</p>")
        content = content.replace('href="https://github.com/Arturo254/OpenTune"', 'href="https://github.com/imbackwithrampage/WormHole-Canvas"')
        content = content.replace('title="Repositorio de OpenTune en GitHub"', 'title="WormHole Repository on GitHub"')
        content = content.replace("<span>OpenTune</span>", "<span>WormHole</span>")
        content = content.replace('title="Actualizar catálogo (R)"', 'title="Refresh catalog (R)"')
        content = content.replace("📩 Contacto para subir canvas vía Telegram:", "📩 Contact to upload canvas via Telegram:")
        content = content.replace("https://t.me/ArturoCervantes254", "https://t.me/sasu_1205")
        content = content.replace("@ArturoCervantes254", "@SunilSachindar")
        content = content.replace("<span>Conexión al servidor</span>", "<span>Server Connection</span>")
        content = content.replace('id="connStatus">Sin configurar</span>', 'id="connStatus">Not configured</span>')
        content = content.replace('<label for="apiBase">URL del Worker</label>', '<label for="apiBase">Worker URL / API Base</label>')
        content = content.replace('Ej: https://opentune-canvas-api.tu-usuario.workers.dev', 'e.g., https://wormhole-canvas-api.your-username.workers.dev')
        content = content.replace('<label for="uploadToken">Upload token</label>', '<label for="uploadToken">Upload Token</label>')
        content = content.replace('El secreto UPLOAD_TOKEN configurado en el Worker', 'The UPLOAD_TOKEN secret configured in the Worker')
        content = content.replace('Guardar conexión', 'Save Connection')
        content = content.replace('Probar conexión', 'Test Connection')
        content = content.replace("Nuevo canvas", "New Canvas")
        content = content.replace("Un canvas sin canción específica aplica a todo el álbum.", "A canvas with no specific song applies to the entire album.")
        content = content.replace("Arrastrá tu video acá", "Drag your video here")
        content = content.replace("o tocá para elegirlo · MP4, formato vertical recomendado", "or click to choose it · MP4, portrait format recommended")
        content = content.replace("Modo álbum completo", "Full Album Mode")
        content = content.replace("El canvas se va a mostrar en todas las canciones del álbum", "The canvas will display for all songs in the album")
        content = content.replace('title="Activar modo álbum"', 'title="Activate album mode"')
        content = content.replace("Artista *", "Artist *")
        content = content.replace("Álbum", "Album")
        content = content.replace("Canción (opcional — vacío = aplica a todo el álbum)", "Song (optional — empty = applies to entire album)")
        content = content.replace("Subiendo… 0%", "Uploading… 0%")
        content = content.replace("Subir canvas", "Upload Canvas")
        content = content.replace("Catálogo", "Catalog")
        content = content.replace("Canvases ya disponibles para OpenTune", "Canvases already available for WormHole")
        content = content.replace('placeholder="Buscar por artista o álbum… ( / )"', 'placeholder="Search by artist or album… ( / )"')
        content = content.replace('title="Limpiar búsqueda"', 'title="Clear search"')
        content = content.replace("Todos", "All")
        content = content.replace("OpenTune Canvas Studio ·", "WormHole Canvas Studio ·")
        content = content.replace('title="Ir a subir canvas"', 'title="Go to upload canvas"')
        content = content.replace('title="Cerrar"', 'title="Close"')
        content = content.replace("Copiar URL", "Copy URL")
        content = content.replace("Abrir", "Open")
        content = content.replace("<!-- Developer Warning (banner en flujo normal, no fixed) -->", "<!-- Developer Warning (banner in normal flow, not fixed) -->")
        content = content.replace("<!-- FAB subir (aparece en scroll, principalmente móvil) -->", "<!-- FAB upload (appears on scroll, mainly mobile) -->")
        content = content.replace("<!-- Modal de vista previa -->", "<!-- Preview Modal -->")
        content = content.replace("github.com/Arturo254/OpenTune", "github.com/imbackwithrampage/WormHole-Canvas")
        
        with open("index.html", "w", encoding="utf-8") as f:
            f.write(content)

    # 5. Apply replacements to script.js
    if os.path.exists("script.js"):
        print("Processing script.js...")
        with open("script.js", "r", encoding="utf-8") as f:
            content = f.read()

        # LocalStorage keys
        content = content.replace("ot_api_base", "wh_api_base")
        content = content.replace("ot_upload_token", "wh_upload_token")
        content = content.replace("ot_warning_hidden", "wh_warning_hidden")
        
        # Default apiBase
        content = content.replace("localStorage.getItem('wh_api_base') || ''", "localStorage.getItem('wh_api_base') || '/api'")
        
        # Footer timestamp
        content = content.replace("dateStr = now.toLocaleDateString('es-ES',", "dateStr = now.toLocaleDateString('en-US',")
        content = content.replace("timeStr = now.toLocaleTimeString('es-ES',", "timeStr = now.toLocaleTimeString('en-US',")
        content = content.replace("`Última actualización: ${dateStr} · ${timeStr}`", "`Last updated: ${dateStr} · ${timeStr}`")
        
        # Connection status bypass for Vercel
        content = content.replace(
            "const configured = !!normalizedBase() && !!store.token;",
            "const configured = !!normalizedBase() && (normalizedBase() === '/api' || !!store.token);"
        )
        content = content.replace("configured ? '✅ Conectado' : '🔴 Sin configurar'", "configured ? '✅ Connected' : '🔴 Not configured'")
        content = content.replace("showSnackbar(ok ? '✅ Conexión guardada correctamente' : '⚠️ Completá URL y token', !ok);", "showSnackbar(ok ? '✅ Connection saved successfully' : '⚠️ Complete URL and token', !ok);")
        
        # Test connection strings
        content = content.replace("'⏳ Probando conexión...'", "'⏳ Testing connection...'")
        content = content.replace("'⚠️ Ingresá primero la URL del Worker.'", "'⚠️ Enter the Worker URL first.'")
        content = content.replace("'⚠️ La URL debe empezar con https:// (o http:// solo en local).'", "'⚠️ The URL must start with https:// (or http:// only for local).'")
        content = content.replace("`⚠️ El servidor respondió (HTTP ${res.status}) pero no es JSON válido.\\n` +", "`⚠️ The server responded (HTTP ${res.status}) but it is not valid JSON.\\n` +")
        content = content.replace("`Esto normalmente significa que el Worker no está desplegado en esa URL, ` +", "`This usually means the Worker is not deployed at that URL, ` +")
        content = content.replace("`o que hay un error interno.\\nPrimeros caracteres:\\n${text.slice(0, 180)}`", "`or that there is an internal error.\\nFirst characters:\\n${text.slice(0, 180)}`")
        content = content.replace("`⚠️ El servidor respondió pero con error: ${parsed.message || 'sin mensaje'}`", "`⚠️ The server responded but with error: ${parsed.message || 'no message'}`")
        content = content.replace("parsed?.data?.canvases?.[0]?.url || '(catálogo vacío)'", "parsed?.data?.canvases?.[0]?.url || '(empty catalog)'")
        content = content.replace("`✅ Conectado en ${elapsed} ms · ${n} canvas(es) en el catálogo.\\n` +", "`✅ Connected in ${elapsed} ms · ${n} canvas(es) in the catalog.\\n` +")
        content = content.replace("`📹 URL de ejemplo: ${sampleUrl}` +", "`📹 Example URL: ${sampleUrl}` +")
        content = content.replace('(badUrl ? \'\\n⚠️ Empieza con "undefined": falta configurar PUBLIC_CDN_BASE en el Worker.\' : \'\')', "(badUrl ? '\\n⚠️ Starts with \"undefined\": PUBLIC_CDN_BASE needs to be configured in the Worker.' : '')")
        
        # CORS warnings
        content = content.replace(
            "'⚠️ Fetch bloqueado (Failed to fetch). Causas más comunes:\\n' +",
            "'⚠️ Fetch blocked (Failed to fetch). Most common causes:\\n' +"
        )
        content = content.replace(
            "'  · La URL está mal escrita o el Worker no está desplegado.\\n' +",
            "'  · The URL is misspelled or the Worker is not deployed.\\n' +"
        )
        content = content.replace(
            "'  · Falta el manejo de OPTIONS/CORS en el Worker (redeployá la versión corregida).\\n' +",
            "'  · OPTIONS/CORS handling is missing in the Worker (redeploy the corrected version).\\n' +"
        )
        content = content.replace(
            "'  · Estás abriendo este HTML desde file:// y el navegador lo bloquea — probá subirlo a un hosting o Cloudflare Pages.' :",
            "'  · You are opening this HTML from file:// and the browser blocks it — try uploading it to a hosting service or Cloudflare Pages.' :"
        )
        content = content.replace("`⚠️ Error inesperado: ${err.message || err}`", "`⚠️ Unexpected error: ${err.message || err}`")
        
        # Dropzone translations
        content = content.replace("'⚠️ Elegí un archivo de video (MP4)'", "'⚠️ Choose a video file (MP4)'")
        content = content.replace('<div class="dz-title">📹 Arrastrá tu video acá</div>', '<div class="dz-title">📹 Drag your video here</div>')
        content = content.replace('<div class="dz-sub">o hacé clic para seleccionarlo · MP4 · Formato vertical (9:16)</div>', '<div class="dz-sub">or click to select it · MP4 · Portrait format (9:16)</div>')
        
        # Upload validation/execution translations
        content = content.replace("showSnackbar('⚠️ Configurá la conexión al servidor primero', true);", "showSnackbar('⚠️ Configure the server connection first', true);")
        # Token bypass for local Vercel /api upload
        content = content.replace(
            "const base = normalizedBase();\n        if (!base || !store.token) {",
            "const base = normalizedBase();\n        if (!base || (base !== '/api' && !store.token)) {"
        )
        content = content.replace(
            "xhr.open('POST', `${base}/?action=upload`);\n        xhr.setRequestHeader('Authorization', `Bearer ${store.token}`);",
            "xhr.open('POST', `${base}/?action=upload`);\n        if (base !== '/api') {\n            xhr.setRequestHeader('Authorization', `Bearer ${store.token}`);\n        }"
        )
        content = content.replace("'⏳ Subiendo… 0%'", "'⏳ Uploading… 0%'")
        content = content.replace("`⏳ Subiendo… ${pct}%`", "`⏳ Uploading… ${pct}%`")
        content = content.replace("`El servidor respondió HTTP ${xhr.status} sin JSON válido (¿Worker caído o URL incorrecta?)`", "`Server responded HTTP ${xhr.status} without valid JSON (Is Worker down or URL incorrect?)`")
        content = content.replace("showSnackbar('✅ Canvas subido correctamente a OpenTune 🎉');", "showSnackbar('✅ Canvas uploaded successfully to WormHole 🎉');")
        content = content.replace("showSnackbar('🔒 Token de subida incorrecto (revisá UPLOAD_TOKEN)', true);", "showSnackbar('🔒 Incorrect upload token (check UPLOAD_TOKEN)', true);")
        content = content.replace("showSnackbar('🚫 Bloqueado por CORS o sin conexión — probá \"Probar conexión\" en Configuración', true);", "showSnackbar('🚫 Blocked by CORS or no connection — try \"Test Connection\" in Settings', true);")
        content = content.replace("showSnackbar(msg || `Error subiendo el canvas (HTTP ${xhr.status})`, true);", "showSnackbar(msg || `Error uploading canvas (HTTP ${xhr.status})`, true);")
        content = content.replace("showSnackbar('🚫 No se pudo conectar (CORS, red, o URL del Worker incorrecta)', true);", "showSnackbar('🚫 Could not connect (CORS, network, or incorrect Worker URL)', true);")
        
        # Catalog translations
        content = content.replace("'🔌 Configurá la conexión'", "'🔌 Configure connection'")
        content = content.replace("'Ingresá la URL del Worker para ver el catálogo de canvases de OpenTune.'", "'Enter the Worker URL to view the WormHole canvas catalog.'")
        content = content.replace("throw new Error(data.message || 'Respuesta inválida')", "throw new Error(data.message || 'Invalid response')")
        content = content.replace("'❌ No se pudo cargar el catálogo'", "'❌ Could not load catalog'")
        content = content.replace("'Revisá la URL del Worker y tu conexión.'", "'Check the Worker URL and your connection.'")
        
        # Gallery / card translations
        content = content.replace("'📭 Sin resultados'", "'📭 No results'")
        content = content.replace("'Probá con otro artista o álbum, o subí el primer canvas a OpenTune.'", "'Try another artist or album, or upload the first canvas to WormHole.'")
        content = content.replace("c.album || 'Álbum completo'", "c.album || 'Full album'")
        content = content.replace("'🎵 Canción'", "'🎵 Song'")
        content = content.replace("'💿 Álbum'", "'💿 Album'")
        
        # Modal translations
        content = content.replace("'Sin canción específica'", "'No specific song'")
        content = content.replace("`Álbum: ${c.album || 'Sin álbum'}`", "`Album: ${c.album || 'No album'}`")
        content = content.replace("'Aplica a todo el álbum'", "'Applies to the entire album'")
        content = content.replace("showSnackbar('📋 URL copiada al portapapeles')", "showSnackbar('📋 URL copied to clipboard')")
        content = content.replace("'Ingresá la URL del Worker y el token para empezar a gestionar los canvases de OpenTune.'", "'Enter the Worker URL and token to start managing WormHole canvases.'")

        with open("script.js", "w", encoding="utf-8") as f:
            f.write(content)

    # 6. Apply replacements to styles.css
    if os.path.exists("styles.css"):
        print("Processing styles.css...")
        with open("styles.css", "r", encoding="utf-8") as f:
            content = f.read()

        content = content.replace(
            "/* Espaciado fluido: crece con el viewport sin necesitar media queries para todo */",
            "/* Fluid spacing: grows with the viewport without needing media queries for everything */"
        )
        
        with open("styles.css", "w", encoding="utf-8") as f:
            f.write(content)

    print("Sync and translation script completed successfully!")

if __name__ == "__main__":
    main()
