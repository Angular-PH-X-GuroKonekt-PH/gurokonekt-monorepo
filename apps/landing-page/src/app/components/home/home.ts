import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Creators } from '../creators/creators';
import { Hero } from "../hero/hero";
import { Footer } from "../footer/footer";

@Component({
  selector: 'app-home',
  imports: [Header, Creators, Hero, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
