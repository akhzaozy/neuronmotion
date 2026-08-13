/**
 * Daftar negara ISO 3166-1 beserta kawasannya.
 * Dibangkitkan dari data ISO 3166 publik (lukes/ISO-3166-Countries-with-Regional-Codes),
 * dipakai untuk dropdown pendaftaran agar aplikasi dapat digunakan lintas negara.
 */

export interface Country {
  code: string;
  name: string;
  region: string;
  subregion: string;
}

export const COUNTRIES: Country[] = [
  {
    "code": "AF",
    "name": "Afghanistan",
    "region": "Asia",
    "subregion": "Southern Asia"
  },
  {
    "code": "AL",
    "name": "Albania",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "DZ",
    "name": "Algeria",
    "region": "Africa",
    "subregion": "Northern Africa"
  },
  {
    "code": "AS",
    "name": "American Samoa",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "AD",
    "name": "Andorra",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "AO",
    "name": "Angola",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "AI",
    "name": "Anguilla",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "AQ",
    "name": "Antarctica",
    "region": "Other",
    "subregion": ""
  },
  {
    "code": "AG",
    "name": "Antigua and Barbuda",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "AR",
    "name": "Argentina",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "AM",
    "name": "Armenia",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "AW",
    "name": "Aruba",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "AU",
    "name": "Australia",
    "region": "Oceania",
    "subregion": "Australia and New Zealand"
  },
  {
    "code": "AT",
    "name": "Austria",
    "region": "Europe",
    "subregion": "Western Europe"
  },
  {
    "code": "AZ",
    "name": "Azerbaijan",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "BS",
    "name": "Bahamas",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "BH",
    "name": "Bahrain",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "BD",
    "name": "Bangladesh",
    "region": "Asia",
    "subregion": "Southern Asia"
  },
  {
    "code": "BB",
    "name": "Barbados",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "BY",
    "name": "Belarus",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "BE",
    "name": "Belgium",
    "region": "Europe",
    "subregion": "Western Europe"
  },
  {
    "code": "BZ",
    "name": "Belize",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "BJ",
    "name": "Benin",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "BM",
    "name": "Bermuda",
    "region": "Americas",
    "subregion": "Northern America"
  },
  {
    "code": "BT",
    "name": "Bhutan",
    "region": "Asia",
    "subregion": "Southern Asia"
  },
  {
    "code": "BO",
    "name": "Bolivia, Plurinational State of",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "BQ",
    "name": "Bonaire, Sint Eustatius and Saba",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "BA",
    "name": "Bosnia and Herzegovina",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "BW",
    "name": "Botswana",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "BV",
    "name": "Bouvet Island",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "BR",
    "name": "Brazil",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "IO",
    "name": "British Indian Ocean Territory",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "BN",
    "name": "Brunei Darussalam",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "BG",
    "name": "Bulgaria",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "BF",
    "name": "Burkina Faso",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "BI",
    "name": "Burundi",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "CV",
    "name": "Cabo Verde",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "KH",
    "name": "Cambodia",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "CM",
    "name": "Cameroon",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "CA",
    "name": "Canada",
    "region": "Americas",
    "subregion": "Northern America"
  },
  {
    "code": "KY",
    "name": "Cayman Islands",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "CF",
    "name": "Central African Republic",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "TD",
    "name": "Chad",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "CL",
    "name": "Chile",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "CN",
    "name": "China",
    "region": "Asia",
    "subregion": "Eastern Asia"
  },
  {
    "code": "CX",
    "name": "Christmas Island",
    "region": "Oceania",
    "subregion": "Australia and New Zealand"
  },
  {
    "code": "CC",
    "name": "Cocos (Keeling) Islands",
    "region": "Oceania",
    "subregion": "Australia and New Zealand"
  },
  {
    "code": "CO",
    "name": "Colombia",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "KM",
    "name": "Comoros",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "CG",
    "name": "Congo",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "CD",
    "name": "Congo, Democratic Republic of the",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "CK",
    "name": "Cook Islands",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "CR",
    "name": "Costa Rica",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "HR",
    "name": "Croatia",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "CU",
    "name": "Cuba",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "CW",
    "name": "Curaçao",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "CY",
    "name": "Cyprus",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "CZ",
    "name": "Czechia",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "CI",
    "name": "Côte d'Ivoire",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "DK",
    "name": "Denmark",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "DJ",
    "name": "Djibouti",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "DM",
    "name": "Dominica",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "DO",
    "name": "Dominican Republic",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "EC",
    "name": "Ecuador",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "EG",
    "name": "Egypt",
    "region": "Africa",
    "subregion": "Northern Africa"
  },
  {
    "code": "SV",
    "name": "El Salvador",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "GQ",
    "name": "Equatorial Guinea",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "ER",
    "name": "Eritrea",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "EE",
    "name": "Estonia",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "SZ",
    "name": "Eswatini",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "ET",
    "name": "Ethiopia",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "FK",
    "name": "Falkland Islands (Malvinas)",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "FO",
    "name": "Faroe Islands",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "FJ",
    "name": "Fiji",
    "region": "Oceania",
    "subregion": "Melanesia"
  },
  {
    "code": "FI",
    "name": "Finland",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "FR",
    "name": "France",
    "region": "Europe",
    "subregion": "Western Europe"
  },
  {
    "code": "GF",
    "name": "French Guiana",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "PF",
    "name": "French Polynesia",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "TF",
    "name": "French Southern Territories",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "GA",
    "name": "Gabon",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "GM",
    "name": "Gambia",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "GE",
    "name": "Georgia",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "DE",
    "name": "Germany",
    "region": "Europe",
    "subregion": "Western Europe"
  },
  {
    "code": "GH",
    "name": "Ghana",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "GI",
    "name": "Gibraltar",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "GR",
    "name": "Greece",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "GL",
    "name": "Greenland",
    "region": "Americas",
    "subregion": "Northern America"
  },
  {
    "code": "GD",
    "name": "Grenada",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "GP",
    "name": "Guadeloupe",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "GU",
    "name": "Guam",
    "region": "Oceania",
    "subregion": "Micronesia"
  },
  {
    "code": "GT",
    "name": "Guatemala",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "GG",
    "name": "Guernsey",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "GN",
    "name": "Guinea",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "GW",
    "name": "Guinea-Bissau",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "GY",
    "name": "Guyana",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "HT",
    "name": "Haiti",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "HM",
    "name": "Heard Island and McDonald Islands",
    "region": "Oceania",
    "subregion": "Australia and New Zealand"
  },
  {
    "code": "VA",
    "name": "Holy See",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "HN",
    "name": "Honduras",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "HK",
    "name": "Hong Kong",
    "region": "Asia",
    "subregion": "Eastern Asia"
  },
  {
    "code": "HU",
    "name": "Hungary",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "IS",
    "name": "Iceland",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "IN",
    "name": "India",
    "region": "Asia",
    "subregion": "Southern Asia"
  },
  {
    "code": "ID",
    "name": "Indonesia",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "IR",
    "name": "Iran, Islamic Republic of",
    "region": "Asia",
    "subregion": "Southern Asia"
  },
  {
    "code": "IQ",
    "name": "Iraq",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "IE",
    "name": "Ireland",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "IM",
    "name": "Isle of Man",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "IL",
    "name": "Israel",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "IT",
    "name": "Italy",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "JM",
    "name": "Jamaica",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "JP",
    "name": "Japan",
    "region": "Asia",
    "subregion": "Eastern Asia"
  },
  {
    "code": "JE",
    "name": "Jersey",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "JO",
    "name": "Jordan",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "KZ",
    "name": "Kazakhstan",
    "region": "Asia",
    "subregion": "Central Asia"
  },
  {
    "code": "KE",
    "name": "Kenya",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "KI",
    "name": "Kiribati",
    "region": "Oceania",
    "subregion": "Micronesia"
  },
  {
    "code": "KP",
    "name": "Korea, Democratic People's Republic of",
    "region": "Asia",
    "subregion": "Eastern Asia"
  },
  {
    "code": "KR",
    "name": "Korea, Republic of",
    "region": "Asia",
    "subregion": "Eastern Asia"
  },
  {
    "code": "KW",
    "name": "Kuwait",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "KG",
    "name": "Kyrgyzstan",
    "region": "Asia",
    "subregion": "Central Asia"
  },
  {
    "code": "LA",
    "name": "Lao People's Democratic Republic",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "LV",
    "name": "Latvia",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "LB",
    "name": "Lebanon",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "LS",
    "name": "Lesotho",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "LR",
    "name": "Liberia",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "LY",
    "name": "Libya",
    "region": "Africa",
    "subregion": "Northern Africa"
  },
  {
    "code": "LI",
    "name": "Liechtenstein",
    "region": "Europe",
    "subregion": "Western Europe"
  },
  {
    "code": "LT",
    "name": "Lithuania",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "LU",
    "name": "Luxembourg",
    "region": "Europe",
    "subregion": "Western Europe"
  },
  {
    "code": "MO",
    "name": "Macao",
    "region": "Asia",
    "subregion": "Eastern Asia"
  },
  {
    "code": "MG",
    "name": "Madagascar",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "MW",
    "name": "Malawi",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "MY",
    "name": "Malaysia",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "MV",
    "name": "Maldives",
    "region": "Asia",
    "subregion": "Southern Asia"
  },
  {
    "code": "ML",
    "name": "Mali",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "MT",
    "name": "Malta",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "MH",
    "name": "Marshall Islands",
    "region": "Oceania",
    "subregion": "Micronesia"
  },
  {
    "code": "MQ",
    "name": "Martinique",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "MR",
    "name": "Mauritania",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "MU",
    "name": "Mauritius",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "YT",
    "name": "Mayotte",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "MX",
    "name": "Mexico",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "FM",
    "name": "Micronesia, Federated States of",
    "region": "Oceania",
    "subregion": "Micronesia"
  },
  {
    "code": "MD",
    "name": "Moldova, Republic of",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "MC",
    "name": "Monaco",
    "region": "Europe",
    "subregion": "Western Europe"
  },
  {
    "code": "MN",
    "name": "Mongolia",
    "region": "Asia",
    "subregion": "Eastern Asia"
  },
  {
    "code": "ME",
    "name": "Montenegro",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "MS",
    "name": "Montserrat",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "MA",
    "name": "Morocco",
    "region": "Africa",
    "subregion": "Northern Africa"
  },
  {
    "code": "MZ",
    "name": "Mozambique",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "MM",
    "name": "Myanmar",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "NA",
    "name": "Namibia",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "NR",
    "name": "Nauru",
    "region": "Oceania",
    "subregion": "Micronesia"
  },
  {
    "code": "NP",
    "name": "Nepal",
    "region": "Asia",
    "subregion": "Southern Asia"
  },
  {
    "code": "NL",
    "name": "Netherlands, Kingdom of the",
    "region": "Europe",
    "subregion": "Western Europe"
  },
  {
    "code": "NC",
    "name": "New Caledonia",
    "region": "Oceania",
    "subregion": "Melanesia"
  },
  {
    "code": "NZ",
    "name": "New Zealand",
    "region": "Oceania",
    "subregion": "Australia and New Zealand"
  },
  {
    "code": "NI",
    "name": "Nicaragua",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "NE",
    "name": "Niger",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "NG",
    "name": "Nigeria",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "NU",
    "name": "Niue",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "NF",
    "name": "Norfolk Island",
    "region": "Oceania",
    "subregion": "Australia and New Zealand"
  },
  {
    "code": "MK",
    "name": "North Macedonia",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "MP",
    "name": "Northern Mariana Islands",
    "region": "Oceania",
    "subregion": "Micronesia"
  },
  {
    "code": "NO",
    "name": "Norway",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "OM",
    "name": "Oman",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "PK",
    "name": "Pakistan",
    "region": "Asia",
    "subregion": "Southern Asia"
  },
  {
    "code": "PW",
    "name": "Palau",
    "region": "Oceania",
    "subregion": "Micronesia"
  },
  {
    "code": "PS",
    "name": "Palestine, State of",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "PA",
    "name": "Panama",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "PG",
    "name": "Papua New Guinea",
    "region": "Oceania",
    "subregion": "Melanesia"
  },
  {
    "code": "PY",
    "name": "Paraguay",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "PE",
    "name": "Peru",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "PH",
    "name": "Philippines",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "PN",
    "name": "Pitcairn",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "PL",
    "name": "Poland",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "PT",
    "name": "Portugal",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "PR",
    "name": "Puerto Rico",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "QA",
    "name": "Qatar",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "RO",
    "name": "Romania",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "RU",
    "name": "Russian Federation",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "RW",
    "name": "Rwanda",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "RE",
    "name": "Réunion",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "BL",
    "name": "Saint Barthélemy",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "SH",
    "name": "Saint Helena, Ascension and Tristan da Cunha",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "KN",
    "name": "Saint Kitts and Nevis",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "LC",
    "name": "Saint Lucia",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "MF",
    "name": "Saint Martin (French part)",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "PM",
    "name": "Saint Pierre and Miquelon",
    "region": "Americas",
    "subregion": "Northern America"
  },
  {
    "code": "VC",
    "name": "Saint Vincent and the Grenadines",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "WS",
    "name": "Samoa",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "SM",
    "name": "San Marino",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "ST",
    "name": "Sao Tome and Principe",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "SA",
    "name": "Saudi Arabia",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "SN",
    "name": "Senegal",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "RS",
    "name": "Serbia",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "SC",
    "name": "Seychelles",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "SL",
    "name": "Sierra Leone",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "SG",
    "name": "Singapore",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "SX",
    "name": "Sint Maarten (Dutch part)",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "SK",
    "name": "Slovakia",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "SI",
    "name": "Slovenia",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "SB",
    "name": "Solomon Islands",
    "region": "Oceania",
    "subregion": "Melanesia"
  },
  {
    "code": "SO",
    "name": "Somalia",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "ZA",
    "name": "South Africa",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "GS",
    "name": "South Georgia and the South Sandwich Islands",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "SS",
    "name": "South Sudan",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "ES",
    "name": "Spain",
    "region": "Europe",
    "subregion": "Southern Europe"
  },
  {
    "code": "LK",
    "name": "Sri Lanka",
    "region": "Asia",
    "subregion": "Southern Asia"
  },
  {
    "code": "SD",
    "name": "Sudan",
    "region": "Africa",
    "subregion": "Northern Africa"
  },
  {
    "code": "SR",
    "name": "Suriname",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "SJ",
    "name": "Svalbard and Jan Mayen",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "SE",
    "name": "Sweden",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "CH",
    "name": "Switzerland",
    "region": "Europe",
    "subregion": "Western Europe"
  },
  {
    "code": "SY",
    "name": "Syrian Arab Republic",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "TW",
    "name": "Taiwan, Province of China",
    "region": "Other",
    "subregion": ""
  },
  {
    "code": "TJ",
    "name": "Tajikistan",
    "region": "Asia",
    "subregion": "Central Asia"
  },
  {
    "code": "TZ",
    "name": "Tanzania, United Republic of",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "TH",
    "name": "Thailand",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "TL",
    "name": "Timor-Leste",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "TG",
    "name": "Togo",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "TK",
    "name": "Tokelau",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "TO",
    "name": "Tonga",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "TT",
    "name": "Trinidad and Tobago",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "TN",
    "name": "Tunisia",
    "region": "Africa",
    "subregion": "Northern Africa"
  },
  {
    "code": "TM",
    "name": "Turkmenistan",
    "region": "Asia",
    "subregion": "Central Asia"
  },
  {
    "code": "TC",
    "name": "Turks and Caicos Islands",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "TV",
    "name": "Tuvalu",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "TR",
    "name": "Türkiye",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "UG",
    "name": "Uganda",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "UA",
    "name": "Ukraine",
    "region": "Europe",
    "subregion": "Eastern Europe"
  },
  {
    "code": "AE",
    "name": "United Arab Emirates",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "GB",
    "name": "United Kingdom of Great Britain and Northern Ireland",
    "region": "Europe",
    "subregion": "Northern Europe"
  },
  {
    "code": "UM",
    "name": "United States Minor Outlying Islands",
    "region": "Oceania",
    "subregion": "Micronesia"
  },
  {
    "code": "US",
    "name": "United States of America",
    "region": "Americas",
    "subregion": "Northern America"
  },
  {
    "code": "UY",
    "name": "Uruguay",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "UZ",
    "name": "Uzbekistan",
    "region": "Asia",
    "subregion": "Central Asia"
  },
  {
    "code": "VU",
    "name": "Vanuatu",
    "region": "Oceania",
    "subregion": "Melanesia"
  },
  {
    "code": "VE",
    "name": "Venezuela, Bolivarian Republic of",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "VN",
    "name": "Viet Nam",
    "region": "Asia",
    "subregion": "South-eastern Asia"
  },
  {
    "code": "VG",
    "name": "Virgin Islands (British)",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "VI",
    "name": "Virgin Islands (U.S.)",
    "region": "Americas",
    "subregion": "Latin America and the Caribbean"
  },
  {
    "code": "WF",
    "name": "Wallis and Futuna",
    "region": "Oceania",
    "subregion": "Polynesia"
  },
  {
    "code": "EH",
    "name": "Western Sahara",
    "region": "Africa",
    "subregion": "Northern Africa"
  },
  {
    "code": "YE",
    "name": "Yemen",
    "region": "Asia",
    "subregion": "Western Asia"
  },
  {
    "code": "ZM",
    "name": "Zambia",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "ZW",
    "name": "Zimbabwe",
    "region": "Africa",
    "subregion": "Sub-Saharan Africa"
  },
  {
    "code": "AX",
    "name": "Åland Islands",
    "region": "Europe",
    "subregion": "Northern Europe"
  }
];

/** Kawasan unik untuk dropdown Region, diturunkan dari data negara. */
export const REGIONS: string[] = Array.from(
  new Set(COUNTRIES.map(c => c.region))
).sort();

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/** Kawasan yang sesuai untuk sebuah negara, dipakai mengisi Region otomatis. */
export function getRegionForCountry(code: string): string {
  return getCountry(code)?.region ?? '';
}
