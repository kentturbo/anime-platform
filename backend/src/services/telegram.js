import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export const checkChannelSubscription = async (telegramUserId) => {
  try {
    const response = await axios.get(`${TELEGRAM_API}/getChatMember`, {
      params: {
        chat_id: process.env.TELEGRAM_CHANNEL_ID,
        user_id: telegramUserId
      }
    });

    const status = response.data.result.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (error) {
    console.error('Telegram API error:', error.response?.data || error.message);
    return false;
  }
};

export const getTelegramChannelLink = () => {
  return process.env.TELEGRAM_CHANNEL_LINK;
};

export default { checkChannelSubscription, getTelegramChannelLink };
