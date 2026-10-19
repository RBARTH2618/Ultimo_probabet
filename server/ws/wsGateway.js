/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: ws/wsGateway.js - Gateway de Comunicação WebSocket
 * Responsabilidade Única: Gerenciar servidor WS, conexões ativas e envio de dados.
 * ==============================================================================
 */

const WebSocket = require("ws");

class WsGateway {
  constructor() {
    this.wss = null;
    this.clientsMap = new Map(); // ws -> { userId, userName }
  }

  init(server) {
    this.wss = new WebSocket.Server({ server });
    return this.wss;
  }

  registerClient(ws, meta) {
    this.clientsMap.set(ws, meta);
  }

  unregisterClient(ws) {
    const meta = this.clientsMap.get(ws);
    this.clientsMap.delete(ws);
    return meta;
  }

  getClientMeta(ws) {
    return this.clientsMap.get(ws);
  }

  getConnectedCount() {
    return this.clientsMap.size;
  }

  broadcast(payload) {
    if (!this.wss) return;
    const data = JSON.stringify(payload);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  notifyUser(userId, payload) {
    const data = JSON.stringify(payload);
    for (const [client, meta] of this.clientsMap.entries()) {
      if (meta.userId === userId && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }
}

const gateway = new WsGateway();

module.exports = gateway;
