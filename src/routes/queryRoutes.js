import express from 'express';
import QueryEngine from '../services/queryEngine.js';

const router = express.Router();
const queryEngine = new QueryEngine();

router.post('/', async (req, res) => {
  try {
    const { query, maxResults, similarityThreshold, documentIds } = req.body;

    const response = await queryEngine.processQuery(
      query,
      maxResults || 5,
      similarityThreshold || 0.7,
      documentIds || null
    );

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing query' });
  }
});

export default router;
