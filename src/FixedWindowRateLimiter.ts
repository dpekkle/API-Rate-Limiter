import { RateLimiter } from "./RateLimiter";
import moment from "moment";
import { RequestRow } from "./persistentStorage";

/**
@name FixedWindowRateLimiter
@description Limits the amount of times an API route in the current clock hour.
The hour is defined such that at XX:00 the full quota is restored.

@param storage A PersistentStorage object.
@param table The section in storage that previous requests are stored.
@param limit How many calls are permitted in an hour, defaults to 100.
*/
export class FixedWindowRateLimiter extends RateLimiter {
	public checkRequestPermitted(): boolean {
		const previousRequests = this.getPreviousRequests();
		return previousRequests.length < this.limit;
	}

	protected getPreviousRequests(): RequestRow[] {
		this.cullOldRequests();
		return this.storage.getRequests(this.requester);
	}

	protected cullOldRequests(): void {
		const requests = this.storage.getRequests(this.requester);
		if (!requests.length){
			return;
		}
		
		const hourAgoMoment = moment().startOf("hour");
		const oldestRequest = moment(requests[0].requestTime).utc();

		// We only want to clear when the window ticks over, at that point we can clear everything.
		if (oldestRequest.isBefore(hourAgoMoment)){
			this.storage.clearRequests(this.requester);
		}
	}

	public getReponseStatusText(): string {
		const secondsUntilAllowed = moment().endOf('hour').diff(moment(), 'seconds');
		return `Rate limit exceeded. Try again in #${secondsUntilAllowed} seconds.`;
	}
}
