import express from 'express';
import cors from 'cors';
import { getHoldings, getManagers, getHomeLists } from './scrapers/dataroma-scraper.js';
import { getMarketBeatAnalystOpinions } from './scrapers/marketbeat-scraper.js';
import {sp500} from './diccionarios/tickets-s&p.js';
import {europeanStocks} from './diccionarios/tickets-europeos.js';
import {globalStocks} from './diccionarios/tickets-globales.js';
import pLimit from 'p-limit';

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/api/cartera/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
  console.log(`Scrapeando datos para cartera del ticker: ${ticker}`);
  try {
    const holdings = await getHoldings(ticker);
    res.json(holdings);
  } catch (error) {
    console.error('Error en /api/cartera:', error.message);
    res.status(500).send('Error al obtener los datos de cartera');
  }
});

app.get('/api/managers', async (req, res) => {
  console.log('Scrapeando datos de managers');
  try {
    const managers = await getManagers();
    res.json(managers);
  } catch (error) {
    console.error('Error en /api/managers:', error.message);
    res.status(500).send('Error al obtener los datos de managers');
  }
});

app.get('/api/home-lists', async (req, res) => {
  console.log('Scrapeando datos de home');
  try {
    const homeLists = await getHomeLists();
    console.log(`Enviando ${homeLists.length} listas de home`);
    res.json(homeLists);
  } catch (error) {
    console.error('Error en /api/home-lists:', error.message);
    res.status(500).send('Error al obtener los datos de home');
  }
});

app.get('/api/analysts', async (req, res) => {
  console.log("Se ha recibido una petición a /api/analysts (MarketBeat)");
  try {
    const limit = pLimit(40);
    // const allStocks = [...sp500, ...europeanStocks, ...globalStocks];
    const promises = sp500.map(stock => {
      return limit(async () => {
        try {
          console.log(`Scrapeando analistas para: ${stock.ticker} en ${stock.exchange}`);
          return await getMarketBeatAnalystOpinions(stock.exchange, stock.ticker);
        } catch (error) {
          console.error(`Error al obtener datos para ${stock.ticker}: ${error.message}`);
          return { ticker: stock.ticker, exchange: stock.exchange, error: error.message };
        }
      });
    });
    const resultados = await Promise.all(promises);
    console.log("Scraping completado");
    res.json(resultados);
  } catch (error) {
    console.error('Error en /api/analysts:', error.message);
    res.status(500).send('Error al obtener datos de analistas en lote');
  }
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
