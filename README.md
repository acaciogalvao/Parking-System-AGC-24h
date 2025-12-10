# Parking System AGC 24h

Sistema completo de gerenciamento de estacionamento com frontend React e backend Node.js + MongoDB.

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou pnpm
- Conta no MongoDB Atlas (gratuita) ou MongoDB local

## 🚀 Como Rodar o Sistema

### Passo 1: Instalar Dependências

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
```

### Passo 2: Configurar MongoDB

O sistema precisa de um banco de dados MongoDB. Você tem duas opções:

#### Opção A: MongoDB Atlas (Recomendado - Gratuito)

1. Acesse [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) e crie uma conta gratuita
2. Crie um novo **Cluster** (o plano "M0 Sandbox" é grátis)
3. Em **Database Access**, crie um usuário e senha (ex: `admin` / `senha123`)
4. Em **Network Access**, adicione o IP `0.0.0.0/0` (Allow Access from Anywhere)
5. Vá em **Database** > **Connect** > **Drivers**
6. Copie a **Connection String**

#### Opção B: MongoDB Local

Se você tiver MongoDB instalado localmente:
```
MONGO_URI=mongodb://localhost:27017/parking-agc
```

### Passo 3: Configurar Variáveis de Ambiente

1. Entre na pasta backend:
```bash
cd backend
```

2. Edite o arquivo `.env` e substitua a string de conexão:
```env
MONGO_URI=mongodb+srv://seu_usuario:sua_senha@seu_cluster.mongodb.net/parking-agc?retryWrites=true&w=majority
PORT=3000
```

### Passo 4: Iniciar o Sistema

#### Terminal 1 - Backend
```bash
cd backend
npm start
```

Você verá: `🚀 Server AGC Parking rodando na porta 3000`

#### Terminal 2 - Frontend
```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 📱 Funcionalidades

- **Dashboard**: Visão geral do estacionamento com estatísticas em tempo real
- **Entrada**: Registro de entrada de veículos com captura de placa
- **Vagas**: Visualização e gerenciamento de vagas ocupadas
- **Histórico**: Consulta de registros anteriores
- **Configurações**: Gerenciamento de tarifas e chave PIX

## 🛠️ Tecnologias

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Lucide Icons
- Recharts

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- CORS
- dotenv

## 📝 Estrutura do Projeto

```
parking-system-agc-24h/
├── backend/              # Servidor API
│   ├── server.js        # Código principal do servidor
│   ├── package.json     # Dependências do backend
│   ├── .env            # Configurações (não versionado)
│   └── .env.example    # Template de configuração
├── components/          # Componentes React
├── services/           # Serviços de API e integração
├── App.tsx            # Componente principal
├── index.tsx          # Ponto de entrada
├── types.ts           # Definições TypeScript
└── package.json       # Dependências do frontend
```

## 🔧 Solução de Problemas

### Backend não conecta ao MongoDB
- Verifique se o arquivo `.env` está configurado corretamente
- Confirme que o IP `0.0.0.0/0` está liberado no MongoDB Atlas
- Teste a string de conexão usando MongoDB Compass

### Frontend não conecta ao backend
- Certifique-se de que o backend está rodando na porta 3000
- Verifique se não há firewall bloqueando a porta
- O sistema funciona em modo offline se o backend estiver indisponível

### Erro de dependências
```bash
# Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licença

Este projeto é de uso privado para o estacionamento AGC 24h.
