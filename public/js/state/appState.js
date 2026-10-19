/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/state/appState.js - Armazenamento de Estado Global do Cliente
 * Responsabilidade Única: Manter o estado centralizado e reativo do cliente web.
 * ==============================================================================
 */

export const AppState = {
  ws: null,
  userId: null,
  userName: null,
  balance: 100.00,
  matches: new Map(),
  activeBets: [],
  selectedSlip: null,
  currentSportFilter: "TODOS",
  audioContext: null
};
