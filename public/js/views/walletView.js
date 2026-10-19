/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/views/walletView.js - Renderização da Carteira e Cash Out (Tela 3)
 * Responsabilidade Única: Exibir saldo, bilhetes ativos/histórico e tabela de ranking.
 * Implementa: [RF-04] Recálculo, [RF-05] Cash Out e [RF-08] Ranking em Tempo Real.
 * ==============================================================================
 */

import { AppState } from "../state/appState.js";
import { WS_EVENTS } from "../config/events.js";

export function renderWalletPage() {
  const heroBal = document.getElementById("wallet-hero-balance-val");
  if (heroBal) heroBal.innerText = `R$ ${AppState.balance.toFixed(2).replace(".", ",")}`;

  const container = document.getElementById("wallet-active-bets");
  if (!container) return;

  const currentTab = document.querySelector(".wallet-tab-btn.active")?.dataset.tab || "ativas";

  let filteredBets = [];
  if (currentTab === "ativas") {
    filteredBets = AppState.activeBets.filter(b => b.status_aposta === "ATIVA");
  } else {
    filteredBets = AppState.activeBets.filter(b => b.status_aposta !== "ATIVA");
  }

  if (filteredBets.length === 0) {
    container.innerHTML = `
      <div class="slip-empty-state">
        <p>Nenhuma aposta ${currentTab === 'ativas' ? 'ativa no momento' : 'no histórico'}.</p>
        <a href="index.html" class="btn-header" style="margin-top: 12px; display: inline-flex;">Ir para o Lobby de Jogos</a>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredBets.map(b => {
    const isAtiva = b.status_aposta === "ATIVA";
    const cashOutVal = b.currentCashOut ? b.currentCashOut.toFixed(2) : (b.valor_apostado * 0.95).toFixed(2);

    return `
      <div class="bet-ticket-card" id="ticket-card-${b.id_aposta}">
        <div style="flex: 1;">
          <div class="ticket-meta">
            <span class="ticket-id-tag">APOSTA #${b.id_aposta}</span>
            <span class="ticket-status-badge status-${b.status_aposta.toLowerCase()}">${b.status_aposta}</span>
          </div>
          <div class="ticket-match-title">${b.time_casa} vs ${b.time_fora}</div>
          <div class="ticket-details-row">
            <span>Seleção: <strong>${b.selecao}</strong></span>
            <span>Odd: <strong>${b.odd_momento.toFixed(2)}</strong></span>
            <span>Apostado: <strong>R$ ${b.valor_apostado.toFixed(2)}</strong></span>
            <span>Retorno Pot.: <strong>R$ ${b.retorno_potencial.toFixed(2)}</strong></span>
          </div>
        </div>

        <div>
          ${isAtiva ? `
            <button class="btn-cashout" onclick="window.requestCashOut(${b.id_aposta}, ${b.id_partida}, ${cashOutVal})">
              <span>⚡ REALIZAR CASH OUT: R$ ${cashOutVal}</span>
            </button>
          ` : `
            <div style="text-align: right; font-weight: 700;">
              ${b.status_aposta === 'GREEN' ? `<span style="color: var(--accent-green);">+ R$ ${b.retorno_potencial.toFixed(2)} [GREEN]</span>` : ''}
              ${b.status_aposta === 'RED' ? `<span style="color: var(--accent-red);">- R$ ${b.valor_apostado.toFixed(2)} [RED]</span>` : ''}
              ${b.status_aposta === 'CASH_OUT' ? `<span style="color: var(--accent-orange);">+ R$ ${(b.valor_resgatado || cashOutVal)} [CASH OUT]</span>` : ''}
            </div>
          `}
        </div>
      </div>
    `;
  }).join("");
}

export function requestCashOut(betId, matchId, requestedValue) {
  if (!AppState.ws || AppState.ws.readyState !== WebSocket.OPEN) {
    alert("Erro: Conexão WebSocket não disponível.");
    return;
  }

  const payload = {
    type: WS_EVENTS.CASH_OUT,
    betId: Number(betId),
    matchId: Number(matchId),
    requestedValue: parseFloat(requestedValue)
  };

  console.log("📤 [ENVIANDO CASH_OUT]", payload);
  AppState.ws.send(JSON.stringify(payload));
}

export function renderRankingTable(rankingList) {
  const tableBody = document.getElementById("ranking-table-body");
  if (!tableBody) return;

  tableBody.innerHTML = rankingList.map((user, index) => {
    const isMe = user.id === AppState.userId;
    const pos = index + 1;
    let badgeClass = "";
    if (pos === 1) badgeClass = "top-1";
    if (pos === 2) badgeClass = "top-2";
    if (pos === 3) badgeClass = "top-3";

    return `
      <tr class="${isMe ? 'current-user-row' : ''}">
        <td class="rank-pos ${badgeClass}">#${pos}</td>
        <td>${user.nome} ${isMe ? '⭐ (Você)' : ''}</td>
        <td style="color: var(--accent-green); font-weight: 700;">R$ ${user.saldo.toFixed(2).replace(".", ",")}</td>
      </tr>
    `;
  }).join("");
}

export function switchWalletTab(tabName, btnElement) {
  document.querySelectorAll(".wallet-tab-btn").forEach(b => b.classList.remove("active"));
  if (btnElement) btnElement.classList.add("active");
  renderWalletPage();
}
