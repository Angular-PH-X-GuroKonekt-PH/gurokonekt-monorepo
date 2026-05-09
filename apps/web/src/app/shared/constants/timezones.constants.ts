import { Timezone } from '../interfaces/timezone.interface';

export const TIMEZONES: Timezone[] = [
  // North America
  { value: 'America/New_York', label: 'Eastern Time (ET)', countries: ['US', 'CA'] },
  { value: 'America/Chicago', label: 'Central Time (CT)', countries: ['US', 'CA', 'MX'] },
  { value: 'America/Denver', label: 'Mountain Time (MT)', countries: ['US', 'CA', 'MX'] },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', countries: ['US', 'CA'] },
  { value: 'America/Sao_Paulo', label: 'Brazil Time (BRT)', countries: ['BR'] },
  { value: 'America/Mexico_City', label: 'Central Standard Time (CST)', countries: ['MX'] },
  // Europe
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', countries: ['GB'] },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', countries: ['FR', 'DE', 'ES', 'IT', 'NL'] },
  { value: 'Europe/Stockholm', label: 'Central European Time (CET)', countries: ['SE', 'NO', 'DK', 'FI'] },
  // Asia Pacific
  { value: 'Asia/Manila', label: 'Philippine Standard Time (PST)', countries: ['PH'] },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', countries: ['JP'] },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', countries: ['CN'] },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)', countries: ['KR'] },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', countries: ['IN'] },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', countries: ['SG'] },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', countries: ['AU'] },
];

/**
 * Default timezone mapping for countries
 */
export const COUNTRY_TIMEZONE_MAP: { [key: string]: string } = {
  'PH': 'Asia/Manila',
  'US': 'America/New_York',
  'CA': 'America/New_York', 
  'GB': 'Europe/London',
  'AU': 'Australia/Sydney',
  'DE': 'Europe/Paris',
  'FR': 'Europe/Paris',
  'ES': 'Europe/Paris',
  'IT': 'Europe/Paris',
  'JP': 'Asia/Tokyo',
  'CN': 'Asia/Shanghai',
  'IN': 'Asia/Kolkata',
  'BR': 'America/Sao_Paulo',
  'MX': 'America/Mexico_City',
  'NL': 'Europe/Paris',
  'SE': 'Europe/Stockholm',
  'NO': 'Europe/Stockholm',
  'DK': 'Europe/Stockholm',
  'FI': 'Europe/Stockholm',
  'SG': 'Asia/Singapore',
  'KR': 'Asia/Seoul',
};
