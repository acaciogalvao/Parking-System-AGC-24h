# Backend - Parking System AGC 24h

Este é o servidor API para o sistema de estacionamento. Ele se conecta a um banco de dados MongoDB na nuvem (Atlas) para salvar os dados.

## 🚀 Como Rodar o Servidor

1. **Abra o terminal** na pasta `backend`:
   ```bash
   cd backend
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure o Banco de Dados** (Veja a seção "MongoDB Atlas" abaixo).

4. **Inicie o servidor**:
   ```bash
   npm start
   ```
   Você verá a mensagem: `🚀 Server running on http://localhost:3000`

---

## 🍃 Configurando o MongoDB Atlas (Grátis)

Para que o sistema funcione online, você precisa de um banco de dados. Siga os passos:

1. Acesse [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) e crie uma conta gratuita.
2. Crie um novo **Cluster** (o plano "M0 Sandbox" é grátis).
3. Em **Database Access**, crie um usuário e senha (ex: `admin` / `senha123`). **Anote a senha!**
4. Em **Network Access**, adicione o IP `0.0.0.0/0` (Allow Access from Anywhere) para permitir conexões de qualquer lugar.
5. Vá em **Database** > **Connect** > **Drivers**.
6. Copie a **Connection String**. Ela se parece com isso:
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`

### Atualizando o arquivo `.env`

1. Abra o arquivo `.env` dentro da pasta `backend`.
2. Substitua `SEU_USUARIO`, `SUA_SENHA` e `SEU_CLUSTER` pelos dados reais.
3. Exemplo final:
   ```env
   MONGO_URI=mongodb+srv://admin:minhasenha123@cluster0.abcde.mongodb.net/parking-agc?retryWrites=true&w=majority
   ```

---

## 📱 Conectando o Frontend

O frontend (React) já está configurado para tentar conectar em `http://localhost:3000/api`.
Se o servidor estiver rodando, o ícone de Wi-Fi no app ficará **Verde**. Se estiver desligado, o app funciona em **Modo Offline** (salvando no navegador).
