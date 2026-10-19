/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/views/betslipView.js - Renderização do Bet Slip e Detalhes (Tela 2)
 * Responsabilidade Única: Gerenciar visualização da partida e caderneta de aposta.
 * Implementa: [RF-03] Submissão de Aposta e [RNF-02] Saldo Não Negativo.
 * ==============================================================================
 */

import { AppState } from "../state/appState.js";
import { saveSelectedSlip } from "../state/session.js";
import { WS_EVENTS } from "../config/events.js";

export function renderBetSlipPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = Number(urlParams.get("matchId")) || (AppState.selectedSlip ? AppState.selectedSlip.matchId : 15);
  const match = AppState.matches.get(matchId) || AppState.matches.get(15);

  if (match) {
    const titleEl = document.getElementById("detail-match-title");
    if (titleEl) titleEl.innerText = `${match.time_casa} ${match.placar_casa} x ${match.placar_fora} ${match.time_fora} (${match.minuto_jogo} min)`;

    const stats = match.estatisticas || { posseCasa: 58, posseFora: 42, chutesCasa: 8, chutesFora: 2, escanteiosCasa: 5, escanteiosFora: 1 };
    
    const posseTxt = document.getElementById("stat-posse-txt");
    if (posseTxt) posseTxt.innerText = `${match.time_casa} ${stats.posseCasa}% vs ${stats.posseFora}% ${match.time_fora}`;
    const posseBar = document.getElementById("stat-posse-bar");
    if (posseBar) posseBar.style.width = `${stats.posseCasa}%`;

    const chutesTxt = document.getElementById("stat-chutes-txt");
    if (chutesTxt) chutesTxt.innerText = `${stats.chutesCasa} vs ${stats.chutesFora}`;
    const chutesBar = document.getElementById("stat-chutes-bar");
    if (chutesBar) chutesBar.style.width = `${(stats.chutesCasa / (stats.chutesCasa + stats.chutesFora || 1)) * 100}%`;

    const escTxt = document.getElementById("stat-esc-txt");
    if (escTxt) escTxt.innerText = `${stats.escanteiosCasa} vs ${stats.escanteiosFora}`;
    const escBar = document.getElementById("stat-esc-bar");
    if (escBar) escBar.style.width = `${(stats.escanteiosCasa / (stats.escanteiosCasa + stats.escanteiosFora || 1)) * 100}%`;

    const tickerList = document.getElementById("ticker-feed-list");
    if (tickerList && match.timeline) {
      tickerList.innerHTML = match.timeline.map(item => `
        <li class="ticker-item ${item.tipo === 'GOAL' ? 'goal' : item.tipo.includes('CARD') ? 'card' : ''}">
          <span>${item.minuto}'</span>
          <span>${item.texto}</span>
        </li>
      `).join("");
    }
  }

  renderBetSlipSidebar();
}

export function renderBetSlipSidebar() {
  const container = document.getElementById("slip-content-wrapper");
  if (!container) return;

  const slip = AppState.selectedSlip;
  if (!slip) {
    container.innerHTML = `
      <div class="slip-empty-state">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>Nenhuma seleção no momento.</p>
        <a href="index.html" class="btn-header" style="margin-top: 12px; display: inline-flex;">Escolher Odd no Lobby</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="slip-selection-card">
      <div class="slip-sel-header">
        <span class="slip-match-name">${slip.matchTitle}</span>
        <button class="btn-remove-selection" onclick="window.removeSlipSelection()" title="Remover Palpite">🗑️</button>
      </div>
      <div class="slip-market-info">
        <span class="slip-market-pick">${slip.pickName} (Vencedor)</span>
        <span class="slip-odd-highlight" id="slip-display-odd">${slip.odd.toFixed(2)}</span>
      </div>
      <div id="slip-odd-alert" class="odd-changed-alert">
        Odd alterada para <strong id="new-odd-val"></strong>. Aceitar nova cotação?
      </div>
    </div>

    <div class="stake-input-group">
      <label>Valor da Aposta (R$)</label>
      <div class="input-money-wrapper">
        <span class="input-currency-prefix">R$</span>
        <input type="number" id="stake-input" class="input-money" value="20.00" step="5" min="1" max="${AppState.balance}" oninput="window.calculatePayout()">
      </div>
      <div class="quick-stakes-row">
        <button class="btn-quick-stake" onclick="window.setQuickStake(10)">+10</button>
        <button class="btn-quick-stake" onclick="window.setQuickStake(20)">+20</button>
        <button class="btn-quick-stake" onclick="window.setQuickStake(50)">+50</button>
        <button class="btn-quick-stake" onclick="window.setQuickStake(${AppState.balance})">MAX</button>
      </div>
    </div>

    <div class="potential-payout-box">
      <span class="payout-label">Retorno Potencial:</span>
      <span class="payout-value" id="potential-payout-display">R$ 0,00</span>
    </div>

    <div id="insufficient-funds-alert" class="insufficient-funds-msg">
      Saldo insuficiente — Faça um depósito fictício.
    </div>

    <button id="btn-submit-bet" class="btn-confirm-bet" onclick="window.submitBet()">
      <span>Confirmar Aposta [WS]</span>
    </button>
  `;

  calculatePayout();
}

export function removeSlipSelection() {
  saveSelectedSlip(null);
  renderBetSlipSidebar();
}

export function setQuickStake(val) {
  const input = document.getElementById("stake-input");
  if (input) {
    input.value = Number(val).toFixed(2);
    calculatePayout();
  }
}

export function calculatePayout() {
  const input = document.getElementById("stake-input");
  const display = document.getElementById("potential-payout-display");
  const btn = document.getElementById("btn-submit-bet");
  const alertFunds = document.getElementById("insufficient-funds-alert");

  if (!input || !display || !AppState.selectedSlip) return;

  const stake = parseFloat(input.value) || 0;
  const odd = AppState.selectedSlip.odd;
  const retorno = stake * odd;

  display.innerText = `R$ ${retorno.toFixed(2).replace(".", ",")}`;

  // [RNF-02] Validação estrita de saldo não negativo
  if (stake > AppState.balance || stake <= 0) {
    if (btn) btn.disabled = true;
    if (alertFunds) alertFunds.classList.add("visible");
  } else {
    if (btn) btn.disabled = false;
    if (alertFunds) alertFunds.classList.remove("visible");
  }
}

export function showOddChangeInSlip(newOdd) {
  const alertEl = document.getElementById("slip-odd-alert");
  const newOddVal = document.getElementById("new-odd-val");
  const oddHighlight = document.getElementById("slip-display-odd");

  if (alertEl && newOddVal) {
    newOddVal.innerText = newOdd.toFixed(2);
    alertEl.classList.add("visible");
  }
  if (oddHighlight) oddHighlight.innerText = newOdd.toFixed(2);
  if (AppState.selectedSlip) {
    AppState.selectedSlip.odd = newOdd;
    calculatePayout();
  }
}

export function submitBet() {
  if (!AppState.ws || AppState.ws.readyState !== WebSocket.OPEN) {
    alert("Erro: WebSocket desconectado. Aguarde a reconexão.");
    return;
  }

  const input = document.getElementById("stake-input");
  const stake = parseFloat(input.value);

  if (isNaN(stake) || stake <= 0) {
    alert("Insira um valor válido maior que zero.");
    return;
  }

  if (stake > AppState.balance) {
    alert("Saldo insuficiente!");
    return;
  }

  const slip = AppState.selectedSlip;
  if (!slip) return;

  const payload = {
    type: WS_EVENTS.PLACE_BET,
    matchId: slip.matchId,
    mercadoId: slip.mercadoId,
    selecao: slip.selecao,
    odd: slip.odd,
    valor: stake
  };

  console.log("📤 [ENVIANDO PLACE_BET]", payload);
  AppState.ws.send(JSON.stringify(payload));

  const btn = document.getElementById("btn-submit-bet");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Processando via WebSocket...";
  }
}

export function showBetConfirmationModal(ticketId, bet) {
  const modal = document.getElementById("bet-confirmed-modal");
  if (!modal) return;

  document.getElementById("modal-ticket-id").innerText = `#${ticketId}`;
  document.getElementById("modal-match-title").innerText = `${bet.time_casa} vs ${bet.time_fora}`;
  document.getElementById("modal-pick-info").innerText = `${bet.selecao} (Odd: ${bet.odd_momento.toFixed(2)})`;
  document.getElementById("modal-stake-val").innerText = `R$ ${bet.valor_apostado.toFixed(2)}`;
  document.getElementById("modal-payout-val").innerText = `R$ ${bet.retorno_potencial.toFixed(2)}`;

  modal.classList.add("open");
}

export function closeModalAndGoToWallet() {
  const modal = document.getElementById("bet-confirmed-modal");
  if (modal) modal.classList.remove("open");
  window.location.href = "wallet.html";
}
