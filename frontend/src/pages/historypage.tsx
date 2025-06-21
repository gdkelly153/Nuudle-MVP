"use client";

import React, { useState, useEffect } from "react";
import SessionCard from "@/components/SessionCard";

interface Session {
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
}

const HistoryPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/sessions");
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else {
          console.error("Failed to fetch sessions:", response.status);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="wizard-step-container">
      <h2>Session History</h2>
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
};

export default HistoryPage;