import { cookies } from 'next/headers';
import { verifyToken, type JWTPayload } from './auth';

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
