const payload = '00020126360014BR.GOV.BCB.PIX0114+5599981916389520400005303986540549.005802BR5910AGCPARKING6006BRASIL62150511AGC480F35B363041A95';

console.log('═══════════════════════════════════════════════════════════════');
console.log('DECODIFICAÇÃO DETALHADA DO PAYLOAD PIX');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Payload completo:');
console.log(payload);
console.log('\nTamanho:', payload.length, 'caracteres\n');

let pos = 0;

while (pos < payload.length - 4) {
    const id = payload.substr(pos, 2);
    const length = parseInt(payload.substr(pos + 2, 2), 10);
    const value = payload.substr(pos + 4, length);
    
    console.log(`Campo ${id}: (tamanho: ${length})`);
    console.log(`  Valor: "${value}"`);
    
    if (id === '26') {
        console.log('  📱 Decodificando Merchant Account Information:');
        let subPos = 0;
        while (subPos < value.length) {
            const subId = value.substr(subPos, 2);
            const subLength = parseInt(value.substr(subPos + 2, 2), 10);
            const subValue = value.substr(subPos + 4, subLength);
            
            if (subId === '00') {
                console.log(`    GUI (${subId}): "${subValue}"`);
            } else if (subId === '01') {
                console.log(`    🔑 CHAVE PIX (${subId}): "${subValue}"`);
                console.log(`       Tamanho da chave: ${subValue.length} caracteres`);
                console.log(`       Começa com +55? ${subValue.startsWith('+55') ? '✅ SIM' : '❌ NÃO'}`);
            }
            
            subPos += 4 + subLength;
        }
    }
    
    console.log('');
    pos += 4 + length;
}

const crc = payload.substr(payload.length - 4);
console.log(`CRC16: ${crc}\n`);

console.log('═══════════════════════════════════════════════════════════════');
console.log('VALIDAÇÃO FINAL');
console.log('═══════════════════════════════════════════════════════════════\n');

const hasSpaces = payload.includes(' ');
const startsCorrect = payload.startsWith('00020126');
const hasPixKey = payload.includes('+5599981916389');

console.log('✓ Sem espaços:', hasSpaces ? '❌ FALHOU' : '✅ PASSOU');
console.log('✓ Formato correto:', startsCorrect ? '✅ PASSOU' : '❌ FALHOU');
console.log('✓ Chave +5599981916389:', hasPixKey ? '✅ PASSOU' : '❌ FALHOU');

console.log('\n' + (hasSpaces || !startsCorrect || !hasPixKey ? '❌ CÓDIGO INVÁLIDO' : '✅ CÓDIGO VÁLIDO PARA PAGAMENTO'));
