/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/ui/barraDemonstracao.js - Controles da Barra de Demonstração Acadêmica
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o módulo que gerencia a barra de ferramentas didáticas flutuante no rodapé da tela.
 * 
 * ⚙️ O QUE ELE FAZ?
 * Permite ao apresentador do trabalho acadêmico (João Lucas):
 *  1. Forçar um Gol instantâneo na partida para provar ao professor que o mercado
 *     congela e que o Cash Out é bloqueado pela trava atômica [RNF-01].
 *  2. Reiniciar a partida 15 (minuto 10, placar 0x0) para repetir a simulação.
 *  3. Restaurar o saldo da carteira para R$ 100,00 caso tenha zerado nas apostas.
 *  4. Alterar o nome do apostador para testar múltiplos usuários disputando o ranking [RF-08].
 * 
 * 📍 ONDE É USADO?
 * Disparado pelos botões da barra didática presentes nas 3 telas do protótipo.
 * ==============================================================================
 */

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
