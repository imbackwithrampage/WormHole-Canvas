// api/search.js
import { list } from '@vercel/blob';

function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, ' ');
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
    }

    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(500).json({
                success: false,
                error: 'Blob Storage configuration is incomplete'
            });
        }

        const { artist, album, song } = req.query;

        // ✅ At least artist or album is required
        if (!artist && !album) {
            return res.status(400).json({
                success: false,
                error: 'At least artist or album is required'
            });
        }

        // 📋 List all blobs
        const blobs = await list({ prefix: 'canvases/' });

        // 🔍 Search for index.json
        let indexData = { canvases: [] };
        const indexBlob = blobs.blobs.find(b => b.pathname === 'canvases/index.json');

        if (indexBlob) {
            const response = await fetch(indexBlob.url);
            if (response.ok) {
                indexData = await response.json();
            }
        }

        const normalizedArtist = normalizeText(artist || '');
        const normalizedAlbum = normalizeText(album || '');
        const normalizedSong = normalizeText(song || '');

        let bestMatch = null;
        let bestScore = 0;

        for (const canvas of (indexData.canvases || [])) {
            const cArtist = normalizeText(canvas.artist || '');
            const cAlbum = normalizeText(canvas.album || '');
            const cSong = normalizeText(canvas.song || '');

            let score = 0;

            // ✅ WEIGHT 1: Artist (very important)
            if (artist) {
                if (cArtist === normalizedArtist) score += 40;
                else if (cArtist.includes(normalizedArtist) || normalizedArtist.includes(cArtist)) score += 20;
            }

            // ✅ WEIGHT 2: Album (very important)
            if (album) {
                if (cAlbum === normalizedAlbum) score += 35;
                else if (cAlbum.includes(normalizedAlbum) || normalizedAlbum.includes(cAlbum)) score += 18;
            }

            // ✅ WEIGHT 3: Song (only if provided)
            if (song && song.trim()) {
                if (cSong === normalizedSong) score += 25;
                else if (cSong.includes(normalizedSong) || normalizedSong.includes(cSong)) score += 12;
            }

            // ✅ Bonus: If the album matches the song exactly (when there is no song)
            if (!song || !song.trim()) {
                if (cAlbum === cSong && cAlbum !== '') score += 5;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = canvas;
            }
        }

        // ✅ Minimum threshold: with artist+album it is easier to reach
        const threshold = (song && song.trim()) ? 25 : 15;

        if (bestMatch && bestScore >= threshold) {
            return res.status(200).json({
                success: true,
                found: true,
                data: bestMatch
            });
        }

        return res.status(200).json({
            success: true,
            found: false,
            data: null
        });

    } catch (error) {
        console.error('❌ Error in search:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal error: ' + error.message
        });
    }
}