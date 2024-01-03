// Global constants:
var timer = 0; // Timer to track survival time
var level = "Warmup"; // Current level
var levelText; // Text object for displaying the level
var timerText; // Text object for displaying the timer

var bootStompSpeed = 1; // Initial speed of the boot moving down
var bootRetractSpeed = 10; // Speed of the boot retracting up
var AccelerationRate = 0.15; // Rate at which the boot's speed increases
var currentBootSpeed = bootStompSpeed; // Current speed of the boot

var shakeDuration = 0;
var shakeIntensity = 5;

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var game = new Phaser.Game(config);

function preload() {
  this.load.image("background", "assets/background.png");
  this.load.image("frog", "assets/padde.png");
  this.load.image("boot", "assets/foot2.png");
}

function create() {
  // Constants

  this.bootPause = false; // Initialize the pause flag
  this.retractingBoot = false; // Flag to indicate if the boot is retracting

  // Image assets
  this.add.image(400, 300, "background");
  var bg = this.add.image(0, 0, "background").setOrigin(0, 0);
  bg.setScale(800 / bg.width, 600 / bg.height); // Scale background to screen

  this.frog = this.add.sprite(400, 600 * 0.8, "frog").setScale(0.2); // Set scale and position
  this.boot = this.add.sprite(400, 100, "boot").setScale(1.2); // Set scale

  // Backdrop for the text
  var graphics = this.add.graphics();
  graphics.fillStyle(0x000000, 0.7); // Black, with half opacity
  graphics.fillRect(0, 0, 200, 70); // Adjust size and position as needed

  // Load and add the "dangermeter" image
  this.load.image("dangermeter", "assets/dangermeter.png"); // Make sure the path is correct
  this.dangerMeterSprite = this.add.sprite(650, 50, "dangermeter"); // Adjust position as needed

  // Create text for the level and timer on top of the backdrop
  levelText = this.add.text(10, 10, "Level: " + level, {
    font: "20px Arial",
    fill: "#ffffff", // White text for contrast
  });
  timerText = this.add.text(10, 40, "Time: " + timer, {
    font: "20px Arial",
    fill: "#ffffff",
  });

  // Keyboard listener
  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  const stopHeight = 550; // Height at which the boot stops

  // Update timer every second
  if (Math.floor(this.time.now / 1000) > timer) {
    timer = Math.floor(this.time.now / 1000);
    timerText.setText("Time: " + timer);

    // Update level based on the timer
    if (timer < 20) {
      level = "Warmup";
    } else if (timer < 60) {
      level = "Level 1";
      // You can adjust bootStompSpeed, bootRetractSpeed, etc., here for each level
    } else if (timer < 90) {
      level = "Level 2";
      // Adjust game mechanics for level 2
    } // Add more levels as needed
    levelText.setText("Level: " + level);
  }

  // Boot's downward movement
  if (!this.bootPause && !this.retractingBoot) {
    this.boot.y += currentBootSpeed; // Move boot down
    currentBootSpeed += AccelerationRate; // Accelerate the boot
  }

  // Boot's upward movement (retracting)
  else if (this.retractingBoot) {
    this.boot.y -= bootRetractSpeed; // Move boot up
    // Check if boot is off the screen
    if (this.boot.y <= -this.boot.height / 2) {
      this.retractingBoot = false;
      this.boot.y = -this.boot.height / 2;
      // Randomize boot's x-coordinate and orientation
      this.boot.x = Math.random() * 800;
      this.boot.setScale(Math.random() < 0.5 ? -1.2 : 1.2, 1.2);

      currentBootSpeed = bootStompSpeed; // Reset the boot speed
    }
  }
  // Checking if the boot reaches the stop height
  if (
    this.boot.y + this.boot.height / 2 >= stopHeight &&
    !this.bootPause &&
    !this.retractingBoot
  ) {
    this.bootPause = true;
    // Trigger the shake effect
    shakeDuration = 20;
    // Pause for 1 second, then start retracting
    this.time.delayedCall(1000, () => {
      this.retractingBoot = true;
      this.bootPause = false;
      shakeDuration = 0; // Reset shake duration
    });
  }

  // Shake effect when the boot hits the ground
  if (shakeDuration > 0) {
    this.boot.x += (Math.random() - 0.5) * shakeIntensity;
    shakeDuration -= 1;
  }

  // Left/right keyboard movement
  if (this.cursors.left.isDown) {
    this.frog.x -= 5;
    this.frog.setScale(-0.2, 0.2); // Flip sprite horizontally when moving left
  } else if (this.cursors.right.isDown) {
    this.frog.x += 5;
    this.frog.setScale(0.2, 0.2); // Normal sprite when moving right
  }

  this.frog.y = 600 * 0.9; //keep the frog at the same position.
  this.frog.x = Phaser.Math.Clamp(this.frog.x, 0, 800); // collision at end of screen.
}
