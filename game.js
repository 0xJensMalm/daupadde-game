class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
    // Hitbox sizes
    this.bootHitboxSizePercent = { width: 80, height: 101 };
    this.frogHitboxSizePercent = { width: 94, height: 90 };
    this.showHitboxes = true; // Toggle hitboxes
    this.isPaused = false; // Toggle pause
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("frog", "assets/padde.png");
    this.load.image("boot", "assets/stFoot.png");
    this.load.image("toggleOn", "assets/onSwitch.png");
    this.load.image("toggleOff", "assets/offSwitch.png");
  }

  create() {
    this.timer = 0;
    this.level = "Warmup";
    this.bootStompSpeed = 1;
    this.bootRetractSpeed = 10;
    this.accelerationRate = 0.15;
    this.currentBootSpeed = this.bootStompSpeed;
    this.bootPause = false;
    this.retractingBoot = false;

    this.add.image(400, 300, "background");
    this.frog = this.add.sprite(400, 600 * 0.85, "frog").setScale(0.2);

    // Boot sprite setup
    this.boot = this.add.sprite(400, 100, "boot").setScale(0.2);
    this.physics.add.existing(this.boot);
    this.bootHitboxWidth = (601 * this.bootHitboxSizePercent.width) / 100;
    this.bootHitboxHeight = (2333 * this.bootHitboxSizePercent.height) / 100;
    this.boot.body.setSize(this.bootHitboxWidth, this.bootHitboxHeight);

    // Enable physics for the boot and create a smaller active area for collision
    this.physics.add.existing(this.boot);
    this.physics.add.existing(this.frog);

    // Adjust the width and height to fit the active collision area of the boot
    this.boot.body.setSize(100, 300); // Example values, adjust as needed
    this.boot.body.setOffset(250, 2000); // Adjust the offset as needed

    // Hitboxes
    this.setupHitboxes();
    this.hitboxGraphics = this.add.graphics(); //hitbox toggles
    this.showHitboxes = true; // Default value

    // Graphics for text background
    this.infoGraphics = this.add.graphics();
    this.infoGraphics.fillStyle(0x000000, 0.7); // Black with opacity
    this.infoGraphics.fillRect(5, 5, 190, 90); // Adjust size and position as needed
    this.infoGraphics.lineStyle(1, 0xffffff, 1); // White thin line for border
    this.infoGraphics.strokeRect(5, 5, 190, 90); // Adjust size and position as needed

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

    // Toggle hitboxes text
    this.hitboxToggleText = this.add.text(
      10,
      60,
      "Show hitboxes:",
      infoTextStyle
    );

    // Scale for the toggle switch
    const toggleScale = 0.1; // Adjust the scale as needed

    // Create a container to hold the toggle and make it interactive
    this.toggleContainer = this.add.container(170, 65); // Adjust for the position of the toggle

    // Add the 'off' toggle image by default and scale it
    this.toggleSwitch = this.add.image(0, 0, "toggleOff").setScale(toggleScale);
    this.toggleContainer.add(this.toggleSwitch);

    // Adjust the size of the container for interactions based on the scaled image size
    this.toggleContainer.setSize(
      this.toggleSwitch.displayWidth,
      this.toggleSwitch.displayHeight
    );
    this.toggleContainer.setInteractive().on("pointerdown", () => {
      this.showHitboxes = !this.showHitboxes;
      this.toggleSwitch.setTexture(
        this.showHitboxes ? "toggleOn" : "toggleOff"
      );
      // Clear the hitbox graphics if they should be hidden
      if (!this.showHitboxes) {
        this.hitboxGraphics.clear();
      }
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    // Create a Key object for the spacebar
    this.spacebar = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  update(time, delta) {
    this.updateTimer(time);
    this.handleBootMovement();
    this.handlePlayerMovement();
    this.updateHitboxFrames();

    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      this.isPaused = !this.isPaused; // Toggle the pause state
    }
    if (this.isPaused) {
      return;
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
    } else if (this.timer < 60) {
      this.level = "Level 1";
    } else if (this.timer < 90) {
      this.level = "Level 2";
    }
    this.levelText.setText("Level: " + this.level);
  }
  updateHitboxFrames() {
    this.hitboxGraphics.clear();
    // Only draw hitboxes if showHitboxes is true
    if (this.showHitboxes) {
      this.drawHitboxFrame(this.boot, 0x00ff00);
      this.drawHitboxFrame(this.frog, 0x00ff00);
    }
  }

  drawHitboxFrame(sprite, color) {
    const hitbox = sprite.body;
    this.hitboxGraphics.lineStyle(2, color, 1);
    this.hitboxGraphics.strokeRect(
      sprite.x - sprite.originX * hitbox.width,
      sprite.y - sprite.originY * hitbox.height,
      hitbox.width,
      hitbox.height
    );
  }

  handleBootMovement() {
    const stopHeight = 600; // Point for the bottom of the boot to reach
    if (this.isPaused) {
      return; // Skip boot movement if the game is paused
    }

    if (!this.bootPause && !this.retractingBoot) {
      this.boot.y += this.currentBootSpeed;
      this.currentBootSpeed += this.accelerationRate;

      // Check if the bottom of the boot has reached the stopHeight
      if (this.boot.y + this.boot.displayHeight / 2 >= stopHeight) {
        this.bootPause = true;
        this.time.delayedCall(1000, () => {
          this.retractingBoot = true;
          this.bootPause = false;
        });
      }
    } else if (this.retractingBoot) {
      this.boot.y -= this.bootRetractSpeed;
      if (this.boot.y <= -this.boot.displayHeight / 2) {
        this.resetBoot();
      }
    }
  }

  resetBoot() {
    this.retractingBoot = false;
    this.boot.y = -100;
    this.boot.x = Phaser.Math.Between(100, 700);
    this.currentBootSpeed = this.bootStompSpeed;
  }

  updateBootHitbox() {
    // Calculate the new hitbox size based on the sprite's display size (which includes scaling)
    let bootHitboxWidth =
      (this.boot.displayWidth * this.bootHitboxSizePercent.width) / 100;
    let bootHitboxHeight =
      (this.boot.displayHeight * this.bootHitboxSizePercent.height) / 100;

    // Update the boot's hitbox size
    this.boot.body.setSize(bootHitboxWidth, bootHitboxHeight);

    // Calculate and set the new offset from the center of the sprite
    // This assumes the sprite's origin is set to 0.5 (center)
    let offsetX = (this.boot.width - bootHitboxWidth) / 2;
    let offsetY = (this.boot.height - bootHitboxHeight) / 2;
    this.boot.body.setOffset(offsetX, offsetY);
  }

  handlePlayerMovement() {
    if (this.cursors.left.isDown) {
      this.frog.x -= 5;
      this.frog.setScale(-0.2, 0.2);
    } else if (this.cursors.right.isDown) {
      this.frog.x += 5;
      this.frog.setScale(0.2, 0.2);
    }
    this.frog.x = Phaser.Math.Clamp(this.frog.x, 0, 800);
  }

  setupHitboxes() {
    // Boot hitbox setup
    let bootHitboxWidth =
      (this.boot.width * this.bootHitboxSizePercent.width) / 100;
    let bootHitboxHeight =
      (this.boot.height * this.bootHitboxSizePercent.height) / 100;
    this.boot.body.setSize(bootHitboxWidth, bootHitboxHeight);
    // Adjust offset if needed

    // Frog hitbox setup
    let frogHitboxWidth =
      (this.frog.width * this.frogHitboxSizePercent.width) / 100;
    let frogHitboxHeight =
      (this.frog.height * this.frogHitboxSizePercent.height) / 100;
    this.frog.body.setSize(frogHitboxWidth, frogHitboxHeight);
    // Adjust offset if needed
  }
}

const config = {
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
  scene: [MainScene],
};

const game = new Phaser.Game(config);
