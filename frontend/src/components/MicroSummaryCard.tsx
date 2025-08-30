"use client";

import React, { useState } from 'react';

interface MicroSummaryCardProps {
  summary: string;
  onAccept: () => void;
  onEdit: (newSummary: string) => void;
  onSkip: () => void;
}

export function MicroSummaryCard({ summary, onAccept, onEdit, onSkip }: MicroSummaryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary);

  const handleSave = () => {
    onEdit(editedSummary);
    setIsEditing(false);
  };

  return (
    <div className="micro-summary-card">
      {isEditing ? (
        <textarea
          value={editedSummary}
          onChange={(e) => setEditedSummary(e.target.value)}
          rows={4}
        />
      ) : (
        <pre>{summary}</pre>
      )}
      <div className="button-group">
        {isEditing ? (
          <button onClick={handleSave}>Save</button>
        ) : (
          <>
            <button onClick={onAccept}>Looks right</button>
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={onSkip} className="skip-button">Skip</button>
          </>
        )}
      </div>
    </div>
  );
}