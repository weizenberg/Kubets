import {GrpcClient} from "../lib";
import {PubSubSettings, Settings, StoreProperties, SubscribeType} from "../interfaces";
import {Giver, Taker} from "./lowLevel";
import {Event, Result, Subscribe} from "../protos/generated";

export class PubSub extends GrpcClient {
	protected store: any = false; // TODO: Create an EventStore
	protected giver: Giver = new Giver(this.client);
	protected taker?: Taker;
	constructor(settings: PubSubSettings) { super(settings) }

	close(): void {
		this.client.close();
		this.taker?.stop();
	}

	protected send(event: Event): Promise<Result> {
		event.setChannel(this.settings.channel);
		event.setClientid(this.settings.client);

		return this.giver.sendEvent(event);
	}

	protected subscribe(reqHandler: (...args: any[]) => void, errorHandler: (...args: any[]) => void, storeProperties?: StoreProperties) {
		this.taker = new Taker(this.client);

		const sub = new Subscribe();
		if (storeProperties) {
			sub.setEventsstoretypedata(storeProperties.Eventsstoretypedata);
			sub.setEventsstoretypevalue(storeProperties.Eventsstoretypevalue);
		}
		sub.setClientid(this.settings.client);
		sub.setChannel(this.settings.channel);
		sub.setSubscribetypedata(this.settings.type || 3);

		this.taker.subscribeToEvents(sub, reqHandler, errorHandler);
	}

	protected unsubscribe() {
		if (this.taker) this.taker.stop();
	}
}
