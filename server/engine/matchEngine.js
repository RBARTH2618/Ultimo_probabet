/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: engine/matchEngine.js - Motor da Partida e Loop de Simulação
 * Responsabilidade Única: Orquestrar tempo de jogo, lances e emissão de eventos.
 * Implementa: [RF-02], [RF-04], [RF-06] e [RF-07].
 * ==============================================================================
 */

const matchService = require("../services/matchService");
const settlementService = require("../services/settlementService");
const userService = require("../services/userService");
const { fluctuateMatchOdds, recalculateOddsAfterGoal } = require("./oddsCalculator");
const { WS_EVENTS, MATCH_STATUS, CONFIG } = require("../config/constants");

class MatchEngine {
  constructor(broadcastCallback, notifyUserCallback) {
    this.broadcast = broadcastCallback;
    this.notifyUser = notifyUserCallback;
    this.intervalId = null;
    this.tickCount = 0;
  }

  start() {
    if (this.intervalId) return;

    console.log("⚽ [ENGINE] Motor da Partida iniciado. Frequência de odds: ~2.5 segundos.");

    this.intervalId = setInterval(() => {
      this.tick();
    }, CONFIG.ENGINE_TICK_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("⏹️ [ENGINE] Motor pausado.");
    }
  }

  tick() {
    this.tickCount++;
    const matches = matchService.getAllMatches();

    for (const match of matches) {
      if (match.status_partida === MATCH_STATUS.ENCERRADA) continue;
      if (match.status_partida === MATCH_STATUS.SUSPENSA) continue;

      // Avança 1 minuto a cada 4 ticks (~10s reais)
      if (this.tickCount % 4 === 0 && match.minuto_jogo < 90) {
        match.minuto_jogo += 1;
      }

      // [RF-02] Flutuação Estocástica de Odds
      this.processOddsFluctuation(match);

      // [RF-06] Lances Aleatórios (Gol, Cartão)
      if (this.tickCount % 16 === 0) {
        const rand = Math.random();
        if (rand < 0.35) {
          this.triggerRandomEvent(match);
        }
      }

      // [RF-07] Encerramento da Partida aos 90 minutos
      if (match.minuto_jogo >= 90 && match.status_partida !== MATCH_STATUS.ENCERRADA) {
        this.finishMatch(match);
      }
    }

    // [RF-04] Pulso de Cash Out
    this.broadcastCashOutUpdates();
  }

  processOddsFluctuation(match) {
    const calcResult = fluctuateMatchOdds(match);
    if (!calcResult) return;

    this.broadcast({
      event: WS_EVENTS.ODDS_UPDATE,
      matchId: match.id_partida,
      minuto: match.minuto_jogo,
      placar: {
        casa: match.placar_casa,
        fora: match.placar_fora
      },
      odds: {
        "VENCEDOR_1X2": { ...match.odds["VENCEDOR_1X2"] },
        "PROXIMO_GOL": match.odds["PROXIMO_GOL"],
        "TOTAL_GOLS": match.odds["TOTAL_GOLS"]
      },
      directions: calcResult.directions,
      timestamp: new Date().toISOString()
    });
  }

  triggerRandomEvent(match) {
    const tipos = ["CARD_YELLOW", "GOAL", "CARD_YELLOW"];
    const sorteado = tipos[Math.floor(Math.random() * tipos.length)];

    if (sorteado === "GOAL") {
      const time = Math.random() > 0.4 ? "CASA" : "FORA";
      this.triggerGoal(match.id_partida, time, "Lance ao vivo!");
    } else {
      this.triggerCard(match.id_partida);
    }
  }

  triggerGoal(matchId, time = "CASA", autor = "Chute colocado!") {
    const match = matchService.getMatch(matchId);
    if (!match) return;

    if (time === "CASA") {
      match.placar_casa += 1;
    } else {
      match.placar_fora += 1;
    }

    const timeNome = (time === "CASA") ? match.time_casa : match.time_fora;
    const descricao = `⚽ GOL do ${timeNome}! (${match.minuto_jogo}') - ${autor}`;

    match.timeline.unshift({
      minuto: match.minuto_jogo,
      tipo: "GOAL",
      texto: descricao
    });

    // [RNF-01] Ativa a Trava Atômica de Suspensão de Mercado
    matchService.suspendMatch(matchId, "GOL_CONFIRMADO");

    console.log(`🚨 [EVENTO] ${descricao} -> Mercado da partida ${matchId} SUSPENSO!`);

    this.broadcast({
      event: WS_EVENTS.GAME_EVENT,
      type: "GOAL",
      matchId: match.id_partida,
      time: timeNome,
      minute: match.minuto_jogo,
      description: descricao,
      score: {
        casa: match.placar_casa,
        fora: match.placar_fora
      },
      status: MATCH_STATUS.SUSPENSA,
      timestamp: new Date().toISOString()
    });

    // Reabre o mercado após 6 segundos com odds ajustadas
    setTimeout(() => {
      this.reopenMarketAfterGoal(matchId);
    }, 6000);
  }

  reopenMarketAfterGoal(matchId) {
    const match = matchService.getMatch(matchId);
    if (!match || match.status_partida === MATCH_STATUS.ENCERRADA) return;

    recalculateOddsAfterGoal(match);
    matchService.resumeMatch(matchId);

    console.log(`✅ [EVENTO] Mercado da partida ${matchId} REABERTO.`);

    this.broadcast({
      event: WS_EVENTS.MARKET_RESUMED,
      matchId: match.id_partida,
      status: MATCH_STATUS.AO_VIVO,
      odds: match.odds,
      timestamp: new Date().toISOString()
    });
  }

  triggerCard(matchId) {
    const match = matchService.getMatch(matchId);
    if (!match) return;

    const descricao = `🟨 Falta tática no meio de campo (${match.minuto_jogo}')`;
    match.timeline.unshift({
      minuto: match.minuto_jogo,
      tipo: "CARD_YELLOW",
      texto: descricao
    });

    this.broadcast({
      event: WS_EVENTS.GAME_EVENT,
      type: "CARD_YELLOW",
      matchId: match.id_partida,
      minute: match.minuto_jogo,
      description: descricao,
      score: {
        casa: match.placar_casa,
        fora: match.placar_fora
      },
      status: match.status_partida,
      timestamp: new Date().toISOString()
    });
  }

  finishMatch(match) {
    console.log(`🏁 [FIM DE JOGO] Partida ${match.id_partida} encerrada. Liquidando apostas...`);
    const liquidacoes = settlementService.settleBetsForMatch(match.id_partida);

    this.broadcast({
      event: WS_EVENTS.MATCH_FINISHED,
      matchId: match.id_partida,
      placarFinal: {
        casa: match.placar_casa,
        fora: match.placar_fora
      },
      vencedor: match.placar_casa > match.placar_fora ? "CASA" : match.placar_fora > match.placar_casa ? "FORA" : "EMPATE",
      timestamp: new Date().toISOString()
    });

    for (const liq of liquidacoes) {
      this.notifyUser(liq.userId, {
        event: WS_EVENTS.BET_SETTLED,
        betId: liq.betId,
        status: liq.status,
        retorno: liq.retorno,
        newBalance: liq.newBalance,
        timestamp: new Date().toISOString()
      });
    }

    this.broadcast({
      event: WS_EVENTS.RANKING_UPDATE,
      ranking: userService.getRanking()
    });
  }

  broadcastCashOutUpdates() {
    this.broadcast({
      event: WS_EVENTS.CASHOUT_HEARTBEAT,
      timestamp: new Date().toISOString()
    });
  }

  resetMatch(matchId) {
    const match = matchService.resetMatch(matchId);
    if (!match) return;

    console.log(`🔄 [DEMO] Partida ${matchId} reiniciada com sucesso.`);

    this.broadcast({
      event: WS_EVENTS.MATCH_RESET,
      matchId: match.id_partida,
      match: match,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = MatchEngine;
