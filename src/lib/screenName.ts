/** Short word pairs for default screen titles until the user renames in My Apps. */
const ADJECTIVES = [
  'Swift',
  'Calm',
  'Bright',
  'Sleek',
  'Bold',
  'Crisp',
  'Clear',
  'Fresh',
  'Prime',
  'Core',
  'Lite',
  'Pro',
] as const;

const NOUNS = [
  'Dashboard',
  'Workspace',
  'Portal',
  'Panel',
  'Gallery',
  'Console',
  'Studio',
  'Hub',
  'View',
  'Screen',
  'Layout',
  'Flow',
] as const;

/** Returns a readable random name, e.g. "Sleek Dashboard". */
export function generateDefaultScreenName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}
