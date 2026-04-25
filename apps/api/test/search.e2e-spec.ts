// eslint-disable-next-line import/no-relative-parent-imports

import type { INestApplication } from "@nestjs/common";
import { Test as NestTesting, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("SearchController (e2e)", () => {
  let app: INestApplication;
  // Use ReturnType to avoid supertest Test type conflict
  let httpAgent: ReturnType<typeof request>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await NestTesting.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    await app.init();

    const port = process.env.PORT || 3001;
    await app.listen(port);

    httpAgent = request(`http://localhost:${port}`);
  });

  afterEach(async () => {
    await app.close();
  });

  describe("/search (POST)", () => {
    it("should return follow-up for short query", async () => {
      const response = await httpAgent
        .post("/search")
        .send({ query: "AI" })
        .expect(200);

      expect(response.body.queryAnalysis).toBeDefined();
      expect(response.body.queryAnalysis.clarified).toBe(false);
      expect(response.body.queryAnalysis.followUpQuestions).toBeDefined();
      expect(response.body.searchResults).toBeNull();
    });
  });

  describe("/search/stream (POST)", () => {
    it("should stream follow-up for short query", async () => {
      const response = await httpAgent
        .post("/search/stream")
        .send({ query: "AI" })
        .expect(200);

      const body = response.text;

      expect(body).toContain("type: done");
      expect(body).toContain("source: follow-up");
    }, 10000);
  });
});
