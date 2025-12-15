import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a random password for new users
 */
export function generatePassword(length: number = 12): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

/**
 * Generate a system password matching the required format:
 * CoachCore{2-4 digits}{one special character from !@#$%&*}
 */
export function generateSystemPassword(): string {
  const digitCount = 2 + Math.floor(Math.random() * 3); // 2-4 digits
  let digits = "";
  for (let i = 0; i < digitCount; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }

  const specials = "!@#$%&*";
  const special = specials[Math.floor(Math.random() * specials.length)];

  return `CoachCore${digits}${special}`;
}
