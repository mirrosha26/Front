/**
 * Signal deduplication utilities
 * Handles deduplication of signals to show only the oldest signal per participant
 */

export interface ParticipantSignal {
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
    isPrivate?: boolean;
    sources?: Array<{
      id: string;
      slug: string;
      sourceType: string;
      profileLink: string;
    }>;
  };
  associatedParticipant?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    about?: string;
    imageUrl?: string;
    isSaved?: boolean;
    isPrivate?: boolean;
    sources?: Array<{
      id: string;
      slug: string;
      sourceType: string;
      profileLink: string;
    }>;
  };
  linkedinData?: {
    id: string;
    name: string;
    classification?: string;
    path?: string;
    reasoning?: string;
    tags?: string[];
    summary?: string;
    linkedinProfileUrl?: string;
    linkedinProfileImageUrl?: string | null;
    education?: string[];
    experience?: string[];
    notableAchievements?: string;
    curated?: boolean;
    createdAt?: string;
  };
  // NEW: Add founder information fields
  sourceSignalCard?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
  };
  founder?: {
    name: string;
    slug: string;
    imageUrl: string;
  };
}

/**
 * Gets the primary participant from a signal
 * Prioritizes associatedParticipant (usually fund/organization) over participant (individual)
 */
export function getPrimaryParticipant(signal: ParticipantSignal) {
  // For founder signals, create a participant-like object from founder data
  if ((signal as any).founder && !signal.participant && !signal.associatedParticipant) {
    const founder = (signal as any).founder;
    return {
      id: founder.slug, // Use slug as ID for founder
      name: founder.name,
      slug: founder.slug,
      imageUrl: founder.imageUrl,
      type: 'founder',
      isPrivate: false,
      isSaved: false,
      about: null,
      additionalName: null,
      sources: []
    };
  }
  
  return signal.associatedParticipant || signal.participant;
}

/**
 * Gets a unique identifier for a participant across signals
 * Uses participant ID as the key for deduplication
 */
export function getParticipantKey(signal: ParticipantSignal): string | null {
  const primaryParticipant = getPrimaryParticipant(signal);
  if (!primaryParticipant) return null;
  
  return primaryParticipant.id;
}

/**
 * Gets a unique identifier for the actual person (not the fund) across signals
 * This deduplicates by the individual participant, not the associated organization
 */
export function getPersonKey(signal: ParticipantSignal): string | null {
  // Always use the participant (individual person) for deduplication
  // If there's no participant, fall back to associatedParticipant
  const person = signal.participant || signal.associatedParticipant;
  
  // For LinkedIn signals without traditional participants, use LinkedIn data
  if (!person && signal.linkedinData) {
    return `linkedin-${signal.linkedinData.id}`;
  }
  
  // For founder signals, use the founder data
  if (!person && (signal as any).founder) {
    return `founder-${(signal as any).founder.slug}`;
  }
  
  if (!person) return null;
  
  return person.id;
}

/**
 * Deduplicates signals by keeping only the oldest signal per participant
 * This ensures that if there are multiple signals from the same person/organization,
 * only the first (oldest) signal is shown
 * 
 * @deprecated Use deduplicateSignalsByPerson for new implementations to avoid hiding signals from different people at the same fund
 */
export function deduplicateSignalsByParticipant<T extends ParticipantSignal>(
  signals: T[]
): T[] {
  if (!signals || signals.length === 0) return [];

  const participantMap = new Map<string, T>();

  signals.forEach((signal) => {
    const participantKey = getParticipantKey(signal);
    if (!participantKey) return;

    const existingSignal = participantMap.get(participantKey);
    
    if (!existingSignal) {
      // First signal from this participant
      participantMap.set(participantKey, signal);
    } else {
      // Compare dates to keep the oldest signal
      const existingDate = new Date(existingSignal.date);
      const currentDate = new Date(signal.date);
      
      if (currentDate < existingDate) {
        // Current signal is older, replace the existing one
        participantMap.set(participantKey, signal);
      }
      // If current signal is newer, keep the existing (older) one
    }
  });

  // Return deduplicated signals sorted by date (oldest first)
  return Array.from(participantMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Deduplicates signals by keeping only the oldest signal per person (individual participant)
 * This shows signals from different people even if they're from the same fund/organization
 * Only removes duplicate signals from the exact same person
 */
export function deduplicateSignalsByPerson<T extends ParticipantSignal>(
  signals: T[]
): T[] {
  if (!signals || signals.length === 0) return [];

  const personMap = new Map<string, T>();

  signals.forEach((signal) => {
    const personKey = getPersonKey(signal);
    if (!personKey) return;

    const existingSignal = personMap.get(personKey);
    
    if (!existingSignal) {
      // First signal from this person
      personMap.set(personKey, signal);
    } else {
      // Compare dates to keep the oldest signal
      const existingDate = new Date(existingSignal.date);
      const currentDate = new Date(signal.date);
      
      if (currentDate < existingDate) {
        // Current signal is older, replace the existing one
        personMap.set(personKey, signal);
      }
      // If current signal is newer, keep the existing (older) one
    }
  });

  // Return deduplicated signals sorted by date (oldest first)
  return Array.from(personMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Generates a legacy participants list from deduplicated signals
 * This maintains backward compatibility with existing UI components
 */
export function generateLegacyParticipantsList(signals: ParticipantSignal[]) {
  const deduplicatedSignals = deduplicateSignalsByPerson(signals);
  
  const participants: Array<{
    name: string;
    image: string | null;
    is_private: boolean;
    is_saved: boolean;
    type?: string;
    about?: string;
  }> = [];

  deduplicatedSignals.forEach((signal) => {
    const primaryParticipant = getPrimaryParticipant(signal);
    if (!primaryParticipant) return;

    // Check if we already have this participant (by name as fallback)
    const existingParticipant = participants.find(
      (p) => p.name === primaryParticipant.name
    );

    if (!existingParticipant) {
      participants.push({
        name: primaryParticipant.name,
        image: primaryParticipant.imageUrl || null,
        is_private: primaryParticipant.isPrivate || false,
        is_saved: primaryParticipant.isSaved || false,
        type: primaryParticipant.type,
        about: primaryParticipant.about
      });
    }
  });

  return participants;
} 