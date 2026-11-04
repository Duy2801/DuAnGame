import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { WorldScene } from './WorldScene';

export function PhaserGame() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: ref.current!,
      pixelArt: true,
      backgroundColor: '#1d3a1a',
      banner: false,
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
      input: { activePointers: 3 },
      scene: [WorldScene],
    });
    return () => game.destroy(true);
  }, []);

  return <div ref={ref} className="game-canvas" />;
}
