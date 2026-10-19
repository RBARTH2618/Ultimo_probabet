/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: state.js - Fachada de Compatibilidade (Facade Pattern)
 * ==============================================================================
 * Este arquivo atua como uma fachada unificada para os módulos especializados:
 *  - services/servicoUsuario.js
 *  - services/servicoPartida.js
 *  - services/servicoAposta.js
 *  - services/servicoCashout.js
 *  - services/servicoLiquidacao.js
 * ==============================================================================
 */

const servicoUsuario = require("./services/servicoUsuario");
const servicoPartida = require("./services/servicoPartida");
const servicoAposta = require("./services/servicoAposta");
const servicoCashout = require("./services/servicoCashout");
const servicoLiquidacao = require("./services/servicoLiquidacao");

module.exports = {
  // Apostadores e Ranking
  obterOuCriarApostador: servicoUsuario.obterOuCriarApostador,
  createOrGetUser: servicoUsuario.obterOuCriarApostador,
  obterApostador: servicoUsuario.obterApostador,
  getUser: servicoUsuario.obterApostador,
  redefinirSaldoApostador: servicoUsuario.redefinirSaldoApostador,
  resetUserBalance: servicoUsuario.redefinirSaldoApostador,
  obterClassificacaoRanking: servicoUsuario.obterClassificacaoRanking,
  getRanking: servicoUsuario.obterClassificacaoRanking,

  // Partidas e Mercados
  obterTodasPartidas: servicoPartida.obterTodasPartidas,
  getMatches: servicoPartida.obterTodasPartidas,
  obterPartida: servicoPartida.obterPartidaPorId,
  getMatch: servicoPartida.obterPartidaPorId,
  suspenderMercadoPartida: servicoPartida.suspenderMercadoPartida,
  suspendMatch: servicoPartida.suspenderMercadoPartida,
  retomarMercadoPartida: servicoPartida.retomarMercadoPartida,
  resumeMatch: servicoPartida.retomarMercadoPartida,
  reiniciarPartida: servicoPartida.reiniciarPartida,
  resetMatch: servicoPartida.reiniciarPartida,

  // Apostas e Cash Out
  efetuarAposta: servicoAposta.efetuarAposta,
  placeBet: servicoAposta.efetuarAposta,
  calcularValorCashOut: servicoCashout.calcularValorCashOut,
  calculateCashOutValue: servicoCashout.calculateCashOutValue,
  executarCashOut: servicoCashout.executarCashOut,
  executeCashOut: servicoCashout.executeCashOut,
  obterBilhetesDoApostador: servicoCashout.obterBilhetesDoApostador,
  getUserBets: servicoCashout.obterBilhetesDoApostador,

  // Liquidação
  liquidarApostasDaPartida: servicoLiquidacao.liquidarApostasDaPartida,
  settleBetsForMatch: servicoLiquidacao.liquidarApostasDaPartida
};
