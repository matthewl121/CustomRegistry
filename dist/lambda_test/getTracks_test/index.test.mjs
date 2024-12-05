import { jest } from '@jest/globals';
import { getTracksHandler } from '../../lambda/getTracks/index.mjs';
describe('getTracksHandler', () => {
    test('returns 200 with plannedTracks containing "None"', async () => {
        const result = await getTracksHandler();
        // Check the status code
        expect(result.statusCode).toBe(200);
        // Parse the response body
        const body = JSON.parse(result.body);
        // Ensure 'plannedTracks' is defined
        expect(body.plannedTracks).toBeDefined();
        // Ensure 'plannedTracks' is an array
        expect(Array.isArray(body.plannedTracks)).toBe(true);
        // Ensure 'plannedTracks' contains exactly ["None"]
        expect(body.plannedTracks).toEqual(["None"]);
    });
    test('handles unexpected response structure gracefully', async () => {
        // Mock the handler to return an unexpected structure
        const originalHandler = getTracksHandler;
        jest.resetModules();
        jest.mock('../../lambda/getTracks/index.mjs', () => ({
            getTracksHandler: jest.fn().mockResolvedValue({
                statusCode: 200,
                body: JSON.stringify({ unexpectedField: [] })
            })
        }));
        const { getTracksHandler: mockedHandler } = await import('../../lambda/getTracks/index.mjs');
        const result = await mockedHandler();
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.plannedTracks).toEqual(["None"]);
        // Restore the original handler
        jest.unmock('../../lambda/getTracks/index.mjs');
        Object.defineProperty(global, 'getTracksHandler', { value: originalHandler });
    });
});
//# sourceMappingURL=index.test.mjs.map