/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: servidor.js - Servidor Web HTTP e Ponto de Entrada Principal
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o ponto de entrada principal do backend. Quando você executa `npm start` ou
 * `node server/servidor.js`, é este arquivo que sobe o servidor.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  1. Inicializa o framework Express para servir os arquivos HTML, CSS e JS do frontend.
 *  2. Inicializa o WebSocket Server na mesma porta TCP (3000) para permitir comunicação bidirecional.
 *  3. Instancia e inicia o Motor de Partidas (engine/motorPartida.js).
 *  4. Gerencia o ciclo de vida dos apostadores (conexão, handshake com R$ 100,00, mensagens e desconexão).
 * 
 * 📍 ARQUITETURA MODULAR (CLEAN LAYERED ARCHITECTURE):
 *  - /config     -> Constantes e dicionário de eventos (constantes.js)
 *  - /data       -> Banco de dados em memória (bancoDados.js) e seeds (dadosIniciais.js)
 *  - /services   -> Serviços: Usuário, Partida, Aposta, Cash Out e Liquidação
 *  - /engine     -> Cálculo de odds (calculadoraCotacoes.js) e motor (motorPartida.js)
 *  - /ws         -> Gateway WebSocket (gatewayWebSocket.js) e roteador (roteadorWebSocket.js)
 * ==============================================================================
 */

const http = require("http");
const path = require("path");
const express = require("express");

const gatewayWebSocket = require("./ws/gatewayWebSocket");
const { processarMensagemCliente } = require("./ws/roteadorWebSocket");
const MotorPartida = require("./engine/motorPartida");
const servicoUsuario = require("./services/servicoUsuario");
const servicoPartida = require("./services/servicoPartida");
const servicoCashout = require("./services/servicoCashout");
const { EVENTOS_WS } = require("./config/constantes");

// 1. Inicialização do Express
const app = express();
const PORTA = process.env.PORT || 3000;
const pastaPublica = path.join(__dirname, "..", "public");

app.use(express.json());
app.use(express.static(pastaPublica));

// ==============================================================================
// ROTAS HTTP COMPATÍVEIS COM O ROTEIRO DA ATIVIDADE ACADÊMICA UniRV
// ==============================================================================

// Tela 1: Lobby de Cotações ao Vivo
app.get(["/", "/index.html", "/tela1-odds.html", "/lobby.html"], (req, res) => {
  res.sendFile(path.join(pastaPublica, "index.html"));
});

// Tela 2: Detalhes da Partida e Cupom de Apostas (Bet Slip)
app.get(["/betslip", "/betslip.html", "/tela2-betslip.html", "/cupom.html"], (req, res) => {
  res.sendFile(path.join(pastaPublica, "betslip.html"));
});

// Tela 3: Carteira do Apostador e Encerramento Antecipado (Cash Out)
app.get(["/wallet", "/wallet.html", "/tela3-cashout.html", "/carteira.html"], (req, res) => {
  res.sendFile(path.join(pastaPublica, "wallet.html"));
});

// Endpoint de diagnóstico do sistema
app.get("/api/status", (req, res) => {
  res.json({
    sistema: "PROBABET (Ws2) - UniRV",
    status: "OPERACIONAL",
    arquitetura: "100% MODULAR (Clean Layered Architecture)",
    clientesConectados: gatewayWebSocket.obterTotalConectados(),
    partidasAtivas: servicoPartida.obterTodasPartidas().length,
    ranking: servicoUsuario.obterClassificacaoRanking()
  });
});

// 2. Servidor HTTP Compartilhado
const servidorHttp = http.createServer(app);

// 3. Inicializa o Gateway WebSocket sobre o servidor HTTP
const wss = gatewayWebSocket.inicializarServidor(servidorHttp);

// 4. Inicializa o Motor de Partidas com callbacks desacoplados
const motor = new MotorPartida(
  (payload) => gatewayWebSocket.transmitirParaTodos(payload),
  (idApostador, payload) => gatewayWebSocket.notificarApostador(idApostador, payload)
);
motor.iniciarLoop();

// ==============================================================================
// CICLO DE VIDA DAS CONEXÕES WEBSOCKET
// ==============================================================================

wss.on("connection", (ws, req) => {
  const urlParametros = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const idSolicitado = urlParametros.get("userId") || `user_${Math.floor(1000 + Math.random() * 9000)}`;
  const nomeSolicitado = urlParametros.get("userName") || `Apostador #${idSolicitado.slice(-4)}`;

  // [RF-01] Vincula ou recupera a sessão do apostador com saldo de R$ 100,00
  const apostador = servicoUsuario.obterOuCriarApostador(idSolicitado, nomeSolicitado, 100.00);
  gatewayWebSocket.registrarCliente(ws, { idApostador: apostador.id_apostador, nomeApostador: apostador.nome_completo });

  console.log(`🔌 [WS CONECTADO] Apostador: ${apostador.nome_completo} (ID: ${apostador.id_apostador}) | Saldo: R$ ${apostador.saldo_ficticio.toFixed(2)}`);

  // [RF-01] Handshake inicial confirmando a carteira do usuário e enviando os dados do jogo
  ws.send(JSON.stringify({
    event: EVENTOS_WS.HANDSHAKE_SUCCESS,
    userId: apostador.id_apostador,
    userName: apostador.nome_completo,
    balance: apostador.saldo_ficticio,
    matches: servicoPartida.obterTodasPartidas(),
    bets: servicoCashout.obterBilhetesDoApostador(apostador.id_apostador),
    ranking: servicoUsuario.obterClassificacaoRanking(),
    timestamp: new Date().toISOString()
  }));

  // Notifica todos com o ranking atualizado
  gatewayWebSocket.transmitirParaTodos({
    event: EVENTOS_WS.RANKING_UPDATE,
    ranking: servicoUsuario.obterClassificacaoRanking()
  });

  // Recepção de mensagens do cliente
  ws.on("message", (bufferBruto) => {
    try {
      const mensagem = JSON.parse(bufferBruto.toString());
      processarMensagemCliente(ws, mensagem, motor);
    } catch (err) {
      console.error("❌ [WS ERRO] Formato JSON inválido recebido:", err.message);
      ws.send(JSON.stringify({
        type: EVENTOS_WS.ERROR,
        message: "Formato de mensagem JSON inválido."
      }));
    }
  });

  // Desconexão do cliente
  ws.on("close", () => {
    const metadados = gatewayWebSocket.removerCliente(ws);
    if (metadados) {
      console.log(`👋 [WS DESCONECTADO] Apostador: ${metadados.nomeApostador} (${metadados.idApostador})`);
    }
  });

  ws.on("error", (err) => {
    console.error("⚠️ [WS ERRO NA CONEXÃO]:", err.message);
  });
});

// Inicialização do Servidor na porta configurada
servidorHttp.listen(PORTA, () => {
  console.log(`
  ==============================================================
  🚀 PROBABET - PLATAFORMA DE APOSTAS ESPORTIVAS EM TEMPO REAL
  --------------------------------------------------------------
  🌐 Servidor Web HTTP:  http://localhost:${PORTA}
  ⚡ Gateway WebSocket:  ws://localhost:${PORTA}
  📚 Trabalho Acadêmico: UniRV - Prof. Me. Sergio Souza Novak
  👥 Desenvolvedores:    João Lucas & Antigravity
  🧩 Arquitetura:        100% Modularizada em Português
  ==============================================================
  📌 Rotas disponíveis:
     - Tela 1 (Lobby):     http://localhost:${PORTA}/
     - Tela 2 (Bet Slip):  http://localhost:${PORTA}/betslip.html
     - Tela 3 (Carteira):  http://localhost:${PORTA}/wallet.html
  ==============================================================
  `);
});

module.exports = { servidorHttp, app, motor };
