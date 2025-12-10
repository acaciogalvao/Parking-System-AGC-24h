

// Função para gerar o Payload Pix (BR Code) - Estático
// Baseado nas especificações do Banco Central (BR Code)
export const generatePixPayload = (
    pixKey: string, 
    merchantName: string, 
    merchantCity: string, 
    amount: number, 
    txid: string
): string => {
    
    // Formatação do valor (sempre com 2 casas decimais)
    const formattedAmount = amount.toFixed(2);

    // Função para criar campo EMV
    const emvField = (id: string, value: string): string => {
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
        .substring(0, 25); // Limite de 25 caracteres
    payload += emvField('59', normalizedMerchantName);

    // Merchant City (60)
    // Normalizar o nome da cidade
    const normalizedMerchantCity = merchantCity
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .substring(0, 15); // Limite de 15 caracteres
    payload += emvField('60', normalizedMerchantCity);

    // Additional Data Field Template (62)
    // Subcampo: Transaction ID (05)
    const txidField = emvField('05', txid.substring(0, 25)); // Limite de 25 caracteres
    payload += emvField('62', txidField);

    // CRC16 (63) - Placeholder
    payload += '6304';

    // Função para calcular o CRC16 CCITT
    const crc16 = (data: string): string => {
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
