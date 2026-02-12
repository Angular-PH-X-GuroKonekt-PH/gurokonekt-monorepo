import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Creators } from '../creators/creators';
import { Hero } from "../hero/hero";
import { Footer } from "../footer/footer";
import { ContactUs } from "../contact-us/contact-us";

@Component({
  selector: 'app-home',
  imports: [Header, Creators, Hero, Footer, ContactUs],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
