import fs from 'fs';
import { execSync } from "child_process";
import { imageToPOSFormat } from './utils/EPToolkit.mjs';

const main = async () => {
    const imageBuffer = await imageToPOSFormat('target.svg', 128);
    const imageBase64 = imageBuffer.toString("base64");
    fs.writeFileSync('out-base64.txt', imageBase64, { encoding: 'utf-8' });
    // Test output using POS printer emulator
    fs.writeFileSync('out-base64.bin', imageBase64, { encoding: 'base64' });
    fs.rmSync('out-images', { force: true, recursive: true });
    fs.mkdirSync('out-images');
    execSync('php ~/Workspace/escpos-tools/escimages.php -f ./out-base64.bin --png -o ./out-images/');
}

main();
