// api/delete.js
import { del, put } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method Not Allowed. Use DELETE.' });
    }

    try {
        // Verify token
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(500).json({
                success: false,
                error: 'Blob Storage configuration is incomplete'
            });
        }

        const id = req.body?.id || req.query?.id;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID is required'
            });
        }

        // 🔍 Find the index
        let indexData = { canvases: [] };
        let found = false;
        let fileUrl = '';

        try {
            const host = process.env.VERCEL_URL || req.headers.host || 'localhost:3000';
            const protocol = host.startsWith('localhost') ? 'http' : 'https';
            const response = await fetch(
                `${protocol}://${host}/api/blob/canvases/index.json`
            );
            if (response.ok) {
                indexData = await response.json();
            }
        } catch (e) {
            console.error('Error fetching index via redirect:', e);
        }

        indexData.canvases = indexData.canvases.filter(c => {
            if (c.id === id) {
                found = true;
                if (c.url) {
                    fileUrl = c.url;
                }
                return false;
            }
            return true;
        });

        if (!found) {
            return res.status(404).json({
                success: false,
                error: `Canvas with ID ${id} not found`
            });
        }

        // 🗑️ Delete the file from Vercel Blob
        if (fileUrl) {
            await del(fileUrl);
        }

        // Save updated index
        await put('canvases/index.json', JSON.stringify(indexData, null, 2), {
            access: 'public',
            contentType: 'application/json'
        });

        return res.status(200).json({
            success: true,
            message: 'Canvas deleted successfully',
            id: id
        });

    } catch (error) {
        console.error('❌ Error in delete:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal error: ' + error.message
        });
    }
}