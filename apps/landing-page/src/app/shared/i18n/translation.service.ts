import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Language, TranslationKey, translations } from './translations';

const STORAGE_KEY = 'gurokonekt-landing-language';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly currentLanguage = signal<Language>(this.getInitialLanguage());

  setLanguage(language: Language): void {
    this.currentLanguage.set(language);

    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
  }

  translate(key: TranslationKey): string {
    return translations[this.currentLanguage()][key];
  }

  private getInitialLanguage(): Language {
    if (!isPlatformBrowser(this.platformId)) {
      return 'en';
    }

    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return storedLanguage === 'tl' ? 'tl' : 'en';
  }
}