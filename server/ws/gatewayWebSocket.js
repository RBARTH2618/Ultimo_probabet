
const WebSocket = require("ws");

class GatewayWebSocket {
  constructor() {
    this.wss = null;
    this.mapaClientes = new Map(); // ws (socket) -> { idApostador, nomeApostador, userId, userName }
  }

  /**
   * Inicializa o WebSocket Server acoplado ao servidor HTTP compartilhado
   */
  inicializarServidor(servidorHttp) {
    this.wss = new WebSocket.Server({ server: servidorHttp });
    return this.wss;
  }

  /**
   * Registra os dados da sessão do apostador vinculados ao socket
   */
  registrarCliente(ws, metadados) {
    const metaNormalizada = {
      idApostador: metadados.idApostador || metadados.userId,
      nomeApostador: metadados.nomeApostador || metadados.userName,
      userId: metadados.userId || metadados.idApostador,
      userName: metadados.userName || metadados.nomeApostador
    };
    this.mapaClientes.set(ws, metaNormalizada);
  }

  /**
   * Remove o socket do mapa quando o usuário fecha a aba ou perde conexão
   */
  removerCliente(ws) {
    const metadados = this.mapaClientes.get(ws);
    this.mapaClientes.delete(ws);
    return metadados;
  }

  /**
   * Obtém os metadados do cliente dono do socket
   */
  obterMetadadosCliente(ws) {
    return this.mapaClientes.get(ws);
  }

  /**
   * Retorna o total de apostadores simultâneos conectados
   */
  obterTotalConectados() {
    return this.mapaClientes.size;
  }

  /**
   * [BROADCAST] Transmite um payload JSON para TODOS os clientes conectados com canal aberto.
   */
  transmitirParaTodos(payload) {
    if (!this.wss) return;
    const json = JSON.stringify(payload);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  }

  /**
   * [UNICAST] Transmite um payload direcionado apenas ao cliente que possui o idApostador especificado.
   */
  notificarApostador(idApostador, payload) {
    const json = JSON.stringify(payload);
    for (const [client, meta] of this.mapaClientes.entries()) {
      if (meta.idApostador === idApostador && client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  }
}

const gateway = new GatewayWebSocket();

module.exports = gateway;
