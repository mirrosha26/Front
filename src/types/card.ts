export interface Card {
  id: number;
  slug: string;
  uuid: string;
  name: string;
  image?: string;
  is_liked: boolean;
  has_note: boolean;
  is_deleted?: boolean;
  stage_info?: {
    name: string;
    slug: string;
  };
  round_status_info?: {
    key: string;
    name: string;
  };
  created_date?: string;
  latest_date?: string;
  location?: string;
  last_round?: string;
  description?: string;
  url?: string;
  social_links?: {
    name: string;
    url: string;
  }[];
  categories_list?: {
    id: number;
    name: string;
    slug: string;
  }[];
  participants_list?: {
    name: string;
    image?: string;
    is_saved: boolean;
    is_private: boolean;
  }[];
  participants_more_count?: number;
  participants_has_more?: boolean;
}
