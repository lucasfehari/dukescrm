import { Router } from "express";
import { upload } from "../middlewares/upload";

const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("arquivo"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Nenhum arquivo enviado ou formato inválido." });
        }

        // We assume the frontend and backend are communicating and the backend host is mostly matching
        // In a real staging environment this should be derived from ENV or host domain headers.
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

        return res.json({ url: fileUrl });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

export { uploadRoutes };
