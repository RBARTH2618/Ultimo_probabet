/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/principal.js - Ponto de Entrada do Cliente Frontend
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o maestro da aplicação no navegador. Orquestra a inicialização e expõe as funções
 * globais necessárias para os botões do HTML funcionarem.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  1. Ao carregar o DOM (DOMContentLoaded), inicializa a sessão (localStorage),
 *     atualiza o cabeçalho e conecta o WebSocket com o backend.
 *  2. Registra no objeto `window` os manipuladores de cliques (onclick) em Português
 *     e também em Inglês para garantir 100% de compatibilidade com os templates HTML.
 * ==============================================================================
 */

import { inicializarSessao } from "./state/sessao.js";
import { conectarWebSocket } from "./net/clienteWebSocket.js";
import { atualizarInterfaceCabecalho } from "./ui/interfaceCabecalho.js";
import { selecionarCotacao, filtrarPorEsporte } from "./views/visaoLobby.js";
import { 
  removerSelecaoCupom, 
  definirValorRapido, 
  calcularRetornoPotencial, 
  enviarAposta, 
  fecharModalEIrParaCarteira 
} from "./views/visaoCupom.js";
import { solicitarCashOut, trocarAbaCarteira } from "./views/visaoCarteira.js";
import { 
  demonstracaoForcarGol, 
  demonstracaoResetarSaldo, 
  demonstracaoReiniciarJogo, 
  demonstracaoFinalizarJogos,
  demonstracaoAlterarNome 
} from "./ui/barraDemonstracao.js";

// ==============================================================================
// REGISTRO DE MANIPULADORES NO ESCOPO GLOBAL (COMPATIBILIDADE COM HTML onclick)
// ==============================================================================

// Nomes didáticos em Português
window.selecionarCotacao = selecionarCotacao;
window.filtrarPorEsporte = filtrarPorEsporte;
window.removerSelecaoCupom = removerSelecaoCupom;
window.definirValorRapido = definirValorRapido;
window.calcularRetornoPotencial = calcularRetornoPotencial;
window.enviarAposta = enviarAposta;
window.fecharModalEIrParaCarteira = fecharModalEIrParaCarteira;
window.solicitarCashOut = solicitarCashOut;
window.trocarAbaCarteira = trocarAbaCarteira;
window.demonstracaoForcarGol = demonstracaoForcarGol;
window.demonstracaoResetarSaldo = demonstracaoResetarSaldo;
window.demonstracaoReiniciarJogo = demonstracaoReiniciarJogo;
window.demonstracaoFinalizarJogos = demonstracaoFinalizarJogos;
window.demonstracaoAlterarNome = demonstracaoAlterarNome;

// ==============================================================================
// BOOTSTRAP DA APLICAÇÃO AO CARREGAR A PÁGINA
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  inicializarSessao();
  atualizarInterfaceCabecalho();
  conectarWebSocket();
});
