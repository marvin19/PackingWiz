export const mockUserProfile = {
  firstName: 'Anna',
  displayName: 'Alex Lindberg',
  email: 'alex@example.com',
  initials: 'AL',
} as const;

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}
