import mongoose, { Schema } from "mongoose";

const flashCardSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    documentId: {
        type: Schema.Types.ObjectId,
        ref: "Document",
        required: true,
        index: true
    },
    cards: [
        {
            question: {
                type: String,
                required: true
            },
            answer: {
                type: String,
                required: true
            },
            difficulty: {
                type: String,
                enum: ["easy", "medium", "hard"],
                default: "easy"
            },
            lastReviewed: {
                type: Date,
                default: null
            },
            reviewCount: {
                type: Number,
                default: 0
            },
            isStarred: {
                type: Boolean,
                default: false
            }
        }
    ]
}, {
    timestamps: true
})

const FlashCard = mongoose.model("FlashCard", flashCardSchema)
export default FlashCard;