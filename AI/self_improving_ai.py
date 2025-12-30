"""
Саморазвивающаяся система ИИ
Реализует концепции метаобучения, самооценки и эволюционного улучшения
"""

import json
import os
import pickle
import random
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import numpy as np


@dataclass
class PerformanceMetrics:
    """Метрики производительности системы"""
    accuracy: float = 0.0
    response_time: float = 0.0
    knowledge_base_size: int = 0
    improvement_rate: float = 0.0
    total_interactions: int = 0
    successful_tasks: int = 0
    timestamp: str = ""


@dataclass
class AIParameters:
    """Параметры ИИ, которые могут быть оптимизированы"""
    learning_rate: float = 0.01
    exploration_rate: float = 0.1
    memory_capacity: int = 1000
    decision_threshold: float = 0.5
    creativity_factor: float = 0.3
    confidence_threshold: float = 0.7


class KnowledgeBase:
    """База знаний, которая растет и улучшается со временем"""
    
    def __init__(self, storage_path: str = "knowledge_base.json"):
        self.storage_path = storage_path
        self.knowledge: Dict[str, Any] = {}
        self.patterns: Dict[str, List[str]] = {}
        self.solutions: Dict[str, Any] = {}
        self.load()
    
    def load(self):
        """Загрузка базы знаний из файла"""
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.knowledge = data.get('knowledge', {})
                    self.patterns = data.get('patterns', {})
                    self.solutions = data.get('solutions', {})
            except Exception as e:
                print(f"Ошибка загрузки базы знаний: {e}")
    
    def save(self):
        """Сохранение базы знаний в файл"""
        try:
            data = {
                'knowledge': self.knowledge,
                'patterns': self.patterns,
                'solutions': self.solutions,
                'last_updated': datetime.now().isoformat()
            }
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Ошибка сохранения базы знаний: {e}")
    
    def add_knowledge(self, key: str, value: Any, category: str = "general"):
        """Добавление нового знания"""
        if category not in self.knowledge:
            self.knowledge[category] = {}
        self.knowledge[category][key] = {
            'value': value,
            'timestamp': datetime.now().isoformat(),
            'usage_count': 0
        }
        self.save()
    
    def get_knowledge(self, key: str, category: str = "general") -> Optional[Any]:
        """Получение знания из базы"""
        if category in self.knowledge and key in self.knowledge[category]:
            self.knowledge[category][key]['usage_count'] += 1
            return self.knowledge[category][key]['value']
        return None
    
    def learn_pattern(self, pattern_type: str, pattern: str):
        """Обучение на паттернах"""
        if pattern_type not in self.patterns:
            self.patterns[pattern_type] = []
        if pattern not in self.patterns[pattern_type]:
            self.patterns[pattern_type].append(pattern)
            self.save()
    
    def find_similar_patterns(self, query: str) -> List[str]:
        """Поиск похожих паттернов"""
        results = []
        for pattern_type, patterns in self.patterns.items():
            for pattern in patterns:
                if query.lower() in pattern.lower() or pattern.lower() in query.lower():
                    results.append(pattern)
        return results
    
    def get_size(self) -> int:
        """Получение размера базы знаний"""
        total = sum(len(cat) for cat in self.knowledge.values())
        total += sum(len(patterns) for patterns in self.patterns.values())
        total += len(self.solutions)
        return total


class SelfEvaluator:
    """Система самооценки и обратной связи"""
    
    def __init__(self):
        self.evaluation_history: List[Dict[str, Any]] = []
        self.feedback_loop: List[Dict[str, Any]] = []
    
    def evaluate_response(self, query: str, response: str, 
                         execution_time: float) -> Dict[str, float]:
        """Оценка качества ответа"""
        metrics = {
            'relevance': self._calculate_relevance(query, response),
            'completeness': self._calculate_completeness(response),
            'efficiency': max(0, 1.0 - execution_time / 10.0),  # Нормализация времени
            'confidence': self._calculate_confidence(response)
        }
        
        overall_score = sum(metrics.values()) / len(metrics)
        metrics['overall'] = overall_score
        
        evaluation = {
            'query': query,
            'response': response,
            'metrics': metrics,
            'timestamp': datetime.now().isoformat()
        }
        
        self.evaluation_history.append(evaluation)
        return metrics
    
    def _calculate_relevance(self, query: str, response: str) -> float:
        """Расчет релевантности ответа"""
        query_words = set(query.lower().split())
        response_words = set(response.lower().split())
        if len(query_words) == 0:
            return 0.0
        intersection = query_words.intersection(response_words)
        return len(intersection) / len(query_words)
    
    def _calculate_completeness(self, response: str) -> float:
        """Расчет полноты ответа"""
        # Более длинные ответы обычно более полные (с ограничением)
        length_score = min(1.0, len(response.split()) / 50.0)
        # Наличие структурированной информации
        structure_score = 1.0 if any(char in response for char in [':', '-', '\n']) else 0.5
        return (length_score + structure_score) / 2.0
    
    def _calculate_confidence(self, response: str) -> float:
        """Расчет уверенности в ответе"""
        # Наличие конкретных фактов и данных
        has_numbers = any(char.isdigit() for char in response)
        has_structure = len(response.split()) > 10
        confidence = 0.5
        if has_numbers:
            confidence += 0.2
        if has_structure:
            confidence += 0.3
        return min(1.0, confidence)
    
    def get_improvement_suggestions(self) -> List[str]:
        """Генерация предложений по улучшению"""
        if len(self.evaluation_history) < 3:
            return ["Недостаточно данных для анализа"]
        
        recent_evaluations = self.evaluation_history[-10:]
        avg_relevance = np.mean([e['metrics']['relevance'] for e in recent_evaluations])
        avg_completeness = np.mean([e['metrics']['completeness'] for e in recent_evaluations])
        avg_efficiency = np.mean([e['metrics']['efficiency'] for e in recent_evaluations])
        
        suggestions = []
        if avg_relevance < 0.6:
            suggestions.append("Улучшить релевантность ответов - лучше анализировать запросы")
        if avg_completeness < 0.6:
            suggestions.append("Увеличить полноту ответов - предоставлять больше деталей")
        if avg_efficiency < 0.7:
            suggestions.append("Оптимизировать скорость обработки запросов")
        
        return suggestions if suggestions else ["Производительность в норме"]


class EvolutionaryOptimizer:
    """Эволюционный оптимизатор параметров ИИ"""
    
    def __init__(self, population_size: int = 10):
        self.population_size = population_size
        self.generation = 0
        self.population: List[Dict[str, AIParameters]] = []
        self.fitness_history: List[float] = []
    
    def initialize_population(self, base_params: AIParameters):
        """Инициализация популяции параметров"""
        self.population = []
        for _ in range(self.population_size):
            mutated = self._mutate_params(base_params)
            self.population.append({
                'params': mutated,
                'fitness': 0.0
            })
        self.generation = 0
    
    def _mutate_params(self, params: AIParameters) -> AIParameters:
        """Мутация параметров"""
        mutation_rate = 0.1
        new_params = AIParameters(
            learning_rate=max(0.001, params.learning_rate + random.uniform(-mutation_rate, mutation_rate)),
            exploration_rate=max(0.0, min(1.0, params.exploration_rate + random.uniform(-mutation_rate, mutation_rate))),
            memory_capacity=max(100, params.memory_capacity + random.randint(-100, 100)),
            decision_threshold=max(0.0, min(1.0, params.decision_threshold + random.uniform(-0.1, 0.1))),
            creativity_factor=max(0.0, min(1.0, params.creativity_factor + random.uniform(-0.1, 0.1))),
            confidence_threshold=max(0.0, min(1.0, params.confidence_threshold + random.uniform(-0.1, 0.1)))
        )
        return new_params
    
    def evaluate_fitness(self, params: AIParameters, performance: PerformanceMetrics) -> float:
        """Оценка пригодности параметров"""
        # Комплексная оценка на основе метрик производительности
        fitness = (
            performance.accuracy * 0.4 +
            (1.0 - min(1.0, performance.response_time / 5.0)) * 0.2 +
            min(1.0, performance.knowledge_base_size / 1000.0) * 0.2 +
            performance.improvement_rate * 0.2
        )
        return fitness
    
    def evolve(self, current_performance: PerformanceMetrics) -> AIParameters:
        """Эволюция параметров"""
        if not self.population:
            return AIParameters()
        
        # Оценка текущей популяции
        for individual in self.population:
            individual['fitness'] = self.evaluate_fitness(
                individual['params'], 
                current_performance
            )
        
        # Сортировка по пригодности
        self.population.sort(key=lambda x: x['fitness'], reverse=True)
        
        # Сохранение лучшей пригодности
        best_fitness = self.population[0]['fitness']
        self.fitness_history.append(best_fitness)
        
        # Селекция и размножение лучших
        elite_size = max(1, self.population_size // 4)
        elite = [ind['params'] for ind in self.population[:elite_size]]
        
        # Создание нового поколения
        new_population = []
        for i in range(self.population_size):
            if i < elite_size:
                # Элита сохраняется
                new_population.append({'params': elite[i], 'fitness': 0.0})
            else:
                # Скрещивание и мутация
                parent1 = random.choice(elite)
                parent2 = random.choice(elite)
                child = self._crossover(parent1, parent2)
                child = self._mutate_params(child)
                new_population.append({'params': child, 'fitness': 0.0})
        
        self.population = new_population
        self.generation += 1
        
        return self.population[0]['params']  # Возвращаем лучшие параметры
    
    def _crossover(self, parent1: AIParameters, parent2: AIParameters) -> AIParameters:
        """Скрещивание двух наборов параметров"""
        return AIParameters(
            learning_rate=(parent1.learning_rate + parent2.learning_rate) / 2,
            exploration_rate=(parent1.exploration_rate + parent2.exploration_rate) / 2,
            memory_capacity=(parent1.memory_capacity + parent2.memory_capacity) // 2,
            decision_threshold=(parent1.decision_threshold + parent2.decision_threshold) / 2,
            creativity_factor=(parent1.creativity_factor + parent2.creativity_factor) / 2,
            confidence_threshold=(parent1.confidence_threshold + parent2.confidence_threshold) / 2
        )


class SelfImprovingAI:
    """Основной класс саморазвивающегося ИИ"""
    
    def __init__(self, name: str = "SelfImprovingAI"):
        self.name = name
        self.parameters = AIParameters()
        self.knowledge_base = KnowledgeBase()
        self.evaluator = SelfEvaluator()
        self.optimizer = EvolutionaryOptimizer()
        self.performance = PerformanceMetrics()
        self.optimizer.initialize_population(self.parameters)
        self.history: List[Dict[str, Any]] = []
        
        print(f"🤖 {self.name} инициализирован")
        print(f"📊 Начальные параметры: {asdict(self.parameters)}")
    
    def process(self, query: str) -> str:
        """Обработка запроса с самообучением"""
        start_time = time.time()
        
        # Поиск в базе знаний
        response = self._generate_response(query)
        
        execution_time = time.time() - start_time
        
        # Самооценка ответа
        metrics = self.evaluator.evaluate_response(query, response, execution_time)
        
        # Обновление базы знаний
        self._learn_from_interaction(query, response, metrics)
        
        # Обновление метрик производительности
        self._update_performance(metrics, execution_time)
        
        # Периодическая оптимизация параметров
        if self.performance.total_interactions % 10 == 0:
            self._self_improve()
        
        return response
    
    def _generate_response(self, query: str) -> str:
        """Генерация ответа на запрос"""
        # Поиск похожих паттернов
        similar_patterns = self.knowledge_base.find_similar_patterns(query)
        
        # Поиск в базе знаний
        knowledge = self.knowledge_base.get_knowledge(query.lower(), "responses")
        
        if knowledge:
            return knowledge
        elif similar_patterns:
            # Адаптация найденных паттернов
            base_response = similar_patterns[0]
            return f"На основе предыдущего опыта: {base_response}. Дополнительно анализирую ваш запрос: {query}"
        else:
            # Генерация нового ответа
            return self._create_new_response(query)
    
    def _create_new_response(self, query: str) -> str:
        """Создание нового ответа"""
        # Простая логика генерации (можно заменить на LLM)
        response_parts = [
            f"Анализирую запрос: {query}",
            f"Используя параметры: learning_rate={self.parameters.learning_rate:.3f}",
            "Генерирую ответ на основе текущих знаний и параметров системы."
        ]
        
        # Добавление креативности в зависимости от параметра
        if random.random() < self.parameters.creativity_factor:
            response_parts.append("Применяю креативный подход к решению.")
        
        return " | ".join(response_parts)
    
    def _learn_from_interaction(self, query: str, response: str, metrics: Dict[str, float]):
        """Обучение на основе взаимодействия"""
        # Сохранение успешных ответов
        if metrics['overall'] > self.parameters.confidence_threshold:
            self.knowledge_base.add_knowledge(
                query.lower(), 
                response, 
                "responses"
            )
            self.knowledge_base.learn_pattern("successful_queries", query)
            self.performance.successful_tasks += 1
    
    def _update_performance(self, metrics: Dict[str, float], execution_time: float):
        """Обновление метрик производительности"""
        self.performance.total_interactions += 1
        self.performance.accuracy = (
            self.performance.accuracy * 0.9 + metrics['overall'] * 0.1
        )
        self.performance.response_time = (
            self.performance.response_time * 0.9 + execution_time * 0.1
        )
        self.performance.knowledge_base_size = self.knowledge_base.get_size()
        self.performance.timestamp = datetime.now().isoformat()
    
    def _self_improve(self):
        """Процесс самоулучшения"""
        print("\n🔄 Начинаю процесс самоулучшения...")
        
        # Получение предложений по улучшению
        suggestions = self.evaluator.get_improvement_suggestions()
        print(f"💡 Предложения: {suggestions}")
        
        # Эволюционная оптимизация параметров
        old_params = self.parameters
        new_params = self.optimizer.evolve(self.performance)
        
        # Применение улучшенных параметров
        if self.optimizer.fitness_history:
            if len(self.optimizer.fitness_history) > 1:
                improvement = self.optimizer.fitness_history[-1] - self.optimizer.fitness_history[-2]
                self.performance.improvement_rate = improvement
        
        self.parameters = new_params
        
        print(f"📈 Поколение {self.optimizer.generation}")
        print(f"📊 Новые параметры: {asdict(self.parameters)}")
        print(f"✅ Улучшение завершено\n")
    
    def get_status(self) -> Dict[str, Any]:
        """Получение статуса системы"""
        return {
            'name': self.name,
            'parameters': asdict(self.parameters),
            'performance': asdict(self.performance),
            'knowledge_base_size': self.knowledge_base.get_size(),
            'generation': self.optimizer.generation,
            'total_evaluations': len(self.evaluator.evaluation_history)
        }
    
    def save_state(self, filepath: str = "ai_state.pkl"):
        """Сохранение состояния системы"""
        state = {
            'parameters': self.parameters,
            'performance': self.performance,
            'generation': self.optimizer.generation,
            'fitness_history': self.optimizer.fitness_history
        }
        with open(filepath, 'wb') as f:
            pickle.dump(state, f)
        print(f"💾 Состояние сохранено в {filepath}")
    
    def load_state(self, filepath: str = "ai_state.pkl"):
        """Загрузка состояния системы"""
        if os.path.exists(filepath):
            with open(filepath, 'rb') as f:
                state = pickle.load(f)
                self.parameters = state['parameters']
                self.performance = state['performance']
                self.optimizer.generation = state['generation']
                self.optimizer.fitness_history = state['fitness_history']
            print(f"📂 Состояние загружено из {filepath}")


# Пример использования
if __name__ == "__main__":
    # Создание саморазвивающегося ИИ
    ai = SelfImprovingAI("МойСаморазвивающийсяИИ")
    
    # Примеры взаимодействия
    queries = [
        "Что такое машинное обучение?",
        "Как работает нейронная сеть?",
        "Объясни концепцию самоулучшения",
        "Что такое эволюционные алгоритмы?",
        "Как оптимизировать производительность?"
    ]
    
    print("\n" + "="*60)
    print("НАЧАЛО ВЗАИМОДЕЙСТВИЯ С САМОРАЗВИВАЮЩИМСЯ ИИ")
    print("="*60 + "\n")
    
    for i, query in enumerate(queries, 1):
        print(f"\n[Запрос {i}] {query}")
        print("-" * 60)
        response = ai.process(query)
        print(f"Ответ: {response}")
        print(f"Точность: {ai.performance.accuracy:.3f}")
        print(f"Размер базы знаний: {ai.performance.knowledge_base_size}")
        time.sleep(0.5)  # Небольшая задержка для демонстрации
    
    # Финальный статус
    print("\n" + "="*60)
    print("ФИНАЛЬНЫЙ СТАТУС СИСТЕМЫ")
    print("="*60)
    status = ai.get_status()
    for key, value in status.items():
        print(f"{key}: {value}")
    
    # Сохранение состояния
    ai.save_state()

