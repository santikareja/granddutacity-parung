// Guard autentikasi untuk endpoint /api/agent/* (Task 9B). Server-side only
// (Node runtime — verifyAgentToken memakai crypto + Drizzle).
//
// Berbeda dari api-guard.ts: endpoint agent dipanggil MESIN, bukan browser.
// Maka TIDAK memakai session cookie maupun CSRF. Autentikasi murni via header
// Authorization: "Bearer <token>", lalu pengecekan scope.

import { NextResponse } from "next/server";

import { verifyAgentToken } from "@/lib/v2-admin/agent-tokens";

export type AgentGuardResult =
  | { ok: true; tokenId: number; scopes: string[] }
  | { ok: false; response: NextResponse };

// Ekstrak token dari header "Authorization: Bearer <token>".
const extractBearer = (request: Request): string | null => {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
};

export const requireAgentToken = async (
  request: Request,
  requiredScope: string,
): Promise<AgentGuardResult> => {
  const raw = extractBearer(request);

  if (!raw) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Token agent tidak ada. Sertakan header Authorization: Bearer <token>." },
        { status: 401 },
      ),
    };
  }

  const verified = await verifyAgentToken(raw);

  if (!verified) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Token agent tidak valid, dicabut, atau kedaluwarsa." },
        { status: 401 },
      ),
    };
  }

  if (!verified.scopes.includes(requiredScope)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Token tidak memiliki scope "${requiredScope}".` },
        { status: 403 },
      ),
    };
  }

  return { ok: true, tokenId: verified.id, scopes: verified.scopes };
};
