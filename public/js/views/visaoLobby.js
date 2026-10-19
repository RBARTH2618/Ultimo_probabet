/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/views/visaoLobby.js - Renderização do Lobby de Apostas (Tela 1)
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o módulo que gerencia a interface da Tela 1 (index.html - Lobby de Apostas).
 * 
 * ⚙️ O QUE ELE FAZ?
 *  - Implementa [RF-02]: Renderiza os cards de partidas esportivas com cotações dinâmicas.
 *  - Atualiza as cotações suavemente em tempo real piscando em verde (subida) ou vermelho (queda).
 *  - Fornece filtro por modalidades (Futebol, Basquete ou Todos os Esportes).
 *  - Bloqueia visualmente o mercado com ícone de cadeado 🔒 quando ocorre um gol [RF-06, RNF-01].
 *  - Ao clicar em qualquer cotação, salva a seleção e redireciona o apostador para a Tela 2 (Bet Slip).
 * 
 * 📍 ONDE É USADO?
 * Carregado em index.html e atualizado a cada evento ODDS_UPDATE recebido via WebSocket.
 * ==============================================================================
 */

import { EstadoApp } from "../state/estadoAplicacao.js";
import { salvarCupomSelecionado } from "../state/sessao.js";

/**
 * [RF-02] Renderiza a lista de partidas ao vivo no container da Tela 1.
 */
export function renderizarPaginaLobby() {
  const container = document.getElementById("matches-list");
  if (!container) return;

  const partidas = Array.from(EstadoApp.partidas.values()).filter(p => {
    if (EstadoApp.filtroEsporteAtual === "TODOS") return true;
    return p.modalidade_esportiva === EstadoApp.filtroEsporteAtual;
  });

  if (partidas.length === 0) {
    container.innerHTML = `<div class="slip-empty-state"><p>Nenhuma partida ao vivo no momento.</p></div>`;
    return;
  }

  container.innerHTML = partidas.map(p => {
    const cotacoes = p.odds["VENCEDOR_1X2"] || { CASA: 1.80, EMPATE: 3.10, FORA: 4.50 };
    const estaSuspenso = (p.status_partida === "SUSPENSA");
    const estaEncerrada = (p.status_partida === "ENCERRADA");
    const desabilitarBotoes = estaSuspenso || estaEncerrada;

    let indicadorAoVivoHtml = `
      <span class="live-pulse-dot"></span>
      <span>AO VIVO <span class="match-minute">${p.minuto_jogo}'</span></span>
    `;
    if (estaEncerrada) {
      indicadorAoVivoHtml = `
        <span class="badge-finished">🏁 ENCERRADA</span>
        <span class="match-minute" style="color: var(--text-dim); margin-left: 4px;">(${p.modalidade_esportiva === 'BASQUETE' ? "48'" : "90'"})</span>
      `;
    }

    let overlayTagHtml = '';
    if (estaSuspenso) {
      overlayTagHtml = `<div class="suspended-overlay-tag">🔒 Mercado Temporariamente Suspenso</div>`;
    } else if (estaEncerrada) {
      overlayTagHtml = `<div class="suspended-overlay-tag finished-tag">🏁 Fim de Jogo (Apostas Liquidadas)</div>`;
    }

    return `
      <div class="match-card ${estaSuspenso ? 'suspended' : ''} ${estaEncerrada ? 'finished' : ''}" data-match-id="${p.id_partida}">
        <div class="match-header-line">
          <div class="live-indicator ${estaEncerrada ? 'finished-indicator' : ''}">
            ${indicadorAoVivoHtml}
            <span style="color: var(--text-dim); margin-left: 6px;">| ${p.modalidade_esportiva} - ${p.campeonato || ''}</span>
          </div>
          <div class="match-league">ID Partida: #${p.id_partida}</div>
        </div>

        <div class="match-teams-row">
          <div class="teams-display">
            <div class="team-name home">${p.time_casa}</div>
            <div class="match-score-pill">
              <span class="match-score-text">${p.placar_casa} - ${p.placar_fora}</span>
            </div>
            <div class="team-name away">${p.time_fora}</div>
          </div>

          <div class="odds-market-group">
            ${overlayTagHtml}
            
            <button class="odd-button" data-odd-type="CASA" onclick="window.selecionarCotacao(${p.id_partida}, 'CASA', ${cotacoes.CASA}, '${p.time_casa} vs ${p.time_fora}', '${p.time_casa}')" ${desabilitarBotoes ? 'disabled' : ''}>
              <span class="odd-label">Casa (1)</span>
              <span class="odd-val">${cotacoes.CASA.toFixed(2)}</span>
            </button>

            <button class="odd-button" data-odd-type="EMPATE" onclick="window.selecionarCotacao(${p.id_partida}, 'EMPATE', ${cotacoes.EMPATE}, '${p.time_casa} vs ${p.time_fora}', 'Empate')" ${desabilitarBotoes ? 'disabled' : ''}>
              <span class="odd-label">Empate (X)</span>
              <span class="odd-val">${cotacoes.EMPATE.toFixed(2)}</span>
            </button>

            <button class="odd-button" data-odd-type="FORA" onclick="window.selecionarCotacao(${p.id_partida}, 'FORA', ${cotacoes.FORA}, '${p.time_casa} vs ${p.time_fora}', '${p.time_fora}')" ${desabilitarBotoes ? 'disabled' : ''}>
              <span class="odd-label">Fora (2)</span>
              <span class="odd-val">${cotacoes.FORA.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Ao clicar numa cotação, monta a estrutura do cupom e navega para betslip.html.
 */
export function selecionarCotacao(idPartida, selecao, cotacao, tituloPartida, nomePalpite) {
  const cupom = {
    matchId: idPartida,
    idPartida: idPartida,
    mercadoId: "VENCEDOR_1X2",
    selecao: selecao,
    odd: cotacao,
    matchTitle: tituloPartida,
    pickName: nomePalpite
  };

  salvarCupomSelecionado(cupom);
  window.location.href = `betslip.html?matchId=${idPartida}`;
}

/**
 * Filtra a exibição das partidas por esporte (Futebol, Basquete ou Todos).
 */
export function filtrarPorEsporte(modalidade, elementoBotao) {
  EstadoApp.filtroEsporteAtual = modalidade;
  const botoes = document.querySelectorAll(".chip-btn");
  botoes.forEach(b => b.classList.remove("active"));
  if (elementoBotao) elementoBotao.classList.add("active");
  renderizarPaginaLobby();
}

/**
 * [RF-02] Atualiza os valores visuais e dispara as animações verde (alta) e vermelha (baixa).
 */
export function aplicarAtualizacaoCotacoesNaInterface(idPartida, cotacoes, direcoes, minuto, placar) {
  const cardPartida = document.querySelector(`[data-match-id="${idPartida}"]`);
  if (!cardPartida) return;

  const elementoMinuto = cardPartida.querySelector(".match-minute");
  if (elementoMinuto && minuto) elementoMinuto.innerText = `${minuto}'`;

  if (placar) {
    const elementoPlacar = cardPartida.querySelector(".match-score-text");
    if (elementoPlacar) elementoPlacar.innerText = `${placar.casa} - ${placar.fora}`;
  }

  const mercado1x2 = cotacoes["VENCEDOR_1X2"];
  if (!mercado1x2) return;

  const botoesOdds = cardPartida.querySelectorAll(".odd-button");
  botoesOdds.forEach(btn => {
    const tipo = btn.getAttribute("data-odd-type");
    if (tipo && mercado1x2[tipo]) {
      const elementoValor = btn.querySelector(".odd-val");
      const novoValor = mercado1x2[tipo].toFixed(2);

      if (elementoValor && elementoValor.innerText !== novoValor) {
        elementoValor.innerText = novoValor;

        // Dispara animação visual CSS
        btn.classList.remove("odd-up", "odd-down");
        void btn.offsetWidth; // Reflow para reiniciar efeito de transição

        const sentido = direcoes ? direcoes[tipo] : "SAME";
        if (sentido === "UP") {
          btn.classList.add("odd-up");
        } else if (sentido === "DOWN") {
          btn.classList.add("odd-down");
        }
      }
    }
  });
}

/**
 * [RF-06 e RNF-01] Trava ou destrava visualmente os botões de cotação da partida.
 */
export function bloquearCotacoesPartida(idPartida, estaBloqueado) {
  const card = document.querySelector(`[data-match-id="${idPartida}"]`);
  if (!card) return;

  const botoes = card.querySelectorAll(".odd-button");
  botoes.forEach(btn => {
    btn.disabled = estaBloqueado;
  });

  if (estaBloqueado) {
    card.classList.add("suspended");
  } else {
    card.classList.remove("suspended");
  }
}

// Aliases para compatibilidade retroativa
export const renderLobbyPage = renderizarPaginaLobby;
export const selectOdd = selecionarCotacao;
export const filterSport = filtrarPorEsporte;
export const applyOddsUpdateUI = aplicarAtualizacaoCotacoesNaInterface;
export const lockMatchOdds = bloquearCotacoesPartida;
