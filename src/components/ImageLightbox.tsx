import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, onClose, imageSrc, imageAlt }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
          />

          {/* Lightbox */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-7xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 text-white hover:text-sms-neonBlue transition-colors p-2 bg-sms-deepBlue/50 rounded-lg border border-sms-electricBlue/30 hover:border-sms-neonBlue/50"
              >
                <FiX className="text-2xl" />
              </button>

              {/* Image */}
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-auto rounded-lg border-2 border-sms-electricBlue/30 shadow-2xl"
                style={{ maxHeight: '90vh', objectFit: 'contain' }}
              />

              {/* Image Caption */}
              <p className="text-center text-sms-lightGray mt-4 text-sm">{imageAlt}</p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
