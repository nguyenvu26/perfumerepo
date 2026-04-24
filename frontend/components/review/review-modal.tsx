'use client';

import React from 'react';
import { X } from 'lucide-react';
import ReviewForm from './review-form';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    orderItemId: number;
    productName: string;
    onSuccess?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
    isOpen,
    onClose,
    productId,
    orderItemId,
    productName,
    onSuccess,
}) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (typeof document === 'undefined') return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 flex items-center justify-center bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-foreground dark:text-white rounded-full backdrop-blur-md transition-all z-20 hover:rotate-90 active:scale-90 shadow-sm"
                        >
                            <X size={20} />
                        </button>

                        <ReviewForm
                            productId={productId}
                            orderItemId={orderItemId}
                            productName={productName}
                            onCancel={onClose}
                            onSuccess={() => {
                                onSuccess?.();
                                onClose();
                            }}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default ReviewModal;
