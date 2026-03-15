import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testPuppeteer() {
    const url = 'https://www.marketbeat.com/stocks/NASDAQ/AAPL/forecast/';
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Add realistic headers/settings
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    try {
        console.log("Navigating to URL...");
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const content = await page.content();
        console.log("Page loaded. Length:", content.length);
        
        // Let's see if we see "Just a moment..." or real content
        if (content.includes("Just a moment...")) {
            console.log("Cloudflare Challenge Detected.");
        } else {
            console.log("Success! Real content loaded.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await browser.close();
    }
}

testPuppeteer();
