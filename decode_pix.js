const generatePixPayload = (pixKey, merchantName, merchantCity, amount, txid) => {
    const formattedAmount = amount.toFixed(2);
    const emvField = (id, value) => {
        const length = value.length.toString().padStart(2, '0');
        return `${id}${length}${value}`;
    };
    let payload = emvField('00', '01');
    let cleanPixKey = pixKey;
    if (pixKey.includes('(') || pixKey.includes('-') || pixKey.includes(' ')) {
        cleanPixKey = pixKey.replace(/[^0-9+]/g, '');
    }
    const gui = emvField('00', 'BR.GOV.BCB.PIX');
    const key = emvField('01', cleanPixKey);
    const merchantAccountContent = gui + key;
    payload += emvField('26', merchantAccountContent);
    payload += emvField('52', '0000');
    payload += emvField('53', '986');
    payload += emvField('54', formattedAmount);
    payload += emvField('58', 'BR');
    const normalizedMerchantName = merchantName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .toUpperCase()
        .substring(0, 25);
    payload += emvField('59', normalizedMerchantName);
    const normalizedMerchantCity = merchantCity
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .toUpperCase()
        .substring(0, 15);
    payload += emvField('60', normalizedMerchantCity);
    const txidField = emvField('05', txid.substring(0, 25));
    payload += emvField('62', txidField);
    payload += '6304';
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
    const finalPayload = payload + crc16(payload);
    return finalPayload;
};

// Função para decodificar o payload Pix
const decodePixPayload = (payload) => {
    console.log('\n=== DECODIFICAÇÃO DO PAYLOAD PIX ===\n');
    console.log('Payload completo:', payload);
    console.log('Tamanho:', payload.length, 'caracteres\n');
    
    let pos = 0;
    const fields = [];
    
    while (pos < payload.length - 4) { // -4 para o CRC no final
        const id = payload.substr(pos, 2);
        const length = parseInt(payload.substr(pos + 2, 2), 10);
        const value = payload.substr(pos + 4, length);
        
        fields.push({ id, length, value });
        
        console.log(`Campo ${id}:`);
        console.log(`  Tamanho: ${length}`);
        console.log(`  Valor: "${value}"`);
        
        // Decodificar subcampos do campo 26 (Merchant Account)
        if (id === '26') {
            console.log('  Subcampos:');
            let subPos = 0;
            while (subPos < value.length) {
                const subId = value.substr(subPos, 2);
                const subLength = parseInt(value.substr(subPos + 2, 2), 10);
                const subValue = value.substr(subPos + 4, subLength);
                console.log(`    ${subId}: "${subValue}"`);
                subPos += 4 + subLength;
            }
        }
        
        // Decodificar subcampos do campo 62 (Additional Data)
        if (id === '62') {
            console.log('  Subcampos:');
            let subPos = 0;
            while (subPos < value.length) {
                const subId = value.substr(subPos, 2);
                const subLength = parseInt(value.substr(subPos + 2, 2), 10);
                const subValue = value.substr(subPos + 4, subLength);
                console.log(`    ${subId}: "${subValue}"`);
                subPos += 4 + subLength;
            }
        }
        
        console.log('');
        pos += 4 + length;
    }
    
    const crc = payload.substr(payload.length - 4);
    console.log('CRC16:', crc);
    console.log('\n');
    
    return fields;
};

// Teste com diferentes chaves
console.log('\n========================================');
console.log('TESTE 1: Telefone com formatação');
console.log('========================================');
const payload1 = generatePixPayload('(99) 98191-6389', 'AGC PARKING', 'BRASIL', 49.00, 'AGC480F35B3');
decodePixPayload(payload1);

console.log('\n========================================');
console.log('TESTE 2: CPF');
console.log('========================================');
const payload2 = generatePixPayload('12345678900', 'AGC PARKING', 'SAO PAULO', 25.50, 'AGC12345678');
decodePixPayload(payload2);

console.log('\n========================================');
console.log('TESTE 3: Email');
console.log('========================================');
const payload3 = generatePixPayload('contato@agcparking.com', 'AGC PARKING', 'CURITIBA', 100.00, 'AGCTEST123');
decodePixPayload(payload3);
