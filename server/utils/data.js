// In-memory data store aligned with client schema

const elections = [
  {
    id: 1,
    title: 'Student Council Election 2024',
    description:
      'Vote for your student council representatives who will represent your interests and organize campus events.',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    status: 'active',
    totalVotes: 0,
    candidates: [
      {
        id: 1,
        name: 'Sarah Johnson',
        position: 'President',
        party: 'Student Unity Party',
        bio: 'Experienced leader with 2 years in student government. Focused on improving campus facilities and student welfare.',
        image: 'https://via.placeholder.com/200x200/cccccc/666666?text=Sarah',
        votes: 0,
      },
      {
        id: 2,
        name: 'Michael Chen',
        position: 'President',
        party: 'Progressive Students',
        bio: 'Tech-savvy leader passionate about digital innovation and sustainable campus initiatives.',
        image: 'https://via.placeholder.com/200x200/cccccc/666666?text=Michael',
        votes: 0,
      },
      {
        id: 3,
        name: 'Emily Rodriguez',
        position: 'Vice President',
        party: 'Student Unity Party',
        bio: 'Dedicated to promoting diversity and inclusion on campus. Strong advocate for mental health resources.',
        image: 'https://via.placeholder.com/200x200/cccccc/666666?text=Emily',
        votes: 0,
      },
    ],
  },
  {
    id: 2,
    title: 'Class Representative Election',
    description: 'Choose your class representative for the Computer Science department.',
    startDate: '2024-01-10',
    endDate: '2024-01-15',
    status: 'completed',
    totalVotes: 150,
    candidates: [
      {
        id: 4,
        name: 'David Kim',
        position: 'Class Representative',
        party: 'Tech Forward',
        bio: 'Computer Science senior with focus on improving curriculum and internship opportunities.',
        image: 'https://via.placeholder.com/200x200/cccccc/666666?text=David',
        votes: 89,
      },
      {
        id: 5,
        name: 'Lisa Wang',
        position: 'Class Representative',
        party: 'Academic Excellence',
        bio: 'Honor student committed to enhancing academic resources and study support programs.',
        image: 'https://via.placeholder.com/200x200/cccccc/666666?text=Lisa',
        votes: 61,
      },
    ],
  },
  {
    id: 3,
    title: 'Sports Committee Election',
    description:
      'Elect members for the sports committee to organize athletic events and manage sports facilities.',
    startDate: '2024-01-25',
    endDate: '2024-01-30',
    status: 'upcoming',
    totalVotes: 0,
    candidates: [
      {
        id: 6,
        name: 'Alex Thompson',
        position: 'Sports Coordinator',
        party: 'Athletic Alliance',
        bio: 'Former varsity athlete with experience in event management and sports facility improvement.',
        image: 'https://via.placeholder.com/200x200/cccccc/666666?text=Alex',
        votes: 0,
      },
    ],
  },
];

const users = [
  {
    id: 1,
    email: 'student@university.edu',
    password: 'password123',
    name: 'John Student',
    studentId: 'STU001',
    hasVoted: [], // array of election ids
    isAdmin: false,
  },
  {
    id: 2,
    email: 'admin@university.edu',
    password: 'admin123',
    name: 'Admin User',
    studentId: 'ADM001',
    hasVoted: [],
    isAdmin: true,
  },
];

function getElectionById(id) {
  return elections.find((e) => e.id === Number(id));
}

function getCandidateById(electionId, candidateId) {
  const election = getElectionById(electionId);
  if (!election) return undefined;
  return election.candidates.find((c) => c.id === Number(candidateId));
}

function getUserByEmail(email) {
  return users.find((u) => u.email === email);
}

function authenticateUser(email, password) {
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    return user;
  }
  return null;
}

function castVote(electionId, candidateId, userId) {
  const election = getElectionById(electionId);
  if (!election) {
    return { success: false, message: 'Election not found' };
  }
  const candidate = getCandidateById(electionId, candidateId);
  if (!candidate) {
    return { success: false, message: 'Candidate not found' };
  }
  const user = users.find((u) => u.id === Number(userId));
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  if (user.hasVoted.includes(election.id)) {
    return { success: false, message: 'You have already voted in this election' };
  }
  candidate.votes += 1;
  election.totalVotes += 1;
  user.hasVoted.push(election.id);
  return { success: true, message: 'Vote cast successfully' };
}

module.exports = {
  elections,
  users,
  getElectionById,
  getCandidateById,
  getUserByEmail,
  authenticateUser,
  castVote,
};


