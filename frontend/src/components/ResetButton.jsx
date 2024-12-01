import React from 'react'

const Reset = () => {
    const handleReset = () => {
        /* API call for resetting registry
        ** Endpoint: DELETE /reset => AWS Lambda fn: resetRegistry
        */
    }

    return (
        <button onClick={handleReset}>Reset</button>
    )
}

export default Reset