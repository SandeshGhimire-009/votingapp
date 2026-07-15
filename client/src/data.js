// Reality Voting System - Seed Data
import candidate1 from './assets/candidate1.jpeg';
import candidate2 from './assets/candidate2.jpeg';
import candidate3 from './assets/candidate3.jpg';
import candidate4 from './assets/candidate4.jpeg';
import candidate5 from './assets/candidate5.jpg';
import candidate6 from './assets/candidate6.jpg';

// Default Users (Admin is added in storage.js)
export const users = [
  {
    id: 1,
    email: "voter@realityshow.com",
    password: "password123",
    name: "John Voter",
    phoneNumber: "+1234567890",
    isAdmin: false,
    accountStatus: "approved",
    createdAt: new Date().toISOString(),
    profilePicture: null,
    lastLogin: null
  }
];

// Default Contests
const now = new Date();
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

export const contests = [
  {
    id: 1,
    title: "Singing Stars Season 1",
    description: "The ultimate singing competition where talented contestants battle for the title of Singing Star. Vote for your favorite performer!",
    startDate: now.toISOString().split('T')[0],
    endDate: nextWeek.toISOString().split('T')[0],
    status: "active",
    votingEnabled: true,
    resultsPublished: false,
    winnerId: null,
    createdAt: new Date().toISOString(),
    totalVotes: 0
  }
];

// Default Contestants for Contest 1
export const contestants = [
  {
    id: 1,
    contestId: 1,
    name: "Emma Watson",
    description: "Powerful vocals and emotional depth. Started singing at age 8 and has performed at over 200 live shows.",
    image: candidate1,
    votes: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    contestId: 1,
    name: "Marcus Johnson",
    description: "Unique voice and guitar skills. Writes original songs and has released 3 independent albums.",
    image: candidate2,
    votes: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    contestId: 1,
    name: "Sophia Martinez",
    description: "Combines Latin rhythms with contemporary pop. Bilingual performer who connects with audiences.",
    image: candidate3,
    votes: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    contestId: 1,
    name: "James Wilson",
    description: "Country music traditionalist with a modern twist. Storytelling through music has won local awards.",
    image: candidate4,
    votes: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    contestId: 1,
    name: "Isabella Chen",
    description: "Smooth jazz vocals. Classically trained musician who found her passion in jazz.",
    image: candidate5,
    votes: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    contestId: 1,
    name: "Ryan O'Connor",
    description: "Singer-songwriter who performs original acoustic compositions. Creates deep connections with listeners.",
    image: candidate6,
    votes: 0,
    createdAt: new Date().toISOString()
  }
];

// Legacy exports for compatibility
export const seasons = contests;
export const episodes = [];
export const candidates = contestants;
