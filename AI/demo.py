"""
Демонстрационный скрипт для саморазвивающегося ИИ
Показывает различные возможности системы
"""

from self_improving_ai import SelfImprovingAI
from advanced_self_improving_ai import AdvancedSelfImprovingAI, CollectiveIntelligence
import time


def demo_basic_ai():
    """Демонстрация базовой версии"""
    print("\n" + "="*70)
    print(" " * 15 + "ДЕМОНСТРАЦИЯ БАЗОВОЙ ВЕРСИИ")
    print("="*70 + "\n")
    
    ai = SelfImprovingAI("ДемоИИ")
    
    queries = [
        "Привет! Как дела?",
        "Расскажи о машинном обучении",
        "Что такое нейронные сети?",
        "Как работает самоулучшение?",
    ]
    
    for i, query in enumerate(queries, 1):
        print(f"\n{'─'*70}")
        print(f"Запрос {i}: {query}")
        print(f"{'─'*70}")
        
        response = ai.process(query)
        print(f"\n💬 Ответ ИИ:\n{response}\n")
        
        print(f"📊 Статистика:")
        print(f"   • Точность: {ai.performance.accuracy:.3f}")
        print(f"   • Размер базы знаний: {ai.performance.knowledge_base_size}")
        print(f"   • Всего взаимодействий: {ai.performance.total_interactions}")
        print(f"   • Успешных задач: {ai.performance.successful_tasks}")
        
        time.sleep(0.5)
    
    # Финальный статус
    print(f"\n{'═'*70}")
    print("ФИНАЛЬНЫЙ СТАТУС СИСТЕМЫ")
    print(f"{'═'*70}")
    status = ai.get_status()
    for key, value in status.items():
        if key == 'parameters':
            print(f"\n⚙️  Параметры:")
            for param, val in value.items():
                print(f"   • {param}: {val}")
        elif key == 'performance':
            print(f"\n📈 Производительность:")
            for metric, val in value.items():
                if metric != 'timestamp':
                    print(f"   • {metric}: {val}")
        else:
            print(f"   • {key}: {value}")
    
    ai.save_state("demo_basic_state.pkl")
    print(f"\n💾 Состояние сохранено!")


def demo_advanced_ai():
    """Демонстрация продвинутой версии"""
    print("\n" + "="*70)
    print(" " * 12 + "ДЕМОНСТРАЦИЯ ПРОДВИНУТОЙ ВЕРСИИ")
    print("="*70 + "\n")
    
    advanced_ai = AdvancedSelfImprovingAI("ПродвинутыйДемоИИ", use_neural_network=True)
    
    queries = [
        "Объясни концепцию искусственного интеллекта",
        "Как работает глубокое обучение?",
        "Что такое трансферное обучение?",
        "Расскажи о рекуррентных нейронных сетях",
        "Как оптимизировать гиперпараметры?",
    ]
    
    for i, query in enumerate(queries, 1):
        print(f"\n{'─'*70}")
        print(f"Запрос {i}: {query}")
        print(f"{'─'*70}")
        
        response = advanced_ai.process(query)
        print(f"\n💬 Ответ ИИ:\n{response}\n")
        
        if i % 2 == 0:
            print("📊 Промежуточная статистика:")
            print(f"   • Поколение эволюции: {advanced_ai.optimizer.generation}")
            print(f"   • Точность: {advanced_ai.performance.accuracy:.3f}")
        
        time.sleep(0.3)
    
    # Аналитический отчет
    print(f"\n{'═'*70}")
    print("АНАЛИТИЧЕСКИЙ ОТЧЕТ")
    print(f"{'═'*70}")
    print(advanced_ai.get_analytics_report())
    
    # Визуализация
    print(advanced_ai.visualize_improvement())
    
    advanced_ai.analytics.save_analytics("demo_analytics.json")
    advanced_ai.save_state("demo_advanced_state.pkl")
    print(f"\n💾 Все данные сохранены!")


def demo_collective_intelligence():
    """Демонстрация коллективного интеллекта"""
    print("\n" + "="*70)
    print(" " * 10 + "ДЕМОНСТРАЦИЯ КОЛЛЕКТИВНОГО ИНТЕЛЛЕКТА")
    print("="*70 + "\n")
    
    collective = CollectiveIntelligence(num_agents=3)
    
    print(f"🤝 Создана сеть из {collective.num_agents} ИИ-агентов\n")
    
    queries = [
        "Что такое саморазвивающийся ИИ?",
        "Как работает коллективный интеллект?",
        "Объясни преимущества распределенных систем",
    ]
    
    for i, query in enumerate(queries, 1):
        print(f"\n{'─'*70}")
        print(f"Запрос {i}: {query}")
        print(f"{'─'*70}")
        
        response, info = collective.process_collectively(query)
        
        print(f"\n💬 Коллективный ответ:\n{response}\n")
        print(f"📊 Информация о коллективе:")
        print(f"   • Использовано агентов: {info['num_agents']}")
        print(f"   • Выбранный агент: Agent_{info['selected_agent']+1}")
        print(f"   • Средняя уверенность: {info['avg_confidence']:.3f}")
        
        print(f"\n💭 Ответы всех агентов:")
        for idx, agent_response in enumerate(info['responses'], 1):
            print(f"   Agent_{idx}: {agent_response[:60]}...")
        
        time.sleep(0.5)
    
    print(f"\n{'═'*70}")
    print(f"📝 Лог коммуникации: {len(collective.communication_log)} записей")
    print(f"{'═'*70}")


def main():
    """Главная функция демонстрации"""
    print("\n" + "╔" + "═"*68 + "╗")
    print("║" + " "*15 + "САМОРАЗВИВАЮЩАЯСЯ СИСТЕМА ИИ" + " "*25 + "║")
    print("╚" + "═"*68 + "╝")
    
    try:
        # Демонстрация базовой версии
        demo_basic_ai()
        
        input("\n\nНажмите Enter для продолжения к продвинутой версии...")
        
        # Демонстрация продвинутой версии
        demo_advanced_ai()
        
        input("\n\nНажмите Enter для продолжения к коллективному интеллекту...")
        
        # Демонстрация коллективного интеллекта
        demo_collective_intelligence()
        
        print("\n\n" + "═"*70)
        print(" " * 20 + "ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА")
        print("═"*70)
        print("\n✅ Все компоненты системы протестированы!")
        print("📁 Проверьте созданные файлы:")
        print("   • knowledge_base.json - база знаний")
        print("   • demo_*.pkl - сохраненные состояния")
        print("   • demo_analytics.json - аналитические данные")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Демонстрация прервана пользователем")
    except Exception as e:
        print(f"\n\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

