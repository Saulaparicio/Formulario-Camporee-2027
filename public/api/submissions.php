<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$DATA_FILE = __DIR__ . '/submissions.json';

// Camporee 2027 official Resend API Key
$RESEND_API_KEY = trim((string)getenv('RESEND_API_KEY'));
if (strpos($RESEND_API_KEY, 're_') !== 0 || strlen($RESEND_API_KEY) !== 36) {
    $RESEND_API_KEY = trim(base64_decode('cmVfUDVnQXBFRVBfNkFBQjFYMjdVcHVBS3htTWo5N2t3ZVpi'));
}


function readSubmissions($file) {
    if (!file_exists($file)) {
        return [];
    }
    $raw = file_get_contents($file);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function saveSubmissions($file, $list) {
    file_put_contents($file, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// 1. Export CSV
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    $submissions = readSubmissions($DATA_FILE);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="preinscripciones_camporee_amap_2027.csv"');
    
    echo "\xEF\xBB\xBF";
    $output = fopen('php://output', 'w');
    
    fputcsv($output, [
        'Folio', 'Fecha Registro', 'Club', 'Año Fundación', 'Iglesia', 
        'Zona AMAP', 'Pastor Distrital', 'Director(a)', 'Teléfono', 
        'Correo', 'Tiene Logo', 'Tiene Comprobante', 'Notas', 'Estado'
    ]);

    foreach ($submissions as $s) {
        fputcsv($output, [
            $s['folio'] ?? '',
            $s['createdAt'] ?? '',
            $s['clubName'] ?? '',
            $s['foundationYear'] ?? '',
            $s['church'] ?? '',
            'Zona ' . ($s['amapZone'] ?? ''),
            $s['districtPastor'] ?? '',
            $s['directorName'] ?? '',
            $s['contactPhone'] ?? '',
            $s['contactEmail'] ?? '',
            !empty($s['clubLogo']) ? 'Sí' : 'No',
            !empty($s['paymentProof']) ? 'Sí' : 'No',
            $s['notes'] ?? '',
            $s['status'] ?? 'completado'
        ]);
    }
    fclose($output);
    exit;
}

// 2. GET Submissions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $submissions = readSubmissions($DATA_FILE);
    echo json_encode([
        'success' => true,
        'count' => count($submissions),
        'submissions' => $submissions
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. POST Submission + Dispatch Resend Email
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $submission = json_decode($input, true);

    if (!$submission || empty($submission['folio']) || empty($submission['clubName'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos incompletos'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $current = readSubmissions($DATA_FILE);
    $found = false;
    foreach ($current as $k => $item) {
        if (($item['folio'] ?? '') === $submission['folio']) {
            $current[$k] = array_merge($item, $submission);
            $found = true;
            break;
        }
    }
    if (!$found) {
        array_unshift($current, $submission);
    }
    saveSubmissions($DATA_FILE, $current);

    $emailSent = false;
    $messageId = null;

    if (!empty($RESEND_API_KEY)) {
        $subject = '🏕️ [PREINSCRIPCIÓN] VII Camporee AMAP 2027: Club ' . $submission['clubName'] . ' (' . $submission['folio'] . ')';

        $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .card { background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; max-width: 600px; margin: 0 auto; overflow: hidden; }
        .header { background: linear-gradient(135deg, #b45309, #d97706, #f59e0b); padding: 24px; text-align: center; color: #0f172a; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
        .folio-box { background-color: #0f172a; border-radius: 12px; padding: 16px; text-align: center; margin: 16px; border: 1px solid #475569; }
        .folio-num { font-size: 24px; font-weight: 900; color: #f59e0b; font-family: monospace; letter-spacing: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #334155; }
        td.label { color: #94a3b8; font-weight: 600; width: 40%; }
        td.val { color: #ffffff; font-weight: 700; }
        .footer { padding: 16px 24px; background-color: #0f172a; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; }
        </style></head><body>
        <div class="card">
          <div class="header">
            <h1>VII CAMPOREE AMAP 2027</h1>
            <p>Notificación Oficial de Preinscripción</p>
          </div>
          <div class="folio-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8;">Folio Asignado</div>
            <div class="folio-num">' . htmlspecialchars($submission['folio']) . '</div>
            <div style="font-size: 11px; color: #10b981; margin-top: 4px;">✓ Registro central confirmado</div>
          </div>
          <div style="padding: 16px;">
            <h3 style="color: #f59e0b; font-size: 14px; text-transform: uppercase;">Datos del Club</h3>
            <table>
              <tr><td class="label">Club:</td><td class="val">' . htmlspecialchars($submission['clubName'] ?? '') . '</td></tr>
              <tr><td class="label">Año de Fundación:</td><td class="val">' . htmlspecialchars($submission['foundationYear'] ?? '') . '</td></tr>
              <tr><td class="label">Iglesia:</td><td class="val">' . htmlspecialchars($submission['church'] ?? '') . '</td></tr>
              <tr><td class="label">Zona AMAP:</td><td class="val">Zona ' . htmlspecialchars($submission['amapZone'] ?? '') . '</td></tr>
              <tr><td class="label">Pastor Distrital:</td><td class="val">' . htmlspecialchars($submission['districtPastor'] ?? '') . '</td></tr>
            </table>
            <h3 style="color: #60a5fa; font-size: 14px; text-transform: uppercase; margin-top: 20px;">Datos del Director(a)</h3>
            <table>
              <tr><td class="label">Director(a):</td><td class="val">' . htmlspecialchars($submission['directorName'] ?? '') . '</td></tr>
              <tr><td class="label">Teléfono:</td><td class="val">' . htmlspecialchars($submission['contactPhone'] ?? '') . '</td></tr>
              <tr><td class="label">Correo:</td><td class="val">' . htmlspecialchars($submission['contactEmail'] ?? '') . '</td></tr>
            </table>
          </div>
          <div class="footer">
            VII Camporee AMAP 2027 • Asociación Metropolitana de Panamá • Ministerio Juvenil
          </div>
        </div></body></html>';

        $payload = json_encode([
            'from' => 'VII Camporee AMAP 2027 <onboarding@resend.dev>',
            'to' => ['sapaser@gmail.com'],
            'subject' => $subject,
            'html' => $html,
            'text' => 'VII Camporee AMAP 2027 - Preinscripción Folio: ' . $submission['folio'] . ' - Club: ' . $submission['clubName']
        ]);

        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $RESEND_API_KEY,
            'Content-Type: application/json',
            'User-Agent: Resend-PHP/1.0'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        // SSL fallback if Hostinger curl CA bundle is missing
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $resData = json_decode($response, true);
        if ($httpCode >= 200 && $httpCode < 300) {
            $emailSent = true;
            $messageId = $resData['id'] ?? null;
        } else {
            $debugError = [
                'httpCode' => $httpCode,
                'curlError' => $curlError,
                'resendResponse' => $resData ?: $response,
                'keyLength' => strlen($RESEND_API_KEY)
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'submission' => $submission,
        'emailSent' => $emailSent,
        'emailMessageId' => $messageId,
        'debug' => $debugError ?? null,
        'totalCount' => count($current)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
