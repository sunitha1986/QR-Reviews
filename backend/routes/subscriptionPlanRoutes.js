import express from 'express';
import SubscriptionPlanController from '../controllers/subscriptionPlanController.js';

const router = express.Router();

// GET /api/subscription-plans
router.get('/', SubscriptionPlanController.getAllPlans);

// GET /api/subscription-plans/:id
router.get('/:id', SubscriptionPlanController.getPlanById);

// POST /api/subscription-plans
router.post('/', SubscriptionPlanController.createPlan);

// PUT /api/subscription-plans/:id
router.put('/:id', SubscriptionPlanController.updatePlan);

// PUT /api/subscription-plans/:id/default
router.put('/:id/default', SubscriptionPlanController.setDefaultPlan);

// PUT /api/subscription-plans/:id/landing
router.put('/:id/landing', SubscriptionPlanController.toggleLandingPlan);

// DELETE /api/subscription-plans/:id
router.delete('/:id', SubscriptionPlanController.deletePlan);

export default router;

