import React from 'react';

interface SeasonStatsSummaryProps {
  // Define any props you expect SeasonStatsSummary to receive
  // For example:
  // stats: any;
}

export const SeasonStatsSummary: React.FC<SeasonStatsSummaryProps> = (/*props*/) => {
  return (
    <div style={{ border: '1px solid #eee', padding: '10px', margin: '10px' }}>
      <h5>Season Stats Summary</h5>
      <p>Summary of season statistics will be displayed here.</p>
      {/* You can access props like props.stats here */}
    </div>
  );
};

export default SeasonStatsSummary;
