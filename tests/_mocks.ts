/// <reference path="../lib/openrct2.d.ts" />

/**
 * In-memory park storage for tests. openrct2-mocks' Mock.context() does not
 * implement getParkStorage(), which the managers rely on.
 */
export function createParkStorage(): Configuration & { data: Record<string, any> } {
    const storage = {
        data: {} as Record<string, any>,
        getAll: () => storage.data,
        get: (key: string, defaultValue?: any) => (key in storage.data ? storage.data[key] : defaultValue),
        set: (key: string, value: any) => { storage.data[key] = value; },
        has: (key: string) => key in storage.data,
    };
    return storage as Configuration & { data: Record<string, any> };
}
