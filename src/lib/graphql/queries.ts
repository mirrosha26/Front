import { gql } from '@apollo/client';

// User Feed Query - Using the optimized userFeed endpoint with comprehensive data
export const USER_FEED_QUERY = gql`
  query feedGetOptimizedComprehensiveUserFeed(
    $pagination: PaginationInput
    $filters: SignalCardFilters
  ) {
    userFeed(
      pagination: $pagination
      filters: $filters
      includeSignals: true
      absoluteImageUrl: true
    ) {
      nodes {
        id
        slug
        name
        description
        imageUrl
        createdAt
        latestSignalDate
        stage
        roundStatus
        lastRound
        trending
        categories {
          id
          name
          slug
          __typename
        }
        signals {
          id
          date
          description
          signalType {
            id
            name
            slug
            __typename
          }
          participant {
            id
            name
            slug
            type
            about
            imageUrl
            isSaved
            __typename
          }
          associatedParticipant {
            id
            name
            slug
            type
            about
            imageUrl
            isSaved
            __typename
          }
          __typename
        }
        remainingParticipantsCount
        url
        socialLinks {
          name
          url
          __typename
        }
        userData {
          isFavorited
          isDeleted
          isAssignedToGroup
          userNote {
            noteText
            __typename
          }
          __typename
        }
        __typename
      }
      totalCount
      hasNextPage
      currentPage
      totalPages
      __typename
    }
  }
`;

// Optimized Filters Query - Load basic filters first (lightweight)
export const BASIC_FILTERS_QUERY = gql`
  query BasicFilters {
    categories {
      id
      name
      slug
      __typename
    }
    stages {
      name
      slug
      __typename
    }
    roundStatuses {
      name
      slug
      __typename
    }
  }
`;


// Entity-specific participants queries with cursor-based pagination
export const ANGELS_QUERY = gql`
  query GetAngels($first: Int, $after: String, $search: String) {
    participants(
      first: $first
      after: $after
      search: $search
      types: ["angel"]
    ) {
      edges {
        node {
          id
          name
          slug
          type
          additionalName
          about
          imageUrl
          isSaved
          monthlySignalsCount
          __typename
        }
        cursor
        __typename
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        __typename
      }
      totalCount
      __typename
    }
  }
`;

export const VCS_INVESTORS_QUERY = gql`
  query GetVCsAndInvestors($first: Int, $after: String, $search: String) {
    participants(
      first: $first
      after: $after
      search: $search
      types: [
        "investor"
        "scout"
        "research"
        "engineer"
        "influencer"
        "unknown"
        "founder"
        "marketing"
        "writing"
        "legal"
        "operations"
        "socials"
        "business_development"
        "security"
        "finance"
        "due_diligence"
        "product"
        "protocol"
        "defi"
        "growth"
        "design"
        "data"
        "strategy"
        "board"
        "analyst"
        "content"
        "advisor"
        "ceo"
        "portfolio"
        "events"
        "communications"
        "trading"
        "GA"
        "other"
      ]
    ) {
      edges {
        node {
          id
          name
          slug
          type
          additionalName
          about
          imageUrl
          isSaved
          monthlySignalsCount
          __typename
        }
        cursor
        __typename
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        __typename
      }
      totalCount
      __typename
    }
  }
`;

export const SYNDICATES_QUERY = gql`
  query GetSyndicates($first: Int, $after: String, $search: String) {
    participants(
      first: $first
      after: $after
      search: $search
      types: ["accelerator", "fund", "platform", "syndicate", "community", "company"]
    ) {
      edges {
        node {
          id
          name
          slug
          type
          additionalName
          about
          imageUrl
          isSaved
          monthlySignalsCount
          __typename
        }
        cursor
        __typename
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        __typename
      }
      totalCount
      __typename
    }
  }
`;

export const FOUNDERS_QUERY = gql`
  query GetFounders($first: Int, $after: String, $search: String) {
    participants(
      first: $first
      after: $after
      search: $search
      types: ["founder", "person", "entrepreneur"]
    ) {
      edges {
        node {
          id
          name
          slug
          type
          additionalName
          about
          imageUrl
          isSaved
          monthlySignalsCount
          __typename
        }
        cursor
        __typename
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        __typename
      }
      totalCount
      __typename
    }
  }
`;

// Query for ALL favorites participants (all types)
export const GET_FAVORITES_QUERY = gql`
  query GetFavoritesParticipants($first: Int, $after: String, $search: String) {
    participants(
      first: $first
      after: $after
      search: $search
      isSaved: true
    ) {
      edges {
        node {
          id
          name
          slug
          type
          additionalName
          about
          imageUrl
          isSaved
          monthlySignalsCount
          __typename
        }
        cursor
        __typename
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        __typename
      }
      totalCount
      __typename
    }
  }
`;

// Query for ALL participants (all types, non-private)
export const ALL_PARTICIPANTS_QUERY = gql`
  query GetAllParticipants($first: Int, $after: String, $search: String) {
    participants(
      first: $first
      after: $after
      search: $search
    ) {
      edges {
        node {
          id
          name
          slug
          type
          additionalName
          about
          imageUrl
          isSaved
          monthlySignalsCount
          __typename
        }
        cursor
        __typename
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        __typename
      }
      totalCount
      __typename
    }
  }
`;

// ===== SAVED FILTERS QUERIES & MUTATIONS =====

// Unified query for filtering participants with all parameters
export const FILTERED_PARTICIPANTS_QUERY = gql`
  query GetFilteredParticipants(
    $first: Int
    $after: String
    $search: String
    $types: [String!]
    $isSaved: Boolean
    $fundsOnly: Boolean
    $sortByActivity: Boolean
  ) {
    participants(
      first: $first
      after: $after
      search: $search
      types: $types
      isSaved: $isSaved
      fundsOnly: $fundsOnly
      sortByActivity: $sortByActivity
    ) {
      edges {
        node {
          id
          name
          slug
          type
          additionalName
          about
          imageUrl
          isSaved
          monthlySignalsCount
          __typename
        }
        cursor
        __typename
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        __typename
      }
      totalCount
      __typename
    }
  }
`;

// Get all saved filters for the user
export const SAVED_FILTERS_QUERY = gql`
  query GetSavedFilters(
    $pagination: PaginationInput
    $includeRecentCounts: Boolean
  ) {
    savedFilters(
      pagination: $pagination
      includeRecentCounts: $includeRecentCounts
    ) {
      nodes {
        id
        name
        description
        isDefault
        createdAt
        updatedAt
        filterSummary
        hasActiveFilters
        recentProjectsCount

        # Smart filter mode fields
        participantFilterMode
        participantFilterIds
        participantFilterTypes

        # Multiple Categories
        categories {
          id
          name
          slug
        }

        # Multiple Participants
        participants {
          id
          name
          slug
          imageUrl
        }

        # Multiple Stages
        stages

        # Multiple Round Statuses
        roundStatuses

        search
        featured
        isOpen
        new
        trending
        hideLiked
        startDate
        endDate
        minSignals
        maxSignals
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
    }
  }
`;

// Get default saved filter
export const DEFAULT_SAVED_FILTER_QUERY = gql`
  query GetDefaultSavedFilter {
    defaultSavedFilter {
      id
      name
      description
      filterSummary
      participantFilterMode
      participantFilterIds
      participantFilterTypes
      categories {
        id
        name
        slug
      }
      participants {
        id
        name
        slug
      }
      stages
      roundStatuses
      search
      featured
      isOpen
      new
      trending
      hideLiked
      startDate
      endDate
      minSignals
      maxSignals
    }
  }
`;

// Get saved filters summary
export const SAVED_FILTERS_SUMMARY_QUERY = gql`
  query GetSavedFiltersSummary {
    savedFiltersSummary {
      savedFilters {
        id
        name
        description
        isDefault
        filterSummary
        hasActiveFilters
      }
      totalCount
      defaultFilter {
        id
        name
        description
      }
    }
  }
`;

// Create a new saved filter
export const CREATE_SAVED_FILTER_MUTATION = gql`
  mutation CreateSavedFilter($filterInput: SavedFilterInput!) {
    createSavedFilter(filterInput: $filterInput) {
      success
      message
      errorCode
      savedFilter {
        id
        name
        description
        isDefault
        filterSummary
        hasActiveFilters
        participantFilterMode
        participantFilterIds
        participantFilterTypes
        categories {
          id
          name
          slug
        }
        participants {
          id
          name
          slug
          imageUrl
        }
        stages
        roundStatuses
        search
        featured
        isOpen
        new
        trending
        hideLiked
        startDate
        endDate
        minSignals
        maxSignals
      }
    }
  }
`;

// Update an existing saved filter
export const UPDATE_SAVED_FILTER_MUTATION = gql`
  mutation UpdateSavedFilter($filterId: ID!, $filterInput: SavedFilterInput!) {
    updateSavedFilter(filterId: $filterId, filterInput: $filterInput) {
      success
      message
      errorCode
      savedFilter {
        id
        name
        description
        isDefault
        filterSummary
        hasActiveFilters
        participantFilterMode
        participantFilterIds
        participantFilterTypes
        categories {
          id
          name
          slug
        }
        participants {
          id
          name
          slug
          imageUrl
        }
        stages
        roundStatuses
        search
        featured
        isOpen
        new
        trending
        hideLiked
        startDate
        endDate
        minSignals
        maxSignals
      }
    }
  }
`;

// Delete a saved filter
export const DELETE_SAVED_FILTER_MUTATION = gql`
  mutation DeleteSavedFilter($filterId: ID!) {
    deleteSavedFilter(filterId: $filterId) {
      success
      message
      errorCode
    }
  }
`;

// Apply a saved filter (load its settings into active filters)
export const APPLY_SAVED_FILTER_MUTATION = gql`
  mutation ApplySavedFilter($filterId: ID!) {
    applySavedFilter(filterId: $filterId) {
      success
      message
      errorCode
      savedFilter {
        id
        name
        description
        isDefault
        filterSummary
        participantFilterMode
        participantFilterIds
        participantFilterTypes
        categories {
          id
          name
          slug
        }
        participants {
          id
          name
          slug
          imageUrl
        }
        stages
        roundStatuses
        search
        featured
        isOpen
        new
        trending
        hideLiked
        startDate
        endDate
        minSignals
        maxSignals
      }
    }
  }
`;

// Save current filters as a new saved filter
export const SAVE_CURRENT_FILTER_AS_MUTATION = gql`
  mutation SaveCurrentFilterAs($filterInput: SavedFilterInput!) {
    saveCurrentFilterAs(filterInput: $filterInput) {
      success
      message
      errorCode
      savedFilter {
        id
        name
        description
        isDefault
        filterSummary
        hasActiveFilters
        participantFilterMode
        participantFilterIds
        participantFilterTypes
        categories {
          id
          name
          slug
        }
        participants {
          id
          name
          slug
          imageUrl
        }
        stages
        roundStatuses
        search
        featured
        isOpen
        new
        trending
        hideLiked
        startDate
        endDate
        minSignals
        maxSignals
      }
    }
  }
`;

// Set a saved filter as the default
export const SET_DEFAULT_SAVED_FILTER_MUTATION = gql`
  mutation SetDefaultSavedFilter($filterId: ID!) {
    setDefaultSavedFilter(filterId: $filterId) {
      success
      message
      errorCode
    }
  }
`;

// Folder Cards Query - Get cards for a specific folder with pagination
export const GET_FOLDER_CARDS_QUERY = gql`
  query GetFolderCardsWithPagination(
    $folderKey: String!
    $page: Int!
    $pageSize: Int!
    $filters: SignalCardFilters
  ) {
    signalCards(
      folderKey: $folderKey
      includeSignals: true
      pagination: { page: $page, pageSize: $pageSize }
      filters: $filters
    ) {
      nodes {
        id
        name
        slug
        imageUrl
        createdAt
        latestSignalDate
        stage
        roundStatus
        lastRound
        trending
        description
        categories {
          id
          name
          slug
        }
        signals {
          id
          date
          description
          signalType {
            id
            name
            slug
            __typename
          }
          participant {
            id
            name
            slug
            type
            about
            imageUrl
            isSaved
          }
          associatedParticipant {
            id
            name
            slug
            type
            about
            imageUrl
            isSaved
          }
        }
        remainingParticipantsCount
        url
        socialLinks {
          name
          url
        }
        userData {
          isFavorited
          isDeleted
          isAssignedToGroup
          userNote {
            noteText
          }
        }
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
    }
  }
`;

// Notes Cards Query - Get cards with notes using cardType: NOTES
export const GET_CARDS_WITH_NOTES_QUERY = gql`
  query GetCardsWithNotes(
    $page: Int!
    $pageSize: Int!
    $filters: SignalCardFilters
  ) {
    signalCards(
      cardType: NOTES
      pagination: { page: $page, pageSize: $pageSize }
      includeSignals: true
      filters: $filters
    ) {
      nodes {
        id
        name
        slug
        description
        imageUrl
        createdAt
        latestSignalDate
        stage
        roundStatus
        lastRound
        trending
        categories {
          id
          name
          slug
        }
        signals {
          id
          date
          description
          signalType {
            id
            name
            slug
            __typename
          }
          participant {
            id
            name
            slug
            type
            about
            imageUrl
            isSaved
          }
          associatedParticipant {
            id
            name
            slug
            type
            about
            imageUrl
            isSaved
          }
        }
        remainingParticipantsCount
        url
        socialLinks {
          name
          url
        }
        userData {
          isFavorited
          isDeleted
          isAssignedToGroup
          userNote {
            id
            noteText
            createdAt
            updatedAt
          }
        }
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
    }
  }
`;

// Participant Signals Query - Get signals for a specific participant
export const GET_PARTICIPANT_SIGNALS_QUERY = gql`
  query GetParticipantSignals(
    $page: Int!
    $pageSize: Int!
    $filters: SignalCardFilters
  ) {
    signalCards(
      pagination: { page: $page, pageSize: $pageSize }
      includeSignals: true
      filters: $filters
    ) {
      nodes {
        id
        name
        slug
        description
        imageUrl
        createdAt
        latestSignalDate
        stage
        roundStatus
        lastRound
        trending
        categories {
          id
          name
          slug
        }
        signals {
          id
          date
          description
          signalType {
            id
            name
            slug
            __typename
          }
          participant {
            id
            name
            slug
            type
            about
            imageUrl
            isSaved
          }
          associatedParticipant {
            id
            name
            slug
            type
            about
            imageUrl
            isSaved
          }
        }
        remainingParticipantsCount
        url
        socialLinks {
          name
          url
        }
        userData {
          isFavorited
          isDeleted
          isAssignedToGroup
          userNote {
            id
            noteText
            createdAt
            updatedAt
          }
        }
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
    }
  }
`;

// Group Assignments Query - Get cards assigned to user's group
export const GET_GROUP_ASSIGNMENTS_QUERY = gql`
  query GetGroupAssignments(
    $pagination: PaginationInput
    $statuses: [AssignmentStatus!]
    $filterType: AssignmentFilterType
    $includeSignals: Boolean
    $includeAssignedMembers: Boolean
  ) {
    groupAssignments(
      pagination: $pagination
      statuses: $statuses
      filterType: $filterType
      includeSignals: $includeSignals
      includeAssignedMembers: $includeAssignedMembers
    ) {
      nodes {
        id
        status
        createdAt
        updatedAt
        group {
          id
          name
          slug
          logoUrl
          createdAt
          updatedAt
        }
        signalCard {
          id
          name
          slug
          description
          imageUrl
          createdAt
          latestSignalDate
          stage
          roundStatus
          lastRound
          trending
          categories {
            id
            name
            slug
          }
          signals {
            id
            date
            description
            signalType {
              id
              name
              slug
              __typename
            }
            participant {
              id
              name
              slug
              type
              about
              imageUrl
              isSaved
            }
            associatedParticipant {
              id
              name
              slug
              type
              about
              imageUrl
              isSaved
            }
          }
          remainingParticipantsCount
          url
          socialLinks {
            name
            url
          }
          userData {
            isFavorited
            isDeleted
            isAssignedToGroup
            userNote {
              id
              noteText
              createdAt
              updatedAt
            }
          }
        }
        assignedUsersCount
        totalGroupMembersCount  # Total members in the group
        assignedMembers {
          user {
            id
            username
            firstName
            lastName
            avatar
          }
          assignedBy {
            id
            username
            firstName
            lastName
            avatar
          }
          assignedAt
        }
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
    }
  }
`;

// Mutation for toggling participant follow status
export const TOGGLE_PARTICIPANT_FOLLOW_MUTATION = gql`
  mutation ToggleParticipantFollow($participantId: ID!, $isSaved: Boolean!) {
    toggleParticipantFollow(participantId: $participantId, isSaved: $isSaved) {
      success
      message
      isSaved
      participantId
    }
  }
`;

