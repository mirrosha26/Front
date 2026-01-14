export interface Investor {
  id: number;
  name: string;
  additional_name: string;
  type: string;
  about: string;
  slug: string;
  image: string;
  is_private: boolean;
  is_followed?: boolean; // Для отслеживания состояния подписки
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface PrivateInvestorRequest {
  id?: number;
  name: string;
  additional_name?: string;
  twitter_headline?: string;
  linkedin_headline?: string;
  product_hunt_headline?: string;
}

export interface PrivateInvestor {
  id: number;
  name: string;
  slug: string;
  type: string;
  is_private: boolean;
  is_subscribed: boolean;
  image: string;
  num_cards: number;
}

export interface PrivateInvestorsData {
  pending_requests: PrivateInvestorRequest[];
  processing_requests: PrivateInvestorRequest[];
  investors_with_signals: PrivateInvestor[];
}
