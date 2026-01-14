import React from 'react';
import { IconWorld } from '@tabler/icons-react';
import { toast } from 'sonner';
import { SocialIcon } from '../social-icon';
import {
  getSocialIconName,
  shouldHideMainUrl
} from '../../../utils/formatting';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface Link {
  name?: string;
  url: string;
  type?: string;
}

interface SocialLinksIconsProps {
  mainUrl?: string;
  socialLinks?: Link[];
  className?: string;
  variant?: 'preview' | 'details' | 'grouped';
}

export const SocialLinksIcons: React.FC<SocialLinksIconsProps> = ({
  mainUrl,
  socialLinks = [],
  className,
  variant = 'details'
}) => {
  // Функция для проверки, является ли ссылка email
  const isEmailLink = (url: string, type?: string, name?: string) => {
    const lowerType = (type || '').toLowerCase();
    const lowerName = (name || '').toLowerCase();
    return (
      lowerType.includes('email') ||
      lowerName.includes('email') ||
      lowerType.includes('mail') ||
      lowerName.includes('mail') ||
      url.startsWith('mailto:') ||
      url.includes('@')
    );
  };

  // Функция для копирования email в буфер обмена
  const copyEmailToClipboard = async (email: string) => {
    try {
      const cleanEmail = email.startsWith('mailto:')
        ? email.replace('mailto:', '')
        : email;

      // Используем современный API clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanEmail);
        toast.success('Email скопирован в буфер обмена');
      } else {
        // Fallback для старых браузеров или небезопасного контекста
        const textArea = document.createElement('textarea');
        textArea.value = cleanEmail;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          toast.success('Email скопирован в буфер обмена');
        } catch (err) {
          toast.error('Не удалось скопировать email');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy email:', error);
      toast.error('Не удалось скопировать email');
    }
  };

  const hasLinks = mainUrl || socialLinks.length > 0;

  if (!hasLinks) {
    return null;
  }

  // Helper function to get display name for social links
  const getDisplayName = (link: Link, socialType: string) => {
    if (
      link.name?.toLowerCase() === 'project_url' ||
      link.type?.toLowerCase() === 'project_url'
    ) {
      return 'URL проекта';
    }
    if (
      link.name?.toLowerCase() === 'reference_url' ||
      link.type?.toLowerCase() === 'reference_url'
    ) {
      return 'Справочный URL';
    }
    return socialType.charAt(0).toUpperCase() + socialType.slice(1);
  };

  // Filter out reference URLs if main URL exists
  const filteredSocialLinks = mainUrl 
    ? socialLinks.filter(link => 
        !(link.name?.toLowerCase() === 'reference_url' || 
          link.type?.toLowerCase() === 'reference_url')
      )
    : socialLinks;

  // Check if main URL should be hidden (matches Twitter/X or LinkedIn links)
  const hideMainUrl = mainUrl
    ? shouldHideMainUrl(mainUrl, filteredSocialLinks)
    : false;
  
  const displayMainUrl = mainUrl && !hideMainUrl;

  // Проверяем, есть ли ссылки для отображения после фильтрации
  const hasFilteredLinks = displayMainUrl || filteredSocialLinks.length > 0;

  if (!hasFilteredLinks) {
    return null;
  }

  // Define styles based on variant
  const buttonSize = variant === 'preview' ? 'h-7 w-7' : variant === 'grouped' ? 'h-5 w-5' : 'h-9 w-9';
  const iconSize = variant === 'preview' ? 'h-3 w-3' : variant === 'grouped' ? 'h-4 w-4' : 'h-4 w-4';

  // Grouped variant - all links in one rounded container
  if (variant === 'grouped') {
    const renderSocialButton = (link: Link, idx: number) => {
      const isEmail = isEmailLink(link.url, link.type, link.name);
      const socialType = link.type || link.name || getSocialIconName(link.url);
      const displayName = getDisplayName(link, socialType);

      const handleClick = (e: React.MouseEvent) => {
        if (isEmail) {
          e.preventDefault();
          copyEmailToClipboard(link.url);
        }
      };

      return (
        <Tooltip key={idx}>
          <TooltipTrigger asChild>
            <a
              href={link.url}
              target='_blank'
              rel='noopener noreferrer'
              className="inline-flex"
              onClick={(e) => {
                e.stopPropagation();
                handleClick(e);
              }}
            >
              <Button
                variant='ghost'
                className={`${buttonSize} rounded-full bg-transparent hover:bg-transparent flex items-center justify-center p-0`}
              >
                <div className={`${iconSize} flex items-center justify-center`}>
                  <SocialIcon
                    name={socialType}
                    className={`${iconSize} text-zinc-600 dark:text-zinc-200`}
                  />
                </div>
              </Button>
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isEmail ? 'Скопировать email' : displayName}</p>
          </TooltipContent>
        </Tooltip>
      );
    };

    const renderMainUrlButton = () => {
      if (!displayMainUrl) return null;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={mainUrl}
              target='_blank'
              rel='noopener noreferrer'
              className="inline-flex"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant='ghost'
                className={`${buttonSize} rounded-full bg-transparent hover:bg-transparent flex items-center justify-center p-0`}
              >
                <div className={`${iconSize} flex items-center justify-center`}>
                  <IconWorld 
                    className={`${iconSize} text-zinc-600 dark:text-zinc-200 !h-auto !w-auto`} 
                    style={{ width: '100% !important', height: '100% !important', maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>
              </Button>
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p>Website</p>
          </TooltipContent>
        </Tooltip>
      );
    };

    return (
      <TooltipProvider>
        <div className={`inline-flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-transparent px-1 py-0.5 ${className || ''}`}>
          {renderMainUrlButton()}
          {filteredSocialLinks.map(renderSocialButton)}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap items-center gap-1 ${className || ''}`}>
        {displayMainUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={mainUrl}
                target='_blank'
                rel='noopener noreferrer'
                onClick={(e) => e.stopPropagation()}
              >
                  <Button
                    variant='ghost'
                    className={`${buttonSize} rounded-full border border-zinc-200 dark:border-zinc-700 p-0`}
                  >
                  <IconWorld 
                    className={`${iconSize} text-zinc-600 dark:text-zinc-200 !h-auto !w-auto`} 
                    style={{ width: '100% !important', height: '100% !important', maxWidth: '100%', maxHeight: '100%' }}
                  />
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>Веб-сайт</p>
            </TooltipContent>
          </Tooltip>
        )}
        {filteredSocialLinks.map((link, idx) => {
          // Проверяем, является ли это email ссылкой
          const isEmail = isEmailLink(link.url, link.type, link.name);

          const socialType =
            link.type || link.name || getSocialIconName(link.url);
          const displayName =
            link.name?.toLowerCase() === 'project_url' ||
            link.type?.toLowerCase() === 'project_url'
              ? 'URL проекта'
              : link.name?.toLowerCase() === 'reference_url' ||
                  link.type?.toLowerCase() === 'reference_url'
                ? 'Справочный URL'
                : socialType.charAt(0).toUpperCase() + socialType.slice(1);

          // Обработчик клика для email
          const handleClick = (e: React.MouseEvent) => {
            if (isEmail) {
              e.preventDefault();
              copyEmailToClipboard(link.url);
            }
          };

          return (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <a
                  href={link.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick(e);
                  }}
                >
                  <Button
                    variant='ghost'
                    className={`${buttonSize} rounded-full border border-zinc-200 dark:border-zinc-700 p-0`}
                  >
                    <SocialIcon
                      name={socialType}
                      className={`${iconSize} text-zinc-600 dark:text-zinc-200`}
                    />
                  </Button>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isEmail ? 'Скопировать email' : displayName}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
