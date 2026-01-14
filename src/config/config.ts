// Определяем базовые URL для разных окружений на основе переменных окружения
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://app.theveck.com:8000';
const APP_BASE_URL = 
  process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://app.theveck.com';
const AUTH_BASE_URL = `${API_BASE_URL}/f-api/auth`;
const USER_BASE_URL = `${API_BASE_URL}/f-api/user`;
const TICKET_BASE_URL = `${API_BASE_URL}/f-api/tickets`;
const INVESTOR_BASE_URL = `${API_BASE_URL}/f-api/investors`;
const CARDS_BASE_URL = `${API_BASE_URL}/f-api/cards`;
const FOLDERS_BASE_URL = `${API_BASE_URL}/f-api/folders`;
const FEEDS_BASE_URL = `${API_BASE_URL}/f-api/feeds`;
const FILTERS_BASE_URL = `${API_BASE_URL}/f-api/filters`;
const PUBLIC_BASE_URL = `${API_BASE_URL}/f-api/public`;

// Экспортируем конфигурационные переменные
export const config = {
  app: {
    baseUrl: APP_BASE_URL,
  },
  api: {
    baseUrl: API_BASE_URL,
    mediaBaseUrl: API_BASE_URL,
    auth: {
      baseUrl: AUTH_BASE_URL,
      endpoints: {
        login: `${AUTH_BASE_URL}/login/`,
        register: `${AUTH_BASE_URL}/register/`,
        logout: `${AUTH_BASE_URL}/logout/`,
        refresh: `${AUTH_BASE_URL}/refresh/`,
        meta: `${AUTH_BASE_URL}/registration-meta/`,
        verify: `${AUTH_BASE_URL}/verify/`,
        clientTokens: `${AUTH_BASE_URL}/client-tokens/`,
        clientTokensCreate: `${AUTH_BASE_URL}/client-tokens/create/`,
        clientTokensDelete: (id: number) => `${AUTH_BASE_URL}/client-tokens/${id}/delete/`
      }
    },
    user: {
      baseUrl: USER_BASE_URL,
      endpoints: {
        profile: `${USER_BASE_URL}/profile/`,
        updateProfile: `${USER_BASE_URL}/profile/update/`,
        changePassword: `${USER_BASE_URL}/password/change/`,
        onboarding: `${USER_BASE_URL}/onboarding/`,
        digestSettings: `${USER_BASE_URL}/digest-settings/`,
        digestSavedFilters: `${USER_BASE_URL}/digest-settings/saved-filters/`,
        digestSavedParticipants: `${USER_BASE_URL}/digest-settings/saved-participants/`,
        digestFolders: `${USER_BASE_URL}/digest-settings/folders/`,
        groupUpdate: `${USER_BASE_URL}/group/update/`
      }
    },
    tickets: {
      baseUrl: TICKET_BASE_URL,
      endpoints: {
        tickets: `${TICKET_BASE_URL}/`
      }
    },
    investors: {
      baseUrl: INVESTOR_BASE_URL,
      endpoints: {
        investors: `${INVESTOR_BASE_URL}/`,
        privateInvestors: `${INVESTOR_BASE_URL}/private/`,
        privateInvestorsCsv: `${INVESTOR_BASE_URL}/private/csv/`
      }
    },
    cards: {
      baseUrl: CARDS_BASE_URL,
      endpoints: {
        cards: `${CARDS_BASE_URL}/`,
        card: (id: number) => `${CARDS_BASE_URL}/${id}/`,
        favorite: (id: number) => `${CARDS_BASE_URL}/${id}/favorite/`,
        delete: (id: number) => `${CARDS_BASE_URL}/${id}/delete/`,
        note: (id: number) => `${CARDS_BASE_URL}/${id}/note/`,
        folders: (id: number) => `${CARDS_BASE_URL}/${id}/folders/`,
        groupMembers: (id: number) => `${CARDS_BASE_URL}/${id}/group-members/`,
        allByUuid: (uuid: string) => `${CARDS_BASE_URL}/all-by-uuid/${uuid}/`
      }
    },
    folders: {
      baseUrl: FOLDERS_BASE_URL,
      endpoints: {
        folders: `${FOLDERS_BASE_URL}/`,
        folder: (id: number) => `${FOLDERS_BASE_URL}/${id}/`,
        cards: (id: number) => `${FOLDERS_BASE_URL}/${id}/cards/`,
        exportUnified: (folder: string) => `${FOLDERS_BASE_URL}/export/?folder=${folder}`
      }
    },
    feeds: {
      baseUrl: FEEDS_BASE_URL,
      endpoints: {
        allSignals: `${FEEDS_BASE_URL}/all-signals/`,
        personalFeeds: `${FEEDS_BASE_URL}/personal/`
      }
    },
    filters: {
      endpoints: {
        allSignals: `${FILTERS_BASE_URL}/all-signals/`,
        personal: `${FILTERS_BASE_URL}/personal/`
      }
    },
    public: {
      baseUrl: PUBLIC_BASE_URL,
      endpoints: {
        cardPreview: (identifier: string) => `${PUBLIC_BASE_URL}/${identifier}/preview/`,
        cardDetail: (identifier: string) => `${PUBLIC_BASE_URL}/${identifier}/detail/`
      }
    }
  }
};
