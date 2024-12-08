export const getTracksHandler = async () => {
    return {
      statusCode: 200,
      body: JSON.stringify({
        plannedTracks: [
          "None"
        ]
      })
    };
  };
  