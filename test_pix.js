// Script de teste para validar a geração do payload Pix

// Função para gerar o Payload Pix (BR Code)
const generatePixPayload = (pixKey, merchantName, merchantCity, amount, txid) => {
    
    // Formatação do valor (sempre com 2 casas decimais)
    const formattedAmount = amount.toFixed(2);

    // Função para criar campo EMV
    const emvField = (id, value) => {
        const length = value.length.toString().padStart(2, '0');
        return `${id}${length}${value}`;
    };

    // Identificador de Payload Format Indicator (00)
    let payload = emvField('00', '01');

    // Merchant Account Information (26)
    // Subcampos: GUI (00) e Chave Pix (01)
    const gui = emvField('00', 'BR.GOV.BCB.PIX');
    const key = emvField('01', pixKey);
    const merchantAccountContent = gui + key;
    payload += emvField('26', merchantAccountContent);

    // Merchant Category Code (52)
    payload += emvField('52', '0000'); // 0000 = Outros

    // Transaction Currency (53)
    payload += emvField('53', '986'); // 986 = BRL

    // Transaction Amount (54)
    payload += emvField('54', formattedAmount);

    // Country Code (58)
    payload += emvField('58', 'BR');

    // Merchant Name (59)
    // Normalizar o nome do comerciante (remover acentos e caracteres especiais)
    const normalizedMerchantName = merchantName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .substring(0, 25);
    payload += emvField('59', normalizedMerchantName);

    // Merchant City (60)
    // Normalizar o nome da cidade
    const normalizedMerchantCity = merchantCity
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .substring(0, 15);
    payload += emvField('60', normalizedMerchantCity);

    // Additional Data Field Template (62)
    // Subcampo: Transaction ID (05)
    const txidField = emvField('05', txid.substring(0, 25));
    payload += emvField('62', txidField);

    // CRC16 (63) - Placeholder
    payload += '6304';

    // Função para calcular o CRC16 CCITT
    const crc16 = (data) => {
        let crc = 0xFFFF;
        const polynomial = 0x1021;
        
        for (let i = 0; i < data.length; i++) {
            crc ^= data.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ polynomial;
                } else {
                    crc = crc << 1;
                }
            }
        }
        
        crc = crc & 0xFFFF;
        return crc.toString(16).toUpperCase().padStart(4, '0');
    };

    // Calcular CRC16 e adicionar ao payload
    const finalPayload = payload + crc16(payload);
    
    return finalPayload;
};

// Testes com diferentes tipos de chave Pix
console.log('\n=== TESTE DE GERAÇÃO DE PAYLOAD PIX ===\n');

// Teste 1: CPF
const payload1 = generatePixPayload(
    '12345678900',
    'AGC PARKING',
    'SAO PAULO',
    25.50,
    'AGC12345678'
);
console.log('Teste 1 - CPF:');
console.log('Payload:', payload1);
console.log('Tamanho:', payload1.length, 'caracteres');
console.log('');

// Teste 2: CNPJ
const payload2 = generatePixPayload(
    '12345678000190',
    'AGC PARKING',
    'RIO DE JANEIRO',
    100.00,
    'AGC87654321'
);
console.log('Teste 2 - CNPJ:');
console.log('Payload:', payload2);
console.log('Tamanho:', payload2.length, 'caracteres');
console.log('');

// Teste 3: Email
const payload3 = generatePixPayload(
    'pagamento@agcparking.com.br',
    'AGC PARKING',
    'BRASIL',
    50.75,
    'AGCTEST001'
);
console.log('Teste 3 - Email:');
console.log('Payload:', payload3);
console.log('Tamanho:', payload3.length, 'caracteres');
console.log('');

// Teste 4: Telefone
const payload4 = generatePixPayload(
    '+5511999887766',
    'AGC PARKING',
    'BRASILIA',
    15.00,
    'AGCPHONE01'
);
console.log('Teste 4 - Telefone:');
console.log('Payload:', payload4);
console.log('Tamanho:', payload4.length, 'caracteres');
console.log('');

// Teste 5: Chave Aleatória
const payload5 = generatePixPayload(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'AGC PARKING',
    'CURITIBA',
    200.00,
    'AGCRANDOM1'
);
console.log('Teste 5 - Chave Aleatória:');
console.log('Payload:', payload5);
console.log('Tamanho:', payload5.length, 'caracteres');
console.log('');

console.log('=== VALIDAÇÃO DA ESTRUTURA ===\n');

// Função para validar estrutura básica do payload
const validatePayload = (payload) => {
    const checks = {
        'Inicia com 000201': payload.startsWith('000201'),
        'Contém campo 26 (Merchant Account)': payload.includes('26'),
        'Contém campo 52 (MCC)': payload.includes('52040000'),
        'Contém campo 53 (Currency)': payload.includes('5303986'),
        'Contém campo 54 (Amount)': payload.includes('54'),
        'Contém campo 58 (Country)': payload.includes('5802BR'),
        'Contém campo 59 (Merchant Name)': payload.includes('59'),
        'Contém campo 60 (Merchant City)': payload.includes('60'),
        'Contém campo 62 (Additional Data)': payload.includes('62'),
        'Termina com CRC (6304)': payload.includes('6304')
    };
    
    console.log('Validação do Payload 1:');
    for (const [check, result] of Object.entries(checks)) {
        console.log(`  ${result ? '✓' : '✗'} ${check}`);
    }
    
    const allValid = Object.values(checks).every(v => v);
    console.log(`\nResultado: ${allValid ? '✓ VÁLIDO' : '✗ INVÁLIDO'}\n`);
    
    return allValid;
};

validatePayload(payload1);

console.log('=== INSTRUÇÕES DE USO ===\n');
console.log('1. Copie o payload gerado');
console.log('2. Use um aplicativo de banco para escanear o QR Code');
console.log('3. Ou cole o código diretamente no app (Pix Copia e Cola)');
console.log('4. Verifique se o valor e o nome do comerciante estão corretos\n');
