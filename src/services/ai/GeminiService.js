import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config/environment.js';

class GeminiService {
  constructor() {
    if (!config.gemini.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not set. AI features will be disabled.');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log('✅ GeminiService initialized with gemini-2.5-flash');
    }
  }

  /**
   * Generate response based on FAQ context and user message
   * @param {Array} faqs - Array of FAQ objects with topic, answer, and category
   * @param {string} userMessage - The user's question/message
   * @returns {Promise<string>} AI-generated response
   */
  async generateFAQResponse(faqs, userMessage) {
    if (!this.model) {
      throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY in environment variables.');
    }

    try {
      console.log('🤖 Generating AI response for:', userMessage);

      // Build the FAQ context with categories
      const faqContext = faqs.map(faq => 
        `[${faq.category}]\nTopic: ${faq.topic}\nAnswer: ${faq.answer}`
      ).join('\n\n');

      // Create the enhanced prompt
      const prompt = `Kamu adalah asisten customer service Al Izhar School yang membantu menjawab pertanyaan tentang Penerimaan Siswa Baru (PSB) dalam Bahasa Indonesia.

Berikut adalah database FAQ (Frequently Asked Questions) yang tersedia untuk semua jenjang pendidikan:

${faqContext}

Pertanyaan pelanggan: "${userMessage}"

Instruksi:
1. Analisis pertanyaan pelanggan dengan cermat untuk menentukan jenjang pendidikan yang ditanyakan (KB, TK, SD, SMP, atau SMA)
2. Cari jawaban yang paling relevan dari FAQ di atas sesuai dengan jenjang yang ditanyakan
3. Jika pertanyaan tidak menyebutkan jenjang spesifik namun bersifat umum, berikan jawaban yang mencakup semua jenjang yang relevan
4. Jika ada jawaban yang cocok, berikan jawaban tersebut dengan cara yang natural, ramah, dan profesional
5. Jika pertanyaan tidak ada dalam FAQ, jawab dengan sopan: "Maaf, informasi tersebut belum tersedia dalam database kami. Untuk informasi lebih lanjut, silakan hubungi customer service Al Izhar School atau kunjungi website https://psb.alizhar.sch.id/"
6. Gunakan bahasa yang sopan, profesional, dan mudah dipahami
7. Jangan menambahkan atau mengarang informasi yang tidak ada dalam FAQ
8. Berikan jawaban yang to-the-point namun lengkap
9. Jika menyebutkan biaya, pastikan menyebutkan jenjang pendidikan yang dimaksud
10. Selalu sebutkan kategori jenjang pendidikan saat memberikan jawaban spesifik (misal: "Untuk KB Al Izhar..." atau "Untuk jenjang SMP...")

Format jawaban:
- Gunakan paragraf yang rapi
- Gunakan bullet points jika ada beberapa poin penting
- Sertakan emoji yang relevan untuk membuat jawaban lebih friendly (📚, 📅, 💰, 📝, dll)
- Akhiri dengan kalimat ramah yang mengajak untuk bertanya lebih lanjut jika perlu

Jawab dalam Bahasa Indonesia:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('✅ AI response generated successfully');
      return text.trim();

    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
      // Fallback error message
      if (error.message?.includes('API key')) {
        throw new Error('Gemini API key is invalid or not configured properly');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      
      throw new Error('Failed to generate AI response. Please try again later.');
    }
  }

  /**
   * Check if the Gemini service is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.model !== null;
  }
}

export default GeminiService;