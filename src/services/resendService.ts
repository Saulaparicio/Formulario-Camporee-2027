import { SubmissionRecord } from '../types/form';
import { PRIMARY_TEST_EMAIL, OFFICIAL_NOTIFICATION_EMAIL } from './gmail';

export interface ResendStatus {
  configured: boolean;
  from?: string;
  defaultRecipient?: string;
}

/**
 * Checks if RESEND_API_KEY is configured on the backend
 */
export async function checkResendStatus(): Promise<ResendStatus> {
  try {
    const res = await fetch('/api/resend-status');
    if (!res.ok) {
      return { configured: false };
    }
    return await res.json();
  } catch (e) {
    return { configured: false };
  }
}

/**
 * Sends pre-registration notification using the backend Resend proxy
 */
export async function sendSubmissionViaResend(
  submission: SubmissionRecord,
  targetEmail: string = PRIMARY_TEST_EMAIL
): Promise<{ success: boolean; messageId?: string; recipient: string; error?: string }> {
  const subject = `🏕️ [PREINSCRIPCIÓN RECIBIDA] VII Camporee AMAP 2027: Club ${submission.clubName} (${submission.folio})`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .card { background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; max-width: 600px; margin: 0 auto; overflow: hidden; }
    .header { background: linear-gradient(135deg, #b45309, #d97706, #f59e0b); padding: 24px; text-align: center; color: #0f172a; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
    .header p { margin: 6px 0 0 0; font-size: 13px; font-weight: 600; }
    .badge { display: inline-block; background-color: #0f172a; color: #fbbf24; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; margin-top: 8px; border: 1px solid #f59e0b; }
    .content { padding: 24px; }
    .folio-box { background-color: #0f172a; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px; border: 1px solid #475569; }
    .folio-num { font-size: 24px; font-weight: 900; color: #f59e0b; font-family: monospace; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #334155; }
    td.label { color: #94a3b8; font-weight: 600; width: 40%; }
    td.val { color: #ffffff; font-weight: 700; }
    .footer { padding: 16px 24px; background-color: #0f172a; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>VII CAMPOREE AMAP 2027</h1>
      <p>Notificación Oficial de Preinscripción</p>
      <div class="badge">✉️ Enviado automáticamente vía Resend</div>
    </div>
    <div class="content">
      <div class="folio-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">Folio Asignado</div>
        <div class="folio-num">${submission.folio}</div>
        <div style="font-size: 11px; color: #10b981; margin-top: 4px;">✓ Registro completado exitosamente</div>
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
          <td class="val">Zona ${submission.amapZone}</td>
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

      <h3 style="color: #34d399; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px;">Sección C. Fecha y Estado</h3>
      <table>
        <tr>
          <td class="label">Fecha y Hora:</td>
          <td class="val">${new Date(submission.createdAt).toLocaleString('es-PA')}</td>
        </tr>
        <tr>
          <td class="label">Destinatario Oficial:</td>
          <td class="val">${targetEmail}</td>
        </tr>
      </table>
    </div>
    <div class="footer">
      Este correo fue despachado automáticamente sin requerir inicio de sesión en Google.<br>
      Asociación Metropolitana de Panamá • Ministerio Juvenil
    </div>
  </div>
</body>
</html>`;

  const text = `VII CAMPOREE AMAP 2027 - PREINSCRIPCIÓN DE CLUB
Folio: ${submission.folio}
Club: ${submission.clubName}
Zona: Zona ${submission.amapZone}
Director: ${submission.directorName}
Teléfono: ${submission.contactPhone}
Correo del Director: ${submission.contactEmail}
Fecha: ${new Date(submission.createdAt).toLocaleString('es-PA')}
Destino: ${targetEmail}`;

  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: targetEmail,
      subject,
      html,
      text,
      clubName: submission.clubName,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error?.message || 'Error al enviar por Resend');
  }

  return {
    success: true,
    messageId: data.messageId,
    recipient: targetEmail,
  };
}

/**
 * Sends a direct test email via Resend to verify delivery
 */
export async function sendDirectResendTest(
  targetEmail: string = PRIMARY_TEST_EMAIL
): Promise<{ success: boolean; messageId?: string; recipient: string }> {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: targetEmail,
      subject: `[PRUEBA RESEND] Verificación de Entrega VII Camporee AMAP 2027`,
      html: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #0f172a; color: #fff; padding: 24px;">
  <div style="max-width: 500px; margin: 0 auto; background: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155;">
    <h2 style="color: #f59e0b; margin-top: 0;">🏕️ Prueba de Entrega Resend Exitosa</h2>
    <p>Este correo confirma que el servicio <strong>Resend</strong> está funcionando y entregando correctamente a tu bandeja:</p>
    <p style="background: #0f172a; padding: 12px; border-radius: 8px; font-family: monospace; color: #34d399;">
      Destinatario: ${targetEmail}
    </p>
    <p style="font-size: 12px; color: #94a3b8;">
      Fecha y hora: ${new Date().toLocaleString('es-PA')}
    </p>
    <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
    <p style="font-size: 11px; color: #64748b; margin: 0;">
      VII Camporee AMAP 2027 • Asociación Metropolitana de Panamá
    </p>
  </div>
</body>
</html>`,
      text: `Prueba de Entrega Resend Exitosa para ${targetEmail} a las ${new Date().toLocaleString('es-PA')}`,
      clubName: 'Prueba Resend',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error?.message || 'Error al enviar prueba vía Resend');
  }

  return {
    success: true,
    messageId: data.messageId,
    recipient: targetEmail,
  };
}
