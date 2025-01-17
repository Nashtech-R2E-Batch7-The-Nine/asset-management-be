import { Injectable } from '@nestjs/common';
import { CreateRequestReturnInput } from './dto/create-request-return.input';

import { PrismaService } from 'src/services/prisma/prisma.service';
import { FindRequestReturnsInput } from './dto/find-request-returns.input';
import {
  ASSET_STATE,
  LOCATION,
  Prisma,
  REQUEST_RETURN_STATE,
} from '@prisma/client';
// import { FindRequestReturnsOutput } from './dto/find-request-returns.output';
import { MyBadRequestException } from 'src/shared/exceptions';

@Injectable()
export class RequestReturnsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findRequestReturns(input: FindRequestReturnsInput, location: LOCATION) {
    try {
      const { stateFilter, returnedDateFilter, sortField, sortOrder } = input;
      const whereCondition = {
        OR: [
          { asset: { assetName: { contains: input.query } } },
          { asset: { assetCode: { contains: input.query } } },
          { requestedBy: { username: { contains: input.query } } },
        ],
        state: { in: stateFilter },

        returnedDate: returnedDateFilter
          ? {
              gte: returnedDateFilter
                ? new Date(new Date(returnedDateFilter).setHours(0, 0, 0, 0))
                : null,
              lte: returnedDateFilter
                ? new Date(
                    new Date(returnedDateFilter).setHours(23, 59, 59, 599),
                  )
                : null,
            }
          : undefined,
        assignment: { location },
        isRemoved: false,
      };

      const orderBy: Prisma.RequestReturnOrderByWithRelationInput = {};

      switch (sortField) {
        case 'assetCode':
          orderBy.asset = { assetCode: sortOrder };
          break;
        case 'assetName':
          orderBy.asset = { assetName: sortOrder };
          break;
        case 'requestedBy':
          orderBy.requestedBy = { username: sortOrder };
          break;
        case 'acceptedBy':
          orderBy.acceptedBy = { username: sortOrder };
          break;
        default:
          orderBy[sortField] = sortOrder;
      }

      const requestReturns = await this.prismaService.requestReturn.findMany({
        where: whereCondition,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: orderBy,
      });

      const total = await this.prismaService.requestReturn.count({
        where: whereCondition,
      });

      return {
        requestReturns: requestReturns.map((r) => ({
          ...r,
          assignedDate: r.assignedDate?.toISOString() || null,
          returnedDate: r.returnedDate?.toISOString() || null,
        })),
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      };
    } catch (error) {
      console.log('error', error);
      throw new MyBadRequestException('Error finding request returns');
    }
  }

  async findOne(id: number, location: LOCATION) {
    const requestReturn = await this.prismaService.requestReturn.findUnique({
      where: { id, assignment: { location: location } },
    });

    if (!requestReturn) {
      throw new MyBadRequestException('Request return not found');
    }

    return requestReturn;
  }

  async createRequestReturn(
    createRequestReturnInput: CreateRequestReturnInput,
    userReq: any,
  ) {
    const { assetId, assignmentId, assignedDate } = createRequestReturnInput;

    const assignment = await this.prismaService.assignment.findUnique({
      where: { id: assignmentId },
    });

    const checkExist = await this.prismaService.requestReturn.findFirst({
      where: { assignmentId, isRemoved: false },
    });

    if (checkExist) {
      throw new MyBadRequestException('Request return already exist');
    }

    if (!assignment) {
      throw new MyBadRequestException('Assignment not found');
    }
    if (assignment.location !== LOCATION[userReq.location]) {
      throw new MyBadRequestException('Assignment not in this location');
    }
    if (assignment.state !== 'ACCEPTED') {
      throw new MyBadRequestException('Assignment not accepted');
    }
    if (assetId !== assignment.assetId) {
      throw new MyBadRequestException('Asset id not match');
    }

    const requestReturn = await this.prismaService.requestReturn.create({
      data: {
        assetId,
        assignmentId,
        requestedById: userReq.id,
        assignedDate: new Date(assignedDate),
        state: REQUEST_RETURN_STATE.WAITING_FOR_RETURNING,
      },
    });
    console.log(requestReturn);
    return requestReturn;
  }

  async deleteRequestReturn(id: number, location: LOCATION) {
    const requestReturn = await this.prismaService.requestReturn.findUnique({
      where: { id, assignment: { location: location } },
    });
    if (!requestReturn) {
      throw new MyBadRequestException('Request return not found');
    }
    if (requestReturn.state !== REQUEST_RETURN_STATE.WAITING_FOR_RETURNING) {
      throw new MyBadRequestException('Request return not in waiting state');
    }
    if (requestReturn.isRemoved) {
      throw new MyBadRequestException('Request return already removed');
    }
    const result = await this.prismaService.requestReturn.update({
      where: { id },
      data: { isRemoved: true },
    });
    return result;
  }

  async completeRequestReturn(
    id: number,
    location: LOCATION,
    acceptedById: number,
  ) {
    const requestReturn = await this.prismaService.requestReturn.findUnique({
      where: { id, assignment: { location: location } },
    });
    if (!requestReturn) {
      throw new MyBadRequestException('Request return not found');
    }
    if (requestReturn.state !== REQUEST_RETURN_STATE.WAITING_FOR_RETURNING) {
      throw new MyBadRequestException('Request return not in waiting state');
    }
    if (requestReturn.isRemoved) {
      throw new MyBadRequestException('Request return already removed');
    }
    const result = await this.prismaService.requestReturn.update({
      where: { id },
      data: {
        state: REQUEST_RETURN_STATE.COMPLETED,
        returnedDate: new Date(),
        acceptedById: acceptedById,
      },
    });

    await this.prismaService.asset.update({
      where: { id: requestReturn.assetId },
      data: { state: ASSET_STATE.AVAILABLE, isReadyAssigned: true },
    });

    const assignment = await this.prismaService.assignment.update({
      where: { id: requestReturn.assignmentId },
      data: { isRemoved: true },
    });

    const check = await this.prismaService.assignment.findFirst({
      where: { assignedToId: assignment.assignedToId, isRemoved: false },
    });

    if (!check) {
      await this.prismaService.user.update({
        where: { id: assignment.assignedToId },
        data: { isAssigned: false },
      });
    }

    return result;
  }
}
