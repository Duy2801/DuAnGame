import type { Reward } from '../types';

// Toàn bộ mã giftcode đã được chuyển về lưu trữ và xác thực trực tiếp trên Database PostgreSQL (Supabase).
// Tuyệt đối KHÔNG lưu bất kỳ mã code nào trên frontend / giao diện để chống F12, đọc bundle và lộ mã.

export interface GiftCode {
  id?: string;
  name?: string;
  code?: string;
  reward?: Reward;
  once: boolean;
  note: string;
}

/** Danh sách mã trên client: Rỗng (100% mã được quản lý trên Database) */
export const GIFT_CODES: GiftCode[] = [];
