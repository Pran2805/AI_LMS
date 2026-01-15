import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse'

export class Pdf {

    static async extractText(filePath) {
        try {
            // console.log("filePath", filePath)
            const dataBuffer = await fs.readFile(filePath)
            // console.log("bufferData", dataBuffer)

            const parser = new PDFParse({url: filePath});
            // console.log("parser", parser)
            const data = await parser.getText()
            // console.log("data",data)

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

        // Split by paragraphs while preserving content
        const paragraphs = cleanedText.split(/\n+/).filter(p => p.trim().length > 0);
        const chunks = [];
        let currentChunk = [];
        let currentWordCount = 0;
        let chunkIndex = 0;

        for (const paragraph of paragraphs) {
            const paragraphText = paragraph.trim();
            const paragraphWords = paragraphText.split(/\s+/);
            const paragraphWordsCount = paragraphWords.length;

            // Handle very long paragraphs by splitting them
            if (paragraphWordsCount > chunkSize) {
                // If we have an existing chunk, save it first
                if (currentChunk.length > 0) {
                    chunks.push({
                        content: currentChunk.join('\n\n'),
                        chunkIndex: chunkIndex++,
                        pageNumber: 0
                    });
                    currentChunk = [];
                    currentWordCount = 0;
                }

                // Split the long paragraph into chunks
                for (let i = 0; i < paragraphWords.length; i += (chunkSize - overlap)) {
                    const chunkWords = paragraphWords.slice(i, Math.min(i + chunkSize, paragraphWords.length));
                    if (chunkWords.length === 0) continue;

                    chunks.push({
                        content: chunkWords.join(" "),
                        chunkIndex: chunkIndex++,
                        pageNumber: 0
                    });
                    if (i + chunkSize >= paragraphWords.length) break;
                }
                continue;
            }

            // Handle normal paragraph adding to current chunk
            if (currentWordCount + paragraphWordsCount > chunkSize && currentChunk.length > 0) {
                // Save current chunk
                chunks.push({
                    content: currentChunk.join('\n\n'),
                    chunkIndex: chunkIndex++,
                    pageNumber: 0
                });

                // Get overlap from previous chunk
                const lastChunkText = currentChunk.join(" ");
                const lastWords = lastChunkText.split(/\s+/);
                const overlapWords = lastWords.slice(-Math.min(overlap, lastWords.length));

                // Start new chunk with overlap
                currentChunk = [overlapWords.join(" "), paragraphText];
                currentWordCount = overlapWords.length + paragraphWordsCount;
            } else {
                // Add paragraph to current chunk
                currentChunk.push(paragraphText);
                currentWordCount += paragraphWordsCount;
            }
        }

        // Add any remaining text in currentChunk
        if (currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join('\n\n'),
                chunkIndex: chunkIndex++,
                pageNumber: 0
            });
        }

        // Fallback: if no chunks were created but we have text, split by words
        if (chunks.length === 0 && cleanedText.length > 0) {
            const allWords = cleanedText.split(/\s+/);
            for (let i = 0; i < allWords.length; i += (chunkSize - overlap)) {
                const chunkWords = allWords.slice(i, Math.min(i + chunkSize, allWords.length));
                if (chunkWords.length === 0) continue;

                chunks.push({
                    content: chunkWords.join(' '),
                    chunkIndex: chunkIndex++,
                    pageNumber: 0
                });
                if (i + chunkSize >= allWords.length) break;
            }
        }

        return chunks;
    }

   static findRelevantChunks = async (chunks, query, maxChunks = 3) => {
    if (!chunks || chunks.length === 0 || !query) {
        return [];
    }

    const stopWords = new Set([
        // Common English stop words
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'about', 'like', 'through', 'over', 'before', 'between', 'after', 'since', 'without',
        'under', 'within', 'along', 'following', 'across', 'behind', 'beyond', 'plus', 'except',
        'but', 'up', 'down', 'off', 'above', 'near', 'from', 'is', 'are', 'was', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'can',
        'could', 'shall', 'should', 'will', 'would', 'may', 'might', 'must', 'that', 'this',
        'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ours', 'ourselves',
        'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
        'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
        'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'whose', 'when', 'where',
        'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
        'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
        's', 't', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y'
    ]);

    const queryWords = query
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .filter((word, index, self) => self.indexOf(word) === index); // Remove duplicates

    if (queryWords.length === 0) {
        return chunks.slice(0, Math.min(maxChunks, chunks.length)).map(chunk => ({
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            _id: chunk._id
        }));
    }

    const scoredChunks = chunks.map((chunk, index) => {
        const content = chunk.content.toLowerCase();
        const contentWords = content.split(/\s+/).length;
        let score = 0;
        
        // Track unique words found for density calculation
        const uniqueWordsFound = new Set();
        
        // Score each query word
        for (const word of queryWords) {
            // Create regex for exact word match (word boundaries)
            const exactRegex = new RegExp(`\\b${word}\\b`, 'g');
            const partialRegex = new RegExp(word, 'g');
            
            // Count exact matches
            const exactMatches = (content.match(exactRegex) || []).length;
            score += exactMatches * 3;
            
            // Count partial matches (excluding exact matches)
            const allMatches = (content.match(partialRegex) || []).length;
            const partialMatches = Math.max(0, allMatches - exactMatches);
            score += partialMatches * 1.5;
            
            // Track if word was found
            if (exactMatches > 0 || partialMatches > 0) {
                uniqueWordsFound.add(word);
            }
        }
        
        // Calculate query word coverage
        const coverageScore = queryWords.length > 0 
            ? (uniqueWordsFound.size / queryWords.length) * 2 
            : 0;
        score += coverageScore;
        
        // Normalize by chunk length to avoid bias toward longer chunks
        const normalizedScore = contentWords > 0 ? score / Math.sqrt(contentWords) : 0;
        
        // Bonus for chunks that contain all query words
        const allWordsBonus = uniqueWordsFound.size === queryWords.length ? 2 : 0;
        
        const finalScore = normalizedScore + allWordsBonus;
        
        return {
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            _id: chunk._id,
            score: finalScore,
            originalIndex: index // Keep track of original position for tie-breaking
        };
    });

    // Sort chunks by score (descending), with tie-breaking by original position
    scoredChunks.sort((a, b) => {
        if (Math.abs(a.score - b.score) < 0.0001) {
            // If scores are essentially equal, maintain original order
            return a.originalIndex - b.originalIndex;
        }
        return b.score - a.score;
    });

    // Get top chunks
    const topChunks = scoredChunks
        .slice(0, Math.min(maxChunks, scoredChunks.length))
        .map(chunk => ({
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            _id: chunk._id,
            score: chunk.score // Optionally include score if needed
        }));

    // If we have very low scores, fall back to first chunks
    const scoreThreshold = 0.1;
    const lowScoringChunks = topChunks.filter(chunk => chunk.score < scoreThreshold);
    if (lowScoringChunks.length === topChunks.length && chunks.length > 0) {
        return chunks.slice(0, Math.min(maxChunks, chunks.length)).map(chunk => ({
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            _id: chunk._id
        }));
    }

    // Return chunks sorted by original chunk index for better readability
    return topChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
}
}