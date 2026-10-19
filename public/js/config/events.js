/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/config/events.js - Dicionário de Eventos WebSocket do Cliente
 * Responsabilidade Única: Centralizar os nomes dos eventos trafegados via WS.
 * ==============================================================================
 */

export const WS_EVENTS = {
  // Handshake e Sessão
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

  // Saldo e Ranking
  BALANCE_UPDATE: "BALANCE_UPDATE",
  RANKING_UPDATE: "RANKING_UPDATE",
  GET_WALLET: "GET_WALLET",
  WALLET_INFO: "WALLET_INFO",
  RESET_BALANCE: "RESET_BALANCE",

  // Eventos de Partida
  GAME_EVENT: "GAME_EVENT",
  MATCH_FINISHED: "MATCH_FINISHED",
  MATCH_RESET: "MATCH_RESET",

  // Comandos de Demonstração
  DEMO_TRIGGER_GOAL: "DEMO_TRIGGER_GOAL",
  DEMO_RESET_MATCH: "DEMO_RESET_MATCH"
};
