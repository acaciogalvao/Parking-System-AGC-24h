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
    
    // ⚠️ CORREÇÃO: Limpar e formatar a chave Pix corretamente
    let cleanPixKey = pixKey;
    
    // Remove caracteres especiais, mantém apenas números e +
    cleanPixKey = cleanPixKey.replace(/[^0-9+@.\-a-zA-Z]/g, '');
    
    // Se parece ser um telefone (apenas dígitos ou com formatação), formata corretamente
    const onlyDigits = cleanPixKey.replace(/[^0-9]/g, '');
    
    // Telefone brasileiro: 11 dígitos (DDD + número) - começa com DDD (10-99)
    // CPF também tem 11 dígitos, mas não começa com DDD válido
    const looksLikePhone = onlyDigits.length === 11 && 
                          parseInt(onlyDigits.substring(0, 2)) >= 11 && 
                          parseInt(onlyDigits.substring(0, 2)) <= 99 &&
                          (onlyDigits[2] === '9' || pixKey.includes('(') || pixKey.includes('-') || pixKey.includes(' '));
    
    if (looksLikePhone && !cleanPixKey.includes('@') && !cleanPixKey.includes('.')) {
        // Se já tem +55, mantém
        if (cleanPixKey.startsWith('+55')) {
            cleanPixKey = cleanPixKey.replace(/[^0-9+]/g, '');
        }
        // Se tem 55 no início mas sem +, adiciona o +
        else if (onlyDigits.startsWith('55') && onlyDigits.length === 13) {
            cleanPixKey = '+' + onlyDigits;
        }
        // Se tem apenas 11 dígitos, adiciona +55
        else {
            cleanPixKey = '+55' + onlyDigits;
        }
    }
    // Para outros tipos de chave (CPF, CNPJ, email, aleatória), apenas limpa caracteres inválidos
    else if (cleanPixKey.includes('@')) {
        // Email: mantém como está
        cleanPixKey = cleanPixKey.toLowerCase();
    }
    else if (cleanPixKey.includes('-') && cleanPixKey.length > 20) {
        // Chave aleatória (UUID): mantém como está
        cleanPixKey = cleanPixKey.toLowerCase();
    }
    else {
        // CPF/CNPJ: apenas números
        cleanPixKey = onlyDigits;
    }
    const gui = emvField('00', 'BR.GOV.BCB.PIX');
    const key = emvField('01', cleanPixKey);
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
    // Normalizar o nome do comerciante (remover acentos, caracteres especiais e espaços)
    const normalizedMerchantName = merchantName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .toUpperCase()
        .substring(0, 25); // Limite de 25 caracteres
    payload += emvField('59', normalizedMerchantName);

    // Merchant City (60)
    // Normalizar o nome da cidade (remover acentos, caracteres especiais e espaços)
    const normalizedMerchantCity = merchantCity
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
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
