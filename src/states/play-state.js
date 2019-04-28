import {FONT_COLOR, MARGIN, DescriptionStyle} from "../common/constants";
import GenericButton from "../common/GenericButton";
import StoreMenu from "./storeMenu";
import CreatureConstants from "./creatureConstants";

export default function playState(game) {

    const GRAVITY = 600*2;
    const BOUNCE = 0.2;
    

    const ITEM_MAP = {
        "Fairie Dust": {descr: "Slows fall speed & adds a double jump", cost: 100}
    };



    // locations
    let GROUND_LEVEL;
    let HEALTH_BAR_X = 10;
    let HEALTH_BAR_Y = 10;
    let COIN_STAT_X = 224;
    let COIN_STAT_Y = 10;
    let STORE_X;
    let STORE_Y;
    let STORE_RADIUS = 120;

    let CREATURE_COUNT_X = 280;
    let CREATURE_COUNT_Y = 10;

    // game stats
    let level = 1;

    // groups
    let cursors;
    let groundPlatform;

    // characters
    let shrek;
    const SHREK_BASE_SPEED = 150;
    const SHREK_BASE_JUMP_SPEED = 525;
    const SHREK_KNOCKBACK_TIME = 60; // 1 sec
    const SHREK_KNOCKBACK_SPEED = 200;
    let actionSprites = {};
    let actionSpriteProps = {'chop': {
            speed: 36,
            collisionCheckFunction: checkChopCollision
        }, 
        'net': {
            speed: 12,
            collisionCheckFunction: checkNetCollision
        }, 
        'bigfist': {
            speed: 18,
            collisionCheckFunction: () => {}
        }
    };
    let coinIcon, coinText, heartGroup, iconBag;
    let isShrekActing = false;

    let storeUI;
    let choiceLabel;
    let enemies = [];

    // flags
    let isShrekFacingLeft = true;
    let bouncing = false;
    let isStoreOpen = false;

    // player stats
    let gold = 0;
    let inventory = {};
    let capturedCreatures = {};
    let health = 10;

    // keys
    let SPACE_BAR;
    let ACTION_KEY;
    let NET_KEY;

    function preload() {
        game.load.image('ground', 'src/assets/ground.png');
        game.load.image('groundTop', 'src/assets/groundTop.png');
        game.load.spritesheet('shrek', 'src/assets/shrek.png', 126/3, 72);
        game.load.spritesheet('donkey', 'src/assets/donkey.png', 192/4, 48);
        game.load.spritesheet('fairy', 'src/assets/fairy.png', 56/4, 17);
        game.load.image('tree1', 'src/assets/tree1.png');
        game.load.image('tree2', 'src/assets/tree2.png');
        game.load.image('tree3', 'src/assets/tree3.png');
        game.load.image("berryBush", "src/assets/berryBush.png");
        game.load.image("store", "src/assets/store.png");
        game.load.image("forestBackground", "src/assets/forestBackground.png");
        game.load.image("storeBackground", "src/assets/storeBackground.png");
        game.load.spritesheet("chop", "src/assets/chop.png", 120/3, 64);
        game.load.spritesheet("net", "src/assets/net.png", 288/3, 108);
        game.load.spritesheet("bigfist", "src/assets/bigfist.png", 192/3, 64);
        game.load.image("sky", "src/assets/sky.png");
        game.load.image("heart", "src/assets/heart.png");
        game.load.spritesheet("coin", "src/assets/coin.png", 128/8, 16);
        game.load.spritesheet("fairy", "src/assets/fairy.png", 14, 17);

        // icons
        game.load.image("donkeyIcon", "src/assets/donkeyIcon.png");
        game.load.image("fairyIcon", "src/assets/fairyIcon.png");
        game.load.image("gnomeIcon", "src/assets/gnomeIcon.png");
        game.load.image("iconBag", "src/assets/iconBag.png");

        // sounds
        game.load.audio("net", "src/assets/sound/net.wav");
    }
    
    function create() {
        GROUND_LEVEL = game.world.height - 64;
        STORE_X = 640 * 5 + 450;
        STORE_Y = GROUND_LEVEL - 64;

        game.world.setBounds(0, 0, 6400, 512);
        game.stage.disableVisibilityChange = true;
        cursors = game.input.keyboard.createCursorKeys();
        addBackgroundScenery();
        addEnemies();
        addShrek();
        addActionSprites();

        //  We're going to be using physics, so enable the Arcade Physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.camera.follow(shrek, Phaser.Camera.FOLLOW_LOCKON);

        addForegroundScenery();
        addStatOverlay();

        SPACE_BAR = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        SPACE_BAR.onUp.add(toggleStore, this);

        ACTION_KEY = game.input.keyboard.addKey(Phaser.Keyboard.A);
        ACTION_KEY.onUp.add(() => {animateAction('chop');}, this);
        NET_KEY = game.input.keyboard.addKey(Phaser.Keyboard.S);
        NET_KEY.onUp.add(() => {animateAction('net')}, this);

        createInventory();
    }
    
    
    function update() {
        updateShrek();
        updateEnemies();
        updateShrekAction();
        updateStatOverlay();
    }

    function updateShrekAction() {
        Object.keys(actionSpriteProps).forEach((actionName) => {
            const sprite = actionSprites[actionName].sprite;
            if (sprite.alpha > 0.5) {
                actionSpriteProps[actionName].collisionCheckFunction();
            }    
        });

    }

    function createInventory() {
        const items = Object.keys(ITEM_MAP);
        for (let i = 0; i < items.length; i++){ 
            inventory[items[i]] = 0;
        }
    }

    function addBackgroundScenery() {

        //  The groundPlatform group contains the ground and the 2 ledges we can jump on
        groundPlatform = game.add.group();
            
        //  We will enable physics for any object that is created in this group
        if (groundPlatform) {
            groundPlatform.enableBody = true;
        }


        // Here we create the ground.
        for(var i = 0; i < 65; ++i) {
            var x = i * 256;
            var y = GROUND_LEVEL;
            var ground = groundPlatform.create(x, y, 'ground');
            game.add.sprite(x, y - 32, 'groundTop');
            ground.body.immovable = true;
        }

        // add the forest background
        for(var i = 0; i < 10; ++i) {
            var x = i * 640;
            var y = game.world.height - 64 - 12- 320;
            game.add.sprite(x, 0, 'sky');
            if(i == 5) {
                game.add.sprite(x, y, 'storeBackground');
            } else {
                game.add.sprite(x, y, 'forestBackground');
            }
        }
        
        let store = game.add.sprite(STORE_X, STORE_Y, "store");
        store.scale.setTo(2);
        store.anchor.setTo(0.5, 0.5);
    }

    function addShrek() {
        shrek = game.add.sprite(0,0,'shrek');
        shrek.anchor.setTo(0.5, 1);
        shrek.x = STORE_X;
        shrek.y = GROUND_LEVEL;
        game.physics.arcade.enable(shrek);
        shrek.body.bounce.y = BOUNCE;
        shrek.body.gravity.y = GRAVITY;
        shrek.body.collideWorldBounds = true;
        shrek.animations.add('shrekWalk', [0, 1, 2], 10, false);
        shrek.hitTimer = 0;
    }

    function addActionSprites() {

        Object.keys(actionSpriteProps).forEach((spriteName) => {
            let spriteProps = actionSpriteProps[spriteName];
            let actionSprite = game.add.sprite(0, 0, spriteName);
            actionSprite.alpha = 0;
            let animationName = spriteName + 'Anim';
            let actionAnim = actionSprite.animations.add(animationName, [0, 1, 2, 2, 2], spriteProps.speed, false);
            actionAnim.onComplete.add(() => {
                actionSprite.alpha = 0; 
                actionSprites[spriteName].collidedEnemies = []
            }, this);
            actionSprites[spriteName] = {
                sprite: actionSprite,
                animationName: animationName,
                name: spriteName,
                collidedEnemies: []
            };
        });
    }

    function addEnemies() {
        enemies = [];
        for (let i = 0; i < 10; i++) {
            spawnEnemy(CreatureConstants.DONKEY);
        }
    }

    function spawnEnemy(enemyTemplate) {
        let enemy = game.add.sprite(0, 0, enemyTemplate.name);
        enemy.anchor.setTo(0.5, 1);

        enemy.x = randomSpawnX();
        enemy.y = GROUND_LEVEL;
        game.physics.arcade.enable(enemy);
        enemy.body.bounce.y = BOUNCE;
        enemy.body.gravity.y = GRAVITY;
        enemy.body.collideWorldBounds = true;
        enemy.animations.add(enemyTemplate.name + 'Walk', [0, 1, 2, 0], 12, false);
        enemy.direction = -1; // custom state
        enemy.health = enemyTemplate.baseHealth;
        enemy.name = enemyTemplate.name
        enemy.template = enemyTemplate;
        enemy.pauseTimer = 0;
        enemies.push(enemy);
    }

    function randomSpawnX() {
        let spawnX = Math.random() * game.world.width;
        if(spawnX > STORE_X - STORE_RADIUS && spawnX < STORE_X + STORE_RADIUS) {
            return randomSpawnX();
        }
        return spawnX
    }

    function addForegroundScenery() {
        game.add.sprite(150, game.world.height - 215, 'tree1');
        game.add.sprite(400, game.world.height - 115, "berryBush");
        game.add.sprite(500, game.world.height - 270, 'tree2');
        game.add.sprite(800, game.world.height - 284, 'tree3');
        game.add.sprite(100, game.world.height - 125, "berryBush");
    }

    function toggleStore() {
        if (shrek.x <= STORE_X + STORE_RADIUS && shrek.x >= STORE_X - STORE_RADIUS && !isStoreOpen) {
            createStore();
            isStoreOpen = true;
        }
    }

    function createStore() {
        storeUI = game.add.group();

        // Then add the menu
        let menuContainer = StoreMenu(game);
        storeUI.add(menuContainer);

        let sellButtonCoords = camera_izeCoordinates(game.width - (MARGIN * 2),
            game.height - (MARGIN * 2));
        let sellButton = GenericButton(game, sellButtonCoords.x, 
            sellButtonCoords.y, 'SELL CREATURES', () => {Object.keys(capturedCreatures).forEach((creatureName) => {
                let creature = capturedCreatures[creatureName];
                gold += creature.price;
                capturedCreatures[creatureName] = [];
            })});
        sellButton.anchor.setTo(1, 0.5);
        storeUI.add(sellButton);

        let closeButtonCoords = camera_izeCoordinates(game.width - (MARGIN * 2), MARGIN * 2);
        let closeButton = GenericButton(game, closeButtonCoords.x, 
            closeButtonCoords.y, 'X', () => {storeUI.destroy(); isStoreOpen = false;});
        closeButton.anchor.setTo(0, 0);
        storeUI.add(closeButton);
        const items = Object.keys(ITEM_MAP);
        for(var i = 0; i < items.length; ++i) {
            let itemName = items[i];
            let y = MARGIN * 2 * (i + 1);
            let coords = camera_izeCoordinates(MARGIN * 2, y);
            let itemButton = GenericButton(game, coords.x, coords.y, itemName, () => {
                // ensure player has enough currency to buy this item
                if (validatePurchase(items[i])) {
                    inventory[itemName]+= 1;
                    // decrease player currency
                    gold -= items[i].cost;
                } else {
                    // display not enough currency warning
                }
            });
            itemButton.anchor.setTo(1, 0.5);
            storeUI.add(itemButton);

            coords = camera_izeCoordinates(MARGIN * 4, y);
            let itemDescr = game.add.text(coords.x, coords.y, ITEM_MAP[itemName].descr, DescriptionStyle);
            storeUI.add(itemDescr);
        }
    }

    function validatePurchase(item) {
        return item && item.cost <= gold;
    }

    function addStatOverlay() {
        heartGroup = game.add.group();

        // add coins
        let coinCoords = camera_izeCoordinates(COIN_STAT_X, COIN_STAT_Y);
        coinIcon = game.add.sprite(coinCoords.x, coinCoords.y,'coin');
        coinIcon.animations.add('rotate', [0,1,2,3,4,5,6,7], 14, true);
        coinIcon.animations.play('rotate');
        coinIcon.anchor.setTo(0,0);
        coinIcon.fixedToCamera = true;
        
        coinText = game.add.text(coinCoords.x + 20, coinCoords.y, ' x ' + gold, {font: 'Comic Sans MS', fill: FONT_COLOR, align: 'left', fontSize: '12px'});
        coinText.fixedToCamera = true;

        // add hearts
        for(let i = 0; i < health; ++i) {
            let coords = camera_izeCoordinates(HEALTH_BAR_X + 18 * i, HEALTH_BAR_Y);
            let heart = game.add.sprite(coords.x, coords.y, 'heart');
            heart.fixedToCamera = true;
            heart.anchor.set(0,0);
            heartGroup.add(heart);
        }

        // add captured creatures
        let bagCoords = camera_izeCoordinates(CREATURE_COUNT_X, CREATURE_COUNT_Y)
        iconBag = game.add.image(bagCoords.x, bagCoords.y, "iconBag");
        iconBag.anchor.setTo(0,0);
        iconBag.fixedToCamera = true;
        for(let i = 0; i < CreatureConstants.CREATURE_LIST.length - 1; ++i) {
            let creature = CreatureConstants.CREATURE_LIST[i];
            let creatureCoords = camera_izeCoordinates(CREATURE_COUNT_X + iconBag.width - 3 - (18 * i), CREATURE_COUNT_Y + (iconBag.height / 2));
            creature.icon = game.add.image(creatureCoords.x, creatureCoords.y, creature.name + 'Icon');
            creature.icon.fixedToCamera = true;
            creature.icon.anchor.setTo(1,0.5);
        }
    }

    function updateStatOverlay() {
        coinText.x = COIN_STAT_X + 20;
        coinText.y = COIN_STAT_Y.y; 
        coinText.text = ' x ' + gold;

        for(let i = 0; i < heartGroup.children.length; ++i) {
            let heart = heartGroup.getChildAt(i);
            if(i < health) {
                heart.visible = true
            } else {
                heart.visible = false;
            }
        }
    }

    function updateShrek() {
        if(isStoreOpen) {
            game.physics.arcade.collide(shrek, groundPlatform);
            shrek.body.velocity.x = 0;
            return;
        }
        reanchorActionSprites();
        if (shrek.hitTimer > 0) {
            game.physics.arcade.collide(shrek, groundPlatform);
            updateKnockedBackSprite(shrek);
        } else {
            updateShrekNormal();
        }
    }

    function updateShrekNormal() {

        var isOnGround = game.physics.arcade.collide(shrek, groundPlatform);
        //  Reset the players velocity (movement)
        shrek.body.velocity.x = 0;
        shrek.body.bounce.y = bouncing ? 0.7 : 0.2;

        if (cursors.left.isDown)
        {
            if(!isShrekFacingLeft) {
                flipShrek(); // flips shrek about the y axis
                isShrekFacingLeft = true;
            }
            //  Move to the left
            shrek.body.velocity.x = -SHREK_BASE_SPEED;
            shrek.animations.play('shrekWalk');
        }
        else if (cursors.right.isDown)
        {
            if(isShrekFacingLeft) {
                flipShrek(); // flips shrek about the y axis
                isShrekFacingLeft = false;
            }
            //  Move to the right
            shrek.body.velocity.x = SHREK_BASE_SPEED;
            shrek.animations.play('shrekWalk');
        } else {
            shrek.frame = 0;
        }

        //  Allow the shrek to jump if they are touching the ground.
        if (cursors.up.isDown && shrek.body.touching.down && isOnGround) {
            shrek.body.velocity.y = -SHREK_BASE_JUMP_SPEED;
        }

        // bounce logic
        if (isOnGround) {
            bouncing = false;
        }
        if (cursors.down.isDown && !isOnGround && bouncing === false) {
            shrek.body.velocity.y = 900*1.25;
            bouncing = true;
        }

        enemies.forEach((enemy) => {
            game.physics.arcade.overlap(shrek, enemy, onShrekHit, null, this);
        });
    }

    function updateKnockedBackSprite(sprite) {
        sprite.hitTimer--;
        sprite.tint = sprite.hitTimer % 4 >= 2 ? '0xff6666' : '0xffffff';
    }

    function updateEnemies() {
        enemies.forEach((enemy) => {
            var isOnGround = game.physics.arcade.collide(enemy, groundPlatform);

            if(enemy.hitTimer > 0) {
                updateKnockedBackSprite(enemy);
                return;
            }

            if(enemy.pauseTimer > 0) {
                enemy.pauseTimer--;
                return;
            }
            let speed = getEnemySpeedFromLevel(enemy.template);

            if(enemy.x > STORE_X - STORE_RADIUS && enemy.x < STORE_X) {
                enemy.body.velocity.x = -speed;
                if(enemy.direction === 1) {
                    flipSpriteDirection(enemy);
                }
                enemy.direction = -1;
                return;
            } else if(enemy.x < STORE_X + STORE_RADIUS && enemy.x > STORE_X) {
                if(enemy.direction === -1) {
                    flipSpriteDirection(enemy);
                }
                enemy.body.velocity.x = speed;
                enemy.direction = 1;
                return;
            }

            enemy.body.velocity.x = speed * enemy.direction;
            enemy.animations.play(enemy.name + 'Walk');
            if(Math.random() > 0.98) {
                enemy.direction *= -1;
                flipSpriteDirection(enemy);
            }
                //  Allow the shrek to jump if they are touching the ground.
            if (enemy.body.touching.down && isOnGround) {
                if(Math.random() * 1000 > 999) {
                    enemy.body.velocity.y = -SHREK_BASE_JUMP_SPEED;
                }
            }
        });
    }

    function reanchorActionSprites() {
        Object.keys(actionSprites).forEach(
            (actionSpriteName) => anchorActionSprite(actionSprites[actionSpriteName].sprite));
    }

    function onShrekHit(shrek, enemy) {
        health--;
        if(health < 1) {
            game.state.start("GameOver");
        }
        knockbackSprite(shrek, enemy);
        enemy.body.velocity.x = 0;
        enemy.body.velocity.y = 0;
        enemy.pauseTimer = SHREK_KNOCKBACK_TIME / 2;
    }

    function knockbackSprite(sprite, adversary) {
        sprite.hitTimer = SHREK_KNOCKBACK_TIME;
        if(adversary.body.x > sprite.body.x) {
            sprite.body.velocity.x = -SHREK_KNOCKBACK_SPEED;
        } else {
            sprite.body.velocity.x = SHREK_KNOCKBACK_SPEED;
        }
        sprite.body.velocity.y = -SHREK_KNOCKBACK_SPEED;
    }

    function animateAction(actionSpriteName) {
        if(isShrekActing) {
            return;
        }
        isShrekActing = true;
        let actionSprite = actionSprites[actionSpriteName].sprite;
        let animationName = actionSprites[actionSpriteName].animationName;
        actionSprite.alpha = 1;
        actionSprite.anchor.setTo(1, 0.5);
        anchorActionSprite(actionSprite);
        let anim = actionSprite.animations.play(animationName);
        anim.onComplete.add(() => {isShrekActing = false;});
    }

    // flips sprite about the y-axis
    function flipSpriteDirection(sprite) {
        sprite.scale.x *= -1
    }
    
    function flipShrek() {
        flipSpriteDirection(shrek);
        Object.keys(actionSprites).forEach(
            (actionSpriteName) => flipSpriteDirection(actionSprites[actionSpriteName].sprite));
    }

    function anchorActionSprite(actionSprite) {
        let armAnchor = getShrekActionAnchor();
        actionSprite.x = armAnchor.anchorX;
        actionSprite.y = armAnchor.anchorY;
    }

    function getShrekActionAnchor() {
        let anchorX = isShrekFacingLeft? shrek.x - 17 : shrek.x + 17;
        let anchorY = shrek.y - 52;
        return {anchorX, anchorY};
    }

    function camera_izeCoordinates(x,y) {
        return {
            x: game.camera.x + x,
            y: game.camera.y +y
        };
    }

    function getEnemySpeedFromLevel(enemyTemplate) {
        return enemyTemplate.baseSpeed;
    }

    function checkNetCollision() {
        const net = actionSprites['net'];
        const netSprite = net.sprite;
        enemies.forEach((enemy) => {
            if (net.collidedEnemies.length >= 1 || Object.keys(capturedCreatures).includes(enemy.name) || enemy.health > 0) {
                return;
            }
            const foundCollision = Phaser.Rectangle.intersects(enemy.getBounds(), netSprite.getBounds());
            if (foundCollision) {
                net.collidedEnemies.push(enemy);
                capturedCreatures[enemy.name] = enemy.template;
                enemies.splice(enemies.indexOf(enemy), 1);
                enemy.destroy();
                console.log(capturedCreatures);
            }
        });
        
    }

    function checkChopCollision() {
        const chop = actionSprites['chop'];
        const chopSprite = chop.sprite;

        enemies.forEach((enemy) => {
            if (chop.collidedEnemies.includes(enemy)) {
                return;
            }
            const foundCollision = Phaser.Rectangle.intersects(enemy.getBounds(), chopSprite.getBounds());
            if (foundCollision) {
                chop.collidedEnemies.push(enemy);
                enemy.health = enemy.health - 1;
                console.log("hit a mufukka");
                knockbackSprite(enemy, shrek);
            }
        });
    }

    return {preload, create, update};
}