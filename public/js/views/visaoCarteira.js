
import { EstadoApp } from "../state/estadoAplicacao.js";
import { EVENTOS_WS } from "../config/eventos.js";

/**
 * Renderiza o saldo da carteira, os bilhetes ativos e o histórico.
 */
export function renderizarPaginaCarteira() {
  const elementoHeroSaldo = document.getElementById("wallet-hero-balance-val");
  if (elementoHeroSaldo) {
    elementoHeroSaldo.innerText = `R$ ${EstadoApp.saldo.toFixed(2).replace(".", ",")}`;
  }

  const container = document.getElementById("wallet-active-bets");
  if (!container) return;

  const abaAtiva = document.querySelector(".wallet-tab-btn.active")?.dataset.tab || "ativas";

  let bilhetesFiltrados = [];
  if (abaAtiva === "ativas") {
    bilhetesFiltrados = EstadoApp.apostasAtivas.filter(b => b.status_aposta === "ATIVA");
  } else {
    bilhetesFiltrados = EstadoApp.apostasAtivas.filter(b => b.status_aposta !== "ATIVA");
  }

  if (bilhetesFiltrados.length === 0) {
    container.innerHTML = `
      <div class="slip-empty-state">
        <p>Nenhuma aposta ${abaAtiva === 'ativas' ? 'ativa no momento' : 'no histórico'}.</p>
        <a href="index.html" class="btn-header" style="margin-top: 12px; display: inline-flex;">Ir para o Lobby de Jogos</a>
      </div>
    `;
    return;
  }

  container.innerHTML = bilhetesFiltrados.map(b => {
    const isAtiva = (b.status_aposta === "ATIVA");
    const valorCashOut = b.currentCashOut ? b.currentCashOut.toFixed(2) : (b.valor_apostado * 0.95).toFixed(2);

    return `
      <div class="bet-ticket-card" id="ticket-card-${b.id_aposta}">
        <div style="flex: 1;">
          <div class="ticket-meta">
            <span class="ticket-id-tag">BILHETE #${b.id_aposta}</span>
            <span class="ticket-status-badge status-${b.status_aposta.toLowerCase()}">${b.status_aposta}</span>
          </div>
          <div class="ticket-match-title">${b.time_casa} vs ${b.time_fora}</div>
          <div class="ticket-details-row">
            <span>Seleção: <strong>${b.selecao}</strong></span>
            <span>Odd: <strong>${b.odd_momento.toFixed(2)}</strong></span>
            <span>Apostado: <strong>R$ ${b.valor_apostado.toFixed(2)}</strong></span>
            <span>Retorno Pot.: <strong>R$ ${b.retorno_potencial.toFixed(2)}</strong></span>
          </div>
        </div>

        <div>
          ${isAtiva ? `
            <button class="btn-cashout" onclick="window.solicitarCashOut(${b.id_aposta}, ${b.id_partida}, ${valorCashOut})">
              <span>⚡ REALIZAR CASH OUT: R$ ${valorCashOut}</span>
            </button>
          ` : `
            <div style="text-align: right; font-weight: 700;">
              ${b.status_aposta === 'GREEN' ? `<span style="color: var(--accent-green);">+ R$ ${b.retorno_potencial.toFixed(2)} [GREEN]</span>` : ''}
              ${b.status_aposta === 'RED' ? `<span style="color: var(--accent-red);">- R$ ${b.valor_apostado.toFixed(2)} [RED]</span>` : ''}
              ${b.status_aposta === 'CASH_OUT' ? `<span style="color: var(--accent-orange);">+ R$ ${(b.valor_resgatado || valorCashOut)} [CASH OUT]</span>` : ''}
            </div>
          `}
        </div>
      </div>
    `;
  }).join("");
}

/**
 * [RF-05] Envia a solicitação de Cash Out via WebSocket.
 */
export function solicitarCashOut(idBilhete, idPartida, valorSolicitado) {
  if (!EstadoApp.ws || EstadoApp.ws.readyState !== WebSocket.OPEN) {
    alert("Erro: Conexão WebSocket não disponível.");
    return;
  }

  const payload = {
    type: EVENTOS_WS.CASH_OUT,
    betId: Number(idBilhete),
    matchId: Number(idPartida),
    requestedValue: parseFloat(valorSolicitado)
  };

  console.log("📤 [ENVIANDO CASH_OUT]", payload);
  EstadoApp.ws.send(JSON.stringify(payload));
}

/**
 * Alterna entre as abas "Apostas em Andamento" e "Histórico de Encerradas".
 */
export function trocarAbaCarteira(nomeAba, elementoBotao) {
  const botoes = document.querySelectorAll(".wallet-tab-btn");
  botoes.forEach(b => b.classList.remove("active"));
  if (elementoBotao) elementoBotao.classList.add("active");
  renderizarPaginaCarteira();
}

/**
 * [RF-08] Renderiza a tabela de classificação dos apostadores em tempo real.
 */
export function renderizarTabelaRanking(listaRanking) {
  const corpoTabela = document.getElementById("ranking-table-body");
  if (!corpoTabela) return;

  corpoTabela.innerHTML = listaRanking.map((usuario, indice) => {
    const souEu = (usuario.id === EstadoApp.idApostador);
    const posicao = indice + 1;
    const medalha = posicao === 1 ? "🥇 " : posicao === 2 ? "🥈 " : posicao === 3 ? "🥉 " : `#${posicao} `;

    return `
      <tr class="${souEu ? 'current-user-row' : ''}">
        <td style="font-weight: 700; color: ${posicao <= 3 ? '#ffb800' : 'var(--text-muted)'};">${medalha}</td>
        <td>
          <span style="font-weight: ${souEu ? '700' : '500'};">${usuario.nome}</span>
          ${souEu ? `<span class="badge-you">Você</span>` : ''}
        </td>
        <td style="text-align: right; font-weight: 700; color: var(--accent-green);">
          R$ ${usuario.saldo.toFixed(2).replace(".", ",")}
        </td>
      </tr>
    `;
  }).join("");
}
