import React from 'react';
import {
  IconBrandTwitter,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandGithub,
  IconWorld,
  IconBrandYoutube,
  IconBrandTiktok,
  IconBrandDiscord,
  IconBrandX,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconBrandSnapchat,
  IconBrandPinterest,
  IconBrandReddit,
  IconBrandMedium,
  IconBrandSlack,
  IconBrandSkype,
  IconBrandSpotify,
  IconBrandSoundcloud,
  IconMail,
  IconPhone
} from '@tabler/icons-react';
import { getSocialIconName } from '../../utils/formatting';

interface SocialIconProps {
  name: string;
  className?: string;
}

// SVG иконка для Warpcast, основанная на официальном логотипе
const WarpcastIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox='0 0 24 24'
    fill='currentColor'
    className={className}
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M5 21V9C5 5.13 8.13 2 12 2s7 3.13 7 7v12h-3V9c0-2.21-1.79-4-4-4s-4 1.79-4 4v12H5Z' />
  </svg>
);

// Custom LinkedIn icon that fits better with the design system
const LinkedInIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox='0 0 24 24'
    fill='currentColor'
    className={className}
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M19 0H5C2.2 0 0 2.2 0 5v14c0 2.8 2.2 5 5 5h14c2.8 0 5-2.2 5-5V5c0-2.8-2.2-5-5-5zM8.5 20.5H5V9h3.5v11.5zM6.75 7.5C5.5 7.5 4.5 6.5 4.5 5.25S5.5 3 6.75 3s2.25 1 2.25 2.25S8 7.5 6.75 7.5zM20.5 20.5H17V15c0-1.4 0-3.2-1.9-3.2-1.9 0-2.2 1.5-2.2 3.1v5.6H9.4V9h3.4v1.6h.1c.5-.9 1.7-1.9 3.5-1.9 3.7 0 4.4 2.4 4.4 5.6v6.2z' />
  </svg>
);

// SVG иконка для Crunchbase в виде текста "cb"
const CrunchbaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox='0 0 24 24'
    className={className}
    xmlns='http://www.w3.org/2000/svg'
  >
    <text
      x='50%'
      y='52%'
      dominantBaseline='middle'
      textAnchor='middle'
      fontSize='18'
      fontWeight='bold'
      fill='currentColor'
      stroke='currentColor'
      strokeWidth='0.5'
      paintOrder='stroke fill'
    >
      cb
    </text>
  </svg>
);

export const SocialIcon: React.FC<SocialIconProps> = ({
  name,
  className = 'h-4 w-4'
}) => {
  const iconName = getSocialIconName(name);
  
  // Ensure size classes are applied with !important to override any default styles
  const sizeClasses = className.includes('h-') || className.includes('w-') 
    ? className 
    : `${className} h-4 w-4`;

  switch (iconName) {
    case 'twitter':
      return <IconBrandX className={`${sizeClasses} `}  />;
    case 'linkedin':
      return <LinkedInIcon className={`${sizeClasses} `} />;
    case 'facebook':
      return <IconBrandFacebook className={`${sizeClasses} `}  />;
    case 'instagram':
      return <IconBrandInstagram className={`${sizeClasses} `}  />;
    case 'github':
      return <IconBrandGithub className={`${sizeClasses} `}  />;
    case 'youtube':
      return <IconBrandYoutube className={`${sizeClasses} `}  />;
    case 'tiktok':
      return <IconBrandTiktok className={`${sizeClasses} `}  />;
    case 'discord':
      return <IconBrandDiscord className={`${sizeClasses} `}  />;
    case 'telegram':
      return <IconBrandTelegram className={`${sizeClasses} `}  />;
    case 'whatsapp':
      return <IconBrandWhatsapp className={`${sizeClasses} `}  />;
    case 'snapchat':
      return <IconBrandSnapchat className={`${sizeClasses} `}  />;
    case 'pinterest':
      return <IconBrandPinterest className={`${sizeClasses} `}  />;
    case 'reddit':
      return <IconBrandReddit className={`${sizeClasses} `}  />;
    case 'medium':
      return <IconBrandMedium className={`${sizeClasses} `}  />;
    case 'slack':
      return <IconBrandSlack className={`${sizeClasses} `}  />;
    case 'skype':
      return <IconBrandSkype className={`${sizeClasses} `}  />;
    case 'spotify':
      return <IconBrandSpotify className={`${sizeClasses} `}  />;
    case 'soundcloud':
      return <IconBrandSoundcloud className={`${sizeClasses} `}  />;
    case 'warpcast':
      return <WarpcastIcon className={`${sizeClasses} `}  />;
    case 'crunchbase':
      return <CrunchbaseIcon className={`${sizeClasses} `} style={{ maxWidth: '100%', maxHeight: '100%', minWidth: '0', minHeight: '0' }} />;
    case 'email':
    case 'mail':
      return <IconMail className={`${sizeClasses} `}  />;
    case 'phone':
      return <IconPhone className={`${sizeClasses} `}  />;
    default:
      return <IconWorld className={`${sizeClasses} `}  />;
  }
};
