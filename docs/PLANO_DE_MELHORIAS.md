# SMRT Chess — Plano de melhorias

Resultado de uma análise do código (outubro/2026). Cada item indica o que foi observado,
como foi verificado e o estado atual. Números de testes são de simulações em Node contra o
`chess.js`; **nada disso foi validado em navegador real** (veja "Pendências de verificação").

## Fase 1 — Concluída

| # | Problema | Evidência | Correção |
|---|----------|-----------|----------|
| 1 | O "Stockfish" era uma heurística própria de ~350 linhas, sem busca e sem checar xeque. | Em 200 partidas de auto-jogo: 5,1% de lances ilegais no total e **64% quando em xeque**; 100% das partidas tiveram ao menos 1 lance ilegal; níveis 9/14/20 jogaram idêntico em 100% das posições. | Substituído por **Stockfish 19 lite (WASM, 1 thread)**, que não exige COOP/COEP. Todo lance é validado com o `chess.js`. |
| 2 | Lance ilegal da engine travava a partida (o app ignorava o `false` de `makeMove`). | Código + teste acima. | Lance ilegal/timeout/erro de worker cai em lance de reserva sempre legal; a store ainda joga qualquer lance legal se `makeMove` falhar. |
| 3 | Lance "velho" da engine podia ser aplicado depois de novo jogo/desfazer/carregar posição. | Leitura do código (a espera "humana" ocorre após o cálculo). | Cada busca tem id; resultado de busca obsoleta é descartado sem deixar `isComputerThinking` preso. `bestmove` de buscas canceladas é ignorado no serviço. |
| 4 | Dificuldades com ELO inventado ("~700 … ~2500+"). | Skill Level 0 do Stockfish não equivale a 700. | Rótulos agora mostram o nível real da engine (0/20 … força total). Níveis Iniciante e Casual jogam um lance legal qualquer com 30% / 10% de chance, para ficarem acessíveis. **Não foi medido ELO.** |
| 5 | Qualquer MOVE remoto era aplicado, mesmo fora da vez do adversário. | Leitura do código. | Ignorado se a partida acabou ou se é a vez do próprio jogador. |
| 6 | Terceiro podia sequestrar a sala (cada nova conexão substituía a anterior). | Leitura do código. | Convidado envia um token de sessão aleatório; o anfitrião só aceita o primeiro token (reconexão do mesmo convidado continua funcionando). |
| 7 | Reconexão no meio da partida zerava os dois relógios e podia desincronizar o tabuleiro. | Leitura do código. | O anfitrião envia histórico + relógios no `INIT_SYNC`; o convidado reconstrói a partida (`src/game/replay.ts`, testado com roque, en passant, promoção e subpromoção e 30 partidas aleatórias). |
| 8 | Relógio descartava o tempo quando a aba voltava do segundo plano (`delta < 1s`). | Leitura do código (rAF pausa em aba oculta). | Tempo decorrido é cobrado ao voltar. |
| 9 | `npm install` falhava (ERESOLVE) e havia 8 dependências sem uso. | Reproduzido; removendo `esbuild` o install passa. | Dependências mortas removidas, `bun.lock` regenerado, `engines` e `NODE_VERSION=22` definidos (Vite 8 exige Node ≥ 20.19 / 22.12). |
| 10 | Offline: o motor não ficava em cache. | Config do PWA. | `.wasm` entra no precache do service worker. |

**Licença:** o Stockfish é GPLv3. Os arquivos em `public/stockfish/` vêm sem modificação de
[stockfish.js](https://github.com/nmrugg/stockfish.js), com `Copying.txt` e `README.txt`
apontando para o código-fonte. Como o app distribui o motor, o repositório deve permanecer
com o código acessível (hoje é público) e manter esse aviso.

## Fase 2 — Próximos passos (priorizados)

1. **Análise pós-partida e barra de avaliação com o Stockfish real.** Hoje usam avaliação estática de 1 lance (`evaluation.ts`, `gameAnalysis.ts`): captura de peça defendida aparece como "brilliant". Rodar a análise em worker, com profundidade fixa, e classificar por perda de centipeões.
2. **Autosave da partida** (PGN + modo + relógios em `localStorage`) e opção "continuar". Hoje recarregar a página perde o jogo.
3. **Relógio por timestamp** (guardar o instante de início do turno em vez de somar `delta` por frame) e decisão de bandeira autoritativa no anfitrião; hoje cada cliente decide sozinho e o `set()` roda ~60×/s.
4. **TURN server** para P2P (hoje só STUN: conexões atrás de CGNAT/4G podem falhar) e servidor de sinalização próprio do PeerJS.
5. **Three.js:** liberar geometrias/materiais (`dispose`) ao trocar tema e remover peças; confirmar se o `damp` da câmera briga com o `OrbitControls` (suspeita, não testado).
6. **Dividir `gameStore.ts`** (1.155 linhas) em slices (jogo, UI, rede, relógio) e unificar as 5 cópias da lógica de reset.
7. **Testes automatizados** (Vitest): `replay.ts`, serviço do motor (com worker simulado), protocolo de rede, relógio.
8. **Bundle:** 1,1 MB num único chunk; carregar modais e a cena 3D sob demanda (`import()`).
9. **Acessibilidade:** o `viewport` bloqueia zoom (`user-scalable=no`); respeitar `prefers-reduced-motion`.
10. **Timeout com material insuficiente** deve ser empate (regra FIDE).

## Pendências de verificação (não testadas em navegador)

- Carregamento real do Worker/WASM em produção e tempo de resposta em celulares.
- Reconexão P2P ponta a ponta (o resync foi testado só como função pura).
- Comportamento do relógio com aba em segundo plano.
