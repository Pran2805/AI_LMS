import mongoose, { Schema } from 'mongoose'

// quiz definitely have
// essential
// 1. Questions
// 2. answers
// 3. User associated to it
// 4. Document 

// non essential but required
// title
// difficulty - not required but have in multiple platform

const QuestionSchema = new Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: v => v.length === 4,
            message: "Must have exactly 4 options"
        }
    },
    correctAnswer: {
        type: String,
        required: true,
        max: [1, "Answer could not be corrected more than 1"]
    },
    explanation: {
        type: String,
        default: ""
    },
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "easy"
    }
}, { _id: true })

const UserAnswerSchema = new Schema({
    questionId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    selectedAnswer: {
        type: String,
        required: true,
        max: [1, "Answer cannot be selected more than one"]
    },
    isCorrect: {
        type: Boolean,
        required: true
    },
    answeredAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false })

const QuizSchema = new Schema({
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
    title: {
        type: String,
        required: true,
        trim: true
    },
    questions: {
        type: [QuestionSchema],
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    userAnswers: {
        type: [UserAnswerSchema],
        default: []
    },
    score: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["started", "progress", "completed"],
        default: "started"
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

const Quiz = mongoose.model("Quiz", QuizSchema)
export default Quiz