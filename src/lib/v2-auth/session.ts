// Helper sesi server untuk v2-admin. Dipisah dari auth.ts agar modul yang hanya
// butuh verifikasi token tidak menarik dependensi `next/headers`.

import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  getUserById,
  verifySessionToken,
  type SessionUser,
} from "./auth";

// Ambil user dari cookie sesi. Mengembalikan null bila tidak login/expired.
export const getSessionUser = async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = verifySessionToken(token);
  if (!userId) return null;

  try {
    return await getUserById(userId);
  } catch {
    // Kegagalan DB tidak boleh dianggap "terautentikasi".
    return null;
  }
};
