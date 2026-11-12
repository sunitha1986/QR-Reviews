import express from 'express';
import ClientController from '../controllers/clientController.js';
import AuthController from '../controllers/authController.js';

const router = express.Router();

// POST /api/clients/onboard
router.post('/onboard', ClientController.onboardClient);

// GET /api/clients
router.get('/', ClientController.getAllClients);

// POST /api/clients/verify-unlock
router.post('/verify-unlock', AuthController.verifyUnlock);

// POST /api/clients/change-password
router.post('/change-password', AuthController.changePassword);

// DELETE /api/clients/all (Must be before /:clientId)
router.delete('/all', ClientController.removeAllClients);

// GET /api/clients/:clientId
router.get('/:clientId', ClientController.getClientById);

// GET /api/clients/:clientId/keywords
router.get('/:clientId/keywords', ClientController.getClientKeywords);

// PUT /api/clients/:clientId/keywords
router.put('/:clientId/keywords', ClientController.updateClientKeywords);

// PUT /api/clients/:clientId
router.put('/:clientId', ClientController.updateClient);

// DELETE /api/clients/:clientId
router.delete('/:clientId', ClientController.deleteClientById);

export default router;
