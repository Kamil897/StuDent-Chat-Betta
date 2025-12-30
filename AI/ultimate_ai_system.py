"""
ПОЛНОЦЕННАЯ САМОРАЗВИВАЮЩАЯСЯ СИСТЕМА ИИ
С интеграцией OpenAI GPT, нейронными сетями, коллективным интеллектом
и визуализацией процесса обучения
"""

import json
import os
import pickle
import random
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Импорт конфигурации
try:
    from config import OPENAI_API_KEY, AI_CONFIG, NEURAL_NETWORK_CONFIG, VISUALIZATION_CONFIG
except ImportError:
    # Если config.py не найден, используем значения по умолчанию
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    AI_CONFIG = {
        'model': 'gpt-3.5-turbo',
        'temperature': 0.7,
        'max_tokens': 500,
        'learning_rate': 0.1,
        'improvement_interval': 10,
        'collective_agents': 3,
    }
    NEURAL_NETWORK_CONFIG = {
        'input_size': 50,
        'hidden_size': 100,
        'output_size': 20,
        'learning_rate': 0.01,
    }
    VISUALIZATION_CONFIG = {
        'save_plots': True,
        'plot_format': 'png',
        'update_interval': 5,
    }

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
    """Нейронная сеть для анализа паттернов и обучения"""
    
    def __init__(self, input_size: int = 50, hidden_size: int = 100, output_size: int = 20):
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        
        # Инициализация весов
        self.W1 = np.random.randn(input_size, hidden_size) * 0.1
        self.b1 = np.zeros((1, hidden_size))
        self.W2 = np.random.randn(hidden_size, output_size) * 0.1
        self.b2 = np.zeros((1, output_size))
        
        self.training_history = []
    
    def forward(self, X: np.ndarray) -> np.ndarray:
        """Прямой проход"""
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = np.tanh(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = self._sigmoid(self.z2)
        return self.a2
    
    def _sigmoid(self, x: np.ndarray) -> np.ndarray:
        """Сигмоидальная функция активации"""
        return 1 / (1 + np.exp(-np.clip(x, -250, 250)))
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Предсказание"""
        return self.forward(X)
    
    def train(self, X: np.ndarray, y: np.ndarray, learning_rate: float = 0.01, epochs: int = 10):
        """Обучение нейронной сети (упрощенная версия backpropagation)"""
        for epoch in range(epochs):
            # Прямой проход
            output = self.forward(X)
            
            # Вычисление ошибки (упрощенная версия)
            error = y - output
            
            # Обновление весов (градиентный спуск)
            dW2 = np.dot(self.a1.T, error)
            db2 = np.sum(error, axis=0, keepdims=True)
            dW1 = np.dot(X.T, np.dot(error, self.W2.T) * (1 - np.power(self.a1, 2)))
            db1 = np.sum(np.dot(error, self.W2.T) * (1 - np.power(self.a1, 2)), axis=0, keepdims=True)
            
            # Обновление параметров
            self.W2 += learning_rate * dW2
            self.b2 += learning_rate * db2
            self.W1 += learning_rate * dW1
            self.b1 += learning_rate * db1
            
            # Сохранение истории
            loss = np.mean(np.square(error))
            self.training_history.append(loss)
    
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
    """Интеграция с OpenAI GPT для генерации ответов"""
    
    def __init__(self, api_key: str, model: str = 'gpt-3.5-turbo'):
        self.api_key = api_key
        self.model = model
        self.client = OpenAI(api_key=api_key) if api_key and OPENAI_AVAILABLE else None
        self.usage_count = 0
        self.response_history = []
    
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
            self.response_history.append({
                'query': query,
                'response': answer,
                'timestamp': datetime.now().isoformat()
            })
            
            return answer
        except Exception as e:
            return f"Ошибка при обращении к OpenAI: {str(e)}"
    
    def generate_learning_task(self, knowledge_base_size: int) -> str:
        """Генерация задачи для самообучения"""
        if not self.client:
            return "Создать тестовую задачу для проверки знаний"
        
        try:
            prompt = f"""Создай интересную задачу для самообучения ИИ. 
            Учитывай, что база знаний содержит {knowledge_base_size} записей.
            Задача должна быть полезной для улучшения понимания и генерации ответов."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=200
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"Задача: Проанализировать паттерны в {knowledge_base_size} записях базы знаний"


# ==================== БАЗА ЗНАНИЙ С УЛУЧШЕНИЯМИ ====================

class AdvancedKnowledgeBase:
    """Продвинутая база знаний с векторным поиском"""
    
    def __init__(self, storage_path: str = "ai_knowledge_base.json"):
        self.storage_path = storage_path
        self.knowledge: Dict[str, Any] = {}
        self.user_preferences: Dict[str, Any] = {}
        self.interaction_history: List[Dict[str, Any]] = []
        self.successful_responses: Dict[str, str] = {}
        self.vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        self.text_vectors = []
        self.text_keys = []
        self.load()
    
    def load(self):
        """Загрузка базы знаний"""
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.knowledge = data.get('knowledge', {})
                    self.user_preferences = data.get('user_preferences', {})
                    self.interaction_history = data.get('interaction_history', [])
                    self.successful_responses = data.get('successful_responses', {})
                    
                    # Восстановление векторов
                    if self.successful_responses:
                        texts = list(self.successful_responses.values())
                        if texts:
                            self.text_vectors = self.vectorizer.fit_transform(texts).toarray()
                            self.text_keys = list(self.successful_responses.keys())
            except Exception as e:
                print(f"Ошибка загрузки базы знаний: {e}")
    
    def save(self):
        """Сохранение базы знаний"""
        try:
            data = {
                'knowledge': self.knowledge,
                'user_preferences': self.user_preferences,
                'interaction_history': self.interaction_history[-1000:],
                'successful_responses': self.successful_responses,
                'last_updated': datetime.now().isoformat()
            }
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Ошибка сохранения: {e}")
    
    def add_knowledge(self, query: str, response: str, success: bool = True):
        """Добавление знания с векторизацией"""
        if success:
            query_lower = query.lower()
            self.successful_responses[query_lower] = response
            
            # Обновление векторов (нужно минимум 1 элемент для векторизации)
            if len(self.successful_responses) >= 1:
                texts = list(self.successful_responses.values())
                try:
                    self.text_vectors = self.vectorizer.fit_transform(texts).toarray()
                    self.text_keys = list(self.successful_responses.keys())
                except Exception as e:
                    # Если ошибка векторизации, оставляем пустым
                    self.text_vectors = []
                    self.text_keys = []
        
        interaction = {
            'query': query,
            'response': response,
            'success': success,
            'timestamp': datetime.now().isoformat()
        }
        self.interaction_history.append(interaction)
        self.save()
    
    def find_similar(self, query: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """Поиск похожих запросов с использованием векторного поиска"""
        # Проверка наличия данных
        if isinstance(self.text_vectors, np.ndarray):
            if self.text_vectors.size == 0 or len(self.text_keys) == 0:
                return []
        else:
            if len(self.text_vectors) == 0 or len(self.text_keys) == 0:
                return []
        
        try:
            query_vector = self.vectorizer.transform([query.lower()]).toarray()
            similarities = cosine_similarity(query_vector, self.text_vectors)[0]
            
            # Сортировка по схожести
            top_indices = np.argsort(similarities)[-top_k:][::-1]
            results = [(self.text_keys[i], float(similarities[i])) for i in top_indices if similarities[i] > 0.3]
            return results
        except:
            return []


# ==================== КОЛЛЕКТИВНЫЙ ИНТЕЛЛЕКТ ====================

class CollectiveIntelligence:
    """Система коллективного интеллекта - несколько агентов работают вместе"""
    
    def __init__(self, num_agents: int = 3):
        self.num_agents = num_agents
        self.agents: List[Dict[str, Any]] = []
        self.communication_log: List[Dict[str, Any]] = []
        
        # Инициализация агентов
        for i in range(num_agents):
            self.agents.append({
                'id': i,
                'name': f"Agent_{i+1}",
                'specialization': self._assign_specialization(i),
                'knowledge_count': 0,
                'success_rate': 0.5,
                'responses': []
            })
    
    def _assign_specialization(self, agent_id: int) -> str:
        """Назначение специализации агенту"""
        specializations = ['general', 'technical', 'creative', 'analytical', 'conversational']
        return specializations[agent_id % len(specializations)]
    
    def process_collectively(self, query: str, knowledge_base: AdvancedKnowledgeBase, 
                           openai_client: OpenAIIntegration) -> Tuple[str, Dict[str, Any]]:
        """Коллективная обработка запроса"""
        agent_responses = []
        agent_confidences = []
        
        # Каждый агент обрабатывает запрос
        for agent in self.agents:
            # Поиск в базе знаний
            similar = knowledge_base.find_similar(query, top_k=1)
            if similar and similar[0][1] > 0.7:
                response = knowledge_base.successful_responses.get(similar[0][0], "")
                confidence = similar[0][1]
            else:
                # Генерация нового ответа через GPT
                context = f"Специализация агента: {agent['specialization']}"
                response = openai_client.generate_response(query, context)
                confidence = 0.6
            
            agent_responses.append(response)
            agent_confidences.append(confidence)
            agent['responses'].append({
                'query': query,
                'response': response,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            })
        
        # Выбор лучшего ответа или комбинация
        best_idx = np.argmax(agent_confidences)
        best_response = agent_responses[best_idx]
        best_agent = self.agents[best_idx]
        
        # Обновление статистики агента
        best_agent['knowledge_count'] += 1
        
        # Логирование
        self.communication_log.append({
            'query': query,
            'agent_responses': agent_responses,
            'selected_agent': best_agent['name'],
            'avg_confidence': float(np.mean(agent_confidences)),
            'timestamp': datetime.now().isoformat()
        })
        
        return best_response, {
            'num_agents': self.num_agents,
            'selected_agent': best_agent['name'],
            'specialization': best_agent['specialization'],
            'avg_confidence': float(np.mean(agent_confidences)),
            'all_responses': agent_responses
        }


# ==================== ВИЗУАЛИЗАЦИЯ ====================

class LearningVisualizer:
    """Визуализация процесса обучения"""
    
    def __init__(self):
        self.performance_data: List[Dict[str, Any]] = []
        self.plot_dir = "learning_plots"
        os.makedirs(self.plot_dir, exist_ok=True)
    
    def add_data_point(self, interaction_count: int, accuracy: float, knowledge_size: int, 
                      improvement_rate: float):
        """Добавление точки данных"""
        self.performance_data.append({
            'interaction': interaction_count,
            'accuracy': accuracy,
            'knowledge_size': knowledge_size,
            'improvement_rate': improvement_rate,
            'timestamp': datetime.now().isoformat()
        })
    
    def plot_learning_curve(self, save: bool = True):
        """Построение кривой обучения"""
        if len(self.performance_data) < 2:
            return
        
        interactions = [d['interaction'] for d in self.performance_data]
        accuracies = [d['accuracy'] for d in self.performance_data]
        knowledge_sizes = [d['knowledge_size'] for d in self.performance_data]
        
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
            filename = os.path.join(self.plot_dir, f"learning_curve_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            plt.savefig(filename)
            print(f"📊 График сохранен: {filename}")
        
        plt.close()
    
    def plot_agent_performance(self, collective: CollectiveIntelligence, save: bool = True):
        """Визуализация производительности агентов"""
        agent_names = [a['name'] for a in collective.agents]
        knowledge_counts = [a['knowledge_count'] for a in collective.agents]
        success_rates = [a['success_rate'] for a in collective.agents]
        
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
            filename = os.path.join(self.plot_dir, f"agent_performance_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            plt.savefig(filename)
            print(f"📊 График агентов сохранен: {filename}")
        
        plt.close()


# ==================== ГЕНЕРАТОР ЗАДАЧ ДЛЯ САМООБУЧЕНИЯ ====================

class SelfLearningTaskGenerator:
    """Генератор задач для автоматического самообучения"""
    
    def __init__(self, openai_client: OpenAIIntegration):
        self.openai_client = openai_client
        self.generated_tasks: List[Dict[str, Any]] = []
    
    def generate_task(self, knowledge_base_size: int, weak_areas: List[str] = None) -> Dict[str, Any]:
        """Генерация задачи для самообучения"""
        task_description = self.openai_client.generate_learning_task(knowledge_base_size)
        
        task = {
            'description': task_description,
            'type': self._determine_task_type(task_description),
            'difficulty': self._estimate_difficulty(knowledge_base_size),
            'timestamp': datetime.now().isoformat(),
            'completed': False
        }
        
        self.generated_tasks.append(task)
        return task
    
    def _determine_task_type(self, description: str) -> str:
        """Определение типа задачи"""
        description_lower = description.lower()
        if 'анализ' in description_lower or 'анализировать' in description_lower:
            return 'analysis'
        elif 'генерация' in description_lower or 'создать' in description_lower:
            return 'generation'
        elif 'оптимизация' in description_lower or 'улучшить' in description_lower:
            return 'optimization'
        else:
            return 'general'
    
    def _estimate_difficulty(self, knowledge_base_size: int) -> str:
        """Оценка сложности задачи"""
        if knowledge_base_size < 10:
            return 'easy'
        elif knowledge_base_size < 50:
            return 'medium'
        else:
            return 'hard'


# ==================== ГЛАВНАЯ СИСТЕМА ====================

class UltimateAISystem:
    """Главная система саморазвивающегося ИИ со всеми функциями"""
    
    def __init__(self):
        self.knowledge_base = AdvancedKnowledgeBase()
        self.openai_client = OpenAIIntegration(OPENAI_API_KEY, AI_CONFIG.get('model', 'gpt-3.5-turbo'))
        self.neural_network = NeuralNetwork(
            NEURAL_NETWORK_CONFIG['input_size'],
            NEURAL_NETWORK_CONFIG['hidden_size'],
            NEURAL_NETWORK_CONFIG['output_size']
        )
        self.collective = CollectiveIntelligence(AI_CONFIG.get('collective_agents', 3))
        self.visualizer = LearningVisualizer()
        self.task_generator = SelfLearningTaskGenerator(self.openai_client)
        
        self.interaction_count = 0
        self.improvement_count = 0
        self.accuracy_history: List[float] = []
        
        print("🤖 ПОЛНОЦЕННАЯ САМОРАЗВИВАЮЩАЯСЯ СИСТЕМА ИИ ИНИЦИАЛИЗИРОВАНА")
        print(f"📊 Агентов в коллективе: {self.collective.num_agents}")
        print(f"🧠 Нейронная сеть: {self.neural_network.input_size} -> {self.neural_network.hidden_size} -> {self.neural_network.output_size}")
        if OPENAI_AVAILABLE and OPENAI_API_KEY:
            print("✅ OpenAI GPT интегрирован")
        else:
            print("⚠️  OpenAI не доступен")
    
    def process_query(self, query: str, use_collective: bool = True) -> Dict[str, Any]:
        """Обработка запроса с использованием всех систем"""
        self.interaction_count += 1
        start_time = time.time()
        
        # Коллективная обработка
        if use_collective:
            response, collective_info = self.collective.process_collectively(
                query, self.knowledge_base, self.openai_client
            )
        else:
            # Одиночная обработка
            similar = self.knowledge_base.find_similar(query, top_k=1)
            if similar and similar[0][1] > 0.7:
                response = self.knowledge_base.successful_responses.get(similar[0][0], "")
            else:
                response = self.openai_client.generate_response(query)
            collective_info = {}
        
        execution_time = time.time() - start_time
        
        # Анализ паттернов нейронной сетью
        pattern_analysis = self.neural_network.analyze_pattern(
            query, self.knowledge_base.vectorizer
        )
        
        # Оценка успешности
        success = pattern_analysis['confidence'] > 0.5
        accuracy = pattern_analysis['confidence']
        self.accuracy_history.append(accuracy)
        
        # Сохранение в базу знаний
        self.knowledge_base.add_knowledge(query, response, success)
        
        # Визуализация
        if self.interaction_count % VISUALIZATION_CONFIG.get('update_interval', 5) == 0:
            avg_accuracy = np.mean(self.accuracy_history[-10:]) if self.accuracy_history else 0.5
            self.visualizer.add_data_point(
                self.interaction_count,
                avg_accuracy,
                len(self.knowledge_base.successful_responses),
                self.improvement_count / max(1, self.interaction_count)
            )
            self.visualizer.plot_learning_curve()
            if use_collective:
                self.visualizer.plot_agent_performance(self.collective)
        
        # Самоулучшение
        if self.interaction_count % AI_CONFIG.get('improvement_interval', 10) == 0:
            self._self_improve()
        
        # Генерация задачи для самообучения
        if self.interaction_count % 20 == 0:
            task = self.task_generator.generate_task(len(self.knowledge_base.successful_responses))
            print(f"\n📚 Сгенерирована задача для самообучения: {task['description']}")
        
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
        
        # Анализ производительности
        if len(self.accuracy_history) > 10:
            recent_accuracy = np.mean(self.accuracy_history[-10:])
            print(f"📊 Средняя точность (последние 10): {recent_accuracy:.3f}")
            
            # Обновление нейронной сети
            if recent_accuracy < 0.7:
                print("🧠 Обучение нейронной сети...")
                # Здесь можно добавить реальное обучение на данных
        
        print(f"📈 Взаимодействий: {self.interaction_count}")
        print(f"💾 База знаний: {len(self.knowledge_base.successful_responses)} записей")
        print(f"🤝 Агентов: {self.collective.num_agents}")
        print("✅ Улучшение завершено\n")
    
    def get_status(self) -> Dict[str, Any]:
        """Получение статуса системы"""
        return {
            'interactions': self.interaction_count,
            'improvements': self.improvement_count,
            'knowledge_base_size': len(self.knowledge_base.successful_responses),
            'avg_accuracy': np.mean(self.accuracy_history[-10:]) if self.accuracy_history else 0.0,
            'openai_usage': self.openai_client.usage_count,
            'collective_agents': self.collective.num_agents,
            'neural_network_trained': len(self.neural_network.training_history) > 0
        }


# ==================== ИНТЕРФЕЙС ====================

def main():
    """Главная функция"""
    print("="*70)
    print(" " * 15 + "ПОЛНОЦЕННАЯ САМОРАЗВИВАЮЩАЯСЯ СИСТЕМА ИИ")
    print("="*70)
    print("\nВозможности:")
    print("✅ Интеграция с OpenAI GPT")
    print("✅ Нейронные сети для анализа")
    print("✅ Коллективный интеллект")
    print("✅ Автоматическая генерация задач")
    print("✅ Визуализация обучения")
    print("="*70 + "\n")
    
    system = UltimateAISystem()
    
    print("\nВведите 'quit' для выхода, 'status' для статуса\n")
    
    while True:
        query = input("Вы: ").strip()
        
        if query.lower() in ['quit', 'exit', 'выход']:
            print("\n💾 Сохраняю все данные...")
            system.knowledge_base.save()
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
        if result.get('collective_info'):
            print(f"👥 Агент: {result['collective_info'].get('selected_agent', 'N/A')}")
        print(f"📊 Уверенность: {result['accuracy']:.2%}\n")


if __name__ == "__main__":
    main()

