import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    rating: number;
    max?: number;
    onChange?: (rating: number) => void;
    readOnly?: boolean;
    size?: number;
    className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
    rating,
    max = 5,
    onChange,
    readOnly = false,
    size = 20,
    className,
}) => {
    const [hover, setHover] = React.useState(0);

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {Array.from({ length: max }).map((_, i) => {
                const starValue = i + 1;
                const isActive = starValue <= (hover || rating);
                return (
                    <button
                        key={i}
                        type="button"
                        disabled={readOnly}
                        className={cn(
                            'transition-transform focus:outline-none',
                            !readOnly && 'hover:scale-110 active:scale-95 cursor-pointer',
                            readOnly && 'cursor-default'
                        )}
                        onClick={() => onChange?.(starValue)}
                        onMouseEnter={() => !readOnly && setHover(starValue)}
                        onMouseLeave={() => !readOnly && setHover(0)}
                    >
                        <Star
                            size={size}
                            className={cn(
                                'transition-colors',
                                isActive
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 fill-transparent'
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
