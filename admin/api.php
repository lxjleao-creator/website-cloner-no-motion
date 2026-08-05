<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('enplus_cms_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

$root = dirname(__DIR__);
$contentDir = $root . DIRECTORY_SEPARATOR . 'content';
$stateFile = $contentDir . DIRECTORY_SEPARATOR . 'cms-state.json';
$usersFile = $contentDir . DIRECTORY_SEPARATOR . 'cms-users.json';
$submissionsFile = $contentDir . DIRECTORY_SEPARATOR . 'submissions.json';
$formsFile = $contentDir . DIRECTORY_SEPARATOR . 'forms.json';
$privateDir = dirname($root) . DIRECTORY_SEPARATOR . '.enplus-private';
$mailSettingsFile = $privateDir . DIRECTORY_SEPARATOR . 'smtp.json';
$action = $_GET['action'] ?? 'state';
$permissionKeys = ['pages', 'menus', 'products', 'categories', 'news', 'downloads', 'submissions', 'seo', 'media', 'settings'];

function cms_response(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function cms_read_json(string $file): ?array {
    if (!is_file($file)) return null;
    $json = file_get_contents($file);
    $data = json_decode($json ?: '', true);
    return is_array($data) ? $data : null;
}

function cms_write_json(string $directory, string $file, array $data): void {
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        cms_response(500, ['ok' => false, 'error' => 'Unable to create data directory']);
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false || file_put_contents($file, $json, LOCK_EX) === false) {
        cms_response(500, ['ok' => false, 'error' => 'Unable to write data file']);
    }
}

function cms_write_private_json(string $directory, string $file, array $data): void {
    cms_write_json($directory, $file, $data);
    @chmod($directory, 0700);
    @chmod($file, 0600);
}

function cms_request_payload(): array {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw ?: '', true);
    return is_array($payload) ? $payload : [];
}

function cms_seed_users(): array {
    return [[
        'id' => 'user-superadmin',
        'username' => 'admin',
        'displayName' => '超级管理员',
        'role' => 'super_admin',
        'permissions' => ['pages', 'menus', 'products', 'categories', 'news', 'downloads', 'submissions', 'seo', 'media', 'settings'],
        'active' => true,
        'salt' => 'a7cd7cdeeee0da73256c3944adfdf3f4ca34126d46be9a07',
        'passwordHash' => 'c71b8a47ec5ae6281f33924f9e9d25eaefe0a384da6bc54615801f04e10c766d',
        'createdAt' => '2026-08-04T00:00:00+08:00',
        'updatedAt' => '2026-08-04T00:00:00+08:00',
    ]];
}

function cms_read_users(string $contentDir, string $usersFile): array {
    $users = cms_read_json($usersFile);
    if (is_array($users) && count($users)) return $users;
    $users = cms_seed_users();
    cms_write_json($contentDir, $usersFile, $users);
    return $users;
}

function cms_public_user(array $user): array {
    return [
        'id' => $user['id'],
        'username' => $user['username'],
        'displayName' => $user['displayName'] ?? $user['username'],
        'role' => $user['role'] ?? 'editor',
        'permissions' => array_values($user['permissions'] ?? []),
        'active' => ($user['active'] ?? true) === true,
        'createdAt' => $user['createdAt'] ?? '',
        'updatedAt' => $user['updatedAt'] ?? '',
    ];
}

function cms_current_user(string $contentDir, string $usersFile): ?array {
    $userId = $_SESSION['cms_user_id'] ?? '';
    if (!$userId) return null;
    foreach (cms_read_users($contentDir, $usersFile) as $user) {
        if (($user['id'] ?? '') === $userId && ($user['active'] ?? true) === true) return $user;
    }
    unset($_SESSION['cms_user_id'], $_SESSION['cms_csrf']);
    return null;
}

function cms_require_user(string $contentDir, string $usersFile): array {
    $user = cms_current_user($contentDir, $usersFile);
    if (!$user) cms_response(401, ['ok' => false, 'authenticated' => false, 'error' => '请先登录']);
    return $user;
}

function cms_require_csrf(): void {
    $expected = (string)($_SESSION['cms_csrf'] ?? '');
    $provided = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!$expected || !$provided || !hash_equals($expected, $provided)) {
        cms_response(403, ['ok' => false, 'error' => '安全令牌已失效，请重新登录']);
    }
}

function cms_require_super_admin(array $user): void {
    if (($user['role'] ?? '') !== 'super_admin') {
        cms_response(403, ['ok' => false, 'error' => '只有超级管理员可以管理人员和权限']);
    }
}

function cms_has_permission(array $user, string $permission): bool {
    return ($user['role'] ?? '') === 'super_admin' || in_array($permission, $user['permissions'] ?? [], true);
}

function cms_password_hash(string $password, string $salt): string {
    return hash_pbkdf2('sha256', $password, $salt, 210000, 64, false);
}

function cms_clean_permissions($permissions, array $allowed): array {
    if (!is_array($permissions)) return [];
    return array_values(array_unique(array_values(array_intersect($allowed, $permissions))));
}

function cms_authorized_state(array $user, ?array $current, array $incoming): array {
    if (($user['role'] ?? '') === 'super_admin' || !$current) return $incoming;
    $result = $current;
    $fieldPermissions = [
        'pages' => 'pages',
        'menus' => 'menus',
        'products' => 'products',
        'news' => 'news',
        'downloads' => 'downloads',
        'downloadCategories' => 'downloads',
        'media' => 'media',
        'settings' => 'settings',
    ];
    foreach ($fieldPermissions as $field => $permission) {
        if (cms_has_permission($user, $permission) && array_key_exists($field, $incoming)) {
            $result[$field] = $incoming[$field];
        }
    }
    if (isset($incoming['activity']) && is_array($incoming['activity'])) $result['activity'] = $incoming['activity'];
    return $result;
}

function cms_safe_upload_folder(?string $folder): string {
    $cleaned = strtolower(preg_replace('/[^a-z0-9-]/i', '', $folder ?: 'products') ?: 'products');
    $allowed = ['products', 'news', 'heroes', 'downloads', 'brand'];
    return in_array($cleaned, $allowed, true) ? $cleaned : 'products';
}

function cms_safe_upload_name(?string $name, string $mimeType): string {
    $mimeExt = ['image/jpeg' => '.jpg', 'image/png' => '.png', 'image/webp' => '.webp', 'image/gif' => '.gif', 'image/svg+xml' => '.svg', 'application/pdf' => '.pdf'];
    $raw = basename(str_replace('\\', '/', $name ?: 'media-file'));
    $ext = pathinfo($raw, PATHINFO_EXTENSION);
    $extension = $ext ? '.' . strtolower($ext) : ($mimeExt[$mimeType] ?? '.bin');
    $base = trim(preg_replace('/[^a-z0-9-_]+/i', '-', pathinfo($raw, PATHINFO_FILENAME)) ?: 'media', '-');
    return time() . '-' . ($base ?: 'media') . $extension;
}

function cms_save_uploaded_data_url(string $root, array $payload): array {
    $dataUrl = $payload['dataUrl'] ?? '';
    if (!is_string($dataUrl) || !preg_match('/^data:([^;,]+);base64,(.+)$/i', $dataUrl, $matches)) cms_response(400, ['ok' => false, 'error' => 'Invalid upload payload']);
    $mimeType = $matches[1];
    if (!preg_match('/^(image\/(jpeg|png|webp|gif|svg\+xml)|application\/pdf)$/i', $mimeType)) cms_response(400, ['ok' => false, 'error' => 'Unsupported upload type']);
    $folder = cms_safe_upload_folder($payload['folder'] ?? 'products');
    $fileName = cms_safe_upload_name($payload['fileName'] ?? 'media-file', $mimeType);
    $uploadDir = $root . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $folder;
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) cms_response(500, ['ok' => false, 'error' => 'Unable to create upload directory']);
    $bytes = base64_decode($matches[2], true);
    if ($bytes === false) cms_response(400, ['ok' => false, 'error' => 'Unable to decode upload']);
    $target = $uploadDir . DIRECTORY_SEPARATOR . $fileName;
    if (file_put_contents($target, $bytes, LOCK_EX) === false) cms_response(500, ['ok' => false, 'error' => 'Unable to save upload']);
    $url = '/uploads/' . $folder . '/' . $fileName;
    return ['id' => $url, 'title' => $payload['title'] ?? $fileName, 'url' => $url, 'folder' => $folder, 'type' => str_starts_with($mimeType, 'image/') ? 'image' : 'document', 'usage' => $payload['usage'] ?? 'Unassigned', 'size' => strlen($bytes), 'mimeType' => $mimeType, 'createdAt' => date(DATE_ATOM)];
}

function cms_submission_text($value, int $max = 500): string {
    $text = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string)$value) ?? '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $max, 'UTF-8') : substr($text, 0, $max);
}

function cms_form_field_types(): array {
    return ['text', 'email', 'phone', 'number', 'textarea', 'select', 'checkbox'];
}

function cms_form_slug($value): string {
    $slug = strtolower(cms_submission_text($value, 80));
    $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug) ?? '';
    return trim(preg_replace('/-+/', '-', $slug) ?? '', '-');
}

function cms_read_forms(string $formsFile): array {
    $forms = cms_read_json($formsFile);
    return is_array($forms) ? array_values($forms) : [];
}

function cms_public_form(array $form): array {
    return [
        'id' => (string)($form['id'] ?? ''),
        'name' => (string)($form['name'] ?? 'Website Form'),
        'slug' => (string)($form['slug'] ?? ''),
        'title' => (string)($form['title'] ?? $form['name'] ?? 'Website Form'),
        'description' => (string)($form['description'] ?? ''),
        'submitLabel' => (string)($form['submitLabel'] ?? 'Submit'),
        'successMessage' => (string)($form['successMessage'] ?? 'Thank you. Your submission has been received.'),
        'status' => (string)($form['status'] ?? 'draft'),
        'fields' => array_values(array_map(static fn($field) => [
            'id' => (string)($field['id'] ?? ''),
            'key' => (string)($field['key'] ?? ''),
            'label' => (string)($field['label'] ?? 'Field'),
            'type' => (string)($field['type'] ?? 'text'),
            'required' => !empty($field['required']),
            'placeholder' => (string)($field['placeholder'] ?? ''),
            'width' => ($field['width'] ?? 'half') === 'full' ? 'full' : 'half',
            'includeInEmail' => !array_key_exists('includeInEmail', $field) || !empty($field['includeInEmail']),
            'options' => array_values(array_filter(array_map('strval', is_array($field['options'] ?? null) ? $field['options'] : []))),
        ], is_array($form['fields'] ?? null) ? $form['fields'] : [])),
    ];
}

function cms_find_form(array $forms, string $id = '', string $slug = ''): ?array {
    foreach ($forms as $form) {
        if (($id !== '' && ($form['id'] ?? '') === $id) || ($slug !== '' && ($form['slug'] ?? '') === $slug)) return $form;
    }
    return null;
}

function cms_validate_form_payload(array $payload, array $forms): array {
    $id = cms_submission_text($payload['id'] ?? '', 90);
    $existing = $id !== '' ? cms_find_form($forms, $id, '') : null;
    if ($id === '') $id = 'form-' . bin2hex(random_bytes(8));
    $name = cms_submission_text($payload['name'] ?? '', 100);
    $slug = cms_form_slug($payload['slug'] ?? $name);
    if ($name === '' || $slug === '') cms_response(422, ['ok' => false, 'error' => '表单名称和表单标识不能为空']);
    foreach ($forms as $form) {
        if (($form['id'] ?? '') !== $id && ($form['slug'] ?? '') === $slug) cms_response(409, ['ok' => false, 'error' => '这个表单标识已被使用']);
    }
    $rawFields = is_array($payload['fields'] ?? null) ? array_values($payload['fields']) : [];
    if (!$rawFields || count($rawFields) > 40) cms_response(422, ['ok' => false, 'error' => '每张表单需要 1-40 个字段']);
    $fields = [];
    $keys = [];
    foreach ($rawFields as $index => $field) {
        if (!is_array($field)) continue;
        $label = cms_submission_text($field['label'] ?? '', 140);
        $key = preg_replace('/[^a-zA-Z0-9_]/', '', cms_submission_text($field['key'] ?? '', 60)) ?? '';
        $type = in_array(($field['type'] ?? ''), cms_form_field_types(), true) ? $field['type'] : 'text';
        if ($label === '' || !preg_match('/^[a-zA-Z][a-zA-Z0-9_]{0,59}$/', $key)) cms_response(422, ['ok' => false, 'error' => '字段名称不能为空，字段标识需以字母开头']);
        if (isset($keys[strtolower($key)])) cms_response(422, ['ok' => false, 'error' => '同一张表单的字段标识不能重复']);
        $keys[strtolower($key)] = true;
        $options = [];
        foreach (is_array($field['options'] ?? null) ? $field['options'] : [] as $option) {
            $clean = cms_submission_text($option, 100);
            if ($clean !== '' && !in_array($clean, $options, true)) $options[] = $clean;
        }
        if ($type === 'select' && !$options) cms_response(422, ['ok' => false, 'error' => 'Select 字段至少需要一个选项']);
        $fields[] = [
            'id' => cms_submission_text($field['id'] ?? '', 90) ?: 'field-' . bin2hex(random_bytes(6)),
            'key' => $key,
            'label' => $label,
            'type' => $type,
            'required' => !empty($field['required']),
            'placeholder' => cms_submission_text($field['placeholder'] ?? '', 180),
            'width' => ($field['width'] ?? 'half') === 'full' ? 'full' : 'half',
            'includeInEmail' => !empty($field['includeInEmail']),
            'options' => $options,
        ];
    }
    return [
        'id' => $id,
        'name' => $name,
        'slug' => $slug,
        'title' => cms_submission_text($payload['title'] ?? $name, 140) ?: $name,
        'description' => cms_submission_text($payload['description'] ?? '', 800),
        'submitLabel' => cms_submission_text($payload['submitLabel'] ?? 'Submit', 60) ?: 'Submit',
        'successMessage' => cms_submission_text($payload['successMessage'] ?? 'Thank you. Your submission has been received.', 300),
        'status' => ($payload['status'] ?? 'draft') === 'active' ? 'active' : 'draft',
        'fields' => $fields,
        'createdAt' => (string)($existing['createdAt'] ?? date(DATE_ATOM)),
        'updatedAt' => date(DATE_ATOM),
    ];
}

function cms_public_mail_settings(?array $settings): array {
    $settings = is_array($settings) ? $settings : [];
    return [
        'host' => (string)($settings['host'] ?? 'smtp.exmail.qq.com'),
        'port' => (int)($settings['port'] ?? 465),
        'encryption' => (string)($settings['encryption'] ?? 'ssl'),
        'username' => (string)($settings['username'] ?? 'ads@en-plus.com.cn'),
        'fromName' => (string)($settings['fromName'] ?? 'Tervona Website'),
        'recipient' => 'ads@en-plus.com.cn',
        'configured' => !empty($settings['password']) && !empty($settings['username']) && !empty($settings['host']),
    ];
}

function cms_smtp_read($socket, array $expected): string {
    $response = '';
    while (($line = fgets($socket, 8192)) !== false) {
        $response .= $line;
        if (strlen($line) < 4 || $line[3] === ' ') break;
    }
    $code = (int)substr($response, 0, 3);
    if (!in_array($code, $expected, true)) throw new RuntimeException('SMTP rejected command (' . $code . ')');
    return $response;
}

function cms_smtp_command($socket, string $command, array $expected): string {
    if (fwrite($socket, $command . "\r\n") === false) throw new RuntimeException('Unable to write to SMTP server');
    return cms_smtp_read($socket, $expected);
}

function cms_email_escape($value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function cms_email_layout(string $eyebrow, string $title, string $intro, string $content, string $footer = ''): string {
    $logoUrl = 'https://indigo-mongoose-458443.hostingersite.com/assets/tervona-logo-web.jpg';
    $year = date('Y');
    $preheader = cms_email_escape($eyebrow . ' — ' . $title);
    $footerText = $footer !== '' ? cms_email_escape($footer) : 'This notification was generated automatically by the Tervona website.';
    return '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . cms_email_escape($title) . '</title></head>'
        . '<body style="margin:0;padding:0;background:#f3f1f8;color:#181524;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">'
        . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' . $preheader . '&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f1f8;"><tr><td align="center" style="padding:32px 12px;">'
        . '<table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 36px rgba(24,21,36,.10);">'
        . '<tr><td style="background:#ffffff;padding:22px 32px;border-bottom:4px solid #18aeb2;">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>'
        . '<td align="left" valign="middle"><img src="' . $logoUrl . '" width="160" alt="Tervona" style="display:block;width:160px;max-width:160px;height:auto;border:0;color:#343638;font-size:22px;font-weight:700;"></td>'
        . '<td align="right" valign="middle" style="color:#7b7f80;font-size:12px;letter-spacing:.7px;text-transform:uppercase;">Website notification</td>'
        . '</tr></table></td></tr>'
        . '<tr><td style="padding:38px 38px 18px;">'
        . '<div style="display:inline-block;margin:0 0 15px;padding:7px 12px;border-radius:999px;background:#e9f8f7;color:#118f96;font-size:12px;line-height:16px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">' . cms_email_escape($eyebrow) . '</div>'
        . '<h1 style="margin:0 0 13px;color:#171321;font-size:30px;line-height:38px;font-weight:750;">' . cms_email_escape($title) . '</h1>'
        . '<p style="margin:0;color:#655f70;font-size:16px;line-height:25px;">' . cms_email_escape($intro) . '</p>'
        . '</td></tr>'
        . '<tr><td style="padding:8px 38px 38px;">' . $content . '</td></tr>'
        . '<tr><td style="padding:24px 38px;background:#faf9fc;border-top:1px solid #ece9f1;">'
        . '<p style="margin:0 0 6px;color:#625d6d;font-size:12px;line-height:19px;">' . $footerText . '</p>'
        . '<p style="margin:0;color:#9a94a4;font-size:11px;line-height:18px;">&copy; ' . $year . ' Tervona. Website enquiry system.</p>'
        . '</td></tr></table></td></tr></table></body></html>';
}

function cms_email_detail_row(string $label, $value, bool $last = false): string {
    $displayValue = trim((string)$value) !== '' ? cms_email_escape($value) : '<span style="color:#aaa4b1;">Not provided</span>';
    $border = $last ? 'none' : '1px solid #ece9f1';
    return '<tr><td valign="top" width="155" style="width:155px;padding:12px 12px 12px 0;border-bottom:' . $border . ';color:#817a8c;font-size:13px;line-height:20px;">' . cms_email_escape($label) . '</td>'
        . '<td valign="top" style="padding:12px 0;border-bottom:' . $border . ';color:#211c2b;font-size:14px;line-height:20px;font-weight:600;word-break:break-word;">' . $displayValue . '</td></tr>';
}

function cms_submission_email_html(array $record): string {
    $displayName = cms_submission_text($record['displayName'] ?? '', 180);
    if ($displayName === '') $displayName = trim(($record['firstName'] ?? '') . ' ' . ($record['lastName'] ?? ''));
    if ($displayName === '') $displayName = cms_submission_text($record['company'] ?? '', 180);
    if ($displayName === '') $displayName = cms_submission_text($record['email'] ?? '', 180);
    if ($displayName === '') $displayName = 'New form submission';
    $formName = cms_submission_text($record['formName'] ?? 'Website form', 140);
    $details = '';
    $messages = '';
    $values = is_array($record['values'] ?? null) ? $record['values'] : [];
    foreach ($values as $entry) {
        if (!is_array($entry) || empty($entry['includeInEmail'])) continue;
        $label = cms_submission_text($entry['label'] ?? '', 140);
        $type = (string)($entry['type'] ?? 'text');
        $rawValue = $entry['value'] ?? '';
        $value = is_bool($rawValue) ? ($rawValue ? 'Yes' : 'No') : trim((string)$rawValue);
        if ($label === '' || $value === '') continue;
        if ($type === 'textarea') {
            $messages .= '<h2 style="margin:24px 0 10px;color:#211c2b;font-size:16px;line-height:23px;">' . cms_email_escape($label) . '</h2>'
                . '<div style="margin:0;padding:18px 20px;border-left:4px solid #18aeb2;border-radius:4px 10px 10px 4px;background:#effafa;color:#332c3e;font-size:15px;line-height:24px;white-space:pre-wrap;word-break:break-word;">' . nl2br(cms_email_escape($value)) . '</div>';
        } else {
            $details .= cms_email_detail_row($label, $value);
        }
    }
    if ($details === '' && $messages === '') {
        $details = cms_email_detail_row('Submission', 'The customer submitted this form without optional email fields.', true);
    }
    $detailsBlock = $details !== ''
        ? '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0 0 6px;border:1px solid #e9e5ef;border-radius:12px;background:#ffffff;"><tr><td style="padding:7px 20px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">' . $details . '</table></td></tr></table>'
        : '';
    return '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New customer enquiry</title></head>'
        . '<body style="margin:0;padding:0;background:#f3f1f8;color:#181524;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">'
        . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">New ' . cms_email_escape($formName) . ' submission from ' . cms_email_escape($displayName) . '</div>'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f1f8;"><tr><td align="center" style="padding:30px 12px;">'
        . '<table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 32px rgba(24,21,36,.10);">'
        . '<tr><td style="padding:22px 32px;background:#ffffff;border-bottom:4px solid #18aeb2;"><img src="https://indigo-mongoose-458443.hostingersite.com/assets/tervona-logo-web.jpg" width="160" alt="Tervona" style="display:block;width:160px;max-width:160px;height:auto;border:0;color:#343638;font-size:22px;font-weight:700;"></td></tr>'
        . '<tr><td style="padding:34px 36px 16px;">'
        . '<div style="margin:0 0 8px;color:#118f96;font-size:12px;line-height:18px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;">New ' . cms_email_escape($formName) . '</div>'
        . '<h1 style="margin:0 0 6px;color:#171321;font-size:29px;line-height:37px;font-weight:750;">' . cms_email_escape($displayName) . '</h1>'
        . '<p style="margin:0;color:#6f6879;font-size:15px;line-height:23px;">Customer-submitted information</p>'
        . '</td></tr>'
        . '<tr><td style="padding:10px 36px 34px;">'
        . $detailsBlock . $messages
        . '</td></tr></table></td></tr></table></body></html>';
}

function cms_test_email_html(array $settings): string {
    $public = cms_public_mail_settings($settings);
    $details = cms_email_detail_row('Status', 'Connected successfully')
        . cms_email_detail_row('Sender', $public['username'])
        . cms_email_detail_row('Recipient', $public['recipient'])
        . cms_email_detail_row('SMTP server', $public['host'] . ':' . $public['port'])
        . cms_email_detail_row('Encryption', strtoupper($public['encryption']), true);
    $content = '<div style="margin:16px 0 20px;padding:17px 19px;border:1px solid #b9e3cc;border-radius:11px;background:#eefaf3;color:#17633a;font-size:14px;line-height:22px;font-weight:700;">&#10003;&nbsp; Tencent Enterprise Mail accepted the test message.</div>'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid #e9e5ef;border-radius:12px;background:#ffffff;"><tr><td style="padding:7px 20px;">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">' . $details . '</table></td></tr></table>'
        . '<p style="margin:20px 0 0;color:#817a8c;font-size:12px;line-height:19px;">Tested at ' . cms_email_escape(date(DATE_ATOM)) . '</p>';
    return cms_email_layout('System check', 'Email Delivery Is Working', 'The Tervona website can now deliver new enquiry notifications securely.', $content, 'This is a system test only. No customer enquiry was submitted.');
}

function cms_smtp_send(array $settings, string $recipient, string $subjectText, string $body, string $replyTo = '', bool $isHtml = false): bool {
    $host = (string)($settings['host'] ?? '');
    $port = (int)($settings['port'] ?? 465);
    $encryption = strtolower((string)($settings['encryption'] ?? 'ssl'));
    $username = (string)($settings['username'] ?? '');
    $password = (string)($settings['password'] ?? '');
    $fromName = cms_submission_text($settings['fromName'] ?? 'Tervona Website', 100);
    if (!$host || !$port || !$username || !$password) throw new RuntimeException('SMTP is not configured');

    $transport = $encryption === 'ssl' ? 'ssl://' : 'tcp://';
    $socket = @stream_socket_client($transport . $host . ':' . $port, $errorNumber, $errorMessage, 15, STREAM_CLIENT_CONNECT);
    if (!$socket) throw new RuntimeException('SMTP connection failed: ' . cms_submission_text($errorMessage, 160));
    stream_set_timeout($socket, 15);
    try {
        cms_smtp_read($socket, [220]);
        cms_smtp_command($socket, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);
        if ($encryption === 'tls') {
            cms_smtp_command($socket, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new RuntimeException('Unable to enable SMTP TLS');
            cms_smtp_command($socket, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);
        }
        cms_smtp_command($socket, 'AUTH LOGIN', [334]);
        cms_smtp_command($socket, base64_encode($username), [334]);
        cms_smtp_command($socket, base64_encode($password), [235]);
        cms_smtp_command($socket, 'MAIL FROM:<' . str_replace(["\r", "\n"], '', $username) . '>', [250]);
        cms_smtp_command($socket, 'RCPT TO:<' . str_replace(["\r", "\n"], '', $recipient) . '>', [250, 251]);
        cms_smtp_command($socket, 'DATA', [354]);
        $safeSubject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'From: ' . $fromName . ' <' . $username . '>',
            'To: <' . $recipient . '>',
            'Subject: ' . $safeSubject,
            'MIME-Version: 1.0',
            'Content-Type: ' . ($isHtml ? 'text/html' : 'text/plain') . '; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
        ];
        if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: ' . $replyTo;
        $normalizedBody = preg_replace('/\r\n|\r|\n/', "\r\n", $body) ?? $body;
        $normalizedBody = preg_replace('/(^|\r\n)\./', '$1..', $normalizedBody) ?? $normalizedBody;
        if (fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . $normalizedBody . "\r\n.\r\n") === false) throw new RuntimeException('Unable to send SMTP message data');
        cms_smtp_read($socket, [250]);
        cms_smtp_command($socket, 'QUIT', [221]);
        return true;
    } finally {
        fclose($socket);
    }
}

function cms_receive_submission(string $contentDir, string $submissionsFile, string $formsFile, string $mailSettingsFile): array {
    $payload = cms_request_payload();
    if (cms_submission_text($payload['website'] ?? '', 200) !== '') {
        cms_response(200, ['ok' => true, 'message' => 'Thank you.']);
    }
    $lastAt = (int)($_SESSION['cms_last_submission_at'] ?? 0);
    if ($lastAt && time() - $lastAt < 20) cms_response(429, ['ok' => false, 'error' => 'Please wait before sending another enquiry.']);

    $forms = cms_read_forms($formsFile);
    $form = cms_find_form($forms, cms_submission_text($payload['formId'] ?? '', 100), cms_form_slug($payload['formSlug'] ?? 'contact-us'));
    if (!$form || ($form['status'] ?? 'draft') !== 'active') cms_response(404, ['ok' => false, 'error' => 'This form is not available.']);
    $rawValues = is_array($payload['values'] ?? null) ? $payload['values'] : $payload;
    $values = [];
    $valueMap = [];
    $replyTo = '';
    foreach (($form['fields'] ?? []) as $field) {
        if (!is_array($field)) continue;
        $key = (string)($field['key'] ?? '');
        $type = (string)($field['type'] ?? 'text');
        $raw = $rawValues[$key] ?? ($type === 'checkbox' ? false : '');
        if ($type === 'checkbox') {
            $cleanValue = $raw === true || $raw === 1 || in_array(strtolower((string)$raw), ['1', 'true', 'on', 'yes'], true);
            if (!empty($field['required']) && !$cleanValue) cms_response(422, ['ok' => false, 'error' => 'Please complete the required field: ' . ($field['label'] ?? $key)]);
        } else {
            $cleanValue = cms_submission_text($raw, $type === 'textarea' ? 5000 : 500);
            if (!empty($field['required']) && $cleanValue === '') cms_response(422, ['ok' => false, 'error' => 'Please complete the required field: ' . ($field['label'] ?? $key)]);
            if ($type === 'email' && $cleanValue !== '' && !filter_var($cleanValue, FILTER_VALIDATE_EMAIL)) cms_response(422, ['ok' => false, 'error' => 'Please enter a valid email address.']);
            if ($type === 'number' && $cleanValue !== '' && !is_numeric($cleanValue)) cms_response(422, ['ok' => false, 'error' => 'Please enter a valid number for: ' . ($field['label'] ?? $key)]);
            if ($type === 'select' && $cleanValue !== '' && !in_array($cleanValue, $field['options'] ?? [], true)) cms_response(422, ['ok' => false, 'error' => 'Please choose a valid option for: ' . ($field['label'] ?? $key)]);
            if ($type === 'email' && $replyTo === '') $replyTo = strtolower($cleanValue);
        }
        $valueMap[$key] = $cleanValue;
        $values[] = [
            'key' => $key,
            'label' => (string)($field['label'] ?? $key),
            'type' => $type,
            'value' => $cleanValue,
            'includeInEmail' => !empty($field['includeInEmail']),
        ];
    }

    $firstName = cms_submission_text($valueMap['firstName'] ?? '', 80);
    $lastName = cms_submission_text($valueMap['lastName'] ?? '', 80);
    $displayName = trim($firstName . ' ' . $lastName);
    if ($displayName === '') $displayName = cms_submission_text($valueMap['name'] ?? '', 180);
    if ($displayName === '') $displayName = cms_submission_text($valueMap['company'] ?? '', 180);
    if ($displayName === '') $displayName = $replyTo !== '' ? $replyTo : (string)($form['name'] ?? 'Form submission');

    $record = [
        'id' => 'submission-' . bin2hex(random_bytes(10)),
        'formId' => (string)$form['id'],
        'formName' => (string)$form['name'],
        'formSlug' => (string)$form['slug'],
        'displayName' => $displayName,
        'values' => $values,
        'data' => $valueMap,
        'firstName' => $firstName,
        'lastName' => $lastName,
        'email' => strtolower(cms_submission_text($valueMap['email'] ?? $replyTo, 180)),
        'phone' => cms_submission_text($valueMap['phone'] ?? '', 80),
        'company' => cms_submission_text($valueMap['company'] ?? '', 180),
        'position' => cms_submission_text($valueMap['position'] ?? '', 180),
        'country' => cms_submission_text($valueMap['country'] ?? '', 120),
        'state' => cms_submission_text($valueMap['state'] ?? '', 120),
        'message' => cms_submission_text($valueMap['message'] ?? '', 5000),
        'source' => cms_submission_text($payload['source'] ?? '/contact-us', 300),
        'status' => 'new',
        'createdAt' => date(DATE_ATOM),
        'mailSent' => false,
    ];

    $recipient = 'ads@en-plus.com.cn';
    $subjectText = '[Tervona Form] ' . $record['formName'] . ' | ' . $displayName;
    $subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
    $body = cms_submission_email_html($record);
    $safeReplyTo = str_replace(["\r", "\n"], '', $replyTo);
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: Tervona Website <noreply@indigo-mongoose-458443.hostingersite.com>',
    ];
    if ($safeReplyTo !== '') $headers[] = 'Reply-To: ' . $safeReplyTo;
    try {
        $smtpSettings = cms_read_json($mailSettingsFile);
        if (is_array($smtpSettings) && !empty($smtpSettings['password'])) {
            $record['mailSent'] = cms_smtp_send($smtpSettings, $recipient, $subjectText, $body, $replyTo, true);
            $record['mailStatus'] = 'sent';
        } else {
            $record['mailSent'] = function_exists('mail') && @mail($recipient, $subject, $body, implode("\r\n", $headers));
        // Some shared Hostinger plans reject custom From headers but accept the
        // server's default sender. Retry without headers before marking failed.
            if (!$record['mailSent'] && function_exists('mail')) $record['mailSent'] = @mail($recipient, $subject, $body);
            $record['mailStatus'] = $record['mailSent'] ? 'sent' : 'server-rejected';
        }
    } catch (Throwable $mailError) {
        $record['mailSent'] = false;
        $record['mailStatus'] = 'smtp-error';
        $record['mailError'] = cms_submission_text($mailError->getMessage(), 240);
    }

    $submissions = cms_read_json($submissionsFile) ?? [];
    array_unshift($submissions, $record);
    if (count($submissions) > 2000) $submissions = array_slice($submissions, 0, 2000);
    cms_write_json($contentDir, $submissionsFile, $submissions);
    $_SESSION['cms_last_submission_at'] = time();
    return $record;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'session') {
        $user = cms_current_user($contentDir, $usersFile);
        cms_response(200, ['ok' => true, 'authenticated' => (bool)$user, 'user' => $user ? cms_public_user($user) : null, 'csrfToken' => $user ? ($_SESSION['cms_csrf'] ?? '') : '']);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
        $lockUntil = (int)($_SESSION['cms_login_lock_until'] ?? 0);
        if ($lockUntil > time()) cms_response(429, ['ok' => false, 'error' => '登录尝试过多，请稍后再试']);
        $payload = cms_request_payload();
        $username = strtolower(trim((string)($payload['username'] ?? '')));
        $password = (string)($payload['password'] ?? '');
        $matched = null;
        foreach (cms_read_users($contentDir, $usersFile) as $user) {
            if (strtolower((string)($user['username'] ?? '')) === $username && ($user['active'] ?? true) === true) { $matched = $user; break; }
        }
        $valid = $matched && hash_equals((string)$matched['passwordHash'], cms_password_hash($password, (string)$matched['salt']));
        if (!$valid) {
            $attempts = (int)($_SESSION['cms_login_attempts'] ?? 0) + 1;
            $_SESSION['cms_login_attempts'] = $attempts;
            if ($attempts >= 6) { $_SESSION['cms_login_lock_until'] = time() + 300; $_SESSION['cms_login_attempts'] = 0; }
            cms_response(401, ['ok' => false, 'error' => '账号或密码不正确']);
        }
        session_regenerate_id(true);
        $_SESSION['cms_user_id'] = $matched['id'];
        $_SESSION['cms_csrf'] = bin2hex(random_bytes(24));
        unset($_SESSION['cms_login_attempts'], $_SESSION['cms_login_lock_until']);
        cms_response(200, ['ok' => true, 'authenticated' => true, 'user' => cms_public_user($matched), 'csrfToken' => $_SESSION['cms_csrf']]);
    }

    // Public pages consume the published content model. Write operations and
    // user management remain protected below by session, permission and CSRF.
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'state') {
        cms_response(200, ['ok' => true, 'source' => 'hostinger-php', 'state' => cms_read_json($stateFile)]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'public-forms') {
        $forms = array_values(array_filter(cms_read_forms($formsFile), fn($form) => ($form['status'] ?? 'draft') === 'active'));
        cms_response(200, ['ok' => true, 'forms' => array_values(array_map('cms_public_form', $forms))]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'public-form') {
        $form = cms_find_form(cms_read_forms($formsFile), '', cms_form_slug($_GET['slug'] ?? 'contact-us'));
        if (!$form || ($form['status'] ?? 'draft') !== 'active') cms_response(404, ['ok' => false, 'error' => 'Form not found']);
        cms_response(200, ['ok' => true, 'form' => cms_public_form($form)]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'submission') {
        $record = cms_receive_submission($contentDir, $submissionsFile, $formsFile, $mailSettingsFile);
        $form = cms_find_form(cms_read_forms($formsFile), $record['formId'] ?? '', '');
        cms_response(201, ['ok' => true, 'message' => (string)($form['successMessage'] ?? 'Thank you. Your enquiry has been received.'), 'submissionId' => $record['id']]);
    }

    $currentUser = cms_require_user($contentDir, $usersFile);


    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
        cms_require_csrf();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool)$params['secure'], (bool)$params['httponly']);
        }
        session_destroy();
        cms_response(200, ['ok' => true]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'save') {
        cms_require_csrf();
        $payload = cms_request_payload();
        if (!isset($payload['state']) || !is_array($payload['state'])) cms_response(400, ['ok' => false, 'error' => 'Missing state object']);
        $state = cms_authorized_state($currentUser, cms_read_json($stateFile), $payload['state']);
        cms_write_json($contentDir, $stateFile, $state);
        cms_response(200, ['ok' => true, 'source' => 'hostinger-php', 'state' => $state]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'upload') {
        cms_require_csrf();
        if (!cms_has_permission($currentUser, 'media')) cms_response(403, ['ok' => false, 'error' => '没有媒体上传权限']);
        cms_response(200, ['ok' => true, 'source' => 'hostinger-php', 'asset' => cms_save_uploaded_data_url($root, cms_request_payload())]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'users') {
        cms_require_super_admin($currentUser);
        $users = array_map('cms_public_user', cms_read_users($contentDir, $usersFile));
        cms_response(200, ['ok' => true, 'users' => $users]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'submissions') {
        if (!cms_has_permission($currentUser, 'submissions')) cms_response(403, ['ok' => false, 'error' => 'No permission to view submissions']);
        cms_response(200, ['ok' => true, 'submissions' => cms_read_json($submissionsFile) ?? []]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'forms') {
        if (!cms_has_permission($currentUser, 'submissions')) cms_response(403, ['ok' => false, 'error' => 'No permission to manage forms']);
        cms_response(200, ['ok' => true, 'forms' => cms_read_forms($formsFile)]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'form-save') {
        cms_require_csrf();
        if (!cms_has_permission($currentUser, 'submissions')) cms_response(403, ['ok' => false, 'error' => 'No permission to manage forms']);
        $forms = cms_read_forms($formsFile);
        $form = cms_validate_form_payload(cms_request_payload(), $forms);
        $replaced = false;
        foreach ($forms as $index => $item) {
            if (($item['id'] ?? '') === $form['id']) {
                $forms[$index] = $form;
                $replaced = true;
                break;
            }
        }
        if (!$replaced) array_unshift($forms, $form);
        cms_write_json($contentDir, $formsFile, array_values($forms));
        cms_response($replaced ? 200 : 201, ['ok' => true, 'form' => $form, 'forms' => array_values($forms)]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'form-delete') {
        cms_require_csrf();
        if (!cms_has_permission($currentUser, 'submissions')) cms_response(403, ['ok' => false, 'error' => 'No permission to manage forms']);
        $payload = cms_request_payload();
        $forms = cms_read_forms($formsFile);
        if (count($forms) <= 1) cms_response(422, ['ok' => false, 'error' => 'At least one form must remain.']);
        $next = array_values(array_filter($forms, fn($form) => ($form['id'] ?? '') !== ($payload['id'] ?? '')));
        if (count($next) === count($forms)) cms_response(404, ['ok' => false, 'error' => 'Form not found']);
        cms_write_json($contentDir, $formsFile, $next);
        cms_response(200, ['ok' => true, 'forms' => $next]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'mail-settings') {
        cms_require_super_admin($currentUser);
        cms_response(200, ['ok' => true, 'settings' => cms_public_mail_settings(cms_read_json($mailSettingsFile))]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'mail-settings-save') {
        cms_require_csrf();
        cms_require_super_admin($currentUser);
        $payload = cms_request_payload();
        $current = cms_read_json($mailSettingsFile) ?? [];
        $host = strtolower(cms_submission_text($payload['host'] ?? 'smtp.exmail.qq.com', 180));
        $port = (int)($payload['port'] ?? 465);
        $encryption = in_array(($payload['encryption'] ?? ''), ['ssl', 'tls', 'none'], true) ? $payload['encryption'] : 'ssl';
        $username = strtolower(cms_submission_text($payload['username'] ?? '', 180));
        $password = (string)($payload['password'] ?? '');
        if (!preg_match('/^[a-z0-9.-]+$/i', $host) || $port < 1 || $port > 65535 || !filter_var($username, FILTER_VALIDATE_EMAIL)) cms_response(422, ['ok' => false, 'error' => 'SMTP configuration is invalid']);
        if ($password === '') $password = (string)($current['password'] ?? '');
        if ($password === '') cms_response(422, ['ok' => false, 'error' => 'Please enter the SMTP app password']);
        $settings = ['host' => $host, 'port' => $port, 'encryption' => $encryption, 'username' => $username, 'password' => $password, 'fromName' => cms_submission_text($payload['fromName'] ?? 'Tervona Website', 100), 'updatedAt' => date(DATE_ATOM)];
        cms_write_private_json($privateDir, $mailSettingsFile, $settings);
        cms_response(200, ['ok' => true, 'settings' => cms_public_mail_settings($settings)]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'mail-test') {
        cms_require_csrf();
        cms_require_super_admin($currentUser);
        $settings = cms_read_json($mailSettingsFile) ?? [];
        try {
            cms_smtp_send($settings, 'ads@en-plus.com.cn', '[Tervona] Email delivery verified', cms_test_email_html($settings), '', true);
            cms_response(200, ['ok' => true, 'message' => 'Branded HTML test email accepted by Tencent Enterprise Mail.']);
        } catch (Throwable $smtpError) {
            cms_response(502, ['ok' => false, 'error' => cms_submission_text($smtpError->getMessage(), 240)]);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'submission-status') {
        cms_require_csrf();
        if (!cms_has_permission($currentUser, 'submissions')) cms_response(403, ['ok' => false, 'error' => 'No permission to manage submissions']);
        $payload = cms_request_payload();
        $submissions = cms_read_json($submissionsFile) ?? [];
        foreach ($submissions as &$submission) {
            if (($submission['id'] ?? '') === ($payload['id'] ?? '')) {
                $submission['status'] = in_array(($payload['status'] ?? ''), ['new', 'read', 'handled'], true) ? $payload['status'] : 'read';
                $submission['updatedAt'] = date(DATE_ATOM);
            }
        }
        unset($submission);
        cms_write_json($contentDir, $submissionsFile, $submissions);
        cms_response(200, ['ok' => true, 'submissions' => $submissions]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'submission-delete') {
        cms_require_csrf();
        if (!cms_has_permission($currentUser, 'submissions')) cms_response(403, ['ok' => false, 'error' => 'No permission to manage submissions']);
        $payload = cms_request_payload();
        $submissions = array_values(array_filter(cms_read_json($submissionsFile) ?? [], fn($item) => ($item['id'] ?? '') !== ($payload['id'] ?? '')));
        cms_write_json($contentDir, $submissionsFile, $submissions);
        cms_response(200, ['ok' => true, 'submissions' => $submissions]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'user-create') {
        cms_require_csrf();
        cms_require_super_admin($currentUser);
        $payload = cms_request_payload();
        $username = strtolower(trim((string)($payload['username'] ?? '')));
        $displayName = trim((string)($payload['displayName'] ?? ''));
        $password = (string)($payload['password'] ?? '');
        $role = ($payload['role'] ?? 'editor') === 'super_admin' ? 'super_admin' : 'editor';
        if (!preg_match('/^[a-z0-9._-]{3,40}$/', $username)) cms_response(400, ['ok' => false, 'error' => '账号需为 3-40 位字母、数字、点、下划线或短横线']);
        if (strlen($password) < 10) cms_response(400, ['ok' => false, 'error' => '密码至少需要 10 位']);
        $users = cms_read_users($contentDir, $usersFile);
        foreach ($users as $user) if (strtolower((string)$user['username']) === $username) cms_response(409, ['ok' => false, 'error' => '账号已存在']);
        $salt = bin2hex(random_bytes(24));
        $now = date(DATE_ATOM);
        $users[] = ['id' => 'user-' . bin2hex(random_bytes(8)), 'username' => $username, 'displayName' => $displayName ?: $username, 'role' => $role, 'permissions' => $role === 'super_admin' ? $permissionKeys : cms_clean_permissions($payload['permissions'] ?? [], $permissionKeys), 'active' => true, 'salt' => $salt, 'passwordHash' => cms_password_hash($password, $salt), 'createdAt' => $now, 'updatedAt' => $now];
        cms_write_json($contentDir, $usersFile, $users);
        cms_response(201, ['ok' => true, 'users' => array_map('cms_public_user', $users)]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'user-update') {
        cms_require_csrf();
        cms_require_super_admin($currentUser);
        $payload = cms_request_payload();
        $users = cms_read_users($contentDir, $usersFile);
        $index = -1;
        foreach ($users as $i => $user) if (($user['id'] ?? '') === ($payload['id'] ?? '')) { $index = $i; break; }
        if ($index < 0) cms_response(404, ['ok' => false, 'error' => '人员不存在']);
        $username = strtolower(trim((string)($payload['username'] ?? $users[$index]['username'])));
        if (!preg_match('/^[a-z0-9._-]{3,40}$/', $username)) cms_response(400, ['ok' => false, 'error' => '账号格式不正确']);
        foreach ($users as $i => $user) if ($i !== $index && strtolower((string)$user['username']) === $username) cms_response(409, ['ok' => false, 'error' => '账号已存在']);
        $role = ($payload['role'] ?? 'editor') === 'super_admin' ? 'super_admin' : 'editor';
        $active = ($payload['active'] ?? true) === true;
        if ($users[$index]['id'] === $currentUser['id'] && (!$active || $role !== 'super_admin')) cms_response(400, ['ok' => false, 'error' => '不能停用或降级当前超级管理员账号']);
        $users[$index]['username'] = $username;
        $users[$index]['displayName'] = trim((string)($payload['displayName'] ?? '')) ?: $username;
        $users[$index]['role'] = $role;
        $users[$index]['permissions'] = $role === 'super_admin' ? $permissionKeys : cms_clean_permissions($payload['permissions'] ?? [], $permissionKeys);
        $users[$index]['active'] = $active;
        if (!empty($payload['password'])) {
            if (strlen((string)$payload['password']) < 10) cms_response(400, ['ok' => false, 'error' => '新密码至少需要 10 位']);
            $users[$index]['salt'] = bin2hex(random_bytes(24));
            $users[$index]['passwordHash'] = cms_password_hash((string)$payload['password'], $users[$index]['salt']);
        }
        $users[$index]['updatedAt'] = date(DATE_ATOM);
        $activeSuperAdmins = array_filter($users, fn($user) => ($user['role'] ?? '') === 'super_admin' && ($user['active'] ?? true) === true);
        if (!count($activeSuperAdmins)) cms_response(400, ['ok' => false, 'error' => '必须保留至少一个启用的超级管理员']);
        cms_write_json($contentDir, $usersFile, $users);
        cms_response(200, ['ok' => true, 'users' => array_map('cms_public_user', $users)]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'user-delete') {
        cms_require_csrf();
        cms_require_super_admin($currentUser);
        $payload = cms_request_payload();
        if (($payload['id'] ?? '') === $currentUser['id']) cms_response(400, ['ok' => false, 'error' => '不能删除当前登录账号']);
        $users = array_values(array_filter(cms_read_users($contentDir, $usersFile), fn($user) => ($user['id'] ?? '') !== ($payload['id'] ?? '')));
        $activeSuperAdmins = array_filter($users, fn($user) => ($user['role'] ?? '') === 'super_admin' && ($user['active'] ?? true) === true);
        if (!count($activeSuperAdmins)) cms_response(400, ['ok' => false, 'error' => '必须保留至少一个启用的超级管理员']);
        cms_write_json($contentDir, $usersFile, $users);
        cms_response(200, ['ok' => true, 'users' => array_map('cms_public_user', $users)]);
    }

    cms_response(404, ['ok' => false, 'error' => 'Unknown CMS action']);
} catch (Throwable $error) {
    cms_response(500, ['ok' => false, 'error' => $error->getMessage()]);
}
