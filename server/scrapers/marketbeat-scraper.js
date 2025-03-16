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

const getMarketBeatAnalystOpinions = async (exchange, ticker) => {
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
    const label = $(el).contents().filter(function() {
        return this.type === 'text';
    }).first().text().trim();

    const countText = $(el).find('span').text().trim();
    const count = parseInt(countText, 10) || 0;

    if (recommendationMapping[label] !== undefined) {
        opinions[recommendationMapping[label]] = count;
    }
    });

    return { ticker, name, exchange, opinions };
} catch (error) {
    console.error(`Error en getMarketBeatAnalystOpinions: ${error.message}`);
    throw new Error(`Error al obtener datos de MarketBeat: ${error.message}`);
}
};

export { getMarketBeatAnalystOpinions };
