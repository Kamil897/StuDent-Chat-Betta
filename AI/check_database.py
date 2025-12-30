"""
Проверка и автоматическое создание базы данных
"""

import mysql.connector
from config import DATABASE_CONFIG

def check_and_create_database():
    """Проверка и создание базы данных если нужно"""
    try:
        # Подключение без указания базы данных
        config = DATABASE_CONFIG.copy()
        database_name = config.pop('database')
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # Проверка существования базы данных
        cursor.execute(f"SHOW DATABASES LIKE '{database_name}'")
        if not cursor.fetchone():
            cursor.execute(f"CREATE DATABASE {database_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ База данных {database_name} создана")
        
        cursor.execute(f"USE {database_name}")
        
        # Проверка существования таблиц
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        required_tables = ['users', 'knowledge_base', 'interactions', 'agents', 
                          'agent_responses', 'performance_metrics', 'learning_tasks',
                          'neural_network_history', 'visualizations']
        
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            print(f"⚠️  Отсутствуют таблицы: {', '.join(missing_tables)}")
            print("💡 Запустите: py init_database.py")
            cursor.close()
            connection.close()
            return False
        else:
            print("✅ Все таблицы существуют")
            cursor.close()
            connection.close()
            return True
            
    except Exception as e:
        print(f"❌ Ошибка проверки БД: {e}")
        return False

if __name__ == "__main__":
    check_and_create_database()

