import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { FindUsersInput } from './dto/find-users.input';
import { UseGuards } from '@nestjs/common';
import { USER_TYPE } from '@prisma/client';
import { Roles } from 'src/common/decorator/roles.decorator';
import { CurrentUser, JwtAccessAuthGuard } from 'src/common/guard/jwt.guard';
import { RoleGuard } from 'src/common/guard/role.guard';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) { }

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Roles(USER_TYPE.ADMIN)
  @UseGuards(JwtAccessAuthGuard, RoleGuard)
  @Query(() => [User], { name: 'findUsers' })
  async findUsers(
    @CurrentUser() userReq: User,
    @Args('request') request: FindUsersInput
  ) {
    try {
      const user = await this.usersService.findOne(userReq.id)
      if (user) {
        return this.usersService.findAll(request, user);
      }
    } catch (error) {
      return error
    }
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
   try {
    return this.usersService.findOne(id);
   } catch (error) {
    return error
   }
  }

  @Mutation(() => User)
  updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @Args('id') id: number,
  ) {
    return this.usersService.update(id, updateUserInput);
  }

  @Mutation(() => Boolean)
  disableUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.disableUser(id);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }
}
