/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: services/cashoutService.js - Cálculo e Liquidação Antecipada (Cash Out)
 * Responsabilidade Única: Avaliar valor de resgate e processar com trava atômica.
 * Implementa: [RF-04] Recálculo Contínuo, [RF-05] Cash Out e [RNF-01] Anti-Race Condition.
 * ==============================================================================
 */

const db = require("../data/db");
const userService = require("./userService");
const matchService = require("./matchService");
const { MATCH_STATUS, BET_STATUS, CONFIG } = require("../config/constants");

/**
 * [RF-04] Algoritmo Didático de Recálculo de Cash Out
 * Baseia-se no status atual do jogo, tempo decorrido e se a aposta está vencendo ou perdendo.
 */
function calculateCashOutValue(bet, match) {
  if (bet.status_aposta !== BET_STATUS.ATIVA) return 0;
  if (!match || match.status_partida === MATCH_STATUS.ENCERRADA) return 0;

  const { placar_casa, placar_fora, minuto_jogo, status_partida } = match;

  // Se o mercado estiver suspenso (ex: gol acontecendo), o valor congela
  if (status_partida === MATCH_STATUS.SUSPENSA) {
    return bet.currentCashOut || bet.valor_apostado;
  }

  let statusFavoravel = false;
  const empate = placar_casa === placar_fora;

  if (bet.selecao === "CASA" && placar_casa > placar_fora) statusFavoravel = true;
  if (bet.selecao === "FORA" && placar_fora > placar_casa) statusFavoravel = true;
  if (bet.selecao === "EMPATE" && empate) statusFavoravel = true;

  const progresso = Math.min(minuto_jogo / 90, 0.98);
  let valorEstimado = bet.valor_apostado;

  if (statusFavoravel) {
    // Aposta está batendo: valor cresce conforme os minutos passam rumo ao retorno total
    const lucroMaximo = bet.retorno_potencial - bet.valor_apostado;
    valorEstimado = bet.valor_apostado + (lucroMaximo * progresso * CONFIG.HOUSE_MARGIN);
  } else if (empate && bet.selecao !== "EMPATE") {
    // Jogo empatado: ainda mantém 60-80% do valor
    valorEstimado = bet.valor_apostado * (1 - (progresso * 0.45));
  } else {
    // Perdendo: valor do resgate cai gradativamente para evitar perda total
    valorEstimado = Math.max(bet.valor_apostado * (1 - (progresso * 0.85)), 1.50);
  }

  const cashOutCalculado = Number(Math.min(valorEstimado, bet.retorno_potencial * 0.98).toFixed(2));
  bet.currentCashOut = cashOutCalculado;
  return cashOutCalculado;
}

/**
 * [RF-05 & RNF-01] Execução com Prevenção de Race Condition
 */
function executeCashOut(userId, betId, matchId, requestedValue) {
  const user = userService.getUser(userId);
  if (!user) {
    return { success: false, code: "USER_NOT_FOUND", message: "Apostador não encontrado." };
  }

  const bet = db.getBet(Number(betId));
  if (!bet) {
    return { success: false, code: "BET_NOT_FOUND", message: "Bilhete de aposta não encontrado." };
  }

  if (bet.id_apostador !== userId) {
    return { success: false, code: "FORBIDDEN", message: "Este bilhete não pertence a você." };
  }

  if (bet.status_aposta !== BET_STATUS.ATIVA) {
    return { success: false, code: "ALREADY_SETTLED", message: `Este bilhete já está ${bet.status_aposta}.` };
  }

  const match = matchService.getMatch(matchId || bet.id_partida);
  if (!match) {
    return { success: false, code: "MATCH_NOT_FOUND", message: "Partida associada não encontrada." };
  }

  // [RNF-01] Trava Atômica: Se um evento acabou de acontecer ou o mercado está suspenso
  if (match.status_partida === MATCH_STATUS.SUSPENSA) {
    return {
      success: false,
      code: "RACE_CONDITION_DETECTED",
      message: "Proposta expirada — Placar alterado / Mercado temporariamente suspenso!"
    };
  }

  // Recalcula o valor justo do Cash Out no momento exato da transação
  const valorOferecidoAtual = calculateCashOutValue(bet, match);

  // Tolerância de discrepância de cotação
  const reqVal = Number(requestedValue);
  if (!isNaN(reqVal) && Math.abs(reqVal - valorOferecidoAtual) > (valorOferecidoAtual * 0.15 + 1.0)) {
    return {
      success: false,
      code: "ODD_CHANGED",
      message: `Proposta expirada — O valor de resgate foi alterado para R$ ${valorOferecidoAtual.toFixed(2)}.`,
      newOfferedValue: valorOferecidoAtual
    };
  }

  // Transação atômica confirmada
  const valorFinalResgate = valorOferecidoAtual;
  bet.status_aposta = BET_STATUS.CASH_OUT;
  bet.valor_resgatado = valorFinalResgate;

  // Credita no saldo do apostador
  const newBalance = userService.creditUser(userId, valorFinalResgate);

  // Registra a auditoria da transação
  const transacao = {
    id_cashout: db.generateCashoutId(),
    id_aposta: bet.id_aposta,
    valor_resgate_oferecido: valorOferecidoAtual,
    valor_resgatado: valorFinalResgate,
    timestamp_efetivacao: new Date().toISOString()
  };
  db.addCashoutTransaction(transacao);

  return {
    success: true,
    betId: bet.id_aposta,
    amount: valorFinalResgate,
    newBalance: newBalance,
    timestamp: transacao.timestamp_efetivacao
  };
}

function getUserBets(userId) {
  const lista = [];
  for (const bet of db.getAllBets()) {
    if (bet.id_apostador === userId) {
      const match = matchService.getMatch(bet.id_partida);
      if (bet.status_aposta === BET_STATUS.ATIVA && match) {
        bet.currentCashOut = calculateCashOutValue(bet, match);
      }
      lista.push({ ...bet });
    }
  }
  return lista.reverse(); // Mais recentes primeiro
}

module.exports = {
  calculateCashOutValue,
  executeCashOut,
  getUserBets
};
