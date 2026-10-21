import { SubmissionRecord } from '../types/form';

const SPREADSHEET_TITLE = 'Preinscripciones VII Camporee AMAP 2027';
const SPREADSHEET_STORAGE_KEY = 'amap_camporee_sheet_id_2027';

const HEADERS = [
  'Folio',
  'Fecha de Registro',
  'Nombre Oficial del Club',
  'Año de Fundación',
  'Iglesia / Congregación',
  'Zona AMAP',
  'Pastor Distrital',
  'Director o Directora',
  'Teléfono de Contacto',
  'Correo Electrónico',
  'Tiene Logo Adjunto',
  'Tiene Comprobante Pago',
  'Estado',
];

export interface SheetSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  isNew: boolean;
}

// Search if the spreadsheet already exists in Google Drive
export async function findExistingSpreadsheet(accessToken: string): Promise<string | null> {
  const cachedId = localStorage.getItem(SPREADSHEET_STORAGE_KEY);
  if (cachedId) {
    // Verify it's accessible
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cachedId}?fields=spreadsheetId,properties.title`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        return cachedId;
      }
    } catch {
      // not accessible, fall through to search
    }
  }

  try {
    const q = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const foundId = data.files[0].id;
        localStorage.setItem(SPREADSHEET_STORAGE_KEY, foundId);
        return foundId;
      }
    }
  } catch (err) {
    console.warn('Error searching for spreadsheet in Drive:', err);
  }

  return null;
}

// Create new official Google Sheet with headers & theme formatting
export async function createCamporeeSpreadsheet(accessToken: string): Promise<SheetSyncResult> {
  const existingId = await findExistingSpreadsheet(accessToken);
  if (existingId) {
    return {
      spreadsheetId: existingId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${existingId}/edit`,
      isNew: false,
    };
  }

  // Create new spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: 'Preinscripciones',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error al crear la hoja de cálculo en Google Sheets');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  localStorage.setItem(SPREADSHEET_STORAGE_KEY, spreadsheetId);

  // Add header row
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Preinscripciones!A1:M1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [HEADERS],
    }),
  });

  // Apply header styling (Amber / Gold theme)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetData.sheets[0].properties.sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.96, green: 0.62, blue: 0.04 }, // amber-500
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 0.06, green: 0.09, blue: 0.16 }, // slate-950
                    fontSize: 11,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
        ],
      }),
    });
  } catch {
    // Styling is non-blocking
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    isNew: true,
  };
}

// Append a single submission row
export async function appendSubmissionToSheet(
  accessToken: string,
  submission: SubmissionRecord
): Promise<string> {
  let spreadsheetId = await findExistingSpreadsheet(accessToken);

  if (!spreadsheetId) {
    const created = await createCamporeeSpreadsheet(accessToken);
    spreadsheetId = created.spreadsheetId;
  }

  const rowData = [
    submission.folio,
    new Date(submission.createdAt).toLocaleString('es-ES'),
    submission.clubName,
    submission.foundationYear,
    submission.church,
    `Zona ${submission.amapZone}`,
    submission.districtPastor,
    submission.directorName,
    submission.contactPhone,
    submission.contactEmail,
    submission.clubLogo ? 'Sí (adjunto)' : 'No',
    submission.paymentProof ? 'Sí (adjunto)' : 'No',
    submission.status === 'completado' ? 'Preinscrito' : 'Pendiente',
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Preinscripciones!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al registrar la fila en Google Sheets');
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}
