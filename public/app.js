/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Arquivo: public/app.js - Ponte de Compatibilidade (ES Modules Bridge)
 * ==============================================================================
 * O código do frontend foi totalmente desmembrado e modularizado em /public/js:
 *  - js/config/events.js      -> Dicionário de eventos WebSocket
 *  - js/state/appState.js     -> Estado global da aplicação
 *  - js/state/session.js      -> Gerenciamento de sessão e persistência
 *  - js/net/wsClient.js       -> Conexão, reconexão e envio WebSocket
 *  - js/net/eventHandler.js   -> Roteamento dos eventos recebidos
 *  - js/audio/soundEffects.js -> Síntese Web Audio API
 *  - js/ui/headerUi.js        -> Cabeçalho, saldo e badges
 *  - js/ui/demoBar.js         -> Comandos da barra de demonstração
 *  - js/views/lobbyView.js    -> Tela 1 (Lobby de Apostas)
 *  - js/views/betslipView.js  -> Tela 2 (Detalhes & Bet Slip)
 *  - js/views/walletView.js   -> Tela 3 (Carteira & Cash Out)
 *  - js/main.js               -> Ponto de entrada que orquestra os módulos
 * ==============================================================================
 */

import "./js/main.js";
