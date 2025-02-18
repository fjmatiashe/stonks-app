import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockInfoProfitComponent } from './stock-info-profit.component';

describe('StockInfoProfitComponent', () => {
  let component: StockInfoProfitComponent;
  let fixture: ComponentFixture<StockInfoProfitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockInfoProfitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockInfoProfitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
