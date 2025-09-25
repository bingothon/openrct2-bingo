export function checkIfStarted(): boolean {
    const parkStorage = context.getParkStorage();
    const started = parkStorage.get('started', false);
    return started;
}

export function startGame(n: number): void {
    context.executeAction('setStorage', { args: { key: 'started', value: true } });
    context.executeAction('setStorage', { args: { key: 'duration', value: n } });
}

export function resetGame(): void {
    context.executeAction('setStorage', { args: { key: 'started', value: false } });
    context.executeAction('setStorage', { args: { key: 'duration', value: 0 } });
}


