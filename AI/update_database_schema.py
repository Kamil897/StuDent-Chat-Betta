"""
Скрипт для обновления схемы БД (добавление поля plot_image)
"""

import sys
import io
import mysql.connector
from config import DATABASE_CONFIG

# Исправление кодировки для Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def update_schema():
    """Обновление схемы БД - добавление поля для изображений"""
    try:
        connection = mysql.connector.connect(**DATABASE_CONFIG)
        cursor = connection.cursor()
        
        # Проверка существования поля
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'AI' 
            AND TABLE_NAME = 'visualizations' 
            AND COLUMN_NAME = 'plot_image'
        """)
        
        if cursor.fetchone():
            print("[INFO] Поле plot_image уже существует")
        else:
            # Добавление поля
            cursor.execute("""
                ALTER TABLE visualizations 
                ADD COLUMN plot_image LONGBLOB AFTER file_path
            """)
            print("[OK] Поле plot_image добавлено в таблицу visualizations")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print("[OK] Схема базы данных обновлена!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Ошибка обновления схемы: {e}")
        return False

if __name__ == "__main__":
    print("="*70)
    print(" " * 20 + "ОБНОВЛЕНИЕ СХЕМЫ БАЗЫ ДАННЫХ")
    print("="*70 + "\n")
    update_schema()

