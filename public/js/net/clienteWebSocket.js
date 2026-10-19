/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/net/clienteWebSocket.js - Cliente de Rede WebSocket Full-Duplex
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o módulo que estabelece a conexão TCP persistente Full-Duplex com o servidor.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Cria a conexão WebSocket com o backend (`ws://localhost:3000`).
 *  - Passa os parâmetros de identificação do apostador na URL de conexão.
 *  - Implementa reconexão automática com temporizador se a internet ou o servidor oscilarem.
 *  - Recebe os pacotes JSON em tempo real e os entrega ao manipulador de eventos.
 *  - Provê a função segura `enviarMensagemServidor` para despacho de apostas e cash out.
 * 
 * 📍 ONDE É USADO?
 * Inicializado pelo ponto de entrada (principal.js) no carregamento da página.
 * ==============================================================================
 */

import { EstadoApp } from "../state/estadoAplicacao.js";
import { atualizarStatusConexao, exibirAlertaGlobal, ocultarAlertaGlobal } from "../ui/interfaceCabecalho.js";
import { processarEventoServidor } from "./manipuladorEventos.js";

let temporizadorReconexao = null;

/**
 * Abre a conexão bidirecional via WebSocket com o servidor Node.js.
 */
export function conectarWebSocket() {
  if (temporizadorReconexao) {
    clearTimeout(temporizadorReconexao);
    temporizadorReconexao = null;
  }

  const protocolo = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host || "localhost:3000";
  const urlWs = `${protocolo}//${host}?userId=${EstadoApp.idApostador}&userName=${encodeURIComponent(EstadoApp.nomeApostador)}`;

  console.log(`🌐 [CLIENTE WS] Conectando a ${urlWs}...`);
  atualizarStatusConexao(false);

  EstadoApp.ws = new WebSocket(urlWs);

  // Evento: Conexão estabelecida com sucesso
  EstadoApp.ws.onopen = () => {
    console.log("✅ [CLIENTE WS] Conexão Full-Duplex estabelecida com sucesso!");
    atualizarStatusConexao(true);
    ocultarAlertaGlobal();
  };

  // Evento: Mensagem recebida do servidor
  EstadoApp.ws.onmessage = (evento) => {
    try {
      const dados = JSON.parse(evento.data);
      processarEventoServidor(dados);
    } catch (err) {
      console.error("❌ [CLIENTE WS] Erro ao decodificar JSON recebido:", err);
    }
  };

  // Evento: Conexão fechada / queda de rede
  EstadoApp.ws.onclose = () => {
    console.warn("⚠️ [CLIENTE WS] Conexão interrompida. Tentando reconectar em 3 segundos...");
    atualizarStatusConexao(false);
    exibirAlertaGlobal("Conexão WS Interrompida — Cotações Pausadas");
    temporizadorReconexao = setTimeout(conectarWebSocket, 3000);
  };

  // Evento: Erro na conexão
  EstadoApp.ws.onerror = (err) => {
    console.error("❌ [CLIENTE WS] Erro na conexão do WebSocket:", err);
  };
}

/**
 * Envia um payload JSON pelo canal WebSocket se o socket estiver aberto.
 */
export function enviarMensagemServidor(payload) {
  if (!EstadoApp.ws || EstadoApp.ws.readyState !== WebSocket.OPEN) {
    console.error("⚠️ Não foi possível enviar payload: WebSocket não está aberto.");
    return false;
  }
  EstadoApp.ws.send(JSON.stringify(payload));
  return true;
}

