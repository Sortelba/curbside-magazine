"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import PostBody from "@/components/PostBody";
import { useEffect } from "react";
import { trackView } from "@/lib/analytics";

interface NewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: any;
}

export default function NewsModal({ isOpen, onClose, post }: NewsModalProps) {

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Beitrag im Fenster geöffnet → wie ein Aufruf der Beitragsseite zählen
    useEffect(() => {
        if (isOpen && post?.id) trackView(`/news/${post.id}/`, post.title);
    }, [isOpen, post?.id, post?.title]);

    if (!post) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl z-50 scrollbar-hide"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-muted rounded-full transition-colors z-[60]"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <PostBody post={post} inModal />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
