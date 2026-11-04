import { useEffect, useState } from 'react';
import { HOUSE_BY_ID, TOWER_BY_ID } from '../game/config/life';
import { plant } from '../game/logic/farm';
import { useGame } from '../store';
import { bus, type FishingRequest, type PanelId } from '../world/bus';
import { BountyView } from './BountyView';
import { ChestView } from './ChestView';
import { closeChest, useChest } from '../services/fishingApi';
import { BuildView } from './BuildView';
import { CharacterView } from './CharacterView';
import { DialogBox } from './DialogBox';
import { FishingGame } from './FishingGame';
import { KiteGame } from './KiteGame';
import { FishRankView } from './FishRankView';
import { InventoryView } from './InventoryView';
import { GuildView } from './GuildView';
import { HomeView } from './HomeView';
import { HouseView } from './HouseView';
import { MarketView } from './MarketView';
import { MineView } from './MineView';
import { QuestsView } from './QuestsView';
import { RanchView } from './RanchView';
import { RankView } from './RankView';
import { RealtyView, TowerView } from './RealtyView';
import { SeedPicker } from './SeedPicker';
import { FishingShop } from './FishingShopView';
import { FishBagView } from './FishBagView';
import { ArmorShop, PotionShop, SeedShop, WeaponShop } from './ShopView';
import { KiteShop } from './KiteShopView';
import { FashionShop, HatShop, JewelryShop, PetShop, WingShop } from './GachaShopView';
import { BakeryView, WheelView } from './MallView';
import { SmithView } from './SmithView';
import { WorldMapView } from './WorldMapView';
import { GiftcodeView } from './GiftcodeView';

const PANELS: Record<Exclude<PanelId, 'map'>, { title: string; view: () => JSX.Element; wide?: boolean }> = {
  guild: { title: '⚔️ Hội Mạo Hiểm Giả', view: GuildView },
  bounty: { title: '📋 Quầy Nhiệm Vụ Săn Quái', view: BountyView },
  weapons: { title: '⚔️ Điện Thần Binh · Hộp Quà Vũ Khí Random', view: WeaponShop, wide: true },
  armor: { title: '🛡️ Tiệm Giáp & Phụ Kiện', view: ArmorShop },
  potions: { title: '🧪 Tiệm Thuốc', view: PotionShop },
  smith: { title: '🔨 Lò Rèn', view: SmithView },
  market: { title: '🏪 Chợ & Bảng Đơn Hàng', view: MarketView },
  seeds: { title: '🌱 Tiệm Hạt Giống · Hoa Quả & Phân Bón', view: SeedShop, wide: true },
  ranch: { title: '🐄 Trang Trại & Trạm Thú Y Bác Tư', view: RanchView, wide: true },
  build: { title: '🏗️ Xưởng Xây Dựng', view: BuildView },
  home: { title: '🏠 Nhà bạn', view: HomeView },
  quests: { title: '📜 Nhiệm vụ · Thành tựu · Quà', view: QuestsView },
  rank: { title: '🏆 Tượng Vinh Danh', view: RankView },
  character: { title: '👤 Nhân Vật & Danh Hiệu', view: CharacterView },
  fishing: { title: '🎣 Tiệm Câu Cá Ông Năm', view: FishingShop, wide: true },
  fishrank: { title: '🏆 Bảng Top Câu Cá', view: FishRankView },
  inventory: { title: '🎒 Hành trang', view: InventoryView, wide: true },
  kites: { title: '🪁 Tiệm Diều', view: KiteShop, wide: true },
  wings: { title: '🪽 Tiệm Cánh', view: WingShop, wide: true },
  pets: { title: '🐾 Tiệm Thú Cưng', view: PetShop, wide: true },
  fashion: { title: '👗 Tiệm Thời Trang', view: FashionShop, wide: true },
  hats: { title: '🎩 Tiệm Mũ Nón', view: HatShop, wide: true },
  jewelry: { title: '💍 Tiệm Trang Sức', view: JewelryShop, wide: true },
  bakery: { title: '🍰 Tiệm Bánh & Cà Phê', view: BakeryView, wide: true },
  wheel: { title: '🎡 Vòng Quay May Mắn', view: WheelView },
  mine: { title: '⛏️ Hang Mỏ Đá Ngầm', view: MineView },
  album: { title: '📖 Sổ Tay Sưu Tầm', view: QuestsView },
  realty: { title: '🏙️ Sàn Bất Động Sản', view: RealtyView, wide: true },
  giftcode: { title: '🎁 Nhập Mã Quà Tặng (Giftcode)', view: GiftcodeView },
  fishbag: { title: '🐟 Kho Cá & Cẩm Nang 6 Vùng Câu', view: FishBagView, wide: true },
};

/** Mọi cửa sổ mở ra khi nhân vật tương tác — khi có cửa sổ, thế giới tạm dừng */
export function PanelHost() {
  const act = useGame((s) => s.act);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [seedPlot, setSeedPlot] = useState<number | null>(null);
  const [house, setHouse] = useState<string | null>(null);
  const [tower, setTower] = useState<string | null>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const [fishing, setFishing] = useState<FishingRequest | null>(null);
  const [kite, setKite] = useState<string | null>(null);
  const chest = useChest((s) => s.open);
  const open = panel !== null || seedPlot !== null || house !== null || tower !== null || dialog !== null || fishing !== null || kite !== null || chest;

  useEffect(() => {
    const offs = [
      bus.on('panel', (p) => {
        setDialog(null);
        setPanel(p);
      }),
      bus.on('seed', setSeedPlot),
      bus.on('house', setHouse),
      bus.on('tower', setTower),
      bus.on('dialog', setDialog),
      bus.on('fishing', setFishing),
      bus.on('kite', setKite),
    ];
    return () => offs.forEach((o) => o());
  }, []);

  useEffect(() => {
    bus.emit('pause', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || fishing || kite) return;
      if (useChest.getState().open) {
        closeChest();
        return;
      }
      setPanel(null);
      setSeedPlot(null);
      setHouse(null);
      setTower(null);
      setDialog(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, fishing, kite]);

  const frame = (title: string, body: JSX.Element, close: () => void, wide = false) => (
    <div className="panel-backdrop" onClick={close}>
      <div className={`panel ${wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={close} aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="panel-body">{body}</div>
      </div>
    </div>
  );

  const closePanel = () => setPanel(null);
  let panelEl: JSX.Element | null = null;
  if (panel === 'map') panelEl = frame('🗺️ Bản đồ thế giới', <WorldMapView onClose={closePanel} />, closePanel, true);
  else if (panel) {
    const P = PANELS[panel];
    panelEl = frame(P.title, <P.view />, closePanel, P.wide);
  }

  return (
    <>
      {panelEl}
      {chest && frame('🧰 Rương đồ', <ChestView />, closeChest, true)}
      {tower && frame(`${TOWER_BY_ID[tower].emoji} ${TOWER_BY_ID[tower].name}`, <TowerView id={tower} />, () => setTower(null), true)}
      {house && frame(`${HOUSE_BY_ID[house].emoji} ${HOUSE_BY_ID[house].name}`, <HouseView id={house} />, () => setHouse(null))}
      {dialog && <DialogBox npcId={dialog} onClose={() => setDialog(null)} />}
      {fishing && (
        <FishingGame
          req={fishing}
          onClose={() => {
            setFishing(null);
            bus.emit('fishfx', { type: 'end' });
          }}
        />
      )}
      {kite && <KiteGame kiteId={kite} onClose={() => setKite(null)} />}
      {seedPlot !== null && (
        <SeedPicker
          plotIndex={seedPlot}
          onClose={() => setSeedPlot(null)}
          onPick={(cropId, fert) => {
            if (act((g, now) => plant(g, seedPlot, cropId, now, fert))) {
              bus.emit('planted', seedPlot);
              setSeedPlot(null);
            }
          }}
        />
      )}
    </>
  );
}
