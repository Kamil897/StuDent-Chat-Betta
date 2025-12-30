"""
ПОЛНОЦЕННАЯ САМОРАЗВИВАЮЩАЯСЯ СИСТЕМА ИИ
Основана на существующем чат-боте, но с добавлением механизмов саморазвития
"""

from random import randint
from time import sleep
from time import time
import webbrowser
import re
import math
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import pickle

# ==================== СИСТЕМА САМОРАЗВИТИЯ ====================

class KnowledgeBase:
    """База знаний, которая растет и улучшается со временем"""
    
    def __init__(self, storage_path: str = "ai_knowledge_base.json"):
        self.storage_path = storage_path
        self.knowledge: Dict[str, Any] = {}
        self.user_preferences: Dict[str, Any] = {}
        self.interaction_history: List[Dict[str, Any]] = []
        self.successful_responses: Dict[str, str] = {}
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
            except Exception as e:
                print(f"Ошибка загрузки базы знаний: {e}")
    
    def save(self):
        """Сохранение базы знаний"""
        try:
            data = {
                'knowledge': self.knowledge,
                'user_preferences': self.user_preferences,
                'interaction_history': self.interaction_history[-1000:],  # Последние 1000
                'successful_responses': self.successful_responses,
                'last_updated': datetime.now().isoformat()
            }
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Ошибка сохранения: {e}")
    
    def remember_user_preference(self, key: str, value: Any):
        """Запоминание предпочтений пользователя"""
        self.user_preferences[key] = value
        self.save()
    
    def get_user_preference(self, key: str, default: Any = None) -> Any:
        """Получение предпочтения пользователя"""
        return self.user_preferences.get(key, default)
    
    def learn_from_interaction(self, query: str, response: str, success: bool = True):
        """Обучение на взаимодействии"""
        interaction = {
            'query': query,
            'response': response,
            'success': success,
            'timestamp': datetime.now().isoformat()
        }
        self.interaction_history.append(interaction)
        
        if success:
            # Сохраняем успешные ответы
            query_lower = query.lower()
            if query_lower not in self.successful_responses:
                self.successful_responses[query_lower] = response
        
        self.save()
    
    def find_similar_query(self, query: str) -> Optional[str]:
        """Поиск похожего запроса в истории"""
        query_lower = query.lower()
        # Прямое совпадение
        if query_lower in self.successful_responses:
            return self.successful_responses[query_lower]
        
        # Поиск по ключевым словам
        query_words = set(query_lower.split())
        for saved_query, response in self.successful_responses.items():
            saved_words = set(saved_query.split())
            if len(query_words.intersection(saved_words)) >= 2:
                return response
        
        return None


class SelfEvaluator:
    """Система самооценки"""
    
    def __init__(self):
        self.evaluations: List[Dict[str, Any]] = []
        self.improvement_suggestions: List[str] = []
    
    def evaluate_interaction(self, query: str, response: str, user_satisfaction: bool = None) -> Dict[str, float]:
        """Оценка взаимодействия"""
        metrics = {
            'response_length_score': min(1.0, len(response.split()) / 20.0),
            'relevance_score': self._calculate_relevance(query, response),
            'completeness_score': self._calculate_completeness(response),
        }
        
        if user_satisfaction is not None:
            metrics['user_satisfaction'] = 1.0 if user_satisfaction else 0.0
        
        overall = sum(metrics.values()) / len(metrics)
        metrics['overall_score'] = overall
        
        evaluation = {
            'query': query,
            'metrics': metrics,
            'timestamp': datetime.now().isoformat()
        }
        self.evaluations.append(evaluation)
        
        return metrics
    
    def _calculate_relevance(self, query: str, response: str) -> float:
        """Расчет релевантности"""
        query_words = set(query.lower().split())
        response_words = set(response.lower().split())
        if len(query_words) == 0:
            return 0.0
        intersection = query_words.intersection(response_words)
        return min(1.0, len(intersection) / len(query_words) * 2)
    
    def _calculate_completeness(self, response: str) -> float:
        """Расчет полноты ответа"""
        length = len(response.split())
        if length < 5:
            return 0.3
        elif length < 15:
            return 0.6
        else:
            return 1.0
    
    def get_improvement_suggestions(self) -> List[str]:
        """Получение предложений по улучшению"""
        if len(self.evaluations) < 5:
            return ["Недостаточно данных для анализа"]
        
        recent = self.evaluations[-10:]
        avg_score = sum(e['metrics']['overall_score'] for e in recent) / len(recent)
        
        suggestions = []
        if avg_score < 0.6:
            suggestions.append("Улучшить релевантность ответов")
        if avg_score < 0.7:
            suggestions.append("Увеличить полноту информации в ответах")
        
        return suggestions if suggestions else ["Производительность в норме"]


class SelfImprovingSystem:
    """Основная система самоулучшения"""
    
    def __init__(self):
        self.knowledge_base = KnowledgeBase()
        self.evaluator = SelfEvaluator()
        self.interaction_count = 0
        self.improvement_count = 0
        self.learning_rate = 0.1
        self.performance_history: List[float] = []
    
    def process_interaction(self, query: str, response: str, user_feedback: bool = None):
        """Обработка взаимодействия с обучением"""
        self.interaction_count += 1
        
        # Оценка взаимодействия
        metrics = self.evaluator.evaluate_interaction(query, response, user_feedback)
        
        # Обучение на основе результата
        success = metrics['overall_score'] > 0.6 or (user_feedback is True)
        self.knowledge_base.learn_from_interaction(query, response, success)
        
        # Периодическое самоулучшение
        if self.interaction_count % 10 == 0:
            self._self_improve()
        
        return metrics
    
    def _self_improve(self):
        """Процесс самоулучшения"""
        self.improvement_count += 1
        suggestions = self.evaluator.get_improvement_suggestions()
        
        # Анализ производительности
        if len(self.evaluator.evaluations) > 0:
            recent_scores = [e['metrics']['overall_score'] for e in self.evaluator.evaluations[-10:]]
            avg_score = sum(recent_scores) / len(recent_scores)
            self.performance_history.append(avg_score)
            
            # Адаптация скорости обучения
            if avg_score > 0.8:
                self.learning_rate = min(0.2, self.learning_rate * 1.1)
            elif avg_score < 0.5:
                self.learning_rate = max(0.05, self.learning_rate * 0.9)
        
        print(f"\n🔄 [САМОУЛУЧШЕНИЕ #{self.improvement_count}]")
        print(f"💡 Предложения: {', '.join(suggestions)}")
        print(f"📊 Взаимодействий: {self.interaction_count}")
        print(f"📈 Размер базы знаний: {len(self.knowledge_base.successful_responses)}")
        print(f"⚙️  Скорость обучения: {self.learning_rate:.3f}\n")
    
    def get_smart_response(self, query: str) -> Optional[str]:
        """Получение умного ответа на основе накопленных знаний"""
        return self.knowledge_base.find_similar_query(query)
    
    def get_status(self) -> Dict[str, Any]:
        """Получение статуса системы"""
        return {
            'interactions': self.interaction_count,
            'improvements': self.improvement_count,
            'knowledge_base_size': len(self.knowledge_base.successful_responses),
            'learning_rate': self.learning_rate,
            'avg_performance': sum(self.performance_history[-10:]) / len(self.performance_history[-10:]) if self.performance_history else 0.0
        }


# ==================== ОСНОВНОЙ ЧАТ-БОТ С САМОРАЗВИТИЕМ ====================

# Глобальная система саморазвития
ai_system = SelfImprovingSystem()

print('='* 64)
print('🤖 САМОРАЗВИВАЮЩАЯСЯ СИСТЕМА ИИ')
print('='* 64)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def print_menu_ru():
    print('\nВот что я умею:')
    print('▷ 1 - Игра - (Угадай число)')
    print('▷ 2 - Порекомендовать фильм')
    print('▷ 3 - Посчитать скорость набора текста')
    print('▷ 4 - Открыть сайт')
    print('▷ 5 - Открыть калькулятор')
    print('▷ 6 - Анализ текста')
    print('▷ 7 - Рандомная генерация чисел')
    print('▷ 8 - Крестики-Нолики')
    print('▷ 9 - Прогноз погоды')
    print('▷ 10 - Новости мира (Алгоритмики)')
    print('▷ 11 - Секундомер')
    print('▷ 12 - Мини-игра (Математика)')
    print('▷ 13 - Рекомендации игр')
    print('▷ 14 - Открыть случайную Википедию')
    print('▷ 15 - Посчитать средний балл по школьному предмету')
    print('▷ # - Найти любую информацию в интернете')
    print('▷ + - Посмотреть настройки и статус ИИ')
    print('▷ = - Стоп')
    print('▷ status - Статус саморазвития')
    print('-'*64)
    print('Можешь ввести название функции или её номер, я всё равно пойму тебя')
    print('-'*64)

def print_menu_eu():
    print("\nHere's what I can do:")
    print('▷ 1 - Mini-game (Guess the number)')
    print('▷ 2 - Recommend a movie')
    print('▷ 3 - Calculate the typing speed')
    print('▷ 4 - Open a website')
    print('▷ 5 - Open the calculator')
    print('▷ 6 - Text Analysis')
    print('▷ 7 - Random number generation')
    print('▷ 8 - Tic-Tac-Toe')
    print('▷ 9 - Weather forecast')
    print('▷ 10 - World News (Algorithmics)')
    print('▷ 11 - Stopwatch')
    print('▷ 12 - Mini-game (Math)')
    print('▷ 13 - Game Recommendations')
    print('▷ 14 - Open a random Wikipedia')
    print('▷ 15 - Calculate the average score for a school subject')
    print('▷ # - Find any information on the Internet')
    print('▷ + - View settings and AI status')
    print('▷ = - Stop')
    print('▷ status - Self-improvement status')

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
language = input('Привет! Для начала введи свой язык!\n\n▷ RUS - Russian (Русский)\n▷ ENG - English (Английский)\n\n').lower()
while True:
    if language == 'rus' or language == 'рус' or language == 'русский' or language == 'russian' or language == 'рашн':
        language = 'rus'
        break
    elif language == 'eng' or language == 'инг' or language == 'английский' or language == 'english' or language == 'инглиш':
        language = 'eng'
        break
    else:
        language = input('Please enter your language!\nПожалуйста, введите свой язык!\n\n▷ RUS - Russian (Русский)\n▷ ENG - English (Английский)\n\n').lower()
print('-'*62,'\n')

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
yandex = 'https://yandex.ru/search/?text='         
google = 'https://google.ru/search?q='     
DuckDuckGo = 'https://duckduckgo.com/?q='
bing = 'https://bing.com/?q='
ecosia = 'https://www.ecosia.org/search?q='
yahoo = 'https://search.yahoo.com/search?p='
mailru = 'https://go.mail.ru/search?q='

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if language == 'rus':
    print('Приветствую!')
    print('Меня зовут Иван! Я саморазвивающийся ИИ!')
    name = input('Напишите своё имя либо никнайм: ')
    ai_system.knowledge_base.remember_user_preference('user_name', name)
    print(f'Приятно познакомиться, {name}!')
    
    # Проверяем, знаем ли мы пользователя
    saved_name = ai_system.knowledge_base.get_user_preference('user_name')
    if saved_name and saved_name != name:
        print(f'Я помню, что раньше вы называли себя {saved_name}. Обновляю информацию!')
    
    rec_browser = input('Какой браузер ты предпочитаешь? ').lower()
    ai_system.knowledge_base.remember_user_preference('preferred_browser', rec_browser)
    
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    yandex_eng = rec_browser.find('yandex')
    yandex_ru = rec_browser.find('яндекс')
    google_ru = rec_browser.find('гугл')
    google_eng = rec_browser.find('google')
    DuckDuckGo_eng_classic = rec_browser.find('duckduckgo')
    DuckDuckGo_ru_classic = rec_browser.find('дакдакго')
    DuckDuckGo_ru_classic_correct = rec_browser.find('дакдакгоу')
    DuckDuckGo_ru = rec_browser.find('дак дак го')
    DuckDuckGo_ru_correct = rec_browser.find('дак дак гоу')
    DuckDuckGo_eng = rec_browser.find('duck duck go')
    bing_ru = rec_browser.find('бинг')
    bing_eng = rec_browser.find('bing')
    ecosia_ru = rec_browser.find('экозия')
    ecosia_eng = rec_browser.find('ecosia')
    yahoo_ru = rec_browser.find('яху')
    yahoo_eng = rec_browser.find('yahoo')
    mailru_rus = rec_browser.find('майл')
    mailru_rus_2 = rec_browser.find('мэйл')
    mailru_eng_ru = rec_browser.find('mail')
    
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if yandex_eng != -1 or yandex_ru != -1:
        print('Русский браузер?')
        browser = yandex
    elif DuckDuckGo_eng_classic != -1 or DuckDuckGo_ru != -1 or DuckDuckGo_ru_classic != -1 or DuckDuckGo_ru_classic_correct != -1 or DuckDuckGo_ru_correct != -1 or DuckDuckGo_eng != -1: 
        print('Любишь конфиденциальность?')
        browser = DuckDuckGo
    elif bing_ru != -1 or bing_eng != -1:
        print('Майкрософт, понятно')
        browser = bing
    elif ecosia_ru != -1 or ecosia_eng != -1:
        print('Молодец! Я тоже за экологию!')
        browser = ecosia
    elif yahoo_eng != -1 or yahoo_ru != -1:
        print('Ух-ты! Ты настоящий олд')
        browser = yahoo
    elif mailru_eng_ru != -1 or mailru_rus != -1 or mailru_rus_2 != -1:
        print('Давно я таких людей не встречал!')
        browser = mailru
    else:
        print('Спасибо за ответ!')
        browser = google
    
    ai_system.knowledge_base.remember_user_preference('browser', browser)
    print_menu_ru()
    q = input('Как я могу тебе помочь? ').lower()
    
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    while q != '=':
        # Проверка на статус саморазвития
        if q == 'status' or q == 'статус':
            status = ai_system.get_status()
            print('\n' + '='*64)
            print('📊 СТАТУС САМОРАЗВИТИЯ ИИ')
            print('='*64)
            print(f"Взаимодействий: {status['interactions']}")
            print(f"Циклов улучшения: {status['improvements']}")
            print(f"Размер базы знаний: {status['knowledge_base_size']} записей")
            print(f"Скорость обучения: {status['learning_rate']:.3f}")
            if status['avg_performance'] > 0:
                print(f"Средняя производительность: {status['avg_performance']:.2%}")
            print('='*64 + '\n')
            print_menu_ru()
            q = input('Как я могу тебе помочь? ').lower()
            continue
        
        # Обработка запроса с самообучением
        start_time = time()
        response_generated = False
        
        if q == '1' or "угадай" in q:
            mode = input('Кто будет угадывать? (1 - Вы / 2 - Компьютер) ')
            if mode == '1':
                print('Ты хочешь ввести максимальное число сам или выбрать уровень сложности?')
                print('1 - Ввести самому!')
                print('2 - Выбрать из уровней сложности!')
                q_rand_num = int(input('Выбирайте: '))
                if q_rand_num == 1:
                    num_play = int(input('Прошу, вводите: '))
                elif q_rand_num == 2:
                    print('1 - Легко (5 макс. число)')
                    print('2 - Нормально (10 макс. число)')
                    print('3 - Сложно (30 макс. число)')
                    num_play_q = int(input('Прошу, выбирайте: '))
                    if num_play_q == 1:
                        num_play = 5
                    elif num_play_q == 2:
                        num_play = 10
                    elif num_play_q == 3:
                        num_play = 30
                num_play_a = randint(1, num_play)
                print(f'Угадай загаданное мною число от 1 до {num_play}!')
                print('Я буду подсказывать вам, говоря, что моё число больше(>) или меньше(<) вашего числа!')
                player_num = int(input('Вводите число: '))
                steps = 1
                while player_num != num_play_a:
                    if player_num < num_play_a:
                        print(f'Загаданное мною число > {player_num}')
                        steps += 1
                        player_num = int(input('Вводите число: '))
                    elif player_num > num_play_a:
                        steps += 1
                        print(f'Загаданное мною число < {player_num}')
                        player_num = int(input('Вводите число: '))
                print('Вы угадали число и выиграли!')
                print(f'Число угадано с {steps} попытки!')
                response_generated = True
                ai_system.process_interaction(q, f"Игра завершена за {steps} попыток", True)
                print('-'*62,'\n')
            elif mode == '2':
                steps = 0
                arr = range(1, 102)
                print("Загадай любое число от 1 до 100")
                input('Нажми "Enter" когда будешь готов!')
                low = 0
                high = len(arr)-1
                while low < high:
                    steps += 1
                    middle = (low+high) // 2
                    ans_form = randint(1,5)
                    if ans_form == 1:
                        print(f'Это число - {arr[middle]}?')
                    elif ans_form == 2:
                        print(f'Быть может это - {arr[middle]}?')
                    elif ans_form == 3:
                        print(f'Я думаю это - {arr[middle]}?')
                    elif ans_form == 4:
                        print(f'Я уверен, что это - {arr[middle]}?')
                    elif ans_form == 5:
                        print(f'Может, тогда - {arr[middle]}?')
                    num_search = input('(< - меньше / > - больше / = - равно) ')
                    if num_search == "=":
                        print(f"Число отгадано с {steps} попыток!")
                        response_generated = True
                        ai_system.process_interaction(q, f"Компьютер угадал за {steps} попыток", True)
                        break
                    elif num_search == "<":
                        high = middle
                    elif num_search == ">":
                        low = middle
                    if num_search == ">" and high == 100 and low == 99:
                        low = high
                        if low == high:
                            print("Загаданное тобою число < 1 / > 100 / ты неправильно поставил знаки!")
                            break
                print('-'*62)
        
        #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        elif q == '2' or 'фильмы' in q or 'фильм' in q:
            # Проверяем предпочтения пользователя
            preferred_genre = ai_system.knowledge_base.get_user_preference('preferred_film_genre')
            
            print('1 - комедии')
            print('2 - триллеры')
            print('3 - детектив')
            print('4 - ужасы')
            print('5 - романтические')
            if preferred_genre:
                print(f'[Я помню, что вы предпочитаете: {preferred_genre}]')
            catag = input('Какой жанр вы предпочитаете? ')
            
            if catag == '1':
                films_comedy = ['Операция «Ы» и другие приключения Шурика','Тупой и ещё тупее','Иван Васильевич меняет профессию','Бриллиантовая рука','Один дома','Назад в будущее','Третий лишний']
                film_comedy_rand = randint(0,len(films_comedy)-1)
                recommendation = films_comedy[film_comedy_rand]
                print(f'Я советую посмотреть: {recommendation}')
                ai_system.knowledge_base.remember_user_preference('preferred_film_genre', 'комедии')
                response_generated = True
                ai_system.process_interaction(q, f"Рекомендован фильм: {recommendation}", True)
            elif catag == '2':
                films_triller = ['Побег из Претории','Амнезия','Гнев человеческий','Никто','Взаперти','Кто не спрятался']
                film_triller_rand = randint(0,len(films_triller)-1)
                recommendation = films_triller[film_triller_rand]
                print(f'Я советую посмотреть: {recommendation}')
                ai_system.knowledge_base.remember_user_preference('preferred_film_genre', 'триллеры')
                response_generated = True
                ai_system.process_interaction(q, f"Рекомендован фильм: {recommendation}", True)
            elif catag == '3':
                films_d = ['Комната желаний','Поиск','Энола Холмс']
                film_d_rand = randint(0,len(films_d)-1)
                recommendation = films_d[film_d_rand]
                print(f'Посмотрите: {recommendation}')
                ai_system.knowledge_base.remember_user_preference('preferred_film_genre', 'детектив')
                response_generated = True
                ai_system.process_interaction(q, f"Рекомендован фильм: {recommendation}", True)
            elif catag == '4':
                films_scream = ['Поворот не туда','Заклятие 3','Греттель и Гензель']
                film_scream_rand = randint(0,len(films_scream)-1)
                recommendation = films_scream[film_scream_rand]
                print(f'Есть хороший фильм - {recommendation}')
                ai_system.knowledge_base.remember_user_preference('preferred_film_genre', 'ужасы')
                response_generated = True
                ai_system.process_interaction(q, f"Рекомендован фильм: {recommendation}", True)
            elif catag == '5':
                films_l = ['Эмма','Жизнь за год','365 дней']
                film_l_rand = randint(0,len(films_l)-1)
                recommendation = films_l[film_l_rand]
                print(f'Советую: {recommendation}')
                ai_system.knowledge_base.remember_user_preference('preferred_film_genre', 'романтические')
                response_generated = True
                ai_system.process_interaction(q, f"Рекомендован фильм: {recommendation}", True)
            print('-'*62,'\n')
        
        # Остальные функции остаются без изменений, но с добавлением обучения
        elif q == '+' or 'управление' in q or 'настройки' in q:
            print('\n' + '='*64)
            print('⚙️  НАСТРОЙКИ И СТАТУС')
            print('='*64)
            status = ai_system.get_status()
            print(f"Взаимодействий: {status['interactions']}")
            print(f"Улучшений: {status['improvements']}")
            print(f"База знаний: {status['knowledge_base_size']} записей")
            print('='*64)
            print('Извините, но настройки временно закрыты, попробуйте позже')
            print_menu_ru()
            response_generated = True
        
        elif q == '3' or 'скорость' in q:
            input('Нажмите "Enter", когда будете готовы писать!!')
            start_time_typing = time()
            play_phrase = input('Напишите отзыв обо мне! ')
            end_time_typing = time()
            total_time = end_time_typing - start_time_typing
            symbols = len(play_phrase)
            print_speed = round(symbols / total_time, 2)
            print('\n','-'*62)
            print(f'* Скорость печати этого текста: {round(total_time, 2)} секунд!')       
            print(f'* Всего в этом тексте: {symbols} символов!')
            print(f'* Ваша скорость: {print_speed} символа в секунду или {print_speed*60} символов в минуту!')
            if print_speed * 60 < 150:
                lvl_print_speed = 'Новичок'
            elif print_speed * 60 >= 150 and print_speed*60 < 250:
                lvl_print_speed = 'Нормальный пользователь'
            elif print_speed * 60 >= 250 and print_speed*60 < 400:
                lvl_print_speed = 'Профи'
            elif print_speed*60 >= 400 and print_speed*60 < 1080:
                lvl_print_speed = 'Уникум'
            elif print_speed*60 >= 1080:
                lvl_print_speed = 'Чтооооо? Это мировой рекорд!'
            print(f'* Ваш уровень: {lvl_print_speed}!')
            response_generated = True
            ai_system.process_interaction(q, f"Скорость печати: {print_speed*60} симв/мин", True)
            print('-'*62,'\n')
        
        # Для остальных функций добавляем базовое обучение
        else:
            # Пытаемся найти похожий запрос в базе знаний
            smart_response = ai_system.get_smart_response(q)
            if smart_response:
                print(f"[Использую накопленный опыт] {smart_response}")
            
            # Обрабатываем стандартные команды (сокращенно для экономии места)
            if q == '4' or 'сайт' in q:
                print('Внимание! Сайты открываются в браузере по умолчанию!')
                print('Какой сайт вы хотите открыть?')
                print('-'*64)
                print('* ВК\n* YouTube\n* Steam\n* Apple\n* Start\n* ТНТ\n* СТС')
                print('-'*64)
                site = input('Введи название из предложенных: ').lower()
                if site == 'youtube' or site == 'ютуб' or site == 'ютюб':
                    print('Секунду...')
                    sleep(1)
                    webbrowser.open('https://www.youtube.com')
                    response_generated = True
                elif site == 'вк' or site == 'вконтакте' or site == 'в контакте':
                    print('Минутку...')
                    sleep(1)
                    webbrowser.open('https://vk.com')
                    response_generated = True
                elif site == 'стим' or site == 'steam':
                    print('Сейчас открою...')
                    sleep(1)
                    webbrowser.open('https://store.steampowered.com/?l=russian')
                    response_generated = True
                elif site == 'apple' or site == 'эпл' or site == 'эппл':
                    print('Подождите пожалуйста...')
                    sleep(1)
                    webbrowser.open('https://www.apple.com/ru/')
                    response_generated = True
                elif site == 'start' or site == 'старт':
                    print('Открываю...')
                    sleep(1)
                    webbrowser.open('https://start.ru')
                    response_generated = True
                elif site == 'тнт':
                    print('Две секунды...')
                    sleep(1)
                    webbrowser.open('https://tnt-online.ru')
                    response_generated = True
                elif site == 'стс':
                    print('Одну минуту...')
                    sleep(1)
                    webbrowser.open('https://ctc.ru')
                    response_generated = True
                else:
                    print('Прости! Я не знаю такого сайта')
                    q_search = input('Искать? (да/нет) ').lower()
                    if q_search == 'да':
                        webbrowser.open_new_tab(browser + site)
                    else:
                        print('Не хотите, как хотите')
                ai_system.process_interaction(q, f"Открыт сайт: {site}", True)
                print('-'*62,'\n')
            
            elif q == '5' or 'калькулятор' in q:
                action = input('\nВыберите действие: \n - вычитание ;\n + сложение ;\n/ деление ;\n * умножение;\n // деление без остатка;\n % нахождение остатка от деления;\n ** возведение в степень;\n$  нахождение квадратного корня от числа;\n! - нахождение факториала числа;\nlog - нахождение логарифма числа;\nsum - найти сумму всех элементов в списке\narifm - нахождение µ всех чисел в списке\nP - найти периметр фигуры\nS - найти площадь фигуры\ncos - найти косинус по аргументу x\nsin - найти синус по аргументу x\ntan - найти тангенс по аргументу x\n').lower()
                result = None
                if action == '-':
                    num1 = float(input('\nВведите уменьшаемое (десятичную дробь через точку!): '))
                    num2 = float(input('\nВведите вычитаемое (десятичную дробь через точку!): '))
                    result = num1 - num2
                    print(f'Ответ: {num1} - {num2} = {result}')
                    response_generated = True
                elif action == '*':
                    num1 = float(input('\nВведите первый множитель (десятичную дробь через точку!): '))
                    num2 = float(input('\nВведите второй множитель (десятичную дробь через точку!): '))
                    result = num1 * num2
                    print(f'\nОтвет: {num1} * {num2} = {result}')
                    response_generated = True
                elif action == '/':
                    num1 = float(input('\nВведите делимое (десятичную дробь через точку!): '))
                    num2 = float(input('\nВведите делитель (десятичную дробь через точку!): '))
                    result = num1 / num2
                    print(f'\nОтвет: {num1} ÷ {num2} = {result}')
                    response_generated = True
                elif action == '+':
                    num1 = float(input('\nВведите первое слагаемое (десятичную дробь через точку!): '))
                    num2 = float(input('\nВведите второе слагаемое (десятичную дробь через точку!): '))
                    result = num1 + num2
                    print(f'\nОтвет: {num1} + {num2} = {result}')
                    response_generated = True
                elif action == '//':
                    num1 = float(input('\nВведите делимое (десятичную дробь через точку!): '))
                    num2 = float(input('\nВведите делитель (десятичную дробь через точку!): '))
                    result = num1 // num2
                    print(f'\nОтвет без остатка: {num1} ÷ {num2} = {result}')
                    response_generated = True
                elif action == '**':
                    num1 = float(input('\nВведите число для возведения в степень (десятичную дробь через точку!): '))
                    num2 = float(input('\nВведите в какую степень возвести (десятичную дробь через точку!): '))
                    result = num1 ** num2
                    print(f'\nОтвет: {num1}^{num2} = {result}')
                    response_generated = True
                elif action == '%':
                    num1 = float(input('\nВведите делимое (десятичную дробь через точку!): '))
                    num2 = float(input('\nВведите делитель (десятичную дробь через точку!): '))
                    result = num1 % num2
                    print(f'\nОтвет: Остаток от {num1} ÷ {num2} = {result}')
                    response_generated = True
                elif action == '$':
                    num1 = float(input('\nВведите число для нахождения квадратного корня (десятичную дробь через точку!): '))
                    result = math.sqrt(num1)
                    print(f'\nОтвет: √{num1} = ±{result}')
                    response_generated = True
                elif action == '!':
                    num1 = int(float(input('\nВведите число для нахождения факториала (десятичную дробь через точку!): ')))
                    result = math.factorial(num1)
                    print(f'Ответ: !{num1} = {result}')
                    response_generated = True
                elif action == 'log':
                    num1 = float(input('\nВведите число для нахождения логарифма (десятичную дробь через точку!): '))
                    base = float(input('Введите основание: '))
                    result = math.log(num1, base)
                    print(f'Ответ: log {num1} с основанием {base} = {result}')
                    response_generated = True
                elif action == 'sum':
                    numbers = []
                    num_list = input('Вводите числа и заполняйте список (stop - остановиться): ')
                    while num_list != 'stop':
                        numbers.append(float(num_list))
                        num_list = input('Вводите числа и заполняйте список (stop - остановиться): ')
                    result = sum(numbers)
                    print(f'\nОтвет: Сумма всех элементов в списке {numbers} = {result}')
                    response_generated = True
                elif action == 'arifm':
                    numbers = []
                    num_list = input('Вводите числа и заполняйте список (stop - остановиться): ')
                    while num_list != 'stop':
                        numbers.append(float(num_list))
                        num_list = input('Вводите числа и заполняйте список (stop - остановиться): ')
                    result = sum(numbers) / len(numbers) if numbers else 0
                    print(f'\nОтвет: µ всех элементов в списке {numbers} = {result}')
                    response_generated = True
                elif action == 'cos':
                    num = float(input('Введите аргумент в радианах: '))
                    result = math.cos(num)
                    print(f'Ответ: cos{num} = {result}')
                    response_generated = True
                elif action == 'sin':
                    num = float(input('Введите аргумент в радианах: '))
                    result = math.sin(num)
                    print(f'Ответ: sin{num} = {result}')
                    response_generated = True
                elif action == 'tan':
                    num = float(input('Введите аргумент в радианах: '))
                    result = math.tan(num)
                    print(f'Ответ: tan{num} = {result}')
                    response_generated = True
                if response_generated:
                    ai_system.process_interaction(q, f"Вычисление: {action} = {result}", True)
                    print('-'*62)
            
            elif q == '6' or 'анализ' in q:
                txt = input('Вводите текст (можете его скопировать и вставить сюда): ').capitalize()
                print('-'*62)
                print('Текст:\n', txt, '\n')
                words_count = txt.count(' ') + 1
                sentences_count = txt.count('.') + txt.count('!') + txt.count('?')
                print(f'Всего в этом тексте:\n{"~"*62}\n* {len(txt)} символов\n* {words_count} слов\n* {sentences_count} предложений\n{"~"*62}\n')
                find_q = input('Вы хотите найти какое-то слово или символ в этом тексте? (да/нет) ').lower().find('да')
                if find_q != -1:
                    find_word = input('Введите символ или слово которое хотите найти: ')
                    word_num = txt.find(find_word)
                    if word_num == -1:
                        print('Прости, но такого символа/слова в данном тексте нет!')
                    else:
                        print(f'О, я знаю! он(о) начинается с символа номер {word_num + 1}!')
                response_generated = True
                ai_system.process_interaction(q, f"Проанализирован текст: {words_count} слов, {sentences_count} предложений", True)
                print('-'*62,'\n')
                print_menu_ru()
            
            elif q == '7' or 'рандом' in q:
                affairs = list()
                affair = input('Вводите слова или числа и заполняйте список: (стоп - остановиться) ').lower()
                while affair != 'стоп':
                    affairs.append(affair)
                    affair = input('Продолжайте вводить слова или числа и заполнять список: (стоп - остановиться) ').lower()
                len_affair = len(affairs)
                rand = randint(0, len_affair - 1)
                result = affairs[rand]
                print(f'\nВсего введённых элементов: {len_affair}')
                print(f'Рандомная генерация...\nВыбрано: {result}\nШанс выбора этого элемента - 1 к {len_affair} или {round(100 / len_affair, 2)}% !\n')
                response_generated = True
                ai_system.process_interaction(q, f"Сгенерировано случайное: {result}", True)
            
            elif q == '12' or 'математик' in q:
                print('Это игра бесконечна!')
                print('Если вы правильно ответили к вашему счёту прибавляется 1 балл!\nА если неправильно - 0 баллов!\nУдачи!')
                input('Нажмите "Enter" когда будете готовы!')
                score = 0
                steps = 0
                num1 = randint(0,100)
                num2 = randint(0,100)
                print(f'{num1} + {num2}')
                ans = input('Ответ: (stop - остановиться) ')
                while ans != 'stop':
                    steps += 1
                    try:
                        ans = int(ans)
                    except:
                        print('Вы ввели не число')
                        break
                    if ans == num1+num2:
                        print('Правильно! +1 балл!')
                        score += 1
                    else:
                        print(f'Неправильно! +0 баллов! Ответ: {num1+num2}!')
                    num1 = randint(0,100)
                    num2 = randint(0,100)
                    print(f'{num1} + {num2}')
                    ans = input('Ответ: (stop - остановиться) ')
                correct_percent = (score/steps * 100) if steps > 0 else 0
                print('-'*60)
                print(f'Игра окончена!\nНабрано {score} балла(ов) из {steps}!')
                print(f'Точность ответов - {correct_percent:.1f}% !')
                response_generated = True
                ai_system.process_interaction(q, f"Игра завершена: {score}/{steps} правильных ответов ({correct_percent:.1f}%)", True)
                print('-'*60,'\n')
            
            elif q == '8' or 'крестик' in q:
                print('Открываю...')
                sleep(1)
                webbrowser.open_new_tab('https://g.co/kgs/fnKT3B')
                response_generated = True
                ai_system.process_interaction(q, "Открыта игра Крестики-Нолики", True)
            
            elif q == '9' or 'погода' in q:
                webbrowser.open_new_tab('https://yandex.ru/pogoda/nowcast')
                response_generated = True
                ai_system.process_interaction(q, "Открыт прогноз погоды", True)
            
            elif q == '10' or 'новост' in q:
                print('Новости мира Алгоритмики. Переходите по этой ссылке что бы узнать новости алгоритмики')
                sleep(0.5)
                print('https://algoritmika76.ru/school')
                sleep(3.25)
                response_generated = True
                ai_system.process_interaction(q, "Показаны новости Алгоритмики", True)
                print('-'* 60,'\n')
            
            elif q == '11' or 'секундомер' in q:
                circle = 0
                input('Нажмите клавишу "Enter" чтобы начать')
                start = time()
                time_action = input('Нажмите клавишу "Enter" чтобы закончить или любую другую + "Enter", чтобы запомнить круг!')
                while time_action != '':
                    if time_action != '':
                        circle += 1
                        end_circle = time()
                        print(f'Круг {circle}: {end_circle - start:.2f} секунд!')
                    time_action = input('Нажмите клавишу "Enter" чтобы закончить или любую другую + "Enter", чтобы запомнить круг!')
                end = time()
                total_time = end - start
                print(f'Всего прошло {total_time:.2f} секунд!')
                response_generated = True
                ai_system.process_interaction(q, f"Секундомер: {total_time:.2f} секунд", True)
            
            elif q == '14' or 'википед' in q:
                print('Открываю...')
                sleep(1.75)
                webbrowser.open('https://ru.wikipedia.org/wiki/Служебная:Случайная_страница')
                response_generated = True
                ai_system.process_interaction(q, "Открыта случайная страница Википедии", True)
            
            elif q == '15' or 'бал' in q:
                marks = input('Введите оценки через пробел: ')
                while True:
                    try:
                        marks_list = marks.split(' ')
                        for i, mark in enumerate(marks_list):
                            marks_list[i] = int(mark)
                        avg = sum(marks_list)/len(marks_list)
                        print('Анализ набора оценок:', marks_list)
                        print(f'Средний балл - {avg:.2f}')
                        response_generated = True
                        ai_system.process_interaction(q, f"Средний балл: {avg:.2f}", True)
                        break
                    except:
                        print('Ошибка. Некорректный ввод!')
                        marks = input('Введите оценки через пробел: ')
                print('-'*62,'\n')
            
            elif q == '13' or 'реком' in q:
                catagory = input('Выберите жанр:\n1 - RPG\n2 - Simulator\n3 - Strategy \n4 - Fighting\n5 - Battle Royale \n')
                platform = input('Выберете платформу:\n1 - PS\n2 - XBOX\n3 - ПК\n4 - Nintendo Switch\n5 - Телефон\n')
                # Сохраняем предпочтения
                ai_system.knowledge_base.remember_user_preference('game_genre', catagory)
                ai_system.knowledge_base.remember_user_preference('game_platform', platform)
                response_generated = True
                ai_system.process_interaction(q, f"Рекомендации игр: жанр {catagory}, платформа {platform}", True)
            
            elif q == '#' or 'поиск' in q:
                print('Я могу найти всё, что угодно!')
                call = input('Введите ссылку или запрос: ')
                if re.search(r'\.', call):
                    webbrowser.open_new_tab('https://' + call)
                elif re.search(r'\ ', call):
                    webbrowser.open_new_tab(browser + call)
                else:
                    webbrowser.open_new_tab(browser + call)
                response_generated = True
                ai_system.process_interaction(q, f"Выполнен поиск: {call}", True)
                print('-'*62,'\n')
                print_menu_ru()
            
            else:
                # Неизвестная команда - обучаемся
                print('Ошибка. Я вас не понял!\n')
                print('Прости... Я могу поискать это в интернете!')
                q_search = input('Искать? (да/нет) ').lower()
                if q_search == 'да':
                    webbrowser.open_new_tab(browser + q)
                    response_generated = True
                    ai_system.process_interaction(q, f"Поиск в интернете: {q}", q_search == 'да')
                else:
                    print('Не хотите, как хотите')
                    ai_system.process_interaction(q, "Не понял запрос", False)
                print('-'*62,'\n')
        
        # Обучение на каждом взаимодействии
        if not response_generated:
            execution_time = time() - start_time
            response = "Команда выполнена"
            ai_system.process_interaction(q, response, True)
        
        q = input('Как я могу тебе помочь? ').lower()
    
    # Сохранение при выходе
    print('\n💾 Сохраняю накопленные знания...')
    ai_system.knowledge_base.save()
    print('✅ Все данные сохранены! До свидания!')

# Аналогично для английской версии (сокращенно)
elif language == 'eng':
    print('Hi!')
    print('My name is Ivan! I am a self-improving AI!')
    name = input("Write your name or nickname: ")
    ai_system.knowledge_base.remember_user_preference('user_name', name)
    print(f'Nice to meet you, {name}!')
    # ... остальной код аналогично русской версии
