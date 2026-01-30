// Shared role display info for Secret Chancellor

import { Role } from './gameTypes';

export const ROLE_INFO: Record<
  Role,
  {
    title: string;
    emoji: string;
    description: string;
    color: string;
    objectives: string[];
  }
> = {
  [Role.STUDENT_UNION]: {
    title: 'Student Union',
    emoji: '📚',
    description:
      'You are a member of the Student Union. Work together to enact 5 Student Union policies or identify and remove the Chancellor.',
    color: 'studentUnion',
    objectives: [
      'Enact 5 Student Union policies',
      'Identify and ban the Chancellor',
      'Prevent Admin policies from being enacted'
    ]
  },
  [Role.CHANCELLORS_OFFICE]: {
    title: 'University Admin',
    emoji: '🏛️',
    description:
      'You are part of the University Admin. Help the Chancellor gain power by enacting Admin policies or getting them elected as Policy Chair.',
    color: 'chancellorsOffice',
    objectives: [
      'Enact 6 Admin policies',
      'Get the Chancellor elected as Policy Chair after 3 Admin policies',
      'Deceive the Student Union'
    ]
  },
  [Role.CHANCELLOR]: {
    title: 'The Chancellor',
    emoji: '👑',
    description:
      'You are the secret Chancellor! Stay hidden while your office works to install you in power. If elected Policy Chair after 3 Admin policies, you win!',
    color: 'chancellor',
    objectives: [
      'Stay hidden from the Student Union',
      'Get elected as Policy Chair after 3 Admin policies are enacted',
      'Work with your office to enact 6 Admin policies'
    ]
  }
};
