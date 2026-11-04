import React from 'react';
import type { FishRarity } from '../game/config/fishingZones';

export type FishBodyShape =
  | 'standard'       // Cá chép, cá diếc, rô, hồi, trắm, măng...
  | 'elongated'      // Cá lóc, lươn, chình, cá nhồng, hải tượng...
  | 'deep'           // Cá đĩa, mặt trăng, cá sặc, cá tiên, rô phi, tráp...
  | 'predator'       // Cá mập con, cá ngừ vây vàng...
  | 'hammerhead'     // Cá mập đầu búa, cá đầu búa tuyết sơn...
  | 'whale'          // Cá voi trắng beluga, cá voi, cá hổ kình orca...
  | 'sturgeon'       // Cá tầm gai, cá tầm sông băng vĩnh cửu...
  | 'crystal'        // Cá tuyết pha lê, cá băng tinh, lưu ly...
  | 'mythic_dragon'  // Băng Long, Long Ngư, Leviathan, Kỳ lân...
  | 'flat'           // Cá đuối, manta ray, cá bơn...
  | 'swordfish'      // Cá buồm, cá cờ, cá kiếm...
  | 'angler'         // Cá lồng đèn, cá quỷ, cá bồ nông đáy vực...
  | 'puffer'         // Cá nóc, cá bồ nông...
  | 'turtle_fish'    // Xuân Thủy Linh Quy Ngư...
  | 'whiskers'       // Cá trê, cá lăng, cá ngạnh, tra dầu, bống...
  | 'exotic';        // Cá hề, cá sư tử, cá betta xiêm, chép bướm, cá chuồn...

export interface FishVisualSpec {
  shape: FishBodyShape;
  colors: {
    back: string;         // Màu lưng
    mid: string;          // Màu thân giữa
    belly: string;        // Màu bụng
    fin: string;          // Màu vây
    finRay?: string;      // Màu tia vây
    accent?: string;      // Viền óng ánh / điểm nhấn
    eye: string;          // Màu mống mắt
    patternColor?: string;// Màu đốm / sọc
    glow?: string;        // Màu hào quang phát sáng
  };
  pattern?: 'stripes' | 'spots' | 'koi_calico' | 'scales' | 'glow_lines' | 'flame' | 'frost' | 'gold_armor';
  features?: {
    barbels?: boolean;      // Râu cá trê / chép / rồng / tầm
    dorsalSpines?: boolean; // Gai vây lưng nhọn
    tailType?: 'forked' | 'fan' | 'crescent' | 'ribbon' | 'whip';
    bill?: boolean;         // Mõm kiếm dài (cá buồm, cá cờ)
    lantern?: boolean;      // Đèn phát sáng (cá lồng đèn)
    horns?: boolean;        // Sừng rồng / kỳ lân
    wingFins?: boolean;     // Vây cánh xòe rộng
    shimmer?: boolean;      // Hiệu ứng ánh kim
    isOrca?: boolean;       // Đốm trắng mắt đặc trưng cá hổ kình
    adiposeFin?: boolean;   // Vây mỡ cá hồi/than
  };
}

/** Bảng tra cứu thông số hình dáng & màu sắc mỹ thuật của tất cả các loài cá */
export const FISH_ART_REGISTRY: Record<string, FishVisualSpec> = {
  "fish_crucian": {
    "shape": "standard",
    "colors": {
        "back": "#4b5563",
        "mid": "#9ca3af",
        "belly": "#f3f4f6",
        "fin": "#d1d5db",
        "finRay": "#9ca3af",
        "accent": "#e5e7eb",
        "eye": "#f59e0b",
        "patternColor": "#e5e7eb"
    },
    "pattern": "scales",
    "features": {
        "tailType": "forked",
        "dorsalSpines": true
    }
},
  "fish_perch": {
    "shape": "standard",
    "colors": {
        "back": "#365314",
        "mid": "#65a30d",
        "belly": "#ecfccb",
        "fin": "#ea580c",
        "finRay": "#c2410c",
        "accent": "#bef264",
        "eye": "#eab308",
        "patternColor": "#1a2e05"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_gudgeon": {
    "shape": "whiskers",
    "colors": {
        "back": "#1e293b",
        "mid": "#334155",
        "belly": "#94a3b8",
        "fin": "#475569",
        "finRay": "#1e293b",
        "accent": "#cbd5e1",
        "eye": "#f59e0b",
        "patternColor": "#0f172a"
    },
    "pattern": "spots",
    "features": {
        "barbels": true,
        "tailType": "forked"
    }
},
  "fish_grass_carp": {
    "shape": "standard",
    "colors": {
        "back": "#b45309",
        "mid": "#f59e0b",
        "belly": "#fef08a",
        "fin": "#ea580c",
        "finRay": "#9a3412",
        "accent": "#fef08a",
        "eye": "#ca8a04",
        "patternColor": "#fbbf24"
    },
    "pattern": "scales",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_silver_carp": {
    "shape": "standard",
    "colors": {
        "back": "#b45309",
        "mid": "#f59e0b",
        "belly": "#fef08a",
        "fin": "#ea580c",
        "finRay": "#9a3412",
        "accent": "#fef08a",
        "eye": "#ca8a04",
        "patternColor": "#fbbf24"
    },
    "pattern": "scales",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_minnow": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_rohu": {
    "shape": "standard",
    "colors": {
        "back": "#365314",
        "mid": "#65a30d",
        "belly": "#ecfccb",
        "fin": "#ea580c",
        "finRay": "#c2410c",
        "accent": "#bef264",
        "eye": "#eab308",
        "patternColor": "#1a2e05"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_carp": {
    "shape": "standard",
    "colors": {
        "back": "#b45309",
        "mid": "#f59e0b",
        "belly": "#fef08a",
        "fin": "#ea580c",
        "finRay": "#9a3412",
        "accent": "#fef08a",
        "eye": "#ca8a04",
        "patternColor": "#fbbf24"
    },
    "pattern": "scales",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_guppy": {
    "shape": "exotic",
    "colors": {
        "back": "#4338ca",
        "mid": "#06b6d4",
        "belly": "#f43f5e",
        "fin": "#ec4899",
        "finRay": "#be185d",
        "accent": "#38bdf8",
        "eye": "#0284c7",
        "patternColor": "#f43f5e",
        "glow": "#ec4899"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_betta": {
    "shape": "exotic",
    "colors": {
        "back": "#1e1b4b",
        "mid": "#4338ca",
        "belly": "#e11d48",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#38bdf8",
        "eye": "#60a5fa",
        "patternColor": "#38bdf8",
        "glow": "#4338ca"
    },
    "pattern": "scales",
    "features": {
        "tailType": "ribbon",
        "wingFins": true,
        "dorsalSpines": true,
        "shimmer": true
    }
},
  "fish_carp_god": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#92400e",
        "mid": "#f59e0b",
        "belly": "#fef3c7",
        "fin": "#fbbf24",
        "finRay": "#b45309",
        "accent": "#fef08a",
        "eye": "#dc2626",
        "patternColor": "#fde047",
        "glow": "#f59e0b"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_tilapia": {
    "shape": "deep",
    "colors": {
        "back": "#3f3f46",
        "mid": "#71717a",
        "belly": "#f4f4f5",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#a1a1aa",
        "patternColor": "#27272a"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_climbing_perch": {
    "shape": "swordfish",
    "colors": {
        "back": "#0c4a6e",
        "mid": "#0284c7",
        "belly": "#f0f9ff",
        "fin": "#0369a1",
        "finRay": "#38bdf8",
        "accent": "#38bdf8",
        "eye": "#38bdf8",
        "patternColor": "#38bdf8",
        "glow": "#0284c7"
    },
    "pattern": "stripes",
    "features": {
        "bill": true,
        "shimmer": true
    }
},
  "fish_gourami": {
    "shape": "deep",
    "colors": {
        "back": "#047857",
        "mid": "#059669",
        "belly": "#f0fdf4",
        "fin": "#34d399",
        "finRay": "#065f46",
        "accent": "#a7f3d0",
        "eye": "#10b981",
        "patternColor": "#064e3b"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "barbels": true
    }
},
  "fish_snakehead": {
    "shape": "elongated",
    "colors": {
        "back": "#1c1917",
        "mid": "#57534e",
        "belly": "#e7e5e4",
        "fin": "#78716c",
        "finRay": "#44403c",
        "accent": "#a8a29e",
        "eye": "#ea580c",
        "patternColor": "#292524"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan"
    }
},
  "fish_elephant_ear": {
    "shape": "deep",
    "colors": {
        "back": "#3f3f46",
        "mid": "#71717a",
        "belly": "#f4f4f5",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#a1a1aa",
        "patternColor": "#27272a"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_lotus_catfish": {
    "shape": "whiskers",
    "colors": {
        "back": "#831843",
        "mid": "#db2777",
        "belly": "#fce7f3",
        "fin": "#f472b6",
        "finRay": "#9d174d",
        "accent": "#fbcfe8",
        "eye": "#ec4899",
        "patternColor": "#be185d",
        "glow": "#db2777"
    },
    "pattern": "spots",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_gourami_silk": {
    "shape": "deep",
    "colors": {
        "back": "#047857",
        "mid": "#059669",
        "belly": "#f0fdf4",
        "fin": "#34d399",
        "finRay": "#065f46",
        "accent": "#a7f3d0",
        "eye": "#10b981",
        "patternColor": "#064e3b"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "barbels": true
    }
},
  "fish_koi": {
    "shape": "standard",
    "colors": {
        "back": "#b45309",
        "mid": "#f59e0b",
        "belly": "#fffbeb",
        "fin": "#fde047",
        "finRay": "#d97706",
        "accent": "#ffffff",
        "eye": "#ca8a04",
        "patternColor": "#fef08a",
        "glow": "#f59e0b"
    },
    "pattern": "scales",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_koi_kohaku": {
    "shape": "standard",
    "colors": {
        "back": "#dc2626",
        "mid": "#f8fafc",
        "belly": "#ffffff",
        "fin": "#f8fafc",
        "finRay": "#ef4444",
        "accent": "#dc2626",
        "eye": "#dc2626",
        "patternColor": "#dc2626",
        "glow": "#dc2626"
    },
    "pattern": "koi_calico",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_dragon_butterfly": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#92400e",
        "mid": "#f59e0b",
        "belly": "#fef3c7",
        "fin": "#fbbf24",
        "finRay": "#b45309",
        "accent": "#fef08a",
        "eye": "#dc2626",
        "patternColor": "#fde047",
        "glow": "#f59e0b"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_lotus_spirit": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#831843",
        "mid": "#f43f5e",
        "belly": "#fff1f2",
        "fin": "#fda4af",
        "finRay": "#e11d48",
        "accent": "#ffe4e6",
        "eye": "#fb7185",
        "patternColor": "#f43f5e",
        "glow": "#fb7185"
    },
    "pattern": "scales",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_catfish": {
    "shape": "whiskers",
    "colors": {
        "back": "#1e293b",
        "mid": "#334155",
        "belly": "#94a3b8",
        "fin": "#475569",
        "finRay": "#1e293b",
        "accent": "#cbd5e1",
        "eye": "#f59e0b",
        "patternColor": "#0f172a"
    },
    "pattern": "spots",
    "features": {
        "barbels": true,
        "tailType": "forked"
    }
},
  "fish_black_carp": {
    "shape": "standard",
    "colors": {
        "back": "#b45309",
        "mid": "#f59e0b",
        "belly": "#fef08a",
        "fin": "#ea580c",
        "finRay": "#9a3412",
        "accent": "#fef08a",
        "eye": "#ca8a04",
        "patternColor": "#fbbf24"
    },
    "pattern": "scales",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_piranha": {
    "shape": "deep",
    "colors": {
        "back": "#18181b",
        "mid": "#3f3f46",
        "belly": "#dc2626",
        "fin": "#b91c1c",
        "finRay": "#7f1d1d",
        "accent": "#f87171",
        "eye": "#ef4444",
        "patternColor": "#7f1d1d",
        "glow": "#ef4444"
    },
    "pattern": "spots",
    "features": {
        "tailType": "forked",
        "dorsalSpines": true
    }
},
  "fish_sturgeon": {
    "shape": "sturgeon",
    "colors": {
        "back": "#1e293b",
        "mid": "#475569",
        "belly": "#e2e8f0",
        "fin": "#64748b",
        "finRay": "#334155",
        "accent": "#f59e0b",
        "eye": "#38bdf8",
        "patternColor": "#94a3b8"
    },
    "pattern": "gold_armor",
    "features": {
        "barbels": true,
        "shimmer": true
    }
},
  "fish_mekong_catfish": {
    "shape": "whiskers",
    "colors": {
        "back": "#1e293b",
        "mid": "#334155",
        "belly": "#94a3b8",
        "fin": "#475569",
        "finRay": "#1e293b",
        "accent": "#cbd5e1",
        "eye": "#f59e0b",
        "patternColor": "#0f172a"
    },
    "pattern": "spots",
    "features": {
        "barbels": true,
        "tailType": "forked"
    }
},
  "fish_arapaima": {
    "shape": "elongated",
    "colors": {
        "back": "#14532d",
        "mid": "#15803d",
        "belly": "#dc2626",
        "fin": "#b91c1c",
        "finRay": "#991b1b",
        "accent": "#ef4444",
        "eye": "#eab308",
        "patternColor": "#dc2626",
        "glow": "#dc2626"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan",
        "shimmer": true
    }
},
  "fish_angler": {
    "shape": "angler",
    "colors": {
        "back": "#030712",
        "mid": "#111827",
        "belly": "#374151",
        "fin": "#1f2937",
        "finRay": "#030712",
        "accent": "#38bdf8",
        "eye": "#38bdf8",
        "glow": "#06b6d4"
    },
    "features": {
        "lantern": true,
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_coelacanth": {
    "shape": "deep",
    "colors": {
        "back": "#3f3f46",
        "mid": "#71717a",
        "belly": "#f4f4f5",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#a1a1aa",
        "patternColor": "#27272a"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_moray_electric": {
    "shape": "flat",
    "colors": {
        "back": "#0284c7",
        "mid": "#38bdf8",
        "belly": "#f0f9ff",
        "fin": "#7dd3fc",
        "finRay": "#0369a1",
        "accent": "#e0f2fe",
        "eye": "#0369a1",
        "patternColor": "#bae6fd"
    },
    "pattern": "spots",
    "features": {
        "tailType": "whip",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_abyss_gulper": {
    "shape": "angler",
    "colors": {
        "back": "#030712",
        "mid": "#111827",
        "belly": "#374151",
        "fin": "#1f2937",
        "finRay": "#030712",
        "accent": "#38bdf8",
        "eye": "#38bdf8",
        "glow": "#06b6d4"
    },
    "features": {
        "lantern": true,
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_leviathan": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#92400e",
        "mid": "#f59e0b",
        "belly": "#fef3c7",
        "fin": "#fbbf24",
        "finRay": "#b45309",
        "accent": "#fef08a",
        "eye": "#dc2626",
        "patternColor": "#fde047",
        "glow": "#f59e0b"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_firefly_fish": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_night_gourami": {
    "shape": "deep",
    "colors": {
        "back": "#047857",
        "mid": "#059669",
        "belly": "#f0fdf4",
        "fin": "#34d399",
        "finRay": "#065f46",
        "accent": "#a7f3d0",
        "eye": "#10b981",
        "patternColor": "#064e3b"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "barbels": true
    }
},
  "fish_neon_tetra": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_eel": {
    "shape": "elongated",
    "colors": {
        "back": "#1e1b4b",
        "mid": "#312e81",
        "belly": "#6366f1",
        "fin": "#818cf8",
        "finRay": "#4338ca",
        "accent": "#a5b4fc",
        "eye": "#c7d2fe",
        "patternColor": "#818cf8",
        "glow": "#6366f1"
    },
    "pattern": "glow_lines",
    "features": {
        "tailType": "ribbon"
    }
},
  "fish_ghost_catfish": {
    "shape": "whiskers",
    "colors": {
        "back": "#312e81",
        "mid": "#4f46e5",
        "belly": "#c7d2fe",
        "fin": "#818cf8",
        "finRay": "#3730a3",
        "accent": "#e0e7ff",
        "eye": "#a5b4fc",
        "patternColor": "#e0e7ff",
        "glow": "#818cf8"
    },
    "pattern": "scales",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_mist_sword": {
    "shape": "swordfish",
    "colors": {
        "back": "#1e293b",
        "mid": "#475569",
        "belly": "#e2e8f0",
        "fin": "#a855f7",
        "finRay": "#6b21a8",
        "accent": "#c084fc",
        "eye": "#d8b4fe",
        "patternColor": "#9333ea",
        "glow": "#a855f7"
    },
    "pattern": "glow_lines",
    "features": {
        "bill": true,
        "shimmer": true
    }
},
  "fish_angel_dusk": {
    "shape": "deep",
    "colors": {
        "back": "#3f3f46",
        "mid": "#71717a",
        "belly": "#f4f4f5",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#a1a1aa",
        "patternColor": "#27272a"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_moonfish": {
    "shape": "deep",
    "colors": {
        "back": "#1e1b4b",
        "mid": "#4338ca",
        "belly": "#e0e7ff",
        "fin": "#818cf8",
        "finRay": "#3730a3",
        "accent": "#f8fafc",
        "eye": "#38bdf8",
        "patternColor": "#c7d2fe",
        "glow": "#818cf8"
    },
    "pattern": "scales",
    "features": {
        "tailType": "crescent",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_tiger_glow": {
    "shape": "predator",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f1f5f9",
        "fin": "#475569",
        "finRay": "#1e293b",
        "accent": "#94a3b8",
        "eye": "#0f172a",
        "patternColor": "#1e293b"
    },
    "pattern": "scales",
    "features": {
        "tailType": "crescent",
        "dorsalSpines": true
    }
},
  "fish_purple_arowana": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#92400e",
        "mid": "#f59e0b",
        "belly": "#fef3c7",
        "fin": "#fbbf24",
        "finRay": "#b45309",
        "accent": "#fef08a",
        "eye": "#dc2626",
        "patternColor": "#fde047",
        "glow": "#f59e0b"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_lunar_ancient": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_clownfish": {
    "shape": "exotic",
    "colors": {
        "back": "#c2410c",
        "mid": "#ea580c",
        "belly": "#ffedd5",
        "fin": "#ea580c",
        "finRay": "#18181b",
        "accent": "#ffffff",
        "eye": "#ea580c",
        "patternColor": "#ffffff"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_blue_tang": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_butterfly_reef": {
    "shape": "exotic",
    "colors": {
        "back": "#4338ca",
        "mid": "#06b6d4",
        "belly": "#f43f5e",
        "fin": "#ec4899",
        "finRay": "#be185d",
        "accent": "#38bdf8",
        "eye": "#0284c7",
        "patternColor": "#f43f5e",
        "glow": "#ec4899"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_barracuda": {
    "shape": "elongated",
    "colors": {
        "back": "#1e293b",
        "mid": "#475569",
        "belly": "#f8fafc",
        "fin": "#64748b",
        "finRay": "#334155",
        "accent": "#94a3b8",
        "eye": "#eab308",
        "patternColor": "#0f172a"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "forked",
        "dorsalSpines": true
    }
},
  "fish_lionfish": {
    "shape": "exotic",
    "colors": {
        "back": "#991b1b",
        "mid": "#dc2626",
        "belly": "#fee2e2",
        "fin": "#ef4444",
        "finRay": "#7f1d1d",
        "accent": "#ffffff",
        "eye": "#b91c1c",
        "patternColor": "#ffffff",
        "glow": "#dc2626"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "ribbon",
        "wingFins": true,
        "dorsalSpines": true,
        "shimmer": true
    }
},
  "fish_yellowfin_tuna": {
    "shape": "predator",
    "colors": {
        "back": "#0f172a",
        "mid": "#1e3a8a",
        "belly": "#e2e8f0",
        "fin": "#eab308",
        "finRay": "#ca8a04",
        "accent": "#fde047",
        "eye": "#facc15",
        "patternColor": "#e2e8f0",
        "glow": "#eab308"
    },
    "pattern": "scales",
    "features": {
        "tailType": "crescent",
        "shimmer": true
    }
},
  "fish_shark": {
    "shape": "predator",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f1f5f9",
        "fin": "#475569",
        "finRay": "#1e293b",
        "accent": "#94a3b8",
        "eye": "#0f172a",
        "patternColor": "#1e293b"
    },
    "pattern": "scales",
    "features": {
        "tailType": "crescent",
        "dorsalSpines": true
    }
},
  "fish_stingray": {
    "shape": "flat",
    "colors": {
        "back": "#0284c7",
        "mid": "#38bdf8",
        "belly": "#f0f9ff",
        "fin": "#7dd3fc",
        "finRay": "#0369a1",
        "accent": "#e0f2fe",
        "eye": "#0369a1",
        "patternColor": "#bae6fd"
    },
    "pattern": "spots",
    "features": {
        "tailType": "whip",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_sailfish": {
    "shape": "swordfish",
    "colors": {
        "back": "#0c4a6e",
        "mid": "#0284c7",
        "belly": "#f0f9ff",
        "fin": "#0369a1",
        "finRay": "#38bdf8",
        "accent": "#38bdf8",
        "eye": "#38bdf8",
        "patternColor": "#38bdf8",
        "glow": "#0284c7"
    },
    "pattern": "stripes",
    "features": {
        "bill": true,
        "shimmer": true
    }
},
  "fish_giant_manta": {
    "shape": "flat",
    "colors": {
        "back": "#0f172a",
        "mid": "#1e293b",
        "belly": "#ffffff",
        "fin": "#334155",
        "finRay": "#0284c7",
        "accent": "#38bdf8",
        "eye": "#38bdf8",
        "patternColor": "#38bdf8",
        "glow": "#38bdf8"
    },
    "pattern": "spots",
    "features": {
        "tailType": "whip",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_kirin_sea": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#92400e",
        "mid": "#f59e0b",
        "belly": "#fef3c7",
        "fin": "#fbbf24",
        "finRay": "#b45309",
        "accent": "#fef08a",
        "eye": "#dc2626",
        "patternColor": "#fde047",
        "glow": "#f59e0b"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_ice_smelt": {
    "shape": "crystal",
    "colors": {
        "back": "#0f766e",
        "mid": "#14b8a6",
        "belly": "#ecfeff",
        "fin": "#5eead4",
        "finRay": "#0d9488",
        "accent": "#99f6e4",
        "eye": "#2dd4bf",
        "patternColor": "#cffafe",
        "glow": "#14b8a6"
    },
    "pattern": "frost",
    "features": {
        "shimmer": true
    }
},
  "fish_polar_cod": {
    "shape": "standard",
    "colors": {
        "back": "#475569",
        "mid": "#94a3b8",
        "belly": "#f8fafc",
        "fin": "#cbd5e1",
        "finRay": "#64748b",
        "accent": "#f1f5f9",
        "eye": "#38bdf8",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_whitefish": {
    "shape": "elongated",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f1f5f9",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#e2e8f0",
        "eye": "#38bdf8",
        "patternColor": "#cbd5e1"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_salmon": {
    "shape": "standard",
    "colors": {
        "back": "#064e3b",
        "mid": "#059669",
        "belly": "#f43f5e",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#facc15",
        "patternColor": "#881337",
        "glow": "#059669"
    },
    "pattern": "spots",
    "features": {
        "tailType": "forked",
        "shimmer": true,
        "adiposeFin": true
    }
},
  "fish_frost_trout": {
    "shape": "standard",
    "colors": {
        "back": "#064e3b",
        "mid": "#059669",
        "belly": "#f43f5e",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#facc15",
        "patternColor": "#881337",
        "glow": "#059669"
    },
    "pattern": "spots",
    "features": {
        "tailType": "forked",
        "shimmer": true,
        "adiposeFin": true
    }
},
  "fish_arctic_char": {
    "shape": "standard",
    "colors": {
        "back": "#1e293b",
        "mid": "#334155",
        "belly": "#f97316",
        "fin": "#fb923c",
        "finRay": "#c2410c",
        "accent": "#fdba74",
        "eye": "#ea580c",
        "patternColor": "#ea580c",
        "glow": "#f97316"
    },
    "pattern": "spots",
    "features": {
        "tailType": "forked",
        "shimmer": true,
        "adiposeFin": true
    }
},
  "fish_hammer_frost": {
    "shape": "hammerhead",
    "colors": {
        "back": "#1e3a8a",
        "mid": "#3b82f6",
        "belly": "#dbeafe",
        "fin": "#60a5fa",
        "finRay": "#1d4ed8",
        "accent": "#93c5fd",
        "eye": "#bfdbfe",
        "patternColor": "#93c5fd",
        "glow": "#3b82f6"
    },
    "pattern": "frost",
    "features": {
        "dorsalSpines": true,
        "shimmer": true
    }
},
  "fish_crystal_cod": {
    "shape": "crystal",
    "colors": {
        "back": "#0891b2",
        "mid": "#06b6d4",
        "belly": "#ecfeff",
        "fin": "#67e8f9",
        "finRay": "#0e7490",
        "accent": "#ffffff",
        "eye": "#a5f3fc",
        "patternColor": "#cffafe",
        "glow": "#22d3ee"
    },
    "pattern": "frost",
    "features": {
        "shimmer": true
    }
},
  "fish_glacier_sturgeon": {
    "shape": "sturgeon",
    "colors": {
        "back": "#0c4a6e",
        "mid": "#0284c7",
        "belly": "#f0f9ff",
        "fin": "#38bdf8",
        "finRay": "#0369a1",
        "accent": "#e0f2fe",
        "eye": "#7dd3fc",
        "patternColor": "#cffafe",
        "glow": "#38bdf8"
    },
    "pattern": "frost",
    "features": {
        "barbels": true,
        "shimmer": true
    }
},
  "fish_ice_whale_mini": {
    "shape": "whale",
    "colors": {
        "back": "#bae6fd",
        "mid": "#f0f9ff",
        "belly": "#ffffff",
        "fin": "#e0f2fe",
        "finRay": "#7dd3fc",
        "accent": "#38bdf8",
        "eye": "#0284c7",
        "patternColor": "#bae6fd",
        "glow": "#38bdf8"
    },
    "pattern": "frost",
    "features": {
        "shimmer": true
    }
},
  "fish_frostwyrm": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#0e7490",
        "mid": "#06b6d4",
        "belly": "#ecfeff",
        "fin": "#67e8f9",
        "finRay": "#0891b2",
        "accent": "#ffffff",
        "eye": "#cffafe",
        "patternColor": "#ffffff",
        "glow": "#38bdf8"
    },
    "pattern": "frost",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_season_spring": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_sp_sakura_carp": {
    "shape": "standard",
    "colors": {
        "back": "#b45309",
        "mid": "#f59e0b",
        "belly": "#fef08a",
        "fin": "#ea580c",
        "finRay": "#9a3412",
        "accent": "#fef08a",
        "eye": "#ca8a04",
        "patternColor": "#fbbf24"
    },
    "pattern": "scales",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_sp_peach_goby": {
    "shape": "whiskers",
    "colors": {
        "back": "#1e293b",
        "mid": "#334155",
        "belly": "#94a3b8",
        "fin": "#475569",
        "finRay": "#1e293b",
        "accent": "#cbd5e1",
        "eye": "#f59e0b",
        "patternColor": "#0f172a"
    },
    "pattern": "spots",
    "features": {
        "barbels": true,
        "tailType": "forked"
    }
},
  "fish_sp_spring_rohu": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_sp_green_perch": {
    "shape": "standard",
    "colors": {
        "back": "#365314",
        "mid": "#65a30d",
        "belly": "#ecfccb",
        "fin": "#ea580c",
        "finRay": "#c2410c",
        "accent": "#bef264",
        "eye": "#eab308",
        "patternColor": "#1a2e05"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_sp_drizzle_trout": {
    "shape": "standard",
    "colors": {
        "back": "#064e3b",
        "mid": "#059669",
        "belly": "#f43f5e",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#facc15",
        "patternColor": "#881337",
        "glow": "#059669"
    },
    "pattern": "spots",
    "features": {
        "tailType": "forked",
        "shimmer": true,
        "adiposeFin": true
    }
},
  "fish_sp_lotus_bud": {
    "shape": "deep",
    "colors": {
        "back": "#047857",
        "mid": "#10b981",
        "belly": "#fff1f2",
        "fin": "#f472b6",
        "finRay": "#059669",
        "accent": "#fda4af",
        "eye": "#ec4899",
        "patternColor": "#fbcfe8"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan",
        "barbels": true
    }
},
  "fish_sp_jade_snapper": {
    "shape": "deep",
    "colors": {
        "back": "#3f3f46",
        "mid": "#71717a",
        "belly": "#f4f4f5",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#a1a1aa",
        "patternColor": "#27272a"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_sp_floral_butterfly": {
    "shape": "exotic",
    "colors": {
        "back": "#4338ca",
        "mid": "#06b6d4",
        "belly": "#f43f5e",
        "fin": "#ec4899",
        "finRay": "#be185d",
        "accent": "#38bdf8",
        "eye": "#0284c7",
        "patternColor": "#f43f5e",
        "glow": "#ec4899"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_sp_emerald_ray": {
    "shape": "flat",
    "colors": {
        "back": "#065f46",
        "mid": "#059669",
        "belly": "#ecfdf5",
        "fin": "#34d399",
        "finRay": "#047857",
        "accent": "#a7f3d0",
        "eye": "#10b981",
        "patternColor": "#6ee7b7",
        "glow": "#34d399"
    },
    "pattern": "spots",
    "features": {
        "tailType": "whip",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_sp_golden_fortune": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_sp_spring_dragon_carp": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#92400e",
        "mid": "#f59e0b",
        "belly": "#fef3c7",
        "fin": "#fbbf24",
        "finRay": "#b45309",
        "accent": "#fef08a",
        "eye": "#dc2626",
        "patternColor": "#fde047",
        "glow": "#f59e0b"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_sp_sacred_turtle_fish": {
    "shape": "turtle_fish",
    "colors": {
        "back": "#065f46",
        "mid": "#059669",
        "belly": "#ecfdf5",
        "fin": "#10b981",
        "finRay": "#047857",
        "accent": "#fbbf24",
        "eye": "#f59e0b",
        "patternColor": "#34d399",
        "glow": "#10b981"
    },
    "pattern": "gold_armor",
    "features": {
        "barbels": true,
        "horns": true,
        "shimmer": true
    }
},
  "fish_sp_phoenix_feather": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#9d174d",
        "mid": "#ec4899",
        "belly": "#fff1f2",
        "fin": "#f472b6",
        "finRay": "#be185d",
        "accent": "#fde047",
        "eye": "#f59e0b",
        "patternColor": "#fda4af",
        "glow": "#f472b6"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_season_summer": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_su_flying_fish": {
    "shape": "exotic",
    "colors": {
        "back": "#0369a1",
        "mid": "#0284c7",
        "belly": "#e0f2fe",
        "fin": "#38bdf8",
        "finRay": "#075985",
        "accent": "#bae6fd",
        "eye": "#38bdf8",
        "patternColor": "#bae6fd",
        "glow": "#38bdf8"
    },
    "pattern": "scales",
    "features": {
        "tailType": "forked",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_su_sun_goby": {
    "shape": "whiskers",
    "colors": {
        "back": "#1e293b",
        "mid": "#334155",
        "belly": "#94a3b8",
        "fin": "#475569",
        "finRay": "#1e293b",
        "accent": "#cbd5e1",
        "eye": "#f59e0b",
        "patternColor": "#0f172a"
    },
    "pattern": "spots",
    "features": {
        "barbels": true,
        "tailType": "forked"
    }
},
  "fish_su_silver_mullet": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_su_fire_clown": {
    "shape": "exotic",
    "colors": {
        "back": "#c2410c",
        "mid": "#ea580c",
        "belly": "#ffedd5",
        "fin": "#ea580c",
        "finRay": "#18181b",
        "accent": "#ffffff",
        "eye": "#ea580c",
        "patternColor": "#ffffff"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_su_summer_snapper": {
    "shape": "deep",
    "colors": {
        "back": "#3f3f46",
        "mid": "#71717a",
        "belly": "#f4f4f5",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#a1a1aa",
        "patternColor": "#27272a"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_su_storm_snakehead": {
    "shape": "elongated",
    "colors": {
        "back": "#1c1917",
        "mid": "#57534e",
        "belly": "#e7e5e4",
        "fin": "#78716c",
        "finRay": "#44403c",
        "accent": "#a8a29e",
        "eye": "#ea580c",
        "patternColor": "#292524"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan"
    }
},
  "fish_su_flame_swordtail": {
    "shape": "swordfish",
    "colors": {
        "back": "#7f1d1d",
        "mid": "#dc2626",
        "belly": "#fef2f2",
        "fin": "#f97316",
        "finRay": "#b91c1c",
        "accent": "#fde047",
        "eye": "#fbbf24",
        "patternColor": "#fbbf24",
        "glow": "#ef4444"
    },
    "pattern": "flame",
    "features": {
        "bill": true,
        "shimmer": true
    }
},
  "fish_su_fire_piranha": {
    "shape": "deep",
    "colors": {
        "back": "#18181b",
        "mid": "#3f3f46",
        "belly": "#dc2626",
        "fin": "#b91c1c",
        "finRay": "#7f1d1d",
        "accent": "#f87171",
        "eye": "#ef4444",
        "patternColor": "#7f1d1d",
        "glow": "#ef4444"
    },
    "pattern": "spots",
    "features": {
        "tailType": "forked",
        "dorsalSpines": true
    }
},
  "fish_su_solar_emperor": {
    "shape": "deep",
    "colors": {
        "back": "#3f3f46",
        "mid": "#71717a",
        "belly": "#f4f4f5",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#a1a1aa",
        "patternColor": "#27272a"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_su_ocean_blaze": {
    "shape": "swordfish",
    "colors": {
        "back": "#7f1d1d",
        "mid": "#dc2626",
        "belly": "#fef2f2",
        "fin": "#f97316",
        "finRay": "#b91c1c",
        "accent": "#fde047",
        "eye": "#fbbf24",
        "patternColor": "#fbbf24",
        "glow": "#ef4444"
    },
    "pattern": "flame",
    "features": {
        "bill": true,
        "shimmer": true
    }
},
  "fish_su_night_orca": {
    "shape": "whale",
    "colors": {
        "back": "#09090b",
        "mid": "#18181b",
        "belly": "#ffffff",
        "fin": "#27272a",
        "finRay": "#09090b",
        "accent": "#ffffff",
        "eye": "#e4e4e7",
        "patternColor": "#ffffff",
        "glow": "#60a5fa"
    },
    "pattern": "scales",
    "features": {
        "isOrca": true,
        "shimmer": true
    }
},
  "fish_su_flame_arowana": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#7f1d1d",
        "mid": "#dc2626",
        "belly": "#fef2f2",
        "fin": "#f59e0b",
        "finRay": "#b91c1c",
        "accent": "#fde047",
        "eye": "#fef08a",
        "patternColor": "#fbbf24",
        "glow": "#f97316"
    },
    "pattern": "flame",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_su_blazing_overlord": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#7f1d1d",
        "mid": "#dc2626",
        "belly": "#fef2f2",
        "fin": "#f59e0b",
        "finRay": "#b91c1c",
        "accent": "#fde047",
        "eye": "#fef08a",
        "patternColor": "#fbbf24",
        "glow": "#f97316"
    },
    "pattern": "flame",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_season_autumn": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_au_autumn_carp": {
    "shape": "standard",
    "colors": {
        "back": "#b45309",
        "mid": "#f59e0b",
        "belly": "#fef08a",
        "fin": "#ea580c",
        "finRay": "#9a3412",
        "accent": "#fef08a",
        "eye": "#ca8a04",
        "patternColor": "#fbbf24"
    },
    "pattern": "scales",
    "features": {
        "barbels": true,
        "tailType": "forked",
        "shimmer": true
    }
},
  "fish_au_river_trout": {
    "shape": "elongated",
    "colors": {
        "back": "#1c1917",
        "mid": "#57534e",
        "belly": "#e7e5e4",
        "fin": "#78716c",
        "finRay": "#44403c",
        "accent": "#a8a29e",
        "eye": "#ea580c",
        "patternColor": "#292524"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan"
    }
},
  "fish_au_fat_perch": {
    "shape": "deep",
    "colors": {
        "back": "#365314",
        "mid": "#65a30d",
        "belly": "#fef08a",
        "fin": "#ea580c",
        "finRay": "#ca8a04",
        "accent": "#bef264",
        "eye": "#eab308",
        "patternColor": "#1a2e05"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_au_amber_loach": {
    "shape": "elongated",
    "colors": {
        "back": "#1c1917",
        "mid": "#57534e",
        "belly": "#e7e5e4",
        "fin": "#78716c",
        "finRay": "#44403c",
        "accent": "#a8a29e",
        "eye": "#ea580c",
        "patternColor": "#292524"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan"
    }
},
  "fish_au_sweetfish": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_au_red_salmon": {
    "shape": "standard",
    "colors": {
        "back": "#064e3b",
        "mid": "#059669",
        "belly": "#f43f5e",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#facc15",
        "patternColor": "#881337",
        "glow": "#059669"
    },
    "pattern": "spots",
    "features": {
        "tailType": "forked",
        "shimmer": true,
        "adiposeFin": true
    }
},
  "fish_au_osmanthus_fish": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_au_giant_goby": {
    "shape": "whiskers",
    "colors": {
        "back": "#1e293b",
        "mid": "#334155",
        "belly": "#94a3b8",
        "fin": "#475569",
        "finRay": "#1e293b",
        "accent": "#cbd5e1",
        "eye": "#f59e0b",
        "patternColor": "#0f172a"
    },
    "pattern": "spots",
    "features": {
        "barbels": true,
        "tailType": "forked"
    }
},
  "fish_au_moon_glass": {
    "shape": "crystal",
    "colors": {
        "back": "#b45309",
        "mid": "#f59e0b",
        "belly": "#fef3c7",
        "fin": "#fde047",
        "finRay": "#d97706",
        "accent": "#ffffff",
        "eye": "#dc2626",
        "patternColor": "#fef08a",
        "glow": "#f59e0b"
    },
    "pattern": "frost",
    "features": {
        "shimmer": true
    }
},
  "fish_au_golden_mahseer": {
    "shape": "deep",
    "colors": {
        "back": "#3f3f46",
        "mid": "#71717a",
        "belly": "#f4f4f5",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#a1a1aa",
        "patternColor": "#27272a"
    },
    "pattern": "stripes",
    "features": {
        "tailType": "fan",
        "dorsalSpines": true
    }
},
  "fish_au_blood_dragon": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#92400e",
        "mid": "#f59e0b",
        "belly": "#fef3c7",
        "fin": "#fbbf24",
        "finRay": "#b45309",
        "accent": "#fef08a",
        "eye": "#dc2626",
        "patternColor": "#fde047",
        "glow": "#f59e0b"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_au_night_tide_lord": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#1e1b4b",
        "mid": "#312e81",
        "belly": "#c7d2fe",
        "fin": "#f59e0b",
        "finRay": "#4338ca",
        "accent": "#fbbf24",
        "eye": "#facc15",
        "patternColor": "#fbbf24",
        "glow": "#6366f1"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_au_nine_autumn_giant": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#78350f",
        "mid": "#d97706",
        "belly": "#fef3c7",
        "fin": "#fbbf24",
        "finRay": "#b45309",
        "accent": "#ffffff",
        "eye": "#dc2626",
        "patternColor": "#fde047",
        "glow": "#f59e0b"
    },
    "pattern": "gold_armor",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_season_winter": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_wi_arctic_cod": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_wi_frost_sardine": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_wi_snow_flounder": {
    "shape": "flat",
    "colors": {
        "back": "#475569",
        "mid": "#94a3b8",
        "belly": "#f8fafc",
        "fin": "#cbd5e1",
        "finRay": "#64748b",
        "accent": "#e2e8f0",
        "eye": "#38bdf8",
        "patternColor": "#e2e8f0"
    },
    "pattern": "frost",
    "features": {
        "tailType": "whip",
        "wingFins": true
    }
},
  "fish_wi_ice_herring": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_wi_char_winter": {
    "shape": "standard",
    "colors": {
        "back": "#334155",
        "mid": "#64748b",
        "belly": "#f8fafc",
        "fin": "#94a3b8",
        "finRay": "#475569",
        "accent": "#cbd5e1",
        "eye": "#eab308",
        "patternColor": "#e2e8f0"
    },
    "pattern": "scales",
    "features": {
        "tailType": "fan"
    }
},
  "fish_wi_frost_pike": {
    "shape": "elongated",
    "colors": {
        "back": "#1c1917",
        "mid": "#57534e",
        "belly": "#e7e5e4",
        "fin": "#78716c",
        "finRay": "#44403c",
        "accent": "#a8a29e",
        "eye": "#ea580c",
        "patternColor": "#292524"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan"
    }
},
  "fish_wi_blue_salmon": {
    "shape": "standard",
    "colors": {
        "back": "#064e3b",
        "mid": "#059669",
        "belly": "#f43f5e",
        "fin": "#fb7185",
        "finRay": "#e11d48",
        "accent": "#fda4af",
        "eye": "#facc15",
        "patternColor": "#881337",
        "glow": "#059669"
    },
    "pattern": "spots",
    "features": {
        "tailType": "forked",
        "shimmer": true,
        "adiposeFin": true
    }
},
  "fish_wi_burrow_snakehead": {
    "shape": "elongated",
    "colors": {
        "back": "#1c1917",
        "mid": "#57534e",
        "belly": "#e7e5e4",
        "fin": "#78716c",
        "finRay": "#44403c",
        "accent": "#a8a29e",
        "eye": "#ea580c",
        "patternColor": "#292524"
    },
    "pattern": "spots",
    "features": {
        "tailType": "fan"
    }
},
  "fish_wi_ice_crystal_glow": {
    "shape": "crystal",
    "colors": {
        "back": "#0891b2",
        "mid": "#06b6d4",
        "belly": "#ecfeff",
        "fin": "#67e8f9",
        "finRay": "#0e7490",
        "accent": "#ffffff",
        "eye": "#a5f3fc",
        "patternColor": "#cffafe",
        "glow": "#22d3ee"
    },
    "pattern": "frost",
    "features": {
        "shimmer": true
    }
},
  "fish_wi_frost_hammer": {
    "shape": "hammerhead",
    "colors": {
        "back": "#1e3a8a",
        "mid": "#3b82f6",
        "belly": "#dbeafe",
        "fin": "#60a5fa",
        "finRay": "#1d4ed8",
        "accent": "#93c5fd",
        "eye": "#bfdbfe",
        "patternColor": "#93c5fd",
        "glow": "#3b82f6"
    },
    "pattern": "frost",
    "features": {
        "dorsalSpines": true,
        "shimmer": true
    }
},
  "fish_wi_ice_scale_dragon": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#0e7490",
        "mid": "#06b6d4",
        "belly": "#ecfeff",
        "fin": "#67e8f9",
        "finRay": "#0891b2",
        "accent": "#ffffff",
        "eye": "#cffafe",
        "patternColor": "#ffffff",
        "glow": "#38bdf8"
    },
    "pattern": "frost",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
  "fish_wi_frost_whale": {
    "shape": "whale",
    "colors": {
        "back": "#bae6fd",
        "mid": "#f0f9ff",
        "belly": "#ffffff",
        "fin": "#e0f2fe",
        "finRay": "#7dd3fc",
        "accent": "#38bdf8",
        "eye": "#0284c7",
        "patternColor": "#bae6fd",
        "glow": "#38bdf8"
    },
    "pattern": "frost",
    "features": {
        "shimmer": true
    }
},
  "fish_wi_polar_spirit_deity": {
    "shape": "mythic_dragon",
    "colors": {
        "back": "#0e7490",
        "mid": "#06b6d4",
        "belly": "#ecfeff",
        "fin": "#67e8f9",
        "finRay": "#0891b2",
        "accent": "#ffffff",
        "eye": "#cffafe",
        "patternColor": "#ffffff",
        "glow": "#38bdf8"
    },
    "pattern": "frost",
    "features": {
        "horns": true,
        "barbels": true,
        "tailType": "ribbon",
        "wingFins": true,
        "shimmer": true
    }
},
};

/** Tạo spec khi một loài cá chưa có cấu hình riêng hoặc tra cứu theo từ khóa */
export function getFishArtSpec(fish: { id: string; name?: string; rarity?: any; season?: string; [key: string]: any }): FishVisualSpec {
  if (FISH_ART_REGISTRY[fish.id]) return FISH_ART_REGISTRY[fish.id];

  const rar = fish.rarity ?? 'common';
  const name = (fish.name ?? '').toLowerCase();
  const id = fish.id ?? '';

  let shape: FishBodyShape = 'standard';
  if (name.includes('đầu búa') || id.includes('hammer')) {
    shape = 'hammerhead';
  } else if (name.includes('cá voi') || name.includes('hổ kình') || name.includes('linh kình') || id.includes('whale') || id.includes('orca')) {
    shape = 'whale';
  } else if (name.includes('tầm') || id.includes('sturgeon')) {
    shape = 'sturgeon';
  } else if (name.includes('pha lê') || name.includes('băng tinh') || name.includes('lưu ly') || id.includes('crystal')) {
    shape = 'crystal';
  } else if (name.includes('rùa') || name.includes('quy ngư') || id.includes('turtle')) {
    shape = 'turtle_fish';
  } else if (name.includes('buồm') || name.includes('cờ') || name.includes('kiếm') || id.includes('sailfish') || id.includes('sword')) {
    shape = 'swordfish';
  } else if (name.includes('đuối') || name.includes('bơn') || id.includes('ray') || id.includes('manta') || id.includes('flounder')) {
    shape = 'flat';
  } else if (name.includes('lồng đèn') || name.includes('quỷ') || name.includes('bồ nông') || id.includes('angler') || id.includes('gulper')) {
    shape = 'angler';
  } else if (name.includes('nóc') || id.includes('puffer')) {
    shape = 'puffer';
  } else if (name.includes('rồng') || name.includes('long') || name.includes('leviathan') || name.includes('kỳ lân') || name.includes('thần ngư') || name.includes('bá vương')) {
    shape = 'mythic_dragon';
  } else if (name.includes('lóc') || name.includes('chình') || name.includes('lươn') || name.includes('nhồng') || name.includes('chạch') || name.includes('hải tượng') || name.includes('măng')) {
    shape = 'elongated';
  } else if (name.includes('trê') || name.includes('lăng') || name.includes('ngạnh') || name.includes('tra') || name.includes('bống')) {
    shape = 'whiskers';
  } else if (name.includes('đĩa') || name.includes('mặt trăng') || name.includes('sặc') || name.includes('tiên') || name.includes('rô phi') || name.includes('tráp') || name.includes('tai tượng') || name.includes('răng đao')) {
    shape = 'deep';
  } else if (name.includes('hề') || name.includes('sư tử') || name.includes('bướm') || name.includes('betta') || name.includes('chuồn') || name.includes('bảy màu')) {
    shape = 'exotic';
  } else if (name.includes('mập') || name.includes('ngừ')) {
    shape = 'predator';
  }

  // Tùy biến màu theo phẩm cấp
  if (rar === 'mythic') {
    return {
      shape,
      colors: { back: '#831843', mid: '#f43f5e', belly: '#fef2f2', fin: '#fbbf24', finRay: '#e11d48', accent: '#fde047', eye: '#dc2626', patternColor: '#fde047', glow: '#fb7185' },
      pattern: 'gold_armor',
      features: { barbels: true, horns: true, wingFins: true, shimmer: true, tailType: 'ribbon' },
    };
  }
  if (rar === 'legendary') {
    return {
      shape,
      colors: { back: '#92400e', mid: '#f59e0b', belly: '#fffbeb', fin: '#fde047', finRay: '#d97706', accent: '#ffffff', eye: '#ea580c', patternColor: '#fef08a', glow: '#f59e0b' },
      pattern: 'scales',
      features: { barbels: true, wingFins: true, shimmer: true, tailType: 'forked' },
    };
  }
  if (rar === 'epic') {
    return {
      shape,
      colors: { back: '#4c1d95', mid: '#7c3aed', belly: '#faf5ff', fin: '#a78bfa', finRay: '#6d28d9', accent: '#e9d5ff', eye: '#c084fc', patternColor: '#ddd6fe', glow: '#8b5cf6' },
      pattern: 'glow_lines',
      features: { wingFins: true, shimmer: true, tailType: 'ribbon' },
    };
  }
  if (rar === 'rare') {
    return {
      shape,
      colors: { back: '#0369a1', mid: '#0284c7', belly: '#f0f9ff', fin: '#38bdf8', finRay: '#075985', accent: '#e0f2fe', eye: '#38bdf8', patternColor: '#bae6fd' },
      pattern: 'spots',
      features: { tailType: 'forked', shimmer: true },
    };
  }

  return {
    shape,
    colors: { back: '#3f3f46', mid: '#71717a', belly: '#f4f4f5', fin: '#a1a1aa', finRay: '#52525b', accent: '#cbd5e1', eye: '#eab308', patternColor: '#d4d4d8' },
    pattern: 'scales',
    features: { tailType: 'fan' },
  };
}

interface FishVisualProps {
  fish: { id: string; name?: string; rarity?: FishRarity; season?: string; [key: string]: any };
  size?: number;
  width?: number | string;
  height?: number | string;
  animated?: boolean;
  uncaught?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Component hiển thị mỹ thuật cá dạng vector SVG sống động, chi tiết và sắc nét.
 * Hỗ trợ 16 hình thái sinh học đặc sắc: Cá đầu búa, Cá voi beluga, Cá tầm cổ đại,
 * Cá tuyết pha lê, Rồng Băng thần thoại, Cá buồm kiếm, Cá đuối, Cá lồng đèn...
 */
export function FishVisual({
  fish,
  size,
  width,
  height,
  animated = false,
  uncaught = false,
  className = '',
  style = {},
}: FishVisualProps) {
  const spec = getFishArtSpec(fish);
  const w = width ?? size ?? 80;
  const h = height ?? (typeof w === 'number' ? Math.round(w * 0.62) : 'auto');
  const uid = React.useId().replace(/:/g, '');

  if (uncaught) {
    return (
      <svg
        viewBox="0 0 160 100"
        width={w}
        height={h}
        className={`fish-visual uncaught ${className}`}
        style={{ ...style, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
      >
        <path
          d="M 25,50 C 40,25 90,20 130,50 C 90,80 40,75 25,50 Z"
          fill="#1f2937"
          stroke="#374151"
          strokeWidth="2"
        />
        <text x="78" y="56" fill="#9ca3af" fontSize="22" fontWeight="bold" textAnchor="middle">?</text>
      </svg>
    );
  }

  const { shape, colors, pattern, features } = spec;
  const gradId = `grad_${uid}`;
  const finGradId = `fin_grad_${uid}`;
  const patternId = `pat_${uid}`;
  const organGradId = `organ_${uid}`;

  return (
    <svg
      viewBox="0 0 160 100"
      width={w}
      height={h}
      className={`fish-visual ${animated ? 'animated-swim' : ''} ${className}`}
      style={{
        ...style,
        filter: colors.glow ? `drop-shadow(0 0 8px ${colors.glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.5))` : 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
      }}
    >
      <defs>
        {/* Gradient màu thân cá */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.back} />
          <stop offset="48%" stopColor={colors.mid} />
          <stop offset="100%" stopColor={colors.belly} />
        </linearGradient>

        {/* Gradient màu vây */}
        <linearGradient id={finGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.fin} stopOpacity="0.95" />
          <stop offset="100%" stopColor={colors.finRay ?? colors.fin} stopOpacity="0.75" />
        </linearGradient>

        {/* Gradient phát sáng nội tạng cá pha lê */}
        <radialGradient id={organGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="60%" stopColor={colors.glow ?? '#38bdf8'} stopOpacity="0.7" />
          <stop offset="100%" stopColor={colors.mid} stopOpacity="0" />
        </radialGradient>

        {/* Mẫu vảy cá */}
        <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 0,4 Q 4,8 8,4 Q 4,0 0,4" fill="none" stroke={colors.patternColor ?? 'rgba(255,255,255,0.2)'} strokeWidth="0.75" />
        </pattern>
      </defs>

      {/* ==============================================================
          1. SHAPE: HAMMERHEAD (Cá mập đầu búa)
          ============================================================== */}
      {shape === 'hammerhead' && (
        <g>
          {/* Vây lưng chính nhọn sắc bén */}
          <path d="M 64,30 L 78,8 C 82,18 84,26 88,31 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Vây lưng phụ */}
          <path d="M 38,44 L 43,38 L 46,46 Z" fill={`url(#${finGradId})`} />
          {/* Vây bụng */}
          <path d="M 54,58 L 46,68 L 58,62 Z" fill={`url(#${finGradId})`} />
          {/* Vây ngực rẽ sóng */}
          <path d="M 96,56 L 82,76 L 104,62 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Đuôi cá mập dị hình (thùy trên vươn dài) */}
          <path d="M 25,50 L 5,12 C 15,44 14,50 6,76 L 16,58 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          
          {/* Thân cá đầu búa với chiếc đầu búa chữ T (Cephalofoil) vĩ đại */}
          <path
            d="M 25,50 C 45,30 85,28 114,36 C 117,26 122,18 132,18 C 140,18 144,22 144,30 C 141,38 139,48 139,50 C 139,52 141,62 144,70 C 144,78 140,82 132,82 C 122,82 117,74 114,64 C 85,72 45,70 25,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.2"
          />
          {/* Vùng bụng sáng ánh băng/bạc */}
          <path
            d="M 36,53 C 68,70 98,68 114,64 C 117,74 122,82 132,82 C 140,82 144,78 144,70 C 141,62 139,52 139,50 C 120,54 80,60 36,53 Z"
            fill={colors.belly}
            opacity="0.5"
          />
          {/* Khe mang cá mập (4 khe) */}
          <g stroke={colors.accent ?? 'rgba(0,0,0,0.35)'} strokeWidth="1.2" strokeLinecap="round">
            <line x1="98" y1="44" x2="97" y2="56" />
            <line x1="102" y1="44" x2="101" y2="56" />
            <line x1="106" y1="45" x2="105" y2="55" />
            <line x1="110" y1="46" x2="109" y2="54" />
          </g>
          {/* Mõm & Hàm cá mập */}
          <path d="M 130,50 Q 124,50 120,53" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" />
          {/* 2 Mắt đặt trên 2 đầu mút của đầu búa (Hammer lobes) */}
          <circle cx="136" cy="27" r="3.2" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="136" cy="27" r="1.8" fill={colors.eye} />
          <circle cx="136.5" cy="26.5" r="0.8" fill="#ffffff" />
          <circle cx="136" cy="73" r="3.2" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="136" cy="73" r="1.8" fill={colors.eye} />
          <circle cx="136.5" cy="72.5" r="0.8" fill="#ffffff" />
          {/* Tinh thể băng tuyết trên đầu búa nếu là cá tuyết */}
          {pattern === 'frost' && (
            <g stroke="#ffffff" strokeWidth="1.2" opacity="0.85">
              <line x1="72" y1="36" x2="82" y2="36" />
              <line x1="77" y1="31" x2="77" y2="41" />
              <line x1="126" y1="38" x2="134" y2="38" />
              <line x1="130" y1="34" x2="130" y2="42" />
            </g>
          )}
        </g>
      )}

      {/* ==============================================================
          2. SHAPE: WHALE (Cá voi trắng Beluga / Cá hổ kình Orca)
          ============================================================== */}
      {shape === 'whale' && (
        <g>
          {/* Làn sương nước phun từ lỗ thở (Blowhole water spout spray) */}
          <g stroke={colors.accent ?? '#38bdf8'} strokeWidth="1.5" fill="none" opacity="0.85" strokeLinecap="round">
            <path d="M 115,25 Q 112,12 104,8" />
            <path d="M 116,25 Q 118,10 122,5" />
            <path d="M 117,25 Q 124,14 132,10" />
            <circle cx="103" cy="7" r="1.5" fill={colors.accent ?? '#38bdf8'} stroke="none" />
            <circle cx="122" cy="4" r="1.8" fill={colors.accent ?? '#38bdf8'} stroke="none" />
            <circle cx="133" cy="9" r="1.5" fill={colors.accent ?? '#38bdf8'} stroke="none" />
          </g>

          {/* Vây đuôi cá voi nằm ngang (Whale flukes) */}
          <path
            d="M 28,50 C 18,48 8,28 3,26 C 7,42 16,48 18,50 C 16,52 7,58 3,74 C 8,72 18,52 28,50 Z"
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? colors.finRay}
            strokeWidth="1.2"
          />

          {/* Vây lưng cá hổ kình (nếu là Orca) */}
          {features?.isOrca && (
            <path d="M 72,26 L 82,6 C 86,16 88,24 92,27 Z" fill="#09090b" stroke="#ffffff" strokeWidth="0.8" />
          )}

          {/* Thân cá voi uốn lượn với vầng trán tròn nhô cao (Melon forehead) */}
          <path
            d="M 28,50 C 48,28 85,24 115,26 C 128,26 148,32 148,50 C 148,62 136,72 118,74 C 85,78 48,72 28,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.25)'}
            strokeWidth="1.2"
          />

          {/* Nếp gấp cổ họng cá voi (Rorqual throat grooves) */}
          <g stroke={colors.accent ?? 'rgba(0,0,0,0.2)'} strokeWidth="1.2" fill="none" opacity="0.6" strokeLinecap="round">
            <path d="M 116,66 C 102,70 85,70 72,67" />
            <path d="M 120,62 C 106,66 90,66 78,63" />
            <path d="M 124,58 C 112,62 95,62 84,59" />
          </g>

          {/* Bụng trắng mềm mại */}
          <path
            d="M 38,55 C 65,74 95,74 118,74 C 136,72 146,62 144,54 C 125,58 95,62 38,55 Z"
            fill={colors.belly}
            opacity="0.6"
          />

          {/* Mõm cá voi mỉm cười hiền hòa */}
          <path d="M 146,52 C 138,55 130,55 122,52" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.4" strokeLinecap="round" />

          {/* Đốm mắt trắng đặc trưng cá hổ kình */}
          {features?.isOrca && (
            <ellipse cx="118" cy="40" rx="6" ry="3.5" transform="rotate(-15 118 40)" fill="#ffffff" />
          )}

          {/* Vây bơi chèo (Pectoral paddle flipper) */}
          <path
            d="M 94,56 C 82,72 70,84 80,86 C 88,86 96,74 104,60 Z"
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? colors.finRay}
            strokeWidth="1"
          />

          {/* Mắt cá voi thông minh */}
          <circle cx="128" cy="46" r="3" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="128" cy="46" r="1.8" fill={colors.eye} />
          <circle cx="127.5" cy="45.5" r="0.8" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          3. SHAPE: STURGEON (Cá tầm sông băng / Cá tầm gai cổ đại)
          ============================================================== */}
      {shape === 'sturgeon' && (
        <g>
          {/* Vây đuôi cá tầm dị hình cổ xưa */}
          <path
            d="M 25,50 L 5,14 C 14,44 14,50 8,72 L 17,56 Z"
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? colors.finRay}
            strokeWidth="1.2"
          />
          {/* Vây lưng đặt lùi hẳn về phía đuôi */}
          <path d="M 40,40 L 46,26 L 54,38 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Vây hậu môn */}
          <path d="M 44,60 L 38,70 L 50,64 Z" fill={`url(#${finGradId})`} />
          {/* Vây ngực dạng quạt tam giác */}
          <path d="M 95,58 L 80,74 L 102,64 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />

          {/* Thân cá tầm thon dài với mõm nhọn hướng lên (Rostrum) */}
          <path
            d="M 25,50 C 45,34 85,32 118,34 C 130,36 142,38 150,42 C 144,48 135,52 124,54 C 95,68 55,68 25,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.2"
          />

          {/* 5 HÀNG GAI GIÁP XƯƠNG CỔ SINH (Diamond Armored Scutes) */}
          {/* Hàng gai lưng (Dorsal scutes) */}
          <g fill={colors.accent ?? '#fbbf24'} stroke="#ffffff" strokeWidth="0.8">
            <polygon points="50,33 55,25 60,33 55,36" />
            <polygon points="65,31 70,23 75,31 70,34" />
            <polygon points="80,31 85,23 90,31 85,34" />
            <polygon points="95,33 100,25 105,33 100,36" />
            <polygon points="110,34 114,28 118,34 114,37" />
          </g>
          {/* Hàng gai bên hông (Lateral scutes) */}
          <g fill={colors.accent ?? '#fbbf24'} stroke="#ffffff" strokeWidth="0.6" opacity="0.9">
            <polygon points="46,49 51,45 56,49 51,53" />
            <polygon points="60,49 65,45 70,49 65,53" />
            <polygon points="74,49 79,45 84,49 79,53" />
            <polygon points="88,49 93,45 98,49 93,53" />
            <polygon points="102,49 107,45 112,49 107,53" />
            <polygon points="116,49 120,46 124,49 120,52" />
          </g>

          {/* 4 Râu cảm giác trước miệng dưới */}
          <g stroke={colors.accent ?? colors.fin} strokeWidth="1.4" strokeLinecap="round">
            <line x1="136" y1="49" x2="134" y2="60" />
            <line x1="133" y1="50" x2="130" y2="61" />
            <line x1="130" y1="51" x2="126" y2="62" />
            <line x1="127" y1="52" x2="123" y2="61" />
          </g>

          {/* Mắt cá tầm nhỏ */}
          <circle cx="122" cy="42" r="2.8" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="122" cy="42" r="1.6" fill={colors.eye} />
          <circle cx="121.5" cy="41.5" r="0.7" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          4. SHAPE: CRYSTAL (Cá tuyết pha lê / Cá băng tinh trong suốt)
          ============================================================== */}
      {shape === 'crystal' && (
        <g>
          {/* Vây pha lê góc cạnh như mảnh kính vỡ */}
          <path d="M 62,26 L 76,8 L 88,14 L 102,28 Z" fill={`url(#${finGradId})`} stroke="#ffffff" strokeWidth="1" opacity="0.85" />
          <path d="M 25,50 L 5,20 L 14,50 L 5,80 Z" fill={`url(#${finGradId})`} stroke="#ffffff" strokeWidth="1" opacity="0.85" />
          <path d="M 86,56 L 74,78 L 94,62 Z" fill={`url(#${finGradId})`} stroke="#ffffff" strokeWidth="1" opacity="0.85" />

          {/* Thân cá trong suốt như khối ngọc băng */}
          <path
            d="M 25,50 C 45,22 95,20 136,48 C 100,78 45,76 25,50 Z"
            fill={`url(#${gradId})`}
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.82"
          />

          {/* BỘ XƯƠNG PHÁT QUANG NHÌN THẤU BÊN TRONG (Glowing Internal Skeleton) */}
          {/* Xương sống chính (Vertebral column) */}
          <path d="M 32,50 L 124,49" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />
          <path d="M 32,50 L 124,49" stroke={colors.accent ?? '#38bdf8'} strokeWidth="1.2" strokeLinecap="round" />

          {/* Các nan xương sườn phát sáng rực rỡ */}
          <g stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.8" strokeLinecap="round">
            {/* Nan sườn trên */}
            <path d="M 52,50 Q 48,38 44,32" />
            <path d="M 64,50 Q 60,36 54,28" />
            <path d="M 76,50 Q 72,34 66,26" />
            <path d="M 88,50 Q 84,36 78,28" />
            <path d="M 100,50 Q 96,38 90,32" />
            {/* Nan sườn dưới */}
            <path d="M 52,50 Q 48,62 44,68" />
            <path d="M 64,50 Q 60,64 54,72" />
            <path d="M 76,50 Q 72,66 66,74" />
            <path d="M 88,50 Q 84,64 78,72" />
            <path d="M 100,50 Q 96,62 90,68" />
          </g>

          {/* Khối cơ quan phát quang hình cầu trong lồng ngực */}
          <ellipse cx="108" cy="52" rx="7" ry="5" fill={`url(#${organGradId})`} />

          {/* Các mặt cắt tinh thể phản chiếu ánh sáng (Crystal facets) */}
          <g stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" fill="none">
            <path d="M 70,26 L 85,38 L 105,32" />
            <path d="M 65,74 L 82,62 L 102,68" />
          </g>

          {/* Ngôi sao lấp lánh băng tinh (Ice Sparkles) */}
          <g fill="#ffffff">
            <polygon points="75,40 76,37 77,40 80,41 77,42 76,45 75,42 72,41" />
            <polygon points="106,36 107,33 108,36 111,37 108,38 107,41 106,38 103,37" />
          </g>

          {/* Mắt pha lê lung linh */}
          <circle cx="124" cy="45" r="4.2" fill="#ffffff" stroke={colors.eye} strokeWidth="1.2" />
          <circle cx="124" cy="45" r="2.8" fill={colors.eye} />
          <circle cx="124.5" cy="45" r="1.8" fill="#09090b" />
          <circle cx="123.5" cy="44" r="0.9" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          5. SHAPE: MYTHIC DRAGON (Băng Long Thần Ngư / Leviathan / Rồng)
          ============================================================== */}
      {shape === 'mythic_dragon' && (
        <g>
          {/* Vây đuôi rồng dài thướt tha nhiều dải lụa tiên giới */}
          <path
            d="M 18,50 C 8,20 -6,30 2,50 C -6,70 8,80 18,50 Z"
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? '#fbbf24'}
            strokeWidth="1.5"
          />
          <path
            d="M 16,46 C 4,16 -12,24 -4,42 C 4,50 12,50 16,46 Z"
            fill={`url(#${finGradId})`}
            opacity="0.8"
          />
          <path
            d="M 16,54 C 4,84 -12,76 -4,58 C 4,50 12,50 16,54 Z"
            fill={`url(#${finGradId})`}
            opacity="0.8"
          />

          {/* Thân rồng uốn lượn hình chữ S uyển chuyển dũng mãnh */}
          <path
            d="M 18,50 C 32,26 56,66 84,32 C 106,32 128,28 144,44 C 132,64 106,62 82,68 C 56,76 34,66 18,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? '#fbbf24'}
            strokeWidth="1.6"
          />

          {/* Bờm gai rồng / Vây sống lưng răng cưa rực lửa / băng tuyết */}
          <path
            d="M 52,44 L 58,30 L 64,40 L 72,24 L 80,34 L 88,18 L 96,30 L 104,20 L 112,32"
            fill="none"
            stroke={colors.accent ?? '#fbbf24'}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Vây ngực cánh rồng xòe rộng */}
          <path
            d="M 94,52 C 84,68 70,82 82,85 C 92,85 102,70 106,54 Z"
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? '#fbbf24'}
            strokeWidth="1.2"
          />

          {/* Cặp sừng rồng phân nhánh lộng lẫy (Dragon Horns) */}
          <g stroke={colors.accent ?? '#fbbf24'} strokeWidth="2.2" fill="none" strokeLinecap="round">
            <path d="M 124,32 Q 112,10 98,6 Q 106,16 114,24" />
            <path d="M 112,15 Q 102,12 94,14" />
          </g>

          {/* Râu rồng dài phất phơ dập dờn trong sóng nước */}
          <path
            d="M 136,50 Q 112,68 86,62 Q 68,58 52,64"
            fill="none"
            stroke={colors.accent ?? '#fbbf24'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Mắt rồng linh thiêng tỏa sáng */}
          <circle cx="126" cy="40" r="3.8" fill="#ffffff" stroke={colors.eye} strokeWidth="1.2" />
          <circle cx="126" cy="40" r="2.2" fill={colors.eye} />
          <line x1="126" y1="38" x2="126" y2="42" stroke="#09090b" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="125.5" cy="39" r="0.8" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          6. SHAPE: SWORDFISH (Cá buồm / Cá kiếm / Cá cờ đại dương)
          ============================================================== */}
      {shape === 'swordfish' && (
        <g>
          {/* Cánh buồm lưng khổng lồ giương cao (Giant Sailfin) */}
          <path
            d="M 52,32 C 64,4 96,2 118,28 L 115,32 C 95,12 68,14 52,32 Z"
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? colors.finRay}
            strokeWidth="1.4"
          />
          {/* Các tia nan vây buồm */}
          <g stroke={colors.accent ?? '#ffffff'} strokeWidth="0.8" opacity="0.75">
            <line x1="62" y1="28" x2="62" y2="12" />
            <line x1="72" y1="26" x2="72" y2="7" />
            <line x1="82" y1="25" x2="82" y2="5" />
            <line x1="92" y1="26" x2="92" y2="7" />
            <line x1="102" y1="28" x2="102" y2="14" />
          </g>

          {/* Vây đuôi trăng khuyết cứng cáp rẽ sóng thần tốc */}
          <path
            d="M 24,50 L 5,12 C 15,45 15,55 5,88 Z"
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? colors.finRay}
            strokeWidth="1.2"
          />

          {/* Thân cá cờ thon gọn như mũi tên */}
          <path
            d="M 24,50 C 45,30 85,28 134,48 C 85,72 45,70 24,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.2"
          />

          {/* MŨI KIẾM DÀI NHỌN HOẮT (Bill) */}
          <polygon points="134,48 160,50 134,52" fill={colors.back} stroke={colors.accent ?? '#ffffff'} strokeWidth="0.8" />

          {/* Vây ngực và vây bụng hình dải lụa mảnh */}
          <path d="M 94,56 L 82,78 L 102,62 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          <line x1="88" y1="58" x2="72" y2="88" stroke={colors.accent ?? colors.fin} strokeWidth="1.4" strokeLinecap="round" />

          {/* Mắt cá cờ tinh ranh */}
          <circle cx="120" cy="46" r="3.5" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="120" cy="46" r="2.2" fill={colors.eye} />
          <circle cx="119.5" cy="45.5" r="0.8" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          7. SHAPE: ANGLER (Cá lồng đèn / Cá bồ nông đáy vực sâu)
          ============================================================== */}
      {shape === 'angler' && (
        <g>
          {/* Cần đèn phát sáng vươn dài ra trước trán (Illicium) */}
          <path d="M 112,32 C 118,6 142,6 145,22" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
          {/* Vòng hào quang phát sáng (Esca Glow Aura) */}
          <circle cx="145" cy="22" r="10" fill={colors.glow ?? '#38bdf8'} opacity="0.3" />
          <circle cx="145" cy="22" r="5" fill={colors.glow ?? '#38bdf8'} />
          <circle cx="145" cy="22" r="2.2" fill="#ffffff" />

          {/* Vây đuôi quạt tròn */}
          <path d="M 26,50 L 6,30 C 14,50 6,70 6,70 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />

          {/* Thân cá lồng đèn gù lưng, bụng to phệ */}
          <path
            d="M 26,50 C 40,16 85,14 122,34 C 130,42 136,66 120,78 C 85,88 40,84 26,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.4)'}
            strokeWidth="1.2"
          />

          {/* Miệng ngoác rộng khổng lồ với hàm răng kim sắc nhọn ghê rợn */}
          <path d="M 122,50 L 102,58" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
          {/* Răng nanh sắc nhọn */}
          <g stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round">
            <line x1="106" y1="56" x2="108" y2="62" />
            <line x1="112" y1="54" x2="114" y2="63" />
            <line x1="118" y1="52" x2="120" y2="64" />
            <line x1="104" y1="58" x2="106" y2="52" />
            <line x1="110" y1="60" x2="112" y2="51" />
            <line x1="116" y1="62" x2="118" y2="50" />
          </g>

          {/* Mắt cá đáy vực nhỏ và trắng dã */}
          <circle cx="114" cy="38" r="2.8" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="114" cy="38" r="1.4" fill={colors.eye} />
        </g>
      )}

      {/* ==============================================================
          8. SHAPE: FLAT (Cá đuối hoa / Manta ray / Cá bơn)
          ============================================================== */}
      {shape === 'flat' && (
        <g>
          {/* Đuôi roi dài với gai độc sắc bén */}
          <path d="M 48,50 Q 24,50 4,49 L 3,50 L 4,51 Q 24,50 48,50" fill={colors.back} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Gai độc đuôi */}
          <polygon points="26,48 30,46 32,50 28,50" fill="#ffffff" />

          {/* Đôi cánh dẹt hình thoi xòe rộng như cánh diều */}
          <path
            d="M 48,50 C 68,16 102,14 132,48 C 136,50 136,50 132,52 C 102,86 68,84 48,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.4"
          />

          {/* Sừng đầu / Vây đầu của cá đuối Manta */}
          <path d="M 132,44 Q 144,40 142,47" fill="none" stroke={colors.accent ?? colors.fin} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 132,56 Q 144,60 142,53" fill="none" stroke={colors.accent ?? colors.fin} strokeWidth="2.2" strokeLinecap="round" />

          {/* Các đốm sao hoa văn trên lưng cá đuối */}
          <g fill={colors.patternColor ?? '#ffffff'} opacity="0.75">
            <circle cx="70" cy="40" r="2.2" />
            <circle cx="70" cy="60" r="2.2" />
            <circle cx="85" cy="32" r="2.8" />
            <circle cx="85" cy="68" r="2.8" />
            <circle cx="95" cy="45" r="2.5" />
            <circle cx="95" cy="55" r="2.5" />
            <circle cx="110" cy="50" r="3" />
          </g>

          {/* Hai mắt nhô trên lưng cá đuối */}
          <circle cx="118" cy="44" r="2.6" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="118" cy="44" r="1.4" fill={colors.eye} />
          <circle cx="118" cy="56" r="2.6" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="118" cy="56" r="1.4" fill={colors.eye} />
        </g>
      )}

      {/* ==============================================================
          9. SHAPE: TURTLE FISH (Xuân Thủy Linh Quy Ngư)
          ============================================================== */}
      {shape === 'turtle_fish' && (
        <g>
          {/* Đuôi rùa nhỏ */}
          <polygon points="35,50 20,50 32,54" fill={`url(#${finGradId})`} />
          {/* Chân chèo sau */}
          <path d="M 48,54 C 42,66 35,74 42,76 C 48,74 54,64 52,54 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? '#fbbf24'} strokeWidth="1" />
          {/* Chân chèo bơi trước lớn */}
          <path d="M 95,54 C 92,72 82,86 90,88 C 98,86 106,72 104,56 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? '#fbbf24'} strokeWidth="1.2" />

          {/* Đầu rùa thần thoại */}
          <path d="M 115,45 C 125,40 138,42 144,48 C 138,55 125,55 115,52 Z" fill={`url(#${gradId})`} stroke={colors.accent ?? '#fbbf24'} strokeWidth="1.2" />
          {/* Râu cụ rùa */}
          <path d="M 136,52 Q 130,64 122,62" fill="none" stroke={colors.accent ?? '#fbbf24'} strokeWidth="1.5" strokeLinecap="round" />

          {/* Mai rùa mai hoa văn lục giác cổ xưa (Turtle Carapace) */}
          <path
            d="M 35,50 C 45,20 100,20 115,50 C 100,74 45,74 35,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? '#fbbf24'}
            strokeWidth="2"
          />
          {/* Các vảy lục giác trên mai */}
          <g stroke={colors.accent ?? '#fbbf24'} strokeWidth="1.4" fill="none" opacity="0.85">
            <polygon points="65,36 75,30 85,36 85,48 75,54 65,48" />
            <polygon points="85,36 95,30 102,36 102,48 95,54 85,48" />
            <polygon points="48,38 58,32 65,36 65,48 58,52 48,46" />
          </g>

          {/* Mắt rùa hiền từ */}
          <circle cx="132" cy="45" r="2.8" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="132" cy="45" r="1.6" fill={colors.eye} />
          <circle cx="131.5" cy="44.5" r="0.7" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          10. SHAPE: PUFFER (Cá nóc tròn xoe dễ thương)
          ============================================================== */}
      {shape === 'puffer' && (
        <g>
          {/* Vây quạt bé xíu rung rinh */}
          <path d="M 38,50 L 18,38 C 24,50 18,62 18,62 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          <path d="M 52,24 L 60,14 L 66,22 Z" fill={`url(#${finGradId})`} />
          <path d="M 52,76 L 60,86 L 66,78 Z" fill={`url(#${finGradId})`} />
          <path d="M 94,56 C 88,64 82,68 86,72 C 90,70 94,64 98,58 Z" fill={`url(#${finGradId})`} />

          {/* Thân cá nóc phồng to như quả bóng */}
          <ellipse
            cx="80"
            cy="50"
            rx="42"
            ry="32"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.2"
          />

          {/* Bụng phồng trắng béo mầm */}
          <ellipse cx="80" cy="58" rx="36" ry="20" fill={colors.belly} opacity="0.6" />

          {/* Gai cá nóc li ti quanh thân */}
          <g stroke={colors.accent ?? colors.back} strokeWidth="1.4" strokeLinecap="round">
            <line x1="50" y1="26" x2="48" y2="20" />
            <line x1="70" y1="19" x2="70" y2="13" />
            <line x1="90" y1="21" x2="92" y2="15" />
            <line x1="50" y1="74" x2="48" y2="80" />
            <line x1="70" y1="81" x2="70" y2="87" />
            <line x1="90" y1="79" x2="92" y2="85" />
          </g>

          {/* Miệng cá nóc chúm chím */}
          <path d="M 122,50 C 126,48 126,52 122,52" fill="none" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" />

          {/* Mắt cá nóc to tròn long lanh */}
          <circle cx="106" cy="42" r="5.5" fill="#ffffff" stroke={colors.eye} strokeWidth="1.2" />
          <circle cx="106" cy="42" r="3.6" fill={colors.eye} />
          <circle cx="107" cy="42" r="2.4" fill="#09090b" />
          <circle cx="105.2" cy="40.5" r="1.2" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          11. SHAPE: ELONGATED (Cá lóc / Chình / Lươn / Barracuda)
          ============================================================== */}
      {shape === 'elongated' && (
        <g>
          {/* Vây đuôi bầu tròn hoặc vây dải */}
          <path d="M 18,50 L 4,38 C 12,50 4,62 4,62 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Vây lưng dài chạy dọc gần hết chiều dài cơ thể */}
          <path d="M 42,38 C 70,30 115,32 130,42 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          <path d="M 42,62 C 70,70 115,68 130,58 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />

          {/* Thân cá lóc / cá chình thon dài cơ bắp */}
          <path
            d="M 18,50 C 40,34 95,32 142,46 C 144,50 144,52 142,56 C 95,68 40,66 18,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.2"
          />

          {/* Bụng cá */}
          <path d="M 32,54 C 65,64 110,60 140,54 C 110,56 65,58 32,54 Z" fill={colors.belly} opacity="0.5" />

          {/* Hoa văn đốm rằn ri của cá lóc săn mồi */}
          <g fill={colors.patternColor ?? '#1c1917'} opacity="0.6">
            <ellipse cx="50" cy="48" rx="4" ry="2.5" />
            <ellipse cx="68" cy="47" rx="5" ry="3" />
            <ellipse cx="86" cy="48" rx="6" ry="3.5" />
            <ellipse cx="106" cy="49" rx="5" ry="3" />
            <ellipse cx="124" cy="50" rx="4" ry="2.5" />
          </g>

          {/* Vây ngực */}
          <path d="M 96,54 C 88,62 80,66 84,72 C 90,70 96,62 102,56 Z" fill={`url(#${finGradId})`} />

          {/* Mắt cá lóc sắc lẹm dũng mãnh */}
          <circle cx="132" cy="46" r="3.2" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="132" cy="46" r="2" fill={colors.eye} />
          <circle cx="132.5" cy="46" r="1.2" fill="#09090b" />
          <circle cx="131.5" cy="45.5" r="0.7" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          12. SHAPE: WHISKERS (Cá trê / Cá lăng / Cá tra / Bống)
          ============================================================== */}
      {shape === 'whiskers' && (
        <g>
          {/* Vây đuôi cá trê */}
          <path d="M 25,50 L 6,32 C 15,50 6,68 6,68 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Vây lưng ngắn */}
          <path d="M 65,28 C 75,15 88,18 90,30 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Vây hậu môn dài đặc trưng cá trê */}
          <path d="M 32,56 C 50,68 75,68 90,62 Z" fill={`url(#${finGradId})`} />

          {/* Thân cá trê đầu bẹp bè bè */}
          <path
            d="M 25,50 C 42,26 88,24 134,44 C 140,50 140,56 134,60 C 88,78 42,76 25,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.2"
          />

          {/* 4 RÂU DÀI CONG VÚT CỦA CÁ TRÊ / CÁ LĂNG */}
          <g stroke={colors.accent ?? colors.fin} strokeWidth="1.6" fill="none" strokeLinecap="round">
            {/* Râu mép trên dài vươn về phía trước rồi uốn lượn */}
            <path d="M 132,46 Q 148,40 154,48" />
            <path d="M 132,46 Q 142,32 146,36" />
            {/* Râu cằm dưới */}
            <path d="M 130,58 Q 144,68 148,62" />
            <path d="M 130,58 Q 138,72 142,70" />
          </g>

          {/* Vây ngực có ngạnh gai cứng */}
          <path d="M 94,56 L 80,72 L 102,62 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />

          {/* Mắt cá trê nhỏ xíu trên đỉnh đầu */}
          <circle cx="122" cy="40" r="2.5" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="122" cy="40" r="1.5" fill={colors.eye} />
          <circle cx="121.5" cy="39.5" r="0.6" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          13. SHAPE: DEEP (Cá đĩa / Cá mặt trăng / Cá tiên / Rô phi)
          ============================================================== */}
      {shape === 'deep' && (
        <g>
          {/* Vây lưng cao chót vót xòe buồm */}
          <path d="M 48,22 C 68,2 96,6 108,28 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Vây hậu môn cũng mở rộng phía dưới */}
          <path d="M 48,78 C 68,98 96,94 108,72 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Đuôi cá đĩa */}
          <path d="M 25,50 L 8,26 C 16,50 8,74 8,74 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />

          {/* Thân cá đĩa tròn dẹt cao bản */}
          <path
            d="M 25,50 C 40,10 92,10 130,48 C 92,90 40,90 25,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.2"
          />

          {/* Dải sọc đứng ngũ sắc lộng lẫy */}
          <g stroke={colors.patternColor ?? '#18181b'} strokeWidth="2.4" opacity="0.65" strokeLinecap="round">
            <line x1="55" y1="24" x2="55" y2="76" />
            <line x1="72" y1="14" x2="72" y2="86" />
            <line x1="88" y1="14" x2="88" y2="86" />
            <line x1="104" y1="24" x2="104" y2="76" />
          </g>

          {/* Vây bụng dạng sợi tơ dài rủ xuống (như cá thần tiên / cá sặc) */}
          <path d="M 86,66 L 72,96 L 88,68" stroke={colors.accent ?? colors.fin} strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Vây ngực hình quạt trong suốt */}
          <path d="M 88,52 C 78,60 72,66 76,72 C 84,70 90,62 94,54 Z" fill={`url(#${finGradId})`} />

          {/* Mắt cá đĩa tròn to */}
          <circle cx="118" cy="45" r="4.2" fill="#ffffff" stroke={colors.eye} strokeWidth="1.2" />
          <circle cx="118" cy="45" r="2.8" fill={colors.eye} />
          <circle cx="118" cy="45" r="1.8" fill="#09090b" />
          <circle cx="117" cy="44" r="0.8" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          14. SHAPE: EXOTIC (Cá hề / Cá sư tử / Cá xiêm Betta / Chuồn)
          ============================================================== */}
      {shape === 'exotic' && (
        <g>
          {/* Đuôi voan xòe bồng bềnh nhiều lớp tơ lụa */}
          <path
            d="M 25,50 C 10,10 -8,25 0,50 C -8,75 10,90 25,50 Z"
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? colors.finRay}
            strokeWidth="1.4"
          />
          <path
            d="M 22,48 C 6,24 -4,34 2,48 C -4,62 6,72 22,48 Z"
            fill={`url(#${finGradId})`}
            opacity="0.75"
          />

          {/* Vây lưng xếp nếp uốn lượn */}
          <path d="M 45,26 C 60,6 90,8 115,28 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />

          {/* Thân cá cảnh uyển chuyển */}
          <path
            d="M 25,50 C 45,24 95,22 135,50 C 95,78 45,76 25,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.2"
          />

          {/* Hoa văn dải sọc trắng viền đen của Cá Hề (Clownfish) nếu là sọc */}
          {pattern === 'stripes' && (
            <g>
              <path d="M 68,26 C 62,35 62,65 68,74 L 75,72 C 69,63 69,37 75,28 Z" fill="#ffffff" stroke="#18181b" strokeWidth="1" />
              <path d="M 96,28 C 90,36 90,64 96,72 L 103,70 C 97,62 97,38 103,30 Z" fill="#ffffff" stroke="#18181b" strokeWidth="1" />
            </g>
          )}

          {/* Vây ngực dạng cánh tiên xòe rộng */}
          <path
            d="M 88,52 C 74,65 62,72 68,82 C 78,78 88,66 96,56 Z"
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? colors.finRay}
            strokeWidth="1.2"
          />

          {/* Mắt cá cảnh đen láy dễ thương */}
          <circle cx="122" cy="46" r="4.2" fill="#ffffff" stroke={colors.eye} strokeWidth="1.2" />
          <circle cx="122" cy="46" r="2.8" fill={colors.eye} />
          <circle cx="122.5" cy="46" r="1.8" fill="#09090b" />
          <circle cx="121.5" cy="45" r="0.9" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          15. SHAPE: PREDATOR (Cá mập con / Cá ngừ đại dương)
          ============================================================== */}
      {shape === 'predator' && (
        <g>
          {/* Vây lưng cá mập hình lưỡi liềm sắc bén */}
          <path d="M 70,28 L 84,8 C 88,18 89,26 92,30 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          <path d="M 38,44 L 43,38 L 46,46 Z" fill={`url(#${finGradId})`} />
          <path d="M 25,50 L 5,16 C 14,48 14,52 5,84 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />

          {/* Thân cá mập hình thoi ngư lôi tốc độ */}
          <path
            d="M 25,50 C 45,28 95,26 142,48 C 95,74 45,72 25,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.3)'}
            strokeWidth="1.2"
          />

          {/* Bụng cá mập sáng màu */}
          <path d="M 38,54 C 70,72 110,68 142,48 C 110,58 70,62 38,54 Z" fill={colors.belly} opacity="0.5" />

          {/* Khe mang cá mập (5 khe) */}
          <g stroke={colors.accent ?? 'rgba(0,0,0,0.3)'} strokeWidth="1.2" strokeLinecap="round">
            <line x1="100" y1="42" x2="99" y2="56" />
            <line x1="104" y1="42" x2="103" y2="56" />
            <line x1="108" y1="43" x2="107" y2="55" />
            <line x1="112" y1="44" x2="111" y2="54" />
          </g>

          {/* Vây ngực vuốt cong về sau */}
          <path d="M 94,56 L 80,76 L 102,62 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />

          {/* Mắt kẻ săn mồi lạnh lùng */}
          <circle cx="128" cy="44" r="3.2" fill="#ffffff" stroke={colors.eye} strokeWidth="1" />
          <circle cx="128" cy="44" r="2" fill={colors.eye} />
          <circle cx="128.5" cy="44" r="1.2" fill="#09090b" />
          <circle cx="127.5" cy="43.5" r="0.7" fill="#ffffff" />
        </g>
      )}

      {/* ==============================================================
          16. SHAPE: STANDARD (Cá chép / Cá diếc / Cá rô / Cá hồi / Cá than)
          ============================================================== */}
      {shape === 'standard' && (
        <g>
          {/* Vây lưng tự nhiên có tia nan vây */}
          <path d="M 65,26 C 75,10 95,12 105,28 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="1" />
          {/* Vây mỡ cá hồi/than (Adipose fin) nếu có */}
          {features?.adiposeFin && (
            <path d="M 38,36 C 42,32 46,34 44,40 Z" fill={`url(#${finGradId})`} opacity="0.8" />
          )}

          {/* Vây đuôi xòe quạt hoặc chẻ đôi */}
          <path
            d={features?.tailType === 'fan' ? "M 25,50 L 5,30 C 15,50 5,70 5,70 Z" : "M 25,50 L 5,22 C 14,48 14,52 5,78 Z"}
            fill={`url(#${finGradId})`}
            stroke={colors.accent ?? colors.finRay}
            strokeWidth="1"
          />

          {/* Thân cá tự nhiên cân đối hoàn hảo */}
          <path
            d="M 25,50 C 45,22 95,20 135,50 C 95,80 45,78 25,50 Z"
            fill={`url(#${gradId})`}
            stroke={colors.accent ?? 'rgba(0,0,0,0.25)'}
            strokeWidth="1.2"
          />

          {/* Lớp vảy cá óng ánh */}
          {pattern === 'scales' && (
            <path d="M 25,50 C 45,22 95,20 135,50 C 95,80 45,78 25,50 Z" fill={`url(#${patternId})`} opacity="0.45" />
          )}

          {/* Đốm cá hồi / cá than cực bắc */}
          {pattern === 'spots' && (
            <g fill={colors.patternColor ?? '#ea580c'} opacity="0.75">
              <circle cx="55" cy="45" r="2.2" />
              <circle cx="70" cy="40" r="2.6" />
              <circle cx="74" cy="56" r="2" />
              <circle cx="88" cy="46" r="2.8" />
              <circle cx="92" cy="36" r="2" />
              <circle cx="106" cy="44" r="2.4" />
            </g>
          )}

          {/* Sọc cá rô đồng */}
          {pattern === 'stripes' && (
            <g stroke={colors.patternColor ?? '#1a2e05'} strokeWidth="2.4" opacity="0.65" strokeLinecap="round">
              <line x1="60" y1="28" x2="62" y2="72" />
              <line x1="76" y1="24" x2="78" y2="76" />
              <line x1="92" y1="26" x2="94" y2="74" />
              <line x1="108" y1="32" x2="110" y2="68" />
            </g>
          )}

          {/* Đốm cá Koi Calico / Kohaku */}
          {pattern === 'koi_calico' && (
            <g opacity="0.85">
              <path d="M 60,32 C 72,25 85,30 82,45 C 75,52 62,48 60,32 Z" fill="#dc2626" />
              <path d="M 95,30 C 108,28 115,38 110,48 C 102,52 94,44 95,30 Z" fill="#dc2626" />
              <circle cx="72" cy="52" r="3" fill="#18181b" />
              <circle cx="102" cy="42" r="3.5" fill="#18181b" />
            </g>
          )}

          {/* Bụng sáng ánh bạc / đỏ rực cá than */}
          <path d="M 35,55 C 65,78 105,74 135,50 C 105,62 65,65 35,55 Z" fill={colors.belly} opacity="0.55" />

          {/* Nắp mang cá */}
          <path d="M 112,38 C 116,48 116,56 110,64" fill="none" stroke={colors.accent ?? 'rgba(0,0,0,0.3)'} strokeWidth="1.5" strokeLinecap="round" />

          {/* Vây ngực */}
          <path d="M 85,55 C 75,65 65,70 70,78 C 78,74 85,65 92,58 Z" fill={`url(#${finGradId})`} stroke={colors.accent ?? colors.finRay} strokeWidth="0.8" />

          {/* Cặp râu cá chép nếu có */}
          {features?.barbels && (
            <g stroke={colors.accent ?? colors.fin} strokeWidth="1.4" fill="none" strokeLinecap="round">
              <path d="M 132,53 Q 128,66 112,70" />
              <path d="M 134,51 Q 128,42 115,44" />
            </g>
          )}

          {/* Mắt cá chân thật */}
          <circle cx="124" cy="45" r="4.2" fill="#ffffff" stroke={colors.eye} strokeWidth="1.2" />
          <circle cx="124" cy="45" r="2.8" fill={colors.eye} />
          <circle cx="124.5" cy="45" r="1.8" fill="#09090b" />
          <circle cx="123.5" cy="44" r="0.8" fill="#ffffff" />
        </g>
      )}

      {/* Ánh kim lấp lánh (Shimmer sparkle) cho cá hiếm */}
      {features?.shimmer && (
        <g fill="#ffffff" opacity="0.85">
          <polygon points="62,35 63,33 64,35 66,36 64,37 63,39 62,37 60,36" />
          <polygon points="98,32 99,30 100,32 102,33 100,34 99,36 98,34 96,33" />
        </g>
      )}
    </svg>
  );
}
