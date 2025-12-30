"""
Класс для работы с MySQL базой данных
"""

import mysql.connector
from mysql.connector import Error
from typing import Dict, List, Any, Optional, Tuple
import json
import numpy as np
from datetime import datetime
from config import DATABASE_CONFIG


class DatabaseManager:
    """Менеджер базы данных для ИИ системы"""
    
    def __init__(self):
        self.config = DATABASE_CONFIG
        self.connection = None
        self.connect()
    
    def connect(self):
        """Подключение к базе данных"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            if self.connection.is_connected():
                print("✅ Подключение к MySQL успешно")
                return True
        except Error as e:
            print(f"❌ Ошибка подключения к MySQL: {e}")
            print("💡 Убедитесь, что база данных создана. Запустите: py init_database.py")
            return False
    
    def disconnect(self):
        """Отключение от базы данных"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("✅ Отключение от MySQL")
    
    def execute_query(self, query: str, params: tuple = None, fetch: bool = False) -> Any:
        """Выполнение SQL запроса"""
        if not self.connection or not self.connection.is_connected():
            return None if fetch else 0
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params)
            
            if fetch:
                result = cursor.fetchall()
                cursor.close()
                return result
            else:
                self.connection.commit()
                rowcount = cursor.rowcount
                cursor.close()
                return rowcount
        except Error as e:
            print(f"❌ Ошибка выполнения запроса: {e}")
            if self.connection:
                self.connection.rollback()
            return None if fetch else 0
    
    # ==================== РАБОТА С ПОЛЬЗОВАТЕЛЯМИ ====================
    
    def get_or_create_user(self, name: str) -> int:
        """Получить или создать пользователя"""
        if not self.connection or not self.connection.is_connected():
            return 0
        
        query = "SELECT id FROM users WHERE name = %s"
        result = self.execute_query(query, (name,), fetch=True)
        
        if result:
            return result[0]['id']
        else:
            query = "INSERT INTO users (name) VALUES (%s)"
            cursor = self.connection.cursor()
            cursor.execute(query, (name,))
            user_id = cursor.lastrowid
            self.connection.commit()
            cursor.close()
            return user_id
    
    def update_user_preferences(self, user_id: int, preferences: Dict[str, Any]):
        """Обновление предпочтений пользователя"""
        query = "UPDATE users SET preferences = %s WHERE id = %s"
        self.execute_query(query, (json.dumps(preferences), user_id))
    
    def get_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """Получение предпочтений пользователя"""
        query = "SELECT preferences FROM users WHERE id = %s"
        result = self.execute_query(query, (user_id,), fetch=True)
        if result and result[0]['preferences']:
            return json.loads(result[0]['preferences'])
        return {}
    
    # ==================== РАБОТА С БАЗОЙ ЗНАНИЙ ====================
    
    def add_knowledge(self, query: str, response: str, category: str = None, 
                     similarity_score: float = 0.0) -> int:
        """Добавление знания в базу"""
        query_sql = """
        INSERT INTO knowledge_base (query_text, response_text, category, similarity_score)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            usage_count = usage_count + 1,
            updated_at = CURRENT_TIMESTAMP
        """
        # Проверка на существование
        check_query = "SELECT id FROM knowledge_base WHERE query_text = %s LIMIT 1"
        existing = self.execute_query(check_query, (query,), fetch=True)
        
        if existing:
            update_query = """
            UPDATE knowledge_base 
            SET response_text = %s, usage_count = usage_count + 1, 
                similarity_score = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """
            self.execute_query(update_query, (response, similarity_score, existing[0]['id']))
            return existing[0]['id']
        else:
            cursor = self.connection.cursor()
            cursor.execute(query_sql, (query, response, category, similarity_score))
            knowledge_id = cursor.lastrowid
            self.connection.commit()
            cursor.close()
            return knowledge_id
    
    def find_similar_knowledge(self, query: str, top_k: int = 3, 
                               min_similarity: float = 0.3) -> List[Tuple[str, float]]:
        """Поиск похожих знаний (используя FULLTEXT поиск)"""
        query_sql = """
        SELECT query_text, response_text, similarity_score
        FROM knowledge_base
        WHERE MATCH(query_text, response_text) AGAINST(%s IN NATURAL LANGUAGE MODE)
        ORDER BY similarity_score DESC
        LIMIT %s
        """
        results = self.execute_query(query_sql, (query, top_k), fetch=True)
        
        if not results:
            # Fallback на простой поиск
            query_sql = """
            SELECT query_text, response_text, similarity_score
            FROM knowledge_base
            WHERE query_text LIKE %s OR response_text LIKE %s
            ORDER BY similarity_score DESC
            LIMIT %s
            """
            search_term = f"%{query}%"
            results = self.execute_query(query_sql, (search_term, search_term, top_k), fetch=True)
        
        return [(r['query_text'], float(r['similarity_score'])) 
                for r in results if r['similarity_score'] >= min_similarity]
    
    def get_knowledge_count(self) -> int:
        """Получение количества записей в базе знаний"""
        query = "SELECT COUNT(*) as count FROM knowledge_base"
        result = self.execute_query(query, fetch=True)
        return result[0]['count'] if result else 0
    
    # ==================== РАБОТА С ВЗАИМОДЕЙСТВИЯМИ ====================
    
    def save_interaction(self, user_id: int, query: str, response: str, 
                        execution_time: float, accuracy: float, relevance: float,
                        completeness: float, confidence: float, success: bool,
                        agent_used: str = None) -> int:
        """Сохранение взаимодействия"""
        if not self.connection or not self.connection.is_connected():
            return 0
        
        query_sql = """
        INSERT INTO interactions 
        (user_id, query_text, response_text, execution_time, accuracy, 
         relevance_score, completeness_score, confidence_score, success, agent_used)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor = self.connection.cursor()
        cursor.execute(query_sql, (
            user_id, query, response, execution_time, accuracy,
            relevance, completeness, confidence, success, agent_used
        ))
        interaction_id = cursor.lastrowid
        self.connection.commit()
        cursor.close()
        return interaction_id
    
    def get_interaction_history(self, user_id: int = None, limit: int = 100) -> List[Dict]:
        """Получение истории взаимодействий"""
        if user_id:
            query = """
            SELECT * FROM interactions 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT %s
            """
            return self.execute_query(query, (user_id, limit), fetch=True)
        else:
            query = """
            SELECT * FROM interactions 
            ORDER BY created_at DESC 
            LIMIT %s
            """
            return self.execute_query(query, (limit,), fetch=True)
    
    def get_avg_accuracy(self, limit: int = 10) -> float:
        """Получение средней точности за последние N взаимодействий"""
        query = """
        SELECT AVG(accuracy) as avg_accuracy 
        FROM (
            SELECT accuracy FROM interactions 
            ORDER BY created_at DESC 
            LIMIT %s
        ) as recent
        """
        result = self.execute_query(query, (limit,), fetch=True)
        return float(result[0]['avg_accuracy']) if result and result[0]['avg_accuracy'] else 0.0
    
    # ==================== РАБОТА С АГЕНТАМИ ====================
    
    def get_agents(self) -> List[Dict]:
        """Получение всех агентов"""
        query = "SELECT * FROM agents ORDER BY id"
        return self.execute_query(query, fetch=True)
    
    def update_agent_stats(self, agent_id: int, success: bool = True):
        """Обновление статистики агента"""
        query = """
        UPDATE agents 
        SET knowledge_count = knowledge_count + 1,
            total_responses = total_responses + 1,
            success_rate = CASE 
                WHEN total_responses = 0 THEN %s
                ELSE (success_rate * (total_responses - 1) + %s) / total_responses
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """
        success_value = 1.0 if success else 0.0
        self.execute_query(query, (success_value, success_value, agent_id))
    
    def save_agent_response(self, agent_id: int, interaction_id: int, 
                           query: str, response: str, confidence: float, 
                           selected: bool = False) -> int:
        """Сохранение ответа агента"""
        if not self.connection or not self.connection.is_connected():
            return 0
        
        query_sql = """
        INSERT INTO agent_responses 
        (agent_id, interaction_id, query_text, response_text, confidence, selected)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor = self.connection.cursor()
        cursor.execute(query_sql, (agent_id, interaction_id, query, response, confidence, selected))
        response_id = cursor.lastrowid
        self.connection.commit()
        cursor.close()
        return response_id
    
    # ==================== РАБОТА С МЕТРИКАМИ ====================
    
    def save_performance_metrics(self, interaction_count: int, accuracy: float,
                                 knowledge_base_size: int, improvement_rate: float,
                                 avg_response_time: float, openai_usage_count: int):
        """Сохранение метрик производительности"""
        if not self.connection or not self.connection.is_connected():
            return
        
        query = """
        INSERT INTO performance_metrics 
        (interaction_count, accuracy, knowledge_base_size, improvement_rate, 
         avg_response_time, openai_usage_count)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        self.execute_query(query, (
            interaction_count, accuracy, knowledge_base_size,
            improvement_rate, avg_response_time, openai_usage_count
        ))
    
    def get_latest_metrics(self) -> Optional[Dict]:
        """Получение последних метрик"""
        query = """
        SELECT * FROM performance_metrics 
        ORDER BY created_at DESC 
        LIMIT 1
        """
        result = self.execute_query(query, fetch=True)
        return result[0] if result else None
    
    # ==================== РАБОТА С ЗАДАЧАМИ ОБУЧЕНИЯ ====================
    
    def save_learning_task(self, description: str, task_type: str, 
                          difficulty: str) -> int:
        """Сохранение задачи для обучения"""
        if not self.connection or not self.connection.is_connected():
            return 0
        
        query = """
        INSERT INTO learning_tasks (description, task_type, difficulty)
        VALUES (%s, %s, %s)
        """
        cursor = self.connection.cursor()
        cursor.execute(query, (description, task_type, difficulty))
        task_id = cursor.lastrowid
        self.connection.commit()
        cursor.close()
        return task_id
    
    def get_pending_tasks(self) -> List[Dict]:
        """Получение невыполненных задач"""
        query = """
        SELECT * FROM learning_tasks 
        WHERE completed = FALSE 
        ORDER BY created_at DESC
        """
        return self.execute_query(query, fetch=True)
    
    # ==================== РАБОТА С ВИЗУАЛИЗАЦИЯМИ ====================
    
    def save_visualization(self, plot_type: str, file_path: str = None, 
                          plot_image: bytes = None, interaction_count: int = 0) -> int:
        """Сохранение визуализации в БД (изображение в BLOB)"""
        if not self.connection or not self.connection.is_connected():
            return 0
        
        query = """
        INSERT INTO visualizations (plot_type, file_path, plot_image, interaction_count)
        VALUES (%s, %s, %s, %s)
        """
        cursor = self.connection.cursor()
        cursor.execute(query, (plot_type, file_path, plot_image, interaction_count))
        viz_id = cursor.lastrowid
        self.connection.commit()
        cursor.close()
        return viz_id
    
    def get_visualization(self, viz_id: int) -> Optional[Dict]:
        """Получение визуализации из БД"""
        if not self.connection or not self.connection.is_connected():
            return None
        
        query = "SELECT * FROM visualizations WHERE id = %s"
        result = self.execute_query(query, (viz_id,), fetch=True)
        return result[0] if result else None
    
    def get_latest_visualizations(self, plot_type: str = None, limit: int = 10) -> List[Dict]:
        """Получение последних визуализаций"""
        if not self.connection or not self.connection.is_connected():
            return []
        
        if plot_type:
            query = """
            SELECT id, plot_type, file_path, interaction_count, created_at
            FROM visualizations 
            WHERE plot_type = %s
            ORDER BY created_at DESC 
            LIMIT %s
            """
            return self.execute_query(query, (plot_type, limit), fetch=True)
        else:
            query = """
            SELECT id, plot_type, file_path, interaction_count, created_at
            FROM visualizations 
            ORDER BY created_at DESC 
            LIMIT %s
            """
            return self.execute_query(query, (limit,), fetch=True)
    
    def __del__(self):
        """Деструктор - закрытие соединения"""
        self.disconnect()

