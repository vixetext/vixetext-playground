# VixeText – Playground de edição

App de exemplo que edita Markdown com **CodeMirror 6**, pré-visualiza em HTML e gera **PDF** via um backend em **Go + Pandoc/LaTeX**. Inclui **cache por conteúdo**, **PDF de erro** com log de compilação e **autenticação Bearer** por variável de ambiente.

---

## Sumário

* [Arquitetura](#arquitetura)
* [Principais recursos](#principais-recursos)
* [Requisitos](#requisitos)
* [Backend (Go)](#backend-go)

  * [Variáveis de ambiente](#variáveis-de-ambiente)
  * [Instalação de dependências do LaTeX](#instalação-de-dependências-do-latex)
  * [Rodando localmente](#rodando-localmente)
  * [Contrato da API](#contrato-da-api)
  * [Exemplos de chamada](#exemplos-de-chamada)
* [Frontend (Vite + React)](#frontend-vite--react)

  * [Variáveis de ambiente (Vite)](#variáveis-de-ambiente-vite)
  * [Rodando o front](#rodando-o-front)
* [Componentes principais](#componentes-principais)
* [Segurança](#segurança)
* [Dicas & Solução de problemas](#dicas--solução-de-problemas)
* [Estrutura do projeto](#estrutura-do-projeto)
* [Licença](#licença)

---

## Arquitetura

```
[Editor/Preview (React)] ── ► [compilePdf() no front]
                             │
                             ▼
                     HTTP POST /gerar-pdf (Go)
                     ├─ Cache por hash (md5)
                     ├─ Baixa template (zip) e mantém cache
                     ├─ Pandoc + latexmk (XeLaTeX) + biblatex
                     └─ PDF de erro (gofpdf) quando falha
```

---

## Principais recursos

* **Editor com linguagem dinâmica** (Markdown/YAML/BibTeX) e tema dark.
* **Toolbar** para formatação básica de Markdown.
* **Preview HTML** sanitizado (Marked + DOMPurify).
* **Modal de PDF** com zoom, ajuste à largura, navegação de páginas e **sumário (TOC)** quando disponível (via `react-pdf`).
* **Backend Go** com:

  * Autenticação via `Authorization: Bearer <AUTH_TOKEN>`.
  * Cache por conteúdo (md5 de `indexMd + yaml + bib`).
  * Devolve **PDF mesmo em erro**, contendo log resumido da compilação.
  * CORS habilitado (`Content-Type`, `Authorization`).

---

## Requisitos

* **Go** 1.20+
* **Pandoc** 2.12+ (recomendado versão recente)
* **LaTeX** com `xelatex`, `latexmk`, `biblatex`/`biber` e fontes DejaVu (opcional, mas recomendado para UTF‑8 no PDF de erro)
* **Node** 18+

---

## Backend (Go)

Código principal: `gerador-pdf-autenticado.go`.

### Variáveis de ambiente

| Nome         | Obrigatório | Descrição                                                                    |
| ------------ | ----------- | ---------------------------------------------------------------------------- |
| `AUTH_TOKEN` | Sim         | Token fixo para autenticação **Bearer**. O servidor não sobe sem esse valor. |
| `PORT`       | Não         | Porta alternativa. O código usa `:8080` por padrão (ajuste em `listenAddr`). |

> **CORS**: o handler já libera `Access-Control-Allow-Origin: *` e `Authorization` nos headers.

### Instalação de dependências do LaTeX

No Ubuntu/Debian, por exemplo:

```bash
sudo apt update
sudo apt install -y pandoc latexmk texlive-xetex texlive-latex-recommended \
  texlive-latex-extra texlive-fonts-recommended biber fonts-dejavu
```

### Rodando localmente

```bash
export AUTH_TOKEN="<seu-token-forte>"
go run gerador-pdf-autenticado.go
# Servidor em :8080 → POST /gerar-pdf
```

### Contrato da API

**Endpoint**: `POST /gerar-pdf`

**Headers**

* `Content-Type: application/json`
* `Accept: application/pdf`
* `Authorization: Bearer <AUTH_TOKEN>`

**Body (JSON)**

```json
{
  "indexMd": "# Meu artigo...",
  "configuracaoYaml": "title: Exemplo\nauthor: Você",
  "referenciasBib": "@book{chomsky1957,...}"
}
```

**Resposta**

* `200 OK` com `application/pdf` **(sempre um PDF)**:

  * Sucesso: PDF final (ex.: `arquivo.pdf`).
  * Falha: PDF de erro com o log de compilação.
* `401 Unauthorized` (JSON): `{ "error": "não autenticado" }` quando o header Bearer é inválido.

> O serviço tenta salvar em cache (`work/<hash>/build/arquivo.pdf`). Requisições com o mesmo conteúdo retornam do cache.

### Exemplos de chamada

**cURL**

```bash
curl -X POST http://localhost:8080/gerar-pdf \
  -H "Content-Type: application/json" \
  -H "Accept: application/pdf" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  --data '{
    "indexMd":"# Título\\nHello *world*!",
    "configuracaoYaml":"title: Demo\\nauthor: Você",
    "referenciasBib":""
  }' --output saida.pdf
```

---

## Frontend (Vite + React)

### Variáveis de ambiente (Vite)

**Caminho recomendado**: `import.meta.env` com prefixo `VITE_`.

Arquivos de exemplo:

```
# .env.development
VITE_API_URL=http://localhost:8080
VITE_API_KEY=SE-O-API-TOKEN-SE-VC-REALMENTE-EXPOR (ver Segurança)

# .env.production
VITE_API_URL=https://sua-api/ # ajuste
```

Tipos (opcional) em `src/env.d.ts`:

```ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_KEY?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
```

Uso no cliente (ex.: `api-client.ts` – abordagem recomendada):

```ts
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY; // evite em produção (ver Segurança)

export async function compilePdf(payload: any, signal?: AbortSignal) {
  const res = await fetch(`${API_URL}/gerar-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/pdf',
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });
  const blob = await res.blob();
  return { blob };
}
```

> **Alternativa**: usar `define` no `vite.config.ts` para mapear `process.env.API_URL`/`API_KEY`. Útil se você já tipou dessa forma.

### Rodando o front

```bash
# na pasta do front
npm i
npm run dev
```

Abra `http://localhost:5173` (porta padrão do Vite).

---

## Componentes principais

* **`Editor.tsx`**: CodeMirror 6, linguagem dinâmica (Markdown/YAML/BibTeX), API por `ref` compatível com `<textarea>`.
* **`Toolbar.tsx`**: ações de formatação (bold, h1/h2/h3, listas, quote, code, link, image, hr).
* **`Preview.tsx`**: exibe HTML já processado (prose, tema claro/escuro).
* **`PdfModal.tsx`**: abre, compila via `compilePdf`, exibe PDF com zoom, TOC, navegação, abrir em nova aba e download.
* **`Header.tsx`**: controles de undo/redo, toggle preview, gerar PDF e alternância de tema.
* **`FileTabs.tsx`**: abas de arquivos.
* **`api-client.ts`**: `compilePdf(payload)` faz `POST /gerar-pdf` e retorna `Blob` do PDF (ou PDF de erro).

---

## Segurança

* **Não exponha o `AUTH_TOKEN` do backend no navegador**. Qualquer variável `VITE_*` ou valor injetado via `define` é público.
* Padrão recomendado: coloque o token **apenas no servidor** (ex.: um **proxy** `POST /gerar-pdf` em Node/Cloud Run/Functions) que injete o header `Authorization: Bearer $AUTH_TOKEN` ao falar com o serviço em Go. O front chama **seu** proxy sem token.
* Alternativas: autenticação por usuário (JWT com expiração curta), IAP/Identity-Aware Proxy, ou IAM no provedor de cloud.

---

## Dicas & Solução de problemas

* **Erro de compilação**: o backend retorna um **PDF de erro** com log truncado (até \~30KB). Abra-o para ver detalhes.
* **Faltam pacotes LaTeX**: instale `latexmk`, `biber` e coleções recomendadas. Em distros minimalistas, o TeX Live padrão pode não incluir biblatex.
* **Primeira execução lenta**: o servidor baixa o **template** do GitHub e cacheia (pasta `cache/repo`). Depende de rede.
* **Worker do `react-pdf`**: defina o worker corretamente:

  ```ts
  import { pdfjs } from 'react-pdf';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  ```
* **CORS**: já habilitado no backend, mas confirme `Authorization` no header se usar proxy/CDN.

---

## Estrutura do projeto

```
.
├── backend/
│   └── gerador-pdf-autenticado.go
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api-client.ts
│   │   ├── components/
│   │   │   ├── Editor.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── FileTabs.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Preview.tsx
│   │   │   └── PdfModal.tsx
│   │   ├── App.tsx
│   │   └── constants.ts
│   ├── index.html
│   ├── vite.config.ts
│   └── ...
└── README.md
```
