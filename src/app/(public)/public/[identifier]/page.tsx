import {
  PublicProjectPage,
  PublicProjectProvider
} from '@/features/public-project';
import { config } from '@/config/config';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    identifier: string;
  }>;
}

// Функция для преобразования относительного пути в абсолютный URL
function getAbsoluteImageUrl(imagePath: string): string {
  // Если это уже абсолютный URL, возвращаем как есть
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Если это относительный путь, добавляем базовый URL приложения
  if (imagePath.startsWith('/')) {
    // Убираем начальный слеш и добавляем к базовому URL приложения
    return `${config.app.baseUrl}${imagePath}`;
  }

  // Если это просто имя файла, добавляем к базовому URL приложения
  return `${config.app.baseUrl}/${imagePath}`;
}

async function getProjectPreview(identifier: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Используем внутренний API route вместо прямого обращения к бэкенду
  // Для серверного компонента нужен абсолютный URL
  const baseUrl = isDevelopment 
    ? process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'
    : config.app.baseUrl;
  const apiUrl = `${baseUrl}/api/public/${identifier}/preview`;

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      // В режиме разработки не кешируем
      ...(isDevelopment ? { next: { revalidate: 0 } } : {})
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || response.statusText };
      }
      
      console.error('Preview API error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        error: errorData
      });
      
      return {
        success: false,
        error:
          response.status === 404
            ? 'Card not found'
            : errorData.message || 'Failed to load project'
      };
    }

    const data = await response.json();
    console.log('Preview data received:', {
      success: data.success,
      hasCard: !!data.card,
      cardId: data.card?.id,
      cardName: data.card?.name
    });
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching project preview:', {
      error: errorMessage,
      identifier,
      url: apiUrl,
      stack: error instanceof Error ? error.stack : undefined
    });
    return { 
      success: false, 
      error: 'Failed to load project' 
    };
  }
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { identifier } = await params;
  const previewData = await getProjectPreview(identifier);
  const projectData = previewData?.card;

  const title = projectData?.name || 'Project Not Found';
  const description = projectData?.description || 'Project on Veck Platform';
  const image = projectData?.image
    ? getAbsoluteImageUrl(projectData.image)
    : null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image
        ? [
            {
              url: image,
              width: 80,
              height: 80,
              alt: title
            }
          ]
        : [],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : []
    }
  };
}

export default async function PublicIdentifierPage({ params }: PageProps) {
  const { identifier } = await params;
  const previewData = await getProjectPreview(identifier);

  return (
    <PublicProjectProvider initialPreviewData={previewData}>
      <PublicProjectPage identifier={identifier} />
    </PublicProjectProvider>
  );
}
