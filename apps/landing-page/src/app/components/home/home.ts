import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Creators } from '../creators/creators';

@Component({
  selector: 'app-home',
  imports: [Header, Creators],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
