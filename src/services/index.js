import FAQService from './faq/FAQService.js';
import WhatsAppService from './whatsapp/WhatsAppService.js';
import GeminiService from './ai/GeminiService.js';

// Initialize services
const geminiService = new GeminiService();
const faqService = new FAQService(geminiService);
const whatsappService = new WhatsAppService();

export default {
  faqService,
  whatsappService,
  geminiService
};