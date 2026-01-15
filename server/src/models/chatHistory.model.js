// optional just for history

import mongoose, { Schema } from "mongoose";

const chatHistorySchema = new Schema({
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
        messages: [{
            role:{
                type: String,
                enum: ["user", "assistant"],
                required: true
            },
            content:{
                type: String,
                required: true
            },
            timestamp:{
                type: Date,
                default: Date.now
            },
            relevantChunks:{
                type: [Number],
                default: []
            }
        }]
},{
    timestamps: true
})

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema)
export default ChatHistory;