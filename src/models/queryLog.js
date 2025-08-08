import mongoose from 'mongoose';

const QueryLogSchema = new mongoose.Schema({
  queryText: { type: String, required: true },
  queryType: { type: String, default: 'semantic' },
  documentIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Document' },
  resultsCount: { type: Number },
  processingTime: { type: Number },
  similarityThreshold: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('QueryLog', QueryLogSchema);
