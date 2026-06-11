// Globe.jsx — CSS 3D orbital globe component with centre node and orbiting match nodes
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import './Globe.css';

/**
 * Get initials from a name string
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get score class name based on match score
 */
function getScoreClass(score) {
  if (score >= 0.8) return 'globe-orbit-node--score-high';
  if (score >= 0.5) return 'globe-orbit-node--score-mid';
  return 'globe-orbit-node--score-low';
}

/**
 * CentreNode — the logged-in user at the centre of the globe
 */
function CentreNode({ profile, role }) {
  const initials = getInitials(profile?.full_name);
  const isCandidate = role === 'candidate';

  return (
    <motion.div
      className="globe-centre"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="globe-centre__avatar">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name} />
        ) : (
          initials
        )}
      </div>
      <span className="globe-centre__name">
        {isCandidate
          ? profile?.full_name || 'You'
          : profile?.headline?.split('·')[0]?.trim() || 'Your Role'}
      </span>
      <span className="globe-centre__badge">
        {isCandidate ? 'You' : 'Hiring'}
      </span>
    </motion.div>
  );
}

/**
 * OrbitNode — a single orbiting node representing a job or candidate match
 */
function OrbitNode({ node, onNodeClick, stageSize, index }) {
  const cx = stageSize / 2;
  const cy = stageSize / 2;
  
  // Distribute across 3 rings
  const ringIndex = index % 3;
  // Radii for the 3 rings
  const radii = [stageSize * 0.22, stageSize * 0.36, stageSize * 0.50];
  const radius = radii[ringIndex];
  
  // Use the angle from data, but add some offset based on index so they don't overlap if same ring
  const angleRad = ((node.angle + (ringIndex * 30)) * Math.PI) / 180;

  const x = cx + radius * Math.cos(angleRad);
  const y = cy + radius * Math.sin(angleRad);

  const scoreClass = getScoreClass(node.matchScore);
  const ringClass = `globe-orbit-node--ring${ringIndex + 1}`;
  const scorePercent = Math.round(node.matchScore * 100);

  // Stagger delay: centre fades in at 0.3s, each node adds 150ms
  const enterDelay = 0.4 + index * 0.15;

  return (
    <motion.div
      className={`globe-orbit-node ${ringClass} ${scoreClass}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      initial={{ opacity: 0, scale: 0, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{
        duration: 0.5,
        delay: enterDelay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      onClick={() => onNodeClick(node)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onNodeClick(node);
      }}
      aria-label={`${node.label} — ${scorePercent}% match`}
    >
      <div className="globe-orbit-node__inner">
        <div className="globe-orbit-node__circle">
          {getInitials(node.label)}
          <span className="globe-orbit-node__score">{scorePercent}</span>
        </div>
        <span className="globe-orbit-node__label">{node.label}</span>
        {node.sublabel && (
          <span className="globe-orbit-node__sublabel">{node.sublabel}</span>
        )}
        {node.matchReason && (
          <div className="globe-orbit-node__tooltip">{node.matchReason}</div>
        )}
      </div>
    </motion.div>
  );
}

export default function Globe({ nodes = [], profile, role, onNodeClick, loading }) {
  const stageSize = 650; // Increased size to match the spacious feel of the image

  if (loading) {
    return (
      <div className="globe-scene">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="text-sm text-white/50 tracking-wide">
            Discovering matches…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="globe-scene">
      <div className="globe-stage" style={{ width: stageSize, height: stageSize }}>
        {/* Decorative orbit ring traces — fade in softly */}
        <motion.div
          className="globe-ring-trace globe-ring-trace--1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.div
          className="globe-ring-trace globe-ring-trace--2"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.div
          className="globe-ring-trace globe-ring-trace--3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />

        {/* Centre user node */}
        <CentreNode profile={profile} role={role} />

        {/* Orbiting match nodes — staggered fade-in */}
        {nodes.map((node, index) => (
          <OrbitNode
            key={node.id}
            node={node}
            index={index}
            onNodeClick={onNodeClick}
            stageSize={stageSize}
          />
        ))}
      </div>
    </div>
  );
}
