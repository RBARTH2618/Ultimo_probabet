/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/ui/interfaceCabecalho.js - Atualização Visual do Cabeçalho e Badges
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o módulo responsável por atualizar a barra de cabeçalho global, notificações
 * de status da rede WebSocket e banner de lances do jogo.
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Atualiza dinamicamente o saldo do apostador com efeito visual de pulso (CSS pulse).
 *  - Exibe o nome do apostador e o contador de apostas ativas na aba Carteira.
 *  - Altera a badge de status WebSocket entre verde ("Conectado (WS)") e vermelho ("Desconectado").
 *  - Mostra a barra de alerta de desconexão caso a conexão oscile.
 *  - Apresenta o banner animado de Gol / Cartão na parte superior da tela [RF-06].
 * 
 * 📍 ONDE É USADO?
 * Presente em todas as telas (index.html, betslip.html, wallet.html).
 * ==============================================================================
 */

import { EstadoApp } from "../state/estadoAplicacao.js";

/**
 * Atualiza o saldo exibido, o nome do apostador e o badge contador de apostas em aberto.
 */
export function atualizarInterfaceCabecalho() {
  const elementoSaldo = document.getElementById("header-balance");
  if (elementoSaldo) {
    const valorAnterior = elementoSaldo.innerText;
    const formatado = `R$ ${EstadoApp.saldo.toFixed(2).replace(".", ",")}`;
    if (valorAnterior !== formatado) {
      elementoSaldo.innerText = formatado;
      elementoSaldo.classList.remove("balance-pulse");
      void elementoSaldo.offsetWidth; // Força reflow no navegador para reiniciar animação CSS
      elementoSaldo.classList.add("balance-pulse");
    }
  }

  const elementoNome = document.getElementById("header-username");
  if (elementoNome) elementoNome.innerText = EstadoApp.nomeApostador;

  const elementoContador = document.getElementById("nav-active-bets-count");
  if (elementoContador) {
    const totalAtivas = EstadoApp.apostasAtivas.filter(b => b.status_aposta === "ATIVA").length;
    elementoContador.innerText = totalAtivas;
  }
}

/**
 * Atualiza a cor e o texto do badge indicador de conexão WebSocket Full-Duplex.
 */
export function atualizarStatusConexao(estaConectado) {
  const badge = document.getElementById("ws-status");
  if (!badge) return;
  if (estaConectado) {
    badge.className = "ws-status-badge connected";
    badge.innerHTML = `<span class="status-dot"></span> <span>Conectado (WS)</span>`;
  } else {
    badge.className = "ws-status-badge disconnected";
    badge.innerHTML = `<span class="status-dot"></span> <span>Desconectado</span>`;
  }
}

/**
 * Exibe a barra de alerta no topo quando o WebSocket cai.
 */
export function exibirAlertaGlobal(mensagem) {
  const elementoAlerta = document.getElementById("global-alert");
  if (!elementoAlerta) return;
  elementoAlerta.innerHTML = `<span>⚠️ ${mensagem}</span>`;
  elementoAlerta.classList.add("visible");
}

/**
 * Oculta a barra de alerta global quando o WebSocket se reconecta.
 */
export function ocultarAlertaGlobal() {
  const elementoAlerta = document.getElementById("global-alert");
  if (elementoAlerta) elementoAlerta.classList.remove("visible");
}

/**
 * [RF-06] Exibe o pop-up animado na tela notificando Gol ou Cartão com tag de suspensão.
 */
export function exibirBannerEventoJogo(evento) {
  const banner = document.getElementById("event-banner");
  if (!banner) return;

  const elementoTitulo = document.getElementById("banner-title");
  const elementoDesc = document.getElementById("banner-desc");
  const elementoIcone = document.getElementById("banner-icon");

  if (evento.type === "GOAL") {
    if (elementoIcone) elementoIcone.innerText = "⚽";
    if (elementoTitulo) elementoTitulo.innerText = "GOL CONFIRMADO!";
  } else if (evento.type === "BASKET") {
    if (elementoIcone) elementoIcone.innerText = "🏀";
    if (elementoTitulo) elementoTitulo.innerText = `CESTA DE ${evento.points || 2} PONTOS!`;
  } else {
    if (elementoIcone) elementoIcone.innerText = "🟨";
    if (elementoTitulo) elementoTitulo.innerText = "CARTÃO / FALTA";
  }

  if (elementoDesc) elementoDesc.innerText = evento.description || "Lance decisivo na partida!";
  banner.classList.add("show");

  // Oculta automaticamente após 5 segundos
  setTimeout(() => {
    banner.classList.remove("show");
  }, 5000);
}

// Aliases para compatibilidade retroativa
export const updateHeaderUI = atualizarInterfaceCabecalho;
export const updateConnectionBadge = atualizarStatusConexao;
export const showGlobalAlert = exibirAlertaGlobal;
export const hideGlobalAlert = ocultarAlertaGlobal;
export const showGameEventBanner = exibirBannerEventoJogo;
