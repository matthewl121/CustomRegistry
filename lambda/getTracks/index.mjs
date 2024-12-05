export const getTracksHandler = async () => {
    return {
      statusCode: 200,
      body: JSON.stringify({
        plannedTracks: [
        ]
      })
    };
  };

  // TDOD UPDATE TEST TO CHECK EMPTY OBJECT
  