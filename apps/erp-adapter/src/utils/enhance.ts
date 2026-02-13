import sharp from "sharp";

export const enhanceImage = async (image: Uint8Array): Promise<Buffer> => {
  const enhancedImage = await sharp(Buffer.from(image))
    .normalize()
    .grayscale()
    .threshold(128)
    .png()
    .toBuffer()
    .catch((err) => {
      console.error("Error enhancing image:", err);
      throw err;
    });
  return enhancedImage;
};
