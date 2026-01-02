#!/usr/bin/env node

/**
 * Trivia CLI Game
 * A command-line trivia game with timing and scoring features
 */

const readline = require('readline');
const fs = require('fs').promises;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Game state
const gameState = {
  currentQuestionIndex: 0,
  score: 0,
  totalTime: 0,
  gameActive: false,
  questions: [],
  timePerQuestion: 30, // seconds per question
  timerId: null
};

/**
 * Load questions from JSON file
 */
async function loadQuestions() {
  try {
    const data = await fs.readFile('./questions.json', 'utf8');
    gameState.questions = JSON.parse(data);
    return true;
  } catch (error) {
    console.error('Error loading questions:', error.message);
    console.log('Using default questions...');
    
    // Fallback questions in case file fails to load
    gameState.questions = [
      {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        answer: 1,
        category: "Math",
        points: 5
      },
      {
        question: "What color is the sky?",
        options: ["Red", "Green", "Blue", "Yellow"],
        answer: 2,
        category: "Science",
        points: 5
      }
    ];
    return false;
  }
}

/**
 * Display welcome message and instructions
 */
function displayWelcome() {
  console.clear();
  console.log('='.repeat(50));
  console.log('🎮  TRIVIA CLI GAME  🎮');
  console.log('='.repeat(50));
  console.log('\nInstructions:');
  console.log('- You will be presented with multiple choice questions');
  console.log(`- You have ${gameState.timePerQuestion} seconds per question`);
  console.log('- Enter the number of your answer (1-4)');
  console.log('- Type "quit" to exit the game');
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Start the trivia game
 */
async function startGame() {
  gameState.gameActive = true;
  gameState.currentQuestionIndex = 0;
  gameState.score = 0;
  gameState.totalTime = 0;
  
  console.log('\n🎯 Game starting... Get ready!\n');
  
  // Ask if user wants timed mode
  const useTimer = await askQuestion('Do you want to play with timer? (yes/no): ');
  if (useTimer.toLowerCase() === 'no') {
    gameState.timePerQuestion = 0; // Disable timer
  }
  
  await nextQuestion();
}

/**
 * Display current question with options
 */
function displayQuestion(questionObj, index) {
  console.log('\n' + '─'.repeat(50));
  console.log(`📝 Question ${index + 1} of ${gameState.questions.length}`);
  console.log(`📂 Category: ${questionObj.category}`);
  console.log(`⭐ Points: ${questionObj.points}`);
  console.log('─'.repeat(50));
  console.log(`\n${questionObj.question}\n`);
  
  // Display options using array iteration method (map)
  questionObj.options.map((option, i) => {
    console.log(`${i + 1}. ${option}`);
  });
  
  if (gameState.timePerQuestion > 0) {
    console.log(`\n⏰ Time remaining: ${gameState.timePerQuestion} seconds`);
  }
  console.log('\n' + '─'.repeat(50));
}

/**
 * Start timer for current question
 */
function startTimer(callback) {
  if (gameState.timePerQuestion <= 0) return null;
  
  let timeLeft = gameState.timePerQuestion;
  
  return setInterval(() => {
    timeLeft--;
    
    // Clear current line and update timer display
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    process.stdout.write(`⏰ Time remaining: ${timeLeft} seconds`);
    
    if (timeLeft <= 0) {
      callback('timeout');
    }
  }, 1000);
}

/**
 * Ask a question and get user input
 */
async function askQuestion(promptText) {
  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Process user's answer
 */
function processAnswer(questionObj, userAnswer, answerTime) {
  const correctIndex = questionObj.answer;
  const userIndex = parseInt(userAnswer) - 1;
  
  if (isNaN(userIndex) || userIndex < 0 || userIndex >= questionObj.options.length) {
    console.log('\n❌ Invalid answer! Please enter a number between 1 and 4.\n');
    return false;
  }
  
  if (userIndex === correctIndex) {
    // Calculate score with time bonus if applicable
    let pointsEarned = questionObj.points;
    if (gameState.timePerQuestion > 0 && answerTime < gameState.timePerQuestion / 2) {
      pointsEarned += Math.floor(questionObj.points * 0.5); // 50% time bonus
      console.log(`\n✅ Correct! 🎉 +${pointsEarned} points (with time bonus!)`);
    } else {
      console.log(`\n✅ Correct! 🎉 +${pointsObj.points} points`);
    }
    
    gameState.score += pointsEarned;
    return true;
  } else {
    console.log(`\n❌ Incorrect! The correct answer was: ${correctIndex + 1}. ${questionObj.options[correctIndex]}`);
    return false;
  }
}

/**
 * Move to next question or end game
 */
async function nextQuestion() {
  if (!gameState.gameActive || gameState.currentQuestionIndex >= gameState.questions.length) {
    endGame();
    return;
  }
  
  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  displayQuestion(currentQuestion, gameState.currentQuestionIndex);
  
  // Start timer if enabled
  if (gameState.timePerQuestion > 0) {
    clearInterval(gameState.timerId);
    let answered = false;
    
    gameState.timerId = startTimer((reason) => {
      if (reason === 'timeout' && !answered) {
        answered = true;
        console.log('\n\n⏰ Time\'s up!');
        console.log(`The correct answer was: ${currentQuestion.answer + 1}. ${currentQuestion.options[currentQuestion.answer]}`);
        setTimeout(() => {
          gameState.currentQuestionIndex++;
          nextQuestion();
        }, 2000);
      }
    });
  }
  
  // Get user answer
  const startTime = Date.now();
  const userAnswer = await askQuestion('\nYour answer (1-4) or "skip": ');
  const answerTime = Math.floor((Date.now() - startTime) / 1000);
  
  // Clear timer
  if (gameState.timePerQuestion > 0) {
    clearInterval(gameState.timerId);
    console.log(); // New line after timer
  }
  
  // Handle user input
  if (userAnswer.toLowerCase() === 'quit') {
    endGame();
    return;
  }
  
  if (userAnswer.toLowerCase() === 'skip') {
    console.log('\n⏭️ Question skipped!');
    gameState.currentQuestionIndex++;
    setTimeout(() => nextQuestion(), 1500);
    return;
  }
  
  // Process answer
  const isCorrect = processAnswer(currentQuestion, userAnswer, answerTime);
  
  // Update game state
  gameState.currentQuestionIndex++;
  gameState.totalTime += answerTime;
  
  // Small delay before next question
  setTimeout(() => nextQuestion(), 2000);
}

/**
 * Calculate final grade based on score
 */
function calculateGrade(score, totalPossible) {
  const percentage = (score / totalPossible) * 100;
  
  if (percentage >= 90) return 'A+ 🏆';
  if (percentage >= 80) return 'A 🎯';
  if (percentage >= 70) return 'B 👍';
  if (percentage >= 60) return 'C 📊';
  if (percentage >= 50) return 'D 😅';
  return 'F 😢';
}

/**
 * End the game and display results
 */
function endGame() {
  gameState.gameActive = false;
  
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 GAME OVER');
  console.log('='.repeat(50));
  
  const totalQuestions = gameState.questions.length;
  const questionsAnswered = gameState.currentQuestionIndex;
  const correctAnswers = Math.floor(gameState.score / 10); // Assuming average 10 points per question
  const totalPossiblePoints = gameState.questions.reduce((total, q) => total + q.points, 0);
  
  // Using array methods for statistics
  const categoryStats = gameState.questions
    .filter((q, i) => i < questionsAnswered)
    .reduce((stats, q) => {
      if (!stats[q.category]) stats[q.category] = { questions: 0, points: 0 };
      stats[q.category].questions++;
      stats[q.category].points += q.points;
      return stats;
    }, {});
  
  console.log('\n📊 FINAL SCORE');
  console.log('─'.repeat(30));
  console.log(`Questions answered: ${questionsAnswered}/${totalQuestions}`);
  console.log(`Total Score: ${gameState.score} points`);
  console.log(`Time taken: ${gameState.totalTime} seconds`);
  console.log(`Average time per question: ${questionsAnswered > 0 ? (gameState.totalTime / questionsAnswered).toFixed(1) : 0} seconds`);
  console.log(`Grade: ${calculateGrade(gameState.score, totalPossiblePoints)}`);
  
  // Display performance feedback using array iteration
  console.log('\n📈 PERFORMANCE BREAKDOWN');
  console.log('─'.repeat(30));
  Object.entries(categoryStats).forEach(([category, stats]) => {
    console.log(`${category}: ${stats.questions} questions, ${stats.points} possible points`);
  });
  
  // Provide feedback based on score
  console.log('\n💬 FINAL FEEDBACK');
  console.log('─'.repeat(30));
  const percentage = (gameState.score / totalPossiblePoints) * 100;
  
  if (percentage >= 80) {
    console.log('Outstanding! You\'re a trivia master! 🌟');
  } else if (percentage >= 60) {
    console.log('Great job! You know your stuff! 👍');
  } else if (percentage >= 40) {
    console.log('Good effort! Keep practicing! 📚');
  } else {
    console.log('Keep learning! Every expert was once a beginner! 💪');
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Ask to play again
  rl.question('\nPlay again? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      console.clear();
      main();
    } else {
      console.log('\nThanks for playing! Goodbye! 👋\n');
      rl.close();
    }
  });
}

/**
 * Display menu options
 */
async function showMenu() {
  console.log('\n📋 MAIN MENU');
  console.log('─'.repeat(20));
  console.log('1. Start New Game');
  console.log('2. View Game Rules');
  console.log('3. Exit');
  
  const choice = await askQuestion('\nSelect an option (1-3): ');
  
  switch (choice) {
    case '1':
      await startGame();
      break;
    case '2':
      displayRules();
      await showMenu();
      break;
    case '3':
      console.log('\nGoodbye! 👋\n');
      rl.close();
      break;
    default:
      console.log('\n❌ Invalid option. Please try again.\n');
      await showMenu();
  }
}

/**
 * Display game rules
 */
function displayRules() {
  console.log('\n📖 GAME RULES');
  console.log('─'.repeat(30));
  console.log('1. Answer multiple choice questions (1-4)');
  console.log('2. You can enable/disable timer at start');
  console.log('3. Points are awarded for correct answers');
  console.log('4. Time bonus for quick answers (if timer enabled)');
  console.log('5. Type "skip" to skip a question');
  console.log('6. Type "quit" to exit the game');
  console.log('7. Your final score and grade will be displayed');
  console.log('─'.repeat(30) + '\n');
}

/**
 * Main function
 */
async function main() {
  try {
    displayWelcome();
    await loadQuestions();
    
    // Demonstrate array iteration method
    console.log('📚 Quiz Summary:');
    console.log('─'.repeat(30));
    gameState.questions.forEach((q, i) => {
      console.log(`${i + 1}. ${q.category}: ${q.question.substring(0, 30)}...`);
    });
    console.log('─'.repeat(30));
    
    await showMenu();
  } catch (error) {
    console.error('An error occurred:', error);
    rl.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Thanks for playing! Goodbye!\n');
  if (gameState.timerId) clearInterval(gameState.timerId);
  rl.close();
  process.exit(0);
});

// Start the application
main();