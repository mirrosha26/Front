export interface FounderContact {
  id: number;
  name: string;
  image: string | null;
  is_processed: boolean;
  created_at: string;
  response_text: string | null;
  // Добавьте другие поля, которые могут прийти с API
}

export interface TicketsResponse {
  success: boolean;
  tickets: FounderContact[];
  message?: string;
}
