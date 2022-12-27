import { Buffer } from "buffer";
import Jimp from "jimp";
import BufferHelper from "./buffer-helper.mjs";
import fs from 'fs';

const init_printer_bytes = Buffer.from([27, 64]);
const l_start_bytes = Buffer.from([27, 97, 0]);
const l_end_bytes = Buffer.from([]);
const c_start_bytes = Buffer.from([27, 97, 1]);
const c_end_bytes = Buffer.from([]); // [ 27, 97, 0 ];
const r_start_bytes = Buffer.from([27, 97, 2]);
const r_end_bytes = Buffer.from([]);

const default_space_bytes = Buffer.from([27, 50]);

const reset_bytes = Buffer.from([27, 97, 0, 29, 33, 0, 27, 50]);
const m_start_bytes = Buffer.from([27, 33, 16, 28, 33, 8]);
const m_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const b_start_bytes = Buffer.from([27, 33, 48, 28, 33, 12]);
const b_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const cm_start_bytes = Buffer.from([27, 97, 1, 27, 33, 16, 28, 33, 8]);
const cm_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const cb_start_bytes = Buffer.from([27, 97, 1, 27, 33, 48, 28, 33, 12]);
const cb_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const cd_start_bytes = Buffer.from([27, 97, 1, 27, 33, 32, 28, 33, 4]);
const cd_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const d_start_bytes = Buffer.from([27, 33, 32, 28, 33, 4]);
const d_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);

const cut_bytes = Buffer.from([27, 105]);
const beep_bytes = Buffer.from([27, 66, 3, 2]);
const line_bytes = Buffer.from([10, 10, 10, 10, 10]);

const options_controller = {
  cut: cut_bytes,
  beep: beep_bytes,
  tailingLine: line_bytes,
};

const controller = {
  "<M>": m_start_bytes,
  "</M>": m_end_bytes,
  "<B>": b_start_bytes,
  "</B>": b_end_bytes,
  "<D>": d_start_bytes,
  "</D>": d_end_bytes,
  "<C>": c_start_bytes,
  "</C>": c_end_bytes,
  "<CM>": cm_start_bytes,
  "</CM>": cm_end_bytes,
  "<CD>": cd_start_bytes,
  "</CD>": cd_end_bytes,
  "<CB>": cb_start_bytes,
  "</CB>": cb_end_bytes,
  "<L>": l_start_bytes,
  "</L>": l_end_bytes,
  "<R>": r_start_bytes,
  "</R>": r_end_bytes,
};

export async function exchange_image() {
  let bytes = new BufferHelper();

  try {
    // need to find other solution cause jimp is not working in RN
    const raw_image = await Jimp.read('./on-light.jpg');
    const img = raw_image.background(Jimp.cssColorToHex('rgba(255,255,255,255)')).contain(256, 256).contrast(1).quality(60).greyscale();

    img.write('./out.jpg')

    let hex;
  
    const nl = img.bitmap.width % 256;
    const nh = Math.round(img.bitmap.width / 256);
    console.log(nl);
    console.log(nh);


    // data
    const data = Buffer.from([0, 0, 0]);
    const line = Buffer.from([10]);
    for (let i = 0; i < Math.round(img.bitmap.height / 24) + 1; i++) {
      // ESC * m nL nH bitmap
      let header = Buffer.from([27, 42, 33, nl, nh]);
      bytes.concat(header);
      for (let j = 0; j < img.bitmap.width; j++) {
        data[0] = data[1] = data[2] = 0; // Clear to Zero.
        for (let k = 0; k < 24; k++) {
          if (i * 24 + k < img.bitmap.height) {
            // if within the BMP size
            hex = img.getPixelColor(j, i * 24 + k);
            if (Jimp.intToRGBA(hex).r <= 128) {
              data[Math.round(k / 8)] += 128 >> k % 8;
            }
          }
        }
        const dit = Buffer.from([data[0], data[1], data[2]]);
        bytes.concat(dit);
      }
      bytes.concat(line);
    } // data
  } catch (error) {
    console.log(error);
  }
  return bytes.toBuffer();
}

const main = async () => {
  const out = await exchange_image();
  const bla = out.toString("base64");
  fs.writeFileSync('./out.txt', bla, {encoding: 'utf-8'});
}

main();
