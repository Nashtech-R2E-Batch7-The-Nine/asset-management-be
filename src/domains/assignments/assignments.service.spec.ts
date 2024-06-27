import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import PrismaServiceMock from 'src/services/prisma/__mocks__/mock-prisma.service';
import {
  assignmentInputMock,
  assignmentDataMock,
  currentUserMock,
  findAssignmentInputMock,
  findAssignmentOutputMock,
} from 'src/shared/__mocks__';
import { MyBadRequestException } from 'src/shared/exceptions';

describe('AssignmentsService', () => {
  let assignmentService: AssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: PrismaService,
          useClass: PrismaServiceMock, // Use the mock class for PrismaService
        },
      ],
    }).compile();

    assignmentService = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should always pass', () => {
    expect(true).toBeTruthy();
  });

  describe('create', () => {
    it('should throw MyBadRequestException for invalid assetId', async () => {
      await expect(
        assignmentService.create(assignmentInputMock[0], currentUserMock),
      ).rejects.toThrowError(MyBadRequestException);
    });

    it('should throw MyBadRequestException for invalid assetId', async () => {
      await expect(
        assignmentService.create(assignmentInputMock[1], currentUserMock),
      ).rejects.toThrowError(MyBadRequestException);
    });

    it('should throw MyBadRequestException for empty assetId', async () => {
      await expect(
        assignmentService.create(assignmentInputMock[2], currentUserMock),
      ).rejects.toThrowError(MyBadRequestException);
    });

    it('should throw MyBadRequestException for empty assignedToId', async () => {
      await expect(
        assignmentService.create(assignmentInputMock[3], currentUserMock),
      ).rejects.toThrowError(MyBadRequestException);
    });

    it('should throw MyBadRequestException for invalid assignedDate', async () => {
      await expect(
        assignmentService.create(assignmentInputMock[4], currentUserMock),
      ).rejects.toThrowError(MyBadRequestException);
    });

    it('should return new assignment', async () => {
      const result = await assignmentService.create(
        assignmentInputMock[5],
        currentUserMock,
      );

      expect(result).toEqual(assignmentDataMock[0]);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of assignments', async () => {
      const input = findAssignmentInputMock[0];
      const result = await assignmentService.findAll(input, currentUserMock);
      expect(result).toEqual(findAssignmentOutputMock[0]);
    });

    it('should throw MyBadRequestException for invalid assignedDate', async () => {
      const input = findAssignmentInputMock[1];
      await expect(
        assignmentService.findAll(input, currentUserMock),
      ).rejects.toThrowError(MyBadRequestException);
    });

    it('limit empty but no affect to logical, should return paginated list of assignments', async () => {
      const input = findAssignmentInputMock[2];
      const result = await assignmentService.findAll(input, currentUserMock);
      expect(result).toEqual({ ...findAssignmentOutputMock[0], limit: 20 });
    });

    it('page empty but no affect to logical, should return paginated list of assignments', async () => {
      const input = findAssignmentInputMock[3];
      const result = await assignmentService.findAll(input, currentUserMock);
      expect(result).toEqual(findAssignmentOutputMock[0]);
    });

    it('query empty but no affect to logical, should return paginated list of assignments', async () => {
      const input = findAssignmentInputMock[4];
      const result = await assignmentService.findAll(input, currentUserMock);
      expect(result).toEqual(findAssignmentOutputMock[0]);
    });

    it('sort empty but no affect to logical, should return paginated list of assignments', async () => {
      const input = findAssignmentInputMock[5];
      const result = await assignmentService.findAll(input, currentUserMock);
      expect(result).toEqual(findAssignmentOutputMock[0]);
    });

    it('sortOrder empty but no affect to logical, should return paginated list of assignments', async () => {
      const input = findAssignmentInputMock[6];
      const result = await assignmentService.findAll(input, currentUserMock);
      expect(result).toEqual(findAssignmentOutputMock[0]);
    });

    it('state empty but no affect to logical, should return paginated list of assignments', async () => {
      const input = findAssignmentInputMock[7];
      const result = await assignmentService.findAll(input, currentUserMock);
      expect(result).toEqual(findAssignmentOutputMock[0]);
    });

    it('assignedDate empty but no affect to logical, should return paginated list of assignments', async () => {
      const input = findAssignmentInputMock[8];
      const result = await assignmentService.findAll(input, currentUserMock);
      expect(result).toEqual(findAssignmentOutputMock[0]);
    });
  });

  describe('findOne', () => {
    it('should return assignment by id', async () => {
      const result = await assignmentService.findOne(1);
      expect(result).toEqual(assignmentDataMock[0]);
    });
  });
});
