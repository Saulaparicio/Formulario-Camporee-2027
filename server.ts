import express from 'express';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Health and Resend status endpoint
app.get('/api/resend-status', (_req, res) => {
  const apiKey = process.env.RESEND_API_KEY;
  const configured = !!apiKey && apiKey.startsWith('re_');
  res.json({
    configured,
    from: 'onboarding@resend.dev',
    defaultRecipient: 'sapaser@gmail.com',
  });
});

// Automated email dispatch route via Resend
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
