import express from "express";
import { ExpressError } from "./RateLimiter";
import { FixedWindowRateLimiter } from "./FixedWindowRateLimiter";
import { PersistentStorage } from "./PersistentStorage";
import { SlidingLogRateLimiter } from "./SlidingLogRateLimiter";
import {v4 as uuid} from "uuid";

export default class App {
	public app: express.Application;
	private storage: PersistentStorage;
	private port: number;

	constructor(port: number){
		this.app = express();
		this.port = port;
		this.connectToStorage();
		this.initializeRoutes();
		this.initializeErrorHandler();
	}

	private connectToStorage(): void {
		this.storage = new PersistentStorage();
	}

	private initializeRoutes(): void {
		// If you want to share a RateLimiter between different routes 
		const fixedLimiter = new FixedWindowRateLimiter(this.storage, uuid(), 100);
		this.app.get('/fixed', (req, res) => {
			if (fixedLimiter.processRequest(req)){
				res.json({ foo: 1 }); 
			}
		});
		this.app.get('/sharedFixed', (req, res) => {
			if (fixedLimiter.processRequest(req)){
				res.json({ foo: 2 }); 
			}
		});
		
		const slidingLimiter = new SlidingLogRateLimiter(this.storage, uuid(), 100);
		this.app.get('/sliding', (req, res) => {
			if (slidingLimiter.processRequest(req)){
				res.json({ bar: 1 }); 
			}
		});
	}

	private initializeErrorHandler(): void {
		this.app.use((err: ExpressError, req, res, next) => {
			res.status(err.status || 500).send({error: err.statusMessage || err});
		});	
	}

	public listen(): void {
		this.app.listen(this.port, () => {
			console.log(`server started at http://localhost:${ this.port }\n\tAvailable endpoints:\n\t/fixed\n\t/sharedFixed\n\t/sliding`);
		});
	}
}