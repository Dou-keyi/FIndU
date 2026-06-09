// PortfolioSuggestionContext.jsx — shares AI portfolio suggestions between PostComposer and PortfolioPage
import React, { createContext, useContext, useState, useCallback } from 'react';

const PortfolioSuggestionContext = createContext(null);

export function PortfolioSuggestionProvider({ children }) {
  const [suggestion, setSuggestion] = useState(null);

  const clearSuggestion = useCallback(() => setSuggestion(null), []);

  return (
    <PortfolioSuggestionContext.Provider value={{ suggestion, setSuggestion, clearSuggestion }}>
      {children}
    </PortfolioSuggestionContext.Provider>
  );
}

export function usePortfolioSuggestion() {
  const ctx = useContext(PortfolioSuggestionContext);
  if (!ctx) {
    throw new Error('usePortfolioSuggestion must be used within PortfolioSuggestionProvider');
  }
  return ctx;
}
