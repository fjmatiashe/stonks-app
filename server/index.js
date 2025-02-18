const express = require('express');
const cors = require('cors');
const { getHoldings, getManagers, getHomeLists } = require('./scraper');

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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
