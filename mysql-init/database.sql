-- =====================================================
-- YKT Propusk - Инициализация базы данных для Docker
-- =====================================================

USE ykt_propusk_db;

-- =====================================================
-- Таблица пользователей
-- =====================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `login` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Логин пользователя',
    `password` VARCHAR(255) NOT NULL COMMENT 'Хеш пароля',
    `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT 'Роль: admin - администратор, user - пользователь',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Дата создания',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Дата обновления',
    PRIMARY KEY (`id`),
    INDEX `idx_login` (`login`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Таблица пользователей системы';

-- Вставка пользователей по умолчанию (пароль: admin, user)
INSERT INTO `users` (`login`, `password`, `role`) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('user', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
ON DUPLICATE KEY UPDATE 
    `password` = VALUES(`password`),
    `role` = VALUES(`role`);

-- =====================================================
-- Таблица заявок (пропусков)
-- =====================================================
CREATE TABLE IF NOT EXISTS `requests` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `request_number` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Номер заявки',
    `date` DATE NOT NULL COMMENT 'Дата заявки',
    `carrier_name` VARCHAR(255) NOT NULL COMMENT 'Сотрудник, который выносит оборудование',
    `status` VARCHAR(50) NOT NULL DEFAULT 'В работе' COMMENT 'Статус: В работе, Вынесено, Возвращено',
    `employee_fio` VARCHAR(255) NOT NULL COMMENT 'ФИО для использования вне офиса',
    `approved_by` VARCHAR(255) NOT NULL COMMENT 'Кем согласовано',
    `checked_out_by` VARCHAR(255) DEFAULT NULL COMMENT 'Кто проверил при выносе',
    `returned_by` VARCHAR(255) DEFAULT NULL COMMENT 'Кто проверил при возврате',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_request_number` (`request_number`),
    INDEX `idx_status` (`status`),
    INDEX `idx_date` (`date`),
    INDEX `idx_carrier_name` (`carrier_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Таблица заявок на пропуск';

-- =====================================================
-- Таблица позиций заявки (оборудование)
-- =====================================================
CREATE TABLE IF NOT EXISTS `request_items` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `request_id` INT(11) NOT NULL COMMENT 'ID заявки',
    `item_name` VARCHAR(255) NOT NULL COMMENT 'Наименование оборудования',
    `serial_number` VARCHAR(100) DEFAULT NULL COMMENT 'Серийный номер',
    `quantity` VARCHAR(50) NOT NULL DEFAULT 'Один' COMMENT 'Количество прописью',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_request_id` (`request_id`),
    CONSTRAINT `fk_request_items_request` FOREIGN KEY (`request_id`) 
        REFERENCES `requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Таблица логов (опционально)
-- =====================================================
CREATE TABLE IF NOT EXISTS `request_log` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `request_id` INT(11) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `old_status` VARCHAR(50) DEFAULT NULL,
    `new_status` VARCHAR(50) DEFAULT NULL,
    `changed_by` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_request_id` (`request_id`),
    CONSTRAINT `fk_request_log_request` FOREIGN KEY (`request_id`) 
        REFERENCES `requests`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Триггер для логов (если нужен)
DELIMITER //
CREATE TRIGGER `after_request_insert` 
AFTER INSERT ON `requests`
FOR EACH ROW
BEGIN
    INSERT INTO `request_log` (`request_id`, `action`, `old_status`, `new_status`, `changed_by`)
    VALUES (NEW.id, 'CREATE', NULL, NEW.status, NEW.carrier_name);
END //
DELIMITER ;

-- =====================================================
-- Вставка тестовой заявки (опционально)
-- =====================================================
INSERT INTO `requests` (
    `request_number`, `date`, `carrier_name`, `status`, `employee_fio`, `approved_by`
) VALUES (
    '1', CURDATE(), 'Иванов Иван Иванович', 'В работе',
    'Ивановым Иваном Ивановичем', 'Операционный директор Антипина А.С.'
) ON DUPLICATE KEY UPDATE id=id;

SET @request_id = LAST_INSERT_ID();

INSERT INTO `request_items` (`request_id`, `item_name`, `serial_number`, `quantity`) VALUES 
(@request_id, 'Ноутбук Apple MacBook Pro', 'C02XK2F8MD6T', 'Один'),
(@request_id, 'Зарядное устройство', 'A1621', 'Один'),
(@request_id, 'Мышь беспроводная Logitech', 'MX-3456', 'Одна'),
(@request_id, 'Коврик для мыши', '', 'Один'),
(@request_id, 'Наушники Sony WH-1000XM4', 'S123456789', 'Одни')
ON DUPLICATE KEY UPDATE id=id;
