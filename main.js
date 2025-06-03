    // DOM Elements
    const upload = document.getElementById("upload");
    const uploadLabel = document.getElementById("upload-label");
    const game = document.getElementById("game");
    const slots = document.getElementById("slots");
    const fullImageContainer = document.getElementById("full-image-container");
    const fullImage = document.getElementById("full-image");
    const scoreDisplay = document.getElementById("score");
    const timerDisplay = document.getElementById("timer");
    const movesDisplay = document.getElementById("moves");
    const restartBtn = document.getElementById("restart-btn");
    const hintBtn = document.getElementById("hint-btn");
    const gameOverScreen = document.getElementById("game-over");
    const finalScore = document.getElementById("final-score");
    const finalTime = document.getElementById("final-time");
    const finalMoves = document.getElementById("final-moves");
    const playAgainBtn = document.getElementById("play-again-btn");
    
    // Audio elements
    const flipSound = document.getElementById("flip-sound");
    const successSound = document.getElementById("success-sound");
    const failSound = document.getElementById("fail-sound");
    const completeSound = document.getElementById("complete-sound");
    
    // Game state
    let tiles = [];
    let originalOrder = [];
    let imageSlices = [];
    let currentFlipped = null;
    let isLocked = false;
    let originalImageSrc = null;
    let score = 0;
    let seconds = 0;
    let timerInterval = null;
    let moves = 0;
    let hintsRemaining = 3;
    let completedSlots = 0;
    
    // Initialize slots
    function initializeSlots() {
      slots.innerHTML = "";
      for (let i = 0; i < 25; i++) {
        const slot = document.createElement("div");
        slot.className = "slot";
        slot.dataset.index = i;
        const number = document.createElement("div");
        number.className = "number";
        number.textContent = i + 1;
        slot.appendChild(number);
        slots.appendChild(slot);
      }
    }
    
    // Start timer
    function startTimer() {
      if (timerInterval) clearInterval(timerInterval);
      seconds = 0;
      updateTimerDisplay();
      timerInterval = setInterval(() => {
        seconds++;
        updateTimerDisplay();
      }, 1000);
    }
    
    // Update timer display
    function updateTimerDisplay() {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Update moves display
    function updateMovesDisplay() {
      movesDisplay.textContent = moves;
    }
    
    // Update score display
    function updateScoreDisplay() {
      scoreDisplay.textContent = score;
    }
    
    // Update hint button
    function updateHintButton() {
      hintBtn.textContent = `Hint (${hintsRemaining})`;
      hintBtn.disabled = hintsRemaining <= 0 || currentFlipped === null;
    }
    
    // Initialize game
    initializeSlots();
    
    // Event listeners
    upload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      uploadLabel.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;
      
      const img = new Image();
      img.onload = () => {
        setupGame(img);
        uploadLabel.innerHTML = `<i class="fas fa-check"></i> Image Loaded!`;
        setTimeout(() => {
          uploadLabel.innerHTML = `<i class="fas fa-image"></i> Change Image`;
        }, 2000);
      };
      img.onerror = () => {
        uploadLabel.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error Loading`;
        setTimeout(() => {
          uploadLabel.innerHTML = `<i class="fas fa-image"></i> Choose an Image`;
        }, 2000);
      };
      img.src = URL.createObjectURL(file);
      originalImageSrc = img.src;
    });
    
    restartBtn.addEventListener("click", () => {
      if (originalImageSrc) {
        const img = new Image();
        img.onload = () => setupGame(img);
        img.src = originalImageSrc;
        resetGame();
      }
    });
    
    playAgainBtn.addEventListener("click", () => {
      if (originalImageSrc) {
        const img = new Image();
        img.onload = () => setupGame(img);
        img.src = originalImageSrc;
        resetGame();
      }
      gameOverScreen.classList.remove("visible");
    });
    
    hintBtn.addEventListener("click", () => {
      if (hintsRemaining > 0 && currentFlipped) {
        const correctIndex = parseInt(currentFlipped.dataset.correctIndex);
        const correctSlot = document.querySelector(`.slot[data-index="${correctIndex}"]`);
        
        // Highlight the correct slot
        correctSlot.classList.add("highlight");
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
          correctSlot.classList.remove("highlight");
        }, 2000);
        
        hintsRemaining--;
        updateHintButton();
      }
    });
    
    // Reset game state
    function resetGame() {
      score = 0;
      moves = 0;
      seconds = 0;
      hintsRemaining = 3;
      completedSlots = 0;
      updateScoreDisplay();
      updateMovesDisplay();
      updateHintButton();
      startTimer();
    }
    
    // Setup game with image
    function setupGame(img) {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, size, size);
      
      // Create image preview
      fullImage.src = img.src;
      
      const pieceSize = size / 5;
      imageSlices = [];
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const slice = ctx.getImageData(x * pieceSize, y * pieceSize, pieceSize, pieceSize);
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = pieceSize;
          tempCanvas.height = pieceSize;
          tempCanvas.getContext("2d").putImageData(slice, 0, 0);
          imageSlices.push(tempCanvas.toDataURL());
        }
      }
      
      startGame(imageSlices);
      resetGame();
    }
    
    // Start the game with image slices
    function startGame(images) {
      tiles = [];
      originalOrder = [...Array(25).keys()];
      const shuffledPositions = [...originalOrder].sort(() => Math.random() - 0.5);
      const randomNumbers = [...originalOrder].sort(() => Math.random() - 0.5);
      
      game.innerHTML = "";
      slots.querySelectorAll(".slot img")?.forEach(el => el.remove());
      
      for (let i = 0; i < 25; i++) {
        const index = shuffledPositions[i];
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.dataset.correctIndex = index;
        const inner = document.createElement("div");
        inner.className = "inner";
        
        const front = document.createElement("div");
        front.className = "front";
        front.textContent = randomNumbers[i] + 1;
        
        const back = document.createElement("div");
        back.className = "back";
        const img = document.createElement("img");
        img.src = images[index];
        back.appendChild(img);
        
        inner.appendChild(front);
        inner.appendChild(back);
        tile.appendChild(inner);
        game.appendChild(tile);
        tile.addEventListener("click", () => handleTileClick(tile));
        tiles.push(tile);
      }
    }
    
    // Show full image preview
    function showFullImage() {
      fullImageContainer.classList.add("visible");
      setTimeout(() => {
        fullImageContainer.classList.remove("visible");
      }, 1000);
    }
    
    // Handle tile click
    function handleTileClick(tile) {
      if (tile.classList.contains("flipped") || isLocked || tile.dataset.locked === "true" || currentFlipped !== null) return;
      
      // Play sound and show preview
      flipSound.currentTime = 0;
      flipSound.play();
      showFullImage();
      
      // Flip the tile
      tile.classList.add("flipped");
      currentFlipped = tile;
      isLocked = true;
      
      const correctIndex = parseInt(tile.dataset.correctIndex);
      
      // Handle slot click
      const slotClick = (e) => {
        moves++;
        updateMovesDisplay();
        
        const slotIndex = parseInt(e.currentTarget.dataset.index);
        if (slotIndex === correctIndex) {
          // Correct placement
          const img = currentFlipped.querySelector(".back img").cloneNode();
          const slot = slots.querySelector(`.slot[data-index='${slotIndex}']`);
          slot.innerHTML = "";
          slot.appendChild(img);
          currentFlipped.dataset.locked = "true";
          currentFlipped.removeEventListener("click", handleTileClick);
          currentFlipped = null;
          isLocked = false;
          
          // Update score (faster placements get more points)
          const timeBonus = Math.max(10 - Math.floor(seconds / 10), 1);
          score += 10 * timeBonus;
          updateScoreDisplay();
          
          // Play success sound
          successSound.currentTime = 0;
          successSound.play();
          
          // Check if puzzle is complete
          completedSlots++;
          if (completedSlots === 25) {
            completePuzzle();
          }
        } else {
          // Incorrect placement
          failSound.currentTime = 0;
          failSound.play();
          
          // Shake animation for incorrect placement
          document.querySelectorAll(".tile, .slot").forEach(el => {
            el.style.animation = "shake 0.5s";
            setTimeout(() => {
              el.style.animation = "";
            }, 500);
          });
          
          // Reset after delay
          setTimeout(() => {
            tiles.forEach(t => {
              t.classList.remove("flipped");
              t.dataset.locked = "false";
              t.removeEventListener("click", handleTileClick);
              t.addEventListener("click", () => handleTileClick(t));
            });
            slots.querySelectorAll(".slot img")?.forEach(el => el.remove());
            score = Math.max(0, score - 5); // Penalty for wrong placement
            updateScoreDisplay();
            isLocked = false;
            currentFlipped = null;
            completedSlots = 0; // Reset completed slots count
          }, 700);
        }
        
        // Remove slot click listeners
        slots.querySelectorAll(".slot").forEach(s => s.removeEventListener("click", slotClick));
      };
      
      // Add click listeners to all slots
      slots.querySelectorAll(".slot").forEach(s => s.addEventListener("click", slotClick));
    }
    
    // Complete the puzzle
    function completePuzzle() {
      clearInterval(timerInterval);
      
      // Update final stats
      finalScore.textContent = score;
      finalTime.textContent = timerDisplay.textContent;
      finalMoves.textContent = moves;
      
      // Play completion sound
      completeSound.currentTime = 0;
      completeSound.play();
      
      // Show confetti
      createConfetti();
      
      // Show game over screen
      setTimeout(() => {
        gameOverScreen.classList.add("visible");
      }, 1000);
    }
    
    // Create confetti effect
    function createConfetti() {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
      
      for (let i = 0; i < 100; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = -10 + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(confetti);
        
        const animationDuration = Math.random() * 3 + 2;
        
        confetti.animate([
          { top: '-10px', opacity: 1 },
          { top: '100vh', opacity: 0 }
        ], {
          duration: animationDuration * 1000,
          easing: 'cubic-bezier(0.1, 0.8, 0.9, 1)'
        });
        
        setTimeout(() => {
          confetti.remove();
        }, animationDuration * 1000);
      }
    }
    
    // Add shake animation to CSS
    const style = document.createElement("style");
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);