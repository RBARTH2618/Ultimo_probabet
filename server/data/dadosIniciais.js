/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: data/dadosIniciais.js - Carga Inicial de Dados de Demonstração (Seeds)
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o provedor de dados de exemplo (seed data) para quando o servidor é ligado.
 * 
 * ⚙️ O QUE ELE FAZ?
 * Cria partidas esportivas ao vivo (Futebol e Basquete) com placares, estatísticas,
 * cotações (odds) iniciais e apostadores fictícios para preencher o ranking da turma.
 * 
 * 📍 ONDE É USADO?
 * Utilizado pelo banco de dados em memória (bancoDados.js) na inicialização do sistema.
 * ==============================================================================
 */

/**
 * Retorna a lista de partidas esportivas simuladas para a demonstração.
 * Segue a estrutura da entidade PARTIDA_ESPORTIVA do diagrama do professor.
 */
function obterPartidasIniciais() {
  return [
    {
      id_partida: 15,
      modalidade_esportiva: "FUTEBOL",
      campeonato: "Brasileirão Série A",
      time_casa: "União FC",
      time_fora: "Rio FC",
      placar_casa: 0,
      placar_fora: 0,
      minuto_jogo: 0,
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
        { minuto: 1, tipo: "INFO", texto: "Partida iniciada no Estádio Olímpico" }
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
      minuto_jogo: 0,
      status_partida: "AO_VIVO",
      lock_motivo: null,
      lock_timestamp: 0,
      estatisticas: {
        posseCasa: 50,
        posseFora: 50,
        chutesCasa: 0,
        chutesFora: 0,
        escanteiosCasa: 0,
        escanteiosFora: 0
      },
      timeline: [
        { minuto: 1, tipo: "INFO", texto: "Início de jogo equilibrado no Maracanã" }
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
      placar_casa: 0,
      placar_fora: 0,
      minuto_jogo: 0,
      status_partida: "AO_VIVO",
      lock_motivo: null,
      lock_timestamp: 0,
      estatisticas: {
        posseCasa: 50,
        posseFora: 50,
        chutesCasa: 0,
        chutesFora: 0,
        cestas3Casa: 0,
        cestas3Fora: 0
      },
      timeline: [
        { minuto: 1, tipo: "INFO", texto: "Início do 1º Quarto no Crypto.com Arena (Los Angeles)" }
      ],
      odds: {
        "VENCEDOR_1X2": {
          CASA: 1.85,
          EMPATE: 15.00,
          FORA: 1.95,
          prevCasa: 1.85,
          prevEmpate: 15.00,
          prevFora: 1.95
        }
      }
    }
  ];
}

/**
 * Retorna os apostadores iniciais para ilustrar a tabela de Ranking [RF-08].
 */
function obterApostadoresIniciaisRanking() {
  return [
    { id: "seed-user-1", nome: "João Lucas (Mestre)", saldo: 340.50 },
    { id: "seed-user-2", nome: "Prof. Sergio Novak", saldo: 280.00 },
    { id: "seed-user-3", nome: "Mariana Tips", saldo: 195.20 },
    { id: "seed-user-4", nome: "Carlos Trader", saldo: 125.00 }
  ];
}

module.exports = {
  obterPartidasIniciais,
  obterApostadoresIniciaisRanking
};
