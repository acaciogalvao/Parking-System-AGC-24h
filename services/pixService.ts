

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

    // Identificador de Payload (00)
    let payload = "000201";

    // Merchant Account Information (26)
    // ID 00: GUID do Pix (fixo)
    // ID 01: Chave Pix
    let merchantAccount = "26";

    // ID 00: GUID do Pix (fixo)
    const gui = "0014BR.GOV.BCB.PIX";
    
    // ID 01: Chave Pix (a chave é o subcampo 01)
    const key = `01${String(pixKey).length.toString().padStart(2, '0')}${pixKey}`;
    
    const merchantAccountContent = `${gui}${key}`;
    merchantAccount += String(merchantAccountContent.length).padStart(2, '0') + merchantAccountContent;

    // Merchant Category Code (52)
    payload += merchantAccount;
    payload += "52040000"; // Merchant Category Code (MCC) - 0000 para "Outros"

    // Transaction Currency (53)
    payload += "5303986"; // 986 = BRL

    // Transaction Amount (54)
    payload += `54${String(formattedAmount).length.toString().padStart(2, '0')}${formattedAmount}`;

    // Country Code (58)
    payload += "5802BR";

    // Merchant Name (59)
    payload += `59${String(merchantName).length.toString().padStart(2, '0')}${merchantName}`;

    // Merchant City (60)
    payload += `60${String(merchantCity).length.toString().padStart(2, '0')}${merchantCity}`;

    // Transaction ID (62)
    let additionalData = "62";
    let txidContent = `05${String(txid).length.toString().padStart(2, '0')}${txid}`;
    additionalData += String(txidContent.length).padStart(2, '0') + txidContent;
    payload += additionalData;

    // CRC16 (63) - O CRC16 deve ser calculado sobre todo o payload, incluindo o 6304
    payload += "6304";

    // Função para calcular o CRC16 (simplificada para o contexto)
    const crc16 = (data: string): string => {
        let crc = 0xFFFF;
        for (let i = 0; i < data.length; i++) {
            crc ^= data.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
            }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    };

    const finalPayload = payload + crc16(payload);
    
    return finalPayload;
};
