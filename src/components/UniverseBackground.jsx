import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, Stethoscope, HardHat, Scale, GraduationCap, 
  Palette, Code, LineChart, Camera, Music,
  Cpu, Globe, Rocket, Monitor, Landmark 
} from 'lucide-react';

const NODES = [
  { id: 0, x: -300, y: -200, Icon: Briefcase, size: 56 },
  { id: 1, x: 220,  y: -280, Icon: Stethoscope, size: 64 },
  { id: 2, x: 350,  y: 80,   Icon: HardHat, size: 56 },
  { id: 3, x: -150, y: 320,  Icon: Scale, size: 64 },
  { id: 4, x: -400, y: 100,  Icon: GraduationCap, size: 56 },
  { id: 5, x: 120,  y: 380,  Icon: Palette, size: 56 },
  { id: 6, x: -80,  y: -380, Icon: Code, size: 64 },
  { id: 7, x: 420,  y: -120, Icon: LineChart, size: 56 },
  { id: 8, x: -220, y: 80,   Icon: Camera, size: 56 },
  { id: 9, x: 180,  y: 150,  Icon: Music, size: 56 },
];

const LINKS = [
  [0, 6], [0, 8], [8, 4], [8, 3], [3, 5], [5, 9], [9, 2], [2, 7], [7, 1], [1, 6],
  [8, 9], [1, 9], [0, 4], [5, 2] 
];

const UNLINKED_NODES = [
  { id: 10, x: -500, y: -300, Icon: Cpu, size: 48 },
  { id: 11, x: 500,  y: 300,  Icon: Globe, size: 56 },
  { id: 12, x: 80,   y: -500, Icon: Rocket, size: 48 },
  { id: 13, x: -450, y: 400,  Icon: Monitor, size: 56 },
  { id: 14, x: 550,  y: -350, Icon: Landmark, size: 48 },
];

function JobConstellation({ fadeOut = false }) {
  const allNodes = [...NODES, ...UNLINKED_NODES];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <motion.div
        animate={fadeOut ? { rotate: 360, scale: 1.4, opacity: 0 } : { rotate: 360 }}
        transition={fadeOut 
          ? { duration: 1.8, ease: "easeIn" }
          : { duration: 300, repeat: Infinity, ease: "linear" }
        }
        className="relative w-[1200px] h-[1200px]"
      >
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="-600 -600 1200 1200">
          {LINKS.map(([i, j], idx) => {
            const n1 = NODES[i];
            const n2 = NODES[j];
            return (
              <motion.line
                key={idx}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="rgba(34, 211, 238, 0.4)"
                strokeWidth="1.5"
                animate={fadeOut ? { opacity: 0 } : { opacity: 1 }}
                transition={fadeOut ? { duration: 0.6, delay: idx * 0.03 } : { duration: 0.5 }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {allNodes.map((node, idx) => {
          // Calculate a scatter direction — push each node outward
          const scatterX = node.x * 0.8;
          const scatterY = node.y * 0.8;

          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: `calc(50% + ${node.x}px)`,
                top: `calc(50% + ${node.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <motion.div
                animate={fadeOut 
                  ? { rotate: -360, opacity: 0, scale: 0.3, x: scatterX, y: scatterY, filter: 'blur(8px)' }
                  : { rotate: -360 }
                }
                transition={fadeOut 
                  ? { duration: 1.2, delay: idx * 0.06, ease: [0.4, 0, 1, 1] }
                  : { duration: 300, repeat: Infinity, ease: "linear" }
                }
                className="flex items-center justify-center rounded-full bg-[#020617] border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                style={{ width: node.size, height: node.size }}
              >
                <node.Icon className="text-cyan-300 w-1/2 h-1/2" />
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

export function UniverseBackground({ fadeOut = false, showConstellation = true } = {}) {
  const stars = useMemo(() => {
    return Array.from({ length: 200 }).map((_, i) => {
      const size = Math.random() * 2 + 1;
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#020617]">
      {/* Deep space radial gradient - dark blue theme */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeIn" }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-black pointer-events-none z-0" 
      />

      {/* Stars */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5, ease: "easeIn" }}
        className="absolute inset-0 z-0"
      >
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-blue-100 pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: [0.1, 0.9, 0.1],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Spinning Universe / Galaxy in the middle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-60 mix-blend-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="relative flex items-center justify-center"
        >
          {/* Inner bright core */}
          <div className="absolute w-32 h-32 bg-blue-500 rounded-full blur-[70px] opacity-70" />
          <div className="absolute w-16 h-16 bg-cyan-300 rounded-full blur-[30px]" />
          
          {/* Rings */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute w-[40rem] h-[40rem] rounded-full border border-blue-400/20 border-t-blue-300/60 shadow-[0_0_50px_rgba(59,130,246,0.1)]" 
          />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute w-[50rem] h-[50rem] rounded-full border border-cyan-400/10 border-b-cyan-300/50" 
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
            className="absolute w-[60rem] h-[60rem] rounded-full border-2 border-dashed border-blue-500/15" 
          />
        </motion.div>
      </div>

      {/* Glowing Nebulae */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ 
          opacity: { duration: 3 },
          x: { duration: 15, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 15, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 15, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute top-1/4 -left-32 w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[130px] pointer-events-none z-0"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          x: [0, -60, 0],
          y: [0, 40, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{ 
          opacity: { duration: 3, delay: 1 },
          x: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 },
          y: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 },
          scale: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }
        }}
        className="absolute bottom-1/4 -right-32 w-[40rem] h-[40rem] bg-cyan-700/15 rounded-full blur-[130px] pointer-events-none z-0"
      />
      
      {/* Grid overlay for a tech feel */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 1 }}
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-0" 
      />

      {/* The Job Constellation — only on auth page */}
      {showConstellation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute inset-0 pointer-events-none z-20"
        >
          <JobConstellation fadeOut={fadeOut} />
        </motion.div>
      )}
    </div>
  );
}
