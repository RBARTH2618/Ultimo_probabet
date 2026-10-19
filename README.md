# ⚽ PROBABET - Plataforma de Apostas em Tempo Real com WebSocket (Ws2)

> **Trabalho Acadêmico de Desenvolvimento de Software para Web**  
> **Instituição:** Universidade de Rio Verde (UniRV)  
> **Professor:** Me. Sergio Souza Novak  
> **Desenvolvedores:** João Lucas & Antigravity  

---

## 📌 1. Visão Geral do Projeto

O **PROBABET** é um ecossistema completo de apostas esportivas ao vivo (*in-play*) construído com foco em **baixa latência (< 100 ms)** e alta fidelidade funcional. Utiliza uma conexão **WebSocket Full-Duplex bidirecional** sobre uma única conexão TCP persistente, eliminando o overhead de cabeçalhos e a latência de requisições HTTP REST convencionais (*polling*).

---

## 📂 2. Estrutura 100% Modular do Projeto (Single Responsibility Principle)

O sistema foi inteiramente decomposto para que cada módulo possua **uma única responsabilidade bem delimitada (SRP - Clean Architecture)**, eliminando monólitos tanto no backend quanto no frontend:

```
/PROBABET
  ├── /public (Frontend Modular - ES6 Modules & CSS3)
  │     ├── index.html                  (Tela 1: Lobby de Odds ao Vivo e Filtros por Modalidade)
  │     ├── betslip.html                (Tela 2: Detalhes da Partida, Estatísticas e Bet Slip)
  │     ├── wallet.html                 (Tela 3: Carteira, Encerramento Antecipado Cash Out e Histórico)
  │     ├── styles.css                  (Master Stylesheet que importa os módulos de estilo)
  │     ├── /css
  │     │    ├── variables.css          (Paleta de cores HSL, tipografia, resets e wrapper base)
  │     │    ├── header.css             (Cabeçalho global, badge WS, saldo e abas de navegação)
  │     │    ├── lobby.css              (Filtros chips, cards de partidas e animação de odds)
  │     │    ├── betslip.css            (Layout split, estatísticas comparativas, ticker e cupom)
  │     │    ├── wallet.css             (Card hero da carteira, abas ativas/histórico e cash out)
  │     │    └── components.css         (Banner de gol, modais #Ticket ID, ranking e toolbar demo)
  │     └── /js
  │          ├── /config/events.js      (Dicionário central de eventos WebSocket espelhado do backend)
  │          ├── /state/appState.js     (Armazenamento de estado global reativo do cliente)
  │          ├── /state/session.js      (Persistência no localStorage e identificação do apostador)
  │          ├── /net/wsClient.js       (Conexão WebSocket, reconexão automática com backoff e envio)
  │          ├── /net/eventHandler.js   (Roteamento e despacho dos eventos recebidos do servidor)
  │          ├── /audio/soundEffects.js (Síntese Web Audio API: apito, gol, cashout e alertas)
  │          ├── /ui/headerUi.js        (Animação de pulso do saldo, badges e alertas visuais)
  │          ├── /ui/demoBar.js         (Controles da barra de demonstração acadêmica flutuante)
  │          ├── /views/lobbyView.js    (Renderização do Lobby, filtros e flutuação de odds com setas)
  │          ├── /views/betslipView.js  (Renderização da Tela 2, cálculo de retorno e submissão)
  │          ├── /views/walletView.js   (Renderização da Carteira, histórico e botões de cash out)
  │          └── main.js                (Ponto de entrada que orquestra os módulos do frontend)
  ├── /server (Backend Modular - Node.js em Camadas)
  │     ├── /config/constants.js        (Constantes de configuração, status de partida e eventos WS)
  │     ├── /data
  │     │    ├── initialData.js         (Carga de partidas mock e apostadores para o ranking)
  │     │    └── db.js                  (Repositório singleton de banco de dados em memória)
  │     ├── /services
  │     │    ├── userService.js         (Criação, controle de saldo e ranking de apostadores)
  │     │    ├── matchService.js        (Consulta de partidas, suspensão de mercado e reset)
  │     │    ├── bettingService.js      (Validação de saldo não negativo [RNF-02] e bilhetes [RF-03])
  │     │    ├── cashoutService.js      (Recálculo [RF-04] e execução atômica anti-race condition [RF-05, RNF-01])
  │     │    └── settlementService.js   (Liquidação de bilhetes aos 90 min com GREEN/RED [RF-07])
  │     ├── /engine
  │     │    ├── oddsCalculator.js      (Cálculo estocástico e direcional UP/DOWN de cotações [RF-02])
  │     │    └── matchEngine.js         (Orquestrador do loop de tempo real, lances e finalização)
  │     ├── /ws
  │     │    ├── wsGateway.js           (Servidor WebSocket, registro de conexões, broadcast e unicast)
  │     │    └── wsRouter.js            (Roteamento de mensagens do cliente para os serviços de domínio)
  │     ├── server.js                   (Ponto de entrada: servidor HTTP Express e Gateway WebSocket)
  │     ├── engine.js                   (Fachada de compatibilidade reexportando engine/matchEngine.js)
  │     └── state.js                    (Fachada de compatibilidade reexportando os services)
  ├── package.json                      (Dependências mínimas: express e ws)
  └── README.md                         (Guia completo de execução e roteiro de apresentação)
```

---

## 🚀 3. Como Executar o Projeto

### Pré-requisitos:
- **Node.js** (v18 ou superior)
- **NPM** instalado

### Passo a Passo:

1. **Abra o terminal (PowerShell ou Bash) na pasta raiz do projeto:**
   ```bash
   cd "c:\Users\arodr\OneDrive\Área de Trabalho\PROBABET"
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor:**
   ```bash
   npm start
   ```
   *(Ou diretamente com: `node server/server.js`)*

4. **Acesse as páginas no navegador:**
   - **Lobby de Apostas (Tela 1):** [http://localhost:3000/](http://localhost:3000/)
   - **Detalhes & Bet Slip (Tela 2):** [http://localhost:3000/betslip.html](http://localhost:3000/betslip.html)
   - **Carteira & Cash Out (Tela 3):** [http://localhost:3000/wallet.html](http://localhost:3000/wallet.html)

---

## ⚙️ 4. Requisitos Implementados e Eventos JSON

| Código | Requisito | Descrição Técnica & Payload |
|---|---|---|
| **[RF-01]** | **Handshake & Saldo Inicial** | Ao conectar via WebSocket, o servidor vincula sessão com saldo inicial de **R$ 100,00** e responde com `HANDSHAKE_SUCCESS`. |
| **[RF-02]** | **Transmissão Dinâmica de Odds** | Loop contínuo a cada **2.5 segundos** disparando broadcast `ODDS_UPDATE`. No frontend, as odds piscam em **verde (↑)** se subiram ou **vermelho (↓)** se caíram. |
| **[RF-03]** | **Submissão & Validação de Aposta** | Envio do frame `PLACE_BET`: `{"type": "PLACE_BET", "matchId": 15, "mercadoId": "VENCEDOR_1X2", "selecao": "CASA", "odd": 1.80, "valor": 20.00}`. Validação atômica e emissão do comprovante `BET_CONFIRMED` com `#Ticket ID`. |
| **[RF-04]** | **Cálculo de Cash Out em Tempo Real** | O algoritmo em `state.js` reavalia continuamente o valor de resgate baseado no tempo decorrido, placar atual e margem da casa. |
| **[RF-05]** | **Processamento de Cash Out** | Envio de `CASH_OUT`: `{"type": "CASH_OUT", "betId": 1032, "matchId": 15, "requestedValue": 29.50}`. Crédito imediato no saldo e emissão de `CASH_OUT_CONFIRMED`. |
| **[RF-06]** | **Eventos de Jogo (GOL / Cartão)** | Broadcast `GAME_EVENT` com tipo `"GOAL"`. Congela os mercados afetados com cadeado 🔒 (`Mercado Temporariamente Suspenso`), dispara pop-up e apito sonoro sintetizado (Web Audio API). |
| **[RF-07]** | **Liquidação Automática** | Aos 90 minutos de jogo, o servidor avalia os bilhetes abertos, paga os vencedores (`GREEN`) com `Valor * Odd`, liquida os perdedores (`RED`) e emite `BALANCE_UPDATE`. |
| **[RF-08]** | **Ranking & Saldo Sincronizado** | Saldo exibido no topo de todas as telas em tempo real e tabela de classificação de apostadores da sessão. |
| **[RNF-01]** | **Prevenção de Race Condition** | Trava atômica no servidor: se um Cash Out for submetido durante a ocorrência de um Gol ou mercado suspenso, a transação é rejeitada com a mensagem: `[Proposta expirada — Placar alterado / Mercado temporariamente suspenso]`. |
| **[RNF-02]** | **Garantia de Saldo Não Negativo** | Verificação estrita de saldo e débito síncrono no mesmo ciclo do Event Loop, impedindo apostas maiores que a carteira disponível. |

---

## 🎤 5. Guia para Apresentação Oral ao Professor

Durante a apresentação com o **Prof. Me. Sergio Souza Novak**, vocês podem demonstrar o sistema seguindo este roteiro infalível:

1. **Abertura Conceitual (João Lucas):**
   - *"Professor, adotamos o WebSocket para viabilizar comunicação Full-Duplex bidirecional sobre uma única conexão TCP persistente. Ao contrário do modelo REST HTTP com polling, não há sobrecarga de cabeçalhos repetidos e as cotações chegam com latência inferior a 100 ms."*
2. **Demonstração do Lobby e Odds Vivas (RF-01 e RF-02):**
   - Abra [http://localhost:3000/](http://localhost:3000/).
   - Destaque o saldo inicial de **R$ 100,00** e a badge verde `Conectado (WS)`.
   - Mostre as odds oscilando a cada 2,5s piscando suavemente em **verde** ou **vermelho** com as setas `↑` e `↓`.
3. **Efetuar uma Aposta (RF-03 e RNF-02):**
   - Clique na odd da **União FC** (`Casa (1)`).
   - O sistema navega para a Tela 2 (`betslip.html`).
   - Mostre as barras de progresso ao vivo e o **Live Ticker** com lances do WebSocket.
   - Digite um valor (ex: R$ 20,00), mostre o cálculo instantâneo do Retorno Potencial (`R$ 36,00`).
   - Clique em **Confirmar Aposta [WS]**: exiba o modal com o comprovante único **#Ticket ID 1032**.
   - Mostre que o saldo foi debitado atomicamente para **R$ 80,00**.
4. **Demonstrar Cash Out e a Trava de Concorrência (RF-04, RF-05 e RNF-01):**
   - Acesse a Tela 3 (`wallet.html`).
   - Mostre o botão laranja de **Cash Out** oscilando dinamicamente em tempo real.
   - Use a barra inferior **Modo Didático**:
     - Clique em **"⚽ Forçar Gol (RF-06 / RNF-01)"**: observe a notificação na tela, o som do apito e o congelamento do mercado.
     - Mostre que, se o usuário tentar fazer Cash Out nesse exato instante, o servidor aciona o **RNF-01** e recusa a transação por *"Mercado Suspenso / Placar alterado"*.
     - Quando o mercado reabrir, clique em **Realizar Cash Out** e veja o saldo subindo instantaneamente com a badge `[CASH OUT]`!
5. **Demonstrar o Ranking (RF-08):**
   - Abra uma segunda aba no navegador em modo anônimo, defina outro nome (ex: *"Prof. Novak"*) e mostre os saldos disputando o ranking na mesma tela!
