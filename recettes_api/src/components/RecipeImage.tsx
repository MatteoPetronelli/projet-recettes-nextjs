"use client";

import { useState } from "react";

interface RecipeImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function RecipeImage({ src, alt, className }: RecipeImageProps) {
  const fallbackImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
  
  const [imgSrc, setImgSrc] = useState(src || fallbackImage);

  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className={className}
      onError={() => {
        if (imgSrc !== fallbackImage) {
          setImgSrc(fallbackImage);
        }
      }}
    />
  );
}
