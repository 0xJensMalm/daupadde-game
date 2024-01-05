class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
    // Hitbox sizes
    this.bootHitboxSizePercent = { width: 50, height: 100 }; // Adjust as needed
    this.frogHitboxSizePercent = { width: 100, height: 100 }; // Adjust as needed
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("frog", "assets/padde.png");
    this.load.image("boot", "assets/rFoot.png");
    this.load.image("boot2", "assets/stFoot.png");
    this.load.image("dangermeter", "assets/dangermeter.png");
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
    this.boot = this.add.sprite(400, 100, "boot").setScale(0.2);

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
    this.hitboxToggleText = this.add
      .text(10, 70, "Toggle Hitboxes", { font: "16px Arial", fill: "#00ff00" })
      .setInteractive()
      .on("pointerdown", () => {
        this.showHitboxes = !this.showHitboxes;
      });

    this.levelText = this.add.text(10, 10, "Level: " + this.level, {
      font: "20px Arial",
      fill: "#ffffff",
    });
    this.timerText = this.add.text(10, 40, "Time: " + this.timer, {
      font: "20px Arial",
      fill: "#ffffff",
    });

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(time, delta) {
    this.updateTimer(time);
    this.handleBootMovement();
    this.handlePlayerMovement();
    this.updateHitboxFrames();
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
    this.drawHitboxFrame(this.boot, 0x00ff00); // Green for boot
    this.drawHitboxFrame(this.frog, 0x00ff00); // Green for frog
  }

  drawHitboxFrame(sprite, color) {
    if (!this.showHitboxes) {
      this.hitboxGraphics.clear();
      return;
    }
    const hitbox = sprite.body;
    this.hitboxGraphics.lineStyle(2, color, 1);
    this.hitboxGraphics.strokeRect(
      sprite.x - hitbox.width / 2,
      sprite.y - hitbox.height / 2,
      hitbox.width,
      hitbox.height
    );
  }

  handleBootMovement() {
    const stopHeight = 600; // Point for the bottom of the boot to reach

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

    // Randomly select one of the two foot images
    const bootImageKey = Phaser.Math.RND.pick(["boot", "boot2"]);
    this.boot.setTexture(bootImageKey);

    // Randomly flip the boot image horizontally
    const flipX = Phaser.Math.RND.pick([-1, 1]);
    this.boot.setScale(flipX * 0.2, 0.2);

    this.currentBootSpeed = this.bootStompSpeed;
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
