import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink, Header, Footer, ScrollRevealDirective, TranslatePipe],
  templateUrl: './privacy-policy.html',
})
export class PrivacyPolicy {}