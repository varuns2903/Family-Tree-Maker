import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService
  implements OnModuleInit, OnModuleDestroy
{
  private driver: Driver;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.driver = neo4j.driver(
      this.config.getOrThrow<string>('NEO4J_URI'),
      neo4j.auth.basic(
        this.config.getOrThrow<string>('NEO4J_USERNAME'),
        this.config.getOrThrow<string>('NEO4J_PASSWORD'),
      ),
      {
        maxConnectionPoolSize: 50,
      },
    );
  }

  getReadSession(): Session {
    return this.driver.session({
      defaultAccessMode: neo4j.session.READ,
    });
  }

  getWriteSession(): Session {
    return this.driver.session({
      defaultAccessMode: neo4j.session.WRITE,
    });
  }

  async read(cypher: string, params = {}) {
    const session = this.getReadSession();
    try {
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }

  async write(cypher: string, params = {}) {
    const session = this.getWriteSession();
    try {
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }
}
