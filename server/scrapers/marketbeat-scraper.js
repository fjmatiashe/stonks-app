import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

puppeteer.use(StealthPlugin());

// Mapeo de los labels en inglés a claves en español
const recommendationMapping = {
"Sell": "venta",
"Hold": "mantener",
"Buy": "compra"
};

// Archivo de caché en disco
const cacheFile = path.resolve(__dirname, 'cache.json');

// Caché en memoria inicializada desde el archivo
let cache = new Map();
if (fs.existsSync(cacheFile)) {
    try {
        const rawData = fs.readFileSync(cacheFile, 'utf8');
        const parsedData = JSON.parse(rawData);
        cache = new Map(Object.entries(parsedData));
        console.log(`[Cache] Cargados ${cache.size} elementos desde disco.`);
    } catch (e) {
        console.error('[Cache] Error al leer el archivo de caché', e);
    }
}

// Función auxiliar para guardar la caché a disco de forma asíncrona
let saveTimeout = null;
function scheduleCacheSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        try {
            const obj = Object.fromEntries(cache);
            fs.writeFileSync(cacheFile, JSON.stringify(obj, null, 2), 'utf8');
            console.log(`[Cache] Guardada en disco con ${cache.size} elementos.`);
        } catch (e) {
            console.error('[Cache] Error al guardar en disco', e);
        }
    }, 5000); // Guardar en batch 5 segundos después del último cambio
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


let globalBrowser = null;
async function getBrowser() {
    if (!globalBrowser) {
        globalBrowser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }
    return globalBrowser;
}

// Función auxiliar para obtener el HTML de una URL con Puppeteer
async function getHtmlWithPuppeteer(url) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    try {
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const html = await page.content();
        return html;
    } finally {
        await page.close();
    }
}


//---------------------------------------Obtener opiniones analistas----------------------------------------

const getMarketBeatAnalystOpinions = async (exchange, ticker, retryCount = 2) => {
const cacheKey = `${exchange}:${ticker}`;
if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
}

let attempts = 0;
while (attempts < retryCount) {
    try {
    const url = `https://www.marketbeat.com/stocks/${exchange}/${ticker}/forecast/`;
    
    const data = await getHtmlWithPuppeteer(url);
    const $ = load(data);

    // Verificamos si nos bloqueó Cloudflare a pesar del stealth
    if ($('title').text().includes('Just a moment...')) {
        throw new Error("Bloqueado por Cloudflare");
    }

    // Extraer el nombre de la acción
    let name = $('h1').first().text().trim();
    const ix = name.indexOf('(');
    if (ix > -1) name = name.substring(0, ix).trim();

    let opinions = { compra: 0, mantener: 0, venta: 0 };
    $('.d-flex.bold.justify-content-center > div').each((i, el) => {
        const label = $(el).contents()
        .filter((_, node) => node.type === 'text')
        .first().text().trim();
        const count = parseInt($(el).find('span').text().trim(), 10) || 0;
        if (recommendationMapping[label]) {
        opinions[recommendationMapping[label]] = count;
        }
    });

    const result = { ticker, name, exchange, opinions };
    cache.set(cacheKey, result);
    scheduleCacheSave();
    return result;
    } catch (error) {
    attempts++;
    if (attempts < retryCount) {
        await delay(2000 * Math.pow(2, attempts));
    } else {
        console.error(`Error en getMarketBeatAnalystOpinions tras ${attempts} intentos: ${error.message}`);
        throw new Error(`Error al obtener datos de MarketBeat: ${error.message}`);
    }
    }
}
};


//---------------------------------------Obtener datos de la accion----------------------------------------

const getMarketBeatStockData = async (exchange, ticker, retryCount = 2) => {
const cacheKey = `${exchange}:${ticker}:stockData`;
if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
}

let attempts = 0;
while (attempts < retryCount) {
    try {
    const url = `https://www.marketbeat.com/stocks/${exchange}/${ticker}`;
    
    const data = await getHtmlWithPuppeteer(url);
    const $ = load(data);

    if ($('title').text().includes('Just a moment...')) {
        throw new Error("Bloqueado por Cloudflare");
    }

    // 1) Extraer solo el precio actual
    const priceText = $('div.d-inline-block.mb-2.mr-4')
        .find('strong')
        .first()
        .text()
        .trim();  // Ej. "$506.11"

    // 2) Extraer el resto de métricas
    const stockData = {
        price: priceText,
        trailingPE: null,
        forwardPE: null,
        averageStockPriceTarget: null,
        potentialUpsideDownside: null,
        netMargins: null
    };

    $('h2.section-h').each((i, h2) => {
        const title = $(h2).text().trim();
        const dl = $(h2).next('dl');

        if (title.includes("Profitability")) {
        dl.find('.price-data').each((j, el) => {
            const dt = $(el).find('dt').text().trim();
            const dd = $(el).find('dd').text().trim();
            if (dt.includes("Trailing P/E Ratio")) {
            stockData.trailingPE = dd;
            } else if (dt.includes("Forward P/E Ratio")) {
            stockData.forwardPE = dd;
            } else if (dt.toLowerCase().includes("net margin")) {
            stockData.netMargins = dd;
            }
        });
        }

        if (title.includes("Price Target and Rating")) {
        dl.find('.price-data').each((j, el) => {
            const dt = $(el).find('dt').text().trim();
            const dd = $(el).find('dd').text().trim();
            if (dt.includes("Average Stock Price Target")) {
            stockData.averageStockPriceTarget = dd;
            } else if (dt.includes("Potential Upside/Downside")) {
            stockData.potentialUpsideDownside = dd;
            }
        });
        }
    });

    cache.set(cacheKey, stockData);
    scheduleCacheSave();
    return stockData;
    } catch (error) {
    attempts++;
    if (attempts < retryCount) {
        await delay(2000 * Math.pow(2, attempts));
    } else {
        console.error(`Error en getMarketBeatStockData tras ${attempts} intentos: ${error.message}`);
        throw new Error(`Error al obtener datos de MarketBeat: ${error.message}`);
    }
    }
}
};

export { getMarketBeatAnalystOpinions, getMarketBeatStockData };
