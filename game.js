class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
    this.isPaused = false;
    this.bootState = "hovering"; // 'hovering', 'stomping', 'retracting'
  }
  getRandomStompTime(min, max) {
    return Phaser.Math.Between(min, max);
  }
  setState(newState) {
    if (this.bootState !== newState) {
      console.log("State changed from", this.bootState, "to", newState);
      this.bootState = newState;
    }
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("frog", "assets/padde.png");
    this.load.image("boot", "assets/Foot.png");
  }

  create() {
    this.timer = 0;
    this.level = "Warmup";
    this.bootHoverHeight = -300; // Height at which the boot hovers
    this.bootHoverSpeed = 2; // Speed at which the boot hovers back and forth
    this.stompTime = 5000; // Time in milliseconds after which to trigger the stomp
    this.lastStompTime = 0; // Time since the last stomp
    this.bootRetractSpeed = 10;
    this.stompTime = this.getRandomStompTime(5000, 10000); // Time between stomps, random between 5 and 10 seconds

    this.add.image(400, 300, "background");

    // Create a static ground
    const ground = this.matter.add.rectangle(400, 590, 800, 20, {
      isStatic: true,
    });

    // Create side walls
    const wallThickness = 50; // Thickness of the walls
    const gameHeight = this.sys.game.config.height; // Height of the game area

    // Left wall
    this.matter.add.rectangle(
      -wallThickness / 2,
      gameHeight / 2,
      wallThickness,
      gameHeight,
      { isStatic: true }
    );

    // Right wall
    const gameWidth = this.sys.game.config.width; // Width of the game area
    this.matter.add.rectangle(
      gameWidth + wallThickness / 2,
      gameHeight / 2,
      wallThickness,
      gameHeight,
      { isStatic: true }
    );

    // Create frog sprite
    this.frog = this.matter.add.sprite(400, 200 * 0.85, "frog").setScale(0.2);
    this.frogHitboxSizePercent = { width: 94, height: 90 }; // Define hitbox size percent for frog
    this.createFrogBody();

    // Create boot sprite
    this.boot = this.matter.add
      .sprite(400, this.bootHoverHeight, "boot")
      .setScale(0.2);
    this.bootHitboxSizePercent = { width: 80, height: 101 }; // Define hitbox size percent for boot
    this.createBootBody();

    // Graphics for text background
    this.infoGraphics = this.add.graphics();
    this.infoGraphics.fillStyle(0x000000, 0.7); // Black with opacity
    this.infoGraphics.fillRect(5, 5, 190, 90); // Adjust size and position
    this.infoGraphics.lineStyle(1, 0xffffff, 1); // White thin line for border
    this.infoGraphics.strokeRect(5, 5, 190, 90); // Adjust size and position

    // Style for the info text
    const infoTextStyle = {
      font: "14px Courier",
      fill: "#FFFFFF", // White text color
    };

    // Level and Timer text
    this.levelText = this.add.text(
      10,
      10,
      "Level: " + this.level,
      infoTextStyle
    );
    this.timerText = this.add.text(
      10,
      30,
      "Time: " + this.timer,
      infoTextStyle
    );

    this.matter.world.on("collisionstart", (event) => {
      event.pairs.forEach((pair) => {
        if (
          (pair.bodyA === this.frog.body && pair.bodyB === this.boot.body) ||
          (pair.bodyA === this.boot.body && pair.bodyB === this.frog.body)
        ) {
          // Handle collision between frog and boot
          console.log("Frog and boot collided!");
        }
      });
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    // Create a Key object for the spacebar
    this.spacebar = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  createFrogBody() {
    // Wait for next tick to ensure sprite dimensions are available
    this.time.delayedCall(0, () => {
      const frogWidth =
        (this.frog.displayWidth * this.frogHitboxSizePercent.width) / 100;
      const frogHeight =
        (this.frog.displayHeight * this.frogHitboxSizePercent.height) / 100;

      const frogBody = Phaser.Physics.Matter.Matter.Bodies.rectangle(
        this.frog.x,
        this.frog.y,
        frogWidth,
        frogHeight,
        { chamfer: { radius: 10 } }
      );
      this.frog.setExistingBody(frogBody);
    });
  }

  createBootBody() {
    // Wait for next tick to ensure sprite dimensions are available
    this.time.delayedCall(0, () => {
      const bootWidth =
        (this.boot.displayWidth * this.bootHitboxSizePercent.width) / 100;
      const bootHeight =
        (this.boot.displayHeight * this.bootHitboxSizePercent.height) / 100;

      const bootBody = Phaser.Physics.Matter.Matter.Bodies.rectangle(
        this.boot.x,
        this.bootHoverHeight,
        bootWidth,
        bootHeight,
        { chamfer: { radius: 10 }, isStatic: false, inertia: Infinity }
      );
      this.boot.setExistingBody(bootBody);
      this.boot.y = -this.boot.displayHeight; // Set initial Y position above the screen
      this.bootState = "hovering"; // Set initial state to hovering
    });
  }

  drawMatterHitbox(gameObject, color) {
    if (!gameObject.body) return;

    const { vertices } = gameObject.body;
    this.hitboxGraphics.lineStyle(2, color, 1);
    this.hitboxGraphics.beginPath();
    this.hitboxGraphics.moveTo(vertices[0].x, vertices[0].y);

    for (let i = 1; i < vertices.length; i++) {
      this.hitboxGraphics.lineTo(vertices[i].x, vertices[i].y);
    }

    this.hitboxGraphics.closePath();
    this.hitboxGraphics.strokePath();
  }

  update(time, delta) {
    this.updateTimer(time);
    this.handlePlayerMovement();

    // Keep the frog upright and at a fixed y position
    this.frog.setAngle(0);
    this.frog.setPosition(this.frog.x, 600 * 0.85);

    // Check if it's time to start preparing to stomp
    if (
      time - this.lastStompTime > this.stompTime &&
      this.bootState === "hovering"
    ) {
      this.setState("preparingToStomp");
      this.lastStompTime = time;
      this.stompTime = this.getRandomStompTime(5000, 10000);
      console.log("Next stomp time set to:", this.stompTime);
    }

    if (!this.isPaused) {
      switch (this.bootState) {
        case "hovering":
          this.hoverBoot();
          break;
        case "preparingToStomp":
          this.prepareStomp(time);
          break;
        case "stomping":
          this.performStomp();
          break;
        case "retracting":
          this.retractBoot();
          break;
      }
    }

    // Toggle pause state with the spacebar
    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      this.isPaused = !this.isPaused;
    }
  }

  updateTimer(time) {
    if (Math.floor(time / 1000) > this.timer) {
      this.timer = Math.floor(time / 1000);
      this.timerText.setText("Time: " + this.timer);
      this.updateLevel();
    }
  }

  updateLevel() {
    if (this.timer < 20) {
      this.level = "Warmup";
      // Adjust boot behavior for Warmup level
      this.bootStompSpeed = 8;
      this.bootHoverSpeed = 2;
    } else if (this.timer < 60) {
      this.level = "Level 1";
      // Adjust boot behavior for Level 1
      this.bootStompSpeed = 10;
      this.bootHoverSpeed = 3;
    } else if (this.timer < 90) {
      this.level = "Level 2";
      // Adjust boot behavior for Level 2
      this.bootStompSpeed = 12;
      this.bootHoverSpeed = 4;
    }
    this.levelText.setText("Level: " + this.level);
  }

  handleBootMovement(time, delta) {
    if (this.isPaused) {
      return;
    }

    // Hover movement
    if (!this.bootPause && !this.retractingBoot) {
      this.hoverBoot();
    }

    // Check if it's time to stomp
    if (time - this.lastStompTime > this.stompTime && !this.retractingBoot) {
      this.performStomp();
    }

    // Retract the boot
    if (this.retractingBoot) {
      this.retractBoot();
    }
  }

  hoverBoot() {
    // Move the boot back and forth at the top
    this.boot.x += this.bootHoverSpeed;
    this.boot.y = this.bootHoverHeight; // Ensure the boot stays at the hover height

    // Define the boot's boundaries
    const leftBoundary = 0 + this.boot.displayWidth / 2;
    const rightBoundary = 800 - this.boot.displayWidth / 2; // sidewalls 0 / 800

    // Change direction if it reaches the sides
    if (this.boot.x < leftBoundary || this.boot.x > rightBoundary) {
      this.bootHoverSpeed *= -1;
    }
  }

  prepareStomp(time) {
    if (!this.preStompStartTime) {
      this.preStompStartTime = time;
      this.originalBootX = this.boot.x; // Store the original X position
      console.log("Entered Preparing to Stomp State");
    }

    // Vibration effect: Move boot slightly left and right
    let elapsed = time - this.preStompStartTime;
    this.boot.x = this.originalBootX + Math.sin(elapsed / 50) * 5;

    // After 1 seconds, transition to stomping
    if (elapsed > 1000) {
      this.bootState = "stomping";
      this.preStompStartTime = null; // Reset the start time for the next stomp
    }
  }

  performStomp() {
    this.bootStompSpeed = 10; // Adjust for faster stomping
    this.boot.setVelocityY(this.bootStompSpeed);

    if (this.boot.y + this.boot.displayHeight / 2 >= 550) {
      // Shake the camera when the boot hits the ground
      this.cameras.main.shake(250, 0.005); // Duration in ms, intensity of the shake

      // Delay the transition to retracting state
      this.time.delayedCall(200, () => {
        this.setState("retracting");
      });
    }
  }

  retractBoot() {
    this.boot.setVelocityY(-this.bootRetractSpeed);

    // Check if the boot has retracted to the hover height
    if (this.boot.y <= this.bootHoverHeight) {
      this.setState("hovering");
      this.boot.setPosition(this.boot.x, this.bootHoverHeight);
    }
  }

  resetStomp() {
    // Reset stomp variables
    this.retractingBoot = false;
    this.lastStompTime = this.time.now; // Reset the timer
    this.boot.setPosition(this.boot.x, this.bootHoverHeight); // Reset boot position
    this.currentBootSpeed = this.bootStompSpeed;
  }

  handlePlayerMovement() {
    if (!this.frog || !this.frog.body) return; // Ensure frog and its body are defined

    const forceMagnitude = 0.065; // Adjust the force magnitude as needed

    if (this.cursors.left.isDown) {
      Phaser.Physics.Matter.Matter.Body.applyForce(
        this.frog.body,
        this.frog.body.position,
        { x: -forceMagnitude, y: 0 }
      );
      this.frog.setScale(-0.2, 0.2);
    } else if (this.cursors.right.isDown) {
      Phaser.Physics.Matter.Matter.Body.applyForce(
        this.frog.body,
        this.frog.body.position,
        { x: forceMagnitude, y: 0 }
      );
      this.frog.setScale(0.2, 0.2);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "matter",
    matter: {
      debug: true, // Set to false to disable visual debugging
    },
  },
  scene: [MainScene],
};

const game = new Phaser.Game(config);
