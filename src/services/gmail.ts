import { SubmissionRecord } from '../types/form';

export const PRIMARY_TEST_EMAIL = 'sapaser@gmail.com';
export const OFFICIAL_NOTIFICATION_EMAIL = 'departamentoja@amapanama.org';

function utf8ToBase64Url(str: string): string {
  // Use TextEncoder to handle all UTF-8 characters safely
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface SendEmailOptions {
  primaryTo?: string;
  ccOfficial?: boolean;
  isTestMode?: boolean;
}

export async function sendCamporeeNotificationEmail(
  accessToken: string,
  submission: SubmissionRecord,
  userEmail?: string,
  options?: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; recipient: string }> {
  // User explicitly asked for a test to arrive at sapaser@gmail.com
  const to = options?.primaryTo || PRIMARY_TEST_EMAIL;
  
  // CC list includes official email and director's contact email if provided
  const ccList: string[] = [];
  if (options?.ccOfficial !== false && to !== OFFICIAL_NOTIFICATION_EMAIL) {
    ccList.push(OFFICIAL_NOTIFICATION_EMAIL);
  }
  if (submission.contactEmail && submission.contactEmail !== to) {
    ccList.push(submission.contactEmail);
  }
  const ccHeader = ccList.filter(Boolean).join(', ');

  const subjectPrefix = options?.isTestMode !== false ? '[PRUEBA]' : '';
  const subject = `${subjectPrefix} 🏕️ Preinscripción VII Camporee AMAP 2027: Club ${submission.clubName} (${submission.folio})`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .card { background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; max-width: 600px; margin: 0 auto; overflow: hidden; }
    .header { background: linear-gradient(135deg, #b45309, #d97706, #f59e0b); padding: 24px; text-align: center; color: #0f172a; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
    .header p { margin: 6px 0 0 0; font-size: 13px; font-weight: 600; }
    .test-pill { display: inline-block; background-color: #0f172a; color: #fbbf24; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; margin-top: 8px; border: 1px solid #f59e0b; }
    .content { padding: 24px; }
    .folio-box { background-color: #0f172a; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px; border: 1px solid #475569; }
    .folio-num { font-size: 24px; font-weight: 900; color: #f59e0b; font-family: monospace; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #334155; }
    td.label { color: #94a3b8; font-weight: 600; width: 40%; }
    td.val { color: #ffffff; font-weight: 700; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; background-color: #f59e0b; color: #0f172a; }
    .footer { padding: 16px 24px; background-color: #0f172a; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>VII CAMPOREE AMAP 2027</h1>
      <p>Copia Oficial de Preinscripción de Club</p>
      <div class="test-pill">✉️ Notificación enviada a: ${to}</div>
    </div>
    <div class="content">
      <div class="folio-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">Folio Registrado</div>
        <div class="folio-num">${submission.folio}</div>
        <div style="font-size: 11px; color: #10b981; margin-top: 4px;">✓ Preinscripción recibida en el sistema oficial</div>
      </div>

      <h3 style="color: #f59e0b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Sección A. Datos del Club</h3>
      <table>
        <tr>
          <td class="label">Club:</td>
          <td class="val">${submission.clubName}</td>
        </tr>
        <tr>
          <td class="label">Año de Fundación:</td>
          <td class="val">${submission.foundationYear}</td>
        </tr>
        <tr>
          <td class="label">Iglesia / Congregación:</td>
          <td class="val">${submission.church}</td>
        </tr>
        <tr>
          <td class="label">Zona AMAP:</td>
          <td class="val"><span class="badge">Zona ${submission.amapZone}</span></td>
        </tr>
        <tr>
          <td class="label">Pastor Distrital:</td>
          <td class="val">${submission.districtPastor}</td>
        </tr>
      </table>

      <h3 style="color: #60a5fa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px;">Sección B. Datos del Director(a)</h3>
      <table>
        <tr>
          <td class="label">Director(a):</td>
          <td class="val">${submission.directorName}</td>
        </tr>
        <tr>
          <td class="label">Teléfono / WhatsApp:</td>
          <td class="val">${submission.contactPhone}</td>
        </tr>
        <tr>
          <td class="label">Correo Electrónico:</td>
          <td class="val">${submission.contactEmail}</td>
        </tr>
      </table>

      <h3 style="color: #34d399; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px;">Sección D. Documentación</h3>
      <table>
        <tr>
          <td class="label">Logo del Club:</td>
          <td class="val">${submission.clubLogo ? 'Adjunto en el registro' : 'No cargado'}</td>
        </tr>
        <tr>
          <td class="label">Comprobante de Pago:</td>
          <td class="val">${submission.paymentProof ? 'Adjunto en el registro' : 'Pendiente'}</td>
        </tr>
        <tr>
          <td class="label">Fecha y Hora:</td>
          <td class="val">${new Date(submission.createdAt).toLocaleString('es-ES')}</td>
        </tr>
      </table>
    </div>
    <div class="footer">
      Este es un correo automático del sistema de preinscripciones del VII Camporee AMAP 2027.<br>
      Asociación Metropolitana de Panamá • Ministerio Juvenil<br>
      <span style="color: #94a3b8; font-size: 10px;">Prueba de entrega verificada para: ${to}</span>
    </div>
  </div>
</body>
</html>
  `;

  const emailLines = [
    `To: ${to}`,
    ccHeader ? `Cc: ${ccHeader}` : '',
    userEmail ? `Reply-To: ${userEmail}` : '',
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(htmlBody))),
  ].filter(Boolean);

  const raw = utf8ToBase64Url(emailLines.join('\r\n'));

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Error al enviar el correo vía Gmail API');
  }

  const data = await res.json();
  return { success: true, messageId: data.id, recipient: to };
}

/**
 * Dedicated test function to send an instant verification email to sapaser@gmail.com
 */
export async function sendDirectTestEmail(
  accessToken: string,
  targetEmail: string = PRIMARY_TEST_EMAIL,
  senderUser?: { email?: string | null; displayName?: string | null }
): Promise<{ success: boolean; messageId: string; recipient: string; timestamp: string }> {
  const testFolio = `AMAP-2027-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const formattedDate = now.toLocaleString('es-PA', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const subject = `🏕️ [PRUEBA DE VERIFICACIÓN] VII Camporee AMAP 2027: sapaser@gmail.com (${testFolio})`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .card { background-color: #1e293b; border-radius: 16px; border: 2px solid #f59e0b; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #b45309, #d97706, #f59e0b); padding: 28px 24px; text-align: center; color: #0f172a; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 14px; font-weight: 700; opacity: 0.95; }
    .test-badge { display: inline-block; background-color: #0f172a; color: #10b981; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; margin-top: 12px; border: 1px solid #10b981; }
    .content { padding: 24px; }
    .alert-box { background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; }
    .alert-title { font-size: 15px; font-weight: 800; color: #34d399; margin-bottom: 4px; }
    .alert-desc { font-size: 13px; color: #cbd5e1; line-height: 1.5; }
    .folio-box { background-color: #0f172a; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px; border: 1px solid #475569; }
    .folio-num { font-size: 26px; font-weight: 900; color: #f59e0b; font-family: monospace; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #334155; }
    td.label { color: #94a3b8; font-weight: 600; width: 40%; }
    td.val { color: #ffffff; font-weight: 700; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; background-color: #f59e0b; color: #0f172a; }
    .footer { padding: 18px 24px; background-color: #0f172a; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>VII CAMPOREE AMAP 2027</h1>
      <p>«Preparados Para Su Regreso»</p>
      <div class="test-badge">✓ PRUEBA DE CONEXIÓN GMAIL EXITOSA</div>
    </div>
    <div class="content">
      <div class="alert-box">
        <div class="alert-title">¡Prueba de Entrega Confirmada!</div>
        <div class="alert-desc">
          Este mensaje certifica que la integración con <strong>Gmail API</strong> está configurada y entregando correos correctamente a la dirección solicitada: <strong style="color: #fbbf24;">${targetEmail}</strong>.
        </div>
      </div>

      <div class="folio-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">Folio de Demostración</div>
        <div class="folio-num">${testFolio}</div>
        <div style="font-size: 11px; color: #38bdf8; margin-top: 4px;">Asociación Metropolitana de Panamá</div>
      </div>

      <h3 style="color: #f59e0b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Detalles de la Verificación Técnica</h3>
      <table>
        <tr>
          <td class="label">Destinatario Verificado:</td>
          <td class="val"><span style="color: #fbbf24;">${targetEmail}</span></td>
        </tr>
        <tr>
          <td class="label">Remitente Autorizado:</td>
          <td class="val">${senderUser?.email || 'Cuenta de Google Conectada'}</td>
        </tr>
        <tr>
          <td class="label">Fecha y Hora de Prueba:</td>
          <td class="val">${formattedDate}</td>
        </tr>
        <tr>
          <td class="label">Estado de la Conexión:</td>
          <td class="val"><span class="badge" style="background-color: #10b981; color: white;">ACTIVO / OPERATIVO</span></td>
        </tr>
        <tr>
          <td class="label">Bandeja Oficial AMAP:</td>
          <td class="val">${OFFICIAL_NOTIFICATION_EMAIL}</td>
        </tr>
      </table>
    </div>
    <div class="footer">
      Asociación Metropolitana de Panamá • Ministerio Juvenil<br>
      Sistema de Preinscripción Oficial VII Camporee 2027<br>
      Generado automáticamente a petición del administrador para validación de bandeja en <strong>${targetEmail}</strong>.
    </div>
  </div>
</body>
</html>
  `;

  const emailLines = [
    `To: ${targetEmail}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(htmlBody))),
  ];

  const raw = utf8ToBase64Url(emailLines.join('\r\n'));

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Error al enviar la prueba de correo vía Gmail API');
  }

  const data = await res.json();
  return {
    success: true,
    messageId: data.id,
    recipient: targetEmail,
    timestamp: now.toISOString(),
  };
}

