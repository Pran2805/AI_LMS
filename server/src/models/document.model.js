import mongoose, { Schema } from "mongoose";

const ChunkSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    pageNumber: {
        type: Number,
        default: 0
    },
    chunkIndex: {
        type: Number,
        required: true
    },
    embedding: {
        type: [Number],
        default: []
    }
}, { _id: false })

const DocumentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        // required: true,
        // index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    extractedText: {
        type: String,
        default: ""
    },
    chunks: {
        type: [ChunkSchema],
        default: []
    },
    status: {
        type: String,
        enum: ["processing", "ready", "failed"],
        default: "processing",
        index: true
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

const Document = mongoose.model("Document", DocumentSchema)
export default Document