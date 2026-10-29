import { CartoonCoin } from '../components/CartoonCoin';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api, { API_BASE_URL } from '../utils/api';

const IMAGES = [
    '/game-icons/game_burger_1778395243224.png',
    '/game-icons/game_coffee_1778395328243.png',
    '/game-icons/game_cupcake_1778395343186.png',
    '/game-icons/game_donut_1778395288126.png',
    '/game-icons/game_hotdog_1778395314910.png',
    '/game-icons/game_icecream_1778395272885.png',
    '/game-icons/game_pizza_1778395255404.png',
    '/game-icons/game_taco_1778395302405.png'
];

const Games = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const { theme } = useTheme();

    const [activeTab, setActiveTab] = useState('play'); // 'play' | 'leaderboard'
    const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'gameover'
    
    useEffect(() => {
        console.log("Games component mounted!");
    }, []);
    
    // Game variables
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [movesLeft, setMovesLeft] = useState(5);
    const [cards, setCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    
    // Leaderboard
    const [leaderboard, setLeaderboard] = useState([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    
    const [myBestScore, setMyBestScore] = useState(0);

    useEffect(() => {
        if (activeTab === 'leaderboard') {
            fetchLeaderboard();
        }
        if (activeTab === 'play' && gameState === 'menu') {
            fetchMyBestScore();
        }
    }, [activeTab, gameState]);

    const fetchMyBestScore = async () => {
        try {
            const res = await api.get('/games/my-score/memory');
            if (res.success) {
                setMyBestScore(res.score || 0);
            }
        } catch (error) {
            console.error('Failed to fetch best score', error);
        }
    };

    const fetchLeaderboard = async () => {
        setLoadingLeaderboard(true);
        try {
            const res = await api.get('/games/leaderboard/memory');
            console.log('Leaderboard response:', res);
            if (res.success) {
                setLeaderboard(res.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error.message, error.response?.data);
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    const startGame = () => {
        setScore(0);
        setMovesLeft(5);
        setLevel(1);
        setGameState('playing');
        initLevel(1);
    };

    const initLevel = (currentLevel) => {
        // Start with 2 pairs at level 1, increasing by 1 pair each level
        const numPairs = currentLevel + 1;
        
        // Loop IMAGES if we need more pairs than unique images
        let pool = [];
        while (pool.length < numPairs) {
            // Shuffle IMAGES before adding to pool for randomness
            pool = [...pool, ...[...IMAGES].sort(() => 0.5 - Math.random())];
        }
        
        const selectedImages = pool.slice(0, numPairs);
        
        let deck = [...selectedImages, ...selectedImages];
        deck = deck.sort(() => Math.random() - 0.5);
        
        // Add a unique ID to each card so multiple same images don't conflict during mapping
        setCards(deck.map((imgUrl, idx) => ({ id: idx, Icon: imgUrl })));
        setFlippedIndices([]);
        setMatchedPairs([]);
        
        // Provide some extra possible moves so it's not exactly restricted
        // e.g. 2 pairs = 6 moves, 3 pairs = 8 moves
        setMovesLeft(Math.ceil(numPairs * 2) + 2);
    };

    const handleCardClick = (index) => {
        if (flippedIndices.length === 2) return;
        if (flippedIndices.includes(index)) return;
        if (matchedPairs.includes(index)) return;
        
        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            const currentMovesLeft = movesLeft - 1;
            setMovesLeft(currentMovesLeft);

            const [firstIdx, secondIdx] = newFlipped;
            if (cards[firstIdx].Icon === cards[secondIdx].Icon) {
                // Match
                setTimeout(() => {
                    setMatchedPairs(prev => {
                        const newMatched = [...prev, firstIdx, secondIdx];
                        if (newMatched.length < cards.length && currentMovesLeft <= 0) {
                            handleGameOver(score + (10 * level));
                        }
                        return newMatched;
                    });
                    setFlippedIndices([]);
                    setScore(prev => prev + (10 * level)); // More points for higher levels
                }, 500);
            } else {
                // No Match
                setTimeout(() => {
                    setFlippedIndices([]);
                    if (currentMovesLeft <= 0) {
                        handleGameOver(score);
                    }
                }, 800);
            }
        }
    };

    useEffect(() => {
        if (gameState === 'playing' && cards.length > 0 && matchedPairs.length === cards.length) {
            // Level cleared!
            setTimeout(() => {
                setLevel(prev => {
                    const nextLevel = prev + 1;
                    initLevel(nextLevel);
                    return nextLevel;
                });
            }, 1000);
        }
    }, [matchedPairs, gameState, cards]);

    const handleGameOver = async (finalScore = score) => {
        setGameState('gameover');
        try {
            if (finalScore >= 0) {
                await api.post('/games/score', { score: finalScore, mode: 'memory' });
                
                if (finalScore > myBestScore) {
                    setMyBestScore(finalScore);
                }
                
                // Refresh the leaderboard quietly in the background
                fetchLeaderboard();
            }
        } catch (error) {
            console.error('Failed to submit score', error);
            if (error.response?.status === 401) {
                alert('Your session expired. Please log in again to save your score!');
                navigate('/login');
            } else {
                console.error('Score save error:', error.response?.data?.message || error.message);
            }
        }
    };





    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm">
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button onClick={() => navigate('/profile')} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 shadow-sm border border-gray-100/50 dark:border-gray-200/50">
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-900 tracking-tight">Mind Match</h1>
                    </div>
                </div>
            </div>

            <div className="pt-[100px] px-4 max-w-md mx-auto">
                
                {/* Premium Tabs */}
                <div className="relative flex bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-1 mb-8 shadow-inner border border-white/40 dark:border-gray-700/50 max-w-[280px] mx-auto">
                    {/* Animated Sliding Background */}
                    <div 
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out`}
                        style={{ transform: activeTab === 'play' ? 'translateX(0)' : 'translateX(100%)' }}
                    ></div>
                    
                    <button 
                        onClick={() => setActiveTab('play')}
                        className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 ${activeTab === 'play' ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        Play
                    </button>
                    <button 
                        onClick={() => setActiveTab('leaderboard')}
                        className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 ${activeTab === 'leaderboard' ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        Leaderboard
                    </button>
                </div>

                {activeTab === 'play' && (
                    <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white dark:border-gray-700/50 min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden">
                        
                        {gameState === 'menu' && (
                            <div className="text-center w-full py-6">
                                <div className="w-24 h-24 bg-gradient-to-tr from-green-50 to-emerald-100 dark:from-green-900/40 dark:to-emerald-800/40 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/60 dark:border-green-800/30">
                                    <span className="text-5xl drop-shadow-sm">🧠</span>
                                </div>
                                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Mind Match</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-base mb-8 px-6 leading-relaxed">
                                    Test your focus. Match the pairs before your moves run out.
                                </p>

                                {myBestScore > 0 && (
                                    <div className="mb-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl py-3 px-4 border border-gray-100 dark:border-gray-700 mx-auto inline-flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Best Score</span>
                                        <span className="text-3xl font-black text-[#2E5A2E] dark:text-[#CBF9B2] leading-none">{myBestScore}</span>
                                    </div>
                                )}

                                <button 
                                    onClick={startGame}
                                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                                >
                                    Start Playing
                                </button>

                                <div className="mt-5 flex flex-col items-center gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] animate-pulse"></span>
                                        <span className="text-[11px] font-bold text-[#2E5A2E] dark:text-[#CBF9B2] uppercase tracking-wider flex items-center gap-1.5"><CartoonCoin size={18} /> Top players win 1 Coin daily</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Reward given at 5:00 PM IST daily</span>
                                        <span className="text-[9px] text-gray-400 uppercase tracking-[0.15em] mt-0.5">Tied for #1? Everyone gets 1 Coin!</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {gameState === 'playing' && (
                            <div className="w-full relative z-10">
                                {/* HUD */}
                                <div className="flex justify-between items-start w-full mb-10 px-2">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1">Level {level}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-gray-900 dark:text-white text-xl">Moves</span>
                                            <span className="font-black text-2xl text-[#2E5A2E] dark:text-[#CBF9B2]">{movesLeft}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em]">Score</span>
                                            {myBestScore > 0 && (
                                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em]">
                                                    (Best: {Math.max(score, myBestScore)})
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-black text-3xl text-gray-900 dark:text-white leading-none tracking-tight">{score}</span>
                                    </div>
                                </div>

                                {/* Card Grid */}
                                <div 
                                    className="grid gap-3 mx-auto w-full max-w-[340px]"
                                    style={{
                                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cards.length))}, 1fr)`
                                    }}
                                >
                                    {cards.map((card, index) => {
                                        const isFlipped = flippedIndices.includes(index) || matchedPairs.includes(index);
                                        const isMatched = matchedPairs.includes(index);

                                        return (
                                            <div 
                                                key={index} 
                                                className="aspect-square relative perspective-1000 cursor-pointer group"
                                                onClick={() => handleCardClick(index)}
                                            >
                                                <div 
                                                    className={`w-full h-full transition-transform duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : 'group-active:scale-95 transition-transform'}`}
                                                >
                                                    {/* Front (Face Down) */}
                                                    <div className="absolute w-full h-full rounded-2xl backface-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 shadow-md transition-all group-hover:bg-gray-300 dark:group-hover:bg-gray-600">
                                                    </div>
                                                    
                                                    {/* Back (Face Up) */}
                                                    <div className={`absolute w-full h-full rounded-2xl backface-hidden rotate-y-180 flex items-center justify-center overflow-hidden transition-all duration-300 bg-white dark:bg-gray-800 shadow-md`}>
                                                        <img 
                                                            src={card.Icon} 
                                                            alt="card"
                                                            className={`w-full h-full object-cover transition-all duration-500`} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {gameState === 'gameover' && (
                            <div className="text-center w-full relative z-10 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">Game Over</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-base mb-10">You completed up to Level {level}</p>
                                
                                <div className="mb-12">
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-3">Final Score</p>
                                    <p className="text-7xl font-black text-[#2E5A2E] dark:text-[#CBF9B2] tracking-tighter mb-4">{score}</p>
                                    
                                    {myBestScore > 0 && (
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Best Score</span>
                                            <span className="text-sm font-black text-gray-900 dark:text-white">{Math.max(score, myBestScore)}</span>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={startGame}
                                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                                >
                                    Play Again
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="animate-in fade-in duration-300">
                        {/* Reward Info Box */}
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/40 dark:border-gray-700/40 rounded-2xl p-4 mb-6 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-[#CBF9B2]/40 dark:bg-[#CBF9B2]/20 rounded-full flex items-center justify-center shrink-0">
                                    <Trophy size={16} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Daily Competition</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                        Be #1 at <span className="font-bold text-[#2E5A2E] dark:text-[#CBF9B2]">5:00 PM IST</span> to win 1 Coin. If players have the same score, each will receive a reward!
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {loadingLeaderboard ? (
                                <div className="text-center py-12">
                                    <div className="w-10 h-10 border-4 border-[#2E5A2E]/30 border-t-[#2E5A2E] rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-500 font-medium">Loading high scores...</p>
                                </div>
                            ) : leaderboard.length === 0 ? (
                                <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-[2rem] border border-white/40 dark:border-gray-700/40">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trophy size={28} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium text-lg">No scores yet.</p>
                                    <p className="text-gray-400 text-sm">Be the first to set a record!</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100/80 dark:border-gray-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                                    <table className="w-full text-left border-collapse min-w-[320px]">
                                        <thead>
                                            <tr className="bg-gray-50/50 dark:bg-gray-700/30">
                                                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700/50">Rank</th>
                                                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700/50 text-center">Player</th>
                                                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700/50 text-right">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
                                            {leaderboard.map((entry, index) => {
                                                const isFirst = entry.score === leaderboard[0].score;
                                                const displayRank = leaderboard.findIndex(e => e.score === entry.score) + 1;
                                                
                                                return (
                                                    <tr key={entry._id} className="group hover:bg-gray-50/30 dark:hover:bg-gray-700/10 transition-colors">
                                                        <td className="py-5 px-6">
                                                            <span className={`font-bold text-lg ${isFirst ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' : 'text-gray-400 dark:text-gray-500'}`}>
                                                                #{displayRank}
                                                            </span>
                                                        </td>
                                                        <td className="py-5 px-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative shrink-0">
                                                                    <img 
                                                                        src={entry.user?.avatar || '/avatars/strawberry.png'} 
                                                                        alt="" 
                                                                        className="w-11 h-11 rounded-full object-cover bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700"
                                                                    />
                                                                    {isFirst && (
                                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#2E5A2E] dark:bg-[#CBF9B2] rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                                                                            <Crown size={10} className="text-white dark:text-[#2E5A2E]" fill="currentColor" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col min-w-0 pr-8">
                                                                    <span className="font-semibold text-base text-gray-900 dark:text-white leading-tight whitespace-nowrap">
                                                                        {entry.user?.name || 'Anonymous'}
                                                                    </span>
                                                                    {isFirst && <span className="text-[10px] font-bold text-[#2E5A2E] dark:text-[#CBF9B2] uppercase tracking-wider mt-0.5 whitespace-nowrap">Top Score</span>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-6 text-right">
                                                            <span className="font-bold text-gray-900 dark:text-white text-xl tracking-tight">
                                                                {entry.score}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
            
            {/* 3D Transform Styles for cards */}
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

export default Games;
