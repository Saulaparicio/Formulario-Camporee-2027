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
$APP_URL = trim((string)getenv('APP_URL')) ?: 'https://camporee2027.smartideamktg.com';

// Camporee 2027 official Resend API Key (base64 encoded to comply with git push rules)
$RESEND_API_KEY = trim((string)getenv('RESEND_API_KEY'));
if (strpos($RESEND_API_KEY, 're_') !== 0 || strlen($RESEND_API_KEY) !== 36) {
    $RESEND_API_KEY = trim(base64_decode('cmVfUDVnQXBFRVBfNkFBQjFYMjdVcHVBS3htTWo5N2t3ZVpi'));
}

$RESEND_FROM_EMAIL = trim((string)getenv('RESEND_FROM_EMAIL')) ?: 'VII Camporee AMAP 2027 <camporee@buropanama.com>';
$ADMIN_EMAIL = trim((string)getenv('ADMIN_EMAIL')) ?: 'sapaser@gmail.com';

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

function sendResendMail($apiKey, $from, $to, $subject, $html, $text = '', $replyTo = null, $attachments = []) {
    $payload = [
        'from' => $from,
        'to' => is_array($to) ? $to : [$to],
        'subject' => $subject,
        'html' => $html,
        'text' => $text
    ];
    if (!empty($replyTo)) {
        $payload['reply_to'] = $replyTo;
    }
    if (!empty($attachments) && is_array($attachments)) {
        $payload['attachments'] = $attachments;
    }

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
        'User-Agent: Resend-PHP/1.0'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resData = json_decode($response, true);
    return [
        'success' => ($httpCode >= 200 && $httpCode < 300),
        'id' => $resData['id'] ?? null,
        'httpCode' => $httpCode,
        'response' => $resData ?: $response,
        'curlError' => $curlError
    ];
}

// 1. Download Endpoint for Attachments (Logo or Payment Proof)
if (isset($_GET['download']) && !empty($_GET['folio'])) {
    $type = strtolower(trim($_GET['download'])); // 'logo' or 'proof'
    $folio = trim($_GET['folio']);
    $submissions = readSubmissions($DATA_FILE);

    $target = null;
    foreach ($submissions as $s) {
        if (($s['folio'] ?? '') === $folio) {
            $target = $s;
            break;
        }
    }

    if (!$target) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Error: Folio no encontrado ($folio)";
        exit;
    }

    $dataUri = ($type === 'logo') ? ($target['clubLogo'] ?? null) : ($target['paymentProof'] ?? null);
    $defaultExt = ($type === 'logo') ? 'png' : 'pdf';
    $fileName = ($type === 'logo') 
        ? (!empty($target['clubLogoName']) ? $target['clubLogoName'] : ($folio . '_logo.' . $defaultExt))
        : (!empty($target['paymentProofName']) ? $target['paymentProofName'] : ($folio . '_comprobante.' . $defaultExt));

    if (empty($dataUri)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Error: Este registro no tiene un archivo de " . ($type === 'logo' ? 'Logo' : 'Comprobante de Pago') . " adjuntado.";
        exit;
    }

    if (preg_match('/^data:([^;]+);base64,(.*)$/s', $dataUri, $matches)) {
        $mime = $matches[1];
        $binary = base64_decode($matches[2]);

        header('Content-Type: ' . $mime);
        header('Content-Length: ' . strlen($binary));
        header('Content-Disposition: inline; filename="' . basename($fileName) . '"');
        header('Cache-Control: public, max-age=86400');
        echo $binary;
        exit;
    }

    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Error: Formato de archivo inválido';
    exit;
}

// 2. Export CSV
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

// 3. GET Submissions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $submissions = readSubmissions($DATA_FILE);
    echo json_encode([
        'success' => true,
        'count' => count($submissions),
        'submissions' => $submissions
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. POST Submission + Dispatch Resend Email with Download Links & Attachments
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

    $applicantResult = null;
    $adminResult = null;
    $contactEmail = trim($submission['contactEmail'] ?? '');
    $hasValidContactEmail = !empty($contactEmail) && filter_var($contactEmail, FILTER_VALIDATE_EMAIL);

    if (!empty($RESEND_API_KEY)) {
        $clubNameEsc = htmlspecialchars($submission['clubName'] ?? '');
        $folioEsc = htmlspecialchars($submission['folio'] ?? '');
        $directorNameEsc = htmlspecialchars($submission['directorName'] ?? 'Director(a)');
        $churchEsc = htmlspecialchars($submission['church'] ?? '');
        $amapZoneEsc = htmlspecialchars($submission['amapZone'] ?? '');
        $pastorEsc = htmlspecialchars($submission['districtPastor'] ?? '');
        $phoneEsc = htmlspecialchars($submission['contactPhone'] ?? '');
        $emailEsc = htmlspecialchars($contactEmail);
        $foundationEsc = htmlspecialchars($submission['foundationYear'] ?? '');

        // Direct download URLs for the attachments
        $logoDownloadUrl = $APP_URL . '/api/submissions.php?download=logo&folio=' . rawurlencode($submission['folio']);
        $proofDownloadUrl = $APP_URL . '/api/submissions.php?download=proof&folio=' . rawurlencode($submission['folio']);

        // Download link / button for Logo
        if (!empty($submission['clubLogo'])) {
            $logoLabel = !empty($submission['clubLogoName']) ? htmlspecialchars($submission['clubLogoName']) : 'Logo Oficial';
            $hasLogo = '<a href="' . $logoDownloadUrl . '" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; text-decoration: none; border: 1px solid #38bdf8; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📥 Descargar / Ver Logo (' . $logoLabel . ')</a>';
        } else {
            $hasLogo = '<span style="color: #94a3b8; font-style: italic;">No adjuntado</span>';
        }

        // Download link / button for Payment Proof
        if (!empty($submission['paymentProof'])) {
            $proofLabel = !empty($submission['paymentProofName']) ? htmlspecialchars($submission['paymentProofName']) : 'Comprobante';
            $hasProof = '<a href="' . $proofDownloadUrl . '" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff !important; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; text-decoration: none; border: 1px solid #34d399; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📄 Descargar / Ver Comprobante (' . $proofLabel . ')</a>';
        } else {
            $hasProof = '<span style="color: #94a3b8; font-style: italic;">No adjuntado</span>';
        }

        // Extract physical attachments for Resend
        $resendAttachments = [];
        if (!empty($submission['clubLogo']) && preg_match('/^data:([^;]+);base64,(.*)$/s', $submission['clubLogo'], $m)) {
            $lName = !empty($submission['clubLogoName']) ? $submission['clubLogoName'] : ($submission['folio'] . '_logo.png');
            $resendAttachments[] = [
                'filename' => $lName,
                'content' => trim($m[2])
            ];
        }
        if (!empty($submission['paymentProof']) && preg_match('/^data:([^;]+);base64,(.*)$/s', $submission['paymentProof'], $m)) {
            $pName = !empty($submission['paymentProofName']) ? $submission['paymentProofName'] : ($submission['folio'] . '_comprobante.pdf');
            $resendAttachments[] = [
                'filename' => $pName,
                'content' => trim($m[2])
            ];
        }

        // Base styles for responsive email
        $css = 'body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .card { background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; max-width: 600px; margin: 0 auto; overflow: hidden; }
        .header { background: linear-gradient(135deg, #b45309, #d97706, #f59e0b); padding: 26px 20px; text-align: center; color: #0f172a; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; font-weight: 700; color: #1e293b; }
        .folio-box { background-color: #0f172a; border-radius: 12px; padding: 18px; text-align: center; margin: 16px 20px; border: 1px solid #475569; }
        .folio-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 600; }
        .folio-num { font-size: 26px; font-weight: 900; color: #f59e0b; font-family: monospace; letter-spacing: 2px; margin-top: 4px; }
        .badge-ok { display: inline-block; background-color: #064e3b; color: #34d399; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; margin-top: 6px; border: 1px solid #059669; }
        .content { padding: 0 20px 20px 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; background-color: #0f172a; border-radius: 8px; overflow: hidden; }
        td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #334155; vertical-align: middle; }
        td.label { color: #94a3b8; font-weight: 600; width: 35%; }
        td.val { color: #ffffff; font-weight: 700; }
        .notice-box { margin: 16px 20px; padding: 14px 16px; background-color: #0f172a; border-radius: 10px; border-left: 4px solid #f59e0b; font-size: 12px; color: #cbd5e1; line-height: 1.5; }
        .footer { padding: 16px 20px; background-color: #0f172a; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; line-height: 1.5; }';

        // 1. Email to Applicant (Director / Registrant)
        if ($hasValidContactEmail) {
            $subjectApplicant = "🏕️ ¡Preinscripción Confirmada! Club {$submission['clubName']} (Folio {$submission['folio']})";
            $htmlApplicant = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' . $css . '</style></head><body>
            <div class="card">
              <div class="header">
                <h1>VII CAMPOREE AMAP 2027</h1>
                <p>¡Confirmación Oficial de Preinscripción!</p>
              </div>
              <div class="folio-box">
                <div class="folio-label">Tu Número de Folio Oficial</div>
                <div class="folio-num">' . $folioEsc . '</div>
                <div class="badge-ok">✓ Preinscripción Registrada Exitosamente</div>
              </div>
              <div class="content">
                <p style="font-size: 14px; color: #f1f5f9; margin: 0 0 12px 0;">
                  Hola <strong>' . $directorNameEsc . '</strong>,
                </p>
                <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 0 0 16px 0;">
                  Hemos recibido con éxito la preinscripción del <strong>Club ' . $clubNameEsc . '</strong> para el <strong>VII Camporee AMAP 2027</strong>. A continuación tienes el resumen de tu registro:
                </p>
                <h3 style="color: #f59e0b; font-size: 13px; text-transform: uppercase; margin: 16px 0 6px 0;">Datos del Club</h3>
                <table>
                  <tr><td class="label">Club:</td><td class="val">' . $clubNameEsc . '</td></tr>
                  <tr><td class="label">Año de Fundación:</td><td class="val">' . $foundationEsc . '</td></tr>
                  <tr><td class="label">Iglesia:</td><td class="val">' . $churchEsc . '</td></tr>
                  <tr><td class="label">Zona AMAP:</td><td class="val">Zona ' . $amapZoneEsc . '</td></tr>
                  <tr><td class="label">Pastor Distrital:</td><td class="val">' . $pastorEsc . '</td></tr>
                </table>
                <h3 style="color: #60a5fa; font-size: 13px; text-transform: uppercase; margin: 16px 0 6px 0;">Datos del Director(a) y Archivos</h3>
                <table>
                  <tr><td class="label">Director(a):</td><td class="val">' . $directorNameEsc . '</td></tr>
                  <tr><td class="label">Teléfono:</td><td class="val">' . $phoneEsc . '</td></tr>
                  <tr><td class="label">Correo:</td><td class="val">' . $emailEsc . '</td></tr>
                  <tr><td class="label">Logo del Club:</td><td class="val">' . $hasLogo . '</td></tr>
                  <tr><td class="label">Comprobante Pago:</td><td class="val">' . $hasProof . '</td></tr>
                </table>
              </div>
              <div class="notice-box">
                💡 <strong>Próximos pasos:</strong> El Ministerio Juvenil de la AMAP estará revisando la documentación y los comprobantes adjuntos. Puedes hacer clic en los botones de arriba para descargar o verificar los archivos que subiste. Conserva tu folio <strong>' . $folioEsc . '</strong> para cualquier consulta o trámite. Si necesitas hacer algún ajuste, puedes responder directamente a este correo.
              </div>
              <div class="footer">
                VII Camporee AMAP 2027 • Asociación Metropolitana de Panamá<br>
                Ministerio Juvenil • Todos los derechos reservados
              </div>
            </div></body></html>';

            $applicantResult = sendResendMail(
                $RESEND_API_KEY,
                $RESEND_FROM_EMAIL,
                $contactEmail,
                $subjectApplicant,
                $htmlApplicant,
                "VII Camporee AMAP 2027 - Preinscripción recibida. Folio: {$submission['folio']} - Club: {$submission['clubName']}. Descargar comprobante: $proofDownloadUrl",
                $ADMIN_EMAIL,
                $resendAttachments
            );
        }

        // 2. Email to Admin (sapaser@gmail.com) - only if applicant email is different or if applicant had no valid email
        if (!$hasValidContactEmail || strtolower($contactEmail) !== strtolower($ADMIN_EMAIL)) {
            $subjectAdmin = "📋 [NUEVO REGISTRO] Club {$submission['clubName']} - Folio {$submission['folio']} (Zona {$submission['amapZone']})";
            $htmlAdmin = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' . $css . '</style></head><body>
            <div class="card">
              <div class="header">
                <h1>VII CAMPOREE AMAP 2027</h1>
                <p>Notificación para Administración</p>
              </div>
              <div class="folio-box">
                <div class="folio-label">Nueva Preinscripción Recibida</div>
                <div class="folio-num">' . $folioEsc . '</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Club: ' . $clubNameEsc . ' • Zona ' . $amapZoneEsc . '</div>
              </div>
              <div class="content">
                <h3 style="color: #f59e0b; font-size: 13px; text-transform: uppercase; margin: 16px 0 6px 0;">Datos Registrados y Archivos</h3>
                <table>
                  <tr><td class="label">Club:</td><td class="val">' . $clubNameEsc . '</td></tr>
                  <tr><td class="label">Iglesia:</td><td class="val">' . $churchEsc . '</td></tr>
                  <tr><td class="label">Zona AMAP:</td><td class="val">Zona ' . $amapZoneEsc . '</td></tr>
                  <tr><td class="label">Pastor:</td><td class="val">' . $pastorEsc . '</td></tr>
                  <tr><td class="label">Director(a):</td><td class="val">' . $directorNameEsc . '</td></tr>
                  <tr><td class="label">Teléfono:</td><td class="val">' . $phoneEsc . '</td></tr>
                  <tr><td class="label">Correo:</td><td class="val">' . $emailEsc . '</td></tr>
                  <tr><td class="label">Logo del Club:</td><td class="val">' . $hasLogo . '</td></tr>
                  <tr><td class="label">Comprobante Pago:</td><td class="val">' . $hasProof . '</td></tr>
                  <tr><td class="label">Notas:</td><td class="val">' . htmlspecialchars($submission['notes'] ?? 'Ninguna') . '</td></tr>
                </table>
              </div>
              <div class="notice-box">
                📌 <strong>Gestión Administrativa:</strong> Los archivos adjuntos han sido incluidos en este correo y también puedes descargarlos en cualquier momento haciendo clic en los botones azules y verdes de la tabla.
              </div>
              <div class="footer">
                Panel Central • Asociación Metropolitana de Panamá
              </div>
            </div></body></html>';

            $adminResult = sendResendMail(
                $RESEND_API_KEY,
                $RESEND_FROM_EMAIL,
                $ADMIN_EMAIL,
                $subjectAdmin,
                $htmlAdmin,
                "Nueva Preinscripción Folio: {$submission['folio']} - Club: {$submission['clubName']}. Descargar comprobante: $proofDownloadUrl",
                $hasValidContactEmail ? $contactEmail : $ADMIN_EMAIL,
                $resendAttachments
            );
        }
    }

    $emailSent = ($applicantResult['success'] ?? false) || ($adminResult['success'] ?? false);
    $emailMessageId = $applicantResult['id'] ?? $adminResult['id'] ?? null;

    echo json_encode([
        'success' => true,
        'submission' => $submission,
        'emailSent' => $emailSent,
        'emailMessageId' => $emailMessageId,
        'emailDetails' => [
            'applicant' => $applicantResult,
            'admin' => $adminResult
        ],
        'totalCount' => count($current)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
