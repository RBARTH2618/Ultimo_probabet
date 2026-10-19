/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/config/eventos.js - Dicionário de Eventos WebSocket no Frontend
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É a lista padronizada de eventos trocados entre o navegador e o servidor.
 * 
 * ⚙️ O QUE ELE FAZ?
 * Garante que tanto o frontend quanto o backend utilizem exatamente as mesmas
 * constantes de string para identificar mensagens como apostas, gols e cotações.
 * ==============================================================================
 */

export const EVENTOS_WS = {
  // Handshake e Sessão Inicial [RF-01]
  HANDSHAKE_SUCCESS: "HANDSHAKE_SUCCESS",

  // Cotações e Mercado [RF-02]
  ODDS_UPDATE: "ODDS_UPDATE",
  MARKET_RESUMED: "MARKET_RESUMED",

  // Gestão de Apostas [RF-03, RF-07]
  PLACE_BET: "PLACE_BET",
  BET_CONFIRMED: "BET_CONFIRMED",
  BET_REJECTED: "BET_REJECTED",
  BET_SETTLED: "BET_SETTLED",

  // Encerramento Antecipado (Cash Out) [RF-04, RF-05, RNF-01]
  CASH_OUT: "CASH_OUT",
  CASH_OUT_CONFIRMED: "CASH_OUT_CONFIRMED",
  CASH_OUT_REJECTED: "CASH_OUT_REJECTED",
  CASHOUT_HEARTBEAT: "CASHOUT_HEARTBEAT",

  // Saldo e Ranking [RF-08]
  BALANCE_UPDATE: "BALANCE_UPDATE",
  RANKING_UPDATE: "RANKING_UPDATE",
  GET_WALLET: "GET_WALLET",
  WALLET_INFO: "WALLET_INFO",
  RESET_BALANCE: "RESET_BALANCE",

  // Eventos de Partida [RF-06]
  GAME_EVENT: "GAME_EVENT",
  MATCH_FINISHED: "MATCH_FINISHED",
  MATCH_RESET: "MATCH_RESET",

  // Ações da Barra Didática de Demonstração
  DEMO_TRIGGER_GOAL: "DEMO_TRIGGER_GOAL",
  DEMO_RESET_MATCH: "DEMO_RESET_MATCH"
};

// Alias de compatibilidade retroativa
export const WS_EVENTS = EVENTOS_WS;
