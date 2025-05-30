
/**
 * Mock data generation utilities for testing
 * Moved from src/api/core/testing/mockDataGenerator.ts
 */

import { faker } from '@faker-js/faker';

export interface MockUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface MockOrganizationData {
  id: string;
  name: string;
  description: string;
  website?: string;
}

export interface MockEventData {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isVirtual: boolean;
  isPaid: boolean;
}

export interface MockTagData {
  id: string;
  name: string;
  description: string;
}

/**
 * Generate mock user data for testing
 */
export const generateMockUser = (overrides: Partial<MockUserData> = {}): MockUserData => {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password: 'TestPassword123!',
    ...overrides
  };
};

/**
 * Generate mock organization data for testing
 */
export const generateMockOrganization = (overrides: Partial<MockOrganizationData> = {}): MockOrganizationData => {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    website: faker.internet.url(),
    ...overrides
  };
};

/**
 * Generate mock event data for testing
 */
export const generateMockEvent = (overrides: Partial<MockEventData> = {}): MockEventData => {
  const startTime = faker.date.future();
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  return {
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    isVirtual: faker.datatype.boolean(),
    isPaid: faker.datatype.boolean(),
    ...overrides
  };
};

/**
 * Generate mock tag data for testing
 */
export const generateMockTag = (overrides: Partial<MockTagData> = {}): MockTagData => {
  return {
    id: faker.string.uuid(),
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    ...overrides
  };
};

/**
 * Generate multiple mock items
 */
export const generateMockUsers = (count: number, overrides: Partial<MockUserData> = {}): MockUserData[] => {
  return Array.from({ length: count }, () => generateMockUser(overrides));
};

export const generateMockOrganizations = (count: number, overrides: Partial<MockOrganizationData> = {}): MockOrganizationData[] => {
  return Array.from({ length: count }, () => generateMockOrganization(overrides));
};

export const generateMockEvents = (count: number, overrides: Partial<MockEventData> = {}): MockEventData[] => {
  return Array.from({ length: count }, () => generateMockEvent(overrides));
};

export const generateMockTags = (count: number, overrides: Partial<MockTagData> = {}): MockTagData[] => {
  return Array.from({ length: count }, () => generateMockTag(overrides));
};
