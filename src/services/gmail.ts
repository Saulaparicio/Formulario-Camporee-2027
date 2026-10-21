import { SubmissionRecord } from '../types/form';

const OFFICIAL_NOTIFICATION_EMAIL = 'departamentoja@amapanama.org';

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

export async function sendCamporeeNotificationEmail(
  accessToken: string,
  submission: SubmissionRecord,
  userEmail?: string
): Promise<{ success: boolean; messageId?: string }> {
  const to = OFFICIAL_NOTIFICATION_EMAIL;
  const cc = submission.contactEmail ? submission.contactEmail : '';
  const subject = `🏕️ Preinscripción VII Camporee AMAP 2027: Club ${submission.clubName} (${submission.folio})`;

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
    </div>
    <div class="content">
      <div class="folio-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">Folio Registrado</div>
        <div class="folio-num">${submission.folio}</div>
        <div style="font-size: 11px; color: #10b981; margin-top: 4px;">✓ Preinscripción recibida en el sistema</div>
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
      Asociación Metropolitana de Panamá • Ministerio Juvenil
    </div>
  </div>
</body>
</html>
  `;

  const emailLines = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : '',
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
  return { success: true, messageId: data.id };
}
