import { useState } from "react";

interface Props {
  rating: number;
  interactive?: boolean;
  onChange?: (newRating: number) => void;
}

export default function StarRating({ rating, interactive = false, onChange }: Props) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = interactive && hoverRating > 0 
            ? star <= hoverRating 
            : star <= rating;

        return (
          <span
            key={star}
            className={`text-2xl transition-colors ${interactive ? "cursor-pointer" : ""}`}
            style={{ color: isFilled ? "#f59e0b" : "#e2e8f0" }}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onChange && onChange(star)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}