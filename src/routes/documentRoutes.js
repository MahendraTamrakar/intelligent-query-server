import express from 'express';
import multer from 'multer';
import { DocumentProcessor } from '../services/documentProcessor.js';
import VectorStore from '../services/vectoreStore.js';
import Document from '../models/document.js';

const router = express.Router();
const upload = multer();
const processor = new DocumentProcessor();
const vectorStore = new VectorStore();

// Upload & process document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Process document & save chunks
    const { document, chunks } = await processor.processDocument(file.buffer, file.originalname, file.mimetype);

    // Add chunks to Pinecone
    await vectorStore.addDocumentChunks(chunks);

    res.json({ success: true, documentId: document._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing document' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const documentId = req.params.id;
    await vectorStore.removeDocumentChunks(documentId);
    await Document.findByIdAndDelete(documentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting document' });
  }
});

export default router;
