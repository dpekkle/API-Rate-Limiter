import { FixedWindowRateLimiter } from './FixedWindowRateLimiter';
import { RequestRow, PersistentStorage } from './persistentStorage';
import moment from 'moment';

describe('FixedWindowRateLimiter Unit Tests', () => {
    const testTable = 'testTable';
    class MockFixedWindowRateLimiter extends FixedWindowRateLimiter {
        public requester = 'testUser';
        public setLimit(limit: number) {
            this.limit = limit;
        }
        public getPreviousRequests(): RequestRow[] {
            return super.getPreviousRequests();
        }
        public cullOldRequests(): void {
            super.cullOldRequests();
        }

        public addRequest(): void {
            super.addRequest();
        }
    }

    describe('GIVEN a FixedWindowRateLimiter with no previous requests', () => {
        const storage = new PersistentStorage();
        const mockLimiter = new MockFixedWindowRateLimiter(storage, testTable);

        let mockCullOldRequests: jest.SpyInstance;
        beforeAll(() => {
            mockCullOldRequests = jest.spyOn(mockLimiter, 'cullOldRequests');
        });

        describe('WHEN we call getPreviousRequests', () => {
            test('THEN it returns an empty array', () => {
                expect(mockLimiter.getPreviousRequests()).toStrictEqual([]);
            });
            test('THEN it called cullOldRequests', () => {
                expect(mockCullOldRequests).toHaveBeenCalled();
            });
        });

        afterAll(() => {
            mockCullOldRequests.mockRestore();
        });
    });

    describe('GIVEN a FixedWindowRateLimiter with 2 previous requests', () => {
        const storage = new PersistentStorage();
        const mockLimiter = new MockFixedWindowRateLimiter(storage, testTable);
        mockLimiter.addRequest();
        mockLimiter.addRequest();

        describe('WHEN we call checkRequestPermitted and the limit is 5', () => {
            test('THEN it returns true', () => {
                mockLimiter.setLimit(5);
                expect(mockLimiter.checkRequestPermitted()).toBeTruthy();
            });
        });
        describe('WHEN we call checkRequestPermitted and the limit is 1', () => {
            test('THEN it returns true', () => {
                mockLimiter.setLimit(1);
                expect(mockLimiter.checkRequestPermitted()).toBeFalsy();
            });
        });
    });

    describe('GIVEN a FixedWindowRateLimiter with 2 old and 2 recent requests', () => {
        const storage = new PersistentStorage();
        const mockLimiter = new MockFixedWindowRateLimiter(storage, testTable);

        // Friday, July 17, 2020 3:33:20 GMT
        const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1595000000000);
        mockLimiter.addRequest();
        mockLimiter.addRequest();
        dateNowSpy.mockRestore();

        mockLimiter.addRequest();
        mockLimiter.addRequest();

        describe('WHEN we call cullOldRequests', () => {
            test('THEN before the call there are 4 saved requests', () => {
                expect(storage.getRequests('testTable', mockLimiter.requester).length).toBe(4);
            });
            test('THEN after the call there are 0 saved requests', () => {
                mockLimiter.cullOldRequests();
                expect(storage.getRequests('testTable', mockLimiter.requester).length).toBe(0);
            });
        });
    });

    describe('GIVEN a FixedWindowRateLimiter, and there are 20 minutes until the hour changes', () => {
        const storage = new PersistentStorage();
        const mockLimiter = new MockFixedWindowRateLimiter(storage, testTable);

        let overridenTime = moment().endOf('hour').subtract(30, 'minutes').valueOf();
        let dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => overridenTime);
        mockLimiter.addRequest();
        dateNowSpy.mockRestore();

        overridenTime = moment().endOf('hour').subtract(20, 'minutes').valueOf();
        dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => overridenTime);

        describe('WHEN we call getResponseStatusText', () => {
            test('THEN the status text indicates the user must wait 20 minutes', () => {
                expect(mockLimiter.getReponseStatusText()).toMatch('Rate limit exceeded. Try again in #1200 seconds.');
            });
        });

        afterAll(() => {
            dateNowSpy.mockRestore();
        });
    });
});
