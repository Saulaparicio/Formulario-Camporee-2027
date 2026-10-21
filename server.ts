import express from 'express';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Persistence setup: store submissions centrally in data/submissions.json
const DATA_DIR = path.resolve(__dirname, 'data');
const SUBMISSIONS_FILE = path.resolve(DATA_DIR, 'submissions.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SUBMISSIONS_FILE)) {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function getStoredSubmissions(): any[] {
  try {
    if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
    const content = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
    return JSON.parse(content) || [];
  } catch (err) {
    console.error('Error al leer submissions.json:', err);
    return [];
  }
}

function saveStoredSubmissions(list: any[]): void {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error al escribir submissions.json:', err);
  }
}

// Resend status endpoint
app.get('/api/resend-status', (_req, res) => {
  const apiKey = process.env.RESEND_API_KEY;
  const configured = !!apiKey && apiKey.startsWith('re_');
  res.json({
    configured,
    from: 'onboarding@resend.dev',
    defaultRecipient: 'sapaser@gmail.com',
  });
});

// Central endpoint to list all registrations
app.get('/api/submissions', (_req, res) => {
  const submissions = getStoredSubmissions();
  res.json({
    success: true,
    count: submissions.length,
    submissions,
  });
});

// Central endpoint to save a new registration + send Resend email
app.post('/api/submissions', async (req, res) => {
  try {
    const submission = req.body;
    if (!submission || !submission.folio || !submission.clubName) {
      return res.status(400).json({
        success: false,
        message: 'Datos de preinscripción incompletos (folio y clubName requeridos).',
      });
    }

    // 1. Central Persistence
    const currentList = getStoredSubmissions();
    const existingIndex = currentList.findIndex((s) => s.folio === submission.folio);
    if (existingIndex >= 0) {
      currentList[existingIndex] = { ...currentList[existingIndex], ...submission };
    } else {
      currentList.unshift(submission);
    }
    saveStoredSubmissions(currentList);
    console.log(`[Storage] Preinscripción guardada centralmente: ${submission.folio} (${submission.clubName})`);

    // 2. Dispatch Email via Resend
    let emailSent = false;
    let emailMessageId: string | undefined;
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        const recipient = 'sapaser@gmail.com';

        const subject = `🏕️ [PREINSCRIPCIÓN] VII Camporee AMAP 2027: Club ${submission.clubName} (${submission.folio})`;

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
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
      <div class="badge">✉️ Registro Central Confirmado</div>
    </div>
    <div class="content">
      <div class="folio-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">Folio Asignado</div>
        <div class="folio-num">${submission.folio}</div>
        <div style="font-size: 11px; color: #10b981; margin-top: 4px;">✓ Preinscripción recibida en el sistema central</div>
      </div>

      <h3 style="color: #f59e0b; font-size: 14px; text-transform: uppercase; margin-top: 0;">Sección A. Datos del Club</h3>
      <table>
        <tr><td class="label">Club:</td><td class="val">${submission.clubName}</td></tr>
        <tr><td class="label">Año de Fundación:</td><td class="val">${submission.foundationYear || 'N/A'}</td></tr>
        <tr><td class="label">Iglesia:</td><td class="val">${submission.church}</td></tr>
        <tr><td class="label">Zona AMAP:</td><td class="val">Zona ${submission.amapZone}</td></tr>
        <tr><td class="label">Pastor Distrital:</td><td class="val">${submission.districtPastor}</td></tr>
      </table>

      <h3 style="color: #60a5fa; font-size: 14px; text-transform: uppercase; margin-top: 20px;">Sección B. Datos del Director(a)</h3>
      <table>
        <tr><td class="label">Director(a):</td><td class="val">${submission.directorName}</td></tr>
        <tr><td class="label">Teléfono / WhatsApp:</td><td class="val">${submission.contactPhone}</td></tr>
        <tr><td class="label">Correo Electrónico:</td><td class="val">${submission.contactEmail}</td></tr>
      </table>

      <h3 style="color: #34d399; font-size: 14px; text-transform: uppercase; margin-top: 20px;">Sección C. Estado</h3>
      <table>
        <tr><td class="label">Fecha y Hora:</td><td class="val">${new Date(submission.createdAt || Date.now()).toLocaleString('es-PA')}</td></tr>
        <tr><td class="label">Logo Adjunto:</td><td class="val">${submission.clubLogo ? 'Sí (' + (submission.clubLogoName || 'archivo') + ')' : 'No'}</td></tr>
        <tr><td class="label">Comprobante Pago:</td><td class="val">${submission.paymentProof ? 'Sí (' + (submission.paymentProofName || 'archivo') + ')' : 'No'}</td></tr>
        ${submission.notes ? `<tr><td class="label">Notas:</td><td class="val">${submission.notes}</td></tr>` : ''}
      </table>
    </div>
    <div class="footer">
      VII Camporee AMAP 2027 • Asociación Metropolitana de Panamá • Ministerio Juvenil
    </div>
  </div>
</body>
</html>`;

        const { data, error } = await resend.emails.send({
          from: 'VII Camporee AMAP 2027 <onboarding@resend.dev>',
          to: [recipient],
          subject,
          html,
          text: `VII Camporee AMAP 2027 - Preinscripción Folio: ${submission.folio} - Club: ${submission.clubName}`,
        });

        if (!error && data?.id) {
          emailSent = true;
          emailMessageId = data.id;
          console.log(`[Resend] Correo enviado exitosamente a ${recipient}. ID: ${data.id}`);
        } else if (error) {
          console.error('[Resend] Error al enviar email:', error);
        }
      } catch (emailErr: any) {
        console.error('[Resend] Excepción al despachar correo:', emailErr.message);
      }
    }

    return res.json({
      success: true,
      submission,
      emailSent,
      emailMessageId,
      totalCount: currentList.length,
    });
  } catch (err: any) {
    console.error('Error en /api/submissions:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// CSV Export of all central submissions
app.get('/api/submissions/export-csv', (_req, res) => {
  const submissions = getStoredSubmissions();

  const headers = [
    'Folio',
    'Fecha Registro',
    'Club',
    'Año Fundación',
    'Iglesia',
    'Zona AMAP',
    'Pastor Distrital',
    'Director(a)',
    'Teléfono',
    'Correo',
    'Tiene Logo',
    'Tiene Comprobante',
    'Notas',
    'Estado',
  ];

  const rows = submissions.map((s) => [
    `"${s.folio || ''}"`,
    `"${s.createdAt ? new Date(s.createdAt).toLocaleString('es-PA') : ''}"`,
    `"${(s.clubName || '').replace(/"/g, '""')}"`,
    `"${s.foundationYear || ''}"`,
    `"${(s.church || '').replace(/"/g, '""')}"`,
    `"Zona ${s.amapZone || ''}"`,
    `"${(s.districtPastor || '').replace(/"/g, '""')}"`,
    `"${(s.directorName || '').replace(/"/g, '""')}"`,
    `"${(s.contactPhone || '').replace(/"/g, '""')}"`,
    `"${(s.contactEmail || '').replace(/"/g, '""')}"`,
    `"${s.clubLogo ? 'Sí' : 'No'}"`,
    `"${s.paymentProof ? 'Sí' : 'No'}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
    `"${s.status || 'completado'}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="preinscripciones_camporee_amap_2027.csv"');
  res.send(csvContent);
});

// Direct Resend route for backward compatibility
app.post('/api/send-email', async (req, res) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'RESEND_API_KEY_MISSING',
        message: 'No se ha configurado la variable RESEND_API_KEY en el servidor.',
      });
    }

    const { to, subject, html, text, clubName } = req.body;
    const recipient = to || 'sapaser@gmail.com';

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'VII Camporee AMAP 2027 <onboarding@resend.dev>',
      to: [recipient],
      subject: subject || `[PREINSCRIPCIÓN] VII Camporee AMAP 2027 - ${clubName || 'Club'}`,
      html: html || `<p>Preinscripción recibida para ${clubName || 'Club'}.</p>`,
      text: text || `Preinscripción recibida para ${clubName || 'Club'}.`,
    });

    if (error) {
      console.error('Error desde Resend:', error);
      return res.status(400).json({ success: false, error });
    }

    console.log(`[Resend] Correo enviado con éxito a ${recipient}. ID: ${data?.id}`);
    return res.json({ success: true, messageId: data?.id, recipient });
  } catch (err: any) {
    console.error('Error al procesar envío en /api/send-email:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Serve frontend with Vite in dev, or dist static in production
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`[Server] Corriendo en http://0.0.0.0:${port}`);
});
