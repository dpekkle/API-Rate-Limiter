import { RateLimiter, ExpressError } from "./RateLimiter";
import {  PersistentStorage } from "./persistentStorage";
import express from "express";

describe('RateLimiter Integration test', () => {
	const testTable = 'testTable';
	class TestRateLimiter extends RateLimiter {		
		public checkRequestPermitted(): boolean {
			return this.storage.getRequests(this.requester).length < this.limit;
		}
		public getReponseStatusText(): string {
			return 'Rate limited.';
		}
	}

	describe("GIVEN a limiter and a mock request", () => {
		const storage = new PersistentStorage();
		const testRateLimiter = new TestRateLimiter(storage, testTable, 1);

		const ipAddress = "121.100.123.1";
		describe('WHEN we call processRequest before the limit is reached', () => {
			test('THEN it returns true', () => {
				let result;
				expect(() => result = testRateLimiter.processRequest({ip: ipAddress} as express.Request)).not.toThrow();
				expect(result).toBeTruthy();
			});
			test('THEN the request is stored', () => {
				expect(storage.getRequests(testTable, ipAddress).length).toEqual(1);
			});
		});
		describe('WHEN we call processRequest after the limit is reached', () => {
			test('THEN it throws an error', () => {
				let error: ExpressError;
				try {
					testRateLimiter.processRequest({ip: ipAddress} as express.Request)
				} catch(e) {
					error = e; 
				}

				expect(error).toStrictEqual({status: 429, statusMessage: "Rate limited."});
			});
			test('THEN the request is not stored', () => {
				expect(storage.getRequests(testTable, ipAddress).length).toEqual(1);
			});
		});
	});
});