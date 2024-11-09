export function notifyTextGoal(name: string): void {
    const message = `Goal completed: ${name}`;
    park.postMessage(message);
    if(network.mode === "server" || network.mode === "client") network.sendMessage(message);
}

export function notifyTextBingo(lineKey:string): void {
    const message = `BINGO! Line completed: ${lineKey}`;
    park.postMessage(message);
    if(network.mode === "server" || network.mode === "client") network.sendMessage(message);
}