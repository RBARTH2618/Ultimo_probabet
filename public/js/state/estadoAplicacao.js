/**
 * ==============================================================================
 * PROBABET - Plataforma de Apostas Esportivas em Tempo Real (WebSocket)
 * Módulo: js/state/estadoAplicacao.js - Armazenamento de Estado Global do Cliente
 * ==============================================================================
 * 
 * 📖 O QUE É ESTE ARQUIVO?
 * É o "State Store" reativo da aplicação no navegador (equivalente a uma store global).
 * 
 * ⚙️ O QUE ELE FAZ?
 * Mantém na memória do navegador todas as variáveis de estado essenciais:
 *  - ws: Conexão ativa do WebSocket.
 *  - idApostador / nomeApostador: Identidade do usuário corrente.
 *  - saldo: Saldo financeiro em tempo real (R$ 100,00 inicial).
 *  - partidas: Mapa de partidas esportivas com cotações vivas.
 *  - apostasAtivas: Lista de cupons de aposta submetidos pelo apostador.
 *  - cupomSelecionado: A cotação clicada que está sendo configurada no Bet Slip.
 *  - filtroEsporteAtual: "TODOS", "FUTEBOL" ou "BASQUETE".
 * 
 * 📍 ONDE É USADO?
 * Importado por todas as visualizações (views), pelo cliente WS e pelo cabeçalho.
 * ==============================================================================
 */

class EstadoAplicacao {
  constructor() {
    this.ws = null;
    this.idApostador = null;
    this.nomeApostador = null;
    this.saldo = 100.00;
    this.partidas = new Map();
    this.apostasAtivas = [];
    this.cupomSelecionado = null;
    this.filtroEsporteAtual = "TODOS";
    this.contextoAudio = null;
  }

  // Getters e Setters de compatibilidade retroativa com nomes em inglês
  get userId() { return this.idApostador; }
  set userId(val) { this.idApostador = val; }

  get userName() { return this.nomeApostador; }
  set userName(val) { this.nomeApostador = val; }

  get balance() { return this.saldo; }
  set balance(val) { this.saldo = val; }

  get matches() { return this.partidas; }
  set matches(val) { this.partidas = val; }

  get activeBets() { return this.apostasAtivas; }
  set activeBets(val) { this.apostasAtivas = val; }

  get selectedSlip() { return this.cupomSelecionado; }
  set selectedSlip(val) { this.cupomSelecionado = val; }

  get currentSportFilter() { return this.filtroEsporteAtual; }
  set currentSportFilter(val) { this.filtroEsporteAtual = val; }

  get audioContext() { return this.contextoAudio; }
  set audioContext(val) { this.contextoAudio = val; }
}

export const EstadoApp = new EstadoAplicacao();
export const AppState = EstadoApp;
