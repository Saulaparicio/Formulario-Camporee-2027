import { SubmissionRecord } from '../types/form';

/**
 * Loads all central registrations from the server
 */
export async function fetchServerSubmissions(): Promise<SubmissionRecord[]> {
  try {
    const res = await fetch('/api/submissions');
    if (!res.ok) return [];
    const data = await res.json();
    return data.submissions || [];
  } catch (err) {
    console.warn('No se pudieron obtener las preinscripciones del servidor:', err);
    return [];
  }
}

/**
 * Saves a new registration to the server + dispatches Resend email
 */
export async function submitRegistration(
  submission: SubmissionRecord
): Promise<{ success: boolean; emailSent?: boolean; messageId?: string }> {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Error al guardar la preinscripción en el servidor');
    }

    return {
      success: true,
      emailSent: data.emailSent,
      messageId: data.emailMessageId,
    };
  } catch (err: any) {
    console.error('Error en submitRegistration:', err);
    throw err;
  }
}

/**
 * URL to download the central CSV file
 */
export const SUBMISSIONS_CSV_URL = '/api/submissions/export-csv';
