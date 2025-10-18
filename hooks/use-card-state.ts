"use client";

import { useState, useEffect } from "react";

type CardState = 'compact' | 'full' | 'full-with-chart';

const STORAGE_KEY_PREFIX = 'fr8-card-state';

/**
 * Custom hook to manage card state with localStorage persistence per page
 * Each page has its own independent card size preference
 * @param pageKey - Unique identifier for the page (e.g., 'ffa', 'fuel', 'dashboard-ffa')
 * @param defaultState - Default card state if no saved preference exists
 */
export function useCardState(pageKey: string, defaultState: CardState = 'full'): [CardState, (state: CardState) => void] {
  const [cardState, setCardStateInternal] = useState<CardState>(defaultState);
  const [isInitialized, setIsInitialized] = useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}-${pageKey}`;

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored && (stored === 'compact' || stored === 'full' || stored === 'full-with-chart')) {
      setCardStateInternal(stored as CardState);
    }
    setIsInitialized(true);
  }, [storageKey]);

  // Save state to localStorage when it changes
  const setCardState = (state: CardState) => {
    setCardStateInternal(state);
    localStorage.setItem(storageKey, state);
  };

  return [cardState, setCardState];
}

