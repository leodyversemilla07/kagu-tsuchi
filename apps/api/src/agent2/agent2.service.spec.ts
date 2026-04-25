import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { Agent2Service } from "./agent2.service";

describe("Agent2Service", () => {
  let service: Agent2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Agent2Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "EXA_API_KEY") return "test-key";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<Agent2Service>(Agent2Service);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
