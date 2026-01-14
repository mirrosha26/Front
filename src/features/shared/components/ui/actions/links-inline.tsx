import React from 'react';
import { IconWorld } from '@tabler/icons-react';
import { toast } from 'sonner';
import { SocialIcon } from '../social-icon';
import {
  getSocialIconName,
  shouldHideMainUrl
} from '../../../utils/formatting';

interface Link {
  name?: string;
  url: string;
  type?: string;
}

interface LinksInlineProps {
  mainUrl?: string;
  socialLinks?: Link[];
  className?: string;
}

export const LinksInline: React.FC<LinksInlineProps> = ({
  mainUrl,
  socialLinks = [],
  className
}) => {
  // Don't filter out any social links - display all of them
  const filteredSocialLinks = (socialLinks || []).filter(
    (link) =>
      link.name?.toLowerCase() !== 'reference_url' &&
      link.type?.toLowerCase() !== 'reference_url'
  );

  // Check if main URL should be hidden (matches Twitter/X or LinkedIn links)
  const hideMainUrl = mainUrl
    ? shouldHideMainUrl(mainUrl, filteredSocialLinks)
    : false;
  const displayMainUrl = mainUrl && !hideMainUrl;

  // Проверяем, есть ли ссылки для отображения
  const hasLinks = displayMainUrl || filteredSocialLinks.length > 0;

  if (!hasLinks) {
    return null;
  }

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

  // Функция для получения правильного URL для email
  const getEmailUrl = (url: string) => {
    if (url.startsWith('mailto:')) {
      return url;
    }
    if (url.includes('@')) {
      return `mailto:${url}`;
    }
    return url;
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

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      {displayMainUrl && (
        <a
          href={mainUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center text-xs text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300'
        >
          <IconWorld className='mr-1 h-3 w-3' />
          <span className='truncate'>
            {(() => {
              try {
                const url = new URL(mainUrl);
                return url.hostname;
              } catch (error) {
                return mainUrl;
              }
            })()}
          </span>
        </a>
      )}
      {filteredSocialLinks.map((link, idx) => {
        // Проверяем, является ли это email ссылкой
        const isEmail = isEmailLink(link.url, link.type, link.name);

        // Определяем тип социальной сети
        let socialType: string;

        if (isEmail) {
          socialType = 'email';
        } else if (
          link.name?.toLowerCase() === 'reference_url' ||
          link.type?.toLowerCase() === 'reference_url'
        ) {
          try {
            const url = new URL(link.url);
            socialType = url.hostname.replace('www.', '');
          } catch (error) {
            socialType = 'website';
          }
        } else {
          // Используем стандартную логику для других ссылок
          socialType =
            (link.type && link.type !== 'Reference_url') ||
            (link.name && link.name !== 'Reference_url')
              ? link.type || link.name || getSocialIconName(link.url)
              : getSocialIconName(link.url);
        }

        // Получаем правильный URL
        const finalUrl = isEmail ? getEmailUrl(link.url) : link.url;

        // Определяем текст для отображения
        const displayText = isEmail
          ? link.url.startsWith('mailto:')
            ? link.url.replace('mailto:', '')
            : link.url
          : link.name?.toLowerCase() === 'project_url' ||
              link.type?.toLowerCase() === 'project_url'
            ? 'URL проекта'
          : link.name?.toLowerCase() === 'reference_url' ||
              link.type?.toLowerCase() === 'reference_url'
            ? 'Справочный URL'
              : socialType;

        // Обработчик клика для email
        const handleClick = (e: React.MouseEvent) => {
          if (isEmail) {
            e.preventDefault();
            copyEmailToClipboard(link.url);
          }
        };

        return (
          <a
            key={idx}
            href={finalUrl}
            target={isEmail ? '_self' : '_blank'}
            rel={isEmail ? '' : 'noopener noreferrer'}
            className='flex cursor-pointer items-center text-xs text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300'
            onClick={handleClick}
          >
            <SocialIcon name={socialType} className='mr-1 h-3 w-3' />
            <span>{displayText}</span>
          </a>
        );
      })}
    </div>
  );
};
