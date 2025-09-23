import { subscriptions } from "../manager";

export function subscribeToInventions() {
    let dayCounter = 0;
    subscriptions.upsert("inventions", () =>
        context.subscribe("interval.day", () => {
            dayCounter++;
            if (dayCounter % 1 === 0) {
                context.executeAction('inventNextItem', { args: {} }, (result) => {
                    if (result.error) {
                        if (result.errorMessage === 'No uninvented items remaining.') return;
                        console.log('Failed to set seed:', result.errorMessage);
                    }
                });
                dayCounter = 0;
            }
        })
    );
}

export function unsubscribeFromInventions() {
    subscriptions.dispose("inventions");
}