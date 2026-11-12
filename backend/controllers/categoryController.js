import { Category, Client } from '../models/index.js';

/**
 * Business Category Controller
 */
class CategoryController {
  /**
   * List all business categories (with associated business count)
   * GET /api/categories
   */
  static async getAllCategories(req, res) {
    try {
      const categories = await Category.getAll();
      res.json({
        total: categories.length,
        categories
      });
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Failed to fetch categories: ' + err.message });
    }
  }

  /**
   * Create new category
   * POST /api/categories
   */
  static async createCategory(req, res) {
    try {
      const { name, label, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required.' });
      }

      const existing = await Category.findByName(name.trim());
      if (existing) {
        return res.status(400).json({ error: `Category "${name.trim()}" already exists.` });
      }

      const newCategory = await Category.insert({
        name: name.trim(),
        label: (label && label.trim()) || name.trim(),
        description: description ? description.trim() : null
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category: newCategory
      });
    } catch (err) {
      console.error('Error creating category:', err);
      res.status(500).json({ error: 'Failed to create category: ' + err.message });
    }
  }

  /**
   * Update category
   * PUT /api/categories/:id
   */
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, label, description } = req.body;

      const existing = await Category.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Category not found.' });
      }

      if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await Category.findByName(name.trim());
        if (duplicate && duplicate.id !== id) {
          return res.status(400).json({ error: `Category "${name.trim()}" already exists.` });
        }
      }

      const updated = await Category.update(id, {
        name: name ? name.trim() : undefined,
        label: label ? label.trim() : undefined,
        description: description !== undefined ? description : undefined
      });

      res.json({
        success: true,
        message: 'Category updated successfully',
        category: updated
      });
    } catch (err) {
      console.error('Error updating category:', err);
      res.status(500).json({ error: 'Failed to update category: ' + err.message });
    }
  }

  /**
   * Delete category (with active assignment guard)
   * DELETE /api/categories/:id
   */
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const existing = await Category.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Category not found.' });
      }

      // Check if any clients are using this category
      const clients = await Client.getAll();
      const matchingClients = clients.filter(c => c.businessType && c.businessType.toLowerCase() === existing.name.toLowerCase());
      if (matchingClients.length > 0) {
        return res.status(400).json({
          error: `Cannot delete category "${existing.name}". It is currently assigned to ${matchingClients.length} business(es). Please reassign them first.`
        });
      }

      await Category.delete(id);
      res.json({
        success: true,
        message: `Category "${existing.name}" deleted successfully.`
      });
    } catch (err) {
      console.error('Error deleting category:', err);
      res.status(500).json({ error: 'Failed to delete category: ' + err.message });
    }
  }
}

export { CategoryController };
export default CategoryController;
