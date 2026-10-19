/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/net/eventHandler.js - Despachante de Eventos do Servidor
 * Responsabilidade Única: Interpretar mensagens do WebSocket e atualizar views.
 * ==============================================================================
 */

import { AppState } from "../state/appState.js";
import { updateHeaderUI, showGameEventBanner } from "../ui/headerUi.js";
import { playNotificationSound } from "../audio/soundEffects.js";
import { renderLobbyPage, applyOddsUpdateUI, lockMatchOdds } from "../views/lobbyView.js";
import { renderBetSlipPage, showOddChangeInSlip, showBetConfirmationModal } from "../views/betslipView.js";
import { renderWalletPage, renderRankingTable } from "../views/walletView.js";
import { WS_EVENTS } from "../config/events.js";

export function renderCurrentPageContent() {
  if (document.getElementById("matches-list")) {
    renderLobbyPage();
  } else if (document.getElementById("betslip-container")) {
    renderBetSlipPage();
  } else if (document.getElementById("wallet-active-bets")) {
    renderWalletPage();
  }
}

export function handleServerEvent(msg) {
  const eventName = msg.event || msg.type;

  switch (eventName) {
    // [RF-01] Handshake e Carga Inicial
    case WS_EVENTS.HANDSHAKE_SUCCESS: {
      AppState.balance = Number(msg.balance);
      if (Array.isArray(msg.matches)) {
        msg.matches.forEach(m => AppState.matches.set(m.id_partida, m));
      }
      if (Array.isArray(msg.bets)) {
        AppState.activeBets = msg.bets;
      }
      updateHeaderUI();
      renderCurrentPageContent();
      if (msg.ranking) renderRankingTable(msg.ranking);
      break;
    }

    // [RF-02] Transmissão Dinâmica de Odds
    case WS_EVENTS.ODDS_UPDATE: {
      const match = AppState.matches.get(msg.matchId);
      if (match) {
        match.odds = msg.odds;
        match.minuto_jogo = msg.minuto;
        if (msg.placar) {
          match.placar_casa = msg.placar.casa;
          match.placar_fora = msg.placar.fora;
        }
      }
      applyOddsUpdateUI(msg.matchId, msg.odds, msg.directions, msg.minuto, msg.placar);

      // Avisa caso a odd selecionada no Bet Slip tenha mudado
      if (AppState.selectedSlip && AppState.selectedSlip.matchId === msg.matchId) {
        const odds1x2 = msg.odds["VENCEDOR_1X2"];
        const currentOdd = odds1x2 ? odds1x2[AppState.selectedSlip.selecao] : null;
        if (currentOdd && currentOdd !== AppState.selectedSlip.odd) {
          showOddChangeInSlip(currentOdd);
        }
      }
      break;
    }

    // [RF-06] Notificação de Gol / Cartão
    case WS_EVENTS.GAME_EVENT: {
      showGameEventBanner(msg);
      playNotificationSound(msg.type === "GOAL" ? "goal" : "whistle");

      const match = AppState.matches.get(msg.matchId);
      if (match) {
        if (msg.score) {
          match.placar_casa = msg.score.casa;
          match.placar_fora = msg.score.fora;
        }
        if (msg.status) {
          match.status_partida = msg.status;
        }
      }
      if (msg.type === "GOAL") {
        lockMatchOdds(msg.matchId, true);
      }
      renderCurrentPageContent();
      break;
    }

    // Reabertura do Mercado
    case WS_EVENTS.MARKET_RESUMED: {
      lockMatchOdds(msg.matchId, false);
      const match = AppState.matches.get(msg.matchId);
      if (match) {
        match.status_partida = "AO_VIVO";
        if (msg.odds) match.odds = msg.odds;
      }
      renderCurrentPageContent();
      break;
    }

    // [RF-03] Confirmação de Aposta
    case WS_EVENTS.BET_CONFIRMED: {
      AppState.balance = Number(msg.newBalance);
      AppState.activeBets.unshift(msg.bet);
      updateHeaderUI();
      showBetConfirmationModal(msg.ticketId, msg.bet);
      break;
    }

    case WS_EVENTS.BET_REJECTED: {
      alert(`⚠️ Aposta Não Aceita: ${msg.message}`);
      break;
    }

    // [RF-05] Confirmação de Cash Out
    case WS_EVENTS.CASH_OUT_CONFIRMED: {
      AppState.balance = Number(msg.newBalance);
      const bet = AppState.activeBets.find(b => b.id_aposta === msg.betId);
      if (bet) {
        bet.status_aposta = "CASH_OUT";
        bet.valor_resgatado = msg.amount;
      }
      updateHeaderUI();
      playNotificationSound("cashout");
      alert(`🎉 Cash Out de R$ ${msg.amount.toFixed(2)} realizado com sucesso! Novo saldo: R$ ${msg.newBalance.toFixed(2)}`);
      renderWalletPage();
      break;
    }

    // [RNF-01] Rejeição de Cash Out por Race Condition
    case WS_EVENTS.CASH_OUT_REJECTED: {
      playNotificationSound("error");
      alert(`⛔ Cash Out Rejeitado: [${msg.reason}]`);
      if (msg.newOfferedValue) {
        renderWalletPage();
      }
      break;
    }

    // [RF-07] Liquidação Automática
    case WS_EVENTS.BET_SETTLED: {
      AppState.balance = Number(msg.newBalance);
      const bet = AppState.activeBets.find(b => b.id_aposta === msg.betId);
      if (bet) {
        bet.status_aposta = msg.status;
      }
      updateHeaderUI();
      if (msg.status === "GREEN") {
        playNotificationSound("win");
        alert(`🏆 GREEN! Sua aposta #${msg.betId} venceu! Prêmio de R$ ${msg.retorno.toFixed(2)} creditado na carteira.`);
      } else {
        alert(`❌ Sua aposta #${msg.betId} foi liquidada como RED.`);
      }
      renderWalletPage();
      break;
    }

    case WS_EVENTS.MATCH_FINISHED: {
      const match = AppState.matches.get(msg.matchId);
      if (match) match.status_partida = "ENCERRADA";
      renderCurrentPageContent();
      break;
    }

    // [RF-04] Recálculo contínuo de Cash Out
    case WS_EVENTS.CASHOUT_HEARTBEAT: {
      if (window.location.pathname.includes("wallet") || document.getElementById("wallet-active-bets")) {
        renderWalletPage();
      }
      break;
    }

    // [RF-08] Atualização de Saldo e Ranking
    case WS_EVENTS.BALANCE_UPDATE: {
      AppState.balance = Number(msg.balance);
      updateHeaderUI();
      if (msg.message) alert(msg.message);
      break;
    }

    case WS_EVENTS.RANKING_UPDATE: {
      if (msg.ranking) renderRankingTable(msg.ranking);
      break;
    }

    case WS_EVENTS.MATCH_RESET: {
      if (msg.match) {
        AppState.matches.set(msg.match.id_partida, msg.match);
      }
      renderCurrentPageContent();
      break;
    }

    default:
      console.log("ℹ️ Evento recebido sem tratador específico:", msg);
  }
}
