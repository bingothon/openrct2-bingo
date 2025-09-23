export class SubscriptionManager {
	private subs: { [key: string]: IDisposable } = {};

	upsert(name: string, create: () => IDisposable): IDisposable {
		this.dispose(name);
		const sub = create();
		this.subs[name] = sub;
		return sub;
	}

	dispose(name: string): void {
		const sub = this.subs[name];
		if (sub) {
			try { sub.dispose(); } finally { delete this.subs[name]; }
		}
	}

	disposeAll(): void {
		Object.keys(this.subs).forEach((key) => {
			const sub = this.subs[key];
			try { sub.dispose(); } finally { /* proceed to clear below */ }
		});
		this.subs = {};
	}
}

export const subscriptions = new SubscriptionManager();


