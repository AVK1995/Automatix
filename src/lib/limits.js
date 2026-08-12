export const SYSTEM_LIMITS = {
  SHEETS: {
    MAX_COLUMNS_FETCH: parseInt(process.env.LIMIT_SHEETS_MAX_COLUMNS || '30', 10),
    MAX_ROWS_FETCH: parseInt(process.env.LIMIT_SHEETS_MAX_ROWS || '50', 10),
  },
  HTTP: {
    TIMEOUT_MS: parseInt(process.env.LIMIT_HTTP_TIMEOUT_MS || '15000', 10),
  },
  EMAIL: {
    MAX_SUBJECT_LENGTH: parseInt(process.env.LIMIT_EMAIL_MAX_SUBJECT || '255', 10),
    MAX_BODY_LENGTH: parseInt(process.env.LIMIT_EMAIL_MAX_BODY || '10000', 10),
  },
  DELAY: {
    MAX_DAYS: parseInt(process.env.LIMIT_DELAY_MAX_DAYS || '365', 10),
  }
};
