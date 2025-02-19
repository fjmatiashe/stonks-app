import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketStatusComponent } from './market-status.component';

describe('MarketStatusComponent', () => {
  let component: MarketStatusComponent;
  let fixture: ComponentFixture<MarketStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
