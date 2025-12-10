#!/usr/bin/env python3
import qrcode
import sys

# Payload de teste (CPF)
payload = "00020126330014BR.GOV.BCB.PIX011112345678900520400005303986540525.505802BR5911AGC PARKING6009SAO PAULO62150511AGC1234567863045C43"

print("=== GERADOR DE QR CODE PIX ===\n")
print(f"Payload: {payload}")
print(f"Tamanho: {len(payload)} caracteres\n")

# Gerar QR Code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)

qr.add_data(payload)
qr.make(fit=True)

# Salvar imagem
img = qr.make_image(fill_color="black", back_color="white")
output_path = "/home/ubuntu/Parking-System-AGC-24h/qrcode_pix_test.png"
img.save(output_path)

print(f"✓ QR Code gerado com sucesso!")
print(f"✓ Arquivo salvo em: {output_path}\n")

# Mostrar QR Code no terminal (ASCII)
print("QR Code (ASCII):")
qr.print_ascii(invert=True)

print("\n=== CÓDIGO COPIA E COLA ===")
print(payload)
print("\n=== INSTRUÇÕES ===")
print("1. Abra o arquivo qrcode_pix_test.png para ver o QR Code")
print("2. Escaneie com um app de banco para testar")
print("3. Ou copie o código acima e cole no app (Pix Copia e Cola)")
