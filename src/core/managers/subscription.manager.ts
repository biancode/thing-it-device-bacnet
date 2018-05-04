import { Subscription } from 'rxjs';

export class SubscriptionManager {
    private subscription: Set<Subscription>;

    /**
     * Adds the instance of the `Subscription` to the set with subscriptions
     *
     * @type {Subscription}
     */
    public set subscribe (sub: Subscription) {
        this.subscription.add(sub);
    }

    /**
     * Inits the subscription storage
     *
     * @return {void}
     */
    public async initManager (): Promise<void> {
        this.subscription = new Set();
    }

    /**
     * Destroys the subscription storage
     *
     * @return {void}
     */
    public destroy (): void {
        this.subscription.forEach((data) => data && data.unsubscribe && data.unsubscribe());
        this.subscription.clear();
        this.subscription = null;
    }
}
