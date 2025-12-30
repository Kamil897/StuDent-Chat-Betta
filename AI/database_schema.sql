-- Схема базы данных для саморазвивающегося ИИ
-- Создание базы данных
CREATE DATABASE IF NOT EXISTS AI CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE AI;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица знаний (база знаний)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id INT AUTO_INCREMENT PRIMARY KEY,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    query_vector JSON,
    similarity_score FLOAT DEFAULT 0.0,
    success_count INT DEFAULT 0,
    usage_count INT DEFAULT 0,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_similarity (similarity_score),
    FULLTEXT idx_fulltext (query_text, response_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица взаимодействий
CREATE TABLE IF NOT EXISTS interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    execution_time FLOAT,
    accuracy FLOAT,
    relevance_score FLOAT,
    completeness_score FLOAT,
    confidence_score FLOAT,
    success BOOLEAN DEFAULT TRUE,
    agent_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица агентов (коллективный интеллект)
CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    knowledge_count INT DEFAULT 0,
    success_rate FLOAT DEFAULT 0.5,
    total_responses INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name (name),
    INDEX idx_specialization (specialization)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица ответов агентов
CREATE TABLE IF NOT EXISTS agent_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    interaction_id INT,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.0,
    selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL,
    INDEX idx_agent (agent_id),
    INDEX idx_selected (selected)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица метрик производительности
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interaction_count INT DEFAULT 0,
    accuracy FLOAT DEFAULT 0.0,
    knowledge_base_size INT DEFAULT 0,
    improvement_rate FLOAT DEFAULT 0.0,
    avg_response_time FLOAT DEFAULT 0.0,
    openai_usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица задач для самообучения
CREATE TABLE IF NOT EXISTS learning_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT NOT NULL,
    task_type VARCHAR(50),
    difficulty VARCHAR(20),
    completed BOOLEAN DEFAULT FALSE,
    result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_type (task_type),
    INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица истории обучения нейронной сети
CREATE TABLE IF NOT EXISTS neural_network_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    epoch INT,
    loss FLOAT,
    accuracy FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_epoch (epoch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица визуализаций (графики хранятся в БД)
CREATE TABLE IF NOT EXISTS visualizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plot_type VARCHAR(50),
    file_path VARCHAR(500),
    plot_image LONGBLOB,
    interaction_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (plot_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Инициализация агентов
INSERT IGNORE INTO agents (name, specialization) VALUES
('Agent_1', 'general'),
('Agent_2', 'technical'),
('Agent_3', 'creative');

