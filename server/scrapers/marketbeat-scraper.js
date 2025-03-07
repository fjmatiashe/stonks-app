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
    // Construir la URL usando la bolsa y el ticker
    const url = `https://www.marketbeat.com/stocks/${exchange}/${ticker}/forecast/`;

    const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    };

    const { data } = await axios.get(url, { headers, httpsAgent: agent });
    const $ = load(data);

    // Inicializar el objeto de opiniones con valores por defecto
    let opinions = {
    compra: 0,
    mantener: 0,
    venta: 0
    };

    // Seleccionar el contenedor que contiene los datos
    $('.d-flex.bold.justify-content-center > div').each((i, el) => {
    // Extraer el texto del label (primer nodo de texto, no el <span>)
    const label = $(el).contents().filter(function() {
        return this.type === 'text';
    }).first().text().trim();

    // Extraer el valor numérico del <span>
    const countText = $(el).find('span').text().trim();
    const count = parseInt(countText, 10) || 0;

    // Si el label coincide con uno del diccionario, asignar el número
    if (recommendationMapping[label] !== undefined) {
        opinions[recommendationMapping[label]] = count;
    }
    });

    return { ticker, exchange, opinions };

} catch (error) {
    console.error(`Error en getMarketBeatAnalystOpinions: ${error.message}`);
    throw new Error(`Error al obtener datos de MarketBeat: ${error.message}`);
}
};

export { getMarketBeatAnalystOpinions };
