import React from "react";

interface SessionProps {
  session: {
    id: number;
    created_at: string;
    pain_point: string;
    issue_tree: {
      primary_cause: string;
      sub_causes: string[];
    };
    assumptions: string[];
    perpetuations: string[];
    solutions: string[];
    fears: { name: string; mitigation: string; contingency: string }[];
    action_plan: string;
  };
}

const SessionCard: React.FC<SessionProps> = ({ session }) => {
  return (
    <div style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
      <h3>{session.pain_point}</h3>
      <p>
        <em>{new Date(session.created_at).toLocaleString()}</em>
      </p>
      <div>
        <strong>Issue Tree:</strong>
        <p><strong>Primary Cause:</strong> {session.issue_tree.primary_cause}</p>
        <strong>Sub Causes:</strong>
        <ul>
          {session.issue_tree.sub_causes.map((cause, index) => (
            <li key={index}>{cause}</li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Assumptions:</strong>
        <ul>
          {session.assumptions.map((assumption, index) => (
            <li key={index}>{assumption}</li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Perpetuations:</strong>
        <ul>
          {session.perpetuations.map((perpetuation, index) => (
            <li key={index}>{perpetuation}</li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Solutions:</strong>
        <ul>
          {session.solutions.map((solution, index) => (
            <li key={index}>{solution}</li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Fears:</strong>
        <ul>
          {session.fears.map((fear, index) => (
            <li key={index}>
              <strong>{fear.name}:</strong> {fear.mitigation} <em>(Contingency: {fear.contingency})</em>
            </li>
          ))}
        </ul>
      </div>
      <p>
        <strong>Action Plan:</strong> {session.action_plan}
      </p>
    </div>
  );
};

export default SessionCard;