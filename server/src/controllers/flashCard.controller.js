import FlashCard from "../models/flashCard.model.js";
import mongoose from "mongoose";

export const getAllFlashCardSets = async (req, res) => {
    try {
        const sets = await FlashCard.find({ userId: req.user.id })
            .select("documentId cards.createdAt createdAt");

        res.status(200).json(sets);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch flashcard sets" });
    }
};

/**
 * GET all flashcards for a specific document
 */
export const getAllFlashCards = async (req, res) => {
    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        return res.status(400).json({ message: "Invalid documentId" });
    }

    try {
        const flashCards = await FlashCard.findOne({
            userId: req.user.id,
            documentId
        });

        if (!flashCards) {
            return res.status(404).json({ message: "Flashcards not found" });
        }

        res.status(200).json(flashCards.cards);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch flashcards" });
    }
};

/**
 * Review a flashcard
 * - updates lastReviewed
 * - increments reviewCount
 * - optionally updates difficulty
 */
export const reviewFlashCard = async (req, res) => {
    const { documentId, cardId } = req.params;
    const { difficulty } = req.body;

    try {
        const flashCardSet = await FlashCard.findOne({
            userId: req.user.id,
            documentId
        });

        if (!flashCardSet) {
            return res.status(404).json({ message: "Flashcard set not found" });
        }

        const card = flashCardSet.cards.id(cardId);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        card.lastReviewed = new Date();
        card.reviewCount += 1;

        if (difficulty) {
            card.difficulty = difficulty;
        }

        await flashCardSet.save();
        res.status(200).json(card);
    } catch (err) {
        res.status(500).json({ message: "Failed to review flashcard" });
    }
};

/**
 * Toggle starred status of a flashcard
 */
export const toggleFlashCard = async (req, res) => {
    const { documentId, cardId } = req.params;

    try {
        const flashCardSet = await FlashCard.findOne({
            userId: req.user.id,
            documentId
        });

        if (!flashCardSet) {
            return res.status(404).json({ message: "Flashcard set not found" });
        }

        const card = flashCardSet.cards.id(cardId);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        card.isStarred = !card.isStarred;

        await flashCardSet.save();
        res.status(200).json(card);
    } catch (err) {
        res.status(500).json({ message: "Failed to toggle flashcard" });
    }
};

/**
 * Delete a flashcard from a document
 */
export const deleteFlashCard = async (req, res) => {
    const { documentId, cardId } = req.params;

    try {
        const flashCardSet = await FlashCard.findOne({
            userId: req.user.id,
            documentId
        });

        if (!flashCardSet) {
            return res.status(404).json({ message: "Flashcard set not found" });
        }

        const card = flashCardSet.cards.id(cardId);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        card.remove();
        await flashCardSet.save();

        res.status(200).json({ message: "Flashcard deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete flashcard" });
    }
};
