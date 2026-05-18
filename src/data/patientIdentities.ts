export type SouthAfricanGroup =
  | 'black-african'
  | 'coloured'
  | 'indian-asian'
  | 'white'
  | 'other';

export type CulturalNamePool =
  | 'zulu'
  | 'xhosa'
  | 'sotho-tswana-pedi'
  | 'venda-tsonga'
  | 'ndebele-swati'
  | 'afrikaans'
  | 'english-sa'
  | 'cape-coloured'
  | 'indian-sa'
  | 'mixed-sa';

export type PatientIdentityGender = 'M' | 'F';
export type PatientAvatarRace = 'black' | 'white' | 'indian' | 'asian';

export interface PatientIdentity {
  caseId: string;
  displayName: string;
  gender: PatientIdentityGender;
  southAfricanGroup: SouthAfricanGroup;
  culturalNamePool: CulturalNamePool;
  avatarRace: PatientAvatarRace;
  avatarId: string;
}

export interface PatientIdentitySeed {
  id: string;
  gender: PatientIdentityGender;
}

const MPHO_MOLEFE_SAMPLE_AVATAR_ID = 'phase49-mpho-mixamo-sitting-talking';
const COLOURED_FALLBACK_RACES: PatientAvatarRace[] = ['black', 'white', 'indian'];
const OTHER_FALLBACK_RACES: PatientAvatarRace[] = ['black', 'white', 'indian', 'asian'];

type NamePool = {
  group: SouthAfricanGroup;
  pool: CulturalNamePool;
  femaleFirst: string[];
  maleFirst: string[];
  surnames: string[];
};

const NAME_POOLS: Record<CulturalNamePool, NamePool> = {
  zulu: {
    group: 'black-african',
    pool: 'zulu',
    femaleFirst: ['Amahle', 'Ayanda', 'Buhle', 'Busisiwe', 'Gugu', 'Khanyisile', 'Lindiwe', 'Mbali', 'Nandi', 'Noluthando', 'Nomsa', 'Nomvula', 'Nozipho', 'Ntombifuthi', 'Siphesihle', 'Thandiwe', 'Zanele', 'Zinhle'],
    maleFirst: ['Andile', 'Bhekizizwe', 'Bongani', 'Dumisani', 'Jabulani', 'Lindani', 'Mandla', 'Mlungisi', 'Mthokozisi', 'Mxolisi', 'Nkosinathi', 'Sandile', 'Sibusiso', 'Sipho', 'Siyabonga', 'Sizwe', 'Themba', 'Thulani', 'Vusi', 'Zweli'],
    surnames: ['Buthelezi', 'Cele', 'Dlamini', 'Gumede', 'Hlongwane', 'Khumalo', 'Mbatha', 'Mhlongo', 'Mkhize', 'Mthembu', 'Ndlovu', 'Ngcobo', 'Ntuli', 'Nxumalo', 'Shabalala', 'Sithole', 'Zulu'],
  },
  xhosa: {
    group: 'black-african',
    pool: 'xhosa',
    femaleFirst: ['Aphiwe', 'Asanda', 'Babalwa', 'Buhle', 'Fundiswa', 'Lindiwe', 'Lulama', 'Mandisa', 'Nosipho', 'Noxolo', 'Olwethu', 'Simamkele', 'Thembeka', 'Zandile', 'Zimkhitha'],
    maleFirst: ['Akhona', 'Luthando', 'Lwazi', 'Mandla', 'Sihle', 'Siphosethu', 'Siyamthanda', 'Thando', 'Vuyo', 'Xolani', 'Zolani'],
    surnames: ['Gcaba', 'Goniwe', 'Gqola', 'Jali', 'Mbeki', 'Mlanjeni', 'Mqadi', 'Mvandaba', 'Ngqele', 'Nkomo', 'Nqakula', 'Ntloko', 'Poni', 'Tutu', 'Tyulu'],
  },
  'sotho-tswana-pedi': {
    group: 'black-african',
    pool: 'sotho-tswana-pedi',
    femaleFirst: ['Bokang', 'Bonolo', 'Dineo', 'Keabetswe', 'Kgomotso', 'Lerato', 'Lesedi', 'Mpho', 'Naledi', 'Neo', 'Palesa', 'Refilwe', 'Tebogo'],
    maleFirst: ['Kabelo', 'Kagiso', 'Katlego', 'Lebohang', 'Lehlohonolo', 'Mohau', 'Sello', 'Thabo', 'Teboho', 'Tshepo', 'Tumelo'],
    surnames: ['Maake', 'Makgoba', 'Maseko', 'Matlala', 'Mofokeng', 'Mokoena', 'Mokwena', 'Molefe', 'Molepo', 'Moletsane', 'Montsho', 'Phiri', 'Radebe', 'Ramaphosa', 'Seema'],
  },
  'venda-tsonga': {
    group: 'black-african',
    pool: 'venda-tsonga',
    femaleFirst: ['Hlulani', 'Khensani', 'Livhuwani', 'Mpho', 'Mutshidzi', 'Nhlamulo', 'Nyeleti', 'Rabelani', 'Rendani', 'Tintswalo', 'Tshifhiwa', 'Xiluva'],
    maleFirst: ['Fhatuwani', 'Hlengani', 'Lutendo', 'Mzamani', 'Nhlamulo', 'Rofhiwa', 'Rudzani', 'Tendani', 'Vhutshilo'],
    surnames: ['Baloyi', 'Chauke', 'Hlungwani', 'Mabasa', 'Makhubele', 'Maluleke', 'Mashaba', 'Mathebula', 'Mkhari', 'Mulaudzi', 'Netshitenzhe', 'Nkuna', 'Ramabulana', 'Shilowa', 'Tshivhase'],
  },
  'ndebele-swati': {
    group: 'black-african',
    pool: 'ndebele-swati',
    femaleFirst: ['Busisiwe', 'Dudu', 'Gabisile', 'Nonhlanhla', 'Nompumelelo', 'Ntombikayise', 'Sihle', 'Thembisile', 'Thobile', 'Zanele'],
    maleFirst: ['Bheki', 'Bonginkosi', 'Mandla', 'Mzwandile', 'Nkosana', 'Sibusiso', 'Sicelo', 'Sipho', 'Sizwe', 'Themba'],
    surnames: ['Dlamini', 'Mabuza', 'Mahlangu', 'Maseko', 'Masuku', 'Matsebula', 'Mnguni', 'Nkambule', 'Nhlabathi', 'Shongwe', 'Simelane', 'Skhosana', 'Zwane'],
  },
  'cape-coloured': {
    group: 'coloured',
    pool: 'cape-coloured',
    femaleFirst: ['Ayesha', 'Charlene', 'Chantel', 'Dominique', 'Fatima', 'Jade', 'Jody', 'Kaylin', 'Kim', 'Lauren', 'Megan', 'Monique', 'Nadine', 'Natasha', 'Nicole', 'Robyn', 'Rochelle', 'Shanaaz', 'Tasneem', 'Zaheera'],
    maleFirst: ['Ashwin', 'Brandon', 'Cameron', 'Chad', 'Clinton', 'Denzil', 'Dillon', 'Ebrahim', 'Faizel', 'Gavin', 'Jason', 'Keenan', 'Kyle', 'Nathan', 'Reece', 'Riyaad', 'Shaheed', 'Yusuf', 'Zane'],
    surnames: ['Abrahams', 'Adams', 'Arendse', 'Cloete', 'Cupido', 'Daniels', 'Davids', 'February', 'Fortuin', 'Hendricks', 'Isaacs', 'Jacobs', 'Jansen', 'Manuel', 'Moses', 'Petersen', 'Samuels', 'September', 'Solomon', 'Williams'],
  },
  'indian-sa': {
    group: 'indian-asian',
    pool: 'indian-sa',
    femaleFirst: ['Aarti', 'Aisha', 'Amrita', 'Anika', 'Farzana', 'Fatima', 'Kavitha', 'Leila', 'Meera', 'Nalini', 'Nisha', 'Priya', 'Roshni', 'Saira', 'Sameera', 'Shanti', 'Shireen', 'Yasmin', 'Zainab'],
    maleFirst: ['Ahmed', 'Akshay', 'Arjun', 'Dev', 'Faisal', 'Imraan', 'Ismail', 'Junaid', 'Keshav', 'Mohamed', 'Naeem', 'Pravin', 'Rahul', 'Rakesh', 'Ravi', 'Sameer', 'Sanjay', 'Shaan', 'Yusuf', 'Zubair'],
    surnames: ['Bhana', 'Cassim', 'Desai', 'Gangaram', 'Govender', 'Khan', 'Maharaj', 'Mohamed', 'Moodley', 'Moola', 'Naidoo', 'Osman', 'Parbhoo', 'Patel', 'Pillay', 'Rajah', 'Reddy', 'Sayed', 'Shaik', 'Singh'],
  },
  afrikaans: {
    group: 'white',
    pool: 'afrikaans',
    femaleFirst: ['Anika', 'Carina', 'Elize', 'Hanli', 'Ilse', 'Jana', 'Karla', 'Liezel', 'Lize', 'Madelein', 'Mariska', 'Nadia', 'Riana', 'Sunette', 'Yolandi'],
    maleFirst: ['Andre', 'Christiaan', 'Dawid', 'Francois', 'Gerrit', 'Hendrik', 'Jacques', 'Jan', 'Johan', 'Kobus', 'Lourens', 'Marius', 'Pieter', 'Ruan', 'Stefan', 'Willem'],
    surnames: ['Bezuidenhout', 'Botha', 'Coetzee', 'De Villiers', 'Du Plessis', 'Du Toit', 'Fourie', 'Grobler', 'Joubert', 'Kruger', 'Le Roux', 'Louw', 'Meyer', 'Nel', 'Pretorius', 'Smit', 'Steyn', 'Van der Merwe', 'Van Wyk', 'Visser'],
  },
  'english-sa': {
    group: 'white',
    pool: 'english-sa',
    femaleFirst: ['Amy', 'Bronwyn', 'Caitlin', 'Claire', 'Emma', 'Erin', 'Hannah', 'Jessica', 'Kate', 'Kerry', 'Lauren', 'Megan', 'Michelle', 'Nicole', 'Olivia', 'Rebecca', 'Samantha', 'Sarah', 'Taryn', 'Zoe'],
    maleFirst: ['Andrew', 'Bradley', 'Callum', 'Connor', 'Daniel', 'Dylan', 'Ethan', 'Gareth', 'Jason', 'Liam', 'Luke', 'Matthew', 'Michael', 'Nicholas', 'Ryan', 'Sean', 'Stephen', 'Thomas', 'Warren', 'Wesley'],
    surnames: ['Anderson', 'Brown', 'Campbell', 'Carter', 'Clarke', 'Green', 'Harris', 'Johnson', 'King', 'Miller', 'Morgan', 'Phillips', 'Robinson', 'Scott', 'Smith', 'Taylor', 'Thomson', 'Walker', 'Wilson', 'Wright'],
  },
  'mixed-sa': {
    group: 'other',
    pool: 'mixed-sa',
    femaleFirst: ['Aaliyah', 'Bianca', 'Danielle', 'Imani', 'Jenna', 'Kiara', 'Leah', 'Mikaela', 'Nadia', 'Riley', 'Sasha', 'Talia', 'Zara'],
    maleFirst: ['Aiden', 'Caleb', 'Damian', 'Eli', 'Jordan', 'Kai', 'Levi', 'Micah', 'Noah', 'Reuben', 'Riley', 'Tiaan', 'Zion'],
    surnames: ['Adams', 'Botha', 'Davids', 'Jacobs', 'Khan', 'Meyer', 'Mokoena', 'Naidoo', 'Ndlovu', 'Petersen', 'Samuels', 'Singh', 'Williams'],
  },
};

const BLACK_POOLS: CulturalNamePool[] = ['zulu', 'xhosa', 'sotho-tswana-pedi', 'venda-tsonga', 'ndebele-swati'];
const COLOURED_POOLS: CulturalNamePool[] = ['cape-coloured', 'afrikaans', 'english-sa'];
const WHITE_POOLS: CulturalNamePool[] = ['afrikaans', 'english-sa'];

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function avatarRaceForIdentity(
  caseId: string,
  group: SouthAfricanGroup,
  culturalNamePool: CulturalNamePool,
): PatientAvatarRace {
  if (group === 'black-african') return 'black';
  if (group === 'white') return 'white';
  if (group === 'indian-asian') {
    return hashString(`${caseId}:avatar-race:${culturalNamePool}`) % 4 === 0 ? 'asian' : 'indian';
  }
  if (group === 'coloured') {
    return COLOURED_FALLBACK_RACES[hashString(`${caseId}:avatar-race:${culturalNamePool}`) % COLOURED_FALLBACK_RACES.length];
  }
  return OTHER_FALLBACK_RACES[hashString(`${caseId}:avatar-race:${culturalNamePool}`) % OTHER_FALLBACK_RACES.length];
}

export function patientPoolAvatarId(gender: PatientIdentityGender, race: PatientAvatarRace): string {
  return `patient-pool-${gender === 'F' ? 'female' : 'male'}-${race}`;
}

export function avatarIdForCase(
  caseId: string,
  gender: PatientIdentityGender,
  group?: SouthAfricanGroup,
  culturalNamePool?: CulturalNamePool,
): string {
  if (caseId === 'im-001' && gender === 'F') return MPHO_MOLEFE_SAMPLE_AVATAR_ID;
  if (group && culturalNamePool) return patientPoolAvatarId(gender, avatarRaceForIdentity(caseId, group, culturalNamePool));
  if (gender === 'F') {
    const activeFemaleIds = [2, 3, 4, 5, 6];
    return `rpm-local-female-${activeFemaleIds[hashString(`${caseId}:avatar:${gender}`) % activeFemaleIds.length]}`;
  }
  return `rpm-local-male-${(hashString(`${caseId}:avatar:${gender}`) % 5) + 1}`;
}

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

function pickGroup(seed: number): SouthAfricanGroup {
  const roll = seed % 1000;
  if (roll < 814) return 'black-african';
  if (roll < 896) return 'coloured';
  if (roll < 969) return 'white';
  if (roll < 996) return 'indian-asian';
  return 'other';
}

function pickPool(group: SouthAfricanGroup, seed: number): CulturalNamePool {
  if (group === 'black-african') return pick(BLACK_POOLS, seed);
  if (group === 'coloured') return pick(COLOURED_POOLS, seed);
  if (group === 'white') return pick(WHITE_POOLS, seed);
  if (group === 'indian-asian') return 'indian-sa';
  return 'mixed-sa';
}

function buildPatientIdentity(seed: PatientIdentitySeed, sequence: number, nonce: number, forcedGroup: SouthAfricanGroup): PatientIdentity {
  const baseSeed = hashString(`${seed.id}:${seed.gender}:${sequence}:${nonce}`);
  const group = forcedGroup;
  const culturalNamePool = pickPool(group, baseSeed >>> 3);
  const pool = NAME_POOLS[culturalNamePool];
  const firstNames = seed.gender === 'F' ? pool.femaleFirst : pool.maleFirst;
  const first = pick(firstNames, baseSeed >>> 7);
  const surname = pick(pool.surnames, baseSeed >>> 13);
  const avatarRace = avatarRaceForIdentity(seed.id, group, culturalNamePool);
  return {
    caseId: seed.id,
    displayName: `${first} ${surname}`,
    gender: seed.gender,
    southAfricanGroup: group,
    culturalNamePool,
    avatarRace,
    avatarId: avatarIdForCase(seed.id, seed.gender, group, culturalNamePool),
  };
}

function groupQuotas(total: number): Record<SouthAfricanGroup, number> {
  const quotas: Record<SouthAfricanGroup, number> = {
    'black-african': Math.round(total * 0.814),
    coloured: Math.round(total * 0.082),
    white: Math.round(total * 0.073),
    'indian-asian': Math.round(total * 0.027),
    other: 0,
  };
  quotas.other = Math.max(0, total - quotas['black-african'] - quotas.coloured - quotas.white - quotas['indian-asian']);
  return quotas;
}

function assignGroups(seeds: PatientIdentitySeed[]): Map<string, SouthAfricanGroup> {
  const quotas = groupQuotas(seeds.length);
  const orderedGroups: SouthAfricanGroup[] = [
    'black-african',
    'coloured',
    'white',
    'indian-asian',
    'other',
  ];
  const sorted = [...seeds].sort((a, b) => hashString(`${a.id}:group`) - hashString(`${b.id}:group`));
  const assignments = new Map<string, SouthAfricanGroup>();
  let cursor = 0;
  for (const group of orderedGroups) {
    for (let i = 0; i < quotas[group] && cursor < sorted.length; i++) {
      assignments.set(sorted[cursor].id, group);
      cursor += 1;
    }
  }
  while (cursor < sorted.length) {
    assignments.set(sorted[cursor].id, pickGroup(hashString(`${sorted[cursor].id}:overflow`)));
    cursor += 1;
  }
  return assignments;
}

export function buildPatientIdentityLedger(seeds: PatientIdentitySeed[]): Map<string, PatientIdentity> {
  const usedNames = new Set<string>();
  const ledger = new Map<string, PatientIdentity>();
  const groups = assignGroups(seeds);
  for (let index = 0; index < seeds.length; index++) {
    const seed = seeds[index];
    if (ledger.has(seed.id)) continue;
    const group = groups.get(seed.id) ?? pickGroup(hashString(`${seed.id}:group:fallback`));
    let identity = buildPatientIdentity(seed, index, 0, group);
    let nonce = 1;
    while (usedNames.has(identity.displayName.toLowerCase()) && nonce < 50) {
      identity = buildPatientIdentity(seed, index, nonce, group);
      nonce += 1;
    }
    usedNames.add(identity.displayName.toLowerCase());
    ledger.set(seed.id, identity);
  }
  return ledger;
}
