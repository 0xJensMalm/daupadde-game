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
  this.load.image("background", "assets/background.jpeg");
  this.load.image("frog", "assets/padde.png");
  this.load.image("boot", "assets/foot.png");
}

function create() {
  // Image assets
  this.add.image(400, 300, "background");
  var bg = this.add.image(0, 0, "background").setOrigin(0, 0);
  bg.setScale(800 / bg.width, 600 / bg.height); // Scale background to screen

  this.frog = this.add.sprite(400, 600 * 0.9, "frog").setScale(0.25); // Set scale and position
  this.boot = this.add.sprite(400, 100, "boot").setScale(0.6); // Set scale

  // Keyboard listener
  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  this.boot.y += 1;
  if (this.boot.y > 600) {
    this.boot.y = 0;
  }
  // left/right keyboard movemement
  if (this.cursors.left.isDown) {
    this.frog.x -= 5;
  } else if (this.cursors.right.isDown) {
    this.frog.x += 5;
  }
  this.frog.y = 600 * 0.9; //keep the frog at the same position.

  // collision at end of screen.
  this.frog.x = Phaser.Math.Clamp(this.frog.x, 0, 800);
}
