# Deploy no Railway - Gestão de Horas

Este guia explica como fazer deploy da aplicação de gestão de horas no Railway.

## Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Repositório GitHub com o código da aplicação
3. Base de dados PostgreSQL (Railway pode provisionar automaticamente)

## Configuração do Deploy

### 1. Conectar Repositório

1. Acesse [Railway](https://railway.app) e faça login
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório da aplicação

### 2. Configurar Base de Dados

1. No dashboard do projeto, clique em "+ New"
2. Selecione "Database" → "PostgreSQL"
3. Aguarde a criação da base de dados
4. Railway criará automaticamente a variável `DATABASE_URL`

### 3. Configurar Variáveis de Ambiente

No dashboard do Railway, acesse as configurações do serviço e adicione:

```
NODE_ENV=production
```

A variável `DATABASE_URL` será criada automaticamente pelo Railway quando adicionar PostgreSQL.

### 4. Deploy Automático

O Railway irá:
- Detectar que é uma aplicação Node.js
- Executar `npm ci` para instalar dependências
- Executar `npm run build` para fazer build da aplicação
- Iniciar com `npm run start`

## Estrutura dos Arquivos de Configuração

### `railway.json`
Configuração específica do Railway com comando de início e healthcheck.

### `nixpacks.toml`
Configuração do build usando Nixpacks (buildpack do Railway).

### `.env.example`
Exemplo das variáveis de ambiente necessárias.

## Scripts de Build

A aplicação está configurada com os seguintes scripts:

- `npm run build`: Compila o frontend (Vite) + backend (ESBuild)
- `npm run start`: Inicia a aplicação em produção
- `npm run dev`: Desenvolvimento local

## Migração da Base de Dados

Após o deploy, execute as migrações:

1. No terminal do Railway ou localmente:
```bash
npm run db:push
```

Ou acesse o PostgreSQL diretamente pelo Railway e execute as migrações necessárias.

## Domínio e URLs

- Railway fornece automaticamente um domínio `.railway.app`
- Você pode configurar um domínio personalizado nas configurações
- A aplicação serve frontend e API no mesmo domínio

## Monitoramento

- Logs estão disponíveis no dashboard do Railway
- Métricas de CPU e memória são monitoradas automaticamente
- Railway faz redeploy automático a cada push no GitHub

## Troubleshooting

### Base de Dados não Conecta
- Verifique se a variável `DATABASE_URL` está definida
- Confirme que o serviço PostgreSQL está rodando
- Execute `npm run db:push` para sincronizar o schema

### Build Falha
- Verifique os logs de build no Railway
- Confirme que todas as dependências estão no `package.json`
- Teste o build localmente: `npm run build`

### Aplicação não Inicia
- Verifique os logs do deploy
- Confirme que `npm run start` funciona localmente
- Verifique se a porta está configurada corretamente

## Recursos do Railway

- **Auto-scaling**: Ajusta recursos automaticamente
- **Zero-downtime deploys**: Deploys sem interrupção
- **Rollback**: Possibilidade de voltar versões anteriores
- **Branch deploys**: Deploy automático de branches
- **Collaborative**: Compartilhamento de projetos com equipe