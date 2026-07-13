// api/blob.js
import { list } from '@vercel/blob';

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

        const { path } = req.query;

        if (!path) {
            return res.status(400).json({
                success: false,
                error: 'Path parameter is required'
            });
        }

        // List all blobs
        const blobs = await list({ prefix: 'canvases/' });

        // Find the blob matching the requested pathname (e.g. canvases/index.json)
        const foundBlob = blobs.blobs.find(b => b.pathname === path);

        if (!foundBlob) {
            return res.status(404).json({
                success: false,
                error: `Blob not found for path: ${path}`
            });
        }

        // Redirect to the actual Vercel Blob URL
        return res.redirect(307, foundBlob.url);

    } catch (error) {
        console.error('❌ Error in blob redirect:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
}
