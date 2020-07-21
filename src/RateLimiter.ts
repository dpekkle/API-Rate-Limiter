// See https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm/ for rate limiting  strategies

import moment from "moment";
import express from "express";
import { PersistentStorage, PersistentStorageView } from "./persistentStorage";

export interface ExpressError {
	status: number;
	statusMessage: string;
}

export abstract class RateLimiter {
	protected storage: PersistentStorageView;
	protected limit: number;
	protected requester: string;

	constructor(storage: PersistentStorage, table: string, limit: number = 100){
		this.storage = new PersistentStorageView(storage, table);
		this.limit = limit;
	}

	public processRequest(request: express.Request): true {
		this.requester = this.getRequester(request);

		if(this.checkRequestPermitted()){
			this.addRequest();
			return true;
		} else {
			const error: ExpressError = {
				status: 429,
				statusMessage: this.getReponseStatusText()
			};
			throw error;
		}
	}

	// A method that determines whether or not the request should be limited
	abstract checkRequestPermitted(): boolean;

	// The response error message to send to the requester
	abstract getReponseStatusText(): string;

	private getRequester(request: express.Request): string {
		return request.ip;
	}

	private addRequest(): void {
		this.storage.addRequest(this.requester, {requestTime: moment().format()});
	}
};