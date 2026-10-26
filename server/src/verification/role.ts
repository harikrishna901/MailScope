/**
 * Role-Based Address Detection
 * Identifies shared, departmental, or role-based email addresses.
 */

export const ROLE_LOCAL_PARTS: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'info',
  'support',
  'sales',
  'contact',
  'hello',
  'help',
  'noreply',
  'no-reply',
  'postmaster',
  'abuse',
  'billing',
  'office',
  'team',
  'webmaster',
  'marketing',
  'hr',
  'jobs',
  'careers',
  'security',
  'media',
  'press',
  'legal',
  'compliance',
  'finance',
  'accounting',
  'inquiries',
  'operations',
  'ops',
  'dev',
  'engineering',
  'feedback',
  'general',
  'privacy',
  'audit',
  'dispatch',
  'frontdesk',
  'receptionist',
  'service',
  'payments',
  'orders',
  'shipping',
]);

/**
 * Checks if an email address or local part represents a role-based mailbox.
 * Handles subaddress tags (e.g. support+promo@domain.com -> support).
 */
export function isRoleAddress(emailOrLocalPart: string): boolean {
  if (!emailOrLocalPart) return false;

  const atIdx = emailOrLocalPart.indexOf('@');
  const localPart = atIdx !== -1 ? emailOrLocalPart.slice(0, atIdx) : emailOrLocalPart;

  // Normalize: lower case and strip subaddressing (+tag)
  const normalized = localPart.toLowerCase().split('+')[0].trim();

  return ROLE_LOCAL_PARTS.has(normalized);
}
