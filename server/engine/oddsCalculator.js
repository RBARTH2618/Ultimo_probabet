/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: engine/oddsCalculator.js - Cálculo Estocástico de Flutuação de Odds
 * Responsabilidade Única: Calcular variações de cotações e sentidos de movimento.
 * Implementa: [RF-02] Flutuação Contínua de Odds (Up / Down).
 * ==============================================================================
 */

function fluctuateMatchOdds(match) {
  const odds1x2 = match.odds["VENCEDOR_1X2"];
  if (!odds1x2) return null;

  // Salva referências anteriores para detectar subida/queda
  const prevCasa = odds1x2.CASA;
  const prevEmpate = odds1x2.EMPATE;
  const prevFora = odds1x2.FORA;

  // Gerador de pequena variação (-0.05 a +0.05)
  const deltaCasa = Number(((Math.random() - 0.49) * 0.08).toFixed(2));
  const deltaEmpate = Number(((Math.random() - 0.50) * 0.06).toFixed(2));
  const deltaFora = Number(((Math.random() - 0.50) * 0.10).toFixed(2));

  // Aplica mantendo limites realistas (mínimo 1.05)
  odds1x2.CASA = Number(Math.max(1.05, odds1x2.CASA + deltaCasa).toFixed(2));
  odds1x2.EMPATE = Number(Math.max(1.10, odds1x2.EMPATE + deltaEmpate).toFixed(2));
  odds1x2.FORA = Number(Math.max(1.05, odds1x2.FORA + deltaFora).toFixed(2));

  // Determina o sentido para as animações no frontend (verde / vermelho)
  const directions = {
    CASA: odds1x2.CASA > prevCasa ? "UP" : odds1x2.CASA < prevCasa ? "DOWN" : "SAME",
    EMPATE: odds1x2.EMPATE > prevEmpate ? "UP" : odds1x2.EMPATE < prevEmpate ? "DOWN" : "SAME",
    FORA: odds1x2.FORA > prevFora ? "UP" : odds1x2.FORA < prevFora ? "DOWN" : "SAME"
  };

  return {
    odds: match.odds,
    directions
  };
}

function recalculateOddsAfterGoal(match) {
  const odds = match.odds["VENCEDOR_1X2"];
  if (!odds) return;

  if (match.placar_casa > match.placar_fora) {
    odds.CASA = Number((odds.CASA * 0.70).toFixed(2)); // Odd cai porque ficou mais provável
    odds.FORA = Number((odds.FORA * 1.60).toFixed(2)); // Odd sobe
  } else if (match.placar_fora > match.placar_casa) {
    odds.FORA = Number((odds.FORA * 0.70).toFixed(2));
    odds.CASA = Number((odds.CASA * 1.60).toFixed(2));
  } else {
    odds.EMPATE = Number((odds.EMPATE * 0.85).toFixed(2));
  }
}

module.exports = {
  fluctuateMatchOdds,
  recalculateOddsAfterGoal
};
