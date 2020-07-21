/**
 * @name RequestRow
 * @description The shape of a request placed in persistent storage
 */
export type RequestRow = {
	requestTime: string;
};

/**
 * @name PersistentStorage
 * @desc Access to a (semi) persistent storage of request data, with various CRUS operations. Flushed when the server is reset.
 */
export class PersistentStorage {
	// TODO should be replaced with a data store such as mongo, as this is flushed when the server is reset
	private storage: Record<string, Record<string, RequestRow[]>> = {};
	
	// See https://en.wikipedia.org/wiki/Autovivification
	private vivifyRow(table: string, user:string){
		this.storage[table] = this.storage[table] || {};
		this.storage[table][user] = this.storage[table][user] || [];
	}

	public getRequests(table: string, user: string): RequestRow[]{
		this.vivifyRow(table, user);
		return this.storage[table][user];
	}

	public addRequest(table:string, user: string, request: RequestRow): number {
		return this.addRequests(table, user, [request]);
	}

	public addRequests(table:string, user: string, requests: RequestRow[]): number {
		this.vivifyRow(table, user);
		return this.storage[table][user].push(...requests);
	}

	public clearRequests(table:string, user: string){
		this.storage[table][user] = [];
	}

	public setRequests(table:string, user: string, requests: RequestRow[]){
		this.clearRequests(table, user);
		this.addRequests(table, user, requests);
	}
}

/**
 * @name PersistentStorageView
 * @desc Constructs a view of data in the PersistentStorage limited to a particular "table" or collection.
 * Basically, used to ensure that the caller is only able to read/write to a specific section of the data.
 */
export class PersistentStorageView {
	private storage: PersistentStorage;
	private table: string;

	constructor(storage: PersistentStorage, table: string){
		this.storage = storage;
		this.table = table;
	}

	public getRequests(user: string): RequestRow[]{
		return this.storage.getRequests(this.table, user);
	}

	public addRequest(user: string, request: RequestRow): number {
		return this.storage.addRequest(this.table, user, request);
	}

	public addRequests(user: string, requests: RequestRow[]): number {
		return this.storage.addRequests(this.table, user, requests);
	}

	public clearRequests(user: string){
		return this.storage.clearRequests(this.table, user);
	}

	public setRequests(user: string, requests: RequestRow[]){
		return this.storage.setRequests(this.table, user, requests);
	}
}