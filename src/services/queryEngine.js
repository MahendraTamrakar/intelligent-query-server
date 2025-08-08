/* import VectorStore from '../services/vectoreStore.js';
import GeminiService from './geminiService.js';
import QueryLog from '../models/queryLog.js';

class QueryEngine {
  constructor() {
    this.vectorStore = new VectorStore();
    this.geminiService = new GeminiService();
  }

  async processQuery(query, maxResults = 5, similarityThreshold = 0.7, documentIds = null) {
    const start = Date.now();

    const similarChunks = await this.vectorStore.searchSimilarChunks(
      query, maxResults, similarityThreshold, documentIds
    );

    let explanation = null;
    if (similarChunks.length) {
      explanation = await this.generateExplanation(query, similarChunks.slice(0, 3));
    }

    await QueryLog.create({
      queryText: query,
      documentIds,
      resultsCount: similarChunks.length,
      processingTime: (Date.now() - start) / 1000,
      similarityThreshold
    });

    return {
      query,
      results: similarChunks,
      totalResults: similarChunks.length,
      explanation
    };
  }

  async generateExplanation(query, topChunks) {
    const context = topChunks.map(
      (c, i) => `Result ${i + 1} (Score: ${c.similarityScore.toFixed(3)}):\n${c.chunk.content.slice(0, 500)}...`
    ).join('\n\n');

    const prompt = `Query: "${query}"\n\nSearch Results:\n${context}\n\nProvide a 2-3 sentence explanation.`;
    return await this.geminiService.generateText(prompt, 150);
  }
}

export default QueryEngine;
 */

// src/services/queryEngine.js
import VectorStore from "../services/vectoreStore.js";
import GeminiService from "./geminiService.js";
import QueryLog from "../models/queryLog.js";

class QueryEngine {
  constructor() {
    this.vectorStore = new VectorStore();
    this.geminiService = new GeminiService();
  }

  async processQuery(query, maxResults = 5, similarityThreshold = 0.7, documentIds = null) {
    const start = Date.now();

    // 1️⃣ Get similar chunks
    const similarChunks = await this.vectorStore.searchSimilarChunks(
      query,
      maxResults,
      similarityThreshold,
      documentIds
    );

    // 2️⃣ Build context for Gemini
    let answers = [];
    if (similarChunks.length) {
      const context = similarChunks
        .map((c, i) => `Context ${i + 1}:\n${c.chunk.content}`)
        .join("\n\n");

      const prompt = `Answer the following question **based only** on the provided context. 
If the answer is not present, say "No relevant answer found".

Question: "${query}"

Context:
${context}

Answer:`;

      const answer = await this.geminiService.generateText(prompt, 200);
      answers.push(answer.trim());
    } else {
      answers.push("No relevant answer found.");
    }

    // 3️⃣ Log
    await QueryLog.create({
      queryText: query,
      documentIds,
      resultsCount: similarChunks.length,
      processingTime: (Date.now() - start) / 1000,
      similarityThreshold
    });

    // 4️⃣ Return with answers
    return {
      query,
      answers, // ✅ This is now always an array
      totalResults: similarChunks.length
    };
  }
}

export default QueryEngine;
