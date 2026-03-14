const game = () => {

    let playerScore = 0;
    let computerScore = 0;
    let roundsPlayed = 0;
    let maxRounds = 10; //

    const playerHistory = [];
    const computerOptions = ['rock','paper','scissors'];
    const counters = { rock:'paper', paper:'scissors', scissors:'rock' };

    let bestScore = localStorage.getItem("bestScore") || 0;

    const getDifficulty = () =>
        document.querySelector('input[name="difficulty"]:checked')?.value ?? 'medium';

    const historyList = document.getElementById("history-list");
    const gameHistory = [];

    const countdownEl = document.getElementById("countdown");

    const startCountdown = async () => {

        countdownEl.classList.remove("hidden");

        const numbers = ["3","2","1","GO!"];

        for(let i=0;i<numbers.length;i++){

            countdownEl.textContent = numbers[i];

            countdownEl.style.animation = "none";
            void countdownEl.offsetWidth;
            countdownEl.style.animation = "pop 0.6s ease";

            await new Promise(resolve=>setTimeout(resolve,700));
        }

        countdownEl.classList.add("hidden");
    };

    const getComputerChoice = (playerChoice) => {

        const difficulty = getDifficulty();

        const getRandomMove = () =>
            computerOptions[Math.floor(Math.random()*3)];

        if(difficulty === 'easy') return getRandomMove();

        const analysisPool = [...playerHistory.slice(-3),playerChoice];

        const frequencies = analysisPool.reduce((acc,move)=>{
            acc[move] = (acc[move]||0)+1;
            return acc;
        },{});

        const predictedMove = Object.keys(frequencies)
        .reduce((a,b)=>frequencies[a]>=frequencies[b]?a:b);

        const roll = Math.random();

        if(difficulty === 'medium'){
            return roll < 0.5 ? counters[predictedMove] : getRandomMove();
        }

        if(roll < 0.60) return counters[predictedMove];
        if(roll < 0.85) return getRandomMove();

        const losingMoves = {rock:'scissors',paper:'rock',scissors:'paper'};
        return losingMoves[predictedMove];
    };

    const addHistory = (round,playerChoice,computerChoice,result)=>{

        const entry = `Round ${round}: Player (${playerChoice}) vs Computer (${computerChoice}) → ${result}`;

        gameHistory.push(entry);

        const li = document.createElement("li");
        li.textContent = entry;
        li.classList.add("border-b","pb-1");

        historyList.appendChild(li);
        historyList.scrollTop = historyList.scrollHeight;
    };

    const playBtn = document.querySelector('.intro button');
    const introScreen = document.querySelector('.intro');
    const match = document.querySelector('.match');
    const options = document.querySelectorAll('.options button');

    const playerHand = document.querySelector('.player-hand');
    const computerHand = document.querySelector('.computer-hand');

    const winnerDisplay = document.querySelector('.winner');

    const playerScoreDisplay = document.querySelector('.player-score p');
    const computerScoreDisplay = document.querySelector('.computer-score p');

    const playerBar = document.getElementById("player-bar");
    const computerBar = document.getElementById("computer-bar");

    let isClickable = true;
    let isPaused = false;

    const pauseBtn = document.getElementById("pause-btn");

    pauseBtn.addEventListener("click",()=>{

        isPaused = !isPaused;

        if(isPaused){

            pauseBtn.textContent = "▶ Resume";

            options.forEach(btn=>{
                btn.disabled = true;
                btn.classList.add('opacity-50','cursor-not-allowed');
            });

            winnerDisplay.textContent = "Game Paused ⏸";

        }else{

            pauseBtn.textContent = "⏸ Pause";

            options.forEach(btn=>{
                btn.disabled = false;
                btn.classList.remove('opacity-50','cursor-not-allowed');
            });

            winnerDisplay.textContent = "Choose your hand!";
        }
    });

    const finalResultContainer = document.createElement('div');
    finalResultContainer.classList.add('text-center','mt-8','w-full');

    const finalResultDisplay = document.createElement('h2');
    finalResultDisplay.classList.add('text-3xl','font-bold','mb-4');

    const restartButton = document.createElement('button');
    restartButton.classList.add(
        'bg-green-500','hover:bg-green-600',
        'text-white','font-bold','py-3','px-6',
        'rounded-lg','transition'
    );

    restartButton.textContent = "Play Again";

    finalResultContainer.appendChild(finalResultDisplay);
    finalResultContainer.appendChild(restartButton);

    const shakeSound = new Audio('./sounds/whoosh.mp3');
    const winSound = new Audio('./sounds/win.mp3');
    const loseSound = new Audio('./sounds/lose.mp3');

    ['rock_hand.png','paper_hand.png','scissors_hand.png']
    .forEach(img=> new Image().src=`./images/${img}`);

    const selectedImages = {
        rock:'./images/rock_hand.png',
        paper:'./images/paper_hand.png',
        scissors:'./images/scissors_hand.png'
    };

    playBtn.addEventListener('click',()=>{

        if(musicEnabled){
            startSound.play();
        }
        const bestOfSelect = document.getElementById("best-of-select");
maxRounds = parseInt(bestOfSelect.value) || 10; // default 10 if parsing fails

        introScreen.classList.add('hidden');
        match.classList.remove('hidden');
        match.classList.add('flex');
    });

    const playMatch = () => {

        options.forEach(option=>{

            option.addEventListener('click', async function(){

                if(!isClickable || isPaused || roundsPlayed >= maxRounds) return;

                await startCountdown();

                isClickable = false;

                options.forEach(btn=>{
                    btn.disabled = true;
                    btn.classList.add('opacity-75','cursor-not-allowed');
                });

                shakeSound.play();

                playerHand.style.animation='none';
                computerHand.style.animation='none';
                void playerHand.offsetWidth;
                void computerHand.offsetWidth;

                playerHand.style.animation='shakePlayer 1s ease forwards';
                computerHand.style.animation='shakeComputer 1s ease forwards';

                setTimeout(()=>{

                    const playerChoice = this.classList[0];
                    const computerChoice = getComputerChoice(playerChoice);

                    playerHistory.push(playerChoice);

                    playerHand.src = selectedImages[playerChoice];
                    computerHand.src = selectedImages[computerChoice];

                    compareHands(playerChoice,computerChoice);

                    roundsPlayed++;

                    if(roundsPlayed >= maxRounds){
                        endGame();
                    }else{

                        isClickable = true;

                        options.forEach(btn=>{
                            btn.disabled=false;
                            btn.classList.remove('opacity-75','cursor-not-allowed');
                        });
                    }

                },1000);
            });
        });
    };

    const updateScore = ()=>{

        playerScoreDisplay.textContent = playerScore;
        computerScoreDisplay.textContent = computerScore;

        playerBar.style.width = (playerScore/maxRounds)*100+"%";
        computerBar.style.width = (computerScore/maxRounds)*100+"%";
    };

    const compareHands = (playerChoice,computerChoice)=>{

        if(playerChoice===computerChoice){

            winnerDisplay.textContent='It is a tie';
            addHistory(roundsPlayed+1,playerChoice,computerChoice,"Tie");
            return;
        }

        const wins = {rock:'scissors',paper:'rock',scissors:'paper'};

        if(wins[playerChoice]===computerChoice){

            winnerDisplay.textContent="Player Wins!";
            playerScore++;

            if(musicEnabled){
                scoreSound.play();
            }

            addHistory(roundsPlayed+1,playerChoice,computerChoice,"Player Win");

        }else{

            winnerDisplay.textContent="Computer Wins!";
            computerScore++;

            addHistory(roundsPlayed+1,playerChoice,computerChoice,"Computer Win");
        }

        updateScore();
    };

    const endGame = ()=>{

        let finalMessage='';

        if(playerScore > bestScore){

            bestScore = playerScore;
            localStorage.setItem("bestScore",bestScore);

            if(musicEnabled){
                highScoreSound.play();
            }

            finalMessage="New High Score! 🎉";

        }else if(playerScore > computerScore){
            finalMessage="You won the game! 🏆";
        }
        else if(computerScore > playerScore){
            finalMessage="Computer won the game 😢";
        }
        else{
            finalMessage="The game is a tie 🤝";
        }

        finalResultDisplay.textContent = finalMessage;

        match.appendChild(finalResultContainer);

        winnerDisplay.classList.add('hidden');
        document.querySelector('.options').classList.add('hidden');
    };

    const resetGame = ()=>{

        playerScore=0;
        computerScore=0;
        roundsPlayed=0;
        isClickable=true;
        isPaused=false;

        options.forEach(btn=>{
            btn.disabled=false;
            btn.classList.remove('opacity-50','cursor-not-allowed');
        });

        gameHistory.length=0;
        historyList.innerHTML="";

        playerBar.style.width="0%";
        computerBar.style.width="0%";

        updateScore();

        winnerDisplay.classList.remove('hidden');
        document.querySelector('.options').classList.remove('hidden');

        if(finalResultContainer.parentNode)
            finalResultContainer.parentNode.removeChild(finalResultContainer);

        playerHand.src=selectedImages.rock;
        computerHand.src=selectedImages.rock;
    };

    restartButton.addEventListener('click',resetGame);

    playMatch();
};

game();

const bgMusic = new Audio("./sounds/background-music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

const startSound = new Audio("./sounds/start.mp3");
const scoreSound = new Audio("./sounds/score.mp3");
const highScoreSound = new Audio("./sounds/highscore.mp3");

const musicToggle = document.getElementById("music-toggle");

let musicEnabled = localStorage.getItem("musicEnabled") !== "false";

if(musicEnabled){
    bgMusic.play().catch(()=>{});
    musicToggle.textContent="🔇 Music Off";
}else{
    musicToggle.textContent="🎵 Music On";
}

musicToggle.addEventListener("click",()=>{

    musicEnabled=!musicEnabled;

    if(musicEnabled){
        bgMusic.play();
        musicToggle.textContent="🔇 Music Off";
    }else{
        bgMusic.pause();
        musicToggle.textContent="🎵 Music On";
    }

    localStorage.setItem("musicEnabled",musicEnabled);
});

const themeToggle=document.getElementById("theme-toggle");

const savedTheme=localStorage.getItem("theme");

if(savedTheme){
    document.body.classList.add(savedTheme);
}else{
    document.body.classList.add("light-mode");
}

themeToggle.addEventListener("click",()=>{

    if(document.body.classList.contains("light-mode")){

        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
        themeToggle.textContent="☀️ Light Mode";
        localStorage.setItem("theme","dark-mode");

    }else{

        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
        themeToggle.textContent="🌙 Dark Mode";
        localStorage.setItem("theme","light-mode");
    }
});
