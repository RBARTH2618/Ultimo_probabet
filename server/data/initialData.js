/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: data/initialData.js - Dados Iniciais de Demonstração (Seed Data)
 * Responsabilidade Única: Definir a carga inicial de partidas, cotações e ranking.
 * ==============================================================================
 */

function getInitialMatches() {
  return [
    {
      id_partida: 15,
      modalidade_esportiva: "FUTEBOL",
      campeonato: "Brasileirão Série A",
      time_casa: "União FC",
      time_fora: "Rio FC",
      placar_casa: 1,
      placar_fora: 0,
      minuto_jogo: 67,
      status_partida: "AO_VIVO",
      lock_motivo: null,
      lock_timestamp: 0,
      estatisticas: {
        posseCasa: 58,
        posseFora: 42,
        chutesCasa: 8,
        chutesFora: 2,
        escanteiosCasa: 5,
        escanteiosFora: 1
      },
      timeline: [
        { minuto: 62, tipo: "CARD_YELLOW", texto: "Cartão Amarelo para camisa 5 do Rio FC" },
        { minuto: 67, tipo: "GOAL", texto: "Gol do União FC! (Carlos Silva)" }
      ],
      odds: {
        "VENCEDOR_1X2": {
          CASA: 1.80,
          EMPATE: 3.10,
          FORA: 4.50,
          prevCasa: 1.80,
          prevEmpate: 3.10,
          prevFora: 4.50
        },
        "PROXIMO_GOL": {
          CASA: 1.75,
          NENHUM: 5.50,
          FORA: 2.30
        },
        "TOTAL_GOLS": {
          OVER_1_5: 1.45,
          UNDER_1_5: 2.65
        }
      }
    },
    {
      id_partida: 16,
      modalidade_esportiva: "FUTEBOL",
      campeonato: "Copa do Brasil",
      time_casa: "Flamengo",
      time_fora: "Santos",
      placar_casa: 0,
      placar_fora: 0,
      minuto_jogo: 12,
      status_partida: "AO_VIVO",
      lock_motivo: null,
      lock_timestamp: 0,
      estatisticas: {
        posseCasa: 62,
        posseFora: 38,
        chutesCasa: 4,
        chutesFora: 1,
        escanteiosCasa: 3,
        escanteiosFora: 0
      },
      timeline: [
        { minuto: 5, tipo: "INFO", texto: "Início de jogo equilibrado no Maracanã" }
      ],
      odds: {
        "VENCEDOR_1X2": {
          CASA: 1.45,
          EMPATE: 4.00,
          FORA: 6.50,
          prevCasa: 1.45,
          prevEmpate: 4.00,
          prevFora: 6.50
        },
        "PROXIMO_GOL": {
          CASA: 1.50,
          NENHUM: 7.00,
          FORA: 3.10
        },
        "TOTAL_GOLS": {
          OVER_1_5: 1.30,
          UNDER_1_5: 3.20
        }
      }
    },
    {
      id_partida: 17,
      modalidade_esportiva: "BASQUETE",
      campeonato: "NBA Temporada Regular",
      time_casa: "LA Lakers",
      time_fora: "GS Warriors",
      placar_casa: 84,
      placar_fora: 81,
      minuto_jogo: 36,
      status_partida: "AO_VIVO",
      lock_motivo: null,
      lock_timestamp: 0,
      estatisticas: {
        posseCasa: 51,
        posseFora: 49,
        chutesCasa: 32,
        chutesFora: 30,
        escanteiosCasa: 12,
        escanteiosFora: 14
      },
      timeline: [
        { minuto: 34, tipo: "INFO", texto: "Cesta de 3 pontos de Stephen Curry" }
      ],
      odds: {
        "VENCEDOR_1X2": {
          CASA: 1.70,
          EMPATE: 15.00,
          FORA: 2.15,
          prevCasa: 1.70,
          prevEmpate: 15.00,
          prevFora: 2.15
        }
      }
    }
  ];
}

function getInitialRankingUsers() {
  return [
    { id: "seed-user-1", nome: "João Lucas (Mestre)", saldo: 340.50 },
    { id: "seed-user-2", nome: "Prof. Sergio Novak", saldo: 280.00 },
    { id: "seed-user-3", nome: "Mariana Tips", saldo: 195.20 },
    { id: "seed-user-4", nome: "Carlos Trader", saldo: 125.00 }
  ];
}

module.exports = {
  getInitialMatches,
  getInitialRankingUsers
};
