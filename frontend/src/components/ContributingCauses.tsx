import React from 'react';
import { DeletableCause } from './DeletableCause';

interface Cause {
  id: string;
  text: string;
  is_root_cause: boolean;
}

interface ContributingCausesProps {
  causes: Cause[];
  onDelete: (id: string) => void;
  onConvertToRootCause: (id: string) => void;
}

export function ContributingCauses({ causes, onDelete, onConvertToRootCause }: ContributingCausesProps) {
  const rootCauses = causes.filter(cause => cause.is_root_cause);
  const contributingCauses = causes.filter(cause => !cause.is_root_cause);

  return (
    <div className="contributing-causes-container">
      {rootCauses.length > 0 && (
        <div className="root-causes-section">
          <h4>Root Causes</h4>
          <p className="section-description">These causes have been validated through further analysis and are more likely to be the primary drivers of the issue.</p>
          {rootCauses.map(cause => (
            <DeletableCause
              key={cause.id}
              text={cause.text}
              isRootCause={cause.is_root_cause}
              onDelete={() => onDelete(cause.id)}
              onConvertToRootCause={() => onConvertToRootCause(cause.id)}
            />
          ))}
        </div>
      )}

      {contributingCauses.length > 0 && (
        <div className="contributing-causes-section">
          <h4>Contributing Causes</h4>
          {contributingCauses.map(cause => (
            <DeletableCause
              key={cause.id}
              text={cause.text}
              isRootCause={cause.is_root_cause}
              onDelete={() => onDelete(cause.id)}
              onConvertToRootCause={() => onConvertToRootCause(cause.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}