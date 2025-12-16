const BOT_TOKEN = '8289023279:AAEV38lwnnWwaYgCWlyUipq1G1klOUfA2Fk';

export const TelegramService = {
  /**
   * Send a structured task alert to the user
   */
  async sendTaskAlert(chatId: string, taskName: string, deadline: string | undefined, priority: string | undefined) {
    if (!chatId) return;
    
    // Icon based on priority
    const priorityIcon = priority === 'High' ? '🚨' : priority === 'Medium' ? '🟡' : '🟢';
    
    const text = `
*Nikto IT Manager Alert* ${priorityIcon}

*Task:* ${taskName}
*Deadline:* ${deadline || 'Not specified'}
*Priority:* ${priority || 'Normal'}

_Please check the dashboard for details._
    `.trim();

    await this.sendMessage(chatId, text);
  },

  /**
   * Send a generic message
   */
  async sendMessage(chatId: string, text: string) {
    if (!chatId) return;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
      });
    } catch (e) {
      console.error("Telegram Send Error", e);
    }
  }
};