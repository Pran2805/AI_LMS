import fs from 'fs'
import path from 'path'
import Document from '../models/document.model.js';
import { Pdf } from '../utils/pdf.js';

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
};

const processPdf = async(documentId, filePath) => {
    try {
        // console.log(`Processing PDF: ${filePath}`);
        
        // Check if file exists before processing
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        const {text} = await Pdf.extractText(filePath);
        const chunks = await Pdf.chunkText(text, 500, 50);

        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks,
            status: 'ready',
            processedAt: new Date()
        });
        
        // console.log(`Document ${documentId} processed successfully`);
        
        // Clean up file after successful processing
        try {
            await fs.promises.unlink(filePath);
            console.log(`Cleaned up file: ${filePath}`);
        } catch (unlinkError) {
            console.warn(`Could not delete file ${filePath}:`, unlinkError.message);
        }
        
    } catch (error) {
        console.error(`Error while processing document ${documentId}:`, error.message);
        
        try {
            await Document.findByIdAndUpdate(documentId, {
                status: "failed",
                processingError: error.message,
                processedAt: new Date()
            });
        } catch (updateError) {
            console.error("Failed to update document status:", updateError.message);
        }
    }
}

export const uploadDocument = async(req, res) => {
    let fileDeleted = false;
    
    try {
        // Ensure uploads directory exists
        await ensureUploadsDir();
        
        
        if(!req.file){
            return res.status(400).json({
                success: false,
                message: "Please upload a PDF file"
            });
        }

        const { title } = req.body;

        if(!title){
            try {
                await fs.promises.unlink(req.file.path);
                fileDeleted = true;
                console.log("Deleted file due to missing title");
            } catch(unlinkError) {
                console.error("Could not delete file:", unlinkError.message);
            }
            
            return res.status(400).json({
                success: false,
                message: "Please provide a title"
            });
        }
        
        // Create document WITHOUT userId (or with a dummy value)
        const document = await Document.create({
            // Remove userId or use a valid ObjectId if required by schema
            userId: req.user?._id, // Comment this out
            title,
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            status: 'processing',
            uploadedAt: new Date()
        });

        console.log(`Document created with ID: ${document._id}`);
        
        // Process PDF in background (don't await)
        processPdf(document._id, req.file.path).catch(err => {
            console.error(`Background processing failed for ${document._id}:`, err.message);
        });
        
        return res.status(201).json({
            success: true,
            data: {
                _id: document._id,
                title: document.title,
                fileName: document.fileName,
                status: document.status,
                uploadedAt: document.createdAt
            },
            message: "Document uploaded successfully. Processing in background."
        });
        
    } catch (error) {
        console.error("Upload error:", error.message, error.stack);
        
        // Clean up file on error if not already deleted
        if(req.file && req.file.path && !fileDeleted){
            try {
                await fs.promises.unlink(req.file.path);
                console.log("Deleted file due to upload error");
            } catch(unlinkError) {
                console.error("Could not delete file on upload error:", unlinkError.message);
            }
        }
        
        // Provide more specific error messages
        let errorMessage = "Failed to upload document";
        if (error.name === 'ValidationError') {
            errorMessage = "Validation error: " + Object.values(error.errors).map(e => e.message).join(', ');
        } else if (error.code === 11000) {
            errorMessage = "Duplicate document title";
        }
        
        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find(
            req.user?._id ? { userId: req.user._id } : {}
        ).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        console.error("Get documents error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch documents"
        });
    }
};

export const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error("Get document by ID error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch document"
        });
    }
};

export const updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });
        }

        const document = await Document.findByIdAndUpdate(
            id,
            { title },
            { new: true, runValidators: true }
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: document,
            message: "Document updated successfully"
        });
    } catch (error) {
        console.error("Update document error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update document"
        });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        // delete file if still exists
        if (document.filePath && fs.existsSync(document.filePath)) {
            try {
                await fs.promises.unlink(document.filePath);
            } catch (err) {
                console.warn("File deletion failed:", err.message);
            }
        }

        await Document.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error("Delete document error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete document"
        });
    }
};
