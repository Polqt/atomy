export function getDisplayNameFromEmail(email: string | null | undefined, fallback = 'User') {
  const localPart = email?.split('@')[0]?.trim();
  if (!localPart) return fallback;
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

export function getInitial(value: string, fallback = 'U') {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.charAt(0).toUpperCase();
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getDayProgress() {
  const now = new Date();
  return (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
}