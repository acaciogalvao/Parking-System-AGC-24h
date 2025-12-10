require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// --- CARREGAMENTO DE CONFIGURAÇÃO ---
// O dotenv já carrega automaticamente do .env, não é necessário código extra.
// O arquivo env_visible.txt foi substituído por .env para seguir as boas práticas.

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(bodyParser.json());

// --- MONGODB CONNECTION ---
let dbConnected = false;
const connectDB = async () => {
    if (!MONGO_URI || MONGO_URI.includes('<db_password>')) {
        console.error("❌ ERRO: MongoDB URI inválida. Edite 'backend/env_visible.txt'.");
        return;
    }
    try {
        await mongoose.connect(MONGO_URI);
        dbConnected = true;
        console.log('✅ MongoDB Atlas Conectado!');
        await initializeDefaults();
    } catch (err) {
        console.error('❌ Falha na conexão MongoDB:', err.message);
    }
};

// --- HEALTH CHECK ENDPOINT ---
app.get('/api/health', (req, res) => {
    if (dbConnected) {
        res.status(200).json({ status: 'Online', db: 'Connected' });
    } else {
        res.status(503).json({ status: 'Offline', db: 'Disconnected' });
    }
});

// --- SCHEMAS ---
const SettingsSchema = new mongoose.Schema({ config: Object, rates: Object }, { timestamps: true });
const Settings = mongoose.model('Settings', SettingsSchema);

const RecordSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    plate: String,
    type: String,
    spotNumber: Number,
    entryTime: Number,
    exitTime: Number,
    status: String,
    totalCost: Number,
    paymentMethod: String,
    notes: String,
    entryImage: String
});
const Record = mongoose.model('Record', RecordSchema);

const PaymentSchema = new mongoose.Schema({
    txid: { type: String, required: true, index: true },
    amount: Number,
    status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
    paidAt: Date,
    rawPayload: Object
}, { timestamps: true });
const Payment = mongoose.model('Payment', PaymentSchema);

// --- INITIALIZATION ---
async function initializeDefaults() {
    if (!dbConnected) return;
    const count = await Settings.countDocuments();
    if (count === 0) {
        await Settings.create({
            config: { pixKey: '', pixKeyType: 'CPF', totalSpots: { CAR: 50, MOTORCYCLE: 20, TRUCK: 10 } },
            rates: { CAR: 10, MOTORCYCLE: 5, TRUCK: 20 }
        });
    }
}

connectDB();

// --- ROTAS API ---

// 1. Sincronização Inicial
app.get('/api/sync', async (req, res) => {
    if (!dbConnected) return res.json({ error: "Offline" });
    const settings = await Settings.findOne().sort({ createdAt: -1 });
    res.json(settings || {});
});

// 2. Operações de Registros (CRUD)
app.get('/api/records', async (req, res) => {
    if (!dbConnected) return res.json([]);
    const records = await Record.find().sort({ entryTime: -1 }).limit(100);
    res.json(records);
});

app.post('/api/records', async (req, res) => {
    if (!dbConnected) return res.status(503).send("Database Offline");
    try {
        const newRecord = await Record.create(req.body);
        res.status(201).json(newRecord);
    } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/records/:id', async (req, res) => {
    if (!dbConnected) return res.status(503).send("Database Offline");
    try {
        const updated = await Record.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Configurações
app.post('/api/settings', async (req, res) => {
    if (!dbConnected) return res.status(503).send("Database Offline");
    try {
        await Settings.deleteMany({}); // Mantém apenas 1 config
        await Settings.create(req.body);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. PIX - Criação de Intenção de Pagamento (Chamado pelo App ao gerar QR Code)
app.post('/api/payment/create', async (req, res) => {
    if (!dbConnected) return res.status(200).send("Mock OK");
    try {
        const { txid, amount } = req.body;
        // Cria ou atualiza a intenção
        await Payment.findOneAndUpdate(
            { txid },
            { txid, amount, status: 'PENDING' },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. PIX - Verificação de Status (Polling do App)
app.get('/api/payment/status/:txId', async (req, res) => {
    if (!dbConnected) return res.json({ paid: false });
    try {
        const { txId } = req.params;
        // Busca insensível a maiúsculas/minúsculas
        const payment = await Payment.findOne({ 
            txid: { $regex: new RegExp(`^${txId}$`, 'i') }, 
            status: 'PAID' 
        });
        res.json({ paid: !!payment });
    } catch (e) {
        console.error(e);
        res.json({ paid: false });
    }
});

// 6. PIX - WEBHOOK (Recebe notificação do Banco)
// Configure seu banco para enviar POST para: https://seu-dominio.com/api/webhook/pix
app.post('/api/webhook/pix', async (req, res) => {
    console.log("🔔 Webhook Recebido:", JSON.stringify(req.body));
    
    if (!dbConnected) return res.status(200).send('OK (Offline Mode)');

    try {
        const body = req.body;
        let paymentsToProcess = [];

        // Normalização de Payloads (Diferentes Bancos)
        if (body.pix && Array.isArray(body.pix)) {
            // Padrão Bacen (Lista de pix recebidos)
            paymentsToProcess = body.pix;
        } else if (body.txid) {
            // Alguns bancos enviam o objeto direto
            paymentsToProcess = [body];
        }

        for (const p of paymentsToProcess) {
            const txid = p.txid || p.endToEndId; // Fallback se não tiver txid
            if (txid) {
                console.log(`💰 Pagamento Confirmado: ${txid}`);
                await Payment.findOneAndUpdate(
                    { txid: { $regex: new RegExp(`^${txid}$`, 'i') } },
                    { 
                        status: 'PAID', 
                        paidAt: new Date(),
                        rawPayload: p 
                    },
                    { upsert: true, new: true }
                );
            }
        }
    } catch (e) {
        console.error("Erro Webhook:", e);
    }
    
    // Sempre retornar 200 OK para o banco não bloquear o webhook
    res.status(200).send('OK');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server AGC Parking rodando na porta ${PORT}`);
});