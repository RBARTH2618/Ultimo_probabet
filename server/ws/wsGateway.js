/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: ws/wsGateway.js - Ponte de Compatibilidade (Inglês -> Português)
 * ==============================================================================
 * Re-exporta o singleton de ws/gatewayWebSocket.js.
 * ==============================================================================
 */

const gatewayWebSocket = require("./gatewayWebSocket");

module.exports = gatewayWebSocket;
