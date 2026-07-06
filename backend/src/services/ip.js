import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const detectIP = async (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const ip = forwarded ? forwarded.split(',')[0] : realIP || req.connection.remoteAddress;

  try {
    const response = await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);
    const data = response.data;

    const vpnDetected = data.privacy?.vpn || data.privacy?.proxy || data.privacy?.hosting || false;

    return {
      ip,
      realIP: realIP || ip,
      vpnDetected,
      country: data.country,
      city: data.city,
      org: data.org
    };
  } catch (error) {
    return {
      ip,
      realIP: realIP || ip,
      vpnDetected: false,
      country: null,
      city: null,
      org: null
    };
  }
};

export default { detectIP };
