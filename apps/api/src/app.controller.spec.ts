import { Test, type TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("health", () => {
    it("should return health status with uptime", () => {
      const result = appController.getHealth();

      expect(result.status).toBe("ok");
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should return a valid ISO timestamp", () => {
      const result = appController.getHealth();
      const parsed = new Date(result.timestamp);

      expect(parsed.toString()).not.toBe("Invalid Date");
    });
  });
});
