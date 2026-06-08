import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export function UniverseBackground() {
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
    </div>
  );
}
