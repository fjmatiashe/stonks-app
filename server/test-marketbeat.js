import { getMarketBeatAnalystOpinions, getMarketBeatStockData } from './scrapers/marketbeat-scraper.js';

async function test() {
    try {
        console.log("Testing Analyst Opinions...");
        const opinions = await getMarketBeatAnalystOpinions('NASDAQ', 'AAPL');
        console.log(opinions);
        
        console.log("Testing Stock Data...");
        const data = await getMarketBeatStockData('NASDAQ', 'AAPL');
        console.log(data);
    } catch (e) {
        console.error(e);
    }
}

test();
