
const puppeteer = require('puppeteer');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const URL = 'https://www.accuweather.com/it-it/citta-di-castello/216359/weather-radar/216359';
const OUTPUT_PATH = path.join(__dirname, 'radar.png');
const PUBLIC_ID = 'radar';

async function takeScreenshot() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(10000);
  await page.screenshot({ path: OUTPUT_PATH });
  await browser.close();
}

function getCloudinarySignature(timestamp) {
  const stringToSign = `public_id=${PUBLIC_ID}&timestamp=${timestamp}${process.env.API_SECRET}`;
  return crypto.createHash('sha1').update(stringToSign).digest('hex');
}

async function uploadToCloudinary() {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = getCloudinarySignature(timestamp);

  const form = new FormData();
  form.append('file', fs.createReadStream(OUTPUT_PATH));
  form.append('api_key', process.env.API_KEY);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('public_id', PUBLIC_ID);
  form.append('overwrite', 'true');

  const url = `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/upload`;

  await axios.post(url, form, {
    headers: form.getHeaders(),
  });

  console.log('✅ Radar aggiornato su Cloudinary!');
}

(async () => {
  try {
    await takeScreenshot();
    await uploadToCloudinary();
  } catch (err) {
    console.error('❌ Errore:', err);
    process.exit(1);
  }
})();
