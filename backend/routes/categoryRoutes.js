import express from 'express';
import CategoryController from '../controllers/categoryController.js';

const router = express.Router();

// GET /api/categories
router.get('/', CategoryController.getAllCategories);

// POST /api/categories
router.post('/', CategoryController.createCategory);

// PUT /api/categories/:id
router.put('/:id', CategoryController.updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', CategoryController.deleteCategory);

export default router;
