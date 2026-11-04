// Cấu hình bản online — điền trong file .env.local (xem ONLINE.md). Thiếu thì game chạy offline, BXH đấu với bot.

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
/** tài khoản đăng nhập bằng tên; Supabase cần email nên ghép thành ten@<miền này> (không gửi thư nào cả) */
export const EMAIL_DOMAIN = (import.meta.env.VITE_AUTH_EMAIL_DOMAIN as string | undefined) || 'example.com';
export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? '';

export const ONLINE = !!SUPABASE_URL && !!SUPABASE_KEY;
