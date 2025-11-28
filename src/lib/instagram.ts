/**
 * Instagram Messaging API Integration
 * Meta Graph API for Instagram Direct Messages
 */
import crypto from 'crypto';

interface InstagramConfig {
  pageAccessToken: string;
  instagramAccountId: string;
  verifyToken: string;
  appSecret: string;
}

interface InstagramMessage {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: number;
  message: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: {
        url: string;
      };
    }>;
  };
}

interface InstagramWebhook {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging: InstagramMessage[];
  }>;
}

export class InstagramService {
  private config: InstagramConfig;
  private apiUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.config = {
      pageAccessToken: process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || '',
      instagramAccountId: process.env.INSTAGRAM_ACCOUNT_ID || '',
      verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN || '',
      appSecret: process.env.INSTAGRAM_APP_SECRET || '',
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.appSecret)
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  /**
   * Verify webhook during setup
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Send message via Instagram
   */
  async sendMessage(recipientId: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          access_token: this.config.pageAccessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Instagram API error:', data);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending Instagram message:', error);
      return false;
    }
  }

  /**
   * Send message with quick replies
   */
  async sendQuickReplies(
    recipientId: string,
    message: string,
    quickReplies: Array<{ title: string; payload: string }>
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            text: message,
            quick_replies: quickReplies.map(qr => ({
              content_type: 'text',
              title: qr.title,
              payload: qr.payload,
            })),
          },
          access_token: this.config.pageAccessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Instagram API error:', data);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending Instagram quick replies:', error);
      return false;
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingOn(recipientId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: 'typing_on',
          access_token: this.config.pageAccessToken,
        }),
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(recipientId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: 'mark_seen',
          access_token: this.config.pageAccessToken,
        }),
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string): Promise<{
    id: string;
    name: string;
    profile_pic: string;
  } | null> {
    try {
      const response = await fetch(
        `${this.apiUrl}/${userId}?fields=id,name,profile_pic&access_token=${this.config.pageAccessToken}`
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Process incoming webhook message
   */
  async processWebhook(webhook: InstagramWebhook): Promise<Array<{
    senderId: string;
    text: string;
    timestamp: number;
    messageId: string;
  }>> {
    const messages: Array<{
      senderId: string;
      text: string;
      timestamp: number;
      messageId: string;
    }> = [];

    if (webhook.object !== 'instagram') {
      return messages;
    }

    for (const entry of webhook.entry) {
      for (const messaging of entry.messaging) {
        if (messaging.message?.text) {
          messages.push({
            senderId: messaging.sender.id,
            text: messaging.message.text,
            timestamp: messaging.timestamp,
            messageId: messaging.message.mid,
          });

          // Mark as read
          await this.markAsRead(messaging.sender.id);
        }
      }
    }

    return messages;
  }
}

export const instagramService = new InstagramService();
