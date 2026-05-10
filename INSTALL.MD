# ⚙ Guia de Instalação — Sistema de Pedidos para Restaurante

# 📦 Requisitos

Antes de começar, instale:

* Git
* Node.js
* Docker Desktop

## Links

* Git: [https://git-scm.com/](https://git-scm.com/)
* Node.js: [https://nodejs.org/](https://nodejs.org/)
* Docker Desktop: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

---

# 📥 Clonar o projeto

Abra o terminal:

```bash
git clone https://github.com/Bartchola/Loja.git
cd Loja
```

---

# 🚀 Backend

## Entrar na pasta

```bash
cd backend
```

## Instalar dependências

```bash
npm install
npm install cors
npm install multer
```

Isso irá criar automaticamente a pasta:

```text
node_modules
```

---

# 🔐 Criar `.env` do backend

Dentro da pasta `backend`, crie:

```text
.env
```

Exemplo:

```env
PORT=3001
FRONTEND_URL=http://127.0.0.1:5500
EVOLUTION_API_URL=http://localhost:8083
EVOLUTION_API_KEY=SUA_API_KEY_AQUI
EVOLUTION_INSTANCE=Teste

ADMIN_USER=admin
ADMIN_PASSWORD=123456
ADMIN_AUTH_SECRET=troque_essa_chave
```

---

# 🐳 Evolution API

## Criar pasta evolution

Volte para a raiz do projeto:

```bash
cd ..
mkdir evolution
cd evolution
```

---

# 🔐 Criar `.env` da Evolution

Dentro da pasta `evolution`, crie:

```text
.env
```

Cole:

```env
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=http://localhost:8083

AUTHENTICATION_API_KEY=SUA_API_KEY_AQUI
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
LANGUAGE=en

CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE
CORS_CREDENTIALS=true

LOG_LEVEL=ERROR,WARN,DEBUG,INFO

DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:password@postgres:5432/evolution_db?schema=public
DATABASE_CONNECTION_CLIENT_NAME=evolution_exchange

CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://redis:6379/2
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_REDIS_SAVE_INSTANCES=false
CACHE_LOCAL_ENABLED=false
```

---

# 📄 Criar `docker-compose.yml`

Ainda dentro da pasta `evolution`, crie:

```text
docker-compose.yml
```

Cole:

```yaml
version: "3.8"

services:
  evolution:
    container_name: evolution_api
    image: atendai/evolution-api
    restart: always
    ports:
      - "8083:8080"
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    container_name: evolution_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: evolution_db
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    container_name: evolution_redis
    restart: always
    ports:
      - "6379:6379"
```

---

# ▶ Subir Evolution API

Dentro da pasta `evolution`:

```bash
docker-compose up -d
```

---

# 🌐 Abrir painel da Evolution

Abra no navegador:

```text
http://localhost:8083/manager
```

---

# 📱 Criar instância

No painel da Evolution:

1. Clique em `Create Instance`
2. Escolha um nome

Exemplo:

```text
Teste
```

3. Escaneie o QR Code com o WhatsApp

---

# ▶ Rodar backend

Abra outro terminal:

```bash
cd backend
npm run dev
```

Se estiver correto:

```text
Servidor rodando em http://localhost:3001
```

---

# 🌐 Rodar frontend

Você pode:

* usar Live Server do VSCode
* usar Vercel
* usar Netlify
* usar qualquer servidor local

## Exemplo no VSCode

1. Abrir o projeto
2. Clicar com botão direito em `index.html`
3. `Open with Live Server`

---

# 🔥 Painel administrativo

Página:

```text
frontend/pages/login.html
```

Login padrão:

```text
Usuário: admin
Senha: 123456
```

---

# 🖼 Upload de imagens

As imagens enviadas pelo painel são salvas automaticamente.

---

# 📌 Ordem correta para iniciar tudo

## 1. Evolution

```bash
cd evolution
docker-compose up -d
```

## 2. Backend

```bash
cd backend
npm install
npm run dev
```

## 3. Frontend

Abrir:

```text
index.html
```

com Live Server.

---

# 🚫 Arquivos que NÃO devem ir para o GitHub

Crie um `.gitignore` na raiz:

```gitignore
node_modules/
.env
backend/node_modules/
backend/.env
evolution/.env
```

---

# ✅ Arquivos que podem ir para o GitHub

* frontend/
* backend/package.json
* backend/package-lock.json
* backend/src/
* evolution/docker-compose.yml
* assets/
* README.md
* CHANGELOG.md
* INSTALL.md

---

# 💻 Outro computador

Se baixar em outro PC:

```bash
git clone https://github.com/Bartchola/Loja.git
cd Loja/backend
npm install
```

Depois recrie manualmente:

* backend/.env
* evolution/.env

---

# 📌 Comandos principais

## Instalar backend

```bash
cd backend
npm install
```

## Rodar backend

```bash
npm run dev
```

## Subir Evolution

```bash
cd evolution
docker-compose up -d
```

## Parar Evolution

```bash
docker-compose down
```

---

# 🛠 Se der erro

Confira:

* se o Node.js está instalado
* se o Docker Desktop está aberto
* se o `.env` do backend existe
* se o `.env` da evolution existe
* se a instância da Evolution está conectada
* se a API KEY é igual nos dois `.env`
