import React from 'react'

const DebloatCheckbox = ({ debloat, setDebloat }) => {
  return (
    <label>
        <input 
            type="checkbox" 
            checked={debloat} 
            onChange={(e) => setDebloat(e.target.checked)} 
        />
        Debloat Package
    </label>
  )
}

export default DebloatCheckbox