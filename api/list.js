// api/list.js
import { list } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
    }

    try {
        // Verify token
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(500).json({
                success: false,
                error: 'Blob Storage configuration is incomplete'
            });
        }

        // 📋 List all blobs in the 'canvases/' directory
        const blobs = await list({
            prefix: 'canvases/'
        });

        // 🔍 Search for the index.json file
        let indexData = { canvases: [] };
        const indexBlob = blobs.blobs.find(b => b.pathname === 'canvases/index.json');

        if (indexBlob) {
            // Download the contents of index.json
            const response = await fetch(indexBlob.url);
            if (response.ok) {
                indexData = await response.json();
                console.log('📖 Loaded index:', indexData.canvases.length);
            }
        }

        // Sort by date
        const canvases = (indexData.canvases || []).sort((a, b) => {
            const aDate = a.uploadedAt || a.updatedAt || '';
            const bDate = b.uploadedAt || b.updatedAt || '';
            return bDate.localeCompare(aDate);
        });

        return res.status(200).json({
            success: true,
            total: canvases.length,
            canvases: canvases,
            data: {
                canvases: canvases,
                total: canvases.length
            }
        });

    } catch (error) {
        console.error('❌ Error in list:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal error: ' + error.message
        });
    }
}