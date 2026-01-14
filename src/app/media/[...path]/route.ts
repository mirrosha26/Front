import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Получаем путь к файлу из параметров
    const { path } = await params;
    const filePath = path.join('/');
    
    // Формируем полный URL для запроса к серверу (используем API_BASE_URL с портом)
    const mediaUrl = `${config.api.baseUrl}/media/${filePath}`;
    
    console.log(`[MEDIA PROXY] Requesting: ${mediaUrl}`);
    console.log(`[MEDIA PROXY] Original path: /media/${filePath}`);
    
    // Получаем файл с сервера
    const response = await fetch(mediaUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch media file: ${mediaUrl}, status: ${response.status}`);
      return new NextResponse('File not found', { status: 404 });
    }

    // Получаем тип контента из ответа сервера
    const contentType = response.headers.get('content-type');
    
    // Получаем данные файла
    const data = await response.arrayBuffer();
    
    // Возвращаем файл клиенту
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error fetching media file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 