// api/list.js
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

        const canvases = indexData.canvases.sort((a, b) => {
            const aDate = a.uploadedAt || a.updatedAt || '';
            const bDate = b.uploadedAt || b.updatedAt || '';
            return bDate.localeCompare(aDate);
        });

        return res.status(200).json({
            success: true,
            total: canvases.length,
            canvases: canvases
        });

    } catch (error) {
        console.error('❌ Error en list:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
}