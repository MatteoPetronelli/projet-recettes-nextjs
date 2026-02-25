import Image, { ImageProps } from 'next/image';

interface RecipeImageProps extends Omit<ImageProps, 'src'> {
  src: string;
}

export default function RecipeImage({ src, alt, ...props }: RecipeImageProps) {
  const isLocalhost = src.includes('127.0.0.1') || src.includes('localhost');

  return (
    <Image
      src={src}
      alt={alt || "Image de recette"}
      unoptimized={isLocalhost}
      fill
      {...props}
    />
  );
}