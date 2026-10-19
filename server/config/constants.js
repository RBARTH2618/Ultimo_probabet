/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: config/constants.js - Constantes do Sistema e Dicionário de Eventos
 * Responsabilidade Única: Centralizar contratos de eventos e configurações fixas.
 * ==============================================================================
 */

const WS_EVENTS = {
  // Handshake & Sessão
  HANDSHAKE_SUCCESS: "HANDSHAKE_SUCCESS",
  
  // Cotações e Mercado
  ODDS_UPDATE: "ODDS_UPDATE",
  MARKET_RESUMED: "MARKET_RESUMED",
  
  // Apostas
  PLACE_BET: "PLACE_BET",
  BET_CONFIRMED: "BET_CONFIRMED",
  BET_REJECTED: "BET_REJECTED",
  BET_SETTLED: "BET_SETTLED",
  
  // Cash Out
  CASH_OUT: "CASH_OUT",
  CASH_OUT_CONFIRMED: "CASH_OUT_CONFIRMED",
  CASH_OUT_REJECTED: "CASH_OUT_REJECTED",
  CASHOUT_HEARTBEAT: "CASHOUT_HEARTBEAT",
  
  // Saldo & Ranking
  BALANCE_UPDATE: "BALANCE_UPDATE",
  RANKING_UPDATE: "RANKING_UPDATE",
  GET_WALLET: "GET_WALLET",
  WALLET_INFO: "WALLET_INFO",
  RESET_BALANCE: "RESET_BALANCE",
  
  // Eventos de Jogo & Partida
  GAME_EVENT: "GAME_EVENT",
  MATCH_FINISHED: "MATCH_FINISHED",
  MATCH_RESET: "MATCH_RESET",
  
  // Ações de Demonstração Didática
  DEMO_TRIGGER_GOAL: "DEMO_TRIGGER_GOAL",
  DEMO_RESET_MATCH: "DEMO_RESET_MATCH",
  
  // Erros
  ERROR: "ERROR"
};

const MATCH_STATUS = {
  AO_VIVO: "AO_VIVO",
  SUSPENSA: "SUSPENSA",
  ENCERRADA: "ENCERRADA"
};

const BET_STATUS = {
  ATIVA: "ATIVA",
  GREEN: "GREEN",
  RED: "RED",
  CASH_OUT: "CASH_OUT"
};

const CONFIG = {
  INITIAL_BALANCE: 100.00,
  ENGINE_TICK_MS: 2500,
  HOUSE_MARGIN: 0.92,
  INITIAL_TICKET_ID: 1032,
  INITIAL_CASHOUT_ID: 501
};

module.exports = {
  WS_EVENTS,
  MATCH_STATUS,
  BET_STATUS,
  CONFIG
};
