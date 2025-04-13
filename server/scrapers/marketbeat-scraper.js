import axios from 'axios';
import { load } from 'cheerio';
import https from 'https';

// Mapeo de los labels en inglés a claves en español
const recommendationMapping = {
"Sell": "venta",
"Hold": "mantener",
"Buy": "compra"
};

const agent = new https.Agent({ keepAlive: true });
// Caché simple en memoria (clave: `${exchange}:${ticker}`)
const cache = new Map();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getMarketBeatAnalystOpinions = async (exchange, ticker, retryCount = 3) => {
const cacheKey = `${exchange}:${ticker}`;
if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
}

let attempts = 0;
while (attempts < retryCount) {
    try {
    const url = `https://www.marketbeat.com/stocks/${exchange}/${ticker}/forecast/`;
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    };

    const { data } = await axios.get(url, { headers, httpsAgent: agent });
    const $ = load(data);

    // Extraer el nombre de la acción y recortarlo hasta el primer paréntesis
    let name = $('h1').first().text().trim();
    const indexParen = name.indexOf('(');
    if (indexParen > -1) {
        name = name.substring(0, indexParen).trim();
    }

    // Inicializar opiniones con valores por defecto
    let opinions = {
        compra: 0,
        mantener: 0,
        venta: 0
    };

    // Recorrer cada div que contiene los datos de opiniones
    $('.d-flex.bold.justify-content-center > div').each((i, el) => {
        const label = $(el).contents().filter(function () {
        return this.type === 'text';
        }).first().text().trim();

        const countText = $(el).find('span').text().trim();
        const count = parseInt(countText, 10) || 0;

        if (recommendationMapping[label] !== undefined) {
        opinions[recommendationMapping[label]] = count;
        }
    });

    const result = { ticker, name, exchange, opinions };
    cache.set(cacheKey, result);
    return result;
    } catch (error) {
    attempts++;
    if (attempts < retryCount) {
        // Retroceso exponencial: 100ms, 200ms, 400ms...
        await delay(100 * Math.pow(2, attempts));
    } else {
        console.error(`Error en getMarketBeatAnalystOpinions tras ${attempts} intentos: ${error.message}`);
        throw new Error(`Error al obtener datos de MarketBeat: ${error.message}`);
    }
    }
}
};

const getMarketBeatStockData = async (exchange, ticker, retryCount = 3) => {
    const cacheKey = `${exchange}:${ticker}:stockData`;
    if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
    }

    let attempts = 0;
    while (attempts < retryCount) {
    try {
        const url = `https://www.marketbeat.com/stocks/${exchange}/${ticker}`;
        const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        };

        const { data } = await axios.get(url, { headers, httpsAgent: agent });
        const $ = load(data);

        // Objeto donde se almacenarán los datos extraídos.
        const stockData = {
        trailingPE: null,
        forwardPE: null,
        averageStockPriceTarget: null,
        potentialUpsideDownside: null,
        netMargins: null
        };

        // Recorremos cada sección según el título.
        $('h2.section-h').each((i, h2) => {
        const sectionTitle = $(h2).text().trim();
        const dl = $(h2).next('dl');

        // Sección "Profitability" para Trailing P/E, Forward P/E y Net Margins
        if (sectionTitle.includes("Profitability")) {
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

        // Sección "Price Target and Rating" para Average Stock Price Target y Potential Upside/Downside
        if (sectionTitle.includes("Price Target and Rating")) {
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
        return stockData;
    } catch (error) {
        attempts++;
        if (attempts < retryCount) {
        await delay(100 * Math.pow(2, attempts));
        } else {
        console.error(`Error en getMarketBeatStockData tras ${attempts} intentos para ${ticker}: ${error.message}`);
        throw new Error(`Error al obtener datos de MarketBeat: ${error.message}`);
        }
    }
    }
};


export { getMarketBeatAnalystOpinions, getMarketBeatStockData };
