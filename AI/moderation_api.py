"""
API для интеграции AI модерации с фронтендом
Работает через localStorage (для фронтенда) или может быть расширен для работы с бэкендом
"""

import json
from typing import Dict, Optional
from chat_moderation import get_moderator, ModerationAction, ActionType


class ModerationAPI:
    """API для модерации чатов"""
    
    def __init__(self):
        self.moderator = get_moderator()
    
    def check_message(self, message: str, user_id: str, user_name: str, chat_id: str) -> Dict:
        """
        Проверить сообщение перед отправкой
        Возвращает результат проверки
        """
        # Проверяем не забанен ли пользователь
        if self.moderator.is_user_banned(user_id):
            return {
                'allowed': False,
                'reason': 'Пользователь забанен',
                'action': 'ban'
            }
        
        # Проверяем не в муте ли пользователь
        if self.moderator.is_user_muted(user_id):
            mute_until = self.moderator.muted_users.get(user_id)
            return {
                'allowed': False,
                'reason': f'Пользователь в муте до {mute_until.strftime("%Y-%m-%d %H:%M:%S") if mute_until else "неизвестно"}',
                'action': 'mute',
                'mute_until': mute_until.isoformat() if mute_until else None
            }
        
        # Анализируем сообщение
        action = self.moderator.process_message(message, user_id, user_name, chat_id)
        
        if action:
            # Сообщение нарушает правила, но может быть отправлено с предупреждением
            # или заблокировано в зависимости от действия
            
            if action.action_type == ActionType.WARNING:
                return {
                    'allowed': True,
                    'warning': True,
                    'message': f'⚠️ Предупреждение: {action.reason}',
                    'action': 'warning'
                }
            elif action.action_type in [ActionType.MUTE_MINUTES, ActionType.MUTE_HOURS, ActionType.MUTE_DAYS]:
                duration_text = self._format_duration(action.duration_minutes)
                return {
                    'allowed': False,
                    'reason': f'Вы получили мут на {duration_text}. Причина: {action.reason}',
                    'action': action.action_type.value,
                    'duration_minutes': action.duration_minutes
                }
            elif action.action_type == ActionType.BAN:
                return {
                    'allowed': False,
                    'reason': f'Вы забанены. Причина: {action.reason}',
                    'action': 'ban'
                }
        
        # Сообщение разрешено
        return {
            'allowed': True,
            'warning': False
        }
    
    def _format_duration(self, minutes: int) -> str:
        """Форматировать длительность"""
        if minutes < 60:
            return f"{minutes} минут"
        elif minutes < 1440:
            hours = minutes // 60
            return f"{hours} час(ов)"
        else:
            days = minutes // 1440
            return f"{days} день(дней)"
    
    def get_user_status(self, user_id: str) -> Dict:
        """Получить статус пользователя"""
        return self.moderator.get_moderation_status(user_id)
    
    def get_moderation_stats(self) -> Dict:
        """Получить статистику модерации"""
        return {
            'total_violations': sum(len(v) for v in self.moderator.violations.values()),
            'total_actions': len(self.moderator.actions),
            'muted_users_count': len(self.moderator.muted_users),
            'banned_users_count': len(self.moderator.banned_users),
            'warnings_count': len([a for a in self.moderator.actions if a.action_type == ActionType.WARNING])
        }


# Глобальный экземпляр API
_api_instance: Optional[ModerationAPI] = None


def get_moderation_api() -> ModerationAPI:
    """Получить глобальный экземпляр API"""
    global _api_instance
    if _api_instance is None:
        _api_instance = ModerationAPI()
    return _api_instance


if __name__ == "__main__":
    api = get_moderation_api()
    
    # Тест проверки сообщения
    result = api.check_message(
        "ПРИВЕТ ВСЕМ",
        "user1",
        "TestUser",
        "chat1"
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Статистика
    stats = api.get_moderation_stats()
    print("\nСтатистика модерации:")
    print(json.dumps(stats, indent=2, ensure_ascii=False))

