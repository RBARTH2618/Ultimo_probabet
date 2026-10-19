/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/net/manipuladorEventos.js - Despachante de Eventos do Servidor
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o roteador de eventos do cliente. Quando o servidor transmite uma mensagem
 * WebSocket (seja broadcast ou unicast), este arquivo interpreta e decide qual
 * tela ou componente visual atualizar.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - [RF-01] HANDSHAKE_SUCCESS: Recebe saldo inicial R$ 100,00, partidas e bilhetes.
 *  - [RF-02] ODDS_UPDATE: Atualiza cotações e setas de subida/queda nas telas.
 *  - [RF-06] GAME_EVENT: Mostra banner de Gol/Cartão e toca apito ou som comemorativo.
 *  - [RF-03] BET_CONFIRMED / REJECTED: Exibe comprovante #Ticket ID ou aviso de erro.
 *  - [RF-05] CASH_OUT_CONFIRMED / REJECTED: Atualiza saldo ou alerta de mercado suspenso [RNF-01].
 *  - [RF-07] BET_SETTLED: Informa se a aposta foi GREEN ou RED aos 90 min e credita ganhos.
 *  - [RF-08] BALANCE_UPDATE & RANKING_UPDATE: Sincroniza saldo e classificação da turma.
 * 
 * 📍 ONDE É USADO?
 * Invocado pelo ouvinte onmessage de clienteWebSocket.js.
 * ==============================================================================
 */

import { EstadoApp } from "../state/estadoAplicacao.js";
import { atualizarInterfaceCabecalho, exibirBannerEventoJogo } from "../ui/interfaceCabecalho.js";
import { tocarEfeitoSonoro } from "../audio/efeitosSonoros.js";
import { renderizarPaginaLobby, aplicarAtualizacaoCotacoesNaInterface, bloquearCotacoesPartida } from "../views/visaoLobby.js";
import { renderizarPaginaCupom, exibirAlteracaoCotacaoNoCupom, exibirModalConfirmacaoAposta } from "../views/visaoCupom.js";
import { renderizarPaginaCarteira, renderizarTabelaRanking } from "../views/visaoCarteira.js";
import { EVENTOS_WS } from "../config/eventos.js";

/**
 * Re-renderiza a tela em que o usuário está atualmente posicionado.
 */
export function renderizarConteudoPaginaAtual() {
  if (document.getElementById("matches-list")) {
    renderizarPaginaLobby();
  } else if (document.getElementById("betslip-container")) {
    renderizarPaginaCupom();
  } else if (document.getElementById("wallet-active-bets")) {
    renderizarPaginaCarteira();
  }
}

/**
 * Interpreta e despacha cada frame JSON recebido do servidor WebSocket.
 */
export function processarEventoServidor(msg) {
  const nomeEvento = msg.event || msg.type;

  switch (nomeEvento) {
    // ==========================================================================
    // [RF-01] HANDSHAKE INICIAL & CARGA DE DADOS
    // ==========================================================================
    case EVENTOS_WS.HANDSHAKE_SUCCESS: {
      EstadoApp.saldo = Number(msg.balance);
      if (msg.userName) {
        EstadoApp.nomeApostador = msg.userName;
      }
      if (Array.isArray(msg.matches)) {
        msg.matches.forEach(p => EstadoApp.partidas.set(p.id_partida, p));
      }
      if (Array.isArray(msg.bets)) {
        EstadoApp.apostasAtivas = msg.bets;
      }
      atualizarInterfaceCabecalho();
      renderizarConteudoPaginaAtual();
      if (msg.ranking) renderizarTabelaRanking(msg.ranking);
      break;
    }

    // ==========================================================================
    // [RF-02] TRANSMISSÃO DINÂMICA DE COTAÇÕES (ODDS)
    // ==========================================================================
    case EVENTOS_WS.ODDS_UPDATE: {
      const partida = EstadoApp.partidas.get(msg.matchId);
      if (partida) {
        partida.odds = msg.odds;
        partida.minuto_jogo = msg.minuto;
        if (msg.placar) {
          partida.placar_casa = msg.placar.casa;
          partida.placar_fora = msg.placar.fora;
        }
      }
      aplicarAtualizacaoCotacoesNaInterface(msg.matchId, msg.odds, msg.directions, msg.minuto, msg.placar);

      // Alerta caso a cotação selecionada no Bet Slip tenha oscilado
      if (EstadoApp.cupomSelecionado && EstadoApp.cupomSelecionado.matchId === msg.matchId) {
        const odds1x2 = msg.odds["VENCEDOR_1X2"];
        const cotacaoMomento = odds1x2 ? odds1x2[EstadoApp.cupomSelecionado.selecao] : null;
        if (cotacaoMomento && cotacaoMomento !== EstadoApp.cupomSelecionado.odd) {
          exibirAlteracaoCotacaoNoCupom(cotacaoMomento);
        }
      }
      break;
    }

    // ==========================================================================
    // [RF-06] NOTIFICAÇÃO DE GOL OU CARTÃO (SUSPENSÃO DE MERCADO)
    // ==========================================================================
    case EVENTOS_WS.GAME_EVENT: {
      exibirBannerEventoJogo(msg);
      tocarEfeitoSonoro(msg.type === "GOAL" ? "goal" : "whistle");

      const partida = EstadoApp.partidas.get(msg.matchId);
      if (partida) {
        if (msg.score) {
          partida.placar_casa = msg.score.casa;
          partida.placar_fora = msg.score.fora;
        }
        if (msg.status) {
          partida.status_partida = msg.status;
        }
      }
      if (msg.type === "GOAL") {
        bloquearCotacoesPartida(msg.matchId, true);
      }
      renderizarConteudoPaginaAtual();
      break;
    }

    // ==========================================================================
    // REABERTURA DO MERCADO APÓS GOL
    // ==========================================================================
    case EVENTOS_WS.MARKET_RESUMED: {
      bloquearCotacoesPartida(msg.matchId, false);
      const partida = EstadoApp.partidas.get(msg.matchId);
      if (partida) {
        partida.status_partida = "AO_VIVO";
        if (msg.odds) partida.odds = msg.odds;
      }
      renderizarConteudoPaginaAtual();
      break;
    }

    // ==========================================================================
    // [RF-03] CONFIRMAÇÃO DE APOSTA EFETUADA
    // ==========================================================================
    case EVENTOS_WS.BET_CONFIRMED: {
      EstadoApp.saldo = Number(msg.newBalance);
      EstadoApp.apostasAtivas.unshift(msg.bet);
      atualizarInterfaceCabecalho();
      exibirModalConfirmacaoAposta(msg.ticketId, msg.bet);
      break;
    }

    case EVENTOS_WS.BET_REJECTED: {
      alert(`⚠️ Aposta Não Aceita: ${msg.message}`);
      break;
    }

    // ==========================================================================
    // [RF-05] CONFIRMAÇÃO DE CASH OUT (RESGATE ANTECIPADO)
    // ==========================================================================
    case EVENTOS_WS.CASH_OUT_CONFIRMED: {
      EstadoApp.saldo = Number(msg.newBalance);
      const bilhete = EstadoApp.apostasAtivas.find(b => b.id_aposta === msg.betId);
      if (bilhete) {
        bilhete.status_aposta = "CASH_OUT";
        bilhete.valor_resgatado = msg.amount;
      }
      atualizarInterfaceCabecalho();
      tocarEfeitoSonoro("cashout");
      alert(`🎉 Cash Out de R$ ${msg.amount.toFixed(2)} realizado com sucesso! Novo saldo: R$ ${msg.newBalance.toFixed(2)}`);
      renderizarPaginaCarteira();
      break;
    }

    // ==========================================================================
    // [RNF-01] REJEIÇÃO DE CASH OUT POR TRAVA ATÔMICA (RACE CONDITION)
    // ==========================================================================
    case EVENTOS_WS.CASH_OUT_REJECTED: {
      tocarEfeitoSonoro("error");
      alert(`⛔ Cash Out Rejeitado: [${msg.reason}]`);
      if (msg.newOfferedValue) {
        renderizarPaginaCarteira();
      }
      break;
    }

    // ==========================================================================
    // [RF-07] LIQUIDAÇÃO AUTOMÁTICA AOS 90 MINUTOS (GREEN / RED)
    // ==========================================================================
    case EVENTOS_WS.BET_SETTLED: {
      EstadoApp.saldo = Number(msg.newBalance);
      const bilhete = EstadoApp.apostasAtivas.find(b => b.id_aposta === msg.betId);
      if (bilhete) {
        bilhete.status_aposta = msg.status;
      }
      atualizarInterfaceCabecalho();
      if (msg.status === "GREEN") {
        tocarEfeitoSonoro("win");
        alert(`🏆 GREEN! Sua aposta #${msg.betId} venceu! Prêmio de R$ ${msg.retorno.toFixed(2)} creditado na carteira.`);
      } else {
        alert(`❌ Sua aposta #${msg.betId} foi liquidada como RED.`);
      }
      renderizarPaginaCarteira();
      break;
    }

    case EVENTOS_WS.MATCH_FINISHED: {
      const partida = EstadoApp.partidas.get(msg.matchId);
      if (partida) partida.status_partida = "ENCERRADA";
      renderizarConteudoPaginaAtual();
      break;
    }

    // ==========================================================================
    // [RF-04] PULSO DE ATUALIZAÇÃO DO VALOR DE CASH OUT
    // ==========================================================================
    case EVENTOS_WS.CASHOUT_HEARTBEAT: {
      if (window.location.pathname.includes("wallet") || document.getElementById("wallet-active-bets")) {
        renderizarPaginaCarteira();
      }
      break;
    }

    // ==========================================================================
    // [RF-08] ATUALIZAÇÃO DE SALDO E RANKING
    // ==========================================================================
    case EVENTOS_WS.BALANCE_UPDATE: {
      EstadoApp.saldo = Number(msg.balance);
      atualizarInterfaceCabecalho();
      if (msg.message) alert(msg.message);
      break;
    }

    case EVENTOS_WS.RANKING_UPDATE: {
      if (msg.ranking) renderizarTabelaRanking(msg.ranking);
      break;
    }

    case EVENTOS_WS.MATCH_RESET: {
      if (Array.isArray(msg.matches)) {
        msg.matches.forEach(m => EstadoApp.partidas.set(m.id_partida, m));
      } else if (msg.match) {
        EstadoApp.partidas.set(msg.match.id_partida, msg.match);
      }
      renderizarConteudoPaginaAtual();
      break;
    }

    case "USER_NAME_UPDATED": {
      if (msg.userName) {
        EstadoApp.nomeApostador = msg.userName;
        atualizarInterfaceCabecalho();
      }
      break;
    }

    default:
      console.log("ℹ️ Evento recebido sem tratador específico:", msg);
  }
}

// Aliases para compatibilidade retroativa
export const renderCurrentPageContent = renderizarConteudoPaginaAtual;
export const handleServerEvent = processarEventoServidor;
