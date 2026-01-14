export interface StageInfo {
  name: string;
  slug: string;
}

export interface RoundStatusInfo {
  key: string;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface StructuredExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  location?: string;
  description?: string;
}

export interface Participant {
  name: string;
  image: string | null;
  is_saved: boolean;
}

export interface CardPreview {
  id: number;
  slug?: string;
  uuid?: string;

  // Основная информация
  name?: string;
  title?: string;
  description?: string;

  // Изображения
  image?: string;
  image_url?: string;

  // Статусы и метки
  stage_info?: StageInfo;
  round_status_info?: RoundStatusInfo;
  status?: string;
  stage?: string;

  // Даты
  created_date?: string;
  created_at?: string;
  latest_date?: string;

  // Новые поля
  location?: string;
  last_round?: string;
  url?: string;
  social_links?: {
    name: string;
    url: string;
  }[];

  // Категории
  categories_list?: Category[];
  categories?: Category[];

  // Участники (legacy)
  participants_list?: Participant[];
  participants_more_count?: number;
  participants_has_more?: boolean;

  // Signals from GraphQL (new structure)
  signals?: Array<{
    id: string;
    date: string;
    description?: string;
    signalType?: {
      id: string;
      name: string;
      slug: string;
    };
    participant?: {
      id: string;
      name: string;
      slug: string;
      type: string;
      about?: string;
      imageUrl?: string;
      isSaved?: boolean;
    };
    associatedParticipant?: {
      id: string;
      name: string;
      slug: string;
      type: string;
      about?: string;
      imageUrl?: string;
      isSaved?: boolean;
    };
  }>;
  remainingParticipantsCount?: number;

  // Флаги
  is_liked?: boolean;
  is_heart_liked?: boolean;
  has_note?: boolean;
  is_assigned_to_group?: boolean;
  star?: boolean;
  selected?: boolean;
  trending?: boolean;

  // Статус назначения карточки группе (REVIEW, REACHING_OUT, CONNECTED, NOT_A_FIT)
  assignment_status?: string;

  // Назначенные участники группы (для отображения прямоугольных иконок в превью)
  assigned_members?: Array<{
    id: number | string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    assigned_by?: {
      id: number | string;
      username: string;
      first_name?: string;
      last_name?: string;
      avatar?: string;
    };
    assigned_at?: string;
  }>;

  // Финансы
  amount?: number;
}

// Новые типы для детальной информации о карточке
export interface Source {
  type: string;
  slug: string;
  link: string;
}

export interface CardParticipant {
  sources: Source[];
  associated_id: number;
  associated_saved: boolean;
  associated_slug: string;
  associated_about: string | null;
  associated_name: string;
  associated_image: string | null;
  associated_signal_created_at: string;
  more: any[];
}

export interface CardSignal {
  sources: Source[];
  associated_id: number;
  associated_saved: boolean;
  associated_slug: string;
  associated_about: string | null;
  associated_name: string;
  associated_image: string | null;
  associated_signal_created_at: string;
  more: any[];
}

export interface Folder {
  id: number;
  name: string;
  is_default: boolean;
  has_card: boolean;
}

export interface UserData {
  note_text: string | null;
  folders: Folder[];
}

export interface Investor {
  id?: number;
  name: string;
  image?: string;
  url?: string;
}

export interface FundingRound {
  id?: number;
  type: string;
  amount?: string;
  date?: string;
  description?: string;
  investors?: Investor[];
}

export interface Funding {
  total_raised?: string;
  latest_round?: string;
  rounds?: FundingRound[];
}

export interface CardDetails {
  ticket_status: boolean;
  latest_signal_date: string;
  discovered_at: string;
  people: any[];
  participants: CardParticipant[];
  signals: Array<{
    id: string;
    date: string;
    description?: string;
    signalType?: {
      id: string;
      name: string;
      slug: string;
    };
    participant?: {
      id: string;
      name: string;
      slug: string;
      type: string;
      about?: string;
      imageUrl?: string;
      isSaved?: boolean;
    };
    associatedParticipant?: {
      id: string;
      name: string;
      slug: string;
      type: string;
      about?: string;
      imageUrl?: string;
      isSaved?: boolean;
    };
  }>;
  linkedInSignals?: Array<{
    id: string;
    date: string;
    createdAt: string;
    description: string;
    signalType?: {
      id: string;
      name: string;
      slug: string;
    };
    participant?: any;
    associatedParticipant?: any;
    linkedinData?: any;
  }>;
  user_data: UserData;
  funding?: Funding;
}

export interface CardDetailsResponse {
  success: boolean;
  card: CardDetails;
}

/**
 * Интерфейс для ответа API со списком карточек
 */
export interface CardsResponse {
  success: boolean;
  loadMore?: boolean;
  cards: CardPreview[];
  total_count: number;
  total_pages: number;
  current_page: number;
}

/**
 * Варианты отображения карточки
 */
export type CardVariant = 'default' | 'saved' | 'deleted' | 'notes';
