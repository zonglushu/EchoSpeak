/**
 * Confetti - 庆祝动画组件
 *
 * 用于显示彩带动画效果：
 * - 任务完成
 * - 成就解锁
 * - 里程碑达成
 *
 * 特性：
 * - Canvas 渲染（性能优化）
 * - 物理效果（重力、阻力）
 * - 可配置粒子数量和颜色
 * - 自动清理
 *
 * @module components/ui/Confetti
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface ConfettiProps {
  trigger?: boolean;
  particleCount?: number;
  colors?: string[];
  duration?: number;
  className?: string;
}

export const Confetti: React.FC<ConfettiProps> = ({
  trigger = false,
  particleCount = 100,
  colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'],
  duration = 3000,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5, // Upward bias
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    particlesRef.current = particles;

    // Animation loop
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((p) => {
        // Physics
        p.vy += 0.3; // Gravity
        p.vx *= 0.99; // Air resistance
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out
        if (elapsed > duration * 0.7) {
          p.opacity = 1 - (elapsed - duration * 0.7) / (duration * 0.3);
        }

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, particleCount, colors, duration]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[999] ${className}`}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  );
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

/**
 * ConfettiButton - 带庆祝效果的按钮
 */
export interface ConfettiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showConfetti?: boolean;
  confettiOnMount?: boolean;
  children: React.ReactNode;
}

export const ConfettiButton: React.FC<ConfettiButtonProps> = ({
  showConfetti = true,
  confettiOnMount = false,
  children,
  onClick,
  ...props
}) => {
  const [trigger, setTrigger] = React.useState(false);

  useEffect(() => {
    if (confettiOnMount) {
      setTrigger(true);
      const timer = setTimeout(() => setTrigger(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confettiOnMount]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (showConfetti) {
      setTrigger(true);
      setTimeout(() => setTrigger(false), 3000);
    }
    onClick?.(e);
  };

  return (
    <>
      <button onClick={handleClick} {...props}>
        {children}
      </button>
      {trigger && <Confetti trigger={true} />}
    </>
  );
};

/**
 * AchievementPopup - 成就弹窗
 */
export interface AchievementPopupProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({
  title,
  description,
  icon,
  isVisible,
  onClose,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Confetti */}
          <Confetti trigger={true} particleCount={80} />

          {/* Popup */}
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border-2 border-yellow-400 max-w-sm pointer-events-auto"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
                  {icon || '🏆'}
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-4">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-black text-gray-900 dark:text-white mb-2"
                >
                  {title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  {description}
                </motion.p>
              </div>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-2xl transition-colors"
              >
                太棒了！
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Confetti;
