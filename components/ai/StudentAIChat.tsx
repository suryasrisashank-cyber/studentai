'use client';

import React from 'react';
import { StudentAIWorkspace } from './workspace/StudentAIWorkspace';
import { ExtendedStoredMessage, Conversation } from './workspace/types';

export type { ExtendedStoredMessage, Conversation };

export interface StudentAIChatProps {
  greeting?: string;
  subtitle?: string;
}

export function StudentAIChat({ greeting, subtitle }: StudentAIChatProps) {
  return <StudentAIWorkspace greeting={greeting} subtitle={subtitle} />;
}

export default StudentAIChat;
