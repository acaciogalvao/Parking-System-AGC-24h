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

const payload = generatePixPayload('12345678900', 'AGC PARKING', 'SAO PAULO', 25.50, 'AGC12345678');

console.log('Payload gerado:');
console.log(payload);
console.log('\nVerificando espaços:');
console.log('Contém espaços?', payload.includes(' ') ? 'SIM ❌' : 'NÃO ✅');
console.log('Número de espaços:', (payload.match(/ /g) || []).length);

if (payload.includes(' ')) {
    console.log('\nPosições dos espaços:');
    for (let i = 0; i < payload.length; i++) {
        if (payload[i] === ' ') {
            console.log(`  Posição ${i}: "${payload.substring(i-5, i+5)}"`);
        }
    }
}
