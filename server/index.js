import express from 'express';
import cors from 'cors';
import { getHoldings, getManagers, getHomeLists } from './scrapers/dataroma-scraper.js';
import { getMarketBeatAnalystOpinions, getMarketBeatStockData } from './scrapers/marketbeat-scraper.js';
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

app.get('/api/full-analysts', async (req, res) => {
  console.log("Se ha recibido una petición a /api/full-analysts (MarketBeat combinado)");
  try {
    const limit = pLimit(60);
    // Mapeamos los stocks del S&P500. Puedes descomentar y agregar otros arrays (europeanStocks, globalStocks)
    const promises = sp500.map(stock => {
      return limit(async () => {
        try {
          console.log(`Scrapeando datos para: ${stock.ticker} en ${stock.exchange}`);
          // Ejecuta en paralelo ambas funciones para obtener opiniones y datos de stock
          const [opinions, stockData] = await Promise.all([
            getMarketBeatAnalystOpinions(stock.exchange, stock.ticker),
            getMarketBeatStockData(stock.exchange, stock.ticker)
          ]);

          return {
            ticker: stock.ticker,
            exchange: stock.exchange,
            opinions,
            stockData
          };
        } catch (error) {
          console.error(`Error al obtener datos para ${stock.ticker}: ${error.message}`);
          return { ticker: stock.ticker, exchange: stock.exchange, error: error.message };
        }
      });
    });
    const resultados = await Promise.all(promises);
    console.log("Scraping combinado completado", resultados);
    res.json(resultados);
  } catch (error) {
    console.error('Error en /api/full-analysts:', error.message);
    res.status(500).send('Error al obtener datos completos de analistas y stock');
  }
});


// app.get('/api/analysts', async (req, res) => {
//   console.log("Se ha recibido una petición a /api/analysts (MarketBeat)");
//   try {
//     const limit = pLimit(60);
//     // const allStocks = [...sp500, ...europeanStocks, ...globalStocks];
//     const promises = sp500.map(stock => {
//       return limit(async () => {
//         try {
//           console.log(`Scrapeando analistas para: ${stock.ticker} en ${stock.exchange}`);
//           return await getMarketBeatAnalystOpinions(stock.exchange, stock.ticker);
//         } catch (error) {
//           console.error(`Error al obtener datos para ${stock.ticker}: ${error.message}`);
//           return { ticker: stock.ticker, exchange: stock.exchange, error: error.message };
//         }
//       });
//     });
//     const resultados = await Promise.all(promises);
//     console.log("Scraping completado");
//     res.json(resultados);
//   } catch (error) {
//     console.error('Error en /api/analysts:', error.message);
//     res.status(500).send('Error al obtener datos de analistas en lote');
//   }
// });

// app.get('/api/stock-data/:exchange/:ticker', async (req, res) => {
//   const { exchange, ticker } = req.params;
//   console.log(`Scrapeando datos de stock para ${ticker} (${exchange})`);

//   try {
//     const stockData = await getMarketBeatStockData(exchange, ticker);
//     res.json(stockData);
//   } catch (error) {
//     console.error(`Error en /api/stock-data/${exchange}/${ticker}:`, error.message);
//     res.status(500).send(`Error al obtener los datos de stock para ${ticker}`);
//   }
// });


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
