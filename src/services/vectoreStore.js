import { Pinecone } from '@pinecone-database/pinecone';
import GeminiService from './geminiService.js';
import DocumentChunk from '../models/documentChunk.js';
import { settings } from '../config/settings.js';

class VectorStore {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: settings.PINECONE_API_KEY,
    });
    this.index = this.pinecone.index(settings.PINECONE_INDEX);
    this.geminiService = new GeminiService();
  }

  async getEmbedding(text) {
    return await this.geminiService.getEmbedding(text);
  }

  async addDocumentChunks(chunks) {
    const vectors = [];
    for (const chunk of chunks) {
      const embedding = await this.getEmbedding(chunk.content);
      vectors.push({
        id: chunk._id.toString(),
        values: embedding,
        metadata: {
          documentId: chunk.documentId.toString(),
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
        }
      });
      chunk.embedding = embedding;
      await chunk.save();
    }
    if (vectors.length) {
      await this.index.upsert(vectors);
    }
  }

  async searchSimilarChunks(query, k = 5, similarityThreshold = 0.7, documentIds = null) {
    const queryEmbedding = await this.getEmbedding(query);

    const searchResults = await this.index.query({
      vector: queryEmbedding,
      topK: k * 2,
      includeMetadata: true
    });

    const filtered = searchResults.matches
      .filter(m => m.score >= similarityThreshold)
      .filter(m => !documentIds || documentIds.includes(m.metadata.documentId));

    const chunks = await DocumentChunk.find({
      _id: { $in: filtered.map(m => m.id) }
    });

    return filtered.map(match => {
      const chunk = chunks.find(c => c._id.toString() === match.id);
      return { chunk, similarityScore: match.score };
    });
  }

  async removeDocumentChunks(documentId) {
    const chunks = await DocumentChunk.find({ documentId });
    const ids = chunks.map(c => c._id.toString());
    if (ids.length) {
      await this.index.deleteMany(ids);
      await DocumentChunk.deleteMany({ documentId });
    }
  }
}

export default VectorStore;
