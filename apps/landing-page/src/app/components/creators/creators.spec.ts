import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Creators } from './creators';
import { Contentful } from '../../shared/services/contentful/contentful';

// This file previously imported and tested `Mentors` from './mentors' — a
// copy-paste that pointed at a file which does not exist in this folder. It was
// never caught because the landing page had no test runner configured.
describe('Creators', () => {
  let component: Creators;
  let fixture: ComponentFixture<Creators>;

  const contentfulMock = {
    getLeads: () => Promise.resolve([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Creators],
      providers: [{ provide: Contentful, useValue: contentfulMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Creators);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
