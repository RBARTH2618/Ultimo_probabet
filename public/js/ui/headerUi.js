/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/ui/headerUi.js - Atualização Visual do Cabeçalho e Badges
 * Responsabilidade Única: Refletir saldo, identidade e status de rede no cabeçalho.
 * ==============================================================================
 */

import { AppState } from "../state/appState.js";

export function updateHeaderUI() {
  const balanceEl = document.getElementById("header-balance");
  if (balanceEl) {
    const prev = balanceEl.innerText;
    const formatted = `R$ ${AppState.balance.toFixed(2).replace(".", ",")}`;
    if (prev !== formatted) {
      balanceEl.innerText = formatted;
      balanceEl.classList.remove("balance-pulse");
      void balanceEl.offsetWidth; // Reflow para reiniciar CSS animation
      balanceEl.classList.add("balance-pulse");
    }
  }

  const userEl = document.getElementById("header-username");
  if (userEl) userEl.innerText = AppState.userName;

  const countActiveEl = document.getElementById("nav-active-bets-count");
  if (countActiveEl) {
    const activeCount = AppState.activeBets.filter(b => b.status_aposta === "ATIVA").length;
    countActiveEl.innerText = activeCount;
  }
}

export function updateConnectionBadge(isConnected) {
  const badge = document.getElementById("ws-status");
  if (!badge) return;
  if (isConnected) {
    badge.className = "ws-status-badge connected";
    badge.innerHTML = `<span class="status-dot"></span> <span>Conectado (WS)</span>`;
  } else {
    badge.className = "ws-status-badge disconnected";
    badge.innerHTML = `<span class="status-dot"></span> <span>Desconectado</span>`;
  }
}

export function showGlobalAlert(msg) {
  const alertEl = document.getElementById("global-alert");
  if (!alertEl) return;
  alertEl.innerHTML = `<span>⚠️ ${msg}</span>`;
  alertEl.classList.add("visible");
}

export function hideGlobalAlert() {
  const alertEl = document.getElementById("global-alert");
  if (alertEl) alertEl.classList.remove("visible");
}

export function showGameEventBanner(evt) {
  const banner = document.getElementById("event-banner");
  if (!banner) return;

  const titleEl = document.getElementById("banner-title");
  const descEl = document.getElementById("banner-desc");
  const iconEl = document.getElementById("banner-icon");

  if (evt.type === "GOAL") {
    if (iconEl) iconEl.innerText = "⚽";
    if (titleEl) titleEl.innerText = "GOL CONFIRMADO!";
  } else {
    if (iconEl) iconEl.innerText = "🟨";
    if (titleEl) titleEl.innerText = "CARTÃO / FALTA";
  }

  if (descEl) descEl.innerText = evt.description || "Lance decisivo na partida!";
  banner.classList.add("show");

  setTimeout(() => {
    banner.classList.remove("show");
  }, 5000);
}
