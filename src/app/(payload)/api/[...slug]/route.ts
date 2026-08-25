import { REST_DELETE, REST_GET, REST_PATCH, REST_POST, REST_PUT } from "@payloadcms/next/routes";
import configPromise from "@payload-config";

// Endpoint AI (generate artikel dll.) bisa berjalan lama. Naikkan batas durasi
// serverless agar tidak time out di tengah generasi (batas aktual tergantung plan
// Vercel: Hobby 60s, Pro 300s). Route ini menampung semua REST + custom endpoint.
export const maxDuration = 300;

export const GET = REST_GET(configPromise);
export const POST = REST_POST(configPromise);
export const DELETE = REST_DELETE(configPromise);
export const PATCH = REST_PATCH(configPromise);
export const PUT = REST_PUT(configPromise);
