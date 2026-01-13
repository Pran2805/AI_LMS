import fs from 'fs'
import { PDFParse } from 'pdf-parse'

export class Pdf {

    static async extractText(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath)
            // pdf parse expects a uint8array not a buffer
            const parser = new PDFParse(new Uint8Array(dataBuffer));
            const data = await parser.getText()

            return {
                text: data.text,
                numPages: data.numpages,
                info: data.info
            }
        } catch (error) {
            console.error("PDF Parsing error", error)
            throw new Error("Failed to extract text from PDF")
        }
    }

    // AI generated if work fine then okay otherwise do some changes as we need
    static async chunkText(text, chunkSize = 500, overlap = 50) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const cleanedText = text.trim();
    if (cleanedText.length === 0) {
        return [];
    }

    // Split by paragraphs while preserving empty paragraphs for better context
    const paragraphs = cleanedText.split(/\n+/);
    const chunks = [];
    let currentChunk = [];
    let currentWordCount = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();
        if (trimmedParagraph.length === 0) {
            // Add empty paragraphs as separators to preserve structure
            if (currentChunk.length > 0) {
                currentChunk.push('');
            }
            continue;
        }

        const wordCount = trimmedParagraph.split(/\s+/).length;

        // If adding this paragraph would exceed chunk size (and we already have content)
        if (currentWordCount > 0 && currentWordCount + wordCount > chunkSize) {
            // Save current chunk
            const chunkText = currentChunk.join(" ").trim();
            if (chunkText) {
                chunks.push({
                    content: chunkText,
                    chunkIndex: chunkIndex++
                });
            }

            // Calculate overlap from the end of the previous chunk
            if (overlap > 0 && chunkText) {
                const allWords = chunkText.split(/\s+/);
                const overlapWords = allWords.slice(-Math.min(overlap, allWords.length));
                
                // Preserve paragraph structure for overlap
                const lastParagraphs = currentChunk.slice(-3); // Take last few paragraphs
                currentChunk = lastParagraphs.map(p => p.trim()).filter(p => p.length > 0);
                currentWordCount = currentChunk.reduce((sum, p) => sum + p.split(/\s+/).length, 0);
                
                // If overlap words from a single paragraph, ensure we have complete sentences
                if (overlapWords.length < 20 && currentChunk.length === 1) {
                    const sentences = currentChunk[0].split(/[.!?]+/);
                    if (sentences.length > 1) {
                        currentChunk[0] = sentences.slice(-2).join('. ') + '.';
                        currentWordCount = currentChunk[0].split(/\s+/).length;
                    }
                }
            } else {
                currentChunk = [];
                currentWordCount = 0;
            }
        }

        // Add current paragraph
        currentChunk.push(trimmedParagraph);
        currentWordCount += wordCount;
    }

    // Add any remaining content
    if (currentChunk.length > 0) {
        const chunkText = currentChunk.join(" ").trim();
        if (chunkText) {
            chunks.push({
                content: chunkText,
                chunkIndex
            });
        }
    }

    return chunks;
}
}