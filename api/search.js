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
        return res.status(405).json({ error: 'Método no permitido. Usa GET.' });
    }

    try {
        // Verificar token
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(500).json({
                success: false,
                error: 'Configuración de Blob Storage incompleta'
            });
        }

        const { artist, album, song } = req.query;

        if (!artist && !album && !song) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere al menos un parámetro'
            });
        }

        // 🔍 Buscar el índice
        let indexData = { canvases: [] };
        try {
            const response = await fetch(
                `https://${process.env.VERCEL_URL}/api/blob/canvases/index.json`
            );
            if (response.ok) {
                indexData = await response.json();
            }
        } catch (e) {}

        const normalizedArtist = normalizeText(artist);
        const normalizedAlbum = normalizeText(album);
        const normalizedSong = normalizeText(song);

        let bestMatch = null;
        let bestScore = 0;

        for (const canvas of indexData.canvases) {
            const cArtist = normalizeText(canvas.artist);
            const cAlbum = normalizeText(canvas.album);
            const cSong = normalizeText(canvas.song);

            let score = 0;

            if (cArtist === normalizedArtist) score += 30;
            else if (cArtist.includes(normalizedArtist) || normalizedArtist.includes(cArtist)) score += 15;

            if (cAlbum === normalizedAlbum) score += 20;
            else if (cAlbum.includes(normalizedAlbum) || normalizedAlbum.includes(cAlbum)) score += 10;

            if (cSong === normalizedSong) score += 30;
            else if (cSong.includes(normalizedSong) || normalizedSong.includes(cSong)) score += 15;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = canvas;
            }
        }

        if (bestMatch && bestScore >= 10) {
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
        console.error('❌ Error en search:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
}