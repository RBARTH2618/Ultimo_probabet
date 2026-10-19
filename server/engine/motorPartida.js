/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: engine/motorPartida.js - Motor da Partida e Loop de Simulação Temporal
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o coração ("engine") da aplicação. O orquestrador temporal de eventos ao vivo.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Mantém o loop temporal contínuo a cada ~2.5 segundos (via setInterval) [RF-02].
 *  - Avança o cronômetro do jogo (1 minuto a cada 10 segundos reais).
 *  - Executa a flutuação das cotações e envia o broadcast ODDS_UPDATE [RF-02].
 *  - Emite o pulso periódico de recálculo de Cash Out (CASHOUT_HEARTBEAT) [RF-04].
 *  - Dispara eventos aleatórios de gols ou cartões com suspensão temporária do mercado [RF-06, RNF-01].
 *  - Finaliza o jogo aos 90 minutos, liquidando bilhetes em GREEN/RED e atualizando o ranking [RF-07, RF-08].
 *  - Oferece comandos manuais de demonstração para a apresentação acadêmica.
 * 
 * 📍 ONDE É USADO?
 * Instanciado no servidor principal (servidor.js / server.js) com callbacks de broadcast e unicast.
 * ==============================================================================
 */

const servicoPartida = require("../services/servicoPartida");
const servicoLiquidacao = require("../services/servicoLiquidacao");
const servicoUsuario = require("../services/servicoUsuario");
const { flutuarCotacoesDaPartida, recalcularCotacoesAposGol } = require("./calculadoraCotacoes");
const { EVENTOS_WS, STATUS_PARTIDA, CONFIGURACOES } = require("../config/constantes");

class MotorPartida {
  /**
   * @param {Function} callbackBroadcast - Função para enviar mensagem a TODOS os clientes conectados
   * @param {Function} callbackNotificarUsuario - Função para enviar mensagem a UM apostador específico
   */
  constructor(callbackBroadcast, callbackNotificarUsuario) {
    this.broadcast = callbackBroadcast;
    this.notificarUsuario = callbackNotificarUsuario;
    this.idIntervalo = null;
    this.contadorCiclos = 0;
  }

  /**
   * Inicia o loop contínuo do motor
   */
  iniciarLoop() {
    if (this.idIntervalo) return;

    console.log("⚽ [MOTOR] Motor de Partidas iniciado com sucesso. Frequência de cotações: ~2.5 segundos.");

    this.idIntervalo = setInterval(() => {
      this.cicloTemporal();
    }, CONFIGURACOES.INTERVALO_ENGINE_MS);
  }

  /**
   * Pausa o loop temporal
   */
  pararLoop() {
    if (this.idIntervalo) {
      clearInterval(this.idIntervalo);
      this.idIntervalo = null;
      console.log("⏹️ [MOTOR] Motor de partidas pausado.");
    }
  }

  /**
   * Ciclo executado a cada tick (2.5 segundos)
   */
  cicloTemporal() {
    this.contadorCiclos++;
    const partidas = servicoPartida.obterTodasPartidas();

    for (const partida of partidas) {
      if (partida.status_partida === STATUS_PARTIDA.ENCERRADA) continue;
      if (partida.status_partida === STATUS_PARTIDA.SUSPENSA) continue;

      // Avança 1 minuto a cada 4 ciclos (~10 segundos no relógio real)
      if (this.contadorCiclos % 4 === 0 && partida.minuto_jogo < 90) {
        partida.minuto_jogo += 1;
      }

      // [RF-02] Flutuação Estocástica de Cotações
      this.processarFlutuacaoCotacoes(partida);

      // [RF-06] Simulação de Lances Ocasionais (Gol / Falta)
      if (this.contadorCiclos % 16 === 0) {
        const sorteio = Math.random();
        if (sorteio < 0.35) {
          this.dispararEventoAleatorio(partida);
        }
      }

      // [RF-07] Encerramento aos 90 minutos de jogo
      if (partida.minuto_jogo >= 90 && partida.status_partida !== STATUS_PARTIDA.ENCERRADA) {
        this.finalizarPartida(partida);
      }
    }

    // [RF-04] Pulso para clientes reavaliarem propostas de Cash Out ativas
    this.transmitirAtualizacoesCashOut();
  }

  /**
   * [RF-02] Calcula nova oscilação de cotações e envia broadcast para todos os navegadores.
   */
  processarFlutuacaoCotacoes(partida) {
    const resultadoCalculo = flutuarCotacoesDaPartida(partida);
    if (!resultadoCalculo) return;

    this.broadcast({
      event: EVENTOS_WS.ODDS_UPDATE,
      matchId: partida.id_partida,
      minuto: partida.minuto_jogo,
      placar: {
        casa: partida.placar_casa,
        fora: partida.placar_fora
      },
      odds: {
        "VENCEDOR_1X2": { ...partida.odds["VENCEDOR_1X2"] },
        "PROXIMO_GOL": partida.odds["PROXIMO_GOL"],
        "TOTAL_GOLS": partida.odds["TOTAL_GOLS"]
      },
      directions: resultadoCalculo.direcoes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Sorteia aleatoriamente um cartão ou gol durante o andamento da partida.
   */
  dispararEventoAleatorio(partida) {
    const tipos = ["CARD_YELLOW", "GOAL", "CARD_YELLOW"];
    const sorteado = tipos[Math.floor(Math.random() * tipos.length)];

    if (sorteado === "GOAL") {
      const time = Math.random() > 0.4 ? "CASA" : "FORA";
      this.dispararGol(partida.id_partida, time, "Lance ao vivo na área!");
    } else {
      this.dispararCartao(partida.id_partida);
    }
  }

  /**
   * [RF-06 e RNF-01] Registra um gol, suspende o mercado imediatamente e agenda a reabertura.
   */
  dispararGol(idPartida, time = "CASA", autor = "Chute colocado!") {
    const partida = servicoPartida.obterPartidaPorId(idPartida);
    if (!partida) return;

    if (time === "CASA") {
      partida.placar_casa += 1;
    } else {
      partida.placar_fora += 1;
    }

    const nomeTime = (time === "CASA") ? partida.time_casa : partida.time_fora;
    const descricao = `⚽ GOL do ${nomeTime}! (${partida.minuto_jogo}') - ${autor}`;

    partida.timeline.unshift({
      minuto: partida.minuto_jogo,
      tipo: "GOAL",
      texto: descricao
    });

    // [RNF-01] ATIVA A TRAVA ATÔMICA DE SUSPENSÃO DE MERCADO
    servicoPartida.suspenderMercadoPartida(idPartida, "GOL_CONFIRMADO");

    console.log(`🚨 [EVENTO] ${descricao} -> Mercado da partida #${idPartida} SUSPENSO!`);

    // Transmite aviso prioritário de gol com status de mercado suspenso
    this.broadcast({
      event: EVENTOS_WS.GAME_EVENT,
      type: "GOAL",
      matchId: partida.id_partida,
      time: nomeTime,
      minute: partida.minuto_jogo,
      description: descricao,
      score: {
        casa: partida.placar_casa,
        fora: partida.placar_fora
      },
      status: STATUS_PARTIDA.SUSPENSA,
      timestamp: new Date().toISOString()
    });

    // Reabre o mercado após 6 segundos com as novas cotações ajustadas ao novo placar
    setTimeout(() => {
      this.reabrirMercadoAposGol(idPartida);
    }, 6000);
  }

  /**
   * Reabre o mercado após a verificação do gol e ajusta as probabilidades.
   */
  reabrirMercadoAposGol(idPartida) {
    const partida = servicoPartida.obterPartidaPorId(idPartida);
    if (!partida || partida.status_partida === STATUS_PARTIDA.ENCERRADA) return;

    recalcularCotacoesAposGol(partida);
    servicoPartida.retomarMercadoPartida(idPartida);

    console.log(`✅ [EVENTO] Mercado da partida #${idPartida} REABERTO para negociação.`);

    this.broadcast({
      event: EVENTOS_WS.MARKET_RESUMED,
      matchId: partida.id_partida,
      status: STATUS_PARTIDA.AO_VIVO,
      odds: partida.odds,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Dispara um cartão amarelo simulado na timeline da partida.
   */
  dispararCartao(idPartida) {
    const partida = servicoPartida.obterPartidaPorId(idPartida);
    if (!partida) return;

    const descricao = `🟨 Falta tática e cartão amarelo (${partida.minuto_jogo}')`;
    partida.timeline.unshift({
      minuto: partida.minuto_jogo,
      tipo: "CARD_YELLOW",
      texto: descricao
    });

    this.broadcast({
      event: EVENTOS_WS.GAME_EVENT,
      type: "CARD_YELLOW",
      matchId: partida.id_partida,
      minute: partida.minuto_jogo,
      description: descricao,
      score: {
        casa: partida.placar_casa,
        fora: partida.placar_fora
      },
      status: partida.status_partida,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * [RF-07] Finaliza a partida aos 90 minutos e liquida os bilhetes em aberto.
   */
  finalizarPartida(partida) {
    console.log(`🏁 [FIM DE JOGO] Partida #${partida.id_partida} encerrada aos 90 min. Liquidando apostas...`);
    const liquidacoes = servicoLiquidacao.liquidarApostasDaPartida(partida.id_partida);

    // Broadcast para todos: fim de jogo
    this.broadcast({
      event: EVENTOS_WS.MATCH_FINISHED,
      matchId: partida.id_partida,
      placarFinal: {
        casa: partida.placar_casa,
        fora: partida.placar_fora
      },
      vencedor: partida.placar_casa > partida.placar_fora ? "CASA" : partida.placar_fora > partida.placar_casa ? "FORA" : "EMPATE",
      timestamp: new Date().toISOString()
    });

    // Unicast: notifica individualmente cada apostador premiado ou liquidado
    for (const liq of liquidacoes) {
      this.notificarUsuario(liq.idApostador, {
        event: EVENTOS_WS.BET_SETTLED,
        betId: liq.idBilhete,
        status: liq.status,
        retorno: liq.retorno,
        newBalance: liq.novoSaldo,
        timestamp: new Date().toISOString()
      });
    }

    // Broadcast: ranking atualizado com os novos saldos
    this.broadcast({
      event: EVENTOS_WS.RANKING_UPDATE,
      ranking: servicoUsuario.obterClassificacaoRanking()
    });
  }

  /**
   * [RF-04] Emite pulso contínuo para os navegadores recalcularem as propostas de Cash Out.
   */
  transmitirAtualizacoesCashOut() {
    this.broadcast({
      event: EVENTOS_WS.CASHOUT_HEARTBEAT,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Comando de demonstração didática para reiniciar o jogo 15.
   */
  reiniciarPartida(idPartida) {
    const partida = servicoPartida.reiniciarPartida(idPartida);
    if (!partida) return;

    console.log(`🔄 [DEMO] Partida #${idPartida} reiniciada com sucesso para apresentação.`);

    this.broadcast({
      event: EVENTOS_WS.MATCH_RESET,
      matchId: partida.id_partida,
      match: partida,
      timestamp: new Date().toISOString()
    });
  }

  // ============================================================================
  // ALIASES DE COMPATIBILIDADE COM NOMES EM INGLÊS
  // ============================================================================
  start() { this.iniciarLoop(); }
  stop() { this.pararLoop(); }
  tick() { this.cicloTemporal(); }
  processOddsFluctuation(m) { this.processarFlutuacaoCotacoes(m); }
  triggerRandomEvent(m) { this.dispararEventoAleatorio(m); }
  triggerGoal(id, time, autor) { this.dispararGol(id, time, autor); }
  reopenMarketAfterGoal(id) { this.reabrirMercadoAposGol(id); }
  triggerCard(id) { this.dispararCartao(id); }
  finishMatch(m) { this.finalizarPartida(m); }
  broadcastCashOutUpdates() { this.transmitirAtualizacoesCashOut(); }
  resetMatch(id) { this.reiniciarPartida(id); }
  notifyUser(userId, payload) { this.notificarUsuario(userId, payload); }
}

module.exports = MotorPartida;
