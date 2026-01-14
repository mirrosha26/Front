import React from 'react';
import { IconWorld } from '@tabler/icons-react';
import { SocialIcon } from '../social-icon';
import {
  getSocialIconName,
  shouldHideMainUrl
} from '../../../utils/formatting';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { IconLink } from '@tabler/icons-react';
import { toast } from 'sonner';

interface Link {
  name: string;
  url: string;
  type?: string;
}

interface LinksListProps {
  mainUrl?: string;
  socialLinks?: Link[];
  variant?: 'preview' | 'details';
  className?: string;
}

export const LinksList: React.FC<LinksListProps> = ({
  mainUrl,
  socialLinks = [],
  variant = 'preview',
  className
}) => {
  // Check if main URL should be hidden (matches Twitter/X or LinkedIn links)
  const hideMainUrl = mainUrl ? shouldHideMainUrl(mainUrl, socialLinks) : false;
  const displayMainUrl = mainUrl && !hideMainUrl;

  // Check if there are links to display
  const hasLinks = displayMainUrl || socialLinks.length > 0;

  if (!hasLinks) {
    return null;
  }

  // Define styles based on variant
  const defaultClassName =
    variant === 'preview'
      ? 'h-7 w-7 rounded-full p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
      : 'h-9 w-9 flex-shrink-0 rounded-full p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700';

  // Define icon size based on variant
  const iconSize = variant === 'preview' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';

  const filteredSocialLinks = (socialLinks || []).filter(
    (link) =>
      link.name?.toLowerCase() !== 'reference_url' &&
      link.type?.toLowerCase() !== 'reference_url'
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          onClick={(e) => e.stopPropagation()}
          className={className || defaultClassName}
        >
          <IconLink className={iconSize} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-auto p-1.5'>
        <div className='flex flex-col space-y-1'>
          {displayMainUrl && (
            <DropdownMenuItem
              asChild
              className='cursor-pointer px-2 py-1 focus:bg-zinc-100 dark:focus:bg-zinc-800'
            >
              <a
                href={mainUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='flex w-full items-center space-x-1.5 text-xs text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
                onClick={(e) => e.stopPropagation()}
              >
                <IconWorld className='h-3.5 w-3.5' />
                <span>Website</span>
              </a>
            </DropdownMenuItem>
          )}

          {filteredSocialLinks.map((link, index) => {
            // Determine if this is an email link
            const isEmail =
              link.type?.toLowerCase().includes('email') ||
              link.name?.toLowerCase().includes('email') ||
              link.url.startsWith('mailto:');
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

            // Handler for email click
            const handleEmailClick = async (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              let email = link.url;
              if (email.startsWith('mailto:')) {
                email = email.replace('mailto:', '');
              }
              try {
                if (navigator.clipboard && window.isSecureContext) {
                  await navigator.clipboard.writeText(email);
                  toast.success('Email скопирован в буфер обмена');
                } else {
                  // fallback for insecure context
                  const textArea = document.createElement('textarea');
                  textArea.value = email;
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
                toast.error('Не удалось скопировать email');
              }
            };

            return (
              <DropdownMenuItem
                key={index}
                asChild
                className='cursor-pointer px-2 py-1 focus:bg-zinc-100 dark:focus:bg-zinc-800'
              >
                {isEmail ? (
                  <a
                    href={link.url}
                    className='flex w-full items-center space-x-1.5 text-xs text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
                    onClick={handleEmailClick}
                  >
                    <SocialIcon name={socialType} className='h-3.5 w-3.5' />
                    <span>{displayName}</span>
                  </a>
                ) : (
                  <a
                    href={link.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex w-full items-center space-x-1.5 text-xs text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SocialIcon name={socialType} className='h-3.5 w-3.5' />
                    <span>{displayName}</span>
                  </a>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
