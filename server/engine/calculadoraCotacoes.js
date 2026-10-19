/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: engine/calculadoraCotacoes.js - Cálculo Estocástico de Flutuação de Odds
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o modelo matemático de precificação de cotações (Odds) dinâmicas ao vivo.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Implementa [RF-02]: A cada ciclo de 2.5 segundos, calcula pequenas variações estocásticas
 *    nas cotações de Casa, Empate e Fora.
 *  - Identifica se a cotação subiu ("UP") ou caiu ("DOWN") para alimentar as setas e animações
 *    verdes e vermelhas exigidas no frontend.
 *  - Recalcula bruscamente as probabilidades após a ocorrência de um gol (favorecendo quem marcou).
 * 
 * 📍 ONDE É USADO?
 * Chamado periodicamente pelo motor de partidas (motorPartida.js).
 * ==============================================================================
 */

/**
 * [RF-02] Simula a oscilação natural do mercado esportivo com pequenas variações.
 * 
 * @param {object} partida - Objeto da partida em andamento
 * @returns {object|null} Mapa de cotações atualizadas e sentidos de movimento (UP, DOWN, SAME)
 */
function flutuarCotacoesDaPartida(partida) {
  const cotacoes1x2 = partida.odds["VENCEDOR_1X2"];
  if (!cotacoes1x2) return null;

  // Guarda os valores anteriores para calcular o sentido (alta/baixa)
  const cotacaoAnteriorCasa = cotacoes1x2.CASA;
  const cotacaoAnteriorEmpate = cotacoes1x2.EMPATE;
  const cotacaoAnteriorFora = cotacoes1x2.FORA;

  // Gerador de micropasso aleatório (-0.05 a +0.05)
  const deltaCasa = Number(((Math.random() - 0.49) * 0.08).toFixed(2));
  const deltaEmpate = Number(((Math.random() - 0.50) * 0.06).toFixed(2));
  const deltaFora = Number(((Math.random() - 0.50) * 0.10).toFixed(2));

  // Aplica as novas cotações respeitando limites mínimos realistas
  cotacoes1x2.CASA = Number(Math.max(1.05, cotacoes1x2.CASA + deltaCasa).toFixed(2));
  cotacoes1x2.EMPATE = Number(Math.max(1.10, cotacoes1x2.EMPATE + deltaEmpate).toFixed(2));
  cotacoes1x2.FORA = Number(Math.max(1.05, cotacoes1x2.FORA + deltaFora).toFixed(2));

  // Determina o sentido para as animações no frontend (verde / vermelho)
  const direcoes = {
    CASA: cotacoes1x2.CASA > cotacaoAnteriorCasa ? "UP" : cotacoes1x2.CASA < cotacaoAnteriorCasa ? "DOWN" : "SAME",
    EMPATE: cotacoes1x2.EMPATE > cotacaoAnteriorEmpate ? "UP" : cotacoes1x2.EMPATE < cotacaoAnteriorEmpate ? "DOWN" : "SAME",
    FORA: cotacoes1x2.FORA > cotacaoAnteriorFora ? "UP" : cotacoes1x2.FORA < cotacaoAnteriorFora ? "DOWN" : "SAME"
  };

  return {
    odds: partida.odds,
    cotacoes: partida.odds,
    directions: direcoes,
    direcoes: direcoes
  };
}

/**
 * Ajusta as cotações imediatamente após a validação de um gol.
 * O time que está na frente passa a ter uma odd menor (mais provável),
 * enquanto o time atrás tem sua cotação inflada.
 */
function recalcularCotacoesAposGol(partida) {
  const cotacoes = partida.odds["VENCEDOR_1X2"];
  if (!cotacoes) return;

  if (partida.placar_casa > partida.placar_fora) {
    cotacoes.CASA = Number((cotacoes.CASA * 0.70).toFixed(2));  // Odd cai (maior probabilidade)
    cotacoes.FORA = Number((cotacoes.FORA * 1.60).toFixed(2));  // Odd sobe
  } else if (partida.placar_fora > partida.placar_casa) {
    cotacoes.FORA = Number((cotacoes.FORA * 0.70).toFixed(2));
    cotacoes.CASA = Number((cotacoes.CASA * 1.60).toFixed(2));
  } else {
    cotacoes.EMPATE = Number((cotacoes.EMPATE * 0.85).toFixed(2));
  }
}

module.exports = {
  flutuarCotacoesDaPartida,
  recalcularCotacoesAposGol,
  // Aliases de compatibilidade retroativa
  fluctuateMatchOdds: flutuarCotacoesDaPartida,
  recalculateOddsAfterGoal: recalcularCotacoesAposGol
};
