import mongoose from 'mongoose';

const DocumentChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  chunkIndex: { type: Number, required: true },
  content: { type: String, required: true },
  embedding: { type: [Number], default: [] },
  similarityScore: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('DocumentChunk', DocumentChunkSchema);
