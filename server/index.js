import express from 'express';
import cors from 'cors';
import { getHoldings, getManagers, getHomeLists } from './scrapers/dataroma-scraper.js';
import { getMarketBeatAnalystOpinions, getMarketBeatStockData } from './scrapers/marketbeat-scraper.js';
import { sp500 } from './diccionarios/tickets-s&p.js';
import { europeanStocks } from './diccionarios/tickets-europeos.js';
import { globalStocks } from './diccionarios/tickets-globales.js';
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

app.get('/api/full-analysts-stream', (req, res) => {
  console.log("Se ha recibido una petición a /api/full-analysts-stream");
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const limit = pLimit(3);
  let completed = 0;
  const total = sp500.length;

  res.write(`data: ${JSON.stringify({ type: 'start', total })}\n\n`);

  const promises = sp500.map(stock => {
    return limit(async () => {
      try {
        console.log(`Scrapeando datos para: ${stock.ticker} en ${stock.exchange}`);
        const [opinions, stockData] = await Promise.all([
          getMarketBeatAnalystOpinions(stock.exchange, stock.ticker),
          getMarketBeatStockData(stock.exchange, stock.ticker)
        ]);

        const result = {
          ticker: stock.ticker,
          exchange: stock.exchange,
          opinions,
          stockData
        };
        completed++;
        res.write(`data: ${JSON.stringify({ type: 'data', result, completed, total })}\n\n`);
        return result;
      } catch (error) {
        console.error(`Error al obtener datos para ${stock.ticker}: ${error.message}`);
        completed++;
        const result = { ticker: stock.ticker, exchange: stock.exchange, error: error.message };
        res.write(`data: ${JSON.stringify({ type: 'error', result, completed, total })}\n\n`);
        return result;
      }
    });
  });

  Promise.all(promises).then(() => {
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }).catch(err => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  });

  req.on('close', () => {
    console.log("Cliente desconectado de /api/full-analysts-stream");
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
