class AppController {
  constructor(services) {
    this.faqService = services.faqService;
    this.whatsappService = services.whatsappService;
  }

  // WhatsApp Webhook Verification (GET)
  verifyWebhook = (req, res) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

      if (mode && token && mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Webhook verified successfully');
        return res.status(200).send(challenge);
      } else {
        console.log('❌ Webhook verification failed');
        return res.sendStatus(403);
      }
    } catch (error) {
      console.error('Error in webhook verification:', error);
      return res.sendStatus(500);
    }
  };

  // WhatsApp Webhook Receiver (POST)
  receiveAndReply = async (req, res) => {
    try {
      // Respond immediately to prevent retries
      res.status(200).send('OK');

      const body = req.body;
      const change = body.entry?.[0]?.changes?.[0]?.value;

      // Skip if no actual user message exists
      if (!change?.messages) {
        console.log('ℹ️ No incoming message. Probably a status update.');
        return;
      }

      const messages = change.messages;
      const msg = messages[0];

      const phoneNumber = msg.from;
      const message = msg.text?.body;
      const timestamp = msg.timestamp;
      const timeSent = new Date(Number(timestamp) * 1000);

      if (!phoneNumber?.trim() || !message?.trim()) {
        console.log('❌ Invalid phone number or message');
        return;
      }

      console.log(`📩 Message from ${phoneNumber}: ${message}`);
      console.log(`🕐 Sent at: ${timeSent.toISOString()}`);

      // Send waiting message
      await this.whatsappService.sendMessage(
        phoneNumber,
        'Baik, mohon tunggu sebentar. Kami akan carikan informasi yang kamu inginkan 🔍'
      );

      // Process the message with FAQ service (now using AI)
      const faqResponse = await this.faqService.findAnswer(message);
      
      // Send the FAQ response back
      if (faqResponse) {
        await this.whatsappService.sendMessage(phoneNumber, faqResponse);
        console.log(`✅ Replied to ${phoneNumber} with AI-generated answer`);
      } else {
        await this.whatsappService.sendMessage(
          phoneNumber,
          'Maaf, saya belum memiliki informasi mengenai pertanyaan tersebut. Silakan hubungi customer service kami untuk bantuan lebih lanjut.'
        );
        console.log(`⚠️ No answer found for ${phoneNumber}`);
      }

    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      
      // Try to send error message to user
      try {
        const phoneNumber = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
        if (phoneNumber) {
          await this.whatsappService.sendMessage(
            phoneNumber,
            'Maaf, terjadi kesalahan. Silakan coba lagi nanti atau hubungi customer service kami.'
          );
        }
      } catch (sendError) {
        console.error('❌ Failed to send error message:', sendError);
      }
    }
  };

  // Chat
  chat = async (req, res) => {
    try {
      const body = req.body;
      const change = body.entry?.[0]?.changes?.[0]?.value;

      const messages = change.messages;
      const msg = messages[0];

      const phoneNumber = msg.from;
      const message = msg.text?.body;
      const timestamp = msg.timestamp;
      const timeSent = new Date(Number(timestamp) * 1000);

      console.log(`📩 Message from ${phoneNumber}: ${message}`);
      console.log(`🕐 Sent at: ${timeSent.toISOString()}`);

      const faqResponse = await this.faqService.findAnswer(message);

      if (faqResponse) {
        console.log(`faqResponse fetched`);
        return res.json({ success: true, answer: faqResponse });
      } else {
        console.log(`⚠️ No answer found for ${phoneNumber}`);
        return res.json({
          success: false,
          answer: 'Maaf, saya belum memiliki informasi mengenai pertanyaan tersebut. Silakan hubungi customer service kami untuk bantuan lebih lanjut.'
        });
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error);

      const phoneNumber = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
      if (phoneNumber) {
        return res.json({
          success: false,
          answer: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti atau hubungi customer service kami.'
        });
      }

      res.status(500).json({ success: false, error: error.message });
    }
  };
}

export default AppController;