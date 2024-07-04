PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
(async () => {
// Initialize PixiJS Application
    const app = new PIXI.Application({
        resizeTo: window, // Height of the canvas
        backgroundColor: 0x1099bb,
        antialias: false,// Background color of the canvas
    });
    document.getElementById('game-container').appendChild(app.view);
    window.addEventListener('wheel', function(e) {
        e.preventDefault();
    }, { passive: false });

// Prevent default scrolling behavior for touch move
    window.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    //sheets
    const runningSheet = await PIXI.Assets.load("running.png");
    const idleSheet = await PIXI.Assets.load("idle.png");
    const mapAsset = await PIXI.Assets.load("assets/map.png");


    runningSheet.frame = new PIXI.Rectangle(0, 0, 48, 48)
    idleSheet.frame = new PIXI.Rectangle(0, 0, 48, 48)
    runningSheet.frame = new PIXI.Rectangle(0, 0, 48, 48)
    idleSheet.frame = new PIXI.Rectangle(0, 0, 48, 48)


    const scene = new PIXI.Container()
    let collidingObj = []

    const map = new PIXI.Sprite(mapAsset);
    const dude = new PIXI.Sprite(idleSheet);

    scene.addChild(map)
    map.y = -1960
    map.x = -300

    app.stage.addChild(scene)
    app.stage.addChild(dude);
    app.stage.y = -100
    //150 degree slop

    let OGScale = {x: 2, y: 2}
    dude.scale = OGScale;
    dude.position.x = app.screen.width / 2
    dude.position.y = 620
    let mousePos = {x: 0, y: 0}

    app.view.addEventListener('mousemove', (event) => {
        const mousePosition = {
            x: event.clientX,
            y: event.clientY
        };
        mousePos = mousePosition;


    });
    let moving = false;

    const cart = await createMinecart(app)
    const pully = await createPully(scene, app)
    scene.addChild(pully)
    pully.x = 1640
    pully.y = 20
    cart.y = 655
    cart.x = 800
    collidingObj.push(cart)
    scene.addChild(cart)

    let speed = 15;
    let distanceMoved = 0;
    let timer = 0
    let frame = 0;
    let inCart = false;
    let climbing = false;

    window.addEventListener('wheel', onScroll);
    let dir = 0;

    function onScroll(event) {
        dir = event.deltaY
        if (dir > 0 && dude.scale.x < 0) {
            dude.scale.x = OGScale.x;
            dude.position.x -= dude.width;
        }
        if (dir < 0 && dude.scale.x > 0) {
            dude.scale.x = -OGScale.x;
            dude.position.x += dude.width;
        }


    }

    app.ticker.add(async (time) => {
            timer += time / 60;
            if (!climbing && !inCart) {
                if (dir < 0 && !willCollide(dude, collidingObj, speed * time)) {
                    scene.x += speed * time
                    dir -= 10
                    if (dir < 0) {
                        dir = 0
                    }
                }
                if (dir > 0 && !willCollide(dude, collidingObj, -speed * time)) {
                    scene.x -= speed * time
                    dir += 10
                    if (dir > 0) {
                        dir = 0
                    }
                }

                if (timer > 0.1) {
                    frame += 1;
                    if (frame > 7) {
                        frame = 0;
                    }
                    timer = 0;
                    runningSheet.frame = new PIXI.Rectangle(frame * 48, 0, 48, 48);
                    dude.texture = runningSheet
                }

            } else if (!climbing && (dir === 0 || inCart)) {
                if (timer > 0.1) {
                    frame += 1;
                    if (frame > 9) {
                        frame = 0;
                    }
                    timer = 0;
                    idleSheet.frame = new PIXI.Rectangle(frame * 48, 0, 48, 48);
                    dude.texture = idleSheet
                }
            }

            if (willCollideWith(dude, cart, {x: speed * time, y: 0}) && !inCart && !climbing) {


                inCart = true;
                const climbInSheet = await PIXI.Assets.load("assets/climbin.png");


                let frame = 0;
                let timer = 0;
                climbing = true
                scene.x -= cart.width
                app.ticker.add((deltaTime) => {
                    timer += deltaTime / 60;

                    if (timer > 0.1 && climbing) {
                        frame += 1;
                        if (frame >= 5) {
                            climbing = false
                            cart.removeFromParent()
                            app.stage.addChild(cart)
                            scene.x -= speed * time
                            cart.x = dude.x
                            dude.y -= 7
                            cartMoveToPos(scene, {x: scene.x - 820, y: scene.y}, 3, app, pully, scene,cart,dude)
                            return
                        }
                        timer = 0;
                        climbInSheet.frame = new PIXI.Rectangle(frame * 48, 0, 48, 48)
                        dude.texture = climbInSheet
                    }
                });
            }


        }
    )


})();

async function cartMoveToPos(cart, pos, time, app, pully, scene,realCart,dude) {
    let dir = 100;
    let OGPos = {x: cart.x, y: cart.y};
    let targetPos = {x: pos.x, y: pos.y};
    let pullyMoveing = false;
    let isAttached = false;
    let elapsedTime = 0;
    let lastLength = 350;
    let atTheTop = false;
    let atSecondFloor = false;
    //dude.anchor.set(0.5,0.5)

    const railTX = await PIXI.Assets.load("assets/rotatingRail.png")
    const rotatingRail = new PIXI.Sprite(railTX)
    scene.addChild(rotatingRail)
    rotatingRail.anchor.set(0, 0.5)
    rotatingRail.rotation = 1
    rotatingRail.x = 1550
    rotatingRail.y = 175

    window.addEventListener('wheel', onScroll);

    function update(delta) {
        let fixedSpeed = 0.1*Math.abs(dir/5);
        if(Math.abs(cart.x - targetPos.x) < 4){
            fixedSpeed = 0
        }
        const deltaX = targetPos.x - cart.x;
        const deltaY = targetPos.y - cart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;
        const distancePerFrameX = directionX * fixedSpeed * delta;
        const distancePerFrameY = directionY * fixedSpeed * delta;



        elapsedTime += delta / 60; // Convert delta to seconds

        // Update cart position


        if (Math.abs(cart.x - pos.x) < 20) {

            if (!pullyMoveing) {
                dir = 0;
                dir = lastLength;
            }

            pullyMoveing = true
            if (!isAttached) {
                if (dir < 0) {
                    dir = 0;
                }
                pully.getChildAt(0).height = dir;
            }

            if (Math.abs(600 - dir) < 30 && !isAttached) {
                pully.getChildAt(0).height = 600
                isAttached = true
                lastLength = dir
                dir = 0
                console.log("attached", cart.y)


            }

            if (isAttached && !atTheTop) {
                console.log("moving",dir)

                if (dir > 0) {
                    cart.y = dir
                    pully.getChildAt(0).height = (600 - dir);
                }
                if (dir < 0) {
                    isAttached = false;
                    pullyMoveing = false;
                    dir = 100
                    targetPos = OGPos
                    const deltaX = targetPos.x - cart.x;
                    const deltaY = targetPos.y - cart.y;
                    const distancePerFrameX = deltaX * time * delta * 0.0001;
                    const distancePerFrameY = deltaY * time * delta * 0.0001;
                    cart.x += distancePerFrameX * delta * Math.abs(dir);
                    cart.y += distancePerFrameY * delta * Math.abs(dir);
                    atSecondFloor = false

                }
                if (Math.abs(520 - dir) < 40 && !atTheTop && dir > 0) {
                    atTheTop = true
                    cart.y = 520
                    atSecondFloor = true;
                    const rotateRail = (delta) => {
                        rotatingRail.rotation -= 0.1 * delta;
                        if (Math.abs(rotatingRail.rotation.valueOf()) < 0.05) {
                            app.ticker.remove(rotateRail);
                        }
                    };

                    app.ticker.add(rotateRail);

                    let doneAcross = false;
                    let doneUp = false;
                    dir = 100;

                    let OGPosSecond = {x: cart.x , y: cart.y}
                    let posSecond = {x: cart.x+600, y: cart.y};
                    let OGPosSecondUp = {x: cart.x + 600, y: cart.y }
                    let posSecondUp = {x: cart.x+1600, y: cart.y+500}

                    let targetPos = posSecond
                    let backwardsTarget = OGPosSecond
                    let forwardTarget = posSecond


                    const moveAcross = (delta) => {

                        if (dir > 250) {
                            dir = 250;
                        }
                        if (dir < -250) {
                            dir = -250
                        }
                        if (dir > 0) {
                            targetPos = forwardTarget
                            dir -= 1
                        }
                        if (dir < 0) {
                            dir += 1
                            targetPos = backwardsTarget
                        }
                        if(dir < 0){
                            targetPos = backwardsTarget
                        }
                        if(dir > 0){
                            targetPos = forwardTarget
                        }

                        let fixedSpeed = 0.1*Math.abs(dir/5);
                        if(Math.abs(cart.x - targetPos.x) < 4){
                            fixedSpeed = 0
                        }
                        const deltaX = targetPos.x - cart.x;
                        const deltaY = targetPos.y - cart.y;
                        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                        const directionX = deltaX / distance;
                        const directionY = deltaY / distance;
                        const distancePerFrameX = directionX * fixedSpeed * delta;
                        const distancePerFrameY = directionY * fixedSpeed * delta;
                        cart.x += distancePerFrameX;
                        cart.y += distancePerFrameY;
                        



                        if(Math.abs(cart.x - OGPosSecond.x) < 4 && dir < -20 ){
                            rotatingRail.rotation = 1;
                            isAttached = true;
                            atTheTop = false;
                            app.ticker.remove(moveAcross)
                            cart.x = pos.x
                            pullyMoveing = true
                            dir = 475
                        }
                        if (Math.abs(cart.x - posSecond.x) < 4) {
                            if(dir < 0){
                                backwardsTarget = OGPosSecond
                                forwardTarget = posSecond
                                realCart.rotation = 0;



                            }
                            else{
                                forwardTarget = posSecondUp
                                backwardsTarget = posSecond
                                realCart.rotation = 0.5

                            }
                        }
                        if (Math.abs(cart.x - posSecondUp.x) < 4) {
                            if(dir > 0){
                                backwardsTarget = posSecond
                                forwardTarget = posSecondUp
                                realCart.rotation = 0.5

                            }
                            else{
                                backwardsTarget = posSecond
                                forwardTarget = posSecondUp
                                realCart.rotation = 0.5

                            }
                        }



                    };
                    app.ticker.add(moveAcross);



                }


            }

        } else if (!atSecondFloor) {
            cart.x += distancePerFrameX;
            cart.y += distancePerFrameY;
            if (dir > 250) {
                dir = 250;
            }
            if (dir < -250) {
                dir = -250
            }
            if (dir > 0) {
                targetPos = pos
                dir -= 1
            }
            if (dir < 0) {
                dir += 1
                targetPos = OGPos
            }
        }

    }

    function onScroll(event) {
        dir += event.deltaY / 5

    }


    PIXI.Ticker.shared.add(update);
}


const createMinecart = async function (app) {
    const textures = await PIXI.Assets.load(['assets/minecart.png', 'assets/wheel.png']);

    const cartContainer = new PIXI.Container();
    const cart = new PIXI.Sprite(textures['assets/minecart.png']);
    const wheel1 = new PIXI.Sprite(textures['assets/wheel.png']);
    const wheel2 = new PIXI.Sprite(textures['assets/wheel.png']);

    wheel1.position.set(25, 38);
    wheel2.position.set(58, 38);
    wheel1.anchor.set(0.5);
    wheel2.anchor.set(0.5);
    cartContainer.addChild(cart);
    cartContainer.addChild(wheel1);
    cartContainer.addChild(wheel2);

    cartContainer.x = 200;
    cartContainer.y = 200;
    let moving = true;
    app.ticker.add((time) => {
        if (moving) {
            wheel1.rotation += 0.2 * time;
            wheel2.rotation += 0.2 * time;
        }
    });


    return cartContainer;
};

const createPully = async function (scene, app) {
    const ropeTX = await PIXI.Assets.load("assets/rope.png")
    const cogTX = await PIXI.Assets.load("assets/cog.png")
    const hookTX = await PIXI.Assets.load("assets/hook.png")


    const rope = await new PIXI.TilingSprite(
        ropeTX,
        7,
        0,
    );

    const cog = new PIXI.Sprite(cogTX)
    const hook = new PIXI.Sprite(hookTX)

    const pullyContainer = new PIXI.Container()
    pullyContainer.addChild(rope, cog, hook)
    pullyContainer.y = 50
    scene.addChild(pullyContainer)
    cog.anchor.set(0.5, 0.5)
    app.ticker.add((deltaTime) => {
        hook.y = rope.y + rope.height;
        hook.x = rope.x - hook.width / 2 + rope.width / 2
        rope.x = cog.x - rope.width / 2
        cog.rotation += 0.01 * deltaTime
        //rope.height += 1 * deltaTime

    });
    return pullyContainer
}

const explosion = async function (scene, app, position, scale) {
    // Load the spritesheet image
    const explosionSheet = await PIXI.Assets.load("assets/explotionSheet.png");

    const frames = [];
    const frameWidth = 100;
    const frameHeight = 100;
    const totalFrames = 59;


    for (let i = 0; i < totalFrames; i++) {
        const frameTexture = new PIXI.Texture(
            explosionSheet,
            new PIXI.Rectangle(i * frameWidth, 0, frameWidth, frameHeight)
        );
        frames.push(frameTexture);
    }

    // Create a sprite using the first frame
    const bomb = new PIXI.Sprite(frames[0]);
    bomb.scale = scale
    scene.addChild(bomb);

    bomb.x = position.x - bomb.width / 2 - scene.x;
    bomb.y = position.y - bomb.height / 2 - scene.y;

    let frame = 0;
    let timer = 0;

    app.ticker.add((deltaTime) => {
        timer += deltaTime / 60;

        if (timer > 0.01) {
            frame += 1;
            if (frame >= totalFrames) {
                //bomb.parent.removeChild(bomb);
                bomb.removeFromParent();
                return;
            }
            timer = 0;
            bomb.texture = frames[frame];
        }
    });
};

function isCollisionWith(obj1, obj2) {
    // Get bounds of each object
    let bounds1 = obj1.getBounds();
    let bounds2 = obj2.getBounds();

    // Check for intersection
    return bounds1.x + bounds1.width > bounds2.x &&
        bounds1.x < bounds2.x + bounds2.width &&
        bounds1.y + bounds1.height > bounds2.y &&
        bounds1.y < bounds2.y + bounds2.height;
}

function willCollideWith(obj1, obj2, movement) {
    // Get current bounds of obj1 and obj2
    let bounds1 = obj1.getBounds();
    let bounds2 = obj2.getBounds();

    // Calculate new bounds for obj1 after applying movement
    let newBounds1 = {
        x: bounds1.x + movement.x,
        y: bounds1.y + movement.y,
        width: bounds1.width,
        height: bounds1.height
    };

    // Check for intersection of new bounds1 with bounds2
    return (newBounds1.x + newBounds1.width > bounds2.x &&
        newBounds1.x < bounds2.x + bounds2.width &&
        newBounds1.y + newBounds1.height > bounds2.y &&
        newBounds1.y < bounds2.y + bounds2.height);
}

function isCollision(obj1, physicsObjs) {
    for (let i = 0; i < physicsObjs.length; i++) {
        if (isCollisionWith(obj1, physicsObjs[i])) {
            return true
        }
    }
    return false;
}

function willCollide(obj1, physicsObjs, movement) {
    for (let i = 0; i < physicsObjs.length; i++) {
        if (willCollideWith(obj1, physicsObjs[i], movement)) {
            return true
        }

    }
    return false;
}
