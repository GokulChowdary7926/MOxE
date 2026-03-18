import { PrismaClient } from '@prisma/client';
import { Server as HttpServer } from 'http';
import axios, { AxiosInstance } from 'axios';

// NOTE:
// - Uses a PrismaClient pointed at TEST_DATABASE_URL (or DATABASE_URL) for isolation.
// - Assumes the main app server is already running on the configured baseUrl.

export class TestEnvironment {
  public prisma: PrismaClient;
  public server: HttpServer | null = null;
  public client: AxiosInstance;
  public baseUrl: string;

  constructor() {
    const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: url as string },
      },
    });
    // By default, talk to the main backend port (5007),
    // but allow override via TEST_BASE_URL.
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5007';
    this.client = axios.create({
      baseURL: this.baseUrl,
      validateStatus: (s) => s >= 200 && s < 500,
    });
  }

  async setup() {
    await this.clearDatabase();
    await this.seedTestData();
    // In the current server setup, the HTTP server is created and started
    // inside src/server.ts. For now we rely on that process being running
    // in test mode instead of starting a duplicate here.
  }

  async teardown() {
    await this.clearDatabase();
    await this.prisma.$disconnect();
  }

  private async clearDatabase() {
    // Truncate all public tables except migrations using this environment's Prisma.
    const tablenames = await this.prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        // eslint-disable-next-line no-await-in-loop
        await this.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
        );
      }
    }
  }

  private async seedTestData() {
    await this.createTestUsersAndAccounts();
    // Additional seeding (content, relationships) can be layered on later.
  }

  private async createTestUsersAndAccounts() {
    const now = new Date();
    const defaultDob = new Date('1995-01-01');

    // Helper to create user+account pair
    const createUserAccount = async (opts: {
      userId: string;
      phone: string;
      email?: string;
      accountId: string;
      username: string;
      displayName: string;
      accountType: 'PERSONAL' | 'BUSINESS' | 'CREATOR' | 'JOB';
    }) => {
      await this.prisma.user.create({
        data: {
          id: opts.userId,
          phoneNumber: opts.phone,
          email: opts.email,
          emailVerified: !!opts.email,
          password: 'test-password-hash',
          dateOfBirth: defaultDob,
          isVerified: false,
        },
      });

      await this.prisma.account.create({
        data: {
          id: opts.accountId,
          userId: opts.userId,
          username: opts.username,
          displayName: opts.displayName,
          accountType: opts.accountType,
          subscriptionTier: 'FREE',
          bio: null,
          profilePhoto: null,
          coverPhoto: null,
          isPrivate: false,
          isActive: true,
          createdAt: now,
        },
      });
    };

    // Emma – Personal
    await createUserAccount({
      userId: 'test-user-emma',
      phone: '+10000000001',
      email: 'emma@test.local',
      accountId: 'test-account-emma',
      username: 'emma_test',
      displayName: 'Emma Test',
      accountType: 'PERSONAL',
    });

    // Lena – Teen personal
    const lenaDob = new Date();
    lenaDob.setFullYear(lenaDob.getFullYear() - 16);
    await this.prisma.user.create({
      data: {
        id: 'test-user-lena',
        phoneNumber: '+10000000002',
        email: 'lena@test.local',
        emailVerified: false,
        password: 'test-password-hash',
        dateOfBirth: lenaDob,
        isVerified: false,
      },
    });
    await this.prisma.account.create({
      data: {
        id: 'test-account-lena',
        userId: 'test-user-lena',
        username: 'lena_test',
        displayName: 'Lena Test',
        accountType: 'PERSONAL',
        subscriptionTier: 'FREE',
        isPrivate: true,
        isActive: true,
        createdAt: now,
      },
    });

    // Marcus – Business
    await createUserAccount({
      userId: 'test-user-marcus',
      phone: '+10000000003',
      email: 'marcus@test.local',
      accountId: 'test-account-marcus',
      username: 'marcus_test',
      displayName: 'Marcus Test',
      accountType: 'BUSINESS',
    });

    // David – Creator
    await createUserAccount({
      userId: 'test-user-david',
      phone: '+10000000004',
      email: 'david@test.local',
      accountId: 'test-account-david',
      username: 'david_test',
      displayName: 'David Test',
      accountType: 'CREATOR',
    });

    // Chief – Creator / Gamer
    await createUserAccount({
      userId: 'test-user-chief',
      phone: '+10000000005',
      email: 'chief@test.local',
      accountId: 'test-account-chief',
      username: 'chief_test',
      displayName: 'Chief Test',
      accountType: 'CREATOR',
    });
  }
}

