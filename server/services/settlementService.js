/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: services/settlementService.js - Liquidação Automática de Apostas
 * Responsabilidade Única: Avaliar resultados, marcar GREEN/RED e creditar prêmios.
 * Implementa: [RF-07] Liquidação Automática ao Final da Partida (90 minutos).
 * ==============================================================================
 */

const db = require("../data/db");
const userService = require("./userService");
const matchService = require("./matchService");
const { MATCH_STATUS, BET_STATUS } = require("../config/constants");

function settleBetsForMatch(matchId) {
  const match = matchService.getMatch(matchId);
  if (!match) return [];

  let vencedor = "EMPATE";
  if (match.placar_casa > match.placar_fora) vencedor = "CASA";
  else if (match.placar_fora > match.placar_casa) vencedor = "FORA";

  const liquidacoes = [];

  for (const bet of db.getAllBets()) {
    if (bet.id_partida === matchId && bet.status_aposta === BET_STATUS.ATIVA) {
      const user = userService.getUser(bet.id_apostador);
      const isWinner = (bet.selecao === vencedor);

      if (isWinner) {
        bet.status_aposta = BET_STATUS.GREEN;
        if (user) {
          userService.creditUser(bet.id_apostador, bet.retorno_potencial);
        }
      } else {
        bet.status_aposta = BET_STATUS.RED;
      }

      liquidacoes.push({
        betId: bet.id_aposta,
        userId: bet.id_apostador,
        status: bet.status_aposta,
        retorno: isWinner ? bet.retorno_potencial : 0,
        newBalance: user ? user.saldo_ficticio : 0
      });
    }
  }

  match.status_partida = MATCH_STATUS.ENCERRADA;
  return liquidacoes;
}

module.exports = {
  settleBetsForMatch
};
