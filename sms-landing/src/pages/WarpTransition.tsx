import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NeuralBackground from '../components/NeuralBackground';

const WarpTransition: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate to preview after warp animation
    const timer = setTimeout(() => {
      navigate('/preview');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden flex items-center justify-center">
      {/* Neural Background with speed effect */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 20 }}
        transition={{ duration: 3, ease: "easeIn" }}
        className="absolute inset-0"
      >
        <NeuralBackground />
      </motion.div>

      {/* Warp speed lines */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '100px',
            }}
            initial={{ 
              x: 0, 
              opacity: 0,
              scaleX: 0.1
            }}
            animate={{ 
              x: Math.random() > 0.5 ? '100vw' : '-100vw',
              opacity: [0, 1, 0],
              scaleX: [0.1, 20, 40]
            }}
            transition={{ 
              duration: Math.random() * 1 + 0.5,
              delay: Math.random() * 2,
              ease: "easeIn"
            }}
          />
        ))}
      </div>

      {/* Center glow effect */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="w-4 h-4 bg-white rounded-full"
          animate={{
            scale: [1, 50, 100],
            opacity: [1, 0.5, 0]
          }}
          transition={{ duration: 2.5, ease: "easeIn" }}
          style={{
            boxShadow: '0 0 100px 50px rgba(59, 130, 246, 0.8)',
          }}
        />
      </motion.div>

      {/* Status text */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ 
          times: [0, 0.2, 0.8],
          duration: 3 
        }}
      >
        <h2 className="text-2xl font-light text-white tracking-[0.3em]">
          INITIALIZING
        </h2>
        <motion.div className="mt-4 flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Flash effect at the end */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ 
          times: [0, 0.9, 1],
          duration: 3 
        }}
      />
    </div>
  );
};

export default WarpTransition;