/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: config/constantes.js - Constantes do Sistema e Dicionário de Eventos
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o dicionário central de configurações e nomes de eventos do sistema.
 * 
 * ⚙️ O QUE ELE FAZ?
 * Evita o uso de "strings mágicas" soltas no código. Centraliza os tipos de mensagens
 * WebSocket exigidos pela especificação da atividade acadêmica da UniRV, além de
 * definir configurações do motor e da casa de apostas.
 * 
 * 📍 ONDE É USADO?
 * Importado pelo gateway WebSocket, roteador, serviços de aposta, cash out e motor.
 * ==============================================================================
 */

/**
 * 📡 EVENTOS DO PROTOCOLO WEBSOCKET (Ws2)
 * Tipos de mensagens trocadas entre o navegador (cliente) e o servidor Node.js.
 * Nota: Os nomes dos frames (strings) seguem a especificação da atividade da UniRV.
 */
const EVENTOS_WS = {
  // --- Handshake & Sessão Inicial [RF-01] ---
  HANDSHAKE_SUCCESS: "HANDSHAKE_SUCCESS", // Confirmação de conexão e envio de saldo inicial R$ 100,00
  
  // --- Cotações & Mercado [RF-02] ---
  ODDS_UPDATE: "ODDS_UPDATE",             // Transmissão periódica das cotações atualizadas
  MARKET_RESUMED: "MARKET_RESUMED",       // Reabertura do mercado após suspensão
  
  // --- Submissão & Gestão de Apostas [RF-03] ---
  PLACE_BET: "PLACE_BET",                 // Envio do bilhete pelo cliente
  BET_CONFIRMED: "BET_CONFIRMED",         // Comprovante emitido pelo servidor com #Ticket ID
  BET_REJECTED: "BET_REJECTED",           // Rejeição por saldo insuficiente ou mercado suspenso
  BET_SETTLED: "BET_SETTLED",             // Liquidação da aposta ao final do jogo [RF-07]
  
  // --- Encerramento Antecipado (Cash Out) [RF-04, RF-05, RNF-01] ---
  CASH_OUT: "CASH_OUT",                   // Solicitação de encerramento enviada pelo apostador
  CASH_OUT_CONFIRMED: "CASH_OUT_CONFIRMED", // Confirmação com crédito imediato no saldo
  CASH_OUT_REJECTED: "CASH_OUT_REJECTED",   // Rejeição por trava atômica (RNF-01: Gol ou suspensão)
  CASHOUT_HEARTBEAT: "CASHOUT_HEARTBEAT",   // Pulso de recálculo contínuo do valor de resgate
  
  // --- Carteira, Saldo e Ranking [RF-08] ---
  BALANCE_UPDATE: "BALANCE_UPDATE",       // Notificação de alteração de saldo
  RANKING_UPDATE: "RANKING_UPDATE",       // Atualização em tempo real da tabela de classificação
  GET_WALLET: "GET_WALLET",               // Solicitação dos dados da carteira do usuário
  WALLET_INFO: "WALLET_INFO",             // Resposta com saldo e lista de bilhetes
  RESET_BALANCE: "RESET_BALANCE",         // Comando didático para restaurar saldo para R$ 100,00
  UPDATE_USER_NAME: "UPDATE_USER_NAME",   // Atualização do nome do apostador no perfil/ranking
  
  // --- Eventos da Simulação de Partida [RF-06] ---
  GAME_EVENT: "GAME_EVENT",               // Notificação de gol ou cartão com suspensão de mercado
  MATCH_FINISHED: "MATCH_FINISHED",       // Encerramento da partida aos 90 minutos
  MATCH_RESET: "MATCH_RESET",             // Reinicialização da partida para nova demonstração
  
  // --- Ações Didáticas de Apresentação ---
  DEMO_TRIGGER_GOAL: "DEMO_TRIGGER_GOAL", // Botão da barra para forçar um gol instantâneo
  DEMO_RESET_MATCH: "DEMO_RESET_MATCH",   // Botão para reiniciar o cronômetro e placar
  DEMO_FINISH_MATCHES: "DEMO_FINISH_MATCHES", // Botão para finalizar todas as partidas aos 90 min (RF-07)
  
  // --- Erros ---
  ERROR: "ERROR"                          // Notificação de erro genérico
};

/**
 * ⚽ STATUS DA PARTIDA ESPORTIVA (Conforme diagrama ERD da atividade)
 */
const STATUS_PARTIDA = {
  AO_VIVO: "AO_VIVO",       // Jogo em andamento, apostas e cash out permitidos
  SUSPENSA: "SUSPENSA",     // Mercado congelado (após gol ou lance decisivo) [RNF-01]
  ENCERRADA: "ENCERRADA"    // Jogo finalizado aos 90 min, apostas liquidadas [RF-07]
};

/**
 * 🎟️ STATUS DO BILHETE DE APOSTA (Conforme diagrama ERD da atividade)
 */
const STATUS_APOSTA = {
  ATIVA: "ATIVA",           // Aposta em aberto aguardando término ou cash out
  GREEN: "GREEN",           // Aposta vitoriosa (prêmio pago)
  RED: "RED",               // Aposta perdida
  CASH_OUT: "CASH_OUT"      // Aposta encerrada antecipadamente pelo apostador
};

/**
 * ⚙️ CONFIGURAÇÕES GLOBAIS DO SISTEMA
 */
const CONFIGURACOES = {
  SALDO_INICIAL: 100.00,        // Saldo fictício inicial em reais [RF-01]
  INTERVALO_ENGINE_MS: 2500,    // Frequência de atualização de cotações (~2.5s) [RF-02]
  MARGEM_CASA: 0.92,            // Margem da casa de apostas (vig/overround) para cálculo de cash out
  TICKET_ID_INICIAL: 1032,      // Número do primeiro bilhete para simular continuidade
  CASHOUT_ID_INICIAL: 501       // Número da primeira transação de auditoria de cash out
};

// Aliases para compatibilidade total com termos em inglês prévios
const WS_EVENTS = EVENTOS_WS;
const MATCH_STATUS = STATUS_PARTIDA;
const BET_STATUS = STATUS_APOSTA;
const CONFIG = {
  INITIAL_BALANCE: CONFIGURACOES.SALDO_INICIAL,
  ENGINE_TICK_MS: CONFIGURACOES.INTERVALO_ENGINE_MS,
  HOUSE_MARGIN: CONFIGURACOES.MARGEM_CASA,
  INITIAL_TICKET_ID: CONFIGURACOES.TICKET_ID_INICIAL,
  INITIAL_CASHOUT_ID: CONFIGURACOES.CASHOUT_ID_INICIAL
};

module.exports = {
  EVENTOS_WS,
  STATUS_PARTIDA,
  STATUS_APOSTA,
  CONFIGURACOES,
  // Compatibilidade
  WS_EVENTS,
  MATCH_STATUS,
  BET_STATUS,
  CONFIG
};
