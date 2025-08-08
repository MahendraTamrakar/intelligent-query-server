// src/routes/hackrxRoutes.js
import express from "express";
import fetch from "node-fetch";
import { DocumentProcessor } from "../services/documentProcessor.js";
import VectorStore from "../services/vectoreStore.js";
import QueryEngine from "../services/queryEngine.js";

const router = express.Router();
const processor = new DocumentProcessor();
const vectorStore = new VectorStore();
const queryEngine = new QueryEngine();

/**
 * POST /hackrx/run
 * Body: { documents: "PDF_URL", questions: ["Q1", "Q2", ...] }
 */
router.post("/run", async (req, res) => {
  try {
    const { documents, questions } = req.body;

    if (!documents || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: "Missing documents or questions array" });
    }

    // 1️⃣ Download PDF from URL
    const pdfResponse = await fetch(documents);
    if (!pdfResponse.ok) throw new Error("Failed to fetch document from URL");
    const fileBuffer = await pdfResponse.buffer();

    // 2️⃣ Process document (split into chunks + embeddings)
    const { document, chunks } = await processor.processDocument(
      fileBuffer,
      "uploaded.pdf",
      "application/pdf"
    );

    await vectorStore.addDocumentChunks(chunks);

    // 3️⃣ For each question → get an answer
    const answers = [];
    for (const question of questions) {
      const result = await queryEngine.processQuery(question, 5, 0.7);
      // We expect result.answers to be array → take the first
      answers.push(result.answers[0] || "No relevant answer found.");
    }

    // 4️⃣ Return in required format
    return res.json({ answers });
  } catch (err) {
    console.error("❌ /hackrx/run error:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

export default router;
