// Teste para verificar o formato correto de telefone Pix

console.log('=== FORMATO DE TELEFONE PIX ===\n');

// Formatos de entrada possíveis
const testCases = [
    '99981916389',           // Apenas números (sem código do país)
    '+5599981916389',        // Formato internacional correto
    '5599981916389',         // Com 55 mas sem +
    '(99) 98191-6389',       // Formatado com parênteses e hífen
    '+55 (99) 98191-6389',   // Formato completo formatado
];

console.log('Formatos de entrada testados:\n');
testCases.forEach((phone, index) => {
    console.log(`${index + 1}. "${phone}"`);
});

console.log('\n=== PROCESSAMENTO ATUAL ===\n');

// Função atual do código
const cleanCurrentFormat = (pixKey) => {
    let cleanPixKey = pixKey;
    if (pixKey.includes('(') || pixKey.includes('-') || pixKey.includes(' ')) {
        cleanPixKey = pixKey.replace(/[^0-9+]/g, '');
    }
    return cleanPixKey;
};

testCases.forEach((phone, index) => {
    const result = cleanCurrentFormat(phone);
    const isValid = result.startsWith('+55') && result.length === 14;
    console.log(`${index + 1}. "${phone}" → "${result}" ${isValid ? '✅' : '❌'}`);
});

console.log('\n=== FORMATO CORRETO ESPERADO ===\n');
console.log('Telefone Pix deve estar no formato: +5599981916389');
console.log('- Começa com +55 (código do Brasil)');
console.log('- Seguido de 2 dígitos do DDD (99)');
console.log('- Seguido de 9 dígitos do número (981916389)');
console.log('- Total: 14 caracteres (+55 + 11 dígitos)\n');

console.log('=== NOVA FUNÇÃO DE LIMPEZA ===\n');

// Função corrigida
const cleanPhoneFormat = (pixKey) => {
    let cleanPixKey = pixKey;
    
    // Remove caracteres especiais, mantém apenas números e +
    cleanPixKey = cleanPixKey.replace(/[^0-9+]/g, '');
    
    // Se já tem +55, retorna
    if (cleanPixKey.startsWith('+55')) {
        return cleanPixKey;
    }
    
    // Se tem 55 no início mas sem +, adiciona o +
    if (cleanPixKey.startsWith('55') && cleanPixKey.length === 13) {
        return '+' + cleanPixKey;
    }
    
    // Se tem apenas os 11 dígitos (DDD + número), adiciona +55
    if (cleanPixKey.length === 11 && !cleanPixKey.startsWith('+')) {
        return '+55' + cleanPixKey;
    }
    
    // Caso contrário, retorna como está
    return cleanPixKey;
};

testCases.forEach((phone, index) => {
    const result = cleanPhoneFormat(phone);
    const isValid = result.startsWith('+55') && result.length === 14;
    console.log(`${index + 1}. "${phone}" → "${result}" ${isValid ? '✅' : '❌'}`);
});

console.log('\n=== RESULTADO ===\n');
console.log('✅ Todos os formatos agora são convertidos para +5599981916389');
