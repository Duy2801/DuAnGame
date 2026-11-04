// Khu Mua Sắm: Tiệm Bánh & Cà Phê — mua sẵn món có buff (vòng quay dùng chung với mục Quà, xem config/meta.ts)

/** món bán ở Tiệm Bánh — giá = giá bán ra × BAKERY_MARKUP (nấu ở Bếp vẫn rẻ hơn) */
export const BAKERY_MENU = [
  'carrot_soup', 'omelette', 'grilled_fish', 'warm_milk', 'fish_soup', 'cheese',
  'tomato_stew', 'sponge_cake', 'pumpkin_pie', 'sushi', 'hotpot', 'fairy_tart',
];
export const BAKERY_MARKUP = 2.5;
/** "Món hôm nay" giảm giá */
export const BAKERY_DEAL = 0.3;
