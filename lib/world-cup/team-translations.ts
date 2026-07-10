const TEAM_NAME_TRANSLATIONS_BY_FIFA_CODE: Record<string, string> = {
  ARG: "Argentina",
  AUS: "Austrália",
  BEL: "Bélgica",
  BRA: "Brasil",
  CAN: "Canadá",
  CHI: "Chile",
  CHN: "China",
  COL: "Colômbia",
  CRC: "Costa Rica",
  CRO: "Croácia",
  CZE: "República Tcheca",
  DEN: "Dinamarca",
  ECU: "Equador",
  EGY: "Egito",
  ENG: "Inglaterra",
  ESP: "Espanha",
  FRA: "França",
  GER: "Alemanha",
  GHA: "Gana",
  IRN: "Irã",
  ITA: "Itália",
  JPN: "Japão",
  KOR: "Coreia do Sul",
  MAR: "Marrocos",
  MEX: "México",
  NED: "Holanda",
  NGA: "Nigéria",
  NOR: "Noruega",
  NZL: "Nova Zelândia",
  PAR: "Paraguai",
  PER: "Peru",
  POL: "Polônia",
  POR: "Portugal",
  QAT: "Catar",
  RSA: "África do Sul",
  KSA: "Arábia Saudita",
  SCO: "Escócia",
  SEN: "Senegal",
  SRB: "Sérvia",
  SUI: "Suíça",
  SWE: "Suécia",
  TUN: "Tunísia",
  UKR: "Ucrânia",
  URU: "Uruguai",
  USA: "Estados Unidos",
};

const TEAM_NAME_TRANSLATIONS_BY_ENGLISH_NAME: Record<string, string> = {
  Algeria: "Argélia",
  Argentina: "Argentina",
  Australia: "Austrália",
  Austria: "Áustria",
  Belgium: "Bélgica",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  Brazil: "Brasil",
  Canada: "Canadá",
  "Cape Verde": "Cabo Verde",
  Chile: "Chile",
  China: "China",
  Colombia: "Colômbia",
  "Costa Rica": "Costa Rica",
  Croatia: "Croácia",
  "Czech Republic": "República Tcheca",
  "Democratic Republic of the Congo": "RD do Congo",
  Denmark: "Dinamarca",
  Ecuador: "Equador",
  Egypt: "Egito",
  England: "Inglaterra",
  France: "França",
  Germany: "Alemanha",
  Ghana: "Gana",
  Iran: "Irã",
  Iraq: "Iraque",
  Italy: "Itália",
  "Ivory Coast": "Costa do Marfim",
  Japan: "Japão",
  Jordan: "Jordânia",
  Mexico: "México",
  Morocco: "Marrocos",
  Netherlands: "Holanda",
  Nigeria: "Nigéria",
  Norway: "Noruega",
  "New Zealand": "Nova Zelândia",
  Paraguay: "Paraguai",
  Peru: "Peru",
  Poland: "Polônia",
  Portugal: "Portugal",
  Qatar: "Catar",
  "Saudi Arabia": "Arábia Saudita",
  Scotland: "Escócia",
  Senegal: "Senegal",
  Serbia: "Sérvia",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  Spain: "Espanha",
  Switzerland: "Suíça",
  Sweden: "Suécia",
  Tunisia: "Tunísia",
  Turkey: "Turquia",
  Ukraine: "Ucrânia",
  "United States": "Estados Unidos",
  USA: "Estados Unidos",
  Uruguay: "Uruguai",
  Uzbekistan: "Uzbequistão",
};

export function translateTeamName({
  name,
  fifaCode,
}: {
  name: string | null | undefined;
  fifaCode?: string | null;
}) {
  if (fifaCode) {
    const translatedByCode =
      TEAM_NAME_TRANSLATIONS_BY_FIFA_CODE[fifaCode.toUpperCase()];

    if (translatedByCode) {
      return translatedByCode;
    }
  }

  if (name) {
    const translatedByName = TEAM_NAME_TRANSLATIONS_BY_ENGLISH_NAME[name];

    if (translatedByName) {
      return translatedByName;
    }
  }

  return name ?? "-";
}
