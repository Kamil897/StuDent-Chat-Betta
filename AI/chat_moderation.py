"""
AI Chat Moderation System
Мониторинг чатов, предупреждения, мут и бан пользователей
"""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("OpenAI не установлен. Установите: pip install openai")

try:
    from config import OPENAI_API_KEY, MODERATION_CONFIG
except ImportError:
    OPENAI_API_KEY = None
    MODERATION_CONFIG = {'use_openai': False}


class ViolationType(Enum):
    """Типы нарушений"""
    SPAM = "spam"
    PROFANITY = "profanity"
    HARASSMENT = "harassment"
    HATE_SPEECH = "hate_speech"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    CAPS_LOCK = "caps_lock"
    FLOOD = "flood"


class ActionType(Enum):
    """Типы действий модерации"""
    WARNING = "warning"
    MUTE_MINUTES = "mute_minutes"
    MUTE_HOURS = "mute_hours"
    MUTE_DAYS = "mute_days"
    BAN = "ban"


@dataclass
class ModerationAction:
    """Действие модерации"""
    action_type: ActionType
    user_id: str
    user_name: str
    chat_id: str
    reason: str
    violation_type: ViolationType
    duration_minutes: Optional[int] = None
    created_at: str = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()


@dataclass
class UserViolation:
    """Нарушение пользователя"""
    user_id: str
    user_name: str
    violation_type: ViolationType
    message: str
    chat_id: str
    created_at: str
    severity: int  # 1-5, где 5 - самое серьезное


class ChatModerator:
    """AI модератор чатов"""
    
    def __init__(self, storage_file: str = "moderation_data.json"):
        self.storage_file = storage_file
        self.violations: Dict[str, List[UserViolation]] = {}  # user_id -> violations
        self.actions: List[ModerationAction] = []
        self.muted_users: Dict[str, datetime] = {}  # user_id -> unmute_time
        self.banned_users: set = set()
        
        # Инициализация OpenAI клиента
        self.openai_client = None
        self.use_openai = MODERATION_CONFIG.get('use_openai', False) and OPENAI_AVAILABLE and OPENAI_API_KEY
        
        if self.use_openai:
            try:
                self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
                print("OpenAI модерация активирована")
            except Exception as e:
                print(f"Ошибка инициализации OpenAI: {e}")
                self.use_openai = False
        
        # Загружаем данные
        self.load_data()
        
        # Паттерны для обнаружения нарушений
        self.profanity_patterns = [
            r'\b(плохое|ругательство|мат)\b',  # Примеры, нужно расширить
        ]
        
        self.spam_patterns = [
            r'(.)\1{4,}',  # Повторяющиеся символы
        ]
    
    def load_data(self):
        """Загрузить данные из файла"""
        try:
            with open(self.storage_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Загружаем нарушения, преобразуя строки обратно в Enum
                self.violations = {}
                for uid, violations in data.get('violations', {}).items():
                    self.violations[uid] = []
                    for v in violations:
                        violation = UserViolation(
                            user_id=v['user_id'],
                            user_name=v['user_name'],
                            violation_type=ViolationType(v['violation_type']),  # Преобразуем строку в Enum
                            message=v['message'],
                            chat_id=v['chat_id'],
                            created_at=v['created_at'],
                            severity=v['severity']
                        )
                        self.violations[uid].append(violation)
                
                # Загружаем действия, преобразуя строки обратно в Enum
                self.actions = []
                for a in data.get('actions', []):
                    action = ModerationAction(
                        action_type=ActionType(a['action_type']),  # Преобразуем строку в Enum
                        user_id=a['user_id'],
                        user_name=a['user_name'],
                        chat_id=a['chat_id'],
                        reason=a['reason'],
                        violation_type=ViolationType(a['violation_type']),  # Преобразуем строку в Enum
                        duration_minutes=a.get('duration_minutes'),
                        created_at=a['created_at']
                    )
                    self.actions.append(action)
                
                # Восстанавливаем muted_users из actions
                for action in self.actions:
                    if action.action_type in [ActionType.MUTE_MINUTES, ActionType.MUTE_HOURS, ActionType.MUTE_DAYS]:
                        unmute_time = datetime.fromisoformat(action.created_at)
                        if action.duration_minutes:
                            unmute_time += timedelta(minutes=action.duration_minutes)
                        if unmute_time > datetime.now():
                            self.muted_users[action.user_id] = unmute_time
                    elif action.action_type == ActionType.BAN:
                        self.banned_users.add(action.user_id)
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"Ошибка при загрузке данных: {e}")
    
    def _serialize_violation(self, violation: UserViolation) -> dict:
        """Сериализовать нарушение для JSON"""
        return {
            'user_id': violation.user_id,
            'user_name': violation.user_name,
            'violation_type': violation.violation_type.value,  # Преобразуем Enum в строку
            'message': violation.message,
            'chat_id': violation.chat_id,
            'created_at': violation.created_at,
            'severity': violation.severity
        }
    
    def _serialize_action(self, action: ModerationAction) -> dict:
        """Сериализовать действие для JSON"""
        return {
            'action_type': action.action_type.value,  # Преобразуем Enum в строку
            'user_id': action.user_id,
            'user_name': action.user_name,
            'chat_id': action.chat_id,
            'reason': action.reason,
            'violation_type': action.violation_type.value,  # Преобразуем Enum в строку
            'duration_minutes': action.duration_minutes,
            'created_at': action.created_at
        }
    
    def save_data(self):
        """Сохранить данные в файл"""
        data = {
            'violations': {
                uid: [self._serialize_violation(v) for v in violations]
                for uid, violations in self.violations.items()
            },
            'actions': [self._serialize_action(a) for a in self.actions]
        }
        with open(self.storage_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def _analyze_with_openai(self, message: str) -> Optional[Tuple[ViolationType, int]]:
        """
        Анализировать сообщение с помощью OpenAI
        Возвращает (ViolationType, severity) или None
        """
        if not self.use_openai or not self.openai_client:
            return None
        
        try:
            prompt = f"""Проанализируй следующее сообщение из чата и определи, нарушает ли оно правила.

Сообщение: "{message}"

Ответь ТОЛЬКО валидным JSON без дополнительного текста:
{{
    "has_violation": true или false,
    "violation_type": "spam" или "profanity" или "harassment" или "hate_speech" или "inappropriate_content" или "caps_lock" или "flood" или null,
    "severity": число от 1 до 5 или null,
    "reason": "краткое объяснение" или null
}}

Если нарушений нет, верни: {{"has_violation": false, "violation_type": null, "severity": null, "reason": null}}"""

            response = self.openai_client.chat.completions.create(
                model=MODERATION_CONFIG.get('openai_model', 'gpt-3.5-turbo'),
                messages=[
                    {"role": "system", "content": "Ты модератор чата. Анализируй сообщения на нарушения правил. Отвечай ТОЛЬКО валидным JSON без дополнительного текста."},
                    {"role": "user", "content": prompt}
                ],
                temperature=MODERATION_CONFIG.get('openai_temperature', 0.3),
                max_tokens=MODERATION_CONFIG.get('openai_max_tokens', 150),
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Извлекаем JSON из ответа (на случай если OpenAI добавит markdown)
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            # Пытаемся найти JSON объект в тексте
            try:
                result = json.loads(result_text)
            except json.JSONDecodeError:
                # Пытаемся найти JSON объект в тексте с помощью regex
                import re
                # Ищем более сложные JSON объекты (с вложенными объектами)
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', result_text)
                if json_match:
                    try:
                        result = json.loads(json_match.group())
                    except json.JSONDecodeError:
                        # Последняя попытка - найти любой JSON объект
                        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
                        if json_match:
                            try:
                                result = json.loads(json_match.group())
                            except json.JSONDecodeError:
                                return None
                        else:
                            return None
                else:
                    return None
            
            if result.get('has_violation') and result.get('violation_type'):
                violation_type = ViolationType(result['violation_type'])
                severity = result.get('severity', 3)
                return (violation_type, severity)
            
        except Exception as e:
            print(f"Ошибка при анализе через OpenAI: {e}")
        
        return None
    
    def analyze_message(self, message: str, user_id: str, user_name: str, chat_id: str) -> Optional[UserViolation]:
        """
        Анализировать сообщение на нарушения
        Возвращает UserViolation если найдено нарушение
        """
        message_lower = message.lower()
        
        # Сначала проверяем через OpenAI (если доступно)
        if self.use_openai:
            openai_result = self._analyze_with_openai(message)
            if openai_result:
                violation_type, severity = openai_result
                violation = UserViolation(
                    user_id=user_id,
                    user_name=user_name,
                    violation_type=violation_type,
                    message=message,
                    chat_id=chat_id,
                    created_at=datetime.now().isoformat(),
                    severity=severity
                )
                self._add_violation(violation)
                return violation
        
        # Проверка на спам (повторяющиеся символы)
        if re.search(self.spam_patterns[0], message):
            violation = UserViolation(
                user_id=user_id,
                user_name=user_name,
                violation_type=ViolationType.SPAM,
                message=message,
                chat_id=chat_id,
                created_at=datetime.now().isoformat(),
                severity=2
            )
            self._add_violation(violation)
            return violation
        
        # Проверка на CAPS LOCK (более 70% заглавных букв)
        if len(message) > 10:
            caps_count = sum(1 for c in message if c.isupper())
            if caps_count / len(message) > 0.7:
                violation = UserViolation(
                    user_id=user_id,
                    user_name=user_name,
                    violation_type=ViolationType.CAPS_LOCK,
                    message=message,
                    chat_id=chat_id,
                    created_at=datetime.now().isoformat(),
                    severity=1
                )
                self._add_violation(violation)
                return violation
        
        # Проверка на флуд (слишком много сообщений подряд)
        if user_id in self.violations:
            recent_violations = [
                v for v in self.violations[user_id]
                if (datetime.now() - datetime.fromisoformat(v.created_at)).seconds < 60
            ]
            if len(recent_violations) >= 5:
                violation = UserViolation(
                    user_id=user_id,
                    user_name=user_name,
                    violation_type=ViolationType.FLOOD,
                    message=message,
                    chat_id=chat_id,
                    created_at=datetime.now().isoformat(),
                    severity=3
                )
                self._add_violation(violation)
                return violation
        
        # Проверка на нецензурную лексику (упрощенная версия)
        # В реальной системе здесь должен быть более сложный анализ
        for pattern in self.profanity_patterns:
            if re.search(pattern, message_lower):
                violation = UserViolation(
                    user_id=user_id,
                    user_name=user_name,
                    violation_type=ViolationType.PROFANITY,
                    message=message,
                    chat_id=chat_id,
                    created_at=datetime.now().isoformat(),
                    severity=4
                )
                self._add_violation(violation)
                return violation
        
        return None
    
    def _add_violation(self, violation: UserViolation):
        """Добавить нарушение"""
        if violation.user_id not in self.violations:
            self.violations[violation.user_id] = []
        self.violations[violation.user_id].append(violation)
        self.save_data()
    
    def get_user_violations_count(self, user_id: str, hours: int = 24) -> int:
        """Получить количество нарушений пользователя за последние N часов"""
        if user_id not in self.violations:
            return 0
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return len([
            v for v in self.violations[user_id]
            if datetime.fromisoformat(v.created_at) > cutoff_time
        ])
    
    def get_user_warnings_count(self, user_id: str) -> int:
        """Получить количество предупреждений пользователя"""
        return len([
            a for a in self.actions
            if a.user_id == user_id and a.action_type == ActionType.WARNING
        ])
    
    def decide_action(self, violation: UserViolation) -> ModerationAction:
        """
        Решить какое действие применить на основе нарушений
        """
        user_id = violation.user_id
        violations_count = self.get_user_violations_count(user_id, hours=24)
        warnings_count = self.get_user_warnings_count(user_id)
        
        # Если пользователь забанен, ничего не делаем
        if user_id in self.banned_users:
            return None
        
        # Если пользователь в муте, проверяем не истек ли мут
        if user_id in self.muted_users:
            if datetime.now() > self.muted_users[user_id]:
                del self.muted_users[user_id]
            else:
                return None  # Пользователь уже в муте
        
        # Логика принятия решений:
        # 1-2 нарушения -> предупреждение
        # 3-4 нарушения -> мут на несколько минут
        # 5-6 нарушений -> мут на несколько часов
        # 7-9 нарушений -> мут на несколько дней
        # 10+ нарушений -> бан
        
        if violations_count <= 2 and warnings_count < 2:
            action = ModerationAction(
                action_type=ActionType.WARNING,
                user_id=user_id,
                user_name=violation.user_name,
                chat_id=violation.chat_id,
                reason=f"Нарушение: {violation.violation_type.value}",
                violation_type=violation.violation_type
            )
        elif violations_count <= 4:
            action = ModerationAction(
                action_type=ActionType.MUTE_MINUTES,
                user_id=user_id,
                user_name=violation.user_name,
                chat_id=violation.chat_id,
                reason=f"Множественные нарушения: {violation.violation_type.value}",
                violation_type=violation.violation_type,
                duration_minutes=5
            )
            self.muted_users[user_id] = datetime.now() + timedelta(minutes=5)
        elif violations_count <= 6:
            action = ModerationAction(
                action_type=ActionType.MUTE_HOURS,
                user_id=user_id,
                user_name=violation.user_name,
                chat_id=violation.chat_id,
                reason=f"Повторные нарушения: {violation.violation_type.value}",
                violation_type=violation.violation_type,
                duration_minutes=60
            )
            self.muted_users[user_id] = datetime.now() + timedelta(hours=1)
        elif violations_count <= 9:
            action = ModerationAction(
                action_type=ActionType.MUTE_DAYS,
                user_id=user_id,
                user_name=violation.user_name,
                chat_id=violation.chat_id,
                reason=f"Систематические нарушения: {violation.violation_type.value}",
                violation_type=violation.violation_type,
                duration_minutes=24 * 60  # 1 день
            )
            self.muted_users[user_id] = datetime.now() + timedelta(days=1)
        else:
            action = ModerationAction(
                action_type=ActionType.BAN,
                user_id=user_id,
                user_name=violation.user_name,
                chat_id=violation.chat_id,
                reason=f"Критические нарушения: {violation.violation_type.value}",
                violation_type=violation.violation_type
            )
            self.banned_users.add(user_id)
        
        self.actions.append(action)
        self.save_data()
        return action
    
    def process_message(self, message: str, user_id: str, user_name: str, chat_id: str) -> Optional[ModerationAction]:
        """
        Обработать сообщение и вернуть действие модерации если нужно
        """
        # Проверяем не забанен ли пользователь
        if user_id in self.banned_users:
            return None
        
        # Проверяем не в муте ли пользователь
        if user_id in self.muted_users:
            if datetime.now() < self.muted_users[user_id]:
                return None  # Пользователь в муте, сообщение не должно быть отправлено
            else:
                # Мут истек
                del self.muted_users[user_id]
        
        # Анализируем сообщение
        violation = self.analyze_message(message, user_id, user_name, chat_id)
        
        if violation:
            # Принимаем решение о действии
            action = self.decide_action(violation)
            return action
        
        return None
    
    def is_user_muted(self, user_id: str) -> bool:
        """Проверить замучен ли пользователь"""
        if user_id not in self.muted_users:
            return False
        
        if datetime.now() > self.muted_users[user_id]:
            del self.muted_users[user_id]
            return False
        
        return True
    
    def is_user_banned(self, user_id: str) -> bool:
        """Проверить забанен ли пользователь"""
        return user_id in self.banned_users
    
    def get_moderation_status(self, user_id: str) -> Dict:
        """Получить статус модерации пользователя"""
        return {
            'is_muted': self.is_user_muted(user_id),
            'is_banned': self.is_user_banned(user_id),
            'violations_count_24h': self.get_user_violations_count(user_id, 24),
            'warnings_count': self.get_user_warnings_count(user_id),
            'mute_until': self.muted_users.get(user_id).isoformat() if user_id in self.muted_users else None
        }


# Глобальный экземпляр модератора
_moderator_instance: Optional[ChatModerator] = None


def get_moderator() -> ChatModerator:
    """Получить глобальный экземпляр модератора"""
    global _moderator_instance
    if _moderator_instance is None:
        _moderator_instance = ChatModerator()
    return _moderator_instance


if __name__ == "__main__":
    # Тестирование
    moderator = ChatModerator()
    
    # Тест 1: Простое нарушение
    print("Тест 1: Простое нарушение (CAPS)")
    action = moderator.process_message(
        "ПРИВЕТ ВСЕМ КАК ДЕЛА",
        "user1",
        "TestUser",
        "chat1"
    )
    if action:
        print(f"Действие: {action.action_type.value}, Причина: {action.reason}")
    
    # Тест 2: Множественные нарушения
    print("\nТест 2: Множественные нарушения")
    for i in range(3):
        action = moderator.process_message(
            "SPAM MESSAGE " * 10,
            "user2",
            "SpamUser",
            "chat1"
        )
        if action:
            print(f"Нарушение {i+1}: {action.action_type.value}")
    
    # Тест 3: Проверка мута
    print("\nТест 3: Проверка мута")
    print(f"User2 замучен: {moderator.is_user_muted('user2')}")
    
    # Тест 4: Статус пользователя
    print("\nТест 4: Статус пользователя")
    status = moderator.get_moderation_status('user2')
    print(json.dumps(status, indent=2, ensure_ascii=False))

