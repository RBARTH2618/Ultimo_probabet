/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: services/matchService.js - Consulta e Estado das Partidas
 * Responsabilidade Única: Gerenciar ciclo de vida e estado das partidas e mercados.
 * ==============================================================================
 */

const db = require("../data/db");
const { MATCH_STATUS } = require("../config/constants");

function getAllMatches() {
  return db.getAllMatches();
}

function getMatch(matchId) {
  return db.getMatch(matchId);
}

function suspendMatch(matchId, motivo = "LANCE_DECISIVO") {
  const match = getMatch(matchId);
  if (!match) return;
  match.status_partida = MATCH_STATUS.SUSPENSA;
  match.lock_motivo = motivo;
  match.lock_timestamp = Date.now();
}

function resumeMatch(matchId) {
  const match = getMatch(matchId);
  if (!match) return;
  match.status_partida = MATCH_STATUS.AO_VIVO;
  match.lock_motivo = null;
  match.lock_timestamp = 0;
}

function resetMatch(matchId) {
  const match = getMatch(matchId);
  if (!match) return null;

  match.placar_casa = 0;
  match.placar_fora = 0;
  match.minuto_jogo = 10;
  match.status_partida = MATCH_STATUS.AO_VIVO;
  match.lock_motivo = null;
  match.timeline = [
    { minuto: 1, tipo: "INFO", texto: "Partida reiniciada para demonstração." }
  ];

  if (match.odds["VENCEDOR_1X2"]) {
    match.odds["VENCEDOR_1X2"].CASA = 1.90;
    match.odds["VENCEDOR_1X2"].EMPATE = 3.20;
    match.odds["VENCEDOR_1X2"].FORA = 4.20;
  }

  return match;
}

module.exports = {
  getAllMatches,
  getMatch,
  suspendMatch,
  resumeMatch,
  resetMatch
};
