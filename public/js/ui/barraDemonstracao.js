
import { EstadoApp } from "../state/estadoAplicacao.js";
import { atualizarNomeApostador } from "../state/sessao.js";
import { EVENTOS_WS } from "../config/eventos.js";

/**
 * Força a ocorrência de um gol para testar suspensão de mercado e trava do Cash Out.
 */
export function demonstracaoForcarGol() {
  if (!EstadoApp.ws) return;
  EstadoApp.ws.send(JSON.stringify({
    type: EVENTOS_WS.DEMO_TRIGGER_GOAL,
    matchId: 15,
    team: "CASA"
  }));
}

/**
 * Restaura o saldo fictício da carteira para o valor inicial de R$ 100,00.
 */
export function demonstracaoResetarSaldo() {
  if (!EstadoApp.ws) return;
  EstadoApp.ws.send(JSON.stringify({
    type: EVENTOS_WS.RESET_BALANCE
  }));
}

/**
 * Reinicia as partidas de demonstração (todas as partidas voltam a ficar AO VIVO no minuto 10).
 */
export function demonstracaoReiniciarJogo(idPartida = "TODAS") {
  if (!EstadoApp.ws) return;
  EstadoApp.ws.send(JSON.stringify({
    type: EVENTOS_WS.DEMO_RESET_MATCH,
    matchId: idPartida
  }));
}

/**
 * Finaliza todas as partidas em andamento aos 90 minutos para testar a liquidação [RF-07].
 */
export function demonstracaoFinalizarJogos() {
  if (!EstadoApp.ws) return;
  EstadoApp.ws.send(JSON.stringify({
    type: EVENTOS_WS.DEMO_FINISH_MATCHES
  }));
}

/**
 * Abre prompt para alterar o nome do apostador e atualiza instantaneamente no servidor e no ranking.
 */
export function demonstracaoAlterarNome() {
  const nomeAtual = EstadoApp.nomeApostador || localStorage.getItem("probabet_userName") || "";
  const novoNome = prompt("Digite seu nome de apostador para o Ranking da Turma:", nomeAtual);
  if (novoNome && novoNome.trim()) {
    const nomeLimpo = novoNome.trim();
    atualizarNomeApostador(nomeLimpo);

    // Atualiza imediatamente na interface local
    const elementoNome = document.getElementById("header-username");
    if (elementoNome) elementoNome.innerText = nomeLimpo;

    // Envia para o backend para atualizar o banco de dados e refletir no ranking em tempo real
    if (EstadoApp.ws && EstadoApp.ws.readyState === WebSocket.OPEN) {
      EstadoApp.ws.send(JSON.stringify({
        type: EVENTOS_WS.UPDATE_USER_NAME,
        userName: nomeLimpo
      }));
    } else {
      window.location.reload();
    }
  }
}
