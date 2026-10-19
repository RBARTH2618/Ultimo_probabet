/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/audio/efeitosSonoros.js - Sintetizador de Áudio (Web Audio API)
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o módulo gerador de efeitos sonoros sintetizados em tempo real no navegador.
 * 
 * ⚙️ O QUE ELE FAZ?
 * Utiliza a Web Audio API nativa do HTML5 (sem arquivos MP3 externos pesados) para sintetizar:
 *  - Apito curto de árbitro ("whistle"): Para faltas e início de jogo.
 *  - Som festivo ascendente ("goal"): Quando ocorre um gol ao vivo [RF-06].
 *  - Dois bipes agudos de sucesso ("cashout" ou "win"): Ao confirmar Cash Out [RF-05] ou vencer [RF-07].
 *  - Som grave descendente ("error"): Em caso de rejeição por trava atômica [RNF-01].
 * 
 * 📍 ONDE É USADO?
 * Disparado pelo despachante de eventos (manipuladorEventos.js) ao receber notificações do servidor.
 * ==============================================================================
 */

import { EstadoApp } from "../state/estadoAplicacao.js";

/**
 * Sintetiza e toca um efeito sonoro de acordo com o tipo solicitado.
 * @param {string} tipo - "goal", "cashout", "win", "error", "whistle"
 */
export function tocarEfeitoSonoro(tipo = "whistle") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!EstadoApp.contextoAudio) EstadoApp.contextoAudio = new AudioCtx();

    const ctx = EstadoApp.contextoAudio;
    if (ctx.state === "suspended") ctx.resume();

    const oscilador = ctx.createOscillator();
    const ganho = ctx.createGain();
    oscilador.connect(ganho);
    ganho.connect(ctx.destination);

    const agora = ctx.currentTime;

    if (tipo === "goal") {
      // Tom festivo ascendente de comemoração
      oscilador.type = "triangle";
      oscilador.frequency.setValueAtTime(440, agora);
      oscilador.frequency.exponentialRampToValueAtTime(880, agora + 0.3);
      ganho.gain.setValueAtTime(0.3, agora);
      ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.6);
      oscilador.start(agora);
      oscilador.stop(agora + 0.6);
    } else if (tipo === "basket") {
      // Efeito sonoro harmônico de cesta de basquete (Swish / Sucesso)
      oscilador.type = "sine";
      oscilador.frequency.setValueAtTime(659.25, agora); // Mi5
      oscilador.frequency.exponentialRampToValueAtTime(987.77, agora + 0.12); // Si5
      ganho.gain.setValueAtTime(0.18, agora);
      ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.3);
      oscilador.start(agora);
      oscilador.stop(agora + 0.3);
    } else if (tipo === "cashout" || tipo === "win") {
      // Dois bipes agudos harmoniosos de ganho financeiro
      oscilador.type = "sine";
      oscilador.frequency.setValueAtTime(587.33, agora);
      oscilador.frequency.setValueAtTime(880, agora + 0.15);
      ganho.gain.setValueAtTime(0.25, agora);
      ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.4);
      oscilador.start(agora);
      oscilador.stop(agora + 0.4);
    } else if (tipo === "error") {
      // Som grave descendente de rejeição
      oscilador.type = "sawtooth";
      oscilador.frequency.setValueAtTime(220, agora);
      oscilador.frequency.exponentialRampToValueAtTime(110, agora + 0.3);
      ganho.gain.setValueAtTime(0.2, agora);
      ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.3);
      oscilador.start(agora);
      oscilador.stop(agora + 0.3);
    } else {
      // Apito curto e agudo de árbitro esportivo
      oscilador.type = "square";
      oscilador.frequency.setValueAtTime(1200, agora);
      ganho.gain.setValueAtTime(0.15, agora);
      ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.2);
      oscilador.start(agora);
      oscilador.stop(agora + 0.2);
    }
  } catch (e) {
    // Falha silenciosa caso o navegador proíba autoplay antes de uma interação do usuário
  }
}

// Alias de compatibilidade retroativa
export const playNotificationSound = tocarEfeitoSonoro;
