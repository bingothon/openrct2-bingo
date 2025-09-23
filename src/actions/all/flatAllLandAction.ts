function flattenAllChunksUntilDone(chunks: { x1: number; y1: number; x2: number; y2: number }[], targetHeight: number) {
  let maxOffset = 0;

  for (const chunk of chunks) {
    for (let x = chunk.x1; x <= chunk.x2; x++) {
      for (let y = chunk.y1; y <= chunk.y2; y++) {
        const tile = map.getTile(x, y);
        const surface = tile.elements.filter(el => el.type === "surface")[0] as SurfaceElement | undefined;

        if (surface) {
          const offset = surface.baseZ - targetHeight;
          maxOffset = Math.max(maxOffset, Math.abs(offset));
        }
      }
    }
  }

  if (maxOffset === 0) {
    console.log("All land has been flattened to the target height.");
    return;
  }

  processChunks(chunks, targetHeight, () => {
    context.setTimeout(() => flattenAllChunksUntilDone(chunks, targetHeight), 0);
  });
}

function processChunks(
  chunks: { x1: number; y1: number; x2: number; y2: number }[],
  targetHeight: number,
  callback: () => void
) {
  if (chunks.length === 0) {
    callback();
    return;
  }

  const chunk = chunks.shift();
  if (!chunk) return;

  flattenLandChunk(chunk.x1, chunk.y1, chunk.x2, chunk.y2, targetHeight, () => {
    processChunks(chunks, targetHeight, callback);
  });
}

function flattenLandChunk(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  targetHeight: number,
  callback: () => void
): void {
  let maxOffset = 0;
  let minOffset = 0;

  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      const tile = map.getTile(x, y);
      const surface = tile.elements.filter(el => el.type === "surface")[0] as SurfaceElement | undefined;

      if (surface) {
        const offset = surface.baseZ - targetHeight;
        maxOffset = Math.max(maxOffset, offset);
        minOffset = Math.min(minOffset, offset);
      }
    }
  }

  const lowerCount = Math.ceil(maxOffset / 16);
  const raiseCount = Math.ceil(Math.abs(minOffset) / 16);

  function performLower(remaining: number) {
    if (remaining <= 0) {
      performRaise(raiseCount);
      return;
    }

    const args = {
      x: (x1 + x2) * 16,
      y: (y1 + y2) * 16,
      x1: x1 * 32,
      y1: y1 * 32,
      x2: x2 * 32,
      y2: y2 * 32,
      selectionType: 4,
    };

    context.queryAction("landlower", args, (queryResult) => {
      if (queryResult.cost && queryResult.cost > 0) {
        context.executeAction("addCash", { args: { cash: queryResult.cost } }, () => {
          context.executeAction("landlower", args, () => {
            performLower(remaining - 1);
          });
        });
      } else {
        performLower(remaining - 1);
      }
    });
  }

  function performRaise(remaining: number) {
    if (remaining <= 0) {
      callback();
      return;
    }

    const args = {
      x: (x1 + x2) * 16,
      y: (y1 + y2) * 16,
      x1: x1 * 32,
      y1: y1 * 32,
      x2: x2 * 32,
      y2: y2 * 32,
      selectionType: 4,
    };

    context.queryAction("landraise", args, (queryResult) => {
      if (queryResult.cost && queryResult.cost > 0) {
        context.executeAction("addCash", { args: { cash: queryResult.cost } }, () => {
          context.executeAction("landraise", args, () => {
            performRaise(remaining - 1);
          });
        });
      } else {
        performRaise(remaining - 1);
      }
    });
  }

  performLower(lowerCount);
}

function createChunks(tilesX: number, tilesY: number, chunkSize: number): { x1: number; y1: number; x2: number; y2: number }[] {
  const chunks = [] as { x1: number; y1: number; x2: number; y2: number }[];
  for (let x = 1; x <= tilesX; x += chunkSize) {
    for (let y = 1; y <= tilesY; y += chunkSize) {
      chunks.push({
        x1: x,
        y1: y,
        x2: Math.min(x + chunkSize - 1, tilesX),
        y2: Math.min(y + chunkSize - 1, tilesY),
      });
    }
  }
  return chunks;
}

export function flatAllLandAction() {
  return {
    name: "flatAllLand",
    query: (event: GameActionEventArgs): GameActionResult => {
      console.log("Querying flatAllLand action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      if (network.mode === 'server') {
        const mapSize = map.size;
        const tilesX = mapSize.x;
        const tilesY = mapSize.y;

        const targetHeight = 112;
        if (targetHeight === null) {
          console.log("No valid surface tile found in the exclusion zone.");
          return { error: 1, errorMessage: "No valid height in exclusion zone." };
        }

        console.log(`Starting to flatten all land to target height: ${targetHeight}`);

        const chunks = createChunks(tilesX, tilesY, 64);
        flattenAllChunksUntilDone(chunks, targetHeight);
      }
      return { error: 0 };
    },
  };
}


