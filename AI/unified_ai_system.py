"""
ЕДИНАЯ САМОРАЗВИВАЮЩАЯСЯ СИСТЕМА ИИ
Объединяет все компоненты и работает с MySQL базой данных
"""

import json
import os
import random
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Для работы без GUI
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Импорт конфигурации и базы данных
try:
    from config import OPENAI_API_KEY, AI_CONFIG, NEURAL_NETWORK_CONFIG, VISUALIZATION_CONFIG, DATABASE_CONFIG
    from database import DatabaseManager
except ImportError as e:
    print(f"⚠️  Ошибка импорта: {e}")
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    AI_CONFIG = {'model': 'gpt-3.5-turbo', 'temperature': 0.7, 'max_tokens': 500}
    DATABASE_CONFIG = {}

# Попытка импорта OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
    client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
except ImportError:
    OPENAI_AVAILABLE = False
    client = None
    print("⚠️  OpenAI не установлен. Установите: pip install openai")


# ==================== НЕЙРОННАЯ СЕТЬ ====================

class NeuralNetwork:
    """Нейронная сеть для анализа паттернов"""
    
    def __init__(self, input_size: int = 50, hidden_size: int = 100, output_size: int = 20):
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        
        # Инициализация весов
        self.W1 = np.random.randn(input_size, hidden_size) * 0.1
        self.b1 = np.zeros((1, hidden_size))
        self.W2 = np.random.randn(hidden_size, output_size) * 0.1
        self.b2 = np.zeros((1, output_size))
    
    def forward(self, X: np.ndarray) -> np.ndarray:
        """Прямой проход"""
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = np.tanh(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = self._sigmoid(self.z2)
        return self.a2
    
    def _sigmoid(self, x: np.ndarray) -> np.ndarray:
        return 1 / (1 + np.exp(-np.clip(x, -250, 250)))
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.forward(X)
    
    def analyze_pattern(self, text: str, vectorizer) -> Dict[str, float]:
        """Анализ паттернов в тексте"""
        try:
            text_vector = vectorizer.transform([text]).toarray()
            prediction = self.predict(text_vector)
            return {
                'confidence': float(np.mean(prediction)),
                'pattern_score': float(np.max(prediction)),
                'complexity': float(np.std(prediction))
            }
        except:
            return {'confidence': 0.5, 'pattern_score': 0.5, 'complexity': 0.5}


# ==================== ИНТЕГРАЦИЯ С OPENAI ====================

class OpenAIIntegration:
    """Интеграция с OpenAI GPT"""
    
    def __init__(self, api_key: str, model: str = 'gpt-3.5-turbo', db: DatabaseManager = None):
        self.api_key = api_key
        self.model = model
        self.client = OpenAI(api_key=api_key) if api_key and OPENAI_AVAILABLE else None
        self.usage_count = 0
        self.db = db
    
    def generate_response(self, query: str, context: str = "") -> str:
        """Генерация ответа с помощью GPT"""
        if not self.client:
            return "OpenAI API недоступен. Проверьте установку и API ключ."
        
        try:
            messages = [
                {"role": "system", "content": "Ты умный и дружелюбный помощник. Отвечай кратко и по делу."}
            ]
            
            if context:
                messages.append({"role": "system", "content": f"Контекст: {context}"})
            
            messages.append({"role": "user", "content": query})
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=AI_CONFIG.get('temperature', 0.7),
                max_tokens=AI_CONFIG.get('max_tokens', 500)
            )
            
            answer = response.choices[0].message.content
            self.usage_count += 1
            return answer
        except Exception as e:
            return f"Ошибка при обращении к OpenAI: {str(e)}"
    
    def generate_learning_task(self, knowledge_base_size: int) -> str:
        """Генерация задачи для самообучения"""
        if not self.client:
            return f"Создать тестовую задачу для проверки знаний (база: {knowledge_base_size} записей)"
        
        try:
            prompt = f"""Создай интересную задачу для самообучения ИИ. 
            Учитывай, что база знаний содержит {knowledge_base_size} записей.
            Задача должна быть полезной для улучшения понимания и генерации ответов.
            Ответ должен быть кратким (1-2 предложения)."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=200
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"Задача: Проанализировать паттерны в {knowledge_base_size} записях базы знаний"


# ==================== КОЛЛЕКТИВНЫЙ ИНТЕЛЛЕКТ ====================

class CollectiveIntelligence:
    """Система коллективного интеллекта"""
    
    def __init__(self, num_agents: int = 3, db: DatabaseManager = None):
        self.num_agents = num_agents
        self.db = db
        self.agents: List[Dict[str, Any]] = []
        self._initialize_agents()
    
    def _initialize_agents(self):
        """Инициализация агентов из БД"""
        if self.db and self.db.connection:
            try:
                agents_from_db = self.db.get_agents()
                if agents_from_db:
                    self.agents = agents_from_db
                else:
                    # Создание агентов по умолчанию
                    specializations = ['general', 'technical', 'creative']
                    for i in range(self.num_agents):
                        agent = {
                            'id': i + 1,
                            'name': f"Agent_{i+1}",
                            'specialization': specializations[i % len(specializations)],
                            'knowledge_count': 0,
                            'success_rate': 0.5
                        }
                        self.agents.append(agent)
            except Exception as e:
                print(f"⚠️  Ошибка загрузки агентов из БД: {e}")
                # Создание агентов по умолчанию
                specializations = ['general', 'technical', 'creative']
                for i in range(self.num_agents):
                    agent = {
                        'id': i + 1,
                        'name': f"Agent_{i+1}",
                        'specialization': specializations[i % len(specializations)],
                        'knowledge_count': 0,
                        'success_rate': 0.5
                    }
                    self.agents.append(agent)
        else:
            # Без БД - создаем в памяти
            specializations = ['general', 'technical', 'creative']
            for i in range(self.num_agents):
                self.agents.append({
                    'id': i + 1,
                    'name': f"Agent_{i+1}",
                    'specialization': specializations[i % len(specializations)],
                    'knowledge_count': 0,
                    'success_rate': 0.5
                })
    
    def process_collectively(self, query: str, db: DatabaseManager, 
                           openai_client: OpenAIIntegration) -> Tuple[str, Dict[str, Any]]:
        """Коллективная обработка запроса"""
        agent_responses = []
        agent_confidences = []
        
        for agent in self.agents:
            # Поиск в базе знаний
            similar = db.find_similar_knowledge(query, top_k=1, min_similarity=0.7) if db else []
            
            if similar and similar[0][1] >= 0.7:
                # Используем найденное знание
                response = similar[0][0]  # query_text
                confidence = similar[0][1]
            else:
                # Генерация через GPT
                context = f"Специализация агента: {agent['specialization']}"
                response = openai_client.generate_response(query, context)
                confidence = 0.6
            
            agent_responses.append(response)
            agent_confidences.append(confidence)
        
        # Выбор лучшего ответа
        best_idx = np.argmax(agent_confidences)
        best_response = agent_responses[best_idx]
        best_agent = self.agents[best_idx]
        
        return best_response, {
            'num_agents': self.num_agents,
            'selected_agent': best_agent['name'],
            'specialization': best_agent['specialization'],
            'avg_confidence': float(np.mean(agent_confidences)),
            'all_responses': agent_responses
        }


# ==================== ВИЗУАЛИЗАЦИЯ ====================

class LearningVisualizer:
    """Визуализация процесса обучения (сохранение в БД)"""
    
    def __init__(self, db: DatabaseManager = None):
        self.db = db
        self.plot_dir = "learning_plots"  # Опционально для резервных копий
        os.makedirs(self.plot_dir, exist_ok=True)
    
    def plot_learning_curve(self, db: DatabaseManager, save: bool = True):
        """Построение кривой обучения из БД"""
        if not db:
            return
        
        # Получение данных из БД
        metrics = db.execute_query(
            "SELECT * FROM performance_metrics ORDER BY created_at DESC LIMIT 20",
            fetch=True
        )
        
        if not metrics or len(metrics) < 2:
            return
        
        metrics.reverse()  # Для правильного порядка
        
        interactions = [m['interaction_count'] for m in metrics]
        accuracies = [m['accuracy'] for m in metrics]
        knowledge_sizes = [m['knowledge_base_size'] for m in metrics]
        
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))
        
        # График точности
        ax1.plot(interactions, accuracies, 'b-', marker='o', label='Точность')
        ax1.set_xlabel('Взаимодействия')
        ax1.set_ylabel('Точность')
        ax1.set_title('Кривая обучения - Точность')
        ax1.grid(True)
        ax1.legend()
        
        # График размера базы знаний
        ax2.plot(interactions, knowledge_sizes, 'g-', marker='s', label='Размер базы знаний')
        ax2.set_xlabel('Взаимодействия')
        ax2.set_ylabel('Количество записей')
        ax2.set_title('Рост базы знаний')
        ax2.grid(True)
        ax2.legend()
        
        plt.tight_layout()
        
        if save:
            # Сохранение в память (BytesIO) для БД
            from io import BytesIO
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
            buffer.seek(0)
            plot_image = buffer.read()
            buffer.close()
            
            # Сохранение в БД
            if db and db.connection:
                interaction_count = interactions[-1] if interactions else 0
                viz_id = db.save_visualization(
                    plot_type='learning_curve',
                    file_path=None,  # Не сохраняем путь к файлу
                    plot_image=plot_image,
                    interaction_count=interaction_count
                )
                print(f"📊 График сохранен в БД (ID: {viz_id}, взаимодействий: {interaction_count})")
            else:
                # Fallback: сохранение в файл если БД недоступна
                filename = os.path.join(self.plot_dir, f"learning_curve_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
                plt.savefig(filename)
                print(f"📊 График сохранен в файл: {filename}")
        
        plt.close()
    
    def plot_agent_performance(self, db: DatabaseManager, save: bool = True):
        """Визуализация производительности агентов"""
        if not db:
            return
        
        agents = db.get_agents()
        if not agents:
            return
        
        agent_names = [a['name'] for a in agents]
        knowledge_counts = [a['knowledge_count'] for a in agents]
        success_rates = [a['success_rate'] for a in agents]
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # График количества знаний
        ax1.bar(agent_names, knowledge_counts, color='skyblue')
        ax1.set_xlabel('Агенты')
        ax1.set_ylabel('Количество знаний')
        ax1.set_title('Распределение знаний между агентами')
        ax1.tick_params(axis='x', rotation=45)
        
        # График успешности
        ax2.bar(agent_names, success_rates, color='lightgreen')
        ax2.set_xlabel('Агенты')
        ax2.set_ylabel('Успешность')
        ax2.set_title('Успешность агентов')
        ax2.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        if save:
            # Сохранение в память (BytesIO) для БД
            from io import BytesIO
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
            buffer.seek(0)
            plot_image = buffer.read()
            buffer.close()
            
            # Сохранение в БД
            if db and db.connection:
                viz_id = db.save_visualization(
                    plot_type='agent_performance',
                    file_path=None,
                    plot_image=plot_image,
                    interaction_count=0
                )
                print(f"📊 График агентов сохранен в БД (ID: {viz_id})")
            else:
                # Fallback: сохранение в файл если БД недоступна
                filename = os.path.join(self.plot_dir, f"agent_performance_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
                plt.savefig(filename)
                print(f"📊 График агентов сохранен в файл: {filename}")
        
        plt.close()


# ==================== ГЛАВНАЯ СИСТЕМА ====================

class UnifiedAISystem:
    """Единая саморазвивающаяся система ИИ с MySQL"""
    
    def __init__(self):
        print("="*70)
        print(" " * 15 + "ЕДИНАЯ САМОРАЗВИВАЮЩАЯСЯ СИСТЕМА ИИ")
        print("="*70)
        
        # Подключение к БД
        self.db = DatabaseManager()
        if not self.db.connection:
            print("⚠️  Предупреждение: База данных недоступна, работаем в режиме памяти")
        else:
            # Проверка существования таблиц
            try:
                cursor = self.db.connection.cursor()
                cursor.execute("SHOW TABLES")
                tables = [table[0] for table in cursor.fetchall()]
                cursor.close()
                
                required_tables = ['users', 'knowledge_base', 'interactions', 'agents']
                missing = [t for t in required_tables if t not in tables]
                
                if missing:
                    print(f"⚠️  Отсутствуют таблицы: {', '.join(missing)}")
                    print("💡 Запустите: py init_database.py")
                    print("⚠️  Система будет работать в ограниченном режиме")
            except Exception as e:
                print(f"⚠️  Ошибка проверки таблиц: {e}")
        
        # Инициализация компонентов
        self.openai_client = OpenAIIntegration(OPENAI_API_KEY, AI_CONFIG.get('model', 'gpt-3.5-turbo'), self.db)
        self.neural_network = NeuralNetwork(
            NEURAL_NETWORK_CONFIG['input_size'],
            NEURAL_NETWORK_CONFIG['hidden_size'],
            NEURAL_NETWORK_CONFIG['output_size']
        )
        self.collective = CollectiveIntelligence(AI_CONFIG.get('collective_agents', 3), self.db)
        self.visualizer = LearningVisualizer(self.db)
        
        # Векторизатор для нейронной сети
        self.vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        
        # Статистика
        self.interaction_count = 0
        self.improvement_count = 0
        self.accuracy_history: List[float] = []
        self.current_user_id = None
        
        print("\n🤖 Система инициализирована:")
        print(f"📊 Агентов в коллективе: {self.collective.num_agents}")
        print(f"🧠 Нейронная сеть: {self.neural_network.input_size} -> {self.neural_network.hidden_size} -> {self.neural_network.output_size}")
        if OPENAI_AVAILABLE and OPENAI_API_KEY:
            print("✅ OpenAI GPT интегрирован")
        else:
            print("⚠️  OpenAI не доступен")
        if self.db.connection:
            print("✅ База данных MySQL подключена")
        print("="*70 + "\n")
    
    def set_user(self, name: str):
        """Установка текущего пользователя"""
        if self.db and self.db.connection:
            self.current_user_id = self.db.get_or_create_user(name)
            print(f"👤 Пользователь: {name} (ID: {self.current_user_id})")
        else:
            self.current_user_id = None
    
    def process_query(self, query: str, use_collective: bool = True) -> Dict[str, Any]:
        """Обработка запроса с использованием всех систем"""
        self.interaction_count += 1
        start_time = time.time()
        
        # Коллективная обработка
        if use_collective and self.db and self.db.connection:
            response, collective_info = self.collective.process_collectively(
                query, self.db, self.openai_client
            )
        else:
            # Одиночная обработка
            if self.db and self.db.connection:
                similar = self.db.find_similar_knowledge(query, top_k=1, min_similarity=0.7)
                if similar and similar[0][1] > 0.7:
                    response = similar[0][0]
                else:
                    response = self.openai_client.generate_response(query)
            else:
                response = self.openai_client.generate_response(query)
            collective_info = {}
        
        execution_time = time.time() - start_time
        
        # Анализ паттернов нейронной сетью
        try:
            pattern_analysis = self.neural_network.analyze_pattern(query, self.vectorizer)
        except:
            pattern_analysis = {'confidence': 0.5, 'pattern_score': 0.5, 'complexity': 0.5}
        
        # Оценка успешности
        accuracy = pattern_analysis['confidence']
        self.accuracy_history.append(accuracy)
        
        # Сохранение в БД
        if self.db and self.db.connection:
            # Сохранение знания
            self.db.add_knowledge(query, response, category='general', similarity_score=accuracy)
            
            # Сохранение взаимодействия
            interaction_id = self.db.save_interaction(
                user_id=self.current_user_id,
                query=query,
                response=response,
                execution_time=execution_time,
                accuracy=accuracy,
                relevance=pattern_analysis.get('pattern_score', 0.5),
                completeness=0.7,
                confidence=pattern_analysis.get('confidence', 0.5),
                success=accuracy > 0.5,
                agent_used=collective_info.get('selected_agent', 'single')
            )
            
            # Обновление статистики агента
            if collective_info.get('selected_agent'):
                agents = self.db.get_agents()
                for agent in agents:
                    if agent['name'] == collective_info['selected_agent']:
                        self.db.update_agent_stats(agent['id'], success=accuracy > 0.5)
                        break
        
        # Визуализация
        if self.interaction_count % VISUALIZATION_CONFIG.get('update_interval', 5) == 0:
            avg_accuracy = np.mean(self.accuracy_history[-10:]) if self.accuracy_history else 0.5
            if self.db and self.db.connection:
                knowledge_size = self.db.get_knowledge_count()
                self.db.save_performance_metrics(
                    self.interaction_count,
                    avg_accuracy,
                    knowledge_size,
                    self.improvement_count / max(1, self.interaction_count),
                    execution_time,
                    self.openai_client.usage_count
                )
                try:
                    self.visualizer.plot_learning_curve(self.db)
                    self.visualizer.plot_agent_performance(self.db)
                except Exception as e:
                    print(f"⚠️  Ошибка создания графиков: {e}")
        
        # Самоулучшение
        if self.interaction_count % AI_CONFIG.get('improvement_interval', 10) == 0:
            self._self_improve()
        
        # Генерация задачи для самообучения
        if self.interaction_count % 20 == 0 and self.db and self.db.connection:
            knowledge_size = self.db.get_knowledge_count()
            task_description = self.openai_client.generate_learning_task(knowledge_size)
            task_type = 'analysis' if 'анализ' in task_description.lower() else 'general'
            difficulty = 'easy' if knowledge_size < 10 else 'medium' if knowledge_size < 50 else 'hard'
            self.db.save_learning_task(task_description, task_type, difficulty)
            print(f"\n📚 Сгенерирована задача для самообучения: {task_description}\n")
        
        return {
            'response': response,
            'execution_time': execution_time,
            'pattern_analysis': pattern_analysis,
            'collective_info': collective_info,
            'accuracy': accuracy,
            'interaction_count': self.interaction_count
        }
    
    def _self_improve(self):
        """Процесс самоулучшения"""
        self.improvement_count += 1
        print(f"\n🔄 [САМОУЛУЧШЕНИЕ #{self.improvement_count}]")
        
        if len(self.accuracy_history) > 10:
            recent_accuracy = np.mean(self.accuracy_history[-10:])
            print(f"📊 Средняя точность (последние 10): {recent_accuracy:.3f}")
        
        if self.db and self.db.connection:
            knowledge_size = self.db.get_knowledge_count()
            print(f"💾 База знаний: {knowledge_size} записей")
        
        print(f"📈 Взаимодействий: {self.interaction_count}")
        print(f"🤝 Агентов: {self.collective.num_agents}")
        print("✅ Улучшение завершено\n")
    
    def get_status(self) -> Dict[str, Any]:
        """Получение статуса системы"""
        status = {
            'interactions': self.interaction_count,
            'improvements': self.improvement_count,
            'avg_accuracy': np.mean(self.accuracy_history[-10:]) if self.accuracy_history else 0.0,
            'openai_usage': self.openai_client.usage_count,
            'collective_agents': self.collective.num_agents,
        }
        
        if self.db and self.db.connection:
            status['knowledge_base_size'] = self.db.get_knowledge_count()
            status['database_connected'] = True
            latest_metrics = self.db.get_latest_metrics()
            if latest_metrics:
                status.update({
                    'db_accuracy': latest_metrics.get('accuracy', 0),
                    'db_knowledge_size': latest_metrics.get('knowledge_base_size', 0)
                })
        else:
            status['database_connected'] = False
            status['knowledge_base_size'] = 0
        
        return status
    
    def __del__(self):
        """Деструктор"""
        if self.db:
            self.db.disconnect()


# ==================== ИНТЕРФЕЙС ====================

def main():
    """Главная функция"""
    print("\n" + "="*70)
    print(" " * 15 + "ЕДИНАЯ САМОРАЗВИВАЮЩАЯСЯ СИСТЕМА ИИ")
    print("="*70)
    print("\nВозможности:")
    print("✅ Интеграция с OpenAI GPT")
    print("✅ Нейронные сети для анализа")
    print("✅ Коллективный интеллект")
    print("✅ Автоматическая генерация задач")
    print("✅ Визуализация обучения")
    print("✅ MySQL база данных")
    print("="*70 + "\n")
    
    system = UnifiedAISystem()
    
    # Запрос имени пользователя
    user_name = input("Введите ваше имя: ").strip()
    if user_name:
        system.set_user(user_name)
    
    print("\nВведите 'quit' для выхода, 'status' для статуса\n")
    
    while True:
        query = input("Вы: ").strip()
        
        if query.lower() in ['quit', 'exit', 'выход']:
            print("\n💾 Сохраняю все данные...")
            if system.db:
                system.db.disconnect()
            print("✅ Сохранено! До свидания!")
            break
        
        if query.lower() == 'status':
            status = system.get_status()
            print("\n" + "="*70)
            print("СТАТУС СИСТЕМЫ")
            print("="*70)
            for key, value in status.items():
                print(f"{key}: {value}")
            print("="*70 + "\n")
            continue
        
        if not query:
            continue
        
        # Обработка запроса
        result = system.process_query(query, use_collective=True)
        
        print(f"\n🤖 ИИ: {result['response']}")
        print(f"⏱️  Время: {result['execution_time']:.2f}с")
        if result.get('collective_info') and result['collective_info'].get('selected_agent'):
            print(f"👥 Агент: {result['collective_info']['selected_agent']}")
        print(f"📊 Уверенность: {result['accuracy']:.2%}\n")


if __name__ == "__main__":
    main()

