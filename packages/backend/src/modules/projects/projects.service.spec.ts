import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { PrismaService } from "../../config/prisma.service";
import { CacheService } from "../cache/cache.service";
import { ProjectStatus } from "@prisma/client";

describe("ProjectsService", () => {
  let service: ProjectsService;
  let prisma: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockProject = {
    id: "project-123",
    name: "Test Project",
    description: "Test description",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    status: ProjectStatus.ACTIVE,
    location: "Test Location",
    gcName: "Test GC",
    contractorId: "contractor-123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            projectContractor: {
              create: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            invalidate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    cacheService = module.get(CacheService) as jest.Mocked<CacheService>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new project", async () => {
      const createDto = {
        name: "New Project",
        description: "New description",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: ProjectStatus.ACTIVE,
        location: "New Location",
        gcName: "New GC",
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

      const result = await service.create(createDto, "contractor-123");

      expect(result).toEqual(mockProject);
      expect(prisma.project.create).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return an array of projects", async () => {
      const mockProjects = [mockProject];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockProjects);
    });
  });

  describe("findOne", () => {
    it("should return a project by id", async () => {
      const mockProjectWithRelations = {
        ...mockProject,
        contractor: {
          id: "contractor-123",
          name: "Test Contractor",
          email: "contractor@test.com",
        },
        projectContractors: [],
      };

      cacheService.get.mockResolvedValue(null);
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(
        mockProjectWithRelations,
      );

      const result = await service.findOne("project-123");

      expect(result).toEqual(mockProjectWithRelations);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: "project-123" },
        include: expect.any(Object),
      });
    });

    it("should throw NotFoundException when project not found", async () => {
      cacheService.get.mockResolvedValue(null);
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should use cached project if available", async () => {
      const cachedProject = { ...mockProject };
      cacheService.get.mockResolvedValue(cachedProject);
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(cachedProject);

      const result = await service.findOne("project-123");

      expect(result).toEqual(cachedProject);
    });
  });
});
