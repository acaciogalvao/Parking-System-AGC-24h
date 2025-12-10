# Guia Rápido de Configuração

## ⚡ Início Rápido

### 1. Instalar Dependências
```bash
npm install
cd backend && npm install && cd ..
```

### 2. Configurar MongoDB Atlas

O sistema precisa de um banco de dados MongoDB. Siga estes passos:

#### a) Criar conta gratuita
- Acesse: https://www.mongodb.com/cloud/atlas
- Clique em "Try Free" e crie sua conta

#### b) Criar Cluster
- Após login, clique em "Build a Database"
- Escolha o plano **M0 (FREE)**
- Selecione a região mais próxima (ex: São Paulo)
- Clique em "Create Cluster"

#### c) Configurar Acesso ao Banco
1. **Database Access** (usuário e senha):
   - No menu lateral, clique em "Database Access"
   - Clique em "Add New Database User"
   - Escolha "Password" como método de autenticação
   - Crie um usuário (ex: `admin`) e uma senha forte
   - Em "Database User Privileges", selecione "Read and write to any database"
   - Clique em "Add User"

2. **Network Access** (liberar IP):
   - No menu lateral, clique em "Network Access"
   - Clique em "Add IP Address"
   - Clique em "Allow Access from Anywhere" (adiciona 0.0.0.0/0)
   - Clique em "Confirm"

#### d) Obter String de Conexão
1. No menu lateral, clique em "Database"
2. No seu cluster, clique em "Connect"
3. Selecione "Drivers"
4. Copie a string de conexão (parecida com):
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 3. Configurar Variáveis de Ambiente

#### Backend (Obrigatório)
Edite o arquivo `backend/.env`:
```env
MONGO_URI=mongodb+srv://seu_usuario:sua_senha@seu_cluster.mongodb.net/parking-agc?retryWrites=true&w=majority
PORT=3000
```

**Importante**: Substitua:
- `seu_usuario` pelo usuário que você criou
- `sua_senha` pela senha do usuário
- `seu_cluster` pelo endereço do seu cluster

#### Frontend (Opcional)
Se quiser usar reconhecimento de placas com IA, crie o arquivo `.env` na raiz:
```env
VITE_GEMINI_API_KEY=sua_chave_api_gemini
```

Para obter a chave:
- Acesse: https://makersuite.google.com/app/apikey
- Faça login com sua conta Google
- Clique em "Create API Key"

### 4. Iniciar o Sistema

#### Opção A: Script Automático
```bash
./start.sh
```

#### Opção B: Manual (2 terminais)

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### 5. Acessar o Sistema

Abra seu navegador em: **http://localhost:5173**

## 🔍 Verificação

### Backend funcionando corretamente:
- Você verá no terminal: `🚀 Server AGC Parking rodando na porta 3000`
- E também: `✅ MongoDB Atlas Conectado!`

### Frontend funcionando corretamente:
- O navegador abrirá automaticamente
- Você verá a tela do sistema de estacionamento

## ❌ Problemas Comuns

### "MongoDB URI inválida"
- Verifique se você editou o arquivo `backend/.env`
- Confirme que substituiu `<username>`, `<password>` e `<cluster>`
- Não deixe espaços extras na string de conexão

### "Falha na conexão MongoDB"
- Verifique se liberou o IP 0.0.0.0/0 no Network Access
- Confirme que o usuário e senha estão corretos
- Teste a conexão usando MongoDB Compass

### Frontend não conecta ao backend
- Certifique-se que o backend está rodando (porta 3000)
- O sistema funciona em modo offline se o backend estiver indisponível

### Erro ao instalar dependências
```bash
# Limpe e reinstale
rm -rf node_modules package-lock.json
npm install
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no terminal
2. Confirme que seguiu todos os passos
3. Teste a conexão do MongoDB usando MongoDB Compass
