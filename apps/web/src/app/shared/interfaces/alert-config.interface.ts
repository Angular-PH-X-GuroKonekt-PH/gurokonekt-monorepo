import { AlertType } from '../types/alert.types';

export interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  dismissible?: boolean;
}
