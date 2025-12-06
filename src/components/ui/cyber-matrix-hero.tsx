"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// The main hero component
const CyberMatrixHero = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This ensures the code only runs on the client, avoiding SSR issues.
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !gridRef.current) return;
    const grid = gridRef.current;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>/?;:"[]{}\\|!@#$%^&*()_+-=';
    let columns = 0;
    let rows = 0;
    
    const createTile = (index: number) => {
      const tile = document.createElement('div');
      tile.classList.add('tile');
      tile.onclick = (e) => {
        const target = e.target as HTMLElement;
        target.textContent = chars[Math.floor(Math.random() * chars.length)];
        target.classList.add('glitch');
        setTimeout(() => target.classList.remove('glitch'), 200);
      };
      return tile;
    };

    const createTiles = (quantity: number) => {
      Array.from(Array(quantity)).map((_, index) => {
        grid.appendChild(createTile(index));
      });
    };

    const createGrid = () => {
      grid.innerHTML = '';
      const size = 60; // Made tiles smaller for a denser grid
      columns = Math.floor(window.innerWidth / size);
      rows = Math.floor(window.innerHeight / size);
      grid.style.setProperty('--columns', columns.toString());
      grid.style.setProperty('--rows', rows.toString());
      createTiles(columns * rows);
      // Set initial characters
      for (const tile of grid.children) {
        tile.textContent = chars[Math.floor(Math.random() * chars.length)];
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const radius = window.innerWidth / 4;
      for (const tile of grid.children) {
        const rect = tile.getBoundingClientRect();
        const tileX = rect.left + rect.width / 2;
        const tileY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(mouseX - tileX, 2) + Math.pow(mouseY - tileY, 2)
        );
        const intensity = Math.max(0, 1 - distance / radius);
        (tile as HTMLElement).style.setProperty('--intensity', intensity.toString());
      }
    };

    window.addEventListener('resize', createGrid);
    window.addEventListener('mousemove', handleMouseMove);
    createGrid();

    return () => {
      window.removeEventListener('resize', createGrid);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isClient]);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden pointer-events-none z-0">
      {/* Animated Grid Background */}
      <div ref={gridRef} id="tiles"></div>
      <style jsx>{`
        #tiles {
          --intensity: 0;
          display: grid;
          grid-template-columns: repeat(var(--columns), 1fr);
          grid-template-rows: repeat(var(--rows), 1fr);
          width: 100vw;
          height: 100vh;
          position: absolute;
          top: 0;
          left: 0;
        }
        .tile {
          position: relative;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.2rem;
          opacity: calc(0.1 + var(--intensity) * 0.9);
          color: hsl(120, 100%, calc(50% + var(--intensity) * 50%));
          text-shadow: 0 0 calc(var(--intensity) * 15px) hsl(120, 100%, 50%);
          transform: scale(calc(1 + var(--intensity) * 0.2));
          transition: color 0.2s ease, text-shadow 0.2s ease, transform 0.2s ease;
        }
        .tile.glitch {
          animation: glitch-anim 0.2s ease;
        }
        @keyframes glitch-anim {
          0% {
            transform: scale(1);
            color: #0f0;
          }
          50% {
            transform: scale(1.2);
            color: #fff;
            text-shadow: 0 0 10px #fff;
          }
          100% {
            transform: scale(1);
            color: #0f0;
          }
        }
      `}</style>
    </div>
  );
};

export default CyberMatrixHero;

