import express from "express";
import {
    getAllFlashCardSets,
    getAllFlashCards,
    reviewFlashCard,
    toggleFlashCard,
    deleteFlashCard
} from "../controllers/flashCard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get all flashcard sets (per document)
router.get(
    "/sets",
    protect,
    getAllFlashCardSets
);

// Get all flashcards for a document
router.get(
    "/:documentId",
    protect,
    getAllFlashCards
);

// Review a flashcard
router.patch(
    "/:documentId/:cardId/review",
    protect,
    reviewFlashCard
);

// Toggle starred flashcard
router.patch(
    "/:documentId/:cardId/toggle",
    protect,
    toggleFlashCard
);

// Delete a flashcard
router.delete(
    "/:documentId/:cardId",
    protect,
    deleteFlashCard
);

export default router;
