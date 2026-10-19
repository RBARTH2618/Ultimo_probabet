/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/net/wsClient.js - Cliente de Conexão WebSocket
 * Responsabilidade Única: Estabelecer, reconectar e enviar mensagens via WS.
 * ==============================================================================
 */

import { AppState } from "../state/appState.js";
import { updateConnectionBadge, showGlobalAlert, hideGlobalAlert } from "../ui/headerUi.js";
import { handleServerEvent } from "./eventHandler.js";

let reconnectTimer = null;

export function connectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host || "localhost:3000";
  const wsUrl = `${protocol}//${host}?userId=${AppState.userId}&userName=${encodeURIComponent(AppState.userName)}`;

  console.log(`🌐 [CLIENTE WS] Conectando a ${wsUrl}...`);
  updateConnectionBadge(false);

  AppState.ws = new WebSocket(wsUrl);

  AppState.ws.onopen = () => {
    console.log("✅ [CLIENTE WS] Conexão estabelecida com sucesso!");
    updateConnectionBadge(true);
    hideGlobalAlert();
  };

  AppState.ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerEvent(data);
    } catch (err) {
      console.error("❌ [CLIENTE WS] Erro ao decodificar JSON recebido:", err);
    }
  };

  AppState.ws.onclose = () => {
    console.warn("⚠️ [CLIENTE WS] Conexão fechada. Tentando reconectar em 3 segundos...");
    updateConnectionBadge(false);
    showGlobalAlert("Conexão WS Interrompida — Cotações Pausadas");
    reconnectTimer = setTimeout(connectWebSocket, 3000);
  };

  AppState.ws.onerror = (err) => {
    console.error("❌ [CLIENTE WS] Erro na conexão do WebSocket:", err);
  };
}

export function sendPayload(payload) {
  if (!AppState.ws || AppState.ws.readyState !== WebSocket.OPEN) {
    console.error("⚠️ Não foi possível enviar payload: WebSocket não está aberto.");
    return false;
  }
  AppState.ws.send(JSON.stringify(payload));
  return true;
}
