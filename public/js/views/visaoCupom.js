
import { EstadoApp } from "../state/estadoAplicacao.js";
import { salvarCupomSelecionado } from "../state/sessao.js";
import { EVENTOS_WS } from "../config/eventos.js";

/**
 * Renderiza o painel esquerdo de estatísticas da partida e a barra lateral do cupom.
 */
export function renderizarPaginaCupom() {
  const parametrosUrl = new URLSearchParams(window.location.search);
  const idPartida = Number(parametrosUrl.get("matchId")) || (EstadoApp.cupomSelecionado ? EstadoApp.cupomSelecionado.matchId : 15);
  const partida = EstadoApp.partidas.get(idPartida) || EstadoApp.partidas.get(15);

  if (partida) {
    const ehBasquete = (partida.modalidade_esportiva === "BASQUETE");
    const elementoTitulo = document.getElementById("detail-match-title");
    if (elementoTitulo) {
      const statusSuffix = partida.status_partida === "ENCERRADA" ? ` - 🏁 ENCERRADA (${partida.minuto_jogo}')` : ` (${partida.minuto_jogo} min)`;
      elementoTitulo.innerText = `${partida.time_casa} ${partida.placar_casa} x ${partida.placar_fora} ${partida.time_fora}${statusSuffix}`;
    }

    const estatisticas = partida.estatisticas || { posseCasa: 50, posseFora: 50, chutesCasa: 0, chutesFora: 0, escanteiosCasa: 0, escanteiosFora: 0 };

    // Customiza rótulos de acordo com a modalidade esportiva (Futebol vs Basquete)
    const label1 = document.getElementById("stat-label-1");
    const label2 = document.getElementById("stat-label-2");
    const label3 = document.getElementById("stat-label-3");

    if (ehBasquete) {
      if (label1) label1.innerText = "Posse de Bola (Eficiência)";
      if (label2) label2.innerText = "Cestas Convertidas (FGM)";
      if (label3) label3.innerText = "Cestas de 3 Pontos (3PT)";
    } else {
      if (label1) label1.innerText = "Posse de Bola";
      if (label2) label2.innerText = "Chutes a Gol";
      if (label3) label3.innerText = "Escanteios";
    }

    // Barras de estatísticas comparativas
    const posseTxt = document.getElementById("stat-posse-txt");
    if (posseTxt) posseTxt.innerText = `${partida.time_casa} ${estatisticas.posseCasa}% vs ${estatisticas.posseFora}% ${partida.time_fora}`;
    const posseBar = document.getElementById("stat-posse-bar");
    if (posseBar) posseBar.style.width = `${estatisticas.posseCasa}%`;

    const chutesTxt = document.getElementById("stat-chutes-txt");
    if (chutesTxt) chutesTxt.innerText = `${estatisticas.chutesCasa} vs ${estatisticas.chutesFora}`;
    const chutesBar = document.getElementById("stat-chutes-bar");
    if (chutesBar) chutesBar.style.width = `${(estatisticas.chutesCasa / (estatisticas.chutesCasa + estatisticas.chutesFora || 1)) * 100}%`;

    const escTxt = document.getElementById("stat-esc-txt");
    const valCasa3 = ehBasquete ? (estatisticas.cestas3Casa || 0) : estatisticas.escanteiosCasa;
    const valFora3 = ehBasquete ? (estatisticas.cestas3Fora || 0) : estatisticas.escanteiosFora;
    if (escTxt) escTxt.innerText = `${valCasa3} vs ${valFora3}`;
    const escBar = document.getElementById("stat-esc-bar");
    if (escBar) escBar.style.width = `${(valCasa3 / (valCasa3 + valFora3 || 1)) * 100}%`;

    // Live Ticker de lances com suporte a cestas de basquete
    const listaTicker = document.getElementById("ticker-feed-list");
    if (listaTicker && partida.timeline) {
      listaTicker.innerHTML = partida.timeline.map(item => `
        <li class="ticker-item ${item.tipo === 'GOAL' ? 'goal' : item.tipo === 'BASKET' ? 'goal' : item.tipo.includes('CARD') ? 'card' : ''}">
          <span>${item.minuto}'</span>
          <span>${item.texto}</span>
        </li>
      `).join("");
    }
  }

  renderizarBarraLateralCupom();
}

/**
 * Renderiza o cupom de apostas lateral (Bet Slip).
 */
export function renderizarBarraLateralCupom() {
  const container = document.getElementById("slip-content-wrapper");
  if (!container) return;

  const cupom = EstadoApp.cupomSelecionado;
  if (!cupom) {
    container.innerHTML = `
      <div class="slip-empty-state">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>Nenhuma seleção no momento.</p>
        <a href="index.html" class="btn-header" style="margin-top: 12px; display: inline-flex;">Escolher Odd no Lobby</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="slip-selection-card">
      <div class="slip-sel-header">
        <span class="slip-match-name">${cupom.matchTitle}</span>
        <button class="btn-remove-selection" onclick="window.removerSelecaoCupom()" title="Remover Palpite">🗑️</button>
      </div>
      <div class="slip-market-info">
        <span class="slip-market-pick">${cupom.pickName} (Vencedor)</span>
        <span class="slip-odd-highlight" id="slip-display-odd">${cupom.odd.toFixed(2)}</span>
      </div>
      <div id="slip-odd-alert" class="odd-changed-alert">
        Odd alterada para <strong id="new-odd-val"></strong>. Aceitar nova cotação?
      </div>
    </div>

    <div class="stake-input-group">
      <label>Valor da Aposta (R$)</label>
      <div class="input-money-wrapper">
        <span class="input-currency-prefix">R$</span>
        <input type="number" id="stake-input" class="input-money" value="20.00" step="5" min="1" max="${EstadoApp.saldo}" oninput="window.calcularRetornoPotencial()">
      </div>
      <div class="quick-stakes-row">
        <button class="btn-quick-stake" onclick="window.definirValorRapido(10)">+10</button>
        <button class="btn-quick-stake" onclick="window.definirValorRapido(20)">+20</button>
        <button class="btn-quick-stake" onclick="window.definirValorRapido(50)">+50</button>
        <button class="btn-quick-stake" onclick="window.definirValorRapido(${EstadoApp.saldo})">MAX</button>
      </div>
    </div>

    <div class="potential-payout-box">
      <span class="payout-label">Retorno Potencial:</span>
      <span class="payout-value" id="potential-payout-display">R$ 0,00</span>
    </div>

    <div id="insufficient-funds-alert" class="insufficient-funds-msg">
      Saldo insuficiente — Faça um depósito fictício.
    </div>

    <button id="btn-submit-bet" class="btn-confirm-bet" onclick="window.enviarAposta()">
      <span>Confirmar Aposta [WS]</span>
    </button>
  `;

  calcularRetornoPotencial();
}

/**
 * Remove o palpite atual do cupom.
 */
export function removerSelecaoCupom() {
  salvarCupomSelecionado(null);
  renderizarBarraLateralCupom();
}

/**
 * Atribui valor rápido de aposta ao input (+10, +20, +50, MAX).
 */
export function definirValorRapido(valor) {
  const input = document.getElementById("stake-input");
  if (input) {
    input.value = Number(valor).toFixed(2);
    calcularRetornoPotencial();
  }
}

/**
 * [RF-03 e RNF-02] Calcula instantaneamente Retorno = Valor × Odd e valida saldo.
 */
export function calcularRetornoPotencial() {
  const input = document.getElementById("stake-input");
  const display = document.getElementById("potential-payout-display");
  const btn = document.getElementById("btn-submit-bet");
  const alertFunds = document.getElementById("insufficient-funds-alert");

  if (!input || !display || !EstadoApp.cupomSelecionado) return;

  const quantia = parseFloat(input.value) || 0;
  const odd = EstadoApp.cupomSelecionado.odd;
  const retorno = quantia * odd;

  display.innerText = `R$ ${retorno.toFixed(2).replace(".", ",")}`;

  // [RNF-02] Validação estrita de saldo não negativo
  if (quantia > EstadoApp.saldo || quantia <= 0) {
    if (btn) btn.disabled = true;
    if (alertFunds) alertFunds.classList.add("visible");
  } else {
    if (btn) btn.disabled = false;
    if (alertFunds) alertFunds.classList.remove("visible");
  }
}

/**
 * Exibe notificação de alteração de cotação dentro do cupom antes do envio.
 */
export function exibirAlteracaoCotacaoNoCupom(novaOdd) {
  const alertEl = document.getElementById("slip-odd-alert");
  const newOddVal = document.getElementById("new-odd-val");
  const oddHighlight = document.getElementById("slip-display-odd");

  if (alertEl && newOddVal) {
    newOddVal.innerText = novaOdd.toFixed(2);
    alertEl.classList.add("visible");
  }
  if (oddHighlight) oddHighlight.innerText = novaOdd.toFixed(2);
  if (EstadoApp.cupomSelecionado) {
    EstadoApp.cupomSelecionado.odd = novaOdd;
    calcularRetornoPotencial();
  }
}

/**
 * [RF-03] Transmite o frame PLACE_BET via WebSocket.
 */
export function enviarAposta() {
  if (!EstadoApp.ws || EstadoApp.ws.readyState !== WebSocket.OPEN) {
    alert("Erro: Conexão WebSocket não disponível. Aguarde a reconexão.");
    return;
  }

  const input = document.getElementById("stake-input");
  const quantia = parseFloat(input.value);

  if (isNaN(quantia) || quantia <= 0) {
    alert("Insira um valor numérico válido maior que zero.");
    return;
  }

  if (quantia > EstadoApp.saldo) {
    alert("Saldo insuficiente na carteira fictícia!");
    return;
  }

  const cupom = EstadoApp.cupomSelecionado;
  if (!cupom) return;

  const payload = {
    type: EVENTOS_WS.PLACE_BET,
    matchId: cupom.matchId,
    mercadoId: cupom.mercadoId,
    selecao: cupom.selecao,
    odd: cupom.odd,
    valor: quantia
  };

  console.log("📤 [ENVIANDO PLACE_BET]", payload);
  EstadoApp.ws.send(JSON.stringify(payload));

  const btn = document.getElementById("btn-submit-bet");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Processando via WebSocket...";
  }
}

/**
 * Exibe o modal de confirmação com o comprovante único #Ticket ID.
 */
export function exibirModalConfirmacaoAposta(numeroBilhete, aposta) {
  const modal = document.getElementById("bet-confirmed-modal");
  if (!modal) return;

  document.getElementById("modal-ticket-id").innerText = `#${numeroBilhete}`;
  document.getElementById("modal-match-title").innerText = `${aposta.time_casa} vs ${aposta.time_fora}`;
  document.getElementById("modal-pick-info").innerText = `${aposta.selecao} (Odd: ${aposta.odd_momento.toFixed(2)})`;
  document.getElementById("modal-stake-val").innerText = `R$ ${aposta.valor_apostado.toFixed(2)}`;
  document.getElementById("modal-payout-val").innerText = `R$ ${aposta.retorno_potencial.toFixed(2)}`;

  modal.classList.add("open");
}

/**
 * Fecha o modal de comprovante e navega para a Tela 3 (Carteira & Cash Out).
 */
export function fecharModalEIrParaCarteira() {
  const modal = document.getElementById("bet-confirmed-modal");
  if (modal) modal.classList.remove("open");
  window.location.href = "wallet.html";
}
