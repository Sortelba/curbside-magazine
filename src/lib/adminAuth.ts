// Admin-Passwort fürs lokale Dashboard. Steht in .env.local (ADMIN_KEY=...),
// nicht mehr im Code – das Repository ist öffentlich.
export const ADMIN_KEY = (process.env.ADMIN_KEY || process.env.CRON_SECRET || "").trim();

export function isAdminKey(key: string | null | undefined): boolean {
    return Boolean(ADMIN_KEY) && key === ADMIN_KEY;
}
