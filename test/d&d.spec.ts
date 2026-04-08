import pactum from 'pactum';
import { StatusCodes } from 'http-status-codes';
import { SimpleReporter } from '../simple-reporter';

describe('D&D Combat API', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://dnd-combat-api-7f3660dcecb1.herokuapp.com';
  const apiUrl = `${baseUrl}/api`;

  const character = {
    name: 'Kaya',
    strength: 10,
    dexterity: 7,
    hitPoints: 11,
    armorClass: 12
  };

  let monsterName = 'goblin';
  let monsterCandidates: string[] = [];

  const getCandidateNames = () => {
    const defaults = ['goblin', 'orc', 'kobold', 'skeleton'];
    const raw = [...monsterCandidates, ...defaults];
    const expanded = raw.flatMap(name => [
      name,
      name.toLowerCase(),
      name.replace(/\s+/g, '-'),
      name.toLowerCase().replace(/\s+/g, '-')
    ]);

    return [...new Set(expanded.map(name => name.trim()).filter(Boolean))];
  };

  const resolveWorkingMonster = async () => {
    const candidates = getCandidateNames();

    for (const candidate of candidates) {
      const response = await fetch(
        `${apiUrl}/monsters/${encodeURIComponent(candidate)}`
      );

      if (response.status === StatusCodes.OK) {
        return candidate;
      }
    }

    throw new Error(
      `No valid monster found for details endpoint. Tried: ${candidates
        .slice(0, 10)
        .join(', ')}`
    );
  };

  p.request.setDefaultTimeout(30000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  describe('CHARACTERS', () => {
    it('Get example character', async () => {
      await p
        .spec()
        .get(`${apiUrl}/characters/example`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          name: character.name,
          strength: character.strength,
          dexterity: character.dexterity,
          hitPoints: character.hitPoints,
          armorClass: character.armorClass
        });
    });

    it('Validate character', async () => {
      await p
        .spec()
        .post(`${apiUrl}/characters/check`)
        .withJson(character)
        .expectStatus(StatusCodes.OK);
    });
  });

  describe('MONSTERS', () => {
    it('Get monster names from page 1', async () => {
      await p
        .spec()
        .get(`${apiUrl}/monsters/names/1`)
        .expectStatus(StatusCodes.OK)
        .expect(ctx => {
          const body = ctx.res.body;

          if (Array.isArray(body) && body.length > 0) {
            monsterCandidates = body.filter(Boolean);
            return;
          }

          const names = body?.names || body?.monsterNames || body?.results;
          if (Array.isArray(names) && names.length > 0) {
            monsterCandidates = names.filter(Boolean);
            return;
          }

          throw new Error('No monster names found in response body');
        });
    });

    it('Get monster details', async () => {
      monsterName = await resolveWorkingMonster();

      await p
        .spec()
        .get(`${apiUrl}/monsters/${encodeURIComponent(monsterName)}`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains(monsterName.toLowerCase().split('-')[0]);
    });
  });

  describe('BATTLE', () => {
    it('Simulate battle against monster', async () => {
      if (!monsterName) {
        monsterName = await resolveWorkingMonster();
      }

      await p
        .spec()
        .post(`${apiUrl}/battle/${encodeURIComponent(monsterName)}`)
        .withJson(character)
        .expectStatus(StatusCodes.OK)
        .expect(ctx => {
          const bodyText = JSON.stringify(ctx.res.body).toLowerCase();
          expect(bodyText.length).toBeGreaterThan(0);
          expect(bodyText).toContain(monsterName.toLowerCase().split('-')[0]);
        });
    });
  });
});
