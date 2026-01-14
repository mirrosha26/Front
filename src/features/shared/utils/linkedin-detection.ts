import { CardPreview } from '../types/cards';

/**
 * Utility functions for detecting LinkedIn data in cards
 */

/**
 * Check if a card has any LinkedIn data attached
 * This includes LinkedIn URLs in people, team members, or signal sources
 */
export function hasLinkedInData(card: CardPreview): boolean {
  // Check if any signals have LinkedIn sources
  if (card.signals) {
    const hasLinkedInSignals = card.signals.some(signal => {
      // Check participant sources (safely accessing with any type)
      const participant = signal.participant as any;
      if (participant?.sources) {
        return participant.sources.some((source: any) => 
          source.sourceType?.toLowerCase() === 'linkedin' || 
          source.profileLink?.includes('linkedin.com')
        );
      }
      
      // Check associated participant sources (safely accessing with any type)
      const associatedParticipant = signal.associatedParticipant as any;
      if (associatedParticipant?.sources) {
        return associatedParticipant.sources.some((source: any) => 
          source.sourceType?.toLowerCase() === 'linkedin' || 
          source.profileLink?.includes('linkedin.com')
        );
      }
      
      return false;
    });
    
    if (hasLinkedInSignals) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if detailed card data has LinkedIn information
 * Used for more comprehensive checking when detailed data is available
 */
export function hasLinkedInDataDetailed(detailedCard: any): boolean {
  // Check people with LinkedIn URLs
  if (detailedCard?.people) {
    const hasLinkedInPeople = detailedCard.people.some((person: any) => 
      person.linkedinUrl || person.linkedin_url
    );
    if (hasLinkedInPeople) {
      console.log('[hasLinkedInDataDetailed] Found LinkedIn people');
      return true;
    }
  }
  
  // Check team members with LinkedIn URLs
  if (detailedCard?.teamMembers) {
    const hasLinkedInTeam = detailedCard.teamMembers.some((member: any) => 
      member.linkedin
    );
    if (hasLinkedInTeam) {
      console.log('[hasLinkedInDataDetailed] Found LinkedIn team members');
      return true;
    }
  }
  
  // Check signals for LinkedIn data
  if (detailedCard?.signals) {
    console.log('[hasLinkedInDataDetailed] Checking signals:', detailedCard.signals.map((s: any) => ({
      id: s.id,
      signalType: s.signalType,
      hasLinkedInData: !!s.linkedinData,
      linkedinDataKeys: s.linkedinData ? Object.keys(s.linkedinData) : null
    })));
    
    const hasLinkedInSignals = detailedCard.signals.some((signal: any) => {
      // Check if signal has linkedinData (new LinkedIn signals)
      if (signal.linkedinData) {
        console.log('[hasLinkedInDataDetailed] Found signal with linkedinData:', signal.id);
        return true;
      }
      
      // Check if signal type is LinkedIn
      if (signal.signalType?.slug === 'linkedin' || signal.signalType?.name === 'LinkedIn') {
        console.log('[hasLinkedInDataDetailed] Found LinkedIn signal type:', signal.id, signal.signalType);
        return true;
      }
      
      // Check participant sources
      if (signal.participant?.sources) {
        return signal.participant.sources.some((source: any) => 
          source.sourceType?.toLowerCase() === 'linkedin' || 
          source.profileLink?.includes('linkedin.com')
        );
      }
      
      // Check associated participant sources
      if (signal.associatedParticipant?.sources) {
        return signal.associatedParticipant.sources.some((source: any) => 
          source.sourceType?.toLowerCase() === 'linkedin' || 
          source.profileLink?.includes('linkedin.com')
        );
      }
      
      return false;
    });
    
    if (hasLinkedInSignals) {
      console.log('[hasLinkedInDataDetailed] Found LinkedIn signals');
      return true;
    }
  }
  
  console.log('[hasLinkedInDataDetailed] No LinkedIn data found');
  return false;
}

/**
 * Check if a card has normal (non-LinkedIn) signals
 */
export function hasNormalSignals(card: CardPreview): boolean {
  if (!card.signals || card.signals.length === 0) {
    return false;
  }

  return card.signals.some(signal => {
    // Check if it's NOT a LinkedIn signal
    const isLinkedInSignal = 
      signal.signalType?.slug === 'linkedin' ||
      signal.signalType?.name === 'LinkedIn' ||
      signal.linkedinData;

    return !isLinkedInSignal;
  });
}

/**
 * Check if detailed card data has normal (non-LinkedIn) signals
 */
export function hasNormalSignalsDetailed(detailedCard: any): boolean {
  if (!detailedCard?.signals || detailedCard.signals.length === 0) {
    console.log('[hasNormalSignalsDetailed] No signals found');
    return false;
  }

  const normalSignals = detailedCard.signals.filter((signal: any) => {
    // Check if it's NOT a LinkedIn signal
    const isLinkedInSignal = 
      signal.signalType?.slug === 'linkedin' ||
      signal.signalType?.name === 'LinkedIn' ||
      signal.linkedinData;

    return !isLinkedInSignal;
  });

  const result = normalSignals.length > 0;
  console.log('[hasNormalSignalsDetailed]', {
    totalSignals: detailedCard.signals.length,
    normalSignals: normalSignals.length,
    result,
    normalSignalIds: normalSignals.map((s: any) => s.id)
  });

  return result;
}

/**
 * Check if a card has both LinkedIn and normal signals
 */
export function hasBothSignalTypes(card: CardPreview): boolean {
  return hasLinkedInData(card) && hasNormalSignals(card);
}

/**
 * Check if detailed card data has both LinkedIn and normal signals
 */
export function hasBothSignalTypesDetailed(detailedCard: any): boolean {
  const hasLinkedIn = hasLinkedInDataDetailed(detailedCard);
  const hasNormal = hasNormalSignalsDetailed(detailedCard);
  const result = hasLinkedIn && hasNormal;
  
  console.log('[hasBothSignalTypesDetailed]', {
    hasLinkedIn,
    hasNormal,
    result,
    signalsCount: detailedCard?.signals?.length || 0,
    signals: detailedCard?.signals?.map((s: any) => ({
      id: s.id,
      signalType: s.signalType?.slug,
      hasLinkedInData: !!s.linkedinData,
      hasParticipant: !!s.participant,
      hasAssociatedParticipant: !!s.associatedParticipant
    }))
  });
  
  return result;
}

/**
 * Filter out cards that have LinkedIn data
 */
export function filterOutLinkedInCards(cards: CardPreview[]): CardPreview[] {
  return cards.filter(card => !hasLinkedInData(card));
}
