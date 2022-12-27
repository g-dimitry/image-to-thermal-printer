import { Buffer } from "buffer";
import Jimp from "jimp";
import BufferHelper from "./buffer-helper.mjs";
import sharp from 'sharp';

export async function imageToPOSFormat(targetPath, threshold) {
  let bytes = new BufferHelper();

  try {
    // need to find other solution cause jimp is not working in RN
    await sharp(targetPath)
      .resize(62 * 40)
      .png({compressionLevel: 0, progressive: true, })
      .toFile("out.png");

    const raw_image = await Jimp.read('./out.png');
    const img = raw_image
      .background(Jimp.cssColorToHex('rgba(255,255,255,255)'))
      .contain(256, 256)
      .greyscale();

    let hex;

    const nl = img.bitmap.width % 256;
    const nh = Math.ceil(img.bitmap.width / 256);

    // data
    const data = Buffer.from([0, 0, 0]);
    const line = Buffer.from([10]);
    // As specified by the specs in 24-dot double density 
    const verticalLines = 24;
    for (let i = 0; i < Math.round(img.bitmap.height / verticalLines) + 1; i++) {
      // ESC * m nL nH bitmap
      let header = Buffer.from([27, 42, 33, nl, nh]);
      bytes.concat(header);
      for (let j = 0; j < img.bitmap.width; j++) {
        data[0] = data[1] = data[2] = 0; // Clear to Zero.
        let dots = [];
        for (let k = 0; k < verticalLines; k++) {
          if (i * verticalLines + k < img.bitmap.height) {
            // if within the BMP size
            hex = img.getPixelColor(j, i * verticalLines + k);
            let index = 0;
            if (k < 8) {
              index = 0;
            } else if (k < 16) {
              index = 1;
            } else {
              index = 2;
            }
            if (Jimp.intToRGBA(hex).r <= threshold) {
              dots.push('1');
            } else {
              dots.push('0');
            }
          }
        }
        for (let di = 0; di < 3; di++) {
          data[di] = parseInt(dots.slice(di * 8, (di + 1) * 8).join(''), 2);
        }
        const dit = Buffer.from([data[0], data[1], data[2]]);
        bytes.concat(dit);
      }
      bytes.concat(line);
    }
  } catch (error) {
    console.log(error);
  }
  return bytes.toBuffer();
}
