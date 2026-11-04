import { ITEMS, RANCH_SUPPLIES } from '../game/config/farm';
import { ANIMALS, MAX_ANIMALS } from '../game/config/life';
import { itemCount } from '../game/logic/core';
import { buyFarmSupply } from '../game/logic/farm';
import {
  animalStatus,
  buyAnimal,
  cleanAnimal,
  cureAnimal,
  feedAnimal,
  sellAnimal,
  tendAllAnimals,
  tendAnimal,
  vaccinateAnimal,
} from '../game/logic/life';
import { fmt, fmtTime } from '../game/utils';
import { useGame } from '../store';

export function RanchView() {
  const g = useGame((s) => s.game);
  const now = useGame((s) => s.now);
  const act = useGame((s) => s.act);

  const vaccineCnt = itemCount(g, 'vet_vaccine');
  const medCnt = itemCount(g, 'vet_medicine');
  const feedCnt = itemCount(g, 'animal_feed');

  return (
    <>
      <div className="farm-care-panel">
        <div className="row between">
          <b>🩺 Quy trình chăn nuôi: 💉 Chích ngừa → 🍽️ Cho ăn & uống → 🧹 Vệ sinh chuồng → 🧺 Thu sản phẩm</b>
          <span className="tag">🪙 {fmt(g.gold)}</span>
        </div>
        <div className="farm-supply-bar">
          <span>💉 Vắc-xin phòng dịch: <b>{vaccineCnt}</b></span>
          <span>💊 Thuốc thú y: <b>{medCnt}</b></span>
          <span>🌾 Cám dinh dưỡng: <b>{feedCnt}</b></span>
        </div>
      </div>

      <section className="card">
        <div className="row between">
          <h2>💉 Quầy Thuốc Thú Y & Thức Ăn Chăn Nuôi</h2>
          <span className="muted small">Phòng bệnh hơn chữa bệnh</span>
        </div>
        <div className="list">
          {RANCH_SUPPLIES.map((s) => (
            <div key={s.id} className="shop-item">
              <span className="big-emoji">{s.emoji}</span>
              <div className="grow">
                <b>{s.name}</b> <span className="muted small">đang có {itemCount(g, s.id)}</span>
                <div className="small next">{s.desc}</div>
              </div>
              <div className="shop-buy">
                <button className="btn sm gold" disabled={g.gold < s.price} onClick={() => act((g) => buyFarmSupply(g, s.id, 1))}>
                  🪙{s.price}
                </button>
                <button className="btn sm gold" disabled={g.gold < s.price * 5} onClick={() => act((g) => buyFarmSupply(g, s.id, 5))}>
                  ×5 🪙{s.price * 5}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="row between">
          <h2>🐾 Chuồng Trại & Chăm Sóc ({g.animals.length}/{MAX_ANIMALS})</h2>
          {g.animals.length > 0 && (
            <button className="btn sm gold" onClick={() => act((g, now) => tendAllAnimals(g, now))}>
              🐾 Chăm sóc & Thu hoạch cả chuồng
            </button>
          )}
        </div>
        {g.animals.length === 0 ? (
          <p className="muted">Chưa có vật nuôi nào. Hãy mua gà, cừu, heo hoặc bò sữa bên dưới!</p>
        ) : (
          <div className="list">
            {g.animals.map((a) => {
              const def = ANIMALS[a.kind];
              const st = animalStatus(g, a.uid, now);
              return (
                <div key={a.uid} className="shop-item animal-care-row">
                  <span className="big-emoji">{def.emoji}</span>
                  <div className="grow">
                    <div className="row">
                      <b>{def.name}</b>
                      <span className={`tag sm ${a.sick ? 'err' : 'ok'}`}>
                        {a.sick ? '🤒 Đang ốm' : '❤️ Khoẻ mạnh'}
                      </span>
                      <span className={`tag sm ${a.vaccinated ? 'ok' : ''}`}>
                        {a.vaccinated ? '💉 Đã chích ngừa' : '⚠️ Chưa chích ngừa'}
                      </span>
                      <span className={`tag sm ${a.fed ? 'ok' : ''}`}>
                        {a.fed ? '🍽️ Đã ăn no' : '🍽️ Đang đói'}
                      </span>
                      <span className={`tag sm ${a.clean !== false ? 'ok' : ''}`}>
                        {a.clean !== false ? '🧹 Chuồng sạch' : '🧹 Chuồng bẩn'}
                      </span>
                    </div>
                    <div className="small muted">
                      {st === 'sick'
                        ? '💊 Vật nuôi bị ốm — cần uống Thuốc Thú Y ngay!'
                        : st === 'vaccine'
                          ? '💉 Cần tiêm Vắc-xin phòng dịch trước khi cho ăn'
                          : st === 'hungry'
                            ? `🍽️ Khẩu phần: ${Object.entries(def.feed).map(([id, n]) => `${ITEMS[id].emoji} ${ITEMS[id].name} ×${n}`).join(', ')} (hoặc 🌾 Cám dinh dưỡng)`
                            : st === 'dirty'
                              ? '🧹 Chuồng đang bẩn — cần dọn vệ sinh để vật nuôi lớn'
                              : st === 'ready'
                                ? `🧺 Đã có ${ITEMS[def.product].emoji} ${ITEMS[def.product].name} ×${def.qty} sẵn sàng thu hoạch!`
                                : `⏳ Đang lớn khoẻ mạnh · còn ${fmtTime(a.readyAt - now)}`}
                    </div>
                  </div>
                  <div className="shop-buy">
                    {a.sick && (
                      <button className="btn sm gold" onClick={() => act((g) => cureAnimal(g, a.uid))}>
                        💊 Chữa bệnh
                      </button>
                    )}
                    {!a.vaccinated && (
                      <button className="btn sm" onClick={() => act((g) => vaccinateAnimal(g, a.uid))}>
                        💉 Chích ngừa
                      </button>
                    )}
                    {!a.fed && !a.sick && (
                      <button className="btn sm" onClick={() => act((g, now) => feedAnimal(g, a.uid, now))}>
                        🍽️ Cho ăn
                      </button>
                    )}
                    {a.clean === false && (
                      <button className="btn sm" onClick={() => act((g, now) => cleanAnimal(g, a.uid, now))}>
                        🧹 Dọn chuồng
                      </button>
                    )}
                    {st === 'ready' && (
                      <button className="btn sm gold" onClick={() => act((g, now) => tendAnimal(g, a.uid, now))}>
                        🧺 Thu {ITEMS[def.product].emoji}
                      </button>
                    )}
                    <button
                      className="link-btn"
                      onClick={() => {
                        if (confirm(`Bán ${def.name} với nửa giá?`)) act((g) => sellAnimal(g, a.uid));
                      }}
                    >
                      bán
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <div className="row between">
          <h2>🛒 Mua Giống Vật Nuôi</h2>
          <span className="tag">
            {g.animals.length}/{MAX_ANIMALS} con
          </span>
        </div>
        <div className="list">
          {Object.entries(ANIMALS).map(([kind, a]) => (
            <div key={kind} className="shop-item">
              <span className="big-emoji">{a.emoji}</span>
              <div className="grow">
                <b>{a.name}</b>
                <div className="small next">
                  Cho ra {ITEMS[a.product].emoji} {ITEMS[a.product].name} ×{a.qty} mỗi {fmtTime(a.cycleSec * 1000)}
                </div>
                <div className="small muted">
                  Khẩu phần: {Object.entries(a.feed).map(([id, n]) => `${ITEMS[id].emoji} ${ITEMS[id].name} ×${n}`).join(', ')} (hoặc 🌾 Cám dinh dưỡng)
                </div>
              </div>
              <button className="btn sm gold" disabled={g.gold < a.price || g.animals.length >= MAX_ANIMALS} onClick={() => act((g) => buyAnimal(g, kind))}>
                🪙{fmt(a.price)}
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
