

# MySQL Database Configuration
DATABASE_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'StudentandChat2024kamilandKamil20070809',
    'database': 'AI',
    'charset': 'utf8mb4',
    'autocommit': True
}

# Настройки ИИ
AI_CONFIG = {
    'model': 'gpt-3.5-turbo',
    'temperature': 0.7,
    'max_tokens': 500,
    'learning_rate': 0.1,
    'improvement_interval': 10,
    'collective_agents': 3,
}

# Настройки нейронной сети
NEURAL_NETWORK_CONFIG = {
    'input_size': 50,
    'hidden_size': 100,
    'output_size': 20,
    'learning_rate': 0.01,
}

# Настройки визуализации
VISUALIZATION_CONFIG = {
    'save_plots': True,
    'plot_format': 'png',
    'update_interval': 5,
}
