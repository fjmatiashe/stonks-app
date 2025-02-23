import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AlphaVantageService {
  // alphavantage.com
  private readonly BASE_URL = 'https://www.alphavantage.co/query';
  private readonly API_KEY = environment.alphavantageApiKey;
  // Finnhub.io
  private readonly BASE_FIN_URL = 'https://finnhub.io/api/v1';
  private readonly API_FIN_KEY = environment.finhubApiKey;
  // profit.com
  private readonly BASE_PROFIT_URL = 'https://api.profit.com/data-api/';
  private profitApiTokens: string[] = environment.profitApiTokens;
  private currentTokenIndex = 0;

  constructor(private http: HttpClient) {}


//--------------------------------ALPHA VANTAGE--------------------------------

  //Devuelve info de accion (en desuso)
  getStockData(symbol: string): Observable<any> {
    return this.http.get(
      `${this.BASE_URL}?function=TIME_SERIES_WEEKLY_ADJUSTED&symbol=${symbol}&apikey=${this.API_KEY}`
    );
  }

  //Devuelve datos de los mercados
  getMarketStatus(): Observable<any> {
    return this.http.get(
      `${this.BASE_URL}?function=MARKET_STATUS&apikey=${this.API_KEY}`
    );
  }

  //Devuelve busqueda (en desuso)
  searchSymbols2(keywords: string): Observable<any> {
    return this.http.get(
      `${this.BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${this.API_KEY}`
    );
  }


//-------------------------------FINHUB-------------------------------

  // Método para buscar símbolos usando el endpoint de Finnhub
  searchSymbols(query: string, exchange?: string): Observable<any> {
    let url = `${this.BASE_FIN_URL}/search?q=${query}&token=${this.API_FIN_KEY}`;
    if (exchange) {
      url += `&exchange=${exchange}`;
    }
    return this.http.get(url);
  }


//--------------------------------PROFIT--------------------------------

  //Cambia el token si da 429
  private getCurrentProfitToken(): string {
    return this.profitApiTokens[this.currentTokenIndex];
  }

  private profitApiGet<T>(url: string): Observable<T> {
    const token = this.getCurrentProfitToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    // Reemplaza el token en la URL con el actual
    const finalUrl = url.replace(/token=[^&]+/, `token=${token}`);
    return this.http.get<T>(finalUrl, { headers }).pipe(
      catchError(error => {
        if (error.status === 429) {
          // Error 429: límite excedido. Cambia al siguiente token.
          this.currentTokenIndex = (this.currentTokenIndex + 1) % this.profitApiTokens.length;
          const newToken = this.getCurrentProfitToken();
          const newUrl = url.replace(/token=[^&]+/, `token=${newToken}`);
          const newHeaders = new HttpHeaders({ Authorization: `Bearer ${newToken}` });
          // Reintenta la solicitud con el nuevo token.
          return this.http.get<T>(newUrl, { headers: newHeaders });
        }
        return throwError(error);
      })
    );
  }

  // Ejemplo para obtener datos históricos usando el helper
  getHistoricalDailyData(ticker: string, startDate: string, endDate: string): Observable<any> {
    const url = `${this.BASE_PROFIT_URL}market-data/historical/daily/${ticker}?token=${this.getCurrentProfitToken()}&start_date=${startDate}&end_date=${endDate}`;
    return this.profitApiGet<any>(url);
  }

  // Ejemplo para obtener recomendaciones de analistas
  getAnalystRecommendations(ticker: string): Observable<any> {
    const url = `${this.BASE_PROFIT_URL}fundamentals/stocks/analysts_recommendations/${ticker}?token=${this.getCurrentProfitToken()}`;
    return this.profitApiGet<any>(url);
  }

  // Ejemplo para Income Statement
  getIncomeStatement(ticker: string): Observable<any> {
    const url = `${this.BASE_PROFIT_URL}fundamentals/stocks/income_statement/${ticker}?token=${this.getCurrentProfitToken()}`;
    return this.profitApiGet<any>(url);
  }

  // Ejemplo para EPS Historical
  getEPSHistorical(ticker: string): Observable<any> {
    const url = `${this.BASE_PROFIT_URL}fundamentals/stocks/eps_historical/${ticker}?token=${this.getCurrentProfitToken()}`;
    return this.profitApiGet<any>(url);
  }

  // Ejemplo para EPS Trends
  getEPSTrends(ticker: string): Observable<any> {
    const url = `${this.BASE_PROFIT_URL}fundamentals/stocks/eps_trends/${ticker}?token=${this.getCurrentProfitToken()}`;
    return this.profitApiGet<any>(url);
  }

}
