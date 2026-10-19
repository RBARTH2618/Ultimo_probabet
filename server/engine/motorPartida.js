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

      const ehBasquete = (partida.modalidade_esportiva === "BASQUETE");
      const minutoMaximo = ehBasquete ? 48 : 90;

      // Avança 1 minuto a cada 4 ciclos (~10 segundos no relógio real)
      if (this.contadorCiclos % 4 === 0 && partida.minuto_jogo < minutoMaximo) {
        partida.minuto_jogo += 1;
      }

      // [RF-02] Flutuação Estocástica de Cotações
      this.processarFlutuacaoCotacoes(partida);

      // Simulação de Eventos / Pontuações conforme a modalidade esportiva:
      if (ehBasquete) {
        // [BASQUETE] Alta frequência de pontuação (NBA):
        // A cada ciclo (2.5s reais), ocorre uma posse de bola com ~55% de chance de cesta (+2, +3 ou +1 pt).
        // Isso faz com que os times alcancem realisticamente ~100 pontos ao final dos 48 minutos!
        if (Math.random() < 0.55) {
          this.dispararCestaBasquete(partida);
        }
      } else {
        // [FUTEBOL] Baixa frequência de pontuação:
        // A cada 16 ciclos (~40 segundos), 35% de chance de gol ou falta
        if (this.contadorCiclos % 16 === 0) {
          const sorteio = Math.random();
          if (sorteio < 0.35) {
            this.dispararEventoAleatorioFutebol(partida);
          }
        }
      }

      // [RF-07] Encerramento da partida (48 min para Basquete NBA e 90 min para Futebol)
      if (partida.minuto_jogo >= minutoMaximo && partida.status_partida !== STATUS_PARTIDA.ENCERRADA) {
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
   * [BASQUETE] Simula a pontuação dinâmica e contínua do basquete (2 pontos, 3 pontos ou lance livre).
   */
  dispararCestaBasquete(partida) {
    if (partida.status_partida === STATUS_PARTIDA.ENCERRADA) return;

    // Sorteia time que converteu a posse (50% de chance para cada time)
    const time = Math.random() > 0.48 ? "CASA" : "FORA";
    const nomeTime = (time === "CASA") ? partida.time_casa : partida.time_fora;

    // Sorteio de pontuação: 2 pontos (~70%), 3 pontos (~25%) ou Lance Livre 1 ponto (~5%)
    const rand = Math.random();
    let pontos = 2;
    let tipoTexto = "Cesta de 2 pts";

    if (rand < 0.26) {
      pontos = 3;
      tipoTexto = "Cesta de 3 pts do perímetro";
    } else if (rand > 0.94) {
      pontos = 1;
      tipoTexto = "Lance livre convertido";
    }

    if (time === "CASA") {
      partida.placar_casa += pontos;
      if (partida.estatisticas) {
        partida.estatisticas.chutesCasa = (partida.estatisticas.chutesCasa || 0) + 1;
        if (pontos === 3) partida.estatisticas.cestas3Casa = (partida.estatisticas.cestas3Casa || 0) + 1;
      }
    } else {
      partida.placar_fora += pontos;
      if (partida.estatisticas) {
        partida.estatisticas.chutesFora = (partida.estatisticas.chutesFora || 0) + 1;
        if (pontos === 3) partida.estatisticas.cestas3Fora = (partida.estatisticas.cestas3Fora || 0) + 1;
      }
    }

    const autoresCasa = [
      "LeBron James em infiltração com enterrada fulminante!",
      "Anthony Davis com gancho clássico no garrafão!",
      "Austin Reaves em arremesso rápido da linha dos 3!",
      "D'Angelo Russell com arremesso perfeito de meia distância!",
      "LeBron James com drible cruzado e bandeja!"
    ];
    const autoresFora = [
      "Stephen Curry com arremesso espetacular do meio da rua!",
      "Klay Thompson em tiro clássico de média distância!",
      "Jonathan Kuminga com enterrada agressiva no contra-ataque!",
      "Draymond Green com infiltração potente na bandeja!",
      "Stephen Curry com finta e tiro de longa distância!"
    ];

    const lista = (time === "CASA") ? autoresCasa : autoresFora;
    const autorEscolhido = lista[Math.floor(Math.random() * lista.length)];
    const descricao = `🏀 ${tipoTexto} do ${nomeTime}! (${partida.minuto_jogo}') - ${autorEscolhido}`;

    partida.timeline.unshift({
      minuto: partida.minuto_jogo,
      tipo: "BASKET",
      texto: descricao
    });

    if (partida.timeline.length > 25) {
      partida.timeline.pop();
    }

    // Broadcast da pontuação de basquete
    this.broadcast({
      event: EVENTOS_WS.GAME_EVENT,
      type: "BASKET",
      matchId: partida.id_partida,
      time: nomeTime,
      points: pontos,
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
   * Sorteia aleatoriamente um cartão ou gol para partidas de futebol.
   */
  dispararEventoAleatorioFutebol(partida) {
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
   * Alias retroativo para dispararEventoAleatorioFutebol
   */
  dispararEventoAleatorio(partida) {
    if (partida.modalidade_esportiva === "BASQUETE") {
      this.dispararCestaBasquete(partida);
    } else {
      this.dispararEventoAleatorioFutebol(partida);
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
   * [RF-07] Finaliza a partida no tempo regulamentar (48 min para Basquete, 90 min para Futebol) e liquida os bilhetes.
   */
  finalizarPartida(partida) {
    const ehBasquete = (partida.modalidade_esportiva === "BASQUETE");
    const minutoFinal = ehBasquete ? 48 : 90;
    partida.minuto_jogo = minutoFinal;
    partida.lock_motivo = null;
    partida.lock_timestamp = 0;

    console.log(`🏁 [FIM DE JOGO] Partida #${partida.id_partida} (${partida.modalidade_esportiva}) encerrada aos ${minutoFinal} min. Placar: ${partida.placar_casa} x ${partida.placar_fora}. Liquidando apostas...`);
    const liquidacoes = servicoLiquidacao.liquidarApostasDaPartida(partida.id_partida);

    // Broadcast para todos: fim de jogo
    this.broadcast({
      event: EVENTOS_WS.MATCH_FINISHED,
      matchId: partida.id_partida,
      minutoFinal: minutoFinal,
      placarFinal: {
        casa: partida.placar_casa,
        fora: partida.placar_fora
      },
      vencedor: partida.placar_casa > partida.placar_fora ? "CASA" : partida.placar_fora > partida.placar_casa ? "FORA" : "EMPATE",
      matches: servicoPartida.obterTodasPartidas(),
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
   * [RF-07] Finaliza todas as partidas em andamento aos 48 min (basquete) ou 90 min (futebol).
   * Liquida os bilhetes em aberto (GREEN / RED) e atualiza os saldos e o ranking da turma.
   */
  finalizarTodasPartidas() {
    const partidas = servicoPartida.obterTodasPartidas();
    let contadorFinalizadas = 0;

    for (const partida of partidas) {
      if (partida.status_partida !== STATUS_PARTIDA.ENCERRADA) {
        partida.minuto_jogo = (partida.modalidade_esportiva === "BASQUETE") ? 48 : 90;
        this.finalizarPartida(partida);
        contadorFinalizadas++;
      }
    }

    console.log(`🏁 [DEMO ACADÊMICA] ${contadorFinalizadas} partida(s) em andamento foram finalizadas com sucesso.`);
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
   * Comando de demonstração didática para reiniciar as partidas.
   * Reinicia todas as partidas (União FC, Flamengo e Lakers) para status AO_VIVO no minuto 10.
   */
  reiniciarPartida(idPartida = "TODAS") {
    const partidas = servicoPartida.reiniciarTodasPartidas();
    console.log(`🔄 [DEMO] Todas as partidas foram reiniciadas com sucesso.`);

    this.broadcast({
      event: EVENTOS_WS.MATCH_RESET,
      matchId: "TODAS",
      matches: partidas,
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
  finishAllMatches() { this.finalizarTodasPartidas(); }
  broadcastCashOutUpdates() { this.transmitirAtualizacoesCashOut(); }
  resetMatch(id) { this.reiniciarPartida(id); }
  notifyUser(userId, payload) { this.notificarUsuario(userId, payload); }
}

module.exports = MotorPartida;
