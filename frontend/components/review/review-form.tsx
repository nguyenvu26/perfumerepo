'use client';

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import StarRating from './star-rating';
import { Button } from '@/components/ui/button';
import { reviewService } from '@/services/review.service';
import { X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
    productId: string;
    orderItemId: number;
    productName: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ReviewForm: React.FC<ReviewFormProps> = ({
    productId,
    orderItemId,
    productName,
    onSuccess,
    onCancel,
}) => {
    const t = useTranslations('notifications');
    const tReview = useTranslations('review');
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [images, setImages] = useState<{ file?: File, url: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > MAX_IMAGES) {
            toast.error(t('image_limit', { max: MAX_IMAGES }));
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(t('image_size_error', { name: file.name, max: 5 }));
                return false;
            }
            if (!file.type.startsWith('image/')) {
                toast.error(t('image_type_error', { name: file.name }));
                return false;
            }
            return true;
        });

        const newImages = validFiles.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));

        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index: number) => {
        const removed = images[index];
        if (removed.url.startsWith('blob:')) {
            URL.revokeObjectURL(removed.url);
        }
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating < 1) {
            toast.error(t('rating_required'));
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrls: string[] = [];

            if (images.length > 0) {
                setIsUploading(true);
                try {
                    const filesToUpload = images
                        .filter(img => img.file)
                        .map(img => img.file as File);
                    
                    if (filesToUpload.length > 0) {
                        imageUrls = await reviewService.uploadImages(filesToUpload);
                    }
                } catch (error: any) {
                    console.error("Failed to upload images:", error);
                    toast.error(t('image_upload_error'));
                    setIsUploading(false);
                    setIsSubmitting(false);
                    return;
                }
                setIsUploading(false);
            }

            await reviewService.create({
                productId,
                orderItemId,
                rating,
                content,
                images: imageUrls,
            });

            toast.success(t('review_success'));
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || t('review_error'));
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    // Helper for rating description translation
    const getRatingDesc = (r: number) => {
        switch (r) {
            case 5: return tReview('form.rating_desc.excellent');
            case 4: return tReview('form.rating_desc.very_good');
            case 3: return tReview('form.rating_desc.good');
            case 2: return tReview('form.rating_desc.fair');
            case 1: return tReview('form.rating_desc.poor');
            default: return '';
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 border border-black/5 dark:border-white/5 shadow-2xl space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="space-y-3 text-center md:text-left">
                <h3 className="text-3xl font-serif text-foreground italic capitalize tracking-tight">{tReview('form.title')}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[.4em] font-bold opacity-60">{tReview('form.reviewing_label')} <span className="text-gold italic">{productName}</span></p>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground ml-1">{tReview('form.rating_label', { rating })}</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 bg-black/[0.03] dark:bg-white/[0.03] px-8 py-6 rounded-[2.5rem] border border-gold/10 transition-all duration-500 hover:border-gold/20 shadow-sm">
                    <StarRating rating={rating} onChange={setRating} size={36} className="shrink-0" />
                    <span className="text-lg font-serif text-gold italic border-t sm:border-t-0 sm:border-l border-gold/20 pt-4 sm:pt-0 sm:pl-10 min-h-[2rem] flex items-center tracking-wide">
                        {getRatingDesc(rating)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground ml-1">{tReview('form.description_label')}</label>
                        <textarea
                            className="w-full h-44 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 rounded-3xl p-6 text-sm font-serif italic focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all resize-none custom-scrollbar placeholder:text-muted-foreground/50"
                            placeholder={tReview('form.description_placeholder')}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                    </div>

                <div className="space-y-6">
                    <label className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground flex justify-between ml-1">
                        {tReview('form.visual_label')}
                        <span className="text-gold/50">{images.length}/{MAX_IMAGES}</span>
                    </label>

                    <div className="grid grid-cols-3 gap-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-border group shadow-xl hover:scale-95 transition-transform duration-500">
                                <img src={img.url} alt="review" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}

                        {images.length < MAX_IMAGES && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl hover:bg-gold/5 hover:border-gold/30 transition-all group scale-100 hover:scale-95 duration-500"
                            >
                                <ImageIcon className="text-muted-foreground group-hover:text-gold transition-colors duration-700" size={32} />
                                <span className="text-[8px] mt-3 text-muted-foreground uppercase font-bold tracking-widest opacity-60">{tReview('form.add_photo')}</span>
                            </button>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />

                    <div className="p-6 rounded-3xl bg-gold/5 border border-gold/10 flex gap-4 shadow-sm">
                        <AlertCircle size={20} className="text-gold shrink-0 mt-1" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic opacity-90">
                            {tReview('form.visual_desc')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-6 pt-6 border-t border-border/50">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="text-[10px] uppercase font-bold tracking-[.4em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {tReview('form.cancel')}
                    </button>
                )}
                <Button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="rounded-full bg-foreground dark:bg-gold hover:bg-gold/90 text-background dark:text-foreground px-12 h-14 text-[10px] uppercase font-bold tracking-[.4em] shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-500"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                            {tReview('form.sending')}
                        </>
                    ) : isUploading ? (
                        <>
                            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                            {tReview('form.uploading')}
                        </>
                    ) : (
                        tReview('form.submit')
                    )}
                </Button>
            </div>
        </form>
    );
};

export default ReviewForm;
