#!/bin/bash

echo "🚀 Iniciando Sistema de Estacionamento AGC 24h"
echo ""

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependências do backend..."
    cd backend && npm install && cd ..
fi

# Verificar se o .env do backend está configurado
if grep -q "<username>" backend/.env 2>/dev/null; then
    echo "⚠️  ATENÇÃO: Configure o arquivo backend/.env com suas credenciais do MongoDB"
    echo "   Edite backend/.env e substitua <username>, <password> e <cluster>"
    echo ""
fi

echo "🔧 Iniciando backend na porta 3000..."
cd backend && npm start &
BACKEND_PID=$!

sleep 3

echo "🎨 Iniciando frontend..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Sistema iniciado!"
echo "   Backend: http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Pressione Ctrl+C para parar os servidores"

# Aguardar interrupção
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
