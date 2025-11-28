import axios from 'axios';

async function testWebhook() {
    const webhookUrl = 'http://localhost:3000/api/whatsapp/webhook';

    const payload = {
        data: {
            key: {
                remoteJid: '5511999999999@s.whatsapp.net',
                fromMe: false,
                id: 'test-message-' + Date.now()
            },
            messageType: 'conversation',
            message: {
                conversation: 'Olá! Gostaria de saber mais sobre pacotes para a Disney.'
            },
            pushName: 'Test User'
        }
    };

    console.log('Sending webhook payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(webhookUrl, payload);
        console.log('Response:', response.status, response.data);
    } catch (error: any) {
        console.error('Error sending webhook:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testWebhook();
