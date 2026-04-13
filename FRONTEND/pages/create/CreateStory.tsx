import React from 'react';
import { Navigate } from 'react-router-dom';

/** Legacy URL `/create/story` — canonical flow is `/stories/create`. */
export default function CreateStory() {
  return <Navigate to="/stories/create" replace />;
}
