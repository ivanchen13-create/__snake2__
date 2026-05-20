/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Trophy, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// 遊戲常數
const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const INITIAL_SPEED = 150; // 毫秒
const MIN_SPEED = 60;
const SPEED_INCREMENT = 2;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 遊戲狀態 (使用 Ref 避免 React 閉包陷阱與頻繁重新渲染)
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const isGameOverRef = useRef(false);
  const isPausedRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  
  // UI 狀態
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 隨機生成食物
  const generateFood = useCallback(() => {
    const cols = CANVAS_WIDTH / GRID_SIZE;
    const rows = CANVAS_HEIGHT / GRID_SIZE;
    let newFood: Point;
    
    // 確保食物不會生在蛇身上
    do {
      newFood = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    } while (snakeRef.current.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    foodRef.current = newFood;
  }, []);

  // 重新開始遊戲
  const resetGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    isGameOverRef.current = false;
    isPausedRef.current = false;
    lastUpdateTimeRef.current = 0;
    
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    generateFood();
  }, [generateFood]);

  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      if (key === 'ArrowUp' && directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
      if (key === 'ArrowDown' && directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
      if (key === 'ArrowLeft' && directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
      if (key === 'ArrowRight' && directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
      if (key === ' ' || key === 'p' || key === 'P') {
        isPausedRef.current = !isPausedRef.current;
        setIsPaused(isPausedRef.current);
      }
      if (key === 'Enter' && isGameOverRef.current) {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame]);

  // 遊戲邏輯更新
  const update = useCallback(() => {
    if (isGameOverRef.current || isPausedRef.current) return;

    directionRef.current = nextDirectionRef.current;
    const head = { ...snakeRef.current[0] };

    switch (directionRef.current) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // 檢查壁面碰撞
    const cols = CANVAS_WIDTH / GRID_SIZE;
    const rows = CANVAS_HEIGHT / GRID_SIZE;
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      return;
    }

    // 檢查自身碰撞
    if (snakeRef.current.some(segment => segment.x === head.x && segment.y === head.y)) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      return;
    }

    // 移動蛇頭
    const newSnake = [head, ...snakeRef.current];

    // 檢查是否吃到食物
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
        localStorage.setItem('snake-high-score', scoreRef.current.toString());
      }
      generateFood();
      // 增加難度
      speedRef.current = Math.max(MIN_SPEED, INITIAL_SPEED - Math.floor(scoreRef.current / 50) * SPEED_INCREMENT);
    } else {
      newSnake.pop(); // 移除蛇尾
    }

    snakeRef.current = newSnake;
  }, [generateFood, highScore]);

  // 繪製
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // 清除背景
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 繪製格線 (選配，稍微暗一點)
    ctx.strokeStyle = '#1e293b'; // Slate 800
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // 繪製食物
    ctx.fillStyle = '#f43f5e'; // Rose 500
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f43f5e';
    ctx.beginPath();
    ctx.arc(
      foodRef.current.x * GRID_SIZE + GRID_SIZE / 2,
      foodRef.current.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // 繪製蛇
    snakeRef.current.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#10b981' : '#34d399'; // Emerald 500 : 400
      
      if (isHead) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
      }

      // 圓角矩形
      const radius = 4;
      const x = segment.x * GRID_SIZE + 1;
      const y = segment.y * GRID_SIZE + 1;
      const size = GRID_SIZE - 2;

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + size, y, x + size, y + size, radius);
      ctx.arcTo(x + size, y + size, x, y + size, radius);
      ctx.arcTo(x, y + size, x, y, radius);
      ctx.arcTo(x, y, x + size, y, radius);
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowBlur = 0;
    });

    // 暫停畫面遮罩
    if (isPausedRef.current && !isGameOverRef.current) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }, []);

  // 遊戲迴圈
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let requestId: number;

    const loop = (timestamp: number) => {
      if (!lastUpdateTimeRef.current) lastUpdateTimeRef.current = timestamp;
      const elapsed = timestamp - lastUpdateTimeRef.current;

      if (elapsed > speedRef.current) {
        update();
        lastUpdateTimeRef.current = timestamp;
      }

      draw(ctx);
      requestId = requestAnimationFrame(loop);
    };

    requestId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestId);
  }, [update, draw]);

  return (
    <div className="min-h-screen bg-[#010409] flex items-center justify-center font-mono selection:bg-emerald-500/30 p-4">
      {/* Main Container - Geometric Balance Concept */}
      <div className="w-[1024px] h-[768px] bg-[#0A0C10] flex flex-col overflow-hidden border-4 border-[#1F2937] shadow-2xl relative">
        
        {/* Header Navigation Bar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#1F2937] bg-[#0D1117] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
            <h1 className="text-xl font-bold tracking-tighter text-slate-100 uppercase">
              CyberSnake <span className="text-emerald-500 opacity-60">v2.0.4</span>
            </h1>
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest text-slate-400">
            <div className="flex flex-col items-end">
              <span className="opacity-50">系統模式</span>
              <span className="text-emerald-400 font-bold text-xs">動態反應</span>
            </div>
            <div className="flex flex-col items-end border-l border-slate-800 pl-8">
              <span className="opacity-50">系統狀態</span>
              <span className={`font-bold text-xs ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isPaused ? '已暫停運作' : '最佳效率'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex min-h-0">
          {/* Left Sidebar: Stats & Info */}
          <aside className="w-64 border-r border-[#1F2937] bg-[#0D1117] flex flex-col p-6 flex-shrink-0 overflow-y-auto">
            <div className="space-y-8">
              <section>
                <h3 className="text-[10px] text-slate-500 uppercase mb-4 tracking-[0.2em] border-l-2 border-emerald-500 pl-2">遠端測量</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-400">目前得分</span>
                    <span className="text-2xl font-bold text-white leading-none">{score.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1 bg-[#1F2937]">
                    <motion.div 
                      className="h-full bg-emerald-500" 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (score / (highScore || 100)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-400">本局最高</span>
                    <span className="text-lg text-slate-300 leading-none">{highScore.toLocaleString()}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] text-slate-500 uppercase mb-4 tracking-[0.2em] border-l-2 border-cyan-500 pl-2">蛇體參數</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-[#161B22] p-3 border border-[#1F2937]">
                    <div className="text-[9px] text-slate-500 mb-1">單位長度</div>
                    <div className="text-sm text-slate-200">{snakeRef.current.length} 節</div>
                  </div>
                  <div className="bg-[#161B22] p-3 border border-[#1F2937]">
                    <div className="text-[9px] text-slate-500 mb-1">時脈速度</div>
                    <div className="text-sm text-slate-200">{speedRef.current}ms / 週期</div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] text-slate-500 uppercase mb-4 tracking-[0.2em] border-l-2 border-slate-700 pl-2">按鍵對應</h3>
                <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
                  <div className={`col-start-2 border p-1 aspect-square flex items-center justify-center text-[10px] ${directionRef.current === 'UP' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-slate-800 text-slate-600'}`}>↑</div>
                  <div className={`col-start-1 border p-1 aspect-square flex items-center justify-center text-[10px] ${directionRef.current === 'LEFT' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-slate-800 text-slate-600'}`}>←</div>
                  <div className={`border p-1 aspect-square flex items-center justify-center text-[10px] ${directionRef.current === 'DOWN' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-slate-800 text-slate-600'}`}>↓</div>
                  <div className={`border p-1 aspect-square flex items-center justify-center text-[10px] ${directionRef.current === 'RIGHT' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-slate-800 text-slate-600'}`}>→</div>
                </div>
              </section>
            </div>
            
            <div className="mt-auto pt-6 space-y-2">
              <button 
                onClick={() => {
                  isPausedRef.current = !isPausedRef.current;
                  setIsPaused(isPausedRef.current);
                }}
                className="w-full py-3 bg-[#1F2937] border border-[#374151] text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {isPaused ? '恢復核心運作' : '暫停核心運作'}
              </button>
              <button 
                onClick={resetGame}
                className="w-full py-3 bg-red-500/5 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                id="reset-button"
              >
                重設序列
              </button>
            </div>
          </aside>

          {/* Main Game Section */}
          <section className="flex-1 bg-[#010409] flex items-center justify-center relative p-8">
            {/* Viewport Frame */}
            <div className="relative border-2 border-[#1F2937] shadow-[0_0_50px_rgba(0,0,0,0.4)] bg-[#0A0C10] overflow-hidden">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="block"
                id="game-canvas"
              />
              
              {/* Scanline Effect Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                   style={{ background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 4px' }}></div>

              {/* Game Over Screen */}
              <AnimatePresence>
                {isGameOver && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0D1117]/95 flex flex-col items-center justify-center z-20 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-center p-8 border border-red-500/30 bg-red-500/5"
                    >
                      <h2 className="text-5xl font-black mb-1 text-red-500 uppercase italic tracking-tighter">核心已停止</h2>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-8">偵測到致命碰撞</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[#161B22] p-4 border border-[#1F2937]">
                          <div className="text-[9px] text-slate-500 mb-1">最終得分</div>
                          <div className="text-xl font-bold text-white">{score}</div>
                        </div>
                        <div className="bg-[#161B22] p-4 border border-[#1F2937]">
                          <div className="text-[9px] text-slate-500 mb-1">網格座標 X</div>
                          <div className="text-xl font-bold text-white">{snakeRef.current[0].x}</div>
                        </div>
                      </div>

                      <button
                        onClick={resetGame}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-3 font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                        id="restart-button-center"
                      >
                        重新初始化
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Coordinate HUD overlay */}
            <div className="absolute top-12 left-12 text-[9px] text-emerald-500/40 space-y-1 font-mono">
              <div>X_步進: {snakeRef.current[0].x.toFixed(3)}</div>
              <div>Y_步進: {snakeRef.current[0].y.toFixed(3)}</div>
              <div>向量: [{directionRef.current === 'UP' ? '0, -1' : directionRef.current === 'DOWN' ? '0, 1' : directionRef.current === 'LEFT' ? '-1, 0' : '1, 0'}]</div>
            </div>
            
            <div className="absolute bottom-12 right-12 text-[9px] text-slate-600 text-right space-y-1 uppercase font-mono">
              <div>記憶體: 1024kb</div>
              <div>執行緒: 啟動中</div>
              <div>環境: 穩定</div>
            </div>
          </section>
        </main>

        {/* Status Footer */}
        <footer className="h-10 bg-[#0D1117] border-t border-[#1F2937] flex items-center px-8 justify-between text-[9px] text-slate-500 tracking-wider flex-shrink-0">
          <div className="flex gap-6 uppercase">
            <span>React 引擎: 19.0.1</span>
            <span className="opacity-30">|</span>
            <span>Canvas API: 硬體加速</span>
            <span className="opacity-30">|</span>
            <span>狀態緩衝: 正常運作</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> 系統運作中</span>
            <span className="opacity-30">|</span>
            <span className="opacity-60">由 NEON-SYSTEMS 設計</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
