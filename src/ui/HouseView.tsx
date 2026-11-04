import { useState } from 'react';
import { useGame } from '../store';
import { HouseInteriorView } from './HomeView';
import { PropertyDetail } from './RealtyView';

/** Cửa nhà riêng ở Phố Nhà Vườn: đã mua thì bước thẳng vào nhà, chưa mua thì xem hợp đồng hoặc xem thử nội thất */
export function HouseView({ id }: { id: string }) {
  const owned = useGame((s) => s.game.houses.includes(id));
  const [inside, setInside] = useState(owned);

  if (inside) {
    return (
      <div>
        <div className="row between" style={{ marginBottom: 8 }}>
          <b>🏡 Không Gian Bên Trong Nhà & Nội Thất</b>
          <button className="btn sm ghost" onClick={() => setInside(false)}>
            📋 Xem Thông Tin Sổ Hồng
          </button>
        </div>
        <HouseInteriorView initialHouseId={id} />
      </div>
    );
  }

  return <PropertyDetail id={id} onEnterHouse={() => setInside(true)} />;
}
