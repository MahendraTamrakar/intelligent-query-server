import dotenv from 'dotenv';
dotenv.config();

export const settings = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: 'gemini-1.5-pro',
  EMBEDDING_MODEL: 'text-embedding-004',
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_ENV: process.env.PINECONE_ENV,
  PINECONE_INDEX: process.env.PINECONE_INDEX,
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '1000'),
};
