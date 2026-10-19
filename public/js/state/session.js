/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/state/session.js - Gerenciador de Sessão e Persistência Local
 * Responsabilidade Única: Persistir e recuperar identidade e seleções do apostador.
 * ==============================================================================
 */

import { AppState } from "./appState.js";

const STORAGE_KEYS = {
  USER_ID: "probabet_userId",
  USER_NAME: "probabet_userName",
  SELECTED_SLIP: "probabet_selected_slip"
};

export function initSession() {
  let savedId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  let savedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);

  if (!savedId) {
    savedId = "usr_" + Math.floor(1000 + Math.random() * 9000);
    savedName = "Apostador " + savedId.slice(-4);
    localStorage.setItem(STORAGE_KEYS.USER_ID, savedId);
    localStorage.setItem(STORAGE_KEYS.USER_NAME, savedName);
  }

  AppState.userId = savedId;
  AppState.userName = savedName;

  // Recupera seleção do Bet Slip salva na navegação
  const savedSlip = sessionStorage.getItem(STORAGE_KEYS.SELECTED_SLIP);
  if (savedSlip) {
    try {
      AppState.selectedSlip = JSON.parse(savedSlip);
    } catch (e) {
      AppState.selectedSlip = null;
    }
  }
}

export function saveSelectedSlip(slip) {
  AppState.selectedSlip = slip;
  if (slip) {
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_SLIP, JSON.stringify(slip));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.SELECTED_SLIP);
  }
}

export function updateSavedUserName(newName) {
  AppState.userName = newName;
  localStorage.setItem(STORAGE_KEYS.USER_NAME, newName);
}
