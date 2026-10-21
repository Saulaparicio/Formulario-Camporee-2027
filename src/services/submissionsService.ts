import { SubmissionRecord } from '../types/form';

/**
 * Loads all central registrations from the server (Node or PHP fallback)
 */
export async function fetchServerSubmissions(): Promise<SubmissionRecord[]> {
  const endpoints = ['/api/submissions', '/api/submissions.php'];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep);
      if (res.ok) {
        const data = await res.json();
        if (data.submissions) return data.submissions;
      }
    } catch {
      // try next
    }
  }
  return [];
}

/**
 * Saves a new registration to the server + dispatches Resend email
 */
export async function submitRegistration(
  submission: SubmissionRecord
): Promise<{ success: boolean; emailSent?: boolean; messageId?: string }> {
  const endpoints = ['/api/submissions', '/api/submissions.php'];
  let lastError: any = null;

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });

      if (!res.ok) {
        // If 404, try next endpoint
        continue;
      }

      const data = await res.json();
      if (data && data.success) {
        return {
          success: true,
          emailSent: data.emailSent,
          messageId: data.emailMessageId,
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo conectar con el servicio de preinscripción.');
}

/**
 * URL to download the central CSV file
 */
export const SUBMISSIONS_CSV_URL = '/api/submissions/export-csv';
