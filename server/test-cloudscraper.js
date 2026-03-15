import cloudscraper from 'cloudscraper';

async function testCloudscraper() {
    const url = 'https://www.marketbeat.com/stocks/NASDAQ/AAPL/forecast/';
    try {
        const response = await cloudscraper.get(url);
        console.log("Length:", response.length);
        console.log(response.substring(0, 500));
    } catch (e) {
        console.error("Error:", e.message);
    }
}
testCloudscraper();
