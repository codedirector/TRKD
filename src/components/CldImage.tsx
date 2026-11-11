import React from 'react';

export interface CldImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  width?: number | string;
  height?: number | string;
  crop?: string | {
    type?: string;
    source?: boolean;
    aspect_ratio?: string;
    gravity?: string;
  };
  quality?: string | number;
  format?: string;
  cloudName?: string;
  alt?: string;
}

/**
 * Builds an optimized Cloudinary delivery URL with auto-format and auto-quality (f_auto,q_auto)
 * and transformations matching Cloudinary's URL structure.
 */
export function buildCloudinaryUrl(
  src: string,
  options: {
    cloudName?: string;
    width?: number | string;
    height?: number | string;
    crop?: string | { type?: string; source?: boolean; aspect_ratio?: string; gravity?: string };
    quality?: string | number;
    format?: string;
  } = {}
): string {
  // If src is already a full Cloudinary or external URL, handle it
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  const cloudName =
    options.cloudName ||
    (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_CLOUDINARY_CLOUD_NAME) ||
    'demo';

  const transformParts: string[] = ['f_auto', 'q_auto'];

  if (options.width) {
    transformParts.push(`w_${options.width}`);
  }
  if (options.height) {
    transformParts.push(`h_${options.height}`);
  }

  if (options.crop) {
    if (typeof options.crop === 'string') {
      transformParts.push(`c_${options.crop}`);
    } else if (typeof options.crop === 'object') {
      const cropType = options.crop.type || 'auto';
      transformParts.push(`c_${cropType}`);
      if (options.crop.gravity) {
        transformParts.push(`g_${options.crop.gravity}`);
      }
      if (options.crop.aspect_ratio) {
        transformParts.push(`ar_${options.crop.aspect_ratio}`);
      }
    }
  }

  const transformations = transformParts.join(',');
  const cleanPublicId = src.replace(/^\/+/, '');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${cleanPublicId}`;
}

/**
 * CldImage / CloudinaryImage
 * React component compatible with Vite and React for optimized Cloudinary image delivery.
 * Automatically applies auto-format (f_auto) and auto-quality (q_auto) to all delivery URLs.
 */
export const CldImage: React.FC<CldImageProps> = ({
  src,
  width,
  height,
  crop,
  quality,
  format,
  cloudName,
  alt = 'Cloudinary optimized asset',
  className = '',
  ...rest
}) => {
  const [hasError, setHasError] = React.useState(false);

  const deliveryUrl = buildCloudinaryUrl(src, {
    cloudName,
    width,
    height,
    crop,
    quality,
    format,
  });

  return (
    <img
      src={hasError ? `https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_${width || 500},h_${height || 500},c_fill/sample` : deliveryUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      {...rest}
    />
  );
};

export default CldImage;
