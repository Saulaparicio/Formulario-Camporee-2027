import { SubmissionRecord } from '../types/form';

export const PRIMARY_TEST_EMAIL = 'sapaser@gmail.com';
export const OFFICIAL_NOTIFICATION_EMAIL = 'departamentoja@amapanama.org';

/**
 * Encodes a string for MIME header per RFC 2047 (B-encoding)
 */
function encodeRFC2047(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

/**
 * Converts a UTF-8 string to base64, split into chunks of at most 76 characters per RFC 2045
 */
function encodeBodyBase64Chunked(content: string, chunkSize = 76): string {
  const bytes = new TextEncoder().encode(content);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += chunkSize) {
    chunks.push(base64.slice(i, i + chunkSize));
  }
  return chunks.join('\r\n');
}

/**
 * Converts RFC 2822 string into base64url format for Gmail API messages.send
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Builds a strict RFC 2822 MIME message with CRLF separation and proper headers
 */
export function buildRfc2822Message({
  to,
  from,
  cc,
  replyTo,
  subject,
  htmlBody,
}: {
  to: string;
  from?: string;
  cc?: string;
  replyTo?: string;
  subject: string;
  htmlBody: string;
}): string {
  const headers: string[] = [
    `To: ${to}`,
  ];

  if (from) {
    headers.push(`From: ${from}`);
  }
  if (cc && cc.trim()) {
    headers.push(`Cc: ${cc.trim()}`);
  }
  if (replyTo && replyTo.trim()) {
    headers.push(`Reply-To: ${replyTo.trim()}`);
  }

  headers.push(`Subject: ${encodeRFC2047(subject)}`);
  headers.push(`Date: ${new Date().toUTCString()}`);
  headers.push('MIME-Version: 1.0');
  headers.push('Content-Type: text/html; charset=UTF-8');
  headers.push('Content-Transfer-Encoding: base64');

  const chunkedBody = encodeBodyBase64Chunked(htmlBody);

  // RFC 2822: Headers and Body MUST be separated by an empty line (\r\n\r\n)
  return headers.join('\r\n') + '\r\n\r\n' + chunkedBody;
}

export interface SendEmailOptions {
  primaryTo?: string;
  ccOfficial?: boolean;
  isTestMode?: boolean;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  threadId?: string;
  recipient: string;
  timestamp: string;
  labelIds?: string[];
}

/**
 * Sends notification email when a club registration is submitted
 */
export async function sendCamporeeNotificationEmail(
  accessToken: string,
  submission: SubmissionRecord,
  userEmail?: string,
  options?: SendEmailOptions
): Promise<SendEmailResult> {
  // Destination: sapaser@gmail.com by default
  const to = options?.primaryTo || PRIMARY_TEST_EMAIL;
  
  // Optional CC list (official inbox and contact email if different)
  const ccList: string[] = [];
  if (options?.ccOfficial && to !== OFFICIAL_NOTIFICATION_EMAIL) {
    ccList.push(OFFICIAL_NOTIFICATION_EMAIL);
  }
  if (submission.contactEmail && submission.contactEmail !== to) {
    ccList.push(submission.contactEmail);
  }
  const ccHeader = ccList.filter(Boolean).join(', ');

  const subjectPrefix = options?.isTestMode !== false ? '[PRUEBA]' : '';
  const subject = `${subjectPrefix} 🏕️ Preinscripción VII Camporee AMAP 2027: Club ${submission.clubName} (${submission.folio})`.trim();

  const senderFrom = userEmail ? `"VII Camporee AMAP 2027" <${userEmail}>` : undefined;

  const htmlBody = `<!DOCTYPE html>
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
</html>`;

  const mimeMessage = buildRfc2822Message({
    to,
    from: senderFrom,
    cc: ccHeader || undefined,
    replyTo: userEmail,
    subject,
    htmlBody,
  });

  const raw = toBase64Url(mimeMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    let errorMsg = `Error HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error?.message) {
        errorMsg = errJson.error.message;
      }
    } catch {
      // ignore
    }
    if (res.status === 403) {
      throw new Error(`Permiso insuficiente en Gmail: ${errorMsg}. Por favor vuelve a conectar tu cuenta y asegúrate de aceptar el permiso para enviar correos.`);
    } else if (res.status === 401) {
      throw new Error('La sesión de Google ha expirado. Haz clic en "Conectar Google" para renovarla.');
    }
    throw new Error(`Error al enviar el correo vía Gmail API: ${errorMsg}`);
  }

  const data = await res.json();
  const now = new Date();
  return {
    success: true,
    messageId: data.id,
    threadId: data.threadId,
    recipient: to,
    timestamp: now.toISOString(),
    labelIds: data.labelIds,
  };
}

/**
 * Dedicated test function to send an instant verification email to sapaser@gmail.com
 */
export async function sendDirectTestEmail(
  accessToken: string,
  targetEmail: string = PRIMARY_TEST_EMAIL,
  senderUser?: { email?: string | null; displayName?: string | null }
): Promise<SendEmailResult> {
  const testFolio = `AMAP-2027-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const formattedDate = now.toLocaleString('es-PA', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const subject = `🏕️ [PRUEBA DE VERIFICACIÓN] VII Camporee AMAP 2027: ${targetEmail} (${testFolio})`;
  const senderFrom = senderUser?.email
    ? `"${senderUser.displayName || 'VII Camporee AMAP 2027'}" <${senderUser.email}>`
    : undefined;

  const htmlBody = `<!DOCTYPE html>
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
</html>`;

  const mimeMessage = buildRfc2822Message({
    to: targetEmail,
    from: senderFrom,
    replyTo: senderUser?.email || undefined,
    subject,
    htmlBody,
  });

  const raw = toBase64Url(mimeMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    let errorDetail = `Error HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {
      // ignore
    }
    if (res.status === 403) {
      throw new Error(`Permiso insuficiente en Gmail (${errorDetail}). Por favor haz clic en "Forzar Reautorización" para otorgar el permiso de envío de correos.`);
    } else if (res.status === 401) {
      throw new Error('La sesión de Google ha expirado. Por favor vuelve a iniciar sesión con Google.');
    }
    throw new Error(`Error al enviar la prueba de correo vía Gmail API: ${errorDetail}`);
  }

  const data = await res.json();
  return {
    success: true,
    messageId: data.id,
    threadId: data.threadId,
    recipient: targetEmail,
    timestamp: now.toISOString(),
    labelIds: data.labelIds,
  };
}
