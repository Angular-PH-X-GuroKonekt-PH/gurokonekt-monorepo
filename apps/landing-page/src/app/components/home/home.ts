import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Creators } from '../creators/creators';
import { Hero } from "../hero/hero";

@Component({
  selector: 'app-home',
  imports: [Header, Creators, Hero],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
