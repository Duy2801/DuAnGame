import type Phaser from 'phaser';
import { R, canvas, ellipse, outline, speckle, type Ctx } from './textures';

// Vùng quái hoang dã: nền đấu trường boss, thảm cánh hoa, cây anh đào, đuốc, cỏ hoa, rương báu của boss

const S = 16;

/** tile 45–47: thảm cánh hoa, nền đấu trường, vòng phù văn phát sáng */
export function drawWildTiles(c: Ctx, rnd: () => number) {
  R(c, 45 * S, 0, S, S, '#6fb24a');
  speckle(c, 45 * S, 0, S, S, ['#5fa340'], 8, rnd);
  speckle(c, 45 * S, 0, S, S, ['#ffb8d8', '#ff9ac8', '#ffe0ee'], 9, rnd, [2, 1]);
  for (const i of [46, 47]) {
    const o = i * S;
    R(c, o, 0, S, S, '#4a4658');
    for (const [x, y, w] of [[0, 0, 7], [8, 0, 8], [0, 8, 5], [6, 8, 10]]) {
      R(c, o + x, y, w, 7, '#55516a');
      R(c, o + x, y + 7, w, 1, '#363244');
    }
    speckle(c, o, 0, S, S, ['#3e3a4e'], 6, rnd);
    if (i === 47) {
      // phù văn phát sáng: viên đá tím có hình thoi sáng ở giữa
      R(c, o + 1, 1, 14, 14, '#4a2e78');
      for (let k = 0; k < 6; k++) {
        R(c, o + 8 - k, 2 + k, 1, 1, '#d090ff'); R(c, o + 7 + k, 2 + k, 1, 1, '#d090ff');
        R(c, o + 8 - k, 13 - k, 1, 1, '#d090ff'); R(c, o + 7 + k, 13 - k, 1, 1, '#d090ff');
      }
      R(c, o + 6, 6, 4, 4, '#f4e0ff'); R(c, o + 7, 7, 2, 2, '#ffffff');
    }
  }
}

function drawFlora(scene: Phaser.Scene) {
  canvas(scene, 'sakura', 32, 40, (c) => {
    // Bóng dưới gốc cây
    ellipse(c, 16, 38, 12, 2.5, '#281c1c');
    // Thân cây anh đào uốn lượn phong trần
    R(c, 10, 36, 3, 2, '#42241c'); R(c, 20, 36, 3, 2, '#2d1610');
    for (let y = 20; y <= 37; y++) {
      const taper = y > 34 ? (y - 34) * 0.7 : 0;
      const x0 = Math.round(13 - taper);
      const x1 = Math.round(18 + taper);
      R(c, x0, y, x1 - x0 + 1, 1, '#4a2820');
      R(c, x0, y, 2, 1, '#784436');
      R(c, x1 - 1, y, 2, 1, '#2c1410');
    }
    // Cành cây lớn vươn ra hai bên
    R(c, 10, 23, 4, 2, '#4a2820'); R(c, 8, 21, 3, 2, '#4a2820');
    R(c, 19, 23, 4, 2, '#341a14'); R(c, 22, 21, 3, 2, '#341a14');

    // Tán hoa anh đào bồng bềnh 3D
    ellipse(c, 16, 17, 14, 11, '#b04a74');
    ellipse(c, 21, 18, 7.5, 6, '#be5682');
    ellipse(c, 11, 19, 7, 5.5, '#c9608d');
    ellipse(c, 22, 13, 7.5, 6.5, '#d66e9a');
    ellipse(c, 9, 13, 7.5, 6.5, '#e482ad');
    ellipse(c, 16, 12, 9, 8, '#e482ad');
    ellipse(c, 15, 11, 7.5, 6.5, '#f098be');
    ellipse(c, 11, 7, 6.5, 5.5, '#f8b0cf');
    ellipse(c, 16, 6, 6, 5, '#f8b0cf');
    ellipse(c, 20, 7, 5.5, 4.5, '#e890b8');
    // Búi hoa đón nắng trắng hồng phớt
    ellipse(c, 10, 6, 4.5, 3.5, '#fde6f0');
    ellipse(c, 15, 5, 4, 3, '#fde6f0');
    // Đốm cánh hoa bung nở rực rỡ
    for (const [x, y] of [[7, 12], [13, 6], [21, 9], [25, 14], [10, 20], [18, 19], [14, 13], [17, 3]]) {
      R(c, x, y, 2, 2, '#ffffff');
    }
    // Cánh hoa rơi rải rác dưới gốc
    for (const [x, y] of [[6, 36], [23, 37], [10, 38], [18, 38], [8, 35]]) {
      R(c, x, y, 2, 1, '#f8b0cf');
    }
    outline(c, 32, 40);
  });
  canvas(scene, 'tuft', 16, 16, (c) => {
    for (const [x, h, col] of [[4, 6, '#4f8f35'], [6, 8, '#62a843'], [8, 5, '#4f8f35'], [10, 7, '#6fbf4f'], [12, 4, '#4f8f35']] as const) R(c, x, 16 - h, 1, h, col);
  });
  canvas(scene, 'flower_patch', 16, 16, (c) => {
    for (const [x, y, col] of [[3, 10, '#ff8ab8'], [8, 8, '#fff3a0'], [12, 11, '#9ad0ff'], [6, 13, '#ffffff'], [11, 6, '#ff8ab8']] as const) {
      R(c, x, y + 1, 1, 3, '#3f8f2f');
      R(c, x - 1, y, 3, 1, col); R(c, x, y - 1, 1, 3, col); R(c, x, y, 1, 1, '#f2c230');
    }
  });
  canvas(scene, 'glow_shroom', 16, 16, (c) => {
    for (const [x, y, s] of [[5, 9, 3], [10, 11, 2], [8, 6, 2]] as const) {
      R(c, x, y, 1, 16 - y - 2, '#d8f0e8');
      ellipse(c, x + 0.5, y, s + 0.5, s * 0.7, '#40e8c0');
      R(c, x - 1, y - 1, 1, 1, '#d8fff4');
    }
    outline(c, 16, 16);
  });
  canvas(scene, 'lily', 16, 16, (c) => {
    ellipse(c, 8, 11, 6, 3, '#3f8f3a'); R(c, 8, 9, 3, 2, '#2f6a2a');
    for (const [x, y] of [[6, 9], [8, 8], [10, 9], [8, 10]]) R(c, x, y, 2, 1, '#ffb8d8');
    R(c, 8, 9, 1, 1, '#f2c230');
  });
  canvas(scene, 'starfish', 16, 16, (c) => {
    R(c, 7, 6, 2, 8, '#f08a5a'); R(c, 4, 9, 8, 2, '#f08a5a');
    R(c, 5, 12, 2, 2, '#f08a5a'); R(c, 9, 12, 2, 2, '#f08a5a'); R(c, 7, 9, 2, 2, '#ffd0a0');
    outline(c, 16, 16);
  });
  canvas(scene, 'wisp_lantern', 16, 28, (c) => {
    R(c, 7, 10, 2, 16, '#4a4a58'); R(c, 4, 25, 8, 3, '#3a3a48');
    R(c, 3, 8, 10, 2, '#5a5a6a'); R(c, 4, 1, 8, 2, '#5a5a6a');
    R(c, 5, 3, 6, 5, '#9fc8ff'); R(c, 6, 4, 4, 3, '#e8f4ff');
    outline(c, 16, 28);
  });
}

/** đuốc đấu trường: chậu đá trên cột, lửa theo màu */
function torch(scene: Phaser.Scene, key: string, fire: [string, string, string]) {
  canvas(scene, key, 16, 32, (c) => {
    R(c, 6, 12, 4, 17, '#5a5660'); R(c, 6, 12, 1, 17, '#7a7680');
    R(c, 3, 28, 10, 4, '#4a4650');
    R(c, 2, 9, 12, 4, '#6a6670'); R(c, 3, 12, 10, 1, '#3a3640');
    ellipse(c, 8, 5, 4.5, 5, fire[0]);
    ellipse(c, 8, 6, 3, 3.5, fire[1]);
    R(c, 7, 4, 2, 4, fire[2]); R(c, 8, 0, 1, 3, fire[0]);
    outline(c, 16, 32);
  });
}

function drawLoot(scene: Phaser.Scene) {
  for (const open of [false, true]) {
    canvas(scene, open ? 'chest_open' : 'chest', 24, 22, (c) => {
      R(c, 2, 10, 20, 11, '#8a5a2e'); R(c, 2, 10, 20, 2, '#a8743e');
      R(c, 2, 14, 20, 1, '#5a3a1e');
      for (const x of [2, 20]) R(c, x, 10, 2, 11, '#f2c230');
      if (open) {
        R(c, 3, 2, 18, 6, '#6b4423'); R(c, 3, 2, 18, 1, '#8a5a2e');
        R(c, 4, 8, 16, 3, '#ffe680'); R(c, 7, 7, 4, 2, '#fff6c8'); R(c, 14, 7, 3, 2, '#7fe8ff');
      } else {
        R(c, 2, 4, 20, 7, '#a8743e'); R(c, 3, 3, 18, 2, '#c08a50');
        for (const x of [2, 20]) R(c, x, 4, 2, 7, '#f2c230');
        R(c, 10, 9, 4, 5, '#f2c230'); R(c, 11, 11, 2, 2, '#5a3a1e');
      }
      outline(c, 24, 22);
    });
  }
  canvas(scene, 'petal', 4, 3, (c) => {
    R(c, 0, 1, 4, 1, '#ffb8d8'); R(c, 1, 0, 2, 3, '#ffb8d8'); R(c, 1, 1, 1, 1, '#fff0f6');
  });
}

export function drawWilds(scene: Phaser.Scene) {
  drawFlora(scene);
  torch(scene, 'torch', ['#f08a2a', '#ffd23a', '#fff3b0']);
  torch(scene, 'torch_blue', ['#3a8ad8', '#7fe8ff', '#e0ffff']);
  torch(scene, 'torch_purple', ['#8a3ad8', '#d090ff', '#f4e0ff']);
  drawLoot(scene);
}
