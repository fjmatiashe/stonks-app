import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { enviroment } from '../src/environments/enviroment';
import { environment } from '../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AlphaVantageService {
  // alphavantage.com
  private readonly BASE_URL = 'https://www.alphavantage.co/query';
  private readonly API_KEY = environment.alphavantageApiKey;
  // profit.com
  private readonly BASE_PROFIT_URL = 'https://api.profit.com/data-api/';
  private readonly API_TOKEN = environment.profitApiToken;


  constructor(private http: HttpClient) {}

  //en desuso (alpha vantage)
  getStockData(symbol: string): Observable<any> {
    return this.http.get(
      `${this.BASE_URL}?function=TIME_SERIES_WEEKLY_ADJUSTED&symbol=${symbol}&apikey=${this.API_KEY}`
    );
  }

  searchSymbols(keywords: string): Observable<any> {
    return this.http.get(
      `${this.BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${this.API_KEY}`
    );
  }

  getMarketStatus(): Observable<any> {
    return this.http.get(
      `${this.BASE_URL}?function=MARKET_STATUS&apikey=${this.API_KEY}`
    );
  }

  getHistoricalDailyData(ticker: string, startDate: string, endDate: string): Observable<any> {
    console.log(`📅 Obteniendo datos históricos para ${ticker} desde ${startDate} hasta ${endDate}`);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.API_TOKEN}`
    });
    return this.http.get<any>(
      `${this.BASE_PROFIT_URL}market-data/historical/daily/${ticker}?token=${this.API_TOKEN}&start_date=${startDate}&end_date=${endDate}`,
      { headers }
    );
  }

  getAnalystRecommendations(ticker: string): Observable<any> {
    console.log(`📊 Obteniendo recomendaciones de analistas para ${ticker}`);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.API_TOKEN}`
    });
    return this.http.get<any>(
      `${this.BASE_PROFIT_URL}fundamentals/stocks/analysts_recommendations/${ticker}?token=${this.API_TOKEN}`,
      { headers }
    );
  }

    getIncomeStatement(ticker: string): Observable<any> {
      console.log(`📄 Obteniendo Income Statement para ${ticker}`);
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.API_TOKEN}`
      });
      return this.http.get<any>(
        `${this.BASE_PROFIT_URL}fundamentals/stocks/income_statement/${ticker}?token=${this.API_TOKEN}`,
        { headers }
      );
    }
  
    getEPSHistorical(ticker: string): Observable<any> {
      console.log(`📊 Obteniendo EPS Historical para ${ticker}`);
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.API_TOKEN}`
      });
      return this.http.get<any>(
        `${this.BASE_PROFIT_URL}fundamentals/stocks/eps_historical/${ticker}?token=${this.API_TOKEN}`,
        { headers }
      );
    }
  
    getEPSTrends(ticker: string): Observable<any> {
      console.log(`📈 Obteniendo EPS Trends para ${ticker}`);
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.API_TOKEN}`
      });
      return this.http.get<any>(
        `${this.BASE_PROFIT_URL}fundamentals/stocks/eps_trends/${ticker}?token=${this.API_TOKEN}`,
        { headers }
      );
    }
}
