import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { getUnreadNotificationCount, hasUserVotedInContest, getContests, getVotingWindowStatus, getUserBadges, getAnnouncements, isContestResultsPublished, getContestResults, getUserVoteForContest } from '../../utils/storage';
import { FaVoteYea, FaBell, FaMapSigns, FaBullhorn, FaCheckCircle, FaCircle, FaArrowRight } from 'react-icons/fa';

const UserDashboard = () => {
  const { user, initialized, refreshData } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeContest: null,
    hasVotedInActive: false,
    unreadNotifications: 0,
    journeyStep: 1, // 1: Approved, 2: Open, 3: Voted, 4: Published
    voteStatus: 'Waiting for Election',
    nextAction: 'Wait for updates'
  });
  const [windowStatus, setWindowStatus] = useState(getVotingWindowStatus());
  const [countdown, setCountdown] = useState('');
  const [badges, setBadges] = useState([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [winnerHighlight, setWinnerHighlight] = useState(null);
  const refreshDataRef = useRef(refreshData);

  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  const formatMs = (ms) => {
    if (!ms || ms <= 0) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }

    const loadDashboardData = () => {

      // Determine Active Contest or Fallback to most relevant
      const allContestsRaw = getContests();
      const publishedContests = [...allContestsRaw]
        .filter(contest => isContestResultsPublished(contest.id))
        .sort((a, b) => {
          const left = new Date(a.updatedAt || a.endDate || a.createdAt || 0).getTime();
          const right = new Date(b.updatedAt || b.endDate || b.createdAt || 0).getTime();
          return right - left;
        });
      const latestPublishedContest = publishedContests[0] || null;

      // Prefer active, then upcoming/draft, then closed
      const activeFromState = allContestsRaw.filter(c => c.status === 'active' && c.votingEnabled !== false);
      const currentContest = activeFromState.length > 0
        ? activeFromState[0]
        : allContestsRaw.length > 0 ? allContestsRaw[0] : null;

      // Check Voting Status
      let hasVoted = false;
      if (currentContest && user) {
        hasVoted = hasUserVotedInContest(user.id, currentContest.id);
      }

      // Determine Journey Step
      let step = 1; // Default: Account Approved
      let vStatus = 'Account Verified';
      let nAction = 'Explore Contests';

      if (currentContest) {
        if (currentContest.status === 'active' && currentContest.votingEnabled) {
          step = 2; // Voting Opened
          vStatus = 'Voting is Open';
          nAction = 'Vote Now';
        } else if (currentContest.status === 'draft') {
          step = 1;
          vStatus = 'Upcoming Election';
          nAction = 'View Details';
        } else {
          // Closed or other
          step = 4;
          vStatus = 'Voting Closed';
          nAction = isContestResultsPublished(currentContest.id) ? 'View Results' : 'Wait for Results';
        }

        if (hasVoted) {
          step = 3; // Vote Submitted
          vStatus = 'Vote Submitted';
          nAction = 'View Participation';

          if (currentContest.resultsPublished) {
            step = 4; // Results Published
            vStatus = 'Results Out';
            nAction = 'View Results';
          }
        }
      }

      if (latestPublishedContest) {
        const votedInPublished = hasUserVotedInContest(user.id, latestPublishedContest.id);
        if (votedInPublished) {
          step = 4;
          vStatus = 'Results Published';
          nAction = 'View Results';
        }

        const publishedResults = getContestResults(latestPublishedContest.id);
        const winner = publishedResults[0] || null;
        const userVote = getUserVoteForContest(user.id, latestPublishedContest.id);
        const votedWinner = Boolean(winner && userVote && String(userVote.contestantId) === String(winner.id));

        setWinnerHighlight({
          contestTitle: latestPublishedContest.title,
          winnerName: winner?.name || null,
          winnerVotes: winner?.votes || 0,
          votedInContest: Boolean(userVote),
          votedWinner
        });
      } else {
        setWinnerHighlight(null);
      }

      setStats({
        activeContest: currentContest,
        hasVotedInActive: hasVoted,
        unreadNotifications: getUnreadNotificationCount(user.id),
        journeyStep: step,
        voteStatus: vStatus,
        nextAction: nAction
      });

      const status = getVotingWindowStatus();
      setWindowStatus(status);
      setCountdown(formatMs(status.ms));
      setBadges(getUserBadges(user.id));
      const anns = getAnnouncements();
      setLatestAnnouncement(anns[0] || null);
      setAnnouncements(anns.slice(0, 5));
    };

    loadDashboardData();

    refreshDataRef.current({ syncUser: true });

    // Auto-refresh every 30 seconds to avoid request storms
    const refreshInterval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    const handleStorageChange = (event) => {
      const key = event?.key || '';
      if (
        key.includes('reality-voting-votes') ||
        key.includes('reality-voting-contests') ||
        key.includes('reality-voting-contestants') ||
        key.includes('reality-voting-notifications') ||
        key.includes('_published')
      ) {
        loadDashboardData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleDataUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('reality-voting-data-updated', handleDataUpdate);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('reality-voting-data-updated', handleDataUpdate);
    };
  }, [initialized, user, navigate]);

  useEffect(() => {
    const tick = () => {
      const status = getVotingWindowStatus();
      setWindowStatus(status);
      setCountdown(formatMs(status.ms));
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const votingClosed = windowStatus.status !== 'open';

  const navigateToVote = () => {
    if (stats.activeContest) {
      navigate(`/user/vote/${stats.activeContest.id}`);
    } else {
      // fallback if no active contest but user clicked action
      navigate('/user/activity');
    }
  };

  const cards = [
    {
      title: 'Active Contest',
      value: stats.activeContest ? 'Live Now' : 'None',
      sub: stats.activeContest ? stats.activeContest.title : 'Check back later',
      icon: <FaVoteYea />,
      color: '#f5365c', // Red/Pinkish
      link: stats.activeContest ? `/user/vote/${stats.activeContest.id}` : '#',
      disabled: !stats.activeContest
    },
    {
      title: 'Vote Status',
      value: stats.hasVotedInActive ? 'Voted' : 'Not Voted',
      sub: stats.hasVotedInActive ? 'Thanks for participating' : 'Cast your vote today',
      icon: <FaCheckCircle />,
      color: stats.hasVotedInActive ? '#2dce89' : '#fb6340', // Green if voted, Orange if not
      link: '/user/activity',
      disabled: false
    },
    {
      title: 'Notifications',
      value: stats.unreadNotifications > 0 ? `${stats.unreadNotifications} New` : 'All caught up',
      sub: 'Updates & Alerts',
      icon: <FaBell />,
      color: '#ffd600', // Yellow
      link: '/user/notifications',
      disabled: false
    }
  ];

  // Journey Steps
  const journeySteps = [
    { id: 1, label: 'Approved' },
    { id: 2, label: 'Voting Open' },
    { id: 3, label: 'Voted' },
    { id: 4, label: 'Results' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* Announcement Banner */}
      {latestAnnouncement && (
        <div style={{
          margin: '15px 0',
          background: '#f0f4ff',
          border: '1px solid #c8d2ff',
          color: '#2b3a67',
          padding: '14px',
          borderRadius: '12px'
        }}>
          <div style={{ fontWeight: 'bold' }}>{latestAnnouncement.title}</div>
          <div style={{ fontSize: '0.95rem' }}>{latestAnnouncement.message}</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>{new Date(latestAnnouncement.createdAt).toLocaleString()}</div>
        </div>
      )}

      {winnerHighlight && winnerHighlight.winnerName && winnerHighlight.votedInContest && (
        <div style={{
          margin: '10px 0 20px',
          background: winnerHighlight.votedWinner
            ? 'linear-gradient(90deg, #e9fff3 0%, #dff9eb 100%)'
            : 'linear-gradient(90deg, #f8f9ff 0%, #edf1ff 100%)',
          border: winnerHighlight.votedWinner ? '1px solid #7fd9a6' : '1px solid #c6d2ff',
          color: winnerHighlight.votedWinner ? '#0f5132' : '#2b3a67',
          padding: '14px 16px',
          borderRadius: '12px'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>
            {winnerHighlight.votedWinner ? 'Congratulations!' : 'Result Published'}
          </div>
          <div style={{ fontSize: '0.95rem' }}>
            {winnerHighlight.votedWinner
              ? `You voted for ${winnerHighlight.winnerName}, who won ${winnerHighlight.contestTitle} with ${winnerHighlight.winnerVotes} votes.`
              : `${winnerHighlight.winnerName} won ${winnerHighlight.contestTitle} with ${winnerHighlight.winnerVotes} votes. Thanks for participating.`}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div style={{
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(87deg, #11cdef 0, #1171ef 100%)',
        padding: '30px',
        borderRadius: '15px',
        color: 'white',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: '24px' }}>Hello, {user.name}</h1>
          <p style={{ margin: '5px 0 0', opacity: 0.9 }}>Welcome to your voting dashboard.</p>
        </div>
        <button
          onClick={() => {
            if (stats.nextAction === 'Vote Now') navigateToVote();
            else if (stats.nextAction === 'View Results') navigate('/user/results');
            else navigate('/user/activity');
          }}
          disabled={votingClosed && stats.nextAction === 'Vote Now'}
          style={{
            background: 'white',
            color: '#1171ef',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.2s',
            fontSize: '14px',
            opacity: votingClosed && stats.nextAction === 'Vote Now' ? 0.5 : 1,
            cursor: votingClosed && stats.nextAction === 'Vote Now' ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {votingClosed && stats.nextAction === 'Vote Now' ? 'Voting Closed' : stats.nextAction} <FaArrowRight />
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '20px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
        marginBottom: '25px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ fontWeight: '700', color: votingClosed ? '#e53e3e' : '#2dce89', fontSize: '1rem' }}>
            {windowStatus.status === 'open' && 'Voting is open'}
            {windowStatus.status === 'upcoming' && 'Voting opens soon'}
            {windowStatus.status === 'closed' && 'Voting closed'}
          </div>
          <div style={{ color: '#4a5568', marginTop: '4px' }}>
            {windowStatus.status === 'open' && `Time left: ${countdown || '—'}`}
            {windowStatus.status === 'upcoming' && `Opens in: ${countdown || 'soon'}`}
            {windowStatus.status === 'closed' && 'We will notify you when the next window starts.'}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', marginBottom: '8px', color: '#32325d' }}>Your badges</div>
          {badges.length === 0 ? (
            <div style={{ color: '#a0aec0' }}>No badges earned yet</div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {badges.map(badge => (
                <span key={badge.id} style={{
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}>
                  {badge.type === 'first_vote' && '🗳️ First Vote'}
                  {badge.type === 'early_voter' && '⏰ Early Voter'}
                  {badge.type === 'profile_complete' && '🧾 Profile Completed'}
                  {badge.type === 'results_viewed' && '🏆 Results Viewer'}
                  {!['first_vote', 'early_voter', 'profile_complete', 'results_viewed'].includes(badge.type) && badge.type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '25px',
        marginBottom: '40px'
      }}>

        {/* Summary Cards */}
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => !card.disabled && navigate(card.link)}
            style={{
              background: 'white',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              cursor: card.disabled ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, box-shadow 0.2s',
              opacity: card.disabled ? 0.7 : 1
            }}
            onMouseEnter={e => {
              if (!card.disabled) {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={e => {
              if (!card.disabled) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.05)';
              }
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 5px', color: '#8898aa', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{card.title}</h3>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#32325d' }}>{card.value}</div>
              <div style={{ fontSize: '13px', color: '#525f7f', marginTop: '4px' }}>{card.sub}</div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}DD 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              boxShadow: `0 4px 10px ${card.color}40`
            }}>
              {card.icon}
            </div>
          </div>
        ))}

        {/* My Voting Journey Card (Unique) */}
        <div
          onClick={() => navigate('/user/activity')}
          style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            gridColumn: '1 / -1', // Span full width
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', background: '#5e72e4', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
            }}>
              <FaMapSigns />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#32325d' }}>My Voting Journey</h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#8898aa' }}>Track your participation progress</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '10px' }}>
            {/* Progress Line */}
            <div style={{
              position: 'absolute', top: '15px', left: '20px', right: '20px', height: '2px', background: '#e9ecef', zIndex: 0
            }}>
              <div style={{
                height: '100%',
                background: '#2dce89',
                width: `${((stats.journeyStep - 1) / (journeySteps.length - 1)) * 100}%`,
                transition: 'width 0.5s ease-in-out'
              }}></div>
            </div>

            {journeySteps.map((step) => {
              const isActive = step.id <= stats.journeyStep;
              const isCurrent = step.id === stats.journeyStep;
              return (
                <div key={step.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isActive ? '#2dce89' : '#e9ecef',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isCurrent ? '4px solid #cceadd' : '4px solid white',
                    transition: 'all 0.3s'
                  }}>
                    {isActive ? <FaCheckCircle style={{ fontSize: '14px' }} /> : <FaCircle style={{ fontSize: '10px', color: '#adb5bd' }} />}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: isActive ? 600 : 400, color: isActive ? '#32325d' : '#adb5bd' }}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Announcements Section */}
      <div style={{
        background: 'white',
        borderRadius: '15px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaBullhorn style={{ color: '#fb6340' }} />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#32325d' }}>Latest Announcements</h3>
        </div>
        <div style={{ padding: 0 }}>
          {announcements.length === 0 ? (
            <div style={{ padding: '20px 25px', color: '#8898aa' }}>No announcements yet.</div>
          ) : (
            announcements.map((a, idx) => {
              const created = new Date(a.createdAt);
              const now = new Date();
              const isToday = created.toDateString() === now.toDateString();
              return (
                <div key={a.id} style={{ padding: '20px 25px', borderBottom: idx < announcements.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    {isToday && <span style={{ background: '#e0f7fa', color: '#006064', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>NEW</span>}
                    <span style={{ fontSize: '12px', color: '#8898aa' }}>{created.toLocaleString()}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#32325d', marginBottom: '6px' }}>{a.title}</div>
                  <p style={{ margin: 0, color: '#525f7f', fontSize: '14px', lineHeight: '1.5' }}>{a.message}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;
