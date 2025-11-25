import React, { useEffect, useState } from 'react';

const MatrixRain: React.FC = () => {
  const [columns, setColumns] = useState<number[]>([]);
  
  useEffect(() => {
    const columnCount = Math.floor(window.innerWidth / 50);
    setColumns(Array.from({ length: columnCount }, (_, i) => i));
    
    const handleResize = () => {
      const newColumnCount = Math.floor(window.innerWidth / 50);
      setColumns(Array.from({ length: newColumnCount }, (_, i) => i));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const generateRandomChars = () => {
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 50; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length)) + '\n';
    }
    return result;
  };
  
  return (
    <div className="matrix-rain fixed inset-0 pointer-events-none opacity-10">
      {columns.map((col) => (
        <div
          key={col}
          className="matrix-rain-column absolute"
          style={{
            left: `${col * 50}px`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        >
          {generateRandomChars()}
        </div>
      ))}
    </div>
  );
};

export default MatrixRain;