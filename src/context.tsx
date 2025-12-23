import React, { createContext, useContext } from "react";
import type { UiAPI } from "./modules/ui";
import type { StorageAPI } from "./modules/storage";

// Extend this with WidgetContext fields so consumers can access them
// We can import WidgetContext or just define them here.
export interface ScopeContextValue {
  widgetId?: string;
  ui?: UiAPI;
  storage?: StorageAPI;
  // Context fields
  gridSize?: string;
  theme?: 'light' | 'dark';
  dimensions?: { width: number; height: number };
  config?: Record<string, any>;
  widgetStyle?: 'classic' | 'immersive';
}

export const WidgetScopeContext = createContext<ScopeContextValue>({});

export const WidgetScopeProvider: React.FC<{
  value: ScopeContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <WidgetScopeContext.Provider value={value}>{children}</WidgetScopeContext.Provider>
  );
};

export function useWidgetId() {
  const context = useContext(WidgetScopeContext);
  return context.widgetId;
}

export function useWidgetScope() {
  return useContext(WidgetScopeContext);
}
