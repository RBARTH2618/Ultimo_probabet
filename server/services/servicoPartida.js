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
 * Define status AO_VIVO, minuto 10, remove travas e restabelece as cotações para nova demonstração.
 */
function reiniciarTodasPartidas() {
  const partidasPadrao = obterPartidasIniciais();
  partidasPadrao.forEach(p => {
    p.status_partida = STATUS_PARTIDA.AO_VIVO;
    p.lock_motivo = null;
    p.lock_timestamp = 0;

    if (p.modalidade_esportiva === "BASQUETE") {
      p.minuto_jogo = 10;
      p.placar_casa = 24;
      p.placar_fora = 22;
      p.timeline = [
        { minuto: 1, tipo: "INFO", texto: "Partida de basquete iniciada/reiniciada para demonstração ao vivo." }
      ];
      if (p.odds && p.odds["VENCEDOR_1X2"]) {
        p.odds["VENCEDOR_1X2"].CASA = 1.70;
        p.odds["VENCEDOR_1X2"].EMPATE = 15.00;
        p.odds["VENCEDOR_1X2"].FORA = 2.15;
      }
    } else {
      p.minuto_jogo = 10;
      p.placar_casa = 0;
      p.placar_fora = 0;
      p.timeline = [
        { minuto: 1, tipo: "INFO", texto: "Partida de futebol iniciada/reiniciada para demonstração ao vivo." }
      ];
      if (p.odds && p.odds["VENCEDOR_1X2"]) {
        if (p.id_partida === 16) {
          p.odds["VENCEDOR_1X2"].CASA = 1.45;
          p.odds["VENCEDOR_1X2"].EMPATE = 4.00;
          p.odds["VENCEDOR_1X2"].FORA = 6.50;
        } else {
          p.odds["VENCEDOR_1X2"].CASA = 1.80;
          p.odds["VENCEDOR_1X2"].EMPATE = 3.10;
          p.odds["VENCEDOR_1X2"].FORA = 4.50;
        }
      }
    }

    bancoDados.partidas.set(p.id_partida, p);
  });
  return Array.from(bancoDados.partidas.values());
}

/**
 * Reinicia uma partida específica ou todas as partidas.
 * Para garantir sincronização na barra didática, reinicia todas as partidas por padrão.
 */
function reiniciarPartida(idPartida) {
  return reiniciarTodasPartidas();
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
