/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/main.js - Ponto de Entrada do Cliente Frontend
 * Autores: Antigravity & João Lucas (Trabalho Acadêmico - UniRV)
 * Disciplina: Desenvolvimento de Software para Web | Prof. Me. Sergio Souza Novak
 * ==============================================================================
 * Responsabilidade Única: Orquestrar a inicialização do cliente e registrar
 * os manipuladores globais de interface para compatibilidade com HTML5.
 * ==============================================================================
 */

import { initSession } from "./state/session.js";
import { connectWebSocket } from "./net/wsClient.js";
import { updateHeaderUI } from "./ui/headerUi.js";
import { selectOdd, filterSport } from "./views/lobbyView.js";
import { 
  removeSlipSelection, 
  setQuickStake, 
  calculatePayout, 
  submitBet, 
  closeModalAndGoToWallet 
} from "./views/betslipView.js";
import { requestCashOut, switchWalletTab } from "./views/walletView.js";
import { 
  demoTriggerGoal, 
  demoResetBalance, 
  demoResetMatch, 
  demoChangeUserName 
} from "./ui/demoBar.js";

// ==============================================================================
// REGISTRO DE MANIPULADORES NO ESCOPO GLOBAL (COMPATIBILIDADE COM HTML onclick)
// ==============================================================================

window.selectOdd = selectOdd;
window.filterSport = filterSport;
window.removeSlipSelection = removeSlipSelection;
window.setQuickStake = setQuickStake;
window.calculatePayout = calculatePayout;
window.submitBet = submitBet;
window.closeModalAndGoToWallet = closeModalAndGoToWallet;
window.requestCashOut = requestCashOut;
window.switchWalletTab = switchWalletTab;

// Controles da barra didática
window.demoTriggerGoal = demoTriggerGoal;
window.demoResetBalance = demoResetBalance;
window.demoResetMatch = demoResetMatch;
window.demoChangeUserName = demoChangeUserName;

// ==============================================================================
// BOOTSTRAP DA APLICAÇÃO AO CARREGAR O DOM
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initSession();
  updateHeaderUI();
  connectWebSocket();
});
