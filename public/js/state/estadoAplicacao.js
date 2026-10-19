
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
