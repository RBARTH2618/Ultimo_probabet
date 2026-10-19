/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: services/servicoPartida.js - Consulta e Ciclo de Vida das Partidas
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o serviço responsável por gerenciar as partidas de futebol e basquete ao vivo.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Lista todas as partidas ativas no sistema [RF-02].
 *  - Busca uma partida pelo seu ID único.
 *  - Suspende temporariamente o mercado de apostas quando ocorre um gol ou lance crucial [RF-06, RNF-01].
 *  - Reabre o mercado após a normalização das cotações.
 *  - Reinicia o placar e cronômetro para efeitos de demonstração acadêmica.
 * 
 * 📍 ONDE É USADO?
 * Pelo motor de partidas (motorPartida.js), pelo roteador WS e na listagem do Lobby.
 * ==============================================================================
 */

const bancoDados = require("../data/bancoDados");
const { obterPartidasIniciais } = require("../data/dadosIniciais");
const { STATUS_PARTIDA } = require("../config/constantes");

/**
 * Retorna todas as partidas cadastradas no banco em memória.
 */
function obterTodasPartidas() {
  return bancoDados.obterTodasPartidas();
}

/**
 * Busca uma partida específica pelo seu ID.
 */
function obterPartidaPorId(idPartida) {
  return bancoDados.obterPartida(idPartida);
}

/**
 * [RF-06 e RNF-01] Trava Atômica de Suspensão de Mercado.
 * Bloqueia submissão de novas apostas e requisições de Cash Out durante lances capitais (ex: Gol).
 */
function suspenderMercadoPartida(idPartida, motivo = "LANCE_DECISIVO") {
  const partida = obterPartidaPorId(idPartida);
  if (!partida) return;
  partida.status_partida = STATUS_PARTIDA.SUSPENSA;
  partida.lock_motivo = motivo;
  partida.lock_timestamp = Date.now();
}

/**
 * Reabre o mercado para negociações normais após o lance ser resolvido.
 */
function retomarMercadoPartida(idPartida) {
  const partida = obterPartidaPorId(idPartida);
  if (!partida) return;
  partida.status_partida = STATUS_PARTIDA.AO_VIVO;
  partida.lock_motivo = null;
  partida.lock_timestamp = 0;
}

/**
 * Reinicia todas as partidas restaurando o estado original ao vivo (União FC, Flamengo e Lakers).
 */
function reiniciarTodasPartidas() {
  const partidasPadrao = obterPartidasIniciais();
  partidasPadrao.forEach(p => {
    bancoDados.partidas.set(p.id_partida, p);
  });
  return Array.from(bancoDados.partidas.values());
}

/**
 * Reinicia uma partida específica ou todas as partidas caso idPartida seja "TODAS" ou omitido.
 */
function reiniciarPartida(idPartida) {
  if (!idPartida || idPartida === "TODAS") {
    return reiniciarTodasPartidas();
  }

  const idNum = Number(idPartida);
  const partidasIniciais = obterPartidasIniciais();
  const partidaPadrao = partidasIniciais.find(p => p.id_partida === idNum);

  if (partidaPadrao) {
    bancoDados.partidas.set(idNum, partidaPadrao);
    return partidaPadrao;
  }

  const partida = obterPartidaPorId(idNum);
  if (!partida) return null;

  partida.placar_casa = 0;
  partida.placar_fora = 0;
  partida.minuto_jogo = 10;
  partida.status_partida = STATUS_PARTIDA.AO_VIVO;
  partida.lock_motivo = null;
  partida.lock_timestamp = 0;
  partida.timeline = [
    { minuto: 1, tipo: "INFO", texto: "Partida reiniciada para demonstração ao vivo." }
  ];

  if (partida.odds["VENCEDOR_1X2"]) {
    partida.odds["VENCEDOR_1X2"].CASA = 1.90;
    partida.odds["VENCEDOR_1X2"].EMPATE = 3.20;
    partida.odds["VENCEDOR_1X2"].FORA = 4.20;
  }

  return partida;
}

module.exports = {
  obterTodasPartidas,
  obterPartidaPorId,
  suspenderMercadoPartida,
  retomarMercadoPartida,
  reiniciarPartida,
  reiniciarTodasPartidas,
  // Aliases para compatibilidade retroativa
  getAllMatches: obterTodasPartidas,
  getMatch: obterPartidaPorId,
  suspendMatch: suspenderMercadoPartida,
  resumeMatch: retomarMercadoPartida,
  resetMatch: reiniciarPartida,
  resetAllMatches: reiniciarTodasPartidas
};
