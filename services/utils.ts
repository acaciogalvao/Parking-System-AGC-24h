// Função de cópia universal (compatível com a maioria dos navegadores)
export const copyToClipboard = async (text: string): Promise<boolean> => {
    // 1. Tenta usar a API moderna (navigator.clipboard)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Erro ao copiar via navigator.clipboard:', err);
            // Continua para o fallback
        }
    }

    // 2. Fallback para o método antigo (document.execCommand)
    let textArea;
    try {
        textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Evita que o teclado virtual apareça em dispositivos móveis
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Tenta executar o comando de cópia
        const success = document.execCommand('copy');
        
        if (success) {
            return true;
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        return false;
    } finally {
        if (textArea) {
            document.body.removeChild(textArea);
        }
    }
    
    return false;
};
