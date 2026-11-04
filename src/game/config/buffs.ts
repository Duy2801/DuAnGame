// Hiệu ứng tạm thời từ món ăn — ăn món có buff để mạnh hơn / câu cá may hơn trong vài phút

export type BuffId = 'atk' | 'speed' | 'luck' | 'gold' | 'xp' | 'def';

export const BUFF_INFO: Record<BuffId, { name: string; emoji: string; desc: (v: number) => string }> = {
  atk: { name: 'Cuồng lực', emoji: '💪', desc: (v) => `+${Math.round(v * 100)}% tấn công` },
  def: { name: 'Da đồng', emoji: '🛡️', desc: (v) => `+${Math.round(v * 100)}% phòng thủ` },
  speed: { name: 'Lanh lẹ', emoji: '👟', desc: (v) => `+${Math.round(v * 100)}% tốc chạy` },
  luck: { name: 'May mắn', emoji: '🍀', desc: (v) => `+${Math.round(v * 100)}% cá hiếm & cá to` },
  gold: { name: 'Phát tài', emoji: '💰', desc: (v) => `+${Math.round(v * 100)}% vàng từ quái` },
  xp: { name: 'Minh mẫn', emoji: '📘', desc: (v) => `+${Math.round(v * 100)}% kinh nghiệm` },
};
