import axios from 'axios';
import { load } from 'cheerio';

const getHoldings = async (ticker) => {
  try {
    const url = `https://www.dataroma.com/m/holdings.php?m=${ticker}`;
    console.log(`Obteniendo datos de: ${url}`);

    const { data } = await axios.get(url);
    const $ = load(data);
    const holdings = [];

    $('table#grid tbody tr').each((index, element) => {
      const stock = $(element).find('td').eq(1).text().trim();
      const percentage = $(element).find('td').eq(2).text().trim();
      const recentActivity = $(element).find('td').eq(3).text().trim();
      const value = $(element).find('td').eq(4).text().trim();
      const currentPrice = $(element).find('td').eq(5).text().trim();

      holdings.push({ stock, percentage, value, recentActivity, currentPrice });
    });

    console.log(`Obtenidos ${holdings.length} holdings`);
    return holdings;
  } catch (error) {
    console.error(`Error en getHoldings: ${error.message}`);
    throw new Error(`Error al obtener los datos: ${error.message}`);
  }
};

const getManagers = async () => {
  try {
    const url = 'https://www.dataroma.com/m/managers.php';
    console.log(`Obteniendo datos de: ${url}`);

    const { data } = await axios.get(url);
    const $ = load(data);
    const managers = [];

    $('table').first().find('tr').each((index, element) => {
      if (index === 0) return;
      const anchor = $(element).find('td').first().find('a');
      if (anchor.length) {
        const href = anchor.attr('href');
        const match = href.match(/[?&]m=([^&]+)/);
        const ticker = match ? match[1] : null;
        const name = anchor.text().trim();

        if (ticker && name) {
          managers.push({ name, ticker });
        }
      }
    });

    console.log(`Obtenidos ${managers.length} managers`);
    return managers;
  } catch (error) {
    console.error(`Error en getManagers: ${error.message}`);
    throw new Error(`Error al obtener los datos: ${error.message}`);
  }
};

const getHomeLists = async () => {
  try {
    const url = 'https://www.dataroma.com/m/home.php';
    console.log(`Obteniendo datos de: ${url}`);

    const { data } = await axios.get(url);
    console.log(`Longitud del HTML recibido: ${data.length}`);
    const $ = load(data);
    const lists = {};

    // Actualizamos el mapping para que coincida con la estructura real
    const mapping = [
      { key: 'topMostOwned', headerText: 'Top 10 most owned stocks' },
      { key: 'topStocksByPercentage', headerText: 'Top 10 stocks by %' },
      { key: 'topBigBets', headerText: 'Top "big bets"' },
      { key: 'topBuysLastQtr', headerText: 'Top 10 buys last qtr' },
      { key: 'topBuysLastQtrByPercentage', headerText: 'Top 10 buys last qtr by %' },
      { key: 'holdingsNear52Low', headerText: '5% or greater holdings near 52 week low' },
      { key: 'insiderBuys', headerText: 'Superinvestor stocks with most insider buys in the last 3 months' }
    ];

    // Buscamos encabezados en elementos p.th1, div.th1 y p.hd2
    mapping.forEach(item => {
      let headerElem = $("p.th1, div.th1, p.hd2").filter((i, el) => {
        // Usamos indexOf para encontrar coincidencias parciales (ignorando posibles espacios extra)
        return $(el).text().trim().indexOf(item.headerText) !== -1;
      }).first();

      if (headerElem.length) {
        console.log(`Encabezado encontrado para "${item.headerText}"`);
        // Primero, intentamos buscar un elemento table como siguiente hermano
        let table = headerElem.next("table");
        let listItems = [];
        if (table.length) {
          // Procesamos la tabla: asumimos que la primera fila es el encabezado (si existe)
          table.find('tr').each((i, row) => {
            const cells = $(row).find('td');
            if (i > 0 && cells.length > 0) {
              let rowData = [];
              cells.each((j, cell) => {
                rowData.push($(cell).text().trim());
              });
              listItems.push(rowData);
            }
          });
          console.log(`Se encontraron ${listItems.length} filas en la tabla para "${item.headerText}"`);
        } else if (headerElem.parent().is("td")) {
          // Si el encabezado está dentro de una celda (TD), buscamos todos los enlaces dentro de esa celda
          let cell = headerElem.parent();
          let anchors = cell.find("a");
          anchors.each((i, a) => {
            let text = $(a).text().trim();
            // Excluir el enlace "▾" si existe
            if (text !== '▾' && text.length > 0) {
              listItems.push([text]);
            }
          });
          console.log(`Se encontraron ${listItems.length} enlaces en la celda para "${item.headerText}"`);
        } else {
          console.warn(`No se pudo determinar la estructura para "${item.headerText}"`);
        }
        lists[item.key] = listItems;
      } else {
        console.warn(`No se encontró el encabezado: ${item.headerText}`);
        lists[item.key] = [];
      }
    });
    return lists;

  } catch (error) {
    console.error(`Error en getHomeLists: ${error.message}`);
    throw new Error(`Error al obtener los datos de home: ${error.message}`);
  }
};

export { getHoldings, getManagers, getHomeLists };
