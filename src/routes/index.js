import express from 'express';
import AppController from '../controller/AppController.js';
import services from '../services/index.js';

const router = express.Router();

// Initialize controller with all services
const appController = new AppController(services);

// WhatsApp webhook routes
router.get('/whatsapp/webhook', appController.verifyWebhook);
router.post('/whatsapp/webhook', appController.receiveAndReply);
router.post('/chat', appController.chat);

export default router;