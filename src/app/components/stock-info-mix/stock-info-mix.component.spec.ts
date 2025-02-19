import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockInfoMixComponent } from './stock-info-mix.component';

describe('StockInfoMixComponent', () => {
  let component: StockInfoMixComponent;
  let fixture: ComponentFixture<StockInfoMixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockInfoMixComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockInfoMixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
