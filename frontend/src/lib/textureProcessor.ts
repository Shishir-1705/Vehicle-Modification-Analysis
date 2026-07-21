/**
 * Utility to crop a specific region from an image URL and return a DataURL.
 * Used to create textures for the 3D inspection engine.
 */
export async function getCroppedTexture(
  imageUrl: string,
  box: { x: number; y: number; w: number; h: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle CORS for remote images
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Set canvas size to the bounding box dimensions
      canvas.width = box.w;
      canvas.height = box.h;

      // Draw the specific region of the image onto the canvas
      // YOLO boxes are [x_center, y_center, width, height]
      // We need to convert to [x_top_left, y_top_left]
      const topLeftX = box.x - box.w / 2;
      const topLeftY = box.y - box.h / 2;

      ctx.drawImage(
        img,
        topLeftX, topLeftY, box.w, box.h, // Source (x, y, w, h)
        0, 0, box.w, box.h               // Destination (x, y, w, h)
      );

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = (err) => reject(err);
  });
}
