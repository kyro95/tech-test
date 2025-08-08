import { jest } from '@jest/globals';

type TransactionMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  exists: jest.Mock;
};

type QueryBuilderMock = {
  select: jest.Mock;
  where: jest.Mock;
  getRawOne: jest.Mock;
};

const createTransactionMock = (): TransactionMock => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  exists: jest.fn(),
});

const createQueryBuilderMock = (): QueryBuilderMock => {
  const mock = {
    select: jest.fn(),
    where: jest.fn(),
    getRawOne: jest.fn(),
  };

  mock.select.mockReturnValue(mock);
  mock.where.mockReturnValue(mock);

  return mock;
};

export const createEntityManagerMock = () => {
  const transactionMock = createTransactionMock();
  const queryBuilderMock = createQueryBuilderMock();

  const mock = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    exists: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilderMock),
    transaction: jest.fn(
      async <T>(
        cb: (transactionalEntityManager: any) => Promise<T>,
      ): Promise<T> => {
        return cb(transactionMock);
      },
    ),
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return mock as any;
};

export type EntityManagerMock = ReturnType<typeof createEntityManagerMock>;
