import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FindMentors } from './find-mentors';

describe('FindMentors', () => {
  let component: FindMentors;
  let fixture: ComponentFixture<FindMentors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindMentors],
    }).compileComponents();

    fixture = TestBed.createComponent(FindMentors);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
