export function checkIfStarted(): boolean {
    const parkStorage = context.getParkStorage();
    const started = parkStorage.get('started', false);
    return started;
}

export function startGame(n: number): void {
    context.executeAction('setStorage', { args: { key: 'duration', value: n } });
    // A new game is never over
    context.executeAction('setStorage', { args: { key: 'gameOver', value: false } });
    context.executeAction('setStorage', { args: { key: 'gameResult', value: "" } });
    // Last: once started, players can't change the game settings anymore
    context.executeAction('setStorage', { args: { key: 'started', value: true } });
}

export function resetGame(): void {
    context.executeAction('setStorage', { args: { key: 'started', value: false } });
    context.executeAction('setStorage', { args: { key: 'duration', value: 0 } });
    context.executeAction('setStorage', { args: { key: 'gameOver', value: false } });
    context.executeAction('setStorage', { args: { key: 'gameResult', value: "" } });
}


