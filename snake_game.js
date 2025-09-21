class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameStatusElement = document.getElementById('gameStatus');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Game settings - make bigger, fewer squares
        this.tileCount = 12; // Fewer squares for bigger size
        this.gridSize = Math.floor(this.canvas.width / this.tileCount);
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.fruitEaten = false; // Prevent double scoring
        
        // Snake
        this.snake = [
            {x: Math.floor(this.tileCount / 2), y: Math.floor(this.tileCount / 2)}
        ];
        this.dx = 0;
        this.dy = 0;
        
        // Fruit
        this.fruit = this.generateFruit();
        this.fruitTypes = ['🍎', '🍊', '🍇', '🍓', '🍌', '🍒'];
        this.currentFruit = this.fruitTypes[0];
        
        // Game loop
        this.gameSpeed = 120; // Slower for easier gameplay
        this.animationId = null;
        this.lastTime = 0;
        this.accumulator = 0;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.updateHighScoreDisplay();
        this.setupEventListeners();
        this.draw();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.code === 'Space') {
                this.startGame();
                return;
            }
            
            if (e.code === 'Space') {
                this.togglePause();
                return;
            }
            
            if (this.gamePaused) return;
            
            switch(e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    if (this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
            }
        });
        
        // Restart button
        this.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            this.gameStatusElement.textContent = 'Game Running - Use arrow keys or WASD';
            this.lastTime = performance.now();
            this.accumulator = 0;
            
            const gameLoop = (currentTime) => {
                if (!this.gameRunning) return;
                
                const deltaTime = currentTime - this.lastTime;
                this.lastTime = currentTime;
                this.accumulator += deltaTime;
                
                // Update game logic at fixed intervals for consistency
                while (this.accumulator >= this.gameSpeed) {
                    this.update();
                    this.accumulator -= this.gameSpeed;
                }
                
                // Draw every frame for smooth visuals
                this.draw();
                
                // Continue the loop
                this.animationId = requestAnimationFrame(gameLoop);
            };
            
            this.animationId = requestAnimationFrame(gameLoop);
        }
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            this.gameStatusElement.textContent = this.gamePaused ? 'Game Paused - Press SPACE to resume' : 'Game Running - Use arrow keys or WASD';
        }
    }
    
    update() {
        if (this.gamePaused) return;
        
        // Move snake head with wrapping
        let headX = this.snake[0].x + this.dx;
        let headY = this.snake[0].y + this.dy;
        
        // Wrap around screen edges
        if (headX < 0) headX = this.tileCount - 1;
        if (headX >= this.tileCount) headX = 0;
        if (headY < 0) headY = this.tileCount - 1;
        if (headY >= this.tileCount) headY = 0;
        
        const head = {x: headX, y: headY};
        
        // Check self collision - only check body segments, not head
        if (this.snake.some((segment, index) => index > 0 && segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check fruit collision with better precision
        const headGridX = Math.floor(head.x);
        const headGridY = Math.floor(head.y);
        if (headGridX === this.fruit.x && headGridY === this.fruit.y && !this.fruitEaten) {
            this.fruitEaten = true; // Prevent double scoring
            this.eatFruit();
        } else {
            this.snake.pop();
        }
        
        // Reset fruit eaten flag each frame to allow next fruit
        if (this.fruitEaten) {
            this.fruitEaten = false;
        }
    }
    
    eatFruit() {
        this.score += 10; // Always exactly 10 points
        this.updateScore();
        this.fruit = this.generateFruit();
        this.currentFruit = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
        
        // Increase game speed slightly
        if (this.gameSpeed > 80) {
            this.gameSpeed -= 2;
        }
        
        // Add visual effect
        this.scoreElement.classList.add('score-update');
        setTimeout(() => {
            this.scoreElement.classList.remove('score-update');
        }, 500);
    }
    
    generateFruit() {
        let newFruit;
        do {
            newFruit = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFruit.x && segment.y === newFruit.y));
        
        return newFruit;
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScoreDisplay();
            localStorage.setItem('snakeHighScore', this.highScore);
        }
    }
    
    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.gamePaused = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
        this.gameStatusElement.textContent = 'Game Over - Click "Play Again" to restart';
    }
    
    restartGame() {
        // Reset game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.gameSpeed = 120;
        this.fruitEaten = false;
        
        // Reset snake
        this.snake = [{x: Math.floor(this.tileCount / 2), y: Math.floor(this.tileCount / 2)}];
        this.dx = 0;
        this.dy = 0;
        
        // Reset fruit
        this.fruit = this.generateFruit();
        this.currentFruit = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
        
        // Reset UI
        this.gameOverElement.style.display = 'none';
        this.scoreElement.textContent = '0';
        this.gameStatusElement.textContent = 'Press SPACE to start';
        
        // Clear any existing game loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.draw();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (subtle)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw connected snake with smooth body
        this.ctx.save();
        
        // Draw snake body as connected segments
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const interpolationFactor = this.accumulator / this.gameSpeed;
            let x = segment.x * this.gridSize;
            let y = segment.y * this.gridSize;
            
            // Add smooth interpolation for the head
            if (i === 0 && (this.dx !== 0 || this.dy !== 0)) {
                x += this.dx * this.gridSize * interpolationFactor;
                y += this.dy * this.gridSize * interpolationFactor;
            }
            
            const centerX = x + this.gridSize / 2;
            const centerY = y + this.gridSize / 2;
            const radius = this.gridSize / 2 - 1;
            
            if (i === 0) {
                // Snake head - keep the same detailed design
                // Enhanced Snake head with realistic features
                
                // Head shadow for depth
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(centerX + 2, centerY + 2, radius, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Main head gradient
                const headGradient = this.ctx.createRadialGradient(
                    centerX - 4, centerY - 4, 0,
                    centerX, centerY, radius
                );
                headGradient.addColorStop(0, '#7fb069');
                headGradient.addColorStop(0.4, '#5d8a3d');
                headGradient.addColorStop(0.8, '#3d5a2a');
                headGradient.addColorStop(1, '#2d421f');
                
                this.ctx.fillStyle = headGradient;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Head highlight
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(centerX - 3, centerY - 3, radius * 0.6, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Head outline with thickness
                this.ctx.strokeStyle = '#1e3a0f';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                // Enhanced eyes that stay visible while moving
                const eyeRadius = radius * 0.2; // Slightly larger for better visibility
                const eyeOffsetX = radius * 0.35;
                const eyeOffsetY = -radius * 0.25;
                
                // Eye sockets with stronger contrast
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(centerX - eyeOffsetX, centerY + eyeOffsetY, eyeRadius + 2, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, eyeRadius + 2, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // White part of eyes - brighter and more visible
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(centerX - eyeOffsetX, centerY + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Eye pupils - larger and more prominent
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(centerX - eyeOffsetX, centerY + eyeOffsetY, eyeRadius * 0.7, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, eyeRadius * 0.7, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Eye shine - more visible
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(centerX - eyeOffsetX - 1, centerY + eyeOffsetY - 1, eyeRadius * 0.3, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(centerX + eyeOffsetX - 1, centerY + eyeOffsetY - 1, eyeRadius * 0.3, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Add eye outline for better definition
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(centerX - eyeOffsetX, centerY + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                // Nostrils
                this.ctx.fillStyle = '#1e3a0f';
                this.ctx.beginPath();
                this.ctx.arc(centerX - 2, centerY + radius * 0.2, 1.5, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(centerX + 2, centerY + radius * 0.2, 1.5, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Animated tongue
                const tongueLength = radius * 0.8;
                const tongueOffset = radius * 0.4;
                const tongueAnimation = Math.sin(Date.now() * 0.01) * 0.3;
                
                let tongueX1 = centerX;
                let tongueY1 = centerY + tongueOffset;
                let tongueX2 = centerX;
                let tongueY2 = centerY + tongueOffset + tongueLength;
                
                if (this.dx > 0) { // Moving right
                    tongueX1 = centerX + tongueOffset;
                    tongueY1 = centerY;
                    tongueX2 = centerX + tongueOffset + tongueLength;
                    tongueY2 = centerY + tongueAnimation;
                } else if (this.dx < 0) { // Moving left
                    tongueX1 = centerX - tongueOffset;
                    tongueY1 = centerY;
                    tongueX2 = centerX - tongueOffset - tongueLength;
                    tongueY2 = centerY + tongueAnimation;
                } else if (this.dy < 0) { // Moving up
                    tongueX1 = centerX + tongueAnimation;
                    tongueY1 = centerY - tongueOffset;
                    tongueX2 = centerX + tongueAnimation;
                    tongueY2 = centerY - tongueOffset - tongueLength;
                } else if (this.dy > 0) { // Moving down
                    tongueX1 = centerX + tongueAnimation;
                    tongueY1 = centerY + tongueOffset;
                    tongueX2 = centerX + tongueAnimation;
                    tongueY2 = centerY + tongueOffset + tongueLength;
                }
                
                // Tongue with gradient
                const tongueGradient = this.ctx.createLinearGradient(tongueX1, tongueY1, tongueX2, tongueY2);
                tongueGradient.addColorStop(0, '#ff4757');
                tongueGradient.addColorStop(1, '#c44569');
                
                this.ctx.strokeStyle = tongueGradient;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(tongueX1, tongueY1);
                this.ctx.lineTo(tongueX2, tongueY2);
                this.ctx.stroke();
                
                // Tongue fork with animation
                this.ctx.beginPath();
                this.ctx.moveTo(tongueX2, tongueY2);
                this.ctx.lineTo(tongueX2 - 3, tongueY2 + 4);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(tongueX2, tongueY2);
                this.ctx.lineTo(tongueX2 + 3, tongueY2 + 4);
                this.ctx.stroke();
                
            } else {
                // Connected body segments
                let bodyX = segment.x * this.gridSize;
                let bodyY = segment.y * this.gridSize;
                
                // Add smooth interpolation for body segments
                if (i > 0 && (this.dx !== 0 || this.dy !== 0)) {
                    const bodyInterpolation = interpolationFactor * 0.2;
                    bodyX += this.dx * this.gridSize * bodyInterpolation;
                    bodyY += this.dy * this.gridSize * bodyInterpolation;
                }
                
                const bodyCenterX = bodyX + this.gridSize / 2;
                const bodyCenterY = bodyY + this.gridSize / 2;
                const bodyRadius = radius - 1;
                
                // Draw connecting line to previous segment with smooth interpolation
                if (i > 0) {
                    const prevSegment = this.snake[i - 1];
                    let prevX = prevSegment.x * this.gridSize + this.gridSize / 2;
                    let prevY = prevSegment.y * this.gridSize + this.gridSize / 2;
                    
                    // Add smooth interpolation to previous segment too
                    if (i === 1 && (this.dx !== 0 || this.dy !== 0)) {
                        prevX += this.dx * this.gridSize * interpolationFactor;
                        prevY += this.dy * this.gridSize * interpolationFactor;
                    } else if (i > 1 && (this.dx !== 0 || this.dy !== 0)) {
                        const prevInterpolation = interpolationFactor * 0.1;
                        prevX += this.dx * this.gridSize * prevInterpolation;
                        prevY += this.dy * this.gridSize * prevInterpolation;
                    }
                    
                    // Only draw connection if segments are truly adjacent (not wrapping around screen)
                    const dx = Math.abs(segment.x - prevSegment.x);
                    const dy = Math.abs(segment.y - prevSegment.y);
                    
                    // Check for true adjacency (only 1 grid space apart)
                    const isTrulyAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
                    
                    if (isTrulyAdjacent) {
                        this.ctx.strokeStyle = '#4a7c3a';
                        this.ctx.lineWidth = this.gridSize - 2;
                        this.ctx.lineCap = 'round';
                        this.ctx.beginPath();
                        this.ctx.moveTo(prevX, prevY);
                        this.ctx.lineTo(bodyCenterX, bodyCenterY);
                        this.ctx.stroke();
                    }
                }
                
                // Draw body segment
                const bodyGradient = this.ctx.createRadialGradient(
                    bodyCenterX - 2, bodyCenterY - 2, 0,
                    bodyCenterX, bodyCenterY, bodyRadius
                );
                bodyGradient.addColorStop(0, '#7bc96f');
                bodyGradient.addColorStop(0.6, '#5a9c4e');
                bodyGradient.addColorStop(1, '#3d6b33');
                
                this.ctx.fillStyle = bodyGradient;
                this.ctx.beginPath();
                this.ctx.arc(bodyCenterX, bodyCenterY, bodyRadius, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Body highlight
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.beginPath();
                this.ctx.arc(bodyCenterX - 2, bodyCenterY - 2, bodyRadius * 0.6, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Body outline
                this.ctx.strokeStyle = '#2d4a1f';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(bodyCenterX, bodyCenterY, bodyRadius, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
        
        // Simple working emoji fruit rendering with glow
        const fruitX = this.fruit.x * this.gridSize + this.gridSize / 2;
        const fruitY = this.fruit.y * this.gridSize + this.gridSize / 2;
        const fruitSize = this.gridSize - 6;
        
        this.ctx.save();
        
        // Set up emoji properties
        this.ctx.font = `${fruitSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Apply multiple glow layers for brightness
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 25;
        this.ctx.fillText(this.currentFruit, fruitX, fruitY);
        
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(this.currentFruit, fruitX, fruitY);
        
        this.ctx.shadowColor = '#ff8800';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText(this.currentFruit, fruitX, fruitY);
        
        // Final clean emoji without shadows
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
        this.ctx.fillText(this.currentFruit, fruitX, fruitY);
        
        this.ctx.restore();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});