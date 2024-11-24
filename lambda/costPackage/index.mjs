export const handler = async (event) => {
  
    // calculate standalone cost (can look at /package/{id} GET endpoint)
  
    // check if dependency flag is set
  
      // parse through package.json to get list of dependencies
  
      // iterate through dependencies list to calculate their costs 
      // only go through one layer to avoid circular dependencies
      
        // if dependency--version does not exist in S3, use estimated cost below
        // AVERAGE PACKAGE SIZE ON NPM IS ~500KB in 2023
  
    
    // craft response body
  
  
  
  
    
  
    // TODO implement
    const response = {
      statusCode: 200,
      body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
  };
  