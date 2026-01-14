// GraphQL Input Types
export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export enum SortBy {
  LATEST_SIGNAL_DATE = "LATEST_SIGNAL_DATE",
  CREATED_AT = "CREATED_AT", 
  NAME = "NAME",
  UPDATED_AT = "UPDATED_AT"
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC"
}

export interface SignalCardFilters {
  search?: string;
  categories?: string[];
  participants?: string[];
  participantFilter?: {
    mode: 'EXCLUDE_FROM_TYPE';
    participantTypes: string[];
    participantIds: string[];
  };
  stages?: string[];
  roundStatuses?: string[];
  startDate?: string; // YYYY-MM-DD ISO format
  endDate?: string; // YYYY-MM-DD ISO format
  minSignals?: number;
  maxSignals?: number;
  featured?: boolean;
  isOpen?: boolean;
  new?: boolean;
  hideLiked?: boolean; // Exclude favorited/liked cards
  trending?: boolean; // Filter by trending projects only
  displayPreference?: string; // Display preference override for saved filters (WEB2, WEB3, ALL). Maps to display_preference on backend
}

// GraphQL Response Types
export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Source {
  id: string;
  slug: string;
  sourceType: string;
  profileLink: string;
}

export interface Participant {
  id: string;
  name: string;
  slug: string;
  type: string;
  additionalName?: string;
  about?: string;
  imageUrl?: string;
  isSaved?: boolean;
  monthlySignalsCount?: number;
  sources?: Source[];
}

export interface TeamMember {
  id: string;
  name: string;
  headline?: string;
  imageUrl?: string;
}

export interface Person {
  id: string;
  name: string;
  type?: string;
  bio?: string;
}

export interface Stage {
  id: string;
  name: string;
  slug: string;
}

export interface RoundStatus {
  id: string;
  name: string;
  slug: string;
}

export interface Location {
  name: string;
  slug: string;
  country?: string;
}


export interface UserNote {
  noteText: string;
}

export interface UserData {
  isFavorited: boolean;
  isDeleted?: boolean;
  isAssignedToGroup?: boolean;
  folders?: GraphQLFolder[];
  userNote?: UserNote;
}

// Feed-specific UserData without folders (for comprehensive feed queries)
export interface FeedUserData {
  isFavorited: boolean;
  isDeleted?: boolean;
  isAssignedToGroup?: boolean;
  userNote?: UserNote;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface SignalType {
  id: string;
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

export interface Signal {
  id: string;
  date: string;
  description: string;
  signalType?: SignalType;
  participant?: Participant;
  associatedParticipant?: Participant;
}

export interface SignalCard {
  id: string;
  slug?: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  latestSignalDate?: string;
  stage: string;
  roundStatus: string;
  lastRound?: string;
  trending?: boolean;
  categories: Category[];
  teamMembers?: TeamMember[];
  userData?: FeedUserData;
  signals?: Signal[];
  remainingSignalsCount?: number;
  remainingParticipantsCount?: number;
  url?: string;
  socialLinks?: SocialLink[];
}

export interface SocialLink {
  name: string;
  url: string;
}

export interface FeedResponse {
  nodes: SignalCard[];
  totalCount: number;
  hasNextPage: boolean;
  currentPage?: number;
  totalPages?: number;
}



// New optimized filter types
export interface BasicFiltersResponse {
  categories: Category[];
  stages: Stage[];
  roundStatuses: RoundStatus[];
}

export interface PaginatedParticipantsResponse {
  participants: {
    nodes: Participant[];
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}

export interface PaginatedLocationsResponse {
  locations: {
    nodes: Location[];
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}

// Relay-style response types for cursor-based pagination
export interface RelayParticipantsResponse {
  participants: {
    edges: Array<{
      node: Participant;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

export interface RelayLocationsResponse {
  locationsRelay: {
    edges: Array<{
      node: Location;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

// Query Variables Types - simplified for the new comprehensive query
export interface UserFeedVariables {
  pagination?: PaginationInput;
  filters?: SignalCardFilters;
}

export interface FeedSignalCardsVariables {
  pagination?: PaginationInput;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  filters?: SignalCardFilters;
  includeSignals?: boolean;
  absoluteImageUrl?: boolean;
}


// Participant Follow Mutation Types
export interface ToggleParticipantFollowVariables {
  participantId: string;
  isSaved: boolean;
}

export interface ToggleParticipantFollowResponse {
  toggleParticipantFollow: {
    success: boolean;
    message: string;
    isSaved: boolean;
    participantId: string;
  };
}

// Efficient Filter Response Types
export interface AvailableCategoriesResponse {
  availableCategories: Category[];
}

export interface AvailableParticipantsResponse {
  availableParticipants: Participant[];
}

export interface AvailableStagesResponse {
  availableStages: Stage[];
}

export interface AvailableLocationsResponse {
  availableLocations: Location[];
}

// Detailed Card Types for GraphQL Response
export interface DetailedUserNote {
  id: string;
  noteText: string;
  createdAt: string;
  updatedAt: string;
}

export interface GraphQLFolder {
  id: string;
  name: string;
  isDefault: boolean;
  hasCard: boolean;
}

export interface DetailedUserData {
  isFavorited: boolean;
  isDeleted: boolean;
  isAssignedToGroup?: boolean;
  folders: GraphQLFolder[];
  userNote?: DetailedUserNote;
}

export interface DetailedPerson {
  id: string;
  name: string;
  type?: string;
  imageUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  crunchbaseUrl?: string;
  referenceUrl?: string;
  email?: string;
  bio?: string;
}

export interface DetailedTeamMember {
  id: string;
  name: string;
  headline?: string;
  imageUrl?: string;
  site?: string;
  crunchbase?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
  producthunt?: string;
  email?: string;
}

export interface DetailedSignal {
  id: string;
  date: string;
  createdAt: string;
  description: string;
  participant?: Participant;
  associatedParticipant?: Participant;
}

export interface DetailedCategory {
  id: string;
  name: string;
  slug: string;
}

export interface DetailedSignalCard {
  id: string;
  slug: string;
  uuid: string;
  name: string;
  description: string;
  url: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  lastRound?: string;
  stage: string;
  roundStatus: string;
  isOpen: boolean;
  referenceUrl?: string;
  featured: boolean;
  trending?: boolean;
  latestSignalDate?: string;
  discoveredAt?: string;
  categories: DetailedCategory[];
  teamMembers: DetailedTeamMember[];
  signals: DetailedSignal[];
  remainingParticipantsCount: number;
  socialLinks: SocialLink[];
  userData: DetailedUserData;
  hasTicket: boolean;
}

// Helper function types for regional locations
export interface RegionalHelperFunctions {
  getCountriesInRegion: (regionSlug: string) => string[];
  getRegionForCountry: (countryName: string) => RegionMapping | null;
  createRegionalFilterOptions: (
    activeLocations: string[]
  ) => RegionalFilterOption[];
}

// Entity Types for Tabbed Interface
export enum EntityType {
  FUNDS_INVESTORS = "FUNDS_INVESTORS",
  SYNDICATES = "SYNDICATES", 
  FOUNDERS = "FOUNDERS"
}

// Variables for entity-specific queries
export interface EntityQueryVariables {
  first?: number;
  after?: string;
  search?: string;
}

// Response types for entity-specific queries
export interface EntityParticipantsResponse {
  participants: {
    edges: Array<{
      node: Participant;
    }>;
    totalCount: number;
  };
}

export interface FundsInvestorsResponse extends EntityParticipantsResponse {}
export interface SyndicatesResponse extends EntityParticipantsResponse {}
export interface FoundersResponse extends EntityParticipantsResponse {}

// Entity-specific types
export interface ParticipantEdge {
  node: Participant;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface ParticipantConnection {
  edges: ParticipantEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface EntityQueryResponse {
  participants: ParticipantConnection;
}

// ===== SAVED FILTERS TYPES =====

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  filterSummary: string;
  hasActiveFilters: boolean;
  recentProjectsCount: number;
  
  // New signal preference fields (optional, may not be returned from GraphQL)
  isWeb2Filter?: boolean;
  isWeb3Filter?: boolean;

  // Smart filter mode fields
  participantFilterMode?: string;
  participantFilterIds?: string[];
  participantFilterTypes?: string[];

  // Filter configuration
  stages?: string[];
  roundStatuses?: string[];
  search?: string;
  featured?: boolean;
  isOpen?: boolean;
  new?: boolean;
  trending?: boolean;
  hideLiked?: boolean;
  startDate?: string;
  endDate?: string;
  minSignals?: number;
  maxSignals?: number;

  // Relationships
  categories: Category[];
  participants: Participant[];
}

export interface SavedFilterInput {
  name: string;
  description?: string;
  isDefault?: boolean;

  // Smart filter mode configuration
  participantFilter?: {
    mode: string;
    participantIds?: string[];
    participantTypes?: string[];
  };

  // Filter configuration
  categories?: string[];
  participants?: string[];
  stages?: string[];
  roundStatuses?: string[];
  featured?: boolean;
  isOpen?: boolean;
  new?: boolean;
  trending?: boolean;
  hideLiked?: boolean;
  startDate?: string;
  endDate?: string;
  minSignals?: number;
  maxSignals?: number;
  search?: string;
}

export interface SavedFiltersResponse {
  nodes: SavedFilter[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
}

export interface SavedFiltersSummary {
  savedFilters: SavedFilter[];
  totalCount: number;
  defaultFilter?: SavedFilter;
}

export interface SavedFilterMutationResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  savedFilter?: SavedFilter;
}

// Folder Cards Types
export interface FolderCardsVariables {
  folderKey: string;
  page: number;
  pageSize: number;
  filters?: SignalCardFilters;
}

export interface FolderCardsResponse {
  signalCards: FeedResponse;
}

// Notes Cards Types
export interface NotesCardsVariables {
  page: number;
  pageSize: number;
  filters?: SignalCardFilters;
}

export interface NotesCardsResponse {
  signalCards: FeedResponse;
}

// Group Assignments Types
export enum AssignmentStatus {
  REVIEW = 'REVIEW',
  REACHING_OUT = 'REACHING_OUT',
  CONNECTED = 'CONNECTED',
  NOT_A_FIT = 'NOT_A_FIT'
}

export enum AssignmentFilterType {
  MY_ASSIGNMENTS = 'MY_ASSIGNMENTS',
  ALL = 'ALL'
}

export interface UserGroupGraphQL {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignedUserGraphQL {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
}

export interface AssignedMemberInfo {
  user: AssignedUserGraphQL;
  assignedBy: AssignedUserGraphQL;
  assignedAt: string;
}

export interface GroupAssignedCardGraphQL {
  id: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  group: UserGroupGraphQL;
  signalCard: SignalCard;
  assignedUsersCount: number;
  totalGroupMembersCount: number;
  assignedMembers?: AssignedMemberInfo[];
  // Note: assignedUsers field is not available in current GraphQL schema
  // Filtering by MY_ASSIGNMENTS is handled server-side via filterType parameter
  assignedUsers?: AssignedUserGraphQL[];
}

export interface GroupAssignmentsConnection {
  nodes: GroupAssignedCardGraphQL[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
}

export interface GroupAssignmentsResponse {
  groupAssignments: GroupAssignmentsConnection;
}

export interface GroupAssignmentsVariables {
  pagination?: PaginationInput;
  statuses?: AssignmentStatus[];
  filterType?: AssignmentFilterType;
  includeSignals?: boolean;
  includeAssignedMembers?: boolean;
}

// Types for participant with children
export interface ParticipantWithChildren extends Participant {
  children?: Participant[];
  parent?: Participant;
}

export interface GetParticipantWithChildrenResponse {
  participant: ParticipantWithChildren;
}

export interface GetParticipantWithChildrenVariables {
  slug: string;
}

// Participant Signals Types
export interface ParticipantSignalsVariables {
  page: number;
  pageSize: number;
  filters?: SignalCardFilters;
}

export interface ParticipantSignalsResponse {
  signalCards: FeedResponse;
}

export interface CategoryStat {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface ParticipantsCategoryStatsResponse {
  participants: {
    totalCount: number;
    categoryStats: CategoryStat[];
  };
}

 