import { getTracksHandler } from './tracks'; // Adjust the import path as needed

describe('getTracksHandler', () => {
  it('should return a 200 status code', async () => {
    const response = await getTracksHandler();
    expect(response.statusCode).toBe(200);
  });

  it('should return an object with plannedTracks array in the body', async () => {
    const response = await getTracksHandler();
    const body = JSON.parse(response.body);
    
    expect(body).toHaveProperty('plannedTracks');
    expect(Array.isArray(body.plannedTracks)).toBe(true);
  });

  it('should return an empty plannedTracks array', async () => {
    const response = await getTracksHandler();
    const body = JSON.parse(response.body);
    
    expect(body.plannedTracks).toHaveLength(0);
  });

  it('should return valid JSON in the body', async () => {
    const response = await getTracksHandler();
    
    expect(() => {
      JSON.parse(response.body);
    }).not.toThrow();
  });
});