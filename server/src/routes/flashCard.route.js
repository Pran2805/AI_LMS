import express from "express";
import {
    getAllFlashCardSets,
    getAllFlashCards,
    reviewFlashCard,
    toggleFlashCard,
    deleteFlashCard
} from "../controllers/flashCard.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get all flashcard sets (per document)
router.get(
    "/sets",
    authMiddleware,
    getAllFlashCardSets
);

// Get all flashcards for a document
router.get(
    "/:documentId",
    authMiddleware,
    getAllFlashCards
);

// Review a flashcard
router.patch(
    "/:documentId/:cardId/review",
    authMiddleware,
    reviewFlashCard
);

// Toggle starred flashcard
router.patch(
    "/:documentId/:cardId/toggle",
    authMiddleware,
    toggleFlashCard
);

// Delete a flashcard
router.delete(
    "/:documentId/:cardId",
    authMiddleware,
    deleteFlashCard
);

export default router;
