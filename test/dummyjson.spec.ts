import pactum from 'pactum';
import { SimpleReporter } from '../simple-reporter';

describe('Dummy JSON API', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://dummyjson.com';
  const apiUrl = `${baseUrl}/products`;

  beforeAll(() => {
    p.reporter.add(rep);
  });

  afterAll(() => {
    p.reporter.end();
  });

  describe('Cenários GET', () => {
    it('1. Deve buscar todos os produtos', async () => {
      await p.spec().get(apiUrl).expectStatus(200).expectJsonLike({
        total: 194,
        skip: 0,
        limit: 30
      });
    });

    it('2. Deve buscar produtos com limite', async () => {
      await p
        .spec()
        .get(apiUrl)
        .withQueryParams('limit', '10')
        .expectStatus(200)
        .expectJsonLike({
          limit: 10
        });
    });

    it('3. Deve buscar produtos pulando (skip) itens', async () => {
      await p
        .spec()
        .get(apiUrl)
        .withQueryParams('skip', '10')
        .expectStatus(200)
        .expectJsonLike({
          skip: 10
        });
    });

    it('4. Deve buscar um produto específico por ID', async () => {
      await p.spec().get(`${apiUrl}/1`).expectStatus(200).expectJsonLike({
        id: 1,
        title: 'Essence Mascara Lash Princess'
      });
    });

    it('5. Deve retornar 404/Erro para ID de produto não existente', async () => {
      await p.spec().get(`${apiUrl}/99999`).expectStatus(404);
    });
  });

  describe('Cenários POST', () => {
    it('6. Deve adicionar um novo produto', async () => {
      await p
        .spec()
        .post(`${apiUrl}/add`)
        .withJson({
          title: 'BMW Pencil'
        })
        .expectStatus(201)
        .expectJsonLike({
          title: 'BMW Pencil'
        });
    });

    it('7. Deve adicionar um novo produto com múltiplos campos', async () => {
      await p
        .spec()
        .post(`${apiUrl}/add`)
        .withJson({
          title: 'Teclado Teste',
          price: 99.99,
          category: 'electronics'
        })
        .expectStatus(201)
        .expectJsonLike({
          title: 'Teclado Teste',
          price: 99.99,
          category: 'electronics'
        });
    });

    it('8. Deve retornar valores padrão para adições vazias', async () => {
      await p
        .spec()
        .post(`${apiUrl}/add`)
        .withJson({})
        .expectStatus(201)
        .expectJsonLike({
          id: 'typeof $V === "number"'
        });
    });
  });

  describe('Cenários DELETE', () => {
    it('9. Deve deletar um produto específico por ID', async () => {
      await p.spec().delete(`${apiUrl}/1`).expectStatus(200).expectJsonLike({
        id: 1,
        title: 'Essence Mascara Lash Princess',
        isDeleted: true
      });
    });

    it('10. Deve tentar deletar um produto não existente', async () => {
      await p.spec().delete(`${apiUrl}/invalid_id`).expectStatus(404);
    });
  });
});
