import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import pdfParse from 'pdf-parse';
import { Document as DocxDocument } from 'docx4js';
import * as EmailParser from 'mailparser';
import DocumentModel from '../models/document.js';
import DocumentChunk from '../models/documentChunk.js';
import { settings } from '../config/settings.js';
import { chunkTextBySentences } from '../utils/helpers.js';

export class DocumentProcessor {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    fs.mkdir(this.uploadDir, { recursive: true });
  }

  async processDocument(fileBuffer, filename, contentType) {
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const uniqueFilename = `${fileHash}_${filename}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);
    await fs.writeFile(filePath, fileBuffer);

    const document = await DocumentModel.create({
      filename: uniqueFilename,
      filePath,
      fileType: this.getDocumentType(filename, contentType),
      fileSize: fileBuffer.length
    });

    const text = await this.extractText(filePath, document.fileType);
    const chunks = chunkTextBySentences(text, settings.CHUNK_SIZE);

    const chunkDocs = await DocumentChunk.insertMany(
      chunks.map((c, i) => ({
        documentId: document._id,
        chunkIndex: i,
        content: c
      }))
    );

    return { document, chunks: chunkDocs };
  }

  getDocumentType(filename, contentType) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf' || contentType.includes('pdf')) return 'pdf';
    if (ext === '.docx' || contentType.includes('word')) return 'docx';
    if (ext === '.txt' || contentType.includes('text')) return 'txt';
    if (ext === '.eml' || contentType.includes('rfc822')) return 'email';
    return 'txt';
  }

  async extractText(filePath, docType) {
    if (docType === 'pdf') {
      const data = await pdfParse(await fs.readFile(filePath));
      return data.text;
    }
    if (docType === 'docx') {
      const doc = await DocxDocument.load(filePath);
      return doc.getFullText();
    }
    if (docType === 'txt') {
      return (await fs.readFile(filePath, 'utf8')).toString();
    }
    if (docType === 'email') {
      const mail = await EmailParser.simpleParser(await fs.readFile(filePath));
      return `${mail.subject}\n${mail.from.text}\n${mail.to.text}\n${mail.text}`;
    }
    return '';
  }
}
