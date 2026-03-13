const game = () => {
    let playerScore = 0;
    let computerScore = 0;
    let roundsPlayed = 0; // fixed
    const maxRounds = 10;
    const playerHistory = [];
    const computerOptions = ['rock', 'paper', 'scissors'];
    const counters = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
    const getDifficulty = () => document.querySelector('input[name="difficulty"]:checked')?.value ?? 'medium';

    const getComputerChoice = () => {
        const difficulty = getDifficulty();
        const getRandomMove = () => computerOptions[Math.floor(Math.random() * 3)];

        // Easy difficulty or Turn 1: random
        if (difficulty === 'easy' || playerHistory.length === 0) return getRandomMove();

        // Analyze last 4 historical moves
        const analysisPool = playerHistory.slice(-4);
        const frequencies = analysisPool.reduce((acc, move) => {
            acc[move] = (acc[move] || 0) + 1;
            return acc;
        }, {});

        const predictedMove = Object.keys(frequencies).reduce((a, b) => 
            frequencies[a] >= frequencies[b] ? a : b
        );

        const roll = Math.random();

        // Medium difficulty: 50% counter, 50% random
        if (difficulty === 'medium') {
            return roll < 0.5 ? counters[predictedMove] : getRandomMove();
        }

        // Hard difficulty: 60% counter, 25% random, 15% lose on purpose
        if (roll < 0.60) return counters[predictedMove];
        if (roll < 0.85) return getRandomMove();

        const losingMoves = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
        return losingMoves[predictedMove];
    };

    // DOM elements
    const playBtn = document.querySelector('.intro button');
    const introScreen = document.querySelector('.intro');
    const match = document.querySelector('.match');
    const options = document.querySelectorAll('.options button');
    const playerHand = document.querySelector('.player-hand');
    const computerHand = document.querySelector('.computer-hand');
    const winnerDisplay = document.querySelector('.winner');
    const playerScoreDisplay = document.querySelector('.player-score p');
    const computerScoreDisplay = document.querySelector('.computer-score p');
    let isClickable = true;

    // Final results container
    const finalResultContainer = document.createElement('div');
    finalResultContainer.classList.add('text-center', 'mt-8', 'w-full');

    const finalResultDisplay = document.createElement('h2');
    finalResultDisplay.classList.add('text-3xl', 'font-bold', 'mb-4', 'text-center');

    const restartButton = document.createElement('button');
    restartButton.classList.add('bg-green-500', 'hover:bg-green-600', 'text-white', 'font-bold', 'py-3', 'px-6', 'rounded-lg', 'transition', 'duration-300', 'ease-in-out');
    restartButton.textContent = 'Play Again';

    finalResultContainer.appendChild(finalResultDisplay);
    finalResultContainer.appendChild(restartButton);

    // Sounds
    const shakeSound = new Audio('./sounds/whoosh.mp3');
    const winSound = new Audio('./sounds/win.mp3');
    const loseSound = new Audio('./sounds/lose.mp3');

    // Safe audio player utility
    const playAudioSafe = (audioElement) => {
        audioElement.currentTime = 0; // Reset sound to start
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Audio playback prevented by browser:", error);
                // Game continues without breaking
            });
        }
    };

    // Preload default images
    ['rock_hand.png', 'paper_hand.png', 'scissors_hand.png'].forEach(
        img => (new Image().src = `./images/${img}`)
    );

    // -------------------------------------------------------
    // Selected images per move type (player's custom choices)
    // -------------------------------------------------------
    const selectedImages = {
        rock: './images/rock_hand.png',
        paper: './images/paper_hand.png',
        scissors: './images/scissors_hand.png'
    };

    // Pending (uncommitted) selection while the picker is open
    const pendingImages = { ...selectedImages };

    // --- Image Picker wiring ---
    const pickerModal = document.getElementById('image-picker-modal');
    const openPickerBtn = document.getElementById('open-image-picker');
    const closePickerBtn = document.getElementById('close-image-picker');
    const confirmPickerBtn = document.getElementById('confirm-image-picker');
    const pickerImgs = document.querySelectorAll('.picker-img');

    /** Highlight whichever image is currently pending for each type */
    const refreshPickerHighlight = () => {
        pickerImgs.forEach(img => {
            const selected = img.dataset.src === pendingImages[img.dataset.type];
            img.classList.toggle('border-sky-500', selected);
            img.classList.toggle('border-transparent', !selected);
            img.classList.toggle('scale-105', selected);
        });
    };

    openPickerBtn.addEventListener('click', () => {
        Object.assign(pendingImages, selectedImages); // sync to committed state
        refreshPickerHighlight();
        pickerModal.classList.remove('hidden');
    });

    const closeModal = () => pickerModal.classList.add('hidden');

    closePickerBtn.addEventListener('click', closeModal);

    // Close when clicking the backdrop
    pickerModal.addEventListener('click', e => {
        if (e.target === pickerModal) closeModal();
    });

    // Clicking an image marks it as pending
    pickerImgs.forEach(img => {
        img.addEventListener('click', () => {
            pendingImages[img.dataset.type] = img.dataset.src;
            refreshPickerHighlight();
        });
    });

    // Confirm button: commit pending choices and close
    confirmPickerBtn.addEventListener('click', () => {
        Object.assign(selectedImages, pendingImages);
        // Immediately show the new rock image on the game board
        playerHand.src = selectedImages.rock;
        computerHand.src = selectedImages.rock;
        closeModal();
    });

    // Start game
    playBtn.addEventListener('click', () => {
        introScreen.classList.add('hidden');
        match.classList.remove('hidden');
        match.classList.add('flex');
    });

    // Play match
    const playMatch = () => {

        options.forEach(option => {
            option.addEventListener('click', function() {
                if (!isClickable || roundsPlayed >= maxRounds) return;

                isClickable = false;
                options.forEach(btn => {
                    btn.disabled = true;
                    btn.classList.add('opacity-75', 'cursor-not-allowed');
                });
                playAudioSafe(shakeSound);


                // Reset animations
                playerHand.style.animation = 'none';
                computerHand.style.animation = 'none';
                void playerHand.offsetWidth; // force reflow
                void computerHand.offsetWidth;

                // Start shaking animation
                playerHand.style.animation = 'shakePlayer 1s ease forwards';
                computerHand.style.animation = 'shakeComputer 1s ease forwards';

                setTimeout(() => {
                    const playerChoice = this.dataset.move;
                    const computerChoice = getComputerChoice();
                    playerHistory.push(playerChoice);

                    // Player uses their custom image; computer uses the default set
                    playerHand.src = selectedImages[playerChoice];
                    computerHand.src = selectedImages[computerChoice];

                    compareHands(playerChoice, computerChoice);

                    roundsPlayed++;
                    if (roundsPlayed >= maxRounds) {
                        endGame();
                    } else {
                        isClickable = true;
                        options.forEach(btn => {
                            btn.disabled = false;
                            btn.classList.remove('opacity-75', 'cursor-not-allowed');
                        });
                    }

                }, 1000);
            });
        });
    };

    const updateScore = () => {
        playerScoreDisplay.textContent = playerScore;
        computerScoreDisplay.textContent = computerScore;
    };

    const compareHands = (playerChoice, computerChoice) => {
        if (playerChoice === computerChoice) {
            winnerDisplay.textContent = 'It is a tie';
            return;
        }

        const wins = {
            rock: 'scissors',
            paper: 'rock',
            scissors: 'paper'
        };

        if (wins[playerChoice] === computerChoice) {
            winnerDisplay.textContent = 'Player Wins!';
            playAudioSafe(winSound);
            playerScore++;
        } else {
            winnerDisplay.textContent = 'Computer Wins!';
            playAudioSafe(loseSound);
            computerScore++;
        }

        updateScore();
    };

    const endGame = () => {
        let finalMessage = '';
        if (playerScore > computerScore) finalMessage = 'You won the game! 🎉';
        else if (computerScore > playerScore) finalMessage = 'Computer won the game. 😢';
        else finalMessage = 'The game is a tie! 🤝';

        finalResultDisplay.textContent = finalMessage;
        match.appendChild(finalResultContainer);
        winnerDisplay.classList.add('hidden');
        document.querySelector('.options').classList.add('hidden');
    };

    const resetGame = () => {
        playerScore = 0;
        computerScore = 0;
        roundsPlayed = 0;
        isClickable = true;
        options.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
        });
        playerHistory.length = 0;
        updateScore();


        winnerDisplay.classList.remove('hidden');
        document.querySelector('.options').classList.remove('hidden');
        if (finalResultContainer.parentNode)
            finalResultContainer.parentNode.removeChild(finalResultContainer);
        playerHand.src = selectedImages.rock;
        computerHand.src = selectedImages.rock;
    };

    restartButton.addEventListener('click', resetGame);

    playMatch();
};


game();


// ---------------------------
// Dark / Light Mode Toggle
// ---------------------------
const themeToggle = document.getElementById("theme-toggle");

const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
    document.body.classList.add(savedTheme);
} else {
    document.body.classList.add("light-mode");
}

themeToggle.addEventListener("click", () => {

    if (document.body.classList.contains("light-mode")) {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "☀️ Light Mode";
        localStorage.setItem("theme", "dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
        themeToggle.textContent = "🌙 Dark Mode";
        localStorage.setItem("theme", "light-mode");
    }

});
