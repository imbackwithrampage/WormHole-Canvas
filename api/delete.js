// api/delete.js
import { del } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Método no permitido. Usa DELETE.' });
    }

    try {
        // Verificar token
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(500).json({
                success: false,
                error: 'Configuración de Blob Storage incompleta'
            });
        }

        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere el ID'
            });
        }

        // 🔍 Buscar el índice
        let indexData = { canvases: [] };
        let found = false;
        let fileUrl = '';

        try {
            const response = await fetch(
                `https://${process.env.VERCEL_URL}/api/blob/canvases/index.json`
            );
            if (response.ok) {
                indexData = await response.json();
            }
        } catch (e) {}

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
                error: `No se encontró Canvas con ID: ${id}`
            });
        }

        // 🗑️ Eliminar el archivo de Vercel Blob
        if (fileUrl) {
            await del(fileUrl);
        }

        // Guardar índice actualizado
        await put('canvases/index.json', JSON.stringify(indexData, null, 2), {
            access: 'public',
            contentType: 'application/json'
        });

        return res.status(200).json({
            success: true,
            message: 'Canvas eliminado correctamente',
            id: id
        });

    } catch (error) {
        console.error('❌ Error en delete:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
}