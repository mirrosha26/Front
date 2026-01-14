/**
 * Форматирует денежную сумму в удобочитаемый вид
 * @param amount Сумма в числовом формате
 * @returns Отформатированная строка с суммой
 */
export function formatAmount(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'Н/Д';
  }

  // Преобразуем в число, если передана строка
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Проверяем, является ли значение числом
  if (isNaN(numAmount)) {
    return 'Н/Д';
  }

  // Форматируем сумму в зависимости от размера
  if (numAmount >= 1000000000) {
    return `$${(numAmount / 1000000000).toFixed(1)}B`;
  } else if (numAmount >= 1000000) {
    return `$${(numAmount / 1000000).toFixed(1)}M`;
  } else if (numAmount >= 1000) {
    return `$${(numAmount / 1000).toFixed(1)}K`;
  } else {
    return `$${numAmount.toFixed(0)}`;
  }
}

/**
 * Возвращает CSS класс для цвета статуса
 * @param status Статус
 * @returns CSS класс для цвета
 */
export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('active') || statusLower === 'active') {
    return 'bg-green-500 text-white';
  } else if (statusLower.includes('pending') || statusLower === 'pending') {
    return 'bg-yellow-500 text-white';
  } else if (statusLower.includes('closed') || statusLower === 'closed') {
    return 'bg-red-500 text-white';
  } else {
    return 'bg-gray-500 text-white';
  }
}

/**
 * Возвращает текст статуса
 * @param status Статус
 * @returns Текст статуса
 */
export function getStatusText(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Возвращает относительную дату в формате "X дней назад" или обычную дату для старых дат
 * @param dateString Строка с датой
 * @returns Относительная дата или обычная дата
 */
export function getRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  // Обнуляем время, чтобы сравнивать только даты
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Если дата больше недели назад или в будущем больше недели, показываем обычную дату
  if (Math.abs(diffDays) > 7) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Для дат в пределах недели показываем относительные даты
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -7) {
    return 'Week ago';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `${diffDays} days from now`;
  } else if (diffDays < -1 && diffDays > -7) {
    return `${Math.abs(diffDays)} days ago`;
  } else {
    // Fallback - показываем обычную дату
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

/**
 * Gets the social icon name from a source object (from GraphQL sources)
 * @param source Source object from GraphQL with sourceType and profileLink
 * @returns String with icon name
 */
export function getSocialIconNameFromSource(source: {
  sourceType?: string;
  source_type?: string;
  profileLink?: string;
  profile_link?: string;
  link?: string;
  type?: string;
}): string {
  // Try the new GraphQL format first
  const sourceType = source.sourceType || source.source_type;
  const profileLink = source.profileLink || source.profile_link || source.link;
  
  // If we have a sourceType, use it directly (it's usually more reliable)
  if (sourceType) {
    return getSocialIconName(sourceType);
  }
  
  // Fall back to analyzing the URL if available
  if (profileLink) {
    return getSocialIconName(profileLink);
  }
  
  // Legacy fallback for old data structure
  if (source.type) {
    return getSocialIconName(source.type);
  }
  
  return 'website';
}

/**
 * Возвращает имя иконки для социальной сети
 * @param name Название социальной сети
 * @returns Строка с названием иконки
 */
export function getSocialIconName(name: string): string {
  // Приводим к нижнему регистру для унификации
  const lowercaseName = name.toLowerCase();

  // Проверяем, содержит ли имя URL
  if (lowercaseName.includes('http') || lowercaseName.includes('www.')) {
    // Извлекаем домен из URL
    if (
      lowercaseName.includes('twitter.com') ||
      lowercaseName.includes('x.com')
    )
      return 'twitter';
    if (lowercaseName.includes('linkedin.com')) return 'linkedin';
    if (
      lowercaseName.includes('facebook.com') ||
      lowercaseName.includes('fb.com')
    )
      return 'facebook';
    if (lowercaseName.includes('instagram.com')) return 'instagram';
    if (lowercaseName.includes('github.com')) return 'github';
    if (
      lowercaseName.includes('youtube.com') ||
      lowercaseName.includes('youtu.be')
    )
      return 'youtube';
    if (lowercaseName.includes('tiktok.com')) return 'tiktok';
    if (
      lowercaseName.includes('discord.com') ||
      lowercaseName.includes('discord.gg')
    )
      return 'discord';
    if (lowercaseName.includes('t.me') || lowercaseName.includes('telegram.me'))
      return 'telegram';
    if (
      lowercaseName.includes('wa.me') ||
      lowercaseName.includes('whatsapp.com')
    )
      return 'whatsapp';
    if (lowercaseName.includes('snapchat.com')) return 'snapchat';
    if (lowercaseName.includes('pinterest.com')) return 'pinterest';
    if (lowercaseName.includes('reddit.com')) return 'reddit';
    if (lowercaseName.includes('medium.com')) return 'medium';
    if (lowercaseName.includes('slack.com')) return 'slack';
    if (lowercaseName.includes('skype.com')) return 'skype';
    if (lowercaseName.includes('spotify.com')) return 'spotify';
    if (lowercaseName.includes('soundcloud.com')) return 'soundcloud';
    if (lowercaseName.includes('warpcast.com') || lowercaseName.includes('farcaster.xyz'))
      return 'warpcast';
    if (lowercaseName.includes('crunchbase.com')) return 'crunchbase';
    if (lowercaseName.includes('mailto:')) return 'email';
    if (lowercaseName.includes('tel:')) return 'phone';
  }

  // Если это не URL, проверяем ключевые слова и sourceTypes от GraphQL
  if (lowercaseName.includes('twitter') || lowercaseName === 'x' || lowercaseName === 'twitter_x')
    return 'twitter';
  if (lowercaseName.includes('linkedin')) return 'linkedin';
  if (lowercaseName.includes('facebook') || lowercaseName === 'fb')
    return 'facebook';
  if (lowercaseName.includes('instagram') || lowercaseName === 'insta')
    return 'instagram';
  if (lowercaseName.includes('github')) return 'github';
  if (lowercaseName.includes('youtube') || lowercaseName === 'yt')
    return 'youtube';
  if (lowercaseName.includes('tiktok') || lowercaseName === 'tt')
    return 'tiktok';
  if (lowercaseName.includes('discord')) return 'discord';
  if (lowercaseName.includes('telegram') || lowercaseName === 'tg')
    return 'telegram';
  if (lowercaseName.includes('whatsapp') || lowercaseName === 'wa')
    return 'whatsapp';
  if (lowercaseName.includes('snapchat') || lowercaseName === 'snap')
    return 'snapchat';
  if (lowercaseName.includes('pinterest')) return 'pinterest';
  if (lowercaseName.includes('reddit')) return 'reddit';
  if (lowercaseName.includes('medium')) return 'medium';
  if (lowercaseName.includes('slack')) return 'slack';
  if (lowercaseName.includes('skype')) return 'skype';
  if (lowercaseName.includes('spotify')) return 'spotify';
  if (lowercaseName.includes('soundcloud')) return 'soundcloud';
  if (lowercaseName.includes('warpcast') || lowercaseName.includes('farcaster'))
    return 'warpcast';
  if (lowercaseName.includes('crunchbase') || lowercaseName === 'cb') return 'crunchbase';
  if (lowercaseName.includes('email') || lowercaseName.includes('mail'))
    return 'email';
  if (lowercaseName.includes('phone') || lowercaseName.includes('tel'))
    return 'phone';
  
  // Handle common sourceType values that might come from GraphQL
  if (lowercaseName === 'website' || lowercaseName === 'url' || lowercaseName === 'web')
    return 'website';
  
  // Если это URL, но не известная социальная сеть, извлекаем домен
  if (lowercaseName.includes('http') || lowercaseName.includes('www.')) {
    try {
      const url = new URL(lowercaseName);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return 'website';
    }
  }
  
  return lowercaseName;
}

/**
 * Normalizes a URL for comparison by removing common variations
 * @param url The URL to normalize
 * @returns Normalized URL or null if invalid
 */
export function normalizeUrl(url: string): string | null {
  try {
    // Remove leading/trailing whitespace
    const cleanUrl = url.trim();
    
    // Add protocol if missing
    const urlWithProtocol = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    
    const urlObj = new URL(urlWithProtocol);
    
    // Remove www. from hostname
    const hostname = urlObj.hostname.replace(/^www\./, '');
    
    // Remove trailing slash from pathname
    const pathname = urlObj.pathname.replace(/\/$/, '') || '/';
    
    // Combine normalized parts
    return `${urlObj.protocol}//${hostname}${pathname}${urlObj.search}${urlObj.hash}`;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a URL is a Twitter/X or LinkedIn URL
 * @param url The URL to check
 * @returns true if it's a Twitter/X or LinkedIn URL
 */
export function isTwitterOrLinkedInUrl(url: string): boolean {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) return false;
  
  const hostname = new URL(normalizedUrl).hostname;
  return hostname === 'twitter.com' || 
         hostname === 'x.com' || 
         hostname === 'linkedin.com';
}

/**
 * Checks if the main URL should be hidden because it matches a Twitter/X or LinkedIn social link
 * @param mainUrl The main URL to check
 * @param socialLinks Array of social links
 * @returns true if main URL should be hidden
 */
export function shouldHideMainUrl(mainUrl: string, socialLinks: Array<{ url: string; name?: string; type?: string }>): boolean {
  if (!mainUrl || !socialLinks || socialLinks.length === 0) {
    return false;
  }
  
  const normalizedMainUrl = normalizeUrl(mainUrl);
  if (!normalizedMainUrl) return false;
  
  // Check if main URL matches any Twitter/X or LinkedIn social links
  return socialLinks.some(link => {
    const socialType = getSocialIconName(link.url).toLowerCase();
    const isTwitterOrLinkedIn = socialType === 'twitter' || socialType === 'linkedin';
    
    if (!isTwitterOrLinkedIn) return false;
    
    const normalizedSocialUrl = normalizeUrl(link.url);
    return normalizedSocialUrl && normalizedMainUrl === normalizedSocialUrl;
  });
}
