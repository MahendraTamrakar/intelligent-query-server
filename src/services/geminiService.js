// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in .env");
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Primary & backup models
    this.embeddingModelPrimary = process.env.EMBEDDING_MODEL || "text-embedding-004";
    this.embeddingModelBackup = "text-embedding-002";

    this.textModelPrimary = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    this.textModelBackup = "gemini-1.5-flash";
  }

  /**
   * Get embedding for text using Gemini with failover
   * @param {string} text
   * @returns {Promise<number[]>} Embedding array
   */
  async getEmbedding(text) {
    try {
      return await this._tryEmbedding(this.embeddingModelPrimary, text);
    } catch (err) {
      if (this._isQuotaError(err)) {
        console.warn(
          `⚠️ Embedding quota exceeded on ${this.embeddingModelPrimary}, switching to ${this.embeddingModelBackup}`
        );
        return await this._tryEmbedding(this.embeddingModelBackup, text);
      }
      console.error("❌ Error getting Gemini embedding:", err.message);
      return new Array(768).fill(0);
    }
  }

  async _tryEmbedding(modelName, text) {
    const model = this.genAI.getGenerativeModel({ model: modelName });
    const result = await model.embedContent(text);

    if (!result.embedding || !result.embedding.values) {
      throw new Error(`Invalid embedding response from ${modelName}`);
    }

    return result.embedding.values;
  }

  /**
   * Generate text using Gemini with failover
   * @param {string} prompt
   * @param {number} maxTokens
   * @returns {Promise<string>}
   */
  async generateText(prompt, maxTokens = 150) {
    try {
      return await this._tryGenerate(this.textModelPrimary, prompt, maxTokens);
    } catch (err) {
      if (this._isQuotaError(err)) {
        console.warn(
          `⚠️ Text generation quota exceeded on ${this.textModelPrimary}, switching to ${this.textModelBackup}`
        );
        return await this._tryGenerate(this.textModelBackup, prompt, maxTokens);
      }
      console.error("❌ Error generating text with Gemini:", err.message);
      return "Unable to generate response.";
    }
  }

  async _tryGenerate(modelName, prompt, maxTokens) {
    const model = this.genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.3,
      },
    });

    if (!result.response || !result.response.text) {
      throw new Error(`Invalid text generation response from ${modelName}`);
    }

    return result.response.text();
  }

  /**
   * Detect quota/limit errors
   */
  _isQuotaError(err) {
    return (
      err.message &&
      (err.message.includes("429 Too Many Requests") ||
        err.message.includes("quota") ||
        err.message.includes("exceeded"))
    );
  }
}

export default GeminiService;
