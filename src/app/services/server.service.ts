import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class CarteraService {
  private carteraUrl = 'http://localhost:3000/api/cartera';
  private managersUrl = 'http://localhost:3000/api/managers';
  private homeListsUrl = 'http://localhost:3000/api/home-lists';
  private analystsUrl = 'http://localhost:3000/api/analysts';

  constructor(private http: HttpClient) {}

  getCartera(ticker: string): Observable<Holding[]> {
    return this.http.get<Holding[]>(`${this.carteraUrl}/${ticker}`);
  }

  getManagers(): Observable<Manager[]> {
    return this.http.get<Manager[]>(this.managersUrl);
  }

  getHomeLists(): Observable<any> {
    return this.http.get<any>(this.homeListsUrl);
  }

  getAnalysts(): Observable<any> {
    return this.http.get<any>(this.analystsUrl);
  }
}
