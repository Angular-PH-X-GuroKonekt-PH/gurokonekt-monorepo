import { LANGUAGES } from '../constants';

export function getLanguageLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Not listed';
  }

  return LANGUAGES.find((language) => language.value === value)?.label ?? value;
}
