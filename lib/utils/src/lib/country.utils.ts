/**
 * Country data with flags, labels, phone codes, and phone validation rules
 */
export interface Country {
  value: string;
  label: string;
  flag: string;
  phoneCode: string;
  phoneFormat: string;
  phoneRegex: RegExp;
}

/**
 * Timezone data with country associations
 */
export interface Timezone {
  value: string;
  label: string;
  countries: string[];
}

/**
 * Comprehensive list of countries with flags, phone codes, and phone validation rules.
 * Entries are alphabetically sorted by label.
 */
export const COUNTRIES: Country[] = [
  { value: 'AF', label: 'Afghanistan', phoneCode: '+93', flag: '🇦🇫', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'AX', label: 'Aland Islands', phoneCode: '+358', flag: '🇦🇽', phoneFormat: '000000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'AL', label: 'Albania', phoneCode: '+355', flag: '🇦🇱', phoneFormat: '000000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9})$/ },
  { value: 'DZ', label: 'Algeria', phoneCode: '+213', flag: '🇩🇿', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'AS', label: 'American Samoa', phoneCode: '+1684', flag: '🇦🇸', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'AD', label: 'Andorra', phoneCode: '+376', flag: '🇦🇩', phoneFormat: '000 000', phoneRegex: /^(?:\d{6}|\d{8}|\d{9})$/ },
  { value: 'AO', label: 'Angola', phoneCode: '+244', flag: '🇦🇴', phoneFormat: '000 000 000', phoneRegex: /^\d{9}$/ },
  { value: 'AI', label: 'Anguilla', phoneCode: '+1264', flag: '🇦🇮', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'AQ', label: 'Antarctica', phoneCode: '+672', flag: '🇦🇶', phoneFormat: '0 00 000 0000', phoneRegex: /^\d{7,12}$/ },
  { value: 'AG', label: 'Antigua and Barbuda', phoneCode: '+1268', flag: '🇦🇬', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'AR', label: 'Argentina', phoneCode: '+54', flag: '🇦🇷', phoneFormat: '00000000000', phoneRegex: /^(?:\d{10}|\d{11})$/ },
  { value: 'AM', label: 'Armenia', phoneCode: '+374', flag: '🇦🇲', phoneFormat: '00000000', phoneRegex: /^\d{8}$/ },
  { value: 'AW', label: 'Aruba', phoneCode: '+297', flag: '🇦🇼', phoneFormat: '000 0000', phoneRegex: /^\d{7}$/ },
  { value: 'AU', label: 'Australia', phoneCode: '+61', flag: '🇦🇺', phoneFormat: '000000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{12})$/ },
  { value: 'AT', label: 'Austria', phoneCode: '+43', flag: '🇦🇹', phoneFormat: '000000000', phoneRegex: /^(?:\d{4}|\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12}|\d{13})$/ },
  { value: 'AZ', label: 'Azerbaijan', phoneCode: '+994', flag: '🇦🇿', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'BS', label: 'Bahamas', phoneCode: '+1242', flag: '🇧🇸', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'BH', label: 'Bahrain', phoneCode: '+973', flag: '🇧🇭', phoneFormat: '0000 0000', phoneRegex: /^\d{8}$/ },
  { value: 'BD', label: 'Bangladesh', phoneCode: '+880', flag: '🇧🇩', phoneFormat: '0000000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10})$/ },
  { value: 'BB', label: 'Barbados', phoneCode: '+1246', flag: '🇧🇧', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'BY', label: 'Belarus', phoneCode: '+375', flag: '🇧🇾', phoneFormat: '000000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11})$/ },
  { value: 'BE', label: 'Belgium', phoneCode: '+32', flag: '🇧🇪', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'BZ', label: 'Belize', phoneCode: '+501', flag: '🇧🇿', phoneFormat: '000-0000', phoneRegex: /^(?:\d{7}|\d{11})$/ },
  { value: 'BJ', label: 'Benin', phoneCode: '+229', flag: '🇧🇯', phoneFormat: '00 00 00 00 00', phoneRegex: /^(?:\d{8}|\d{10})$/ },
  { value: 'BM', label: 'Bermuda', phoneCode: '+1441', flag: '🇧🇲', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'BT', label: 'Bhutan', phoneCode: '+975', flag: '🇧🇹', phoneFormat: '00 00 00 00', phoneRegex: /^(?:\d{7}|\d{8})$/ },
  { value: 'BO', label: 'Bolivia', phoneCode: '+591', flag: '🇧🇴', phoneFormat: '00000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'BA', label: 'Bosnia and Herzegovina', phoneCode: '+387', flag: '🇧🇦', phoneFormat: '00000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'BW', label: 'Botswana', phoneCode: '+267', flag: '🇧🇼', phoneFormat: '00 000 000', phoneRegex: /^(?:\d{7}|\d{8}|\d{10})$/ },
  { value: 'BR', label: 'Brazil', phoneCode: '+55', flag: '🇧🇷', phoneFormat: '(00) 00000-0000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10}|\d{11})$/ },
  { value: 'IO', label: 'British Indian Ocean Territory', phoneCode: '+246', flag: '🇮🇴', phoneFormat: '000 0000', phoneRegex: /^\d{7}$/ },
  { value: 'VG', label: 'British Virgin Islands', phoneCode: '+1284', flag: '🇻🇬', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'BN', label: 'Brunei Darussalam', phoneCode: '+673', flag: '🇧🇳', phoneFormat: '000 0000', phoneRegex: /^\d{7}$/ },
  { value: 'BG', label: 'Bulgaria', phoneCode: '+359', flag: '🇧🇬', phoneFormat: '00000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{12})$/ },
  { value: 'BF', label: 'Burkina Faso', phoneCode: '+226', flag: '🇧🇫', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'BI', label: 'Burundi', phoneCode: '+257', flag: '🇧🇮', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'KH', label: 'Cambodia', phoneCode: '+855', flag: '🇰🇭', phoneFormat: '00000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10})$/ },
  { value: 'CM', label: 'Cameroon', phoneCode: '+237', flag: '🇨🇲', phoneFormat: '0 00 00 00 00', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'CA', label: 'Canada', phoneCode: '+1', flag: '🇨🇦', phoneFormat: '(000) 000-0000', phoneRegex: /^(?:\d{7}|\d{10})$/ },
  { value: 'CV', label: 'Cape Verde', phoneCode: '+238', flag: '🇨🇻', phoneFormat: '000 00 00', phoneRegex: /^\d{7}$/ },
  { value: 'KY', label: 'Cayman Islands', phoneCode: '+1345', flag: '🇰🇾', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'CF', label: 'Central African Republic', phoneCode: '+236', flag: '🇨🇫', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'TD', label: 'Chad', phoneCode: '+235', flag: '🇹🇩', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'CL', label: 'Chile', phoneCode: '+56', flag: '🇨🇱', phoneFormat: '(0) 0000 0000', phoneRegex: /^(?:\d{9}|\d{10}|\d{11})$/ },
  { value: 'CN', label: 'China', phoneCode: '+86', flag: '🇨🇳', phoneFormat: '000 0000 0000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'CX', label: 'Christmas Island', phoneCode: '+61', flag: '🇨🇽', phoneFormat: '000000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{12})$/ },
  { value: 'CC', label: 'Cocos (Keeling) Islands', phoneCode: '+61', flag: '🇨🇨', phoneFormat: '000000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{12})$/ },
  { value: 'CO', label: 'Colombia', phoneCode: '+57', flag: '🇨🇴', phoneFormat: '000 0000000', phoneRegex: /^(?:\d{8}|\d{10}|\d{11})$/ },
  { value: 'KM', label: 'Comoros', phoneCode: '+269', flag: '🇰🇲', phoneFormat: '000 00 00', phoneRegex: /^\d{7}$/ },
  { value: 'CG', label: 'Congo', phoneCode: '+242', flag: '🇨🇬', phoneFormat: '00 000 0000', phoneRegex: /^\d{9}$/ },
  { value: 'CK', label: 'Cook Islands', phoneCode: '+682', flag: '🇨🇰', phoneFormat: '00 000', phoneRegex: /^\d{5}$/ },
  { value: 'CR', label: 'Costa Rica', phoneCode: '+506', flag: '🇨🇷', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{8}|\d{10})$/ },
  { value: 'CI', label: 'Côte d\'Ivoire', phoneCode: '+225', flag: '🇨🇮', phoneFormat: '00 00 00 0000', phoneRegex: /^\d{10}$/ },
  { value: 'HR', label: 'Croatia', phoneCode: '+385', flag: '🇭🇷', phoneFormat: '000000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9})$/ },
  { value: 'CU', label: 'Cuba', phoneCode: '+53', flag: '🇨🇺', phoneFormat: '00000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{10})$/ },
  { value: 'CY', label: 'Cyprus', phoneCode: '+357', flag: '🇨🇾', phoneFormat: '00 000000', phoneRegex: /^\d{8}$/ },
  { value: 'CZ', label: 'Czech Republic', phoneCode: '+420', flag: '🇨🇿', phoneFormat: '000 000 000', phoneRegex: /^(?:\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'CD', label: 'Democratic Republic of the Congo', phoneCode: '+243', flag: '🇨🇩', phoneFormat: '000000000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9}|\d{10})$/ },
  { value: 'DK', label: 'Denmark', phoneCode: '+45', flag: '🇩🇰', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'DJ', label: 'Djibouti', phoneCode: '+253', flag: '🇩🇯', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'DM', label: 'Dominica', phoneCode: '+1767', flag: '🇩🇲', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'DO', label: 'Dominican Republic', phoneCode: '+1', flag: '🇩🇴', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'EC', label: 'Ecuador', phoneCode: '+593', flag: '🇪🇨', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10}|\d{11})$/ },
  { value: 'EG', label: 'Egypt', phoneCode: '+20', flag: '🇪🇬', phoneFormat: '0000000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10})$/ },
  { value: 'SV', label: 'El Salvador', phoneCode: '+503', flag: '🇸🇻', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{7}|\d{8}|\d{11})$/ },
  { value: 'GQ', label: 'Equatorial Guinea', phoneCode: '+240', flag: '🇬🇶', phoneFormat: '000 000 000', phoneRegex: /^\d{9}$/ },
  { value: 'ER', label: 'Eritrea', phoneCode: '+291', flag: '🇪🇷', phoneFormat: '0000000', phoneRegex: /^\d{7}$/ },
  { value: 'EE', label: 'Estonia', phoneCode: '+372', flag: '🇪🇪', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{7}|\d{8}|\d{10})$/ },
  { value: 'SZ', label: 'Eswatini', phoneCode: '+268', flag: '🇸🇿', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'ET', label: 'Ethiopia', phoneCode: '+251', flag: '🇪🇹', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'FK', label: 'Falkland Islands (Malvinas)', phoneCode: '+500', flag: '🇫🇰', phoneFormat: '00000', phoneRegex: /^\d{5}$/ },
  { value: 'FO', label: 'Faroe Islands', phoneCode: '+298', flag: '🇫🇴', phoneFormat: '000000', phoneRegex: /^\d{6}$/ },
  { value: 'FJ', label: 'Fiji', phoneCode: '+679', flag: '🇫🇯', phoneFormat: '000 0000', phoneRegex: /^(?:\d{7}|\d{11})$/ },
  { value: 'FI', label: 'Finland', phoneCode: '+358', flag: '🇫🇮', phoneFormat: '000000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'FR', label: 'France', phoneCode: '+33', flag: '🇫🇷', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'GF', label: 'French Guiana', phoneCode: '+594', flag: '🇬🇫', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'PF', label: 'French Polynesia', phoneCode: '+689', flag: '🇵🇫', phoneFormat: '00 00 00 00', phoneRegex: /^(?:\d{6}|\d{8}|\d{9})$/ },
  { value: 'GA', label: 'Gabon', phoneCode: '+241', flag: '🇬🇦', phoneFormat: '00 00 00 00', phoneRegex: /^(?:\d{7}|\d{8})$/ },
  { value: 'GM', label: 'Gambia', phoneCode: '+220', flag: '🇬🇲', phoneFormat: '000 0000', phoneRegex: /^\d{7}$/ },
  { value: 'GE', label: 'Georgia', phoneCode: '+995', flag: '🇬🇪', phoneFormat: '000 00 00 00', phoneRegex: /^\d{9}$/ },
  { value: 'DE', label: 'Germany', phoneCode: '+49', flag: '🇩🇪', phoneFormat: '00000000000', phoneRegex: /^(?:\d{4}|\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12}|\d{13}|\d{14}|\d{15})$/ },
  { value: 'GH', label: 'Ghana', phoneCode: '+233', flag: '🇬🇭', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'GI', label: 'Gibraltar', phoneCode: '+350', flag: '🇬🇮', phoneFormat: '00000000', phoneRegex: /^\d{8}$/ },
  { value: 'GR', label: 'Greece', phoneCode: '+30', flag: '🇬🇷', phoneFormat: '000 000 0000', phoneRegex: /^(?:\d{10}|\d{11}|\d{12})$/ },
  { value: 'GL', label: 'Greenland', phoneCode: '+299', flag: '🇬🇱', phoneFormat: '00 00 00', phoneRegex: /^\d{6}$/ },
  { value: 'GD', label: 'Grenada', phoneCode: '+1473', flag: '🇬🇩', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'GP', label: 'Guadeloupe', phoneCode: '+590', flag: '🇬🇵', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'GU', label: 'Guam', phoneCode: '+1671', flag: '🇬🇺', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'GT', label: 'Guatemala', phoneCode: '+502', flag: '🇬🇹', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{8}|\d{11})$/ },
  { value: 'GG', label: 'Guernsey', phoneCode: '+44', flag: '🇬🇬', phoneFormat: '0000000000', phoneRegex: /^(?:\d{7}|\d{9}|\d{10})$/ },
  { value: 'GN', label: 'Guinea', phoneCode: '+224', flag: '🇬🇳', phoneFormat: '000 00 00 00', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'GW', label: 'Guinea-Bissau', phoneCode: '+245', flag: '🇬🇼', phoneFormat: '000 000 000', phoneRegex: /^(?:\d{7}|\d{9})$/ },
  { value: 'GY', label: 'Guyana', phoneCode: '+592', flag: '🇬🇾', phoneFormat: '000 0000', phoneRegex: /^\d{7}$/ },
  { value: 'HT', label: 'Haiti', phoneCode: '+509', flag: '🇭🇹', phoneFormat: '00 00 0000', phoneRegex: /^\d{8}$/ },
  { value: 'HN', label: 'Honduras', phoneCode: '+504', flag: '🇭🇳', phoneFormat: '0000-0000', phoneRegex: /^(?:\d{8}|\d{11})$/ },
  { value: 'HK', label: 'Hong Kong', phoneCode: '+852', flag: '🇭🇰', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{11})$/ },
  { value: 'HU', label: 'Hungary', phoneCode: '+36', flag: '🇭🇺', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'IS', label: 'Iceland', phoneCode: '+354', flag: '🇮🇸', phoneFormat: '000 0000', phoneRegex: /^(?:\d{7}|\d{9})$/ },
  { value: 'IN', label: 'India', phoneCode: '+91', flag: '🇮🇳', phoneFormat: '00000 00000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10}|\d{11}|\d{12}|\d{13})$/ },
  { value: 'ID', label: 'Indonesia', phoneCode: '+62', flag: '🇮🇩', phoneFormat: '000000000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12}|\d{13}|\d{14}|\d{15}|\d{16}|\d{17})$/ },
  { value: 'IR', label: 'Iran', phoneCode: '+98', flag: '🇮🇷', phoneFormat: '0000000000', phoneRegex: /^(?:\d{4}|\d{5}|\d{6}|\d{7}|\d{10})$/ },
  { value: 'IQ', label: 'Iraq', phoneCode: '+964', flag: '🇮🇶', phoneFormat: '0000000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10})$/ },
  { value: 'IE', label: 'Ireland', phoneCode: '+353', flag: '🇮🇪', phoneFormat: '000000000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9}|\d{10})$/ },
  { value: 'IM', label: 'Isle of Man', phoneCode: '+44', flag: '🇮🇲', phoneFormat: '0000000000', phoneRegex: /^\d{10}$/ },
  { value: 'IL', label: 'Israel', phoneCode: '+972', flag: '🇮🇱', phoneFormat: '000000000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'IT', label: 'Italy', phoneCode: '+39', flag: '🇮🇹', phoneFormat: '000 000 0000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'JM', label: 'Jamaica', phoneCode: '+1876', flag: '🇯🇲', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'JP', label: 'Japan', phoneCode: '+81', flag: '🇯🇵', phoneFormat: '0000000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10}|\d{11}|\d{12}|\d{13}|\d{14}|\d{15}|\d{16}|\d{17})$/ },
  { value: 'JE', label: 'Jersey', phoneCode: '+44', flag: '🇯🇪', phoneFormat: '0000000000', phoneRegex: /^\d{10}$/ },
  { value: 'JO', label: 'Jordan', phoneCode: '+962', flag: '🇯🇴', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'KZ', label: 'Kazakhstan', phoneCode: '+7', flag: '🇰🇿', phoneFormat: '000 000 0000', phoneRegex: /^(?:\d{10}|\d{14})$/ },
  { value: 'KE', label: 'Kenya', phoneCode: '+254', flag: '🇰🇪', phoneFormat: '000000000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9}|\d{10})$/ },
  { value: 'KI', label: 'Kiribati', phoneCode: '+686', flag: '🇰🇮', phoneFormat: '00000000', phoneRegex: /^(?:\d{5}|\d{8})$/ },
  { value: 'KW', label: 'Kuwait', phoneCode: '+965', flag: '🇰🇼', phoneFormat: '000 00000', phoneRegex: /^(?:\d{7}|\d{8})$/ },
  { value: 'KG', label: 'Kyrgyzstan', phoneCode: '+996', flag: '🇰🇬', phoneFormat: '000000000', phoneRegex: /^(?:\d{9}|\d{10})$/ },
  { value: 'LA', label: 'Laos', phoneCode: '+856', flag: '🇱🇦', phoneFormat: '0000000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10})$/ },
  { value: 'LV', label: 'Latvia', phoneCode: '+371', flag: '🇱🇻', phoneFormat: '00 000 000', phoneRegex: /^\d{8}$/ },
  { value: 'LB', label: 'Lebanon', phoneCode: '+961', flag: '🇱🇧', phoneFormat: '00 000 000', phoneRegex: /^(?:\d{7}|\d{8})$/ },
  { value: 'LS', label: 'Lesotho', phoneCode: '+266', flag: '🇱🇸', phoneFormat: '0000 0000', phoneRegex: /^\d{8}$/ },
  { value: 'LR', label: 'Liberia', phoneCode: '+231', flag: '🇱🇷', phoneFormat: '000000000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9})$/ },
  { value: 'LY', label: 'Libya', phoneCode: '+218', flag: '🇱🇾', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'LI', label: 'Liechtenstein', phoneCode: '+423', flag: '🇱🇮', phoneFormat: '000 000 000', phoneRegex: /^(?:\d{7}|\d{9})$/ },
  { value: 'LT', label: 'Lithuania', phoneCode: '+370', flag: '🇱🇹', phoneFormat: '000 00000', phoneRegex: /^\d{8}$/ },
  { value: 'LU', label: 'Luxembourg', phoneCode: '+352', flag: '🇱🇺', phoneFormat: '000 000 000', phoneRegex: /^(?:\d{4}|\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11})$/ },
  { value: 'MO', label: 'Macao', phoneCode: '+853', flag: '🇲🇴', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{7}|\d{8})$/ },
  { value: 'MG', label: 'Madagascar', phoneCode: '+261', flag: '🇲🇬', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'MW', label: 'Malawi', phoneCode: '+265', flag: '🇲🇼', phoneFormat: '000000000', phoneRegex: /^(?:\d{7}|\d{9})$/ },
  { value: 'MY', label: 'Malaysia', phoneCode: '+60', flag: '🇲🇾', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10})$/ },
  { value: 'MV', label: 'Maldives', phoneCode: '+960', flag: '🇲🇻', phoneFormat: '000-0000', phoneRegex: /^(?:\d{7}|\d{10})$/ },
  { value: 'ML', label: 'Mali', phoneCode: '+223', flag: '🇲🇱', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'MT', label: 'Malta', phoneCode: '+356', flag: '🇲🇹', phoneFormat: '0000 0000', phoneRegex: /^\d{8}$/ },
  { value: 'MH', label: 'Marshall Islands', phoneCode: '+692', flag: '🇲🇭', phoneFormat: '000-0000', phoneRegex: /^\d{7}$/ },
  { value: 'MQ', label: 'Martinique', phoneCode: '+596', flag: '🇲🇶', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'MR', label: 'Mauritania', phoneCode: '+222', flag: '🇲🇷', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'MU', label: 'Mauritius', phoneCode: '+230', flag: '🇲🇺', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{7}|\d{8}|\d{10})$/ },
  { value: 'YT', label: 'Mayotte', phoneCode: '+262', flag: '🇾🇹', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'MX', label: 'Mexico', phoneCode: '+52', flag: '🇲🇽', phoneFormat: '000 000 0000', phoneRegex: /^\d{10}$/ },
  { value: 'FM', label: 'Micronesia', phoneCode: '+691', flag: '🇫🇲', phoneFormat: '000 0000', phoneRegex: /^\d{7}$/ },
  { value: 'MD', label: 'Moldova', phoneCode: '+373', flag: '🇲🇩', phoneFormat: '00000000', phoneRegex: /^\d{8}$/ },
  { value: 'MC', label: 'Monaco', phoneCode: '+377', flag: '🇲🇨', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'MN', label: 'Mongolia', phoneCode: '+976', flag: '🇲🇳', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10})$/ },
  { value: 'ME', label: 'Montenegro', phoneCode: '+382', flag: '🇲🇪', phoneFormat: '00000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'MS', label: 'Montserrat', phoneCode: '+1664', flag: '🇲🇸', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'MA', label: 'Morocco', phoneCode: '+212', flag: '🇲🇦', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'MZ', label: 'Mozambique', phoneCode: '+258', flag: '🇲🇿', phoneFormat: '00 000 0000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'MM', label: 'Myanmar', phoneCode: '+95', flag: '🇲🇲', phoneFormat: '00000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10})$/ },
  { value: 'NA', label: 'Namibia', phoneCode: '+264', flag: '🇳🇦', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'NR', label: 'Nauru', phoneCode: '+674', flag: '🇳🇷', phoneFormat: '000 0000', phoneRegex: /^\d{7}$/ },
  { value: 'NP', label: 'Nepal', phoneCode: '+977', flag: '🇳🇵', phoneFormat: '000-0000000', phoneRegex: /^(?:\d{8}|\d{10}|\d{11})$/ },
  { value: 'NL', label: 'Netherlands', phoneCode: '+31', flag: '🇳🇱', phoneFormat: '000000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11})$/ },
  { value: 'AN', label: 'Netherlands Antilles', phoneCode: '+599', flag: '🇦🇳', phoneFormat: '0 00 000 0000', phoneRegex: /^\d{7,12}$/ },
  { value: 'NC', label: 'New Caledonia', phoneCode: '+687', flag: '🇳🇨', phoneFormat: '00.00.00', phoneRegex: /^\d{6}$/ },
  { value: 'NZ', label: 'New Zealand', phoneCode: '+64', flag: '🇳🇿', phoneFormat: '000000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10})$/ },
  { value: 'NI', label: 'Nicaragua', phoneCode: '+505', flag: '🇳🇮', phoneFormat: '0000 0000', phoneRegex: /^\d{8}$/ },
  { value: 'NE', label: 'Niger', phoneCode: '+227', flag: '🇳🇪', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'NG', label: 'Nigeria', phoneCode: '+234', flag: '🇳🇬', phoneFormat: '0000000000', phoneRegex: /^(?:\d{8}|\d{10}|\d{11}|\d{12}|\d{13}|\d{14})$/ },
  { value: 'NU', label: 'Niue', phoneCode: '+683', flag: '🇳🇺', phoneFormat: '000 0000', phoneRegex: /^(?:\d{4}|\d{7})$/ },
  { value: 'NF', label: 'Norfolk Island', phoneCode: '+672', flag: '🇳🇫', phoneFormat: '0 00000', phoneRegex: /^\d{6}$/ },
  { value: 'KP', label: 'North Korea', phoneCode: '+850', flag: '🇰🇵', phoneFormat: '0000000000', phoneRegex: /^(?:\d{8}|\d{10})$/ },
  { value: 'MK', label: 'North Macedonia', phoneCode: '+389', flag: '🇲🇰', phoneFormat: '00000000', phoneRegex: /^\d{8}$/ },
  { value: 'MP', label: 'Northern Mariana Islands', phoneCode: '+1670', flag: '🇲🇵', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'NO', label: 'Norway', phoneCode: '+47', flag: '🇳🇴', phoneFormat: '00 00 00 00', phoneRegex: /^(?:\d{5}|\d{8})$/ },
  { value: 'OM', label: 'Oman', phoneCode: '+968', flag: '🇴🇲', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9})$/ },
  { value: 'PK', label: 'Pakistan', phoneCode: '+92', flag: '🇵🇰', phoneFormat: '0000000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'PW', label: 'Palau', phoneCode: '+680', flag: '🇵🇼', phoneFormat: '000 0000', phoneRegex: /^\d{7}$/ },
  { value: 'PS', label: 'Palestine', phoneCode: '+970', flag: '🇵🇸', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10})$/ },
  { value: 'PA', label: 'Panama', phoneCode: '+507', flag: '🇵🇦', phoneFormat: '0000-0000', phoneRegex: /^(?:\d{7}|\d{8}|\d{10}|\d{11})$/ },
  { value: 'PG', label: 'Papua New Guinea', phoneCode: '+675', flag: '🇵🇬', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{7}|\d{8})$/ },
  { value: 'PY', label: 'Paraguay', phoneCode: '+595', flag: '🇵🇾', phoneFormat: '0000 000 00', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11})$/ },
  { value: 'PE', label: 'Peru', phoneCode: '+51', flag: '🇵🇪', phoneFormat: '000 000 000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'PH', label: 'Philippines', phoneCode: '+63', flag: '🇵🇭', phoneFormat: '000 000 0000', phoneRegex: /^(?:\d{6}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12}|\d{13})$/ },
  { value: 'PN', label: 'Pitcairn', phoneCode: '+64', flag: '🇵🇳', phoneFormat: '0 00 000 0000', phoneRegex: /^\d{7,12}$/ },
  { value: 'PL', label: 'Poland', phoneCode: '+48', flag: '🇵🇱', phoneFormat: '000 000 000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10})$/ },
  { value: 'PT', label: 'Portugal', phoneCode: '+351', flag: '🇵🇹', phoneFormat: '000 000 000', phoneRegex: /^\d{9}$/ },
  { value: 'PR', label: 'Puerto Rico', phoneCode: '+1', flag: '🇵🇷', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'QA', label: 'Qatar', phoneCode: '+974', flag: '🇶🇦', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9}|\d{11})$/ },
  { value: 'RE', label: 'Réunion', phoneCode: '+262', flag: '🇷🇪', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'RO', label: 'Romania', phoneCode: '+40', flag: '🇷🇴', phoneFormat: '000000000', phoneRegex: /^(?:\d{6}|\d{9})$/ },
  { value: 'RU', label: 'Russia', phoneCode: '+7', flag: '🇷🇺', phoneFormat: '000 000-00-00', phoneRegex: /^(?:\d{10}|\d{14})$/ },
  { value: 'RW', label: 'Rwanda', phoneCode: '+250', flag: '🇷🇼', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'BL', label: 'Saint Barthélemy', phoneCode: '+590', flag: '🇧🇱', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'SH', label: 'Saint Helena', phoneCode: '+290', flag: '🇸🇭', phoneFormat: '00000', phoneRegex: /^(?:\d{4}|\d{5})$/ },
  { value: 'KN', label: 'Saint Kitts and Nevis', phoneCode: '+1869', flag: '🇰🇳', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'LC', label: 'Saint Lucia', phoneCode: '+1758', flag: '🇱🇨', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'MF', label: 'Saint Martin', phoneCode: '+590', flag: '🇲🇫', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'PM', label: 'Saint Pierre and Miquelon', phoneCode: '+508', flag: '🇵🇲', phoneFormat: '000000', phoneRegex: /^(?:\d{6}|\d{9})$/ },
  { value: 'VC', label: 'Saint Vincent and the Grenadines', phoneCode: '+1784', flag: '🇻🇨', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'WS', label: 'Samoa', phoneCode: '+685', flag: '🇼🇸', phoneFormat: '00 00000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{10})$/ },
  { value: 'SM', label: 'San Marino', phoneCode: '+378', flag: '🇸🇲', phoneFormat: '00 00 00 00', phoneRegex: /^(?:\d{8}|\d{10})$/ },
  { value: 'ST', label: 'São Tomé and Príncipe', phoneCode: '+239', flag: '🇸🇹', phoneFormat: '000 0000', phoneRegex: /^\d{7}$/ },
  { value: 'SA', label: 'Saudi Arabia', phoneCode: '+966', flag: '🇸🇦', phoneFormat: '000000000', phoneRegex: /^(?:\d{9}|\d{10})$/ },
  { value: 'SN', label: 'Senegal', phoneCode: '+221', flag: '🇸🇳', phoneFormat: '00 000 00 00', phoneRegex: /^\d{9}$/ },
  { value: 'RS', label: 'Serbia', phoneCode: '+381', flag: '🇷🇸', phoneFormat: '000000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'SC', label: 'Seychelles', phoneCode: '+248', flag: '🇸🇨', phoneFormat: '0 000 000', phoneRegex: /^\d{7}$/ },
  { value: 'SL', label: 'Sierra Leone', phoneCode: '+232', flag: '🇸🇱', phoneFormat: '00000000', phoneRegex: /^\d{8}$/ },
  { value: 'SG', label: 'Singapore', phoneCode: '+65', flag: '🇸🇬', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{8}|\d{10}|\d{11})$/ },
  { value: 'SK', label: 'Slovakia', phoneCode: '+421', flag: '🇸🇰', phoneFormat: '000000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{9})$/ },
  { value: 'SI', label: 'Slovenia', phoneCode: '+386', flag: '🇸🇮', phoneFormat: '00000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8})$/ },
  { value: 'SB', label: 'Solomon Islands', phoneCode: '+677', flag: '🇸🇧', phoneFormat: '00 00000', phoneRegex: /^(?:\d{5}|\d{7})$/ },
  { value: 'SO', label: 'Somalia', phoneCode: '+252', flag: '🇸🇴', phoneFormat: '0 0000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9})$/ },
  { value: 'ZA', label: 'South Africa', phoneCode: '+27', flag: '🇿🇦', phoneFormat: '000000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10})$/ },
  { value: 'GS', label: 'South Georgia and the South Sandwich Islands', phoneCode: '+500', flag: '🇬🇸', phoneFormat: '0 00 000 0000', phoneRegex: /^\d{7,12}$/ },
  { value: 'KR', label: 'South Korea', phoneCode: '+82', flag: '🇰🇷', phoneFormat: '0000000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12}|\d{13}|\d{14})$/ },
  { value: 'SS', label: 'South Sudan', phoneCode: '+211', flag: '🇸🇸', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'ES', label: 'Spain', phoneCode: '+34', flag: '🇪🇸', phoneFormat: '000 00 00 00', phoneRegex: /^\d{9}$/ },
  { value: 'LK', label: 'Sri Lanka', phoneCode: '+94', flag: '🇱🇰', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'SD', label: 'Sudan', phoneCode: '+249', flag: '🇸🇩', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'SR', label: 'Suriname', phoneCode: '+597', flag: '🇸🇷', phoneFormat: '000-0000', phoneRegex: /^(?:\d{6}|\d{7})$/ },
  { value: 'SJ', label: 'Svalbard and Jan Mayen', phoneCode: '+47', flag: '🇸🇯', phoneFormat: '00 00 00 00', phoneRegex: /^(?:\d{5}|\d{8})$/ },
  { value: 'SE', label: 'Sweden', phoneCode: '+46', flag: '🇸🇪', phoneFormat: '000000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{12})$/ },
  { value: 'CH', label: 'Switzerland', phoneCode: '+41', flag: '🇨🇭', phoneFormat: '000000000', phoneRegex: /^(?:\d{9}|\d{12})$/ },
  { value: 'SY', label: 'Syria', phoneCode: '+963', flag: '🇸🇾', phoneFormat: '000 000 000', phoneRegex: /^(?:\d{8}|\d{9})$/ },
  { value: 'TW', label: 'Taiwan', phoneCode: '+886', flag: '🇹🇼', phoneFormat: '000000000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9}|\d{10}|\d{11})$/ },
  { value: 'TJ', label: 'Tajikistan', phoneCode: '+992', flag: '🇹🇯', phoneFormat: '00 000 0000', phoneRegex: /^\d{9}$/ },
  { value: 'TZ', label: 'Tanzania', phoneCode: '+255', flag: '🇹🇿', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'TH', label: 'Thailand', phoneCode: '+66', flag: '🇹🇭', phoneFormat: '000000000', phoneRegex: /^(?:\d{8}|\d{9}|\d{10}|\d{13})$/ },
  { value: 'TL', label: 'Timor-Leste', phoneCode: '+670', flag: '🇹🇱', phoneFormat: '0000 0000', phoneRegex: /^(?:\d{7}|\d{8})$/ },
  { value: 'TG', label: 'Togo', phoneCode: '+228', flag: '🇹🇬', phoneFormat: '00 00 00 00', phoneRegex: /^\d{8}$/ },
  { value: 'TK', label: 'Tokelau', phoneCode: '+690', flag: '🇹🇰', phoneFormat: '0000', phoneRegex: /^(?:\d{4}|\d{5}|\d{6}|\d{7})$/ },
  { value: 'TO', label: 'Tonga', phoneCode: '+676', flag: '🇹🇴', phoneFormat: '000 0000', phoneRegex: /^(?:\d{5}|\d{7})$/ },
  { value: 'TT', label: 'Trinidad and Tobago', phoneCode: '+1868', flag: '🇹🇹', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'TN', label: 'Tunisia', phoneCode: '+216', flag: '🇹🇳', phoneFormat: '00 000 000', phoneRegex: /^\d{8}$/ },
  { value: 'TR', label: 'Turkey', phoneCode: '+90', flag: '🇹🇷', phoneFormat: '000 000 00 00', phoneRegex: /^(?:\d{7}|\d{10}|\d{12}|\d{13})$/ },
  { value: 'TM', label: 'Turkmenistan', phoneCode: '+993', flag: '🇹🇲', phoneFormat: '00000000', phoneRegex: /^\d{8}$/ },
  { value: 'TC', label: 'Turks and Caicos Islands', phoneCode: '+1649', flag: '🇹🇨', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'TV', label: 'Tuvalu', phoneCode: '+688', flag: '🇹🇻', phoneFormat: '00 0000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7})$/ },
  { value: 'VI', label: 'U.S. Virgin Islands', phoneCode: '+1340', flag: '🇻🇮', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'UG', label: 'Uganda', phoneCode: '+256', flag: '🇺🇬', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'UA', label: 'Ukraine', phoneCode: '+380', flag: '🇺🇦', phoneFormat: '000000000', phoneRegex: /^(?:\d{9}|\d{10})$/ },
  { value: 'AE', label: 'United Arab Emirates', phoneCode: '+971', flag: '🇦🇪', phoneFormat: '000000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'GB', label: 'United Kingdom', phoneCode: '+44', flag: '🇬🇧', phoneFormat: '0000000000', phoneRegex: /^(?:\d{7}|\d{9}|\d{10})$/ },
  { value: 'US', label: 'United States', phoneCode: '+1', flag: '🇺🇸', phoneFormat: '(000) 000-0000', phoneRegex: /^\d{10}$/ },
  { value: 'UY', label: 'Uruguay', phoneCode: '+598', flag: '🇺🇾', phoneFormat: '00000000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12}|\d{13})$/ },
  { value: 'UZ', label: 'Uzbekistan', phoneCode: '+998', flag: '🇺🇿', phoneFormat: '00 000 00 00', phoneRegex: /^\d{9}$/ },
  { value: 'VU', label: 'Vanuatu', phoneCode: '+678', flag: '🇻🇺', phoneFormat: '000 0000', phoneRegex: /^(?:\d{5}|\d{7})$/ },
  { value: 'VA', label: 'Vatican City', phoneCode: '+379', flag: '🇻🇦', phoneFormat: '000 000 0000', phoneRegex: /^(?:\d{6}|\d{7}|\d{8}|\d{9}|\d{10}|\d{11}|\d{12})$/ },
  { value: 'VE', label: 'Venezuela', phoneCode: '+58', flag: '🇻🇪', phoneFormat: '0000000000', phoneRegex: /^\d{10}$/ },
  { value: 'VN', label: 'Vietnam', phoneCode: '+84', flag: '🇻🇳', phoneFormat: '000 000 000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9}|\d{10})$/ },
  { value: 'WF', label: 'Wallis and Futuna', phoneCode: '+681', flag: '🇼🇫', phoneFormat: '00 00 00', phoneRegex: /^(?:\d{6}|\d{9})$/ },
  { value: 'YE', label: 'Yemen', phoneCode: '+967', flag: '🇾🇪', phoneFormat: '000000000', phoneRegex: /^(?:\d{7}|\d{8}|\d{9})$/ },
  { value: 'ZM', label: 'Zambia', phoneCode: '+260', flag: '🇿🇲', phoneFormat: '000000000', phoneRegex: /^\d{9}$/ },
  { value: 'ZW', label: 'Zimbabwe', phoneCode: '+263', flag: '🇿🇼', phoneFormat: '000000000', phoneRegex: /^(?:\d{5}|\d{6}|\d{7}|\d{8}|\d{9}|\d{10})$/ },
];
/**
 * Enhanced timezones with country associations
 */
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
 * Default timezone mapping for each country
 */
export const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  'PH': 'Asia/Manila',
  'US': 'America/New_York',
  'CA': 'America/New_York', 
  'GB': 'Europe/London',
  'AU': 'Australia/Sydney',
  'DE': 'Europe/Berlin',
  'FR': 'Europe/Paris',
  'ES': 'Europe/Madrid',
  'IT': 'Europe/Rome',
  'JP': 'Asia/Tokyo',
  'CN': 'Asia/Shanghai',
  'IN': 'Asia/Kolkata',
  'BR': 'America/Sao_Paulo',
  'MX': 'America/Mexico_City',
  'NL': 'Europe/Amsterdam',
  'SE': 'Europe/Stockholm',
  'NO': 'Europe/Oslo',
  'DK': 'Europe/Copenhagen',
  'FI': 'Europe/Helsinki',
  'SG': 'Asia/Singapore',
  'MY': 'Asia/Kuala_Lumpur',
  'TH': 'Asia/Bangkok',
  'KR': 'Asia/Seoul',
  'ID': 'Asia/Jakarta',
  'VN': 'Asia/Ho_Chi_Minh',
  'TW': 'Asia/Taipei',
  'HK': 'Asia/Hong_Kong',
  'NZ': 'Pacific/Auckland',
  'ZA': 'Africa/Johannesburg',
  'RU': 'Europe/Moscow',
  'PL': 'Europe/Warsaw',
  'UA': 'Europe/Kyiv',
  'CZ': 'Europe/Prague',
  'GR': 'Europe/Athens',
  'PT': 'Europe/Lisbon',
  'TR': 'Europe/Istanbul',
  'SA': 'Asia/Riyadh',
  'AE': 'Asia/Dubai',
  'IL': 'Asia/Jerusalem',
  'KE': 'Africa/Nairobi',
  'NG': 'Africa/Lagos',
  'EG': 'Africa/Cairo',
  'CH': 'Europe/Zurich',
  'AT': 'Europe/Vienna',
  'BE': 'Europe/Brussels',
  'CL': 'America/Santiago',
  'CO': 'America/Bogota',
  'PE': 'America/Lima',
  'AR': 'America/Argentina/Buenos_Aires',
  'EC': 'America/Guayaquil',
  'DO': 'America/Santo_Domingo',
  'PR': 'America/Puerto_Rico',
  'LK': 'Asia/Colombo',
  'BD': 'Asia/Dhaka',
  'PK': 'Asia/Karachi',
};

/** Default when country code is missing or unknown (product default region). */
const DEFAULT_COUNTRY_CODE = 'PH';

function findCountryByCode(countryCode: string): Country | undefined {
  return COUNTRIES.find((c) => c.value === countryCode);
}

function findTimezoneByValue(timezoneValue: string): Timezone | undefined {
  return TIMEZONES.find((tz) => tz.value === timezoneValue);
}

export type SelectedPhoneCountry = Pick<Country, 'flag' | 'phoneCode' | 'label'>;

/**
 * Get country flag emoji by country code
 */
export function getCountryFlag(countryCode: string): string {
  const country = findCountryByCode(countryCode);
  return country?.flag ?? findCountryByCode(DEFAULT_COUNTRY_CODE)!.flag;
}

/**
 * Get phone code by country code
 */
export function getPhoneCode(countryCode: string): string {
  const country = findCountryByCode(countryCode);
  return country?.phoneCode ?? findCountryByCode(DEFAULT_COUNTRY_CODE)!.phoneCode;
}

/**
 * Get country display name by country code
 */
export function getCountryDisplayName(countryCode: string): string {
  const country = findCountryByCode(countryCode);
  return country?.label || '';
}

/**
 * Get timezone display name by timezone value
 */
export function getTimezoneDisplayName(timezoneValue: string): string {
  const timezone = findTimezoneByValue(timezoneValue);
  return timezone?.label || '';
}

/**
 * Get default timezone for a country
 */
export function getDefaultTimezoneForCountry(countryCode: string): string {
  return COUNTRY_TIMEZONE_MAP[countryCode] || 'America/New_York';
}

/**
 * Get selected phone country information
 */
export function getSelectedPhoneCountry(countryCode: string): SelectedPhoneCountry {
  const country = findCountryByCode(countryCode);
  if (country) {
    return {
      flag: country.flag,
      phoneCode: country.phoneCode,
      label: country.label,
    };
  }
  const fallback = findCountryByCode(DEFAULT_COUNTRY_CODE)!;
  return {
    flag: fallback.flag,
    phoneCode: fallback.phoneCode,
    label: fallback.label,
  };
}