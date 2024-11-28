export const handler = async () => {
    try {
      return {
        statusCode: 200,
        body: JSON.stringify({
          plannedTracks: [
            "None"
          ]
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "The system encountered an error while retrieving the student's track information."
        })
      };
    }
  };
  