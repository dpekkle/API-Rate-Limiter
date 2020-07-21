import moment from "moment";
import { RequestRow } from "./persistentStorage";
import { RateLimiter } from "./RateLimiter";

/**
@name SlidingLogRateLimiter
@description Limits API calls in a one hour period.
The hour is defined such that when a request is made then it counts towards the quota until an hour.
Smoother than Fixed Window Rate Limiting as the quota will slowly return as old requests age out.

@param storage A PersistentStorage object.
@param table The section in storage that previous requests are stored.
@param limit How many calls are permitted in an hour, defaults to 100.
*/
export class SlidingLogRateLimiter extends RateLimiter {

	// This is similar to FixedWindowRateLimit, however not all limit methods would be based on a simple "limit > previousRequests.length", so the base class shouldn't handle
	checkRequestPermitted(): boolean {
		const previousRequests = this.getPreviousRequests();
		return previousRequests.length < this.limit;
	}

	private getPreviousRequests(): RequestRow[] {
		this.cullOldRequests();
		return this.storage.getRequests(this.requester);
	}

	cullOldRequests(): void {
		const previousRequests = this.storage.getRequests(this.requester);
		
		const hourAgoMoment = moment().subtract(1, "hours");

		const recentRequests = previousRequests.filter(({requestTime}) => {
			const prevRequestMoment = moment.utc(requestTime);
			return prevRequestMoment.isAfter(hourAgoMoment);
		});

		this.storage.setRequests(this.requester, recentRequests);
	}

	getReponseStatusText(): string {
		const oldestRequest = this.storage.getRequests(this.requester)[0];
		const oldestRequestTime = moment(oldestRequest.requestTime).utc();
		oldestRequestTime.add(1, "hour");
		const now = moment();
		const seconds = oldestRequestTime.diff(moment(), "seconds");
		return `Rate limit exceeded. Try again in #${seconds} seconds.`;
	}

}