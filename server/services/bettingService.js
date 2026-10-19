/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: services/bettingService.js - Submissão e Validação Atômica de Apostas
 * Responsabilidade Única: Validar integridade financeira e registrar bilhetes.
 * Implementa: [RF-03] Submissão de Aposta e [RNF-02] Saldo Não Negativo.
 * ==============================================================================
 */

const db = require("../data/db");
const userService = require("./userService");
const matchService = require("./matchService");
const { MATCH_STATUS, BET_STATUS } = require("../config/constants");

function placeBet(userId, betPayload) {
  const { matchId, mercadoId = "VENCEDOR_1X2", selecao, odd, valor } = betPayload;
  const user = userService.getUser(userId);

  if (!user) {
    return { success: false, code: "USER_NOT_FOUND", message: "Apostador não autenticado." };
  }

  const stake = Number(Number(valor).toFixed(2));
  if (isNaN(stake) || stake <= 0) {
    return { success: false, code: "INVALID_AMOUNT", message: "O valor da aposta deve ser maior que zero." };
  }

  // [RNF-02] Garantia de Saldo Não Negativo
  if (user.saldo_ficticio < stake) {
    return {
      success: false,
      code: "INSUFFICIENT_FUNDS",
      message: "Saldo insuficiente — Faça um depósito fictício para continuar apostando."
    };
  }

  const match = matchService.getMatch(matchId);
  if (!match) {
    return { success: false, code: "MATCH_NOT_FOUND", message: "Partida não encontrada." };
  }

  // Validação de mercado suspenso ou encerrado
  if (match.status_partida === MATCH_STATUS.SUSPENSA) {
    return {
      success: false,
      code: "MARKET_SUSPENDED",
      message: `Mercado Temporariamente Suspenso! Lance em andamento (${match.lock_motivo || "Aguarde"}).`
    };
  }

  if (match.status_partida === MATCH_STATUS.ENCERRADA) {
    return { success: false, code: "MATCH_CLOSED", message: "Esta partida já foi encerrada." };
  }

  // Verifica cotação atual no servidor
  const mercadoAtual = match.odds[mercadoId];
  const oddAtual = mercadoAtual ? mercadoAtual[selecao] : null;

  if (!oddAtual) {
    return { success: false, code: "INVALID_SELECTION", message: "Seleção ou mercado inválido." };
  }

  // [RNF-02] DÉBITO ATÔMICO
  const newBalance = userService.debitUser(userId, stake);

  // Criação do registro de bilhete
  const idAposta = db.generateBetId();
  const oddMomento = Number(Number(odd || oddAtual).toFixed(2));
  const retornoPotencial = Number((stake * oddMomento).toFixed(2));

  const novoBilhete = {
    id_aposta: idAposta,
    id_apostador: userId,
    id_partida: match.id_partida,
    time_casa: match.time_casa,
    time_fora: match.time_fora,
    id_mercado: mercadoId,
    selecao: selecao,
    valor_apostado: stake,
    odd_momento: oddMomento,
    retorno_potencial: retornoPotencial,
    status_aposta: BET_STATUS.ATIVA,
    data_hora_aposta: new Date().toISOString(),
    currentCashOut: stake * 0.95
  };

  db.saveBet(novoBilhete);

  return {
    success: true,
    ticketId: idAposta,
    bet: novoBilhete,
    newBalance: newBalance,
    timestamp: novoBilhete.data_hora_aposta
  };
}

function getBetById(betId) {
  return db.getBet(betId);
}

module.exports = {
  placeBet,
  getBetById
};
