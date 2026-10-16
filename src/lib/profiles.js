// Fiche de chaque champion pour l'analyse de draft : 'dégâts scaling traits'
//
// Dégâts : P = physiques, M = magiques, X = mixtes
// Scaling : e = early, m = mid game, l = late game
// Traits, en majuscule si c'est un point fort du champion, en minuscule si c'est un apport secondaire (compte pour moitié) :
//   F = frontline (encaisse)                     E = engage (lance le fight sur le groupe adverse)
//   V = plongée (saute sur la backline adverse)  R = réception (désengage, contre-engage)
//   C = contrôle fiable (CC)                     D = dégâts soutenus en fight
//   K = poke / siège                             A = pick / burst (assassin)
//   S = split push / side lane                   P = peel (protège ses carries : soins, boucliers, CC sur les plongeurs)
//
// Engage ou plongée : Malphite engage tout le groupe, Vi plonge sur un carry.
// Peel ou réception : Lulu protège un allié, Braum casse l'engage adverse.
// Les champions absents de la liste (ex : sortis récemment) sont estimés via les tags Riot.
// N'hésitez pas à corriger une fiche si vous n'êtes pas d'accord !
export const PROFILES = {
  Aatrox: 'P m FSDc',
  Ahri: 'M m ACv',
  Akali: 'M m AVS',
  Akshan: 'P m AS',
  Alistar: 'M e FECPrv',
  Ambessa: 'P m VSAe',
  Amumu: 'M m FEC',
  Anivia: 'M l CDR',
  Annie: 'M m ECa',
  Aphelios: 'P l D',
  Ashe: 'P m DCea',
  AurelionSol: 'M l DC',
  Aurora: 'M m ACs',
  Azir: 'M l DCRe',
  Bard: 'M m CPra',
  Belveth: 'P l SD',
  Blitzcrank: 'M e CAe',
  Brand: 'M m KDc',
  Braum: 'M m FPCR',
  Briar: 'P e VADe',
  Caitlyn: 'P e KD',
  Camille: 'P m VSAe',
  Cassiopeia: 'M l DC',
  Chogath: 'M m FC',
  Corki: 'X m KD',
  Darius: 'P e FDc',
  Diana: 'M m EVAd',
  DrMundo: 'P l FS',
  Draven: 'P e D',
  Ekko: 'M m ASvc',
  Elise: 'M e ACv',
  Evelynn: 'M m AV',
  Ezreal: 'P m KD',
  Fiddlesticks: 'M m ECd',
  Fiora: 'P l S',
  Fizz: 'M m AV',
  Galio: 'M m FECRp',
  Gangplank: 'P l SKd',
  Garen: 'P m FS',
  Gnar: 'P m FECRk',
  Gragas: 'M m FECRp',
  Graves: 'P m D',
  Gwen: 'M m DSv',
  Hecarim: 'P m FEVc',
  Heimerdinger: 'M m Kcd',
  Hwei: 'M m KCd',
  Illaoi: 'P m FS',
  Irelia: 'P m SDVe',
  Ivern: 'M m Pce',
  Janna: 'M m PRc',
  JarvanIV: 'P e FECv',
  Jax: 'P l SFdv',
  Jayce: 'P e KS',
  Jhin: 'P m KCa',
  Jinx: 'P l Dc',
  Kaisa: 'X l DAv',
  Kalista: 'P e Dep',
  Karma: 'M e KPr',
  Karthus: 'M l D',
  Kassadin: 'M l AV',
  Katarina: 'M m AVd',
  Kayle: 'X l Dp',
  Kayn: 'P m AV',
  Kennen: 'M m ECd',
  Khazix: 'P m AV',
  Kindred: 'P l Dp',
  Kled: 'P e FEv',
  KogMaw: 'X l Dk',
  KSante: 'P m FECp',
  Leblanc: 'M m Acv',
  LeeSin: 'P e AVe',
  Leona: 'M e FECv',
  Lillia: 'M m DCe',
  Lissandra: 'M m ECR',
  // Fiche à valider : champion récent, estimée à partir de son kit (assassin de mêlée, exécution sur l'ulti).
  Locke: 'P m AVd',
  Lucian: 'P e D',
  Lulu: 'M m PCr',
  Lux: 'M m KCp',
  Malphite: 'M m FEC',
  Malzahar: 'M m Cad',
  Maokai: 'M m FECr',
  MasterYi: 'P l DSv',
  Mel: 'M m KCr',
  Milio: 'M m Pr',
  MissFortune: 'P m D',
  MonkeyKing: 'P m ECfv',
  Mordekaiser: 'M m FSa',
  Morgana: 'M m CPar',
  Naafiri: 'P e AV',
  Nami: 'M m CPr',
  Nasus: 'P l FS',
  Nautilus: 'M e FECav',
  Neeko: 'M m EC',
  Nidalee: 'M e KA',
  Nilah: 'P l Dev',
  Nocturne: 'P m VAe',
  Nunu: 'M m FEC',
  Olaf: 'P e FDv',
  Orianna: 'M m DCpr',
  Ornn: 'M l FEC',
  Pantheon: 'P e AEv',
  Poppy: 'P m FCRpe',
  Pyke: 'P e ACv',
  Qiyana: 'P m AVce',
  Quinn: 'P e AS',
  Rakan: 'M m ECpv',
  Rammus: 'M m FEC',
  RekSai: 'P e Vace',
  Rell: 'M m FECrv',
  Renata: 'M m PRc',
  Renekton: 'P e FVce',
  Rengar: 'P m AV',
  Riven: 'P m SAcv',
  Rumble: 'M m Dc',
  Ryze: 'M l DSc',
  Samira: 'P m Dv',
  Sejuani: 'M m FEC',
  Senna: 'P l KP',
  Seraphine: 'M m PKCr',
  Sett: 'P e FEcv',
  Shaco: 'P e AV',
  Shen: 'M m FEPS',
  Shyvana: 'M m FD',
  Singed: 'M m FS',
  Sion: 'P m FEC',
  Sivir: 'P m Dr',
  Skarner: 'P m FECa',
  Smolder: 'P l D',
  Sona: 'M l PCk',
  Soraka: 'M m Pr',
  Swain: 'M m FDC',
  Sylas: 'M m Acdv',
  Syndra: 'M m AC',
  TahmKench: 'M m FPc',
  Taliyah: 'M m CRk',
  Talon: 'P e AV',
  Taric: 'M m PRCf',
  Teemo: 'M m KS',
  Thresh: 'M m CPAr',
  Tristana: 'P l D',
  Trundle: 'P m FSc',
  Tryndamere: 'P l S',
  TwistedFate: 'M m ASc',
  Twitch: 'P l Da',
  Udyr: 'X m FS',
  Urgot: 'P m FSc',
  Varus: 'P m KCe',
  Vayne: 'P l D',
  Veigar: 'M l ACr',
  Velkoz: 'M m KDc',
  Vex: 'M m ACre',
  Vi: 'P e VAce',
  Viego: 'P m DAv',
  Viktor: 'M l DKc',
  Vladimir: 'M l D',
  Volibear: 'X e FVce',
  Warwick: 'X e FVae',
  Xayah: 'P m DR',
  Xerath: 'M m Kc',
  XinZhao: 'P e Vecd',
  Yasuo: 'P m Dcev',
  Yone: 'X m DEcv',
  Yorick: 'P m S',
  Yunara: 'P l D',
  Yuumi: 'M m P',
  Zaahen: 'P m FSDc',
  Zac: 'M m FECv',
  Zed: 'P m AVs',
  Zeri: 'P l D',
  Ziggs: 'M m Kr',
  Zilean: 'M m PRkc',
  Zoe: 'M m KA',
  Zyra: 'M m KCd',
}

// Fiches qui changent selon le rôle : même champion, autre fonction dans la compo.
export const ROLE_PROFILES = {
  Camille: { support: 'P m VAEc' },
  Senna: { adc: 'P l KDp' },
  Seraphine: { mid: 'M m DKCr', adc: 'M m DKCr' },
  Shen: { support: 'M m FEP' },
  TahmKench: { top: 'M m FSpc' },
}

// Estimation à partir des tags Data Dragon pour les champions sans fiche.
const TAG_TRAITS = {
  Tank: 'FEC',
  Fighter: 'FSd',
  Assassin: 'AV',
  Mage: 'Dk',
  Marksman: 'D',
  Support: 'P',
}

// 'FEcp' → { F: 1, E: 1, C: 0.5, P: 0.5 }
function parseTraits(letters) {
  const traits = {}
  for (const ch of letters) {
    const key = ch.toUpperCase()
    traits[key] = Math.max(traits[key] ?? 0, ch === key ? 1 : 0.5)
  }
  return traits
}

// `champ` : champion Data Dragon ({ id, tags, info }) ou au minimum { id }.
export function getProfile(champ, role) {
  const raw = ROLE_PROFILES[champ.id]?.[role] ?? PROFILES[champ.id]
  if (raw) {
    const [damage, scaling, traits = ''] = raw.split(' ')
    return { damage, scaling, traits: parseTraits(traits), estimated: false }
  }
  const traits = parseTraits((champ.tags ?? []).map((t) => TAG_TRAITS[t] ?? '').join(''))
  const damage = (champ.info?.magic ?? 0) > (champ.info?.attack ?? 0) ? 'M' : 'P'
  const scaling = champ.tags?.includes('Marksman') ? 'l' : 'm'
  return { damage, scaling, traits, estimated: true }
}

// Poids d'un trait dans une fiche : 1 (point fort), 0.5 (secondaire) ou 0.
export const traitWeight = (profile, key) => profile.traits[key] ?? 0
