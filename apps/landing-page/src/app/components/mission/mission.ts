import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-mission',
  imports: [RouterLink, Header, Footer, ScrollRevealDirective, TranslatePipe],
  templateUrl: './mission.html',
})
export class Mission {}