/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: state.js - Fachada de Compatibilidade (Facade Pattern)
 * ==============================================================================
 * Este arquivo atua como uma fachada unificada para os módulos especializados:
 *  - services/userService.js
 *  - services/matchService.js
 *  - services/bettingService.js
 *  - services/cashoutService.js
 *  - services/settlementService.js
 * ==============================================================================
 */

const userService = require("./services/userService");
const matchService = require("./services/matchService");
const bettingService = require("./services/bettingService");
const cashoutService = require("./services/cashoutService");
const settlementService = require("./services/settlementService");

module.exports = {
  // Usuários e Ranking
  createOrGetUser: userService.createOrGetUser,
  getUser: userService.getUser,
  resetUserBalance: userService.resetUserBalance,
  getRanking: userService.getRanking,

  // Partidas e Mercados
  getMatches: matchService.getAllMatches,
  getMatch: matchService.getMatch,
  suspendMatch: matchService.suspendMatch,
  resumeMatch: matchService.resumeMatch,
  resetMatch: matchService.resetMatch,

  // Apostas e Cash Out
  placeBet: bettingService.placeBet,
  calculateCashOutValue: cashoutService.calculateCashOutValue,
  executeCashOut: cashoutService.executeCashOut,
  getUserBets: cashoutService.getUserBets,

  // Liquidação
  settleBetsForMatch: settlementService.settleBetsForMatch
};
