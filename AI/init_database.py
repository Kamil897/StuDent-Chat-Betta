"""
Скрипт для инициализации базы данных
"""

import sys
import io
import mysql.connector
from config import DATABASE_CONFIG

# Исправление кодировки для Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def init_database():
    """Инициализация базы данных"""
    try:
        # Подключение без указания базы данных
        config = DATABASE_CONFIG.copy()
        database_name = config.pop('database')
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # Создание базы данных
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"[OK] База данных {database_name} создана или уже существует")
        
        # Использование базы данных
        cursor.execute(f"USE {database_name}")
        
        # Чтение и выполнение SQL скрипта
        try:
            with open('database_schema.sql', 'r', encoding='utf-8') as f:
                sql_script = f.read()
        except FileNotFoundError:
            print("[ERROR] Файл database_schema.sql не найден!")
            return False
        
        # Выполнение SQL скрипта построчно
        lines = sql_script.split('\n')
        current_query = []
        
        for line in lines:
            # Удаление комментариев
            if '--' in line:
                line = line[:line.index('--')]
            line = line.strip()
            
            # Пропускаем пустые строки и USE
            if not line or line.upper().startswith('USE '):
                continue
            
            current_query.append(line)
            
            # Если строка заканчивается на ;, выполняем запрос
            if line.endswith(';'):
                query = ' '.join(current_query)
                query = query.rstrip(';').strip()
                
                if query and len(query) > 10:  # Минимальная длина запроса
                    try:
                        cursor.execute(query)
                        # Определяем имя таблицы
                        if 'CREATE TABLE' in query.upper():
                            parts = query.upper().split()
                            if 'IF NOT EXISTS' in query.upper():
                                idx = parts.index('EXISTS')
                                if idx + 1 < len(parts):
                                    table_name = parts[idx + 1]
                                else:
                                    table_name = 'unknown'
                            else:
                                idx = parts.index('TABLE')
                                if idx + 1 < len(parts):
                                    table_name = parts[idx + 1]
                                else:
                                    table_name = 'unknown'
                            print(f"[OK] Создана таблица: {table_name}")
                        elif 'INSERT' in query.upper():
                            print(f"[OK] Добавлены агенты")
                    except mysql.connector.Error as e:
                        error_msg = str(e).lower()
                        if "already exists" not in error_msg and "duplicate" not in error_msg:
                            print(f"[WARNING] Ошибка: {e}")
                            if 'CREATE TABLE' in query.upper():
                                print(f"   Запрос: {query[:100]}...")
                
                current_query = []
        
        connection.commit()
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print("\n[OK] База данных успешно инициализирована!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Ошибка инициализации: {e}")
        return False

if __name__ == "__main__":
    print("="*70)
    print(" " * 20 + "ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ")
    print("="*70 + "\n")
    init_database()

