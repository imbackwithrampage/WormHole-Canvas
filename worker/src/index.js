// Cloudflare Worker backend for WormHole Canvas Studio
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle Preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    try {
      // 1. LIST ACTION
      if (request.method === 'GET' && action === 'list') {
        const { results } = await env.DB.prepare(
          "SELECT * FROM canvases ORDER BY uploadedAt DESC"
        ).all();

        return new Response(
          JSON.stringify({
            success: true,
            total: results.length,
            canvases: results,
            data: {
              canvases: results,
              total: results.length
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. SEARCH ACTION (Fallback route for old APIs)
      if (request.method === 'GET' && (url.pathname === '/search' || action === 'search')) {
        const artist = (url.searchParams.get('artist') || '').trim();
        const album = (url.searchParams.get('album') || '').trim();
        const song = (url.searchParams.get('song') || '').trim();

        if (!artist) {
          return new Response(
            JSON.stringify({ success: false, error: 'Artist is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Query the D1 database to search
        const { results } = await env.DB.prepare(
          "SELECT * FROM canvases WHERE LOWER(artist) = LOWER(?)"
        ).bind(artist).all();

        // Perform exact matching or fallbacks
        let match = null;
        if (results.length > 0) {
          // Exact Match
          if (song) {
            match = results.find(c => (c.song || '').toLowerCase() === song.toLowerCase() && (c.album || '').toLowerCase() === album.toLowerCase());
          }
          // Album Match
          if (!match && album) {
            match = results.find(c => (c.album || '').toLowerCase() === album.toLowerCase() && !c.song);
          }
          // Fallback to Artist overall
          if (!match) {
            match = results.find(c => !c.song && !c.album) || results[0];
          }
        }

        if (match) {
          return new Response(
            JSON.stringify({ success: true, canvas: match }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, message: 'No canvas match found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // 3. UPLOAD ACTION
      if (request.method === 'POST' && action === 'upload') {
        // Authenticate request
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token !== env.UPLOAD_TOKEN) {
          return new Response(
            JSON.stringify({ success: false, message: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const formData = await request.formData();
        const artist = (formData.get('artist') || '').toString().trim();
        const album = (formData.get('album') || '').toString().trim();
        const song = (formData.get('song') || '').toString().trim();
        const file = formData.get('file') || formData.get('video');

        if (!artist || !album || !file) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing artist, album or file' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate ID
        const clean = (str) => str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');

        let id = `${clean(artist)}_${clean(album)}`;
        if (song) {
          id += `_${clean(song)}`;
        }

        const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : 'mp4';
        const key = `canvases/${id}.${fileExt}`;

        // Save to R2 Bucket
        await env.BUCKET.put(key, file.stream(), {
          httpMetadata: { contentType: file.type || 'video/mp4' }
        });

        // Resolve R2 Public URL
        const cdnBase = (env.PUBLIC_CDN_BASE || '').replace(/\/+$/, '');
        const fileUrl = `${cdnBase}/${key}`;

        // Save metadata into D1 Database
        const now = new Date().toISOString();
        await env.DB.prepare(
          `INSERT INTO canvases (id, artist, album, song, url, type, uploadedAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET 
             url=excluded.url,
             type=excluded.type,
             updatedAt=?`
        ).bind(id, artist, album, song, fileUrl, fileExt, now, now, now).run();

        return new Response(
          JSON.stringify({
            success: true,
            id: id,
            url: fileUrl,
            message: 'Canvas uploaded successfully to Cloudflare R2'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 4. DELETE ACTION
      if (request.method === 'DELETE' || action === 'delete') {
        // Authenticate request
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token !== env.UPLOAD_TOKEN) {
          return new Response(
            JSON.stringify({ success: false, message: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Parse delete ID
        let id = url.searchParams.get('id') || '';
        if (!id && request.method !== 'GET') {
          try {
            const body = await request.json();
            id = body.id || '';
          } catch (_) {}
        }

        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: 'ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch item details first to get the key name
        const canvas = await env.DB.prepare(
          "SELECT url FROM canvases WHERE id = ?"
        ).bind(id).first();

        if (!canvas) {
          return new Response(
            JSON.stringify({ success: false, error: `Canvas with ID ${id} not found` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract key from URL
        const cdnBase = (env.PUBLIC_CDN_BASE || '').replace(/\/+$/, '');
        const key = canvas.url.replace(cdnBase, '').replace(/^\/+/, '');

        // Delete from R2 Bucket
        if (key) {
          await env.BUCKET.delete(key);
        }

        // Delete from D1 Database
        await env.DB.prepare("DELETE FROM canvases WHERE id = ?").bind(id).run();

        return new Response(
          JSON.stringify({
            success: true,
            id: id,
            message: 'Canvas deleted successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Catch-all route
      return new Response(
        JSON.stringify({ success: false, error: 'Not Found or Action Invalid' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: e.message || e }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
}
