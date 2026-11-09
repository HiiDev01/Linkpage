import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok, FaYoutube, FaGithub, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FiGlobe } from 'react-icons/fi';

export const PLATFORMS = {
  instagram: { label: 'Instagram', icon: FaInstagram, placeholder: 'https://instagram.com/yourname' },
  facebook: { label: 'Facebook', icon: FaFacebook, placeholder: 'https://facebook.com/yourname' },
  linkedin: { label: 'LinkedIn', icon: FaLinkedin, placeholder: 'https://linkedin.com/in/yourname' },
  x: { label: 'X (Twitter)', icon: FaXTwitter, placeholder: 'https://x.com/yourname' },
  tiktok: { label: 'TikTok', icon: FaTiktok, placeholder: 'https://tiktok.com/@yourname' },
  youtube: { label: 'YouTube', icon: FaYoutube, placeholder: 'https://youtube.com/@yourname' },
  github: { label: 'GitHub', icon: FaGithub, placeholder: 'https://github.com/yourname' },
  whatsapp: { label: 'WhatsApp', icon: FaWhatsapp, placeholder: 'https://wa.me/15551234567' },
  telegram: { label: 'Telegram', icon: FaTelegram, placeholder: 'https://t.me/yourname' },
  website: { label: 'Personal website', icon: FiGlobe, placeholder: 'https://yoursite.com' },
};
