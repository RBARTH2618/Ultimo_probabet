# ⚽ PROBABET - Plataforma de Apostas em Tempo Real com WebSocket (Ws2)

> **Trabalho Acadêmico de Desenvolvimento de Software para Web**  
> **Instituição:** Universidade de Rio Verde (UniRV)  
> **Professor:** Me. Sergio Souza Novak  
> **Desenvolvedores:** João Lucas & Antigravity  

---

## 📌 1. Visão Geral do Projeto

O **PROBABET** é um ecossistema completo de apostas esportivas ao vivo (*in-play*) construído com foco em **baixa latência (< 100 ms)** e alta fidelidade funcional. Utiliza uma conexão **WebSocket Full-Duplex bidirecional** sobre uma única conexão TCP persistente, eliminando o overhead de cabeçalhos e a latência de requisições HTTP REST convencionais (*polling*).

---

## 📖 2. Glossário de Termos: Entendendo o Código em Português

Para facilitar o entendimento de qualquer pessoa que leia ou apresente este código, todos os termos técnicos e de domínio foram traduzidos e mapeados:

| Termo em Inglês | Termo em Português | O que é e o que faz no sistema? |
|---|---|---|
| **Odds** | **Cotações** | Multiplicadores de probabilidade. Ex: Odd 1.80 significa que cada R$ 1,00 apostado devolve R$ 1,80 se vencer. |
| **Bet Slip** | **Cupom / Caderneta de Apostas** | O painel lateral onde o apostador visualiza o palpite escolhido, digita o valor e confirma a aposta. |
| **Stake** | **Valor Apostado** | A quantia em Reais (R$) debitada do saldo para registrar a aposta. |
| **Payout / Potential Return** | **Retorno Potencial** | O prêmio máximo a receber: `Retorno = Valor Apostado × Cotação (Odd)`. |
| **Cash Out** | **Encerramento Antecipado** | Funcionalidade que permite ao apostador encerrar uma aposta antes dos 90 minutos para garantir lucro ou reduzir prejuízo. |
| **Green** | **Aposta Vitoriosa** | Quando o palpite foi certeiro e o prêmio total foi creditado na carteira. |
| **Red** | **Aposta Perdida** | Quando o palpite não se concretizou ao final dos 90 minutos. |
| **Broadcast** | **Transmissão Geral** | Envio de um evento WebSocket do servidor para **TODOS** os apostadores conectados simultaneamente. |
| **Unicast** | **Notificação Individual** | Envio de uma mensagem WebSocket direcionada a **UM** único apostador específico (ex: confirmação do seu bilhete). |
| **Handshake** | **Aperto de Mão Inicial** | O primeiro contato TCP/WebSocket onde o servidor reconhece o apostador e entrega o saldo inicial de R$ 100,00. |
| **Race Condition** | **Condição de Corrida** | Concorrência milissegunda onde um evento de gol anula pedidos simultâneos de cash out (travados pelo RNF-01). |

---

## 📂 3. Estrutura Modular do Projeto em Português

Todo o código foi renomeado e organizado em camadas de **Responsabilidade Única (SRP - Clean Architecture)**, com comentários detalhados explicando o que cada arquivo é, o que faz e onde é utilizado:

```
/PROBABET
  ├── /public (Frontend Modular - ES6 Modules & CSS3)
  │     ├── index.html                  (Tela 1: Lobby de Cotações ao Vivo e Filtros)
  │     ├── betslip.html                (Tela 2: Detalhes da Partida, Estatísticas e Cupom de Aposta)
  │     ├── wallet.html                 (Tela 3: Carteira do Apostador, Cash Out e Histórico)
  │     ├── styles.css                  (Folha de estilos master importando os módulos CSS)
  │     ├── /css
  │     │    ├── variables.css          (Paleta de cores HSL, tipografia e resets)
  │     │    ├── header.css             (Cabeçalho global, badge WS, saldo e navegação)
  │     │    ├── lobby.css              (Filtros chips, cards de partidas e animação de odds)
  │     │    ├── betslip.css            (Layout split, estatísticas, live ticker e cupom)
  │     │    ├── wallet.css             (Card da carteira, abas ativas/histórico e cash out)
  │     │    └── components.css         (Banner de gol, modal #Ticket ID e barra de demo)
  │     └── /js
  │          ├── /config/eventos.js     (Dicionário central de eventos WebSocket)
  │          ├── /state/estadoAplicacao.js (Armazenamento reativo do estado global do cliente)
  │          ├── /state/sessao.js       (Persistência no localStorage e identificação do apostador)
  │          ├── /net/clienteWebSocket.js (Conexão Full-Duplex, reconexão automática e envio TCP)
  │          ├── /net/manipuladorEventos.js (Despachante e roteamento dos eventos recebidos do servidor)
  │          ├── /audio/efeitosSonoros.js (Síntese Web Audio API: apito, gol, cashout e alertas)
  │          ├── /ui/interfaceCabecalho.js (Animação de pulso do saldo, badges e banners)
  │          ├── /ui/barraDemonstracao.js (Controles manuais para a apresentação acadêmica)
  │          ├── /views/visaoLobby.js   (Renderização da Tela 1, filtros e animações de alta/baixa)
  │          ├── /views/visaoCupom.js   (Renderização da Tela 2, cálculo de retorno e submissão)
  │          ├── /views/visaoCarteira.js (Renderização da Tela 3, histórico e botões de cash out)
  │          └── principal.js           (Ponto de entrada que orquestra os módulos do frontend)
  │
  ├── /server (Backend Modular - Node.js em Camadas)
  │     ├── /config/constantes.js       (Constantes de configuração, status e eventos WS)
  │     ├── /data
  │     │    ├── dadosIniciais.js       (Carga de partidas mock e apostadores para o ranking)
  │     │    └── bancoDados.js          (Repositório singleton de banco de dados em memória)
  │     ├── /services
  │     │    ├── servicoUsuario.js      (Criação, controle de saldo e ranking de apostadores)
  │     │    ├── servicoPartida.js      (Consulta de partidas, suspensão de mercado e reset)
  │     │    ├── servicoAposta.js       (Validação de saldo não negativo [RNF-02] e bilhetes [RF-03])
  │     │    ├── servicoCashout.js      (Recálculo [RF-04] e execução atômica anti-race condition [RF-05, RNF-01])
  │     │    └── servicoLiquidacao.js   (Liquidação de bilhetes aos 90 min com GREEN/RED [RF-07])
  │     ├── /engine
  │     │    ├── calculadoraCotacoes.js (Cálculo estocástico e direcional UP/DOWN de cotações [RF-02])
  │     │    └── motorPartida.js        (Orquestrador do loop de tempo real, lances e finalização)
  │     ├── /ws
  │     │    ├── gatewayWebSocket.js    (Servidor WebSocket, registro de conexões, broadcast e unicast)
  │     │    └── roteadorWebSocket.js   (Roteamento de mensagens do cliente para os serviços de domínio)
  │     ├── servidor.js                 (Ponto de entrada: servidor HTTP Express e Gateway WebSocket)
  │     ├── server.js                   (Ponte de compatibilidade executando servidor.js)
  │     ├── engine.js                   (Ponte de compatibilidade reexportando motorPartida.js)
  │     └── state.js                    (Ponte de compatibilidade reexportando os serviços em português)
  │
  ├── package.json                      (Dependências mínimas: express e ws)
  ├── atividade.pdf                     (Enunciado oficial da atividade prática - UniRV)
  └── README.md                         (Guia de execução, apresentação e documentação completa)
```

---

## 🚀 4. Como Executar o Projeto

### Pré-requisitos:
- **Node.js** (v18 ou superior)
- **NPM** instalado

### Passo a Passo:

1. **Abra o terminal na pasta raiz do projeto:**
   ```bash
   cd "c:\Users\Arthur\Downloads\PROBABET"
   ```

2. **Instale as dependências (caso ainda não tenha instalado):**
   ```bash
   npm install
   ```

3. **Inicie o servidor:**
   ```bash
   npm start
   ```
   *(Ou diretamente com: `node server/servidor.js`)*

4. **Abra o navegador:**
   - **Lobby de Cotações (Tela 1):** [http://localhost:3000/](http://localhost:3000/)
   - **Detalhes & Cupom de Aposta (Tela 2):** [http://localhost:3000/betslip.html](http://localhost:3000/betslip.html)
   - **Carteira & Cash Out (Tela 3):** [http://localhost:3000/wallet.html](http://localhost:3000/wallet.html)

---

## ⚙️ 5. Mapeamento dos Requisitos da Atividade Acadêmica (UniRV)

| Código | Requisito | Onde está implementado no código? | Descrição Técnica & Payload |
|---|---|---|---|
| **[RF-01]** | **Handshake & Saldo Inicial** | `servidor.js` e `servicoUsuario.js` | Ao conectar via WebSocket, vincula o apostador e responde com `HANDSHAKE_SUCCESS` entregando saldo de **R$ 100,00**. |
| **[RF-02]** | **Transmissão Dinâmica de Odds** | `calculadoraCotacoes.js` e `motorPartida.js` | Loop a cada **2.5 segundos** enviando broadcast `ODDS_UPDATE`. No frontend, as cotações piscam em verde (↑) ou vermelho (↓). |
| **[RF-03]** | **Submissão & Validação de Aposta** | `servicoAposta.js` e `visaoCupom.js` | Recebe `PLACE_BET`, valida saldo, debita atomicamente e emite comprovante com `#Ticket ID` (`BET_CONFIRMED`). |
| **[RF-04]** | **Cálculo de Cash Out em Tempo Real** | `servicoCashout.js` e `visaoCarteira.js` | Recalcula continuamente o valor de resgate com base no minuto de jogo, placar atual e margem da casa. |
| **[RF-05]** | **Processamento de Cash Out** | `servicoCashout.js` e `roteadorWebSocket.js` | Recebe `CASH_OUT`, encerra a aposta ativa, credita o valor na carteira e emite `CASH_OUT_CONFIRMED`. |
| **[RF-06]** | **Eventos de Jogo (GOL / Cartão)** | `motorPartida.js` e `manipuladorEventos.js` | Broadcast `GAME_EVENT` com tipo `"GOAL"`. Congela os mercados afetados com cadeado 🔒 (`Mercado Temporariamente Suspenso`), toca som sintetizado e exibe banner. |
| **[RF-07]** | **Liquidação Automática** | `servicoLiquidacao.js` e `motorPartida.js` | Aos 90 min de jogo, avalia os bilhetes abertos, paga os vencedores (`GREEN`) com `Valor × Odd` e liquida os perdedores (`RED`). |
| **[RF-08]** | **Ranking & Saldo Sincronizado** | `servicoUsuario.js` e `interfaceCabecalho.js` | Saldo exibido no topo de todas as telas com animação de pulso e tabela de classificação dos apostadores em tempo real. |
| **[RNF-01]** | **Prevenção de Race Condition** | `servicoCashout.js` (`executarCashOut`) | Trava atômica no servidor: se o Cash Out for clicado durante um Gol ou suspensão, a transação é rejeitada com a mensagem: `[Proposta expirada — Placar alterado / Mercado temporariamente suspenso]`. |
| **[RNF-02]** | **Garantia de Saldo Não Negativo** | `servicoAposta.js` (`efetuarAposta`) | Verificação estrita e débito síncrono no mesmo ciclo do Event Loop, impedindo saldo negativo. |
| **[RNF-03]** | **Baixa Latência (< 100 ms)** | `bancoDados.js` e `gatewayWebSocket.js` | Utilização de Maps em memória O(1) e canal TCP Full-Duplex sem overhead de cabeçalhos HTTP. |

---

## 🎤 6. Roteiro Prático para Apresentação Oral ao Professor

1. **Abertura Conceitual:**
   - *"Professor, adotamos o protocolo WebSocket para viabilizar comunicação Full-Duplex bidirecional sobre uma única conexão TCP persistente. Ao contrário do modelo REST HTTP com polling, não há sobrecarga de cabeçalhos repetidos e as cotações chegam com latência inferior a 100 ms."*
2. **Demonstração do Lobby e Cotações Vivas (RF-01 e RF-02):**
   - Abra [http://localhost:3000/](http://localhost:3000/).
   - Mostre o saldo inicial de **R$ 100,00** e o badge verde `Conectado (WS)`.
   - Mostre as cotações oscilando a cada 2,5s piscando suavemente em **verde** ou **vermelho** com as setas `↑` e `↓`.
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
