import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenteeNavbar } from './mentee-navbar';

describe('MenteeNavbar', () => {
  let component: MenteeNavbar;
  let fixture: ComponentFixture<MenteeNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenteeNavbar],
    }).compileComponents();

    fixture = TestBed.createComponent(MenteeNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
