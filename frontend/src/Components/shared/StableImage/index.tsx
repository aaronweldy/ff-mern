import type { ImgHTMLAttributes } from "react";

export type StableImageSize =
  | "nav"
  | "logo"
  | "thumbnail"
  | "row"
  | "card"
  | "preview"
  | "inline"
  | "bubble";

type StableImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "height" | "width"
> & {
  size: StableImageSize;
  frameClassName?: string;
};

const sizeAttributes: Record<
  StableImageSize,
  { height: number; width: number }
> = {
  nav: { width: 35, height: 35 },
  logo: { width: 120, height: 120 },
  thumbnail: { width: 50, height: 50 },
  row: { width: 72, height: 72 },
  card: { width: 180, height: 180 },
  preview: { width: 200, height: 200 },
  inline: { width: 32, height: 32 },
  bubble: { width: 32, height: 32 },
};

export const StableImage = ({
  alt = "",
  className = "",
  frameClassName = "",
  size,
  src,
  ...imageProps
}: StableImageProps) => {
  const { height, width } = sizeAttributes[size];
  const frameClasses = [
    "stable-image-frame",
    `stable-image-frame--${size}`,
    frameClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={frameClasses}>
      {src ? (
        <img
          {...imageProps}
          alt={alt}
          className={`stable-image ${className}`.trim()}
          height={height}
          src={src}
          width={width}
        />
      ) : null}
    </span>
  );
};
