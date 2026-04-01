<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Подключение к БД из переменных окружения Docker
$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'ykt_propusk_db';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// === ФУНКЦИЯ АВТОРИЗАЦИИ ===
function authenticate($pdo) {
    $auth = '';
    
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    
    if (!$auth || !preg_match('/Basic\s+(.*)$/i', $auth, $matches)) {
        return null;
    }
    
    $creds = base64_decode($matches[1]);
    $parts = explode(':', $creds, 2);
    if (count($parts) !== 2) {
        return null;
    }
    
    list($login, $password) = $parts;
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE login = ?");
    $stmt->execute([$login]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        return $user;
    }
    return null;
}

$user = authenticate($pdo);
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';

// === РОУТИНГ ===

// Получить заявки
if ($method === 'GET' && $path === 'requests') {
    $status = $_GET['status'] ?? 'all';
    $sql = "SELECT * FROM requests";
    if ($status !== 'all') {
        $sql .= " WHERE status = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$status]);
    } else {
        $stmt = $pdo->query($sql);
    }
    $requests = $stmt->fetchAll();
    foreach ($requests as &$req) {
        $stmt2 = $pdo->prepare("SELECT * FROM request_items WHERE request_id = ?");
        $stmt2->execute([$req['id']]);
        $req['items'] = $stmt2->fetchAll();
    }
    echo json_encode($requests);
}

// Создать заявку
elseif ($method === 'POST' && $path === 'requests') {
    $data = json_decode(file_get_contents('php://input'), true);
    $requestNumber = $data['requestNumber'] ?? null;
    $date = $data['date'];
    $carrierName = $data['carrierName'];
    $employeeFio = $data['employeeFio'];
    $approvedBy = $data['approvedBy'];
    $items = $data['items'];
    
    if (!$date || !$carrierName || !$employeeFio || !$approvedBy) {
        http_response_code(400);
        echo json_encode(['error' => 'Все поля обязательны для заполнения']);
        exit;
    }
    
    $pdo->beginTransaction();
    try {
        if (empty($requestNumber)) {
            $stmt = $pdo->query("SELECT MAX(CAST(request_number AS UNSIGNED)) as max_num FROM requests");
            $next = ($stmt->fetch()['max_num'] ?? 0) + 1;
            $requestNumber = (string)$next;
        } else {
            $stmt = $pdo->prepare("SELECT id FROM requests WHERE request_number = ?");
            $stmt->execute([$requestNumber]);
            if ($stmt->fetch()) {
                throw new Exception('Номер заявки уже существует');
            }
        }
        
        $status = 'В работе';
        
        $stmt = $pdo->prepare("INSERT INTO requests (request_number, date, carrier_name, status, employee_fio, approved_by) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$requestNumber, $date, $carrierName, $status, $employeeFio, $approvedBy]);
        $requestId = $pdo->lastInsertId();
        
        foreach ($items as $item) {
            if (empty($item['name'])) continue;
            $stmt = $pdo->prepare("INSERT INTO request_items (request_id, item_name, serial_number, quantity) VALUES (?, ?, ?, ?)");
            $stmt->execute([$requestId, $item['name'], $item['sn'] ?? '', $item['qty'] ?? 'Один']);
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'requestNumber' => $requestNumber, 'id' => $requestId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Обновить статус заявки
elseif ($method === 'PUT' && preg_match('#^requests/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    $status = $data['status'] ?? null;
    $field = $data['field'] ?? null;
    $inspectorName = $data['inspectorName'] ?? null;
    
    if (!$status) {
        http_response_code(400);
        echo json_encode(['error' => 'Статус не указан']);
        exit;
    }
    
    $allowedStatuses = ['В работе', 'Вынесено', 'Возвращено'];
    if (!in_array($status, $allowedStatuses)) {
        http_response_code(400);
        echo json_encode(['error' => "Недопустимый статус: $status. Допустимые: " . implode(', ', $allowedStatuses)]);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        $sql = "UPDATE requests SET status = ?";
        $params = [$status];
        
        if ($field && $inspectorName) {
            $allowedFields = ['checked_out_by', 'returned_by'];
            if (in_array($field, $allowedFields)) {
                $sql .= ", $field = ?";
                $params[] = $inspectorName;
            }
        }
        
        $sql .= " WHERE id = ?";
        $params[] = $id;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('Заявка не найдена или статус не изменён');
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Статус успешно обновлён']);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Удалить заявку
elseif ($method === 'DELETE' && preg_match('#^requests/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM requests WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}

// Экспорт в Excel
elseif ($method === 'GET' && $path === 'export') {
    $stmt = $pdo->query("
        SELECT r.id, r.request_number, r.date, r.carrier_name, r.status, r.checked_out_by, r.returned_by, r.employee_fio, r.approved_by,
               GROUP_CONCAT(CONCAT(i.item_name, ' (', IFNULL(i.serial_number, '-'), ') - ', i.quantity) SEPARATOR '; ') as items
        FROM requests r
        LEFT JOIN request_items i ON r.id = i.request_id
        GROUP BY r.id
        ORDER BY r.id DESC
    ");
    $rows = $stmt->fetchAll();
    
    $filename = "zayavki_" . date('Y-m-d_H-i-s') . ".xls";
    
    header('Content-Type: application/vnd.ms-excel');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: max-age=0');
    
    echo '<html>';
    echo '<head><meta charset="utf-8"></head>';
    echo '<body>';
    echo '<table border="1">';
    echo '<tr style="background-color: #0066CC; color: white; font-weight: bold;">';
    echo '<th>ID</th><th>№ заявки</th><th>Дата</th><th>Сотрудник</th><th>ФИО для выноса</th>';
    echo '<th>Согласовано</th><th>Оборудование</th><th>Статус</th><th>Проверил вынос</th><th>Проверил возврат</th>';
    echo '</tr>';
    
    foreach ($rows as $row) {
        $statusClass = '';
        if ($row['status'] == 'В работе') $statusClass = 'style="background-color: #FFF3CD;"';
        elseif ($row['status'] == 'Вынесено') $statusClass = 'style="background-color: #D1ECF1;"';
        elseif ($row['status'] == 'Возвращено') $statusClass = 'style="background-color: #D4EDDA;"';
        
        echo '<tr ' . $statusClass . '>';
        echo '<td>' . htmlspecialchars($row['id']) . '</td>';
        echo '<td>' . htmlspecialchars($row['request_number']) . '</td>';
        echo '<td>' . htmlspecialchars($row['date']) . '</td>';
        echo '<td>' . htmlspecialchars($row['carrier_name']) . '</td>';
        echo '<td>' . htmlspecialchars($row['employee_fio']) . '</td>';
        echo '<td>' . htmlspecialchars($row['approved_by']) . '</td>';
        echo '<td>' . htmlspecialchars($row['items']) . '</td>';
        echo '<td>' . htmlspecialchars($row['status']) . '</td>';
        echo '<td>' . htmlspecialchars($row['checked_out_by'] ?? '') . '</td>';
        echo '<td>' . htmlspecialchars($row['returned_by'] ?? '') . '</td>';
        echo '</tr>';
    }
    
    echo '</table>';
    echo '</body>';
    echo '</html>';
    exit;
}

// Получить список пользователей (админ)
elseif ($method === 'GET' && $path === 'users') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    $stmt = $pdo->query("SELECT id, login, role FROM users");
    echo json_encode($stmt->fetchAll());
}

// Создать пользователя (админ)
elseif ($method === 'POST' && $path === 'users') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    $data = json_decode(file_get_contents('php://input'), true);
    
    $login = $data['login'];
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $role = $data['role'] ?? 'user';
    try {
        $stmt = $pdo->prepare("INSERT INTO users (login, password, role) VALUES (?, ?, ?)");
        $stmt->execute([$login, $password, $role]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Логин уже существует']);
    }
}

// Редактировать пользователя (админ)
elseif ($method === 'PUT' && preg_match('#^users/(\d+)$#', $path, $matches)) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    $id = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    $login = $data['login'] ?? null;
    $password = $data['password'] ?? null;
    $role = $data['role'] ?? null;
    
    $stmt = $pdo->prepare("SELECT login FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $currentUser = $stmt->fetch();
    
    if (!$currentUser) {
        http_response_code(404);
        echo json_encode(['error' => 'Пользователь не найден']);
        exit;
    }
    
    $isAdmin = ($currentUser['login'] === 'admin');
    
    $sql = "UPDATE users SET";
    $params = [];
    $updates = [];
    
    if ($login !== null && $login !== '' && !$isAdmin) {
        $updates[] = "login = ?";
        $params[] = $login;
    }
    if ($role !== null && $role !== '' && !$isAdmin) {
        $updates[] = "role = ?";
        $params[] = $role;
    }
    if ($password !== null && $password !== '') {
        $updates[] = "password = ?";
        $params[] = password_hash($password, PASSWORD_DEFAULT);
    }
    
    if (empty($updates)) {
        echo json_encode(['success' => true, 'message' => 'Ничего не изменено']);
        exit;
    }
    
    $sql .= " " . implode(", ", $updates) . " WHERE id = ?";
    $params[] = $id;
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Логин уже существует']);
    }
}

// Удалить пользователя (админ)
elseif ($method === 'DELETE' && preg_match('#^users/(\d+)$#', $path, $matches)) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    $id = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND login != 'admin'");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}

// Не найдено
else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}