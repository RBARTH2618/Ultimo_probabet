/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/views/lobbyView.js - Renderização do Lobby de Apostas (Tela 1)
 * Responsabilidade Única: Exibir partidas ao vivo, filtros e animação de odds.
 * Implementa: [RF-02] Transmissão Dinâmica de Odds com feedback visual.
 * ==============================================================================
 */

import { AppState } from "../state/appState.js";
import { saveSelectedSlip } from "../state/session.js";

export function renderLobbyPage() {
  const container = document.getElementById("matches-list");
  if (!container) return;

  const matches = Array.from(AppState.matches.values()).filter(m => {
    if (AppState.currentSportFilter === "TODOS") return true;
    return m.modalidade_esportiva === AppState.currentSportFilter;
  });

  if (matches.length === 0) {
    container.innerHTML = `<div class="slip-empty-state"><p>Nenhuma partida ao vivo no momento.</p></div>`;
    return;
  }

  container.innerHTML = matches.map(m => {
    const odds = m.odds["VENCEDOR_1X2"] || { CASA: 1.80, EMPATE: 3.10, FORA: 4.50 };
    const isSuspended = m.status_partida === "SUSPENSA";

    return `
      <div class="match-card ${isSuspended ? 'suspended' : ''}" data-match-id="${m.id_partida}">
        <div class="match-header-line">
          <div class="live-indicator">
            <span class="live-pulse-dot"></span>
            <span>LIVE <span class="match-minute">${m.minuto_jogo}'</span></span>
            <span style="color: var(--text-dim); margin-left: 6px;">| ${m.modalidade_esportiva} - ${m.campeonato || ''}</span>
          </div>
          <div class="match-league">ID: #${m.id_partida}</div>
        </div>

        <div class="match-teams-row">
          <div class="teams-display">
            <div class="team-name home">${m.time_casa}</div>
            <div class="match-score-pill">
              <span class="match-score-text">${m.placar_casa} - ${m.placar_fora}</span>
            </div>
            <div class="team-name away">${m.time_fora}</div>
          </div>

          <div class="odds-market-group">
            ${isSuspended ? `<div class="suspended-overlay-tag">🔒 Mercado Temporariamente Suspenso</div>` : ''}
            
            <button class="odd-button" data-odd-type="CASA" onclick="window.selectOdd(${m.id_partida}, 'CASA', ${odds.CASA}, '${m.time_casa} vs ${m.time_fora}', '${m.time_casa}')" ${isSuspended ? 'disabled' : ''}>
              <span class="odd-label">Casa (1)</span>
              <span class="odd-val">${odds.CASA.toFixed(2)}</span>
            </button>

            <button class="odd-button" data-odd-type="EMPATE" onclick="window.selectOdd(${m.id_partida}, 'EMPATE', ${odds.EMPATE}, '${m.time_casa} vs ${m.time_fora}', 'Empate')" ${isSuspended ? 'disabled' : ''}>
              <span class="odd-label">Empate (X)</span>
              <span class="odd-val">${odds.EMPATE.toFixed(2)}</span>
            </button>

            <button class="odd-button" data-odd-type="FORA" onclick="window.selectOdd(${m.id_partida}, 'FORA', ${odds.FORA}, '${m.time_casa} vs ${m.time_fora}', '${m.time_fora}')" ${isSuspended ? 'disabled' : ''}>
              <span class="odd-label">Fora (2)</span>
              <span class="odd-val">${odds.FORA.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

export function selectOdd(matchId, selecao, odd, matchTitle, pickName) {
  const slip = {
    matchId,
    mercadoId: "VENCEDOR_1X2",
    selecao,
    odd,
    matchTitle,
    pickName
  };

  saveSelectedSlip(slip);
  window.location.href = `betslip.html?matchId=${matchId}`;
}

export function applyOddsUpdateUI(matchId, odds, directions, minuto, placar) {
  const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
  if (!matchCard) return;

  const minuteEl = matchCard.querySelector(".match-minute");
  if (minuteEl && minuto) minuteEl.innerText = `${minuto}'`;

  if (placar) {
    const scoreEl = matchCard.querySelector(".match-score-text");
    if (scoreEl) scoreEl.innerText = `${placar.casa} - ${placar.fora}`;
  }

  const odds1x2 = odds["VENCEDOR_1X2"];
  if (!odds1x2) return;

  ["CASA", "EMPATE", "FORA"].forEach(tipo => {
    const btn = matchCard.querySelector(`[data-odd-type="${tipo}"]`);
    if (!btn) return;

    const valEl = btn.querySelector(".odd-val");
    const novaOdd = odds1x2[tipo].toFixed(2);
    const direcao = directions ? directions[tipo] : "SAME";

    if (valEl) {
      let arrow = "";
      if (direcao === "UP") arrow = " ↑";
      if (direcao === "DOWN") arrow = " ↓";
      valEl.innerText = novaOdd + arrow;
    }

    if (direcao === "UP") {
      btn.classList.add("flash-up");
      setTimeout(() => btn.classList.remove("flash-up"), 1200);
    } else if (direcao === "DOWN") {
      btn.classList.add("flash-down");
      setTimeout(() => btn.classList.remove("flash-down"), 1200);
    }
  });
}

export function lockMatchOdds(matchId, isLocked) {
  const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
  if (!matchCard) return;

  if (isLocked) {
    matchCard.classList.add("suspended");
    const btns = matchCard.querySelectorAll(".odd-button");
    btns.forEach(b => b.disabled = true);
  } else {
    matchCard.classList.remove("suspended");
    const btns = matchCard.querySelectorAll(".odd-button");
    btns.forEach(b => b.disabled = false);
  }
}

export function filterSport(sportName, btnElement) {
  AppState.currentSportFilter = sportName;
  document.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
  if (btnElement) btnElement.classList.add("active");
  renderLobbyPage();
}
