import SubscriptionPlan from '../models/SubscriptionPlan.js';

class SubscriptionPlanController {
  /**
   * GET /api/subscription-plans
   * Supports ?activeOnly=true or ?landingOnly=true
   */
  static async getAllPlans(req, res) {
    try {
      const landingOnly = req.query.landingOnly === 'true' || req.query.landing === 'true';
      const activeOnly = req.query.activeOnly === 'true' || req.query.active === 'true';

      let plans = [];
      if (landingOnly) {
        plans = await SubscriptionPlan.getLandingPlans();
      } else if (activeOnly) {
        plans = await SubscriptionPlan.getActive();
      } else {
        plans = await SubscriptionPlan.getAll();
      }

      res.json({
        success: true,
        count: plans.length,
        plans
      });
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      res.status(500).json({ error: 'Failed to retrieve subscription plans', details: err.message });
    }
  }

  /**
   * GET /api/subscription-plans/:id
   */
  static async getPlanById(req, res) {
    try {
      const plan = await SubscriptionPlan.findById(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }
      res.json({ success: true, plan });
    } catch (err) {
      console.error('Error fetching plan by ID:', err);
      res.status(500).json({ error: 'Failed to fetch plan', details: err.message });
    }
  }

  /**
   * POST /api/subscription-plans
   */
  static async createPlan(req, res) {
    try {
      const { name, tagline, price, billingCycle, periodLabel, description, badge, features, hardwareIncluded, isDefault, isActive, displayOrder } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Plan name is required' });
      }

      const existing = await SubscriptionPlan.findByName(name.trim());
      if (existing) {
        return res.status(400).json({ error: `A subscription plan named "${name.trim()}" already exists` });
      }

      const newPlan = await SubscriptionPlan.insert({
        name: name.trim(),
        tagline,
        price,
        billingCycle,
        periodLabel,
        description,
        badge,
        features,
        hardwareIncluded,
        isDefault,
        isActive,
        displayOrder
      });

      res.status(201).json({
        success: true,
        message: `Subscription plan "${newPlan.name}" created successfully`,
        plan: newPlan
      });
    } catch (err) {
      console.error('Error creating plan:', err);
      res.status(500).json({ error: 'Failed to create subscription plan', details: err.message });
    }
  }

  /**
   * PUT /api/subscription-plans/:id
   */
  static async updatePlan(req, res) {
    try {
      const { id } = req.params;
      const existing = await SubscriptionPlan.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }

      if (req.body.name && req.body.name.trim() !== existing.name) {
        const nameDuplicate = await SubscriptionPlan.findByName(req.body.name.trim());
        if (nameDuplicate && nameDuplicate.id !== id) {
          return res.status(400).json({ error: `Another plan named "${req.body.name.trim()}" already exists` });
        }
      }

      const updated = await SubscriptionPlan.update(id, req.body);
      res.json({
        success: true,
        message: `Plan "${updated.name}" updated successfully`,
        plan: updated
      });
    } catch (err) {
      console.error('Error updating plan:', err);
      res.status(500).json({ error: 'Failed to update plan', details: err.message });
    }
  }

  /**
   * PUT /api/subscription-plans/:id/default
   */
  static async setDefaultPlan(req, res) {
    try {
      const { id } = req.params;
      const plan = await SubscriptionPlan.findById(id);
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }

      const updated = await SubscriptionPlan.setDefault(id);
      res.json({
        success: true,
        message: `Plan "${updated.name}" set as system default opt-in plan`,
        plan: updated
      });
    } catch (err) {
      console.error('Error setting default plan:', err);
      res.status(500).json({ error: 'Failed to set default plan', details: err.message });
    }
  }

  /**
   * PUT /api/subscription-plans/:id/landing
   */
  static async toggleLandingPlan(req, res) {
    try {
      const { id } = req.params;
      const plan = await SubscriptionPlan.findById(id);
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }

      const updated = await SubscriptionPlan.toggleLandingPage(id);
      res.json({
        success: true,
        message: updated.showOnLandingPage
          ? `Plan "${updated.name}" is now featured on the public Landing Page.`
          : `Plan "${updated.name}" is now hidden from the Landing Page.`,
        plan: updated
      });
    } catch (err) {
      console.error('Error toggling landing page plan:', err);
      res.status(400).json({ error: err.message || 'Failed to update landing page status' });
    }
  }

  /**
   * DELETE /api/subscription-plans/:id
   */
  static async deletePlan(req, res) {
    try {
      const { id } = req.params;
      await SubscriptionPlan.delete(id);
      res.json({
        success: true,
        message: 'Subscription plan deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting plan:', err);
      res.status(400).json({ error: err.message || 'Failed to delete plan' });
    }
  }
}

export default SubscriptionPlanController;

