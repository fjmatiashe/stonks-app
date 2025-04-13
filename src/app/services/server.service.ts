import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

export interface Holding { 
  stock: string; 
  percentage: string; 
  value: string; 
  recentActivity: string;
  currentPrice: string;
}

export interface Manager {
  name: string;
  ticker: string;
}

export interface StockData {
  trailingPE?: number;
  forwardPE?: number;
  averagePriceTarget?: number;
  potentialUpside?: number;
  netMargins?: number;
  // otros campos...
}

export interface AnalystData {
  ticker: string;
  name?: string;
  exchange?: string;
  rating?: number;
  opinions?: {
      compra?: number;
      mantener?: number;
      venta?: number;
  };
  stockData?: StockData;
}



@Injectable({
  providedIn: 'root'
})
export class CarteraService {
  private carteraUrl = 'http://localhost:3000/api/cartera';
  private managersUrl = 'http://localhost:3000/api/managers';
  private homeListsUrl = 'http://localhost:3000/api/home-lists';
  private fullAnalystsUrl = 'http://localhost:3000/api/full-analysts';

  private fullAnalysts$: Observable<AnalystData[]>;

  private scrapperLoadedSubject = new BehaviorSubject<boolean>(false);
  scrapperLoaded$ = this.scrapperLoadedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.fullAnalysts$ = this.http.get<AnalystData[]>(this.fullAnalystsUrl).pipe(
      shareReplay(1)
    );
  }

  getCartera(ticker: string): Observable<Holding[]> {
    return this.http.get<Holding[]>(`${this.carteraUrl}/${ticker}`);
  }

  getManagers(): Observable<Manager[]> {
    return this.http.get<Manager[]>(this.managersUrl);
  }

  getHomeLists(): Observable<any> {
    return this.http.get<any>(this.homeListsUrl);
  }

  getFullAnalysts(): Observable<AnalystData[]> {
    return this.fullAnalysts$.pipe(
      tap(() => this.scrapperLoadedSubject.next(true))
    );
  }
}
