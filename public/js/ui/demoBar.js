/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/ui/demoBar.js - Ações Didáticas de Demonstração
 * Responsabilidade Única: Encapsular os comandos manuais para a apresentação acadêmica.
 * ==============================================================================
 */

import { AppState } from "../state/appState.js";
import { updateSavedUserName } from "../state/session.js";
import { WS_EVENTS } from "../config/events.js";

export function demoTriggerGoal() {
  if (!AppState.ws) return;
  AppState.ws.send(JSON.stringify({
    type: WS_EVENTS.DEMO_TRIGGER_GOAL,
    matchId: 15,
    team: "CASA"
  }));
}

export function demoResetBalance() {
  if (!AppState.ws) return;
  AppState.ws.send(JSON.stringify({
    type: WS_EVENTS.RESET_BALANCE
  }));
}

export function demoResetMatch() {
  if (!AppState.ws) return;
  AppState.ws.send(JSON.stringify({
    type: WS_EVENTS.DEMO_RESET_MATCH,
    matchId: 15
  }));
}

export function demoChangeUserName() {
  const novoNome = prompt("Digite seu nome de apostador para o Ranking da Turma:", AppState.userName);
  if (novoNome && novoNome.trim()) {
    updateSavedUserName(novoNome.trim());
    window.location.reload();
  }
}
