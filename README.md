# SMRT Chess — Xadrez 3D Brasil 🏆♟️

Webapp completo de xadrez 3D de alta fidelidade desenvolvido com React, TypeScript, Three.js, Tailwind CSS e motor de regras oficial FIDE via chess.js. O projeto foi projetado com visual dark premium, iluminação de estúdio PBR, peças procedurais estilizadas, múltiplos ângulos de câmera e modos de jogo.

---

## 🚀 Tecnologias

- **Front-end**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **3D & Gráficos**: Three.js, RoomEnvironment com PMREM, sombras suaves PCF, materiais PBR (mármore nobre, madeira e metais escovados)
- **Computador**: [Stockfish 19](https://github.com/nmrugg/stockfish.js) (lite, WebAssembly, 1 thread) em Web Worker, com validação de todo lance pelo `chess.js`
- **Regras de Xadrez**: `chess.js` (roque grande/pequeno, en passant, promoção de peão, xeque, xeque-mate, afogamento, repetição de lances e regra dos 50 movimentos)
- **Estado Global**: Zustand
- **Multiplayer**: P2P WebRTC via PeerJS (sala de 2 jogadores, reconexão com ressincronização)
- **PWA**: instalável, com o motor em cache para jogar contra o computador offline
- **Deploy**: Netlify (`netlify.toml`)

---

## 📦 Como Rodar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/renatomott/smrt_chess.git
   cd smrt_chess
   ```

2. Instale as dependências (Node ^20.19 ou >=22.12):
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Abra no seu navegador o endereço indicado (por padrão `http://localhost:3000`).

---

## 🛠️ Scripts Disponíveis

- `npm run dev`: Inicia o ambiente de desenvolvimento local na porta 3000
- `npm run build`: Compila o aplicativo para produção com TypeScript e Vite na pasta `dist/`
- `npm run preview`: Visualiza o build de produção localmente
- `npm run lint` / `npm run typecheck`: Executa a checagem estática de tipos TypeScript

---

## 🌐 Publicação no Netlify

1. Faça push do repositório para o GitHub na branch principal (`main`).
2. Acesse o [Netlify](https://app.netlify.com/) e clique em **"Add new site"** → **"Import an existing project"**.
3. Selecione o repositório `smrt_chess`.
4. As configurações serão lidas automaticamente do arquivo `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node Version**: `22` (definido em `netlify.toml`)
5. Clique em **Deploy site**. O deploy contínuo será ativado automaticamente a cada novo commit na branch `main`.

---

## 📁 Estrutura de Pastas

```
/
├── docs/                   # Plano de melhorias
├── public/                 # Assets estáticos (public/stockfish: motor WASM)
├── src/
│   ├── components/         # Componentes de interface (HUD, controles, modais)
│   ├── engine/             # Integração do motor (Stockfish e IA)
│   ├── game/               # Tipos e regras do jogo
│   ├── hooks/              # Custom hooks React
│   ├── net/                # Multiplayer P2P WebRTC (PeerJS)
│   ├── store/              # Gerenciamento de estado Zustand
│   ├── themes/             # Temas de peças e times brasileiros
│   ├── three/              # Renderizador Three.js, geometrias procedurais, luzes e câmeras
│   ├── utils/              # Funções utilitárias e geradores de som
│   ├── App.tsx             # Aplicação principal
│   ├── index.css           # Estilização global com Tailwind CSS
│   └── main.tsx            # Ponto de montagem React
├── netlify.toml            # Configuração de deploy no Netlify
└── package.json            # Dependências e scripts
```

---

## 📜 Licenças

O código deste projeto é do autor. O motor **Stockfish** (`public/stockfish/`) é distribuído
sem modificações sob a **GNU GPL v3** — veja `public/stockfish/Copying.txt` e
`public/stockfish/README.txt` para o código-fonte e os créditos
([stockfish.js](https://github.com/nmrugg/stockfish.js) de Nathan Rugg e
[Stockfish](https://github.com/official-stockfish/Stockfish)).

## 🗺️ Roadmap

Veja [`docs/PLANO_DE_MELHORIAS.md`](docs/PLANO_DE_MELHORIAS.md).
