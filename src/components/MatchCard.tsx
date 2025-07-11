import React from 'react';

interface MatchCardProps {
  // Define any props you expect MatchCard to receive
  // For example:
  // matchData: any;
}

export const MatchCard: React.FC<MatchCardProps> = (/*props*/) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
      <h4>Match Card</h4>
      <p>Details of a match will be displayed here.</p>
      {/* You can access props like props.matchData here */}
    </div>
  );
};

// Optional: export default if it's the primary export,
// but named export is fine for components.
// export default MatchCard;
