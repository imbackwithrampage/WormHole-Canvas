// api/upload.js
import { put, list } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

// 🔧 Helper: Generate unique ID (with optional song)
function generateId(artist, album, song) {
    const clean = (str) => str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    
    let result = `${clean(artist)}_${clean(album)}`;
    if (song && song.trim()) {
        result += `_${clean(song)}`;
    }
    return result;
}

// 🔧 Helper: Get file extension
function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : 'mp4';
}

// 📤 Main handler
export default async function handler(req, res) {
    console.log('📤 Upload function called');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error('❌ Missing BLOB_READ_WRITE_TOKEN');
            return res.status(500).json({
                success: false,
                error: 'Blob Storage configuration is incomplete'
            });
        }

        const { fields, files } = await parseMultipartFormData(req);
        
        console.log('📤 Fields:', Object.keys(fields));
        console.log('📤 Files:', Object.keys(files));

        // ✅ Artist and album are required, song is optional
        if (!fields.artist || !fields.album) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: artist, album (song is optional)'
            });
        }

        const videoFile = files.file || files.video;
        if (!videoFile) {
            return res.status(400).json({
                success: false,
                error: 'Missing video file (use field name "file" or "video")'
            });
        }

        // ✅ Validate size (4.5MB maximum due to Vercel limits)
        if (videoFile.size > 4.5 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'The video file must be less than 4.5MB due to Vercel request limits'
            });
        }

        const artist = fields.artist.trim();
        const album = fields.album.trim();
        const song = fields.song ? fields.song.trim() : ''; // ✅ Optional

        console.log('📤 Processing:', { artist, album, song: song || '(no song)', filename: videoFile.filename });

        const id = generateId(artist, album, song);
        const fileExt = getFileExtension(videoFile.filename);
        const fileName = `canvases/${id}.${fileExt}`;

        // 📤 Save to Vercel Blob
        const fileBuffer = Buffer.from(videoFile.content, 'base64');
        const blob = await put(fileName, fileBuffer, {
            access: 'public',
            contentType: videoFile.contentType || 'video/mp4'
        });

        console.log('✅ File saved:', blob.url);

        // 📝 Read current index
        let indexData = { canvases: [] };
        try {
            const blobs = await list({ prefix: 'canvases/' });
            const indexBlob = blobs.blobs.find(b => b.pathname === 'canvases/index.json');
            if (indexBlob) {
                const response = await fetch(indexBlob.url);
                if (response.ok) {
                    indexData = await response.json();
                    console.log('📖 Loaded index:', indexData.canvases.length);
                }
            }
        } catch (e) {
            console.log('📝 Creating new index...');
        }

        // Create entry
        const newEntry = {
            id: id,
            artist: artist,
            album: album,
            song: song || '', // ✅ Save empty if there is no song
            url: blob.url,
            type: fileExt,
            uploadedAt: new Date().toISOString()
        };

        const existingIndex = indexData.canvases.findIndex(c => c.id === id);
        if (existingIndex !== -1) {
            indexData.canvases[existingIndex] = { ...newEntry, updatedAt: new Date().toISOString() };
            console.log('🔄 Updating existing entry');
        } else {
            indexData.canvases.push(newEntry);
            console.log('➕ New entry added');
        }

        // Save updated index
        await put('canvases/index.json', JSON.stringify(indexData, null, 2), {
            access: 'public',
            contentType: 'application/json'
        });

        console.log('💾 Index saved');

        return res.status(200).json({
            success: true,
            id: id,
            url: blob.url,
            artist: artist,
            album: album,
            song: song || '',
            message: 'Canvas uploaded successfully'
        });

    } catch (error) {
        console.error('❌ Error in upload:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal error: ' + error.message
        });
    }
}

// 🔧 Function to parse multipart/form-data
async function parseMultipartFormData(req) {
    const fields = {};
    const files = {};

    // Read the stream using robust event listeners
    const bodyBuffer = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', (err) => reject(err));
    });
    
    if (bodyBuffer.length === 0) {
        return { fields, files };
    }

    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
        throw new Error('Boundary not found in Content-Type');
    }

    let boundary = boundaryMatch[1].trim();
    if (boundary.startsWith('"') && boundary.endsWith('"')) {
        boundary = boundary.slice(1, -1);
    }
    const body = bodyBuffer.toString('binary');
    const parts = body.split(`--${boundary}`);

    for (const part of parts) {
        if (part.trim() === '' || part.trim() === '--') continue;

        // Support both CRLF (\r\n\r\n) and LF (\n\n) header boundaries
        let headerEndIndex = part.indexOf('\r\n\r\n');
        let delimiterLength = 4;
        if (headerEndIndex === -1) {
            headerEndIndex = part.indexOf('\n\n');
            delimiterLength = 2;
        }
        if (headerEndIndex === -1) continue;

        const headersPart = part.substring(0, headerEndIndex);
        const content = part.substring(headerEndIndex + delimiterLength);

        const nameMatch = headersPart.match(/name="([^"]+)"/);
        if (!nameMatch) continue;
        const name = nameMatch[1];

        const filenameMatch = headersPart.match(/filename="([^"]+)"/);

        if (filenameMatch) {
            const filename = filenameMatch[1];
            const contentTypeMatch = headersPart.match(/Content-Type: ([^\r\n\n]+)/i);
            const contentTypeValue = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
            
            const cleanContent = content.replace(/\r\n$/, '').replace(/\n$/, '');
            
            files[name] = {
                filename: filename,
                contentType: contentTypeValue,
                content: Buffer.from(cleanContent, 'binary').toString('base64'),
                size: cleanContent.length
            };
        } else {
            fields[name] = content.replace(/\r\n$/, '').replace(/\n$/, '').trim();
        }
    }

    return { fields, files };
}