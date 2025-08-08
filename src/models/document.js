/* import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  chunks: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Document', documentSchema);
 */

import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Document', DocumentSchema);
