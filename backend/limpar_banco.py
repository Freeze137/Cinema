import sqlite3

# Conecta ao seu arquivo de banco de dados
conn = sqlite3.connect('kinoplex.db')
cursor = conn.cursor()

try:
    # 1. Deleta as reservas antigas
    cursor.execute("DELETE FROM reservas;")
    
    # 2. Reseta o status dos assentos
    cursor.execute("UPDATE assentos SET status='DISPONIVEL';")
    
    conn.commit()
    print("✅ Sucesso: Reservas apagadas e assentos liberados!")
except Exception as e:
    print(f"❌ Erro ao limpar o banco: {e}")
finally:
    conn.close()