import sharp from "sharp";

export const enhanceImage = async (
  image: Uint8Array | Buffer,
  threshold: number = 128,
): Promise<Buffer> => {
  const bufferImage = Buffer.from(image);
  const enhancedImage = await sharp(bufferImage)
    .normalize()
    .grayscale()
    .threshold(threshold)
    .png()
    .toBuffer()
    .catch((err) => {
      console.error("Error enhancing image:", err);
      throw err;
    });
  return enhancedImage;
};
