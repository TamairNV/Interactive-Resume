PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

(async () => {

    const app = new PIXI.Application({
        resizeTo: window, // Height of the canvas
        backgroundColor: 0x1099bb, antialias: false,// Background color of the canvas
    });
    document.getElementById('game-container').appendChild(app.view);


    class Object {
        constructor() {
            this.tag = "Default"
            this.start()
            this.updateTicker = async (delta) => {
                this.update(delta);
            };
            app.ticker.add(this.updateTicker)
        }

        start() {
        }

        update(delta) {
        }
    }

    class TSprite extends Object {
        constructor(asset) {
            super();
            this.loadAssets(asset)
        }

        async loadAssets(asset) {
            //this.texture = await PIXI.Assets.load(asset);
            this.sprite = new PIXI.Sprite(this.texture);
            scene.addChild(this.sprite)
        }

    }

    class Animation {
        constructor(spriteSheet, width, height, frameNumber, frameSpeed, loop = true, freezeAtLastFrame = false, destroyAfterFinished = false) {
            this.frameSize = [width, height]
            this.frameNumber = frameNumber;
            this.frameSpeed = frameSpeed;
            this.spriteSheet = spriteSheet
            this.loop = loop
            this.freezeAtLastFrame = freezeAtLastFrame;
            this.destroyAfterFinished = destroyAfterFinished
            this.loadedSheet = this.loadSheet();


        }

        async loadSheet() {
            const sheet = await PIXI.Assets.load(this.spriteSheet);
            sheet.frame =  new PIXI.Rectangle(0, 0, this.frameSize[0], this.frameSize[1])
            return sheet
        }
    }

    class AnimatingSprite extends Object {
        constructor(animation) {
            super();
            this.currentAnimation = animation
            this.defaultAni = animation
            this.timer = 0
            this.currentFrame = 0;
            this.loadedAnimations = {}

            this.loadSprite(animation);

        }

        async loadSprite(animation) {
            this.sheet = await animation.loadedSheet
            this.sprite = new PIXI.Sprite(this.sheet);
            scene.addChild(this.sprite)
            this.loadedAnimations[animation.spriteSheet] = animation.loadedSheet
        }


        async changeAnimation(newAnimation) {
            if(this.currentAnimation.spriteSheet === newAnimation.spriteSheet){
                return
            }
            this.currentAnimation = newAnimation
            this.sheet = await newAnimation.loadedSheet
            this.currentFrame = 0;
        }


        update(delta) {
            this.timer += delta / 60;

            if (this.timer >= this.currentAnimation.frameSpeed && this.currentFrame < this.currentAnimation.frameNumber) {
                this.currentFrame += 1
                if (this.currentFrame > this.currentAnimation.frameNumber - 1) {
                    if (!this.currentAnimation.freezeAtLastFrame) {
                        this.currentFrame = 0;
                    }

                    if (!this.currentAnimation.loop && !this.currentAnimation.freezeAtLastFrame) {
                        this.changeAnimation(this.defaultAni)
                    }
                    if (this.currentAnimation.destroyAfterFinished) {
                        this.sprite.destroy()
                    }
                }
                this.timer = 0;
                try {
                    this.sheet.frame = new PIXI.Rectangle(this.currentFrame * this.currentAnimation.frameSize[0], 0, this.currentAnimation.frameSize[0], this.currentAnimation.frameSize[1])
                    this.sprite.texture = this.sheet;
                } catch (err) {
                    console.log("still loading")
                }
            }
        }
    }


    class Point {
        constructor(pos) {
            this.position = pos

        }
    }

    class Trail {
        constructor(obj,player,speed) {
            this.trail = []
            this.moveTowardsPoint = 1;
            this.moveBackPoint = 0;
            this.graphics = new PIXI.Graphics();
            this.sprite = player
            this.speed = speed;
            this.obj = obj;
            this.offset = obj.position
            this.onScroll = this.onScroll.bind(this);
            window.addEventListener('wheel', this.onScroll);
            this.deltaY = 0
            this.updateTicker = async (delta) => {
                this.update(delta);
            };
            app.ticker.add(this.updateTicker)
        }

        onScroll(event) {
            this.deltaY += event.deltaY;
            if(this.deltaY > 300){
                this.deltaY = 300;
            }
            if(this.deltaY < -300){
                this.deltaY = -300
            }
        }
        update(delta){
            if(this.deltaY !== 0){


                let pointToMoveToo = 0
                if (this.deltaY > 0) {
                    pointToMoveToo = this.moveTowardsPoint
                } if(this.deltaY < 0) {
                    pointToMoveToo = this.moveBackPoint
                }

                let playerRelativePos = addVectors(this.sprite.sprite.position,{x:this.sprite.sprite.width/2,y:this.sprite.sprite.height/2})
                if(this.sprite.sprite.scale.x < 0){
                    playerRelativePos.x -= this.sprite.sprite.width
                }
                let trailPos = addVectors(this.trail[pointToMoveToo],this.offset);
                let nVector = normalize(playerRelativePos, trailPos)
                this.obj.position = subVectors( this.obj.position,mulVector(nVector ,this.speed))
                let nMag = getMag(playerRelativePos, trailPos)

                if(nVector.y < 0.15 && nVector.y > -0.15 ){
                    this.sprite.changeAnimation(runningAni)
                }
                else{
                    this.sprite.changeAnimation(idleAni)
                }
                if(nVector.x > 0&& this.sprite.sprite.scale.x < 0){
                    this.sprite.sprite.scale.x = 2;
                    this.sprite.sprite.x -= this.sprite.sprite.width
                }
                if(nVector.x < 0 && this.sprite.sprite.scale.x > 0){
                    this.sprite.sprite.scale.x = -2;
                    this.sprite.sprite.x += this.sprite.sprite.width
                }


                this.drawPoints()

                if (nMag < this.speed && nMag > -this.speed){
                    if (this.deltaY > 0) {
                        this.moveTowardsPoint +=1
                        this.moveBackPoint +=1
                    } if(this.deltaY < 0)  {
                        this.moveTowardsPoint -=1
                        this.moveBackPoint -=1
                    }
                }
                if (this.deltaY > 0) {
                    this.deltaY -= 5;
                } if(this.deltaY < 0) {
                    this.deltaY += 5;
                }

            }
            else{
                this.sprite.changeAnimation(idleAni)
            }



        }


        drawPoints() {
            app.stage.removeChild(this.graphics);
            this.graphics.destroy(true);
            this.graphics = new PIXI.Graphics();
            this.graphics.beginFill(0xff0000);
            for (let i = 0; i < this.trail.length; i++) {
                this.graphics.drawCircle(this.trail[i].x+this.offset.x, this.trail[i].y+this.offset.y, 10);
            }
            this.graphics.endFill();
            scene.addChild(this.graphics);
        }

    }
     function normalize(point1, point2) {
        let vector = {x: point2.x - point1.x, y: point2.y - point1.y};
        let mag = getMag(point1, point2);
        if (mag === 0) {
            // If magnitude is zero, return a zero vector
            return {x: 0, y: 0};
        }
        return {x: vector.x / mag, y: vector.y / mag};
    }

    function getMag(point1, point2){
        let vector = {x: point2.x - point1.x, y: point2.y - point1.y};
        return  Math.sqrt(vector.x ** 2 + vector.y ** 2)
    }

    function addVectors(point1, point2) {
        return {x: point1.x  + point2.x, y: point1.y  + point2.y}
    }
    function  subVectors(point1, point2) {
        return {x: point1.x - point2.x, y: point1.y - point2.y}
    }
    function mulVector(point1, factor) {
        return {x: point1.x * factor, y: point1.y * factor}
    }


    async function waitWhileLoading(sprite) {
        while (sprite.sprite === undefined) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Check every 50ms
        }
    }
    function adjustMapPosition() {
        map.x = (app.screen.width - 1700)/2
        map.y = (app.screen.height - 5020)/2

    }
    function adjustPlayerPosition() {
        player.sprite.position = {x:app.screen.width/2,y:player.sprite.y = app.screen.height/3.5 * 2}
        PRP = {x: app.screen.width/2 + player.sprite.width/2, y: app.screen.height/3.5 *2+ player.sprite.height/2}
        trail.trail = []
        trail.trail.push(PRP)
        trail.trail.push({x:PRP.x+1050,y:PRP.y})
        trail.trail.push({x:PRP.x+1050,y:PRP.y - 515})
        trail.trail.push({x:PRP.x+425,y:PRP.y - 515})
        trail.trail.push({x:PRP.x-100,y:PRP.y - 700})
        cog.pullyContainer.position = {x:PRP.x+1050,y:PRP.y - 660}

    }

    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        adjustMapPosition();
        adjustPlayerPosition()

    });

    function getRelativePlayerPosition(player){
        let playerRelativePos = addVectors(player.position,{x:player.width/2,y:player.height/2})
        if(player.scale.x < 0){
            playerRelativePos.x -= player.width
        }
        return playerRelativePos
    }

    function getRelativeTrailPosition(trail,offset){
        return  addVectors(trail,offset);
    }
    class Cog{
        constructor() {
            this.cog = null;
            this.rope = null;
            this.hook = null
            this.pullyContainer = new PIXI.Container()

            background.addChild(this.pullyContainer)
            this.loadAsset();
            this.previousRopeHeight = undefined

            this.attached = false


        }

        async loadAsset(){
            const cogAsset = await PIXI.Assets.load("assets/cog.png")
            const ropeAsset = await PIXI.Assets.load("assets/rope.png")
            const hookAsset = await PIXI.Assets.load("assets/hook.png")
            this.cog = await new PIXI.Sprite(cogAsset)
            this.rope = await new PIXI.TilingSprite(
                ropeAsset,
                7,
                0,
            );

            this.hook = await new PIXI.Sprite(hookAsset)
            this.hook.x -= 5
            this.cog.anchor.set(0.5, 0.5)
            this.pullyContainer.addChild(this.rope, this.cog, this.hook)
            this.updateTicker = async (delta) => {
                this.update(delta);
            };
            app.ticker.add(this.updateTicker)
        }
        update() {

            if (this.previousRopeHeight === undefined) {
                this.previousRopeHeight = this.rope.height;
            }

            const relativePlayerPosition = getRelativePlayerPosition(player.sprite);
            const relativeTrailPosition = getRelativeTrailPosition(trail.trail[1], background.position);

            if (getMag(relativeTrailPosition, relativePlayerPosition) < speed) {
                this.attached = true;
            }

            if (this.attached) {
                this.hook.y = (subVectors(relativePlayerPosition, background.position).y - this.pullyContainer.y) - player.sprite.height / 2;
                const newRopeHeight = this.hook.y;


                const deltaHeight = newRopeHeight - this.previousRopeHeight;


                const rotationSpeedFactor = 0.01;
                this.cog.rotation += deltaHeight * rotationSpeedFactor;


                this.rope.height = newRopeHeight;

                this.previousRopeHeight = newRopeHeight;
            }
        }

    }




    const mapAsset = await PIXI.Assets.load("assets/map.png");
    const map = new PIXI.Sprite(mapAsset);

    const scene = new PIXI.Container()
    const background = new PIXI.Container();
    background.addChild(map)

    app.stage.addChild(background)
    app.stage.addChild(scene);

    const speed = 5
    const runningAni = new Animation("running.png", 48, 48, 8, 0.05,false)
    const idleAni = new Animation("idle.png", 48, 48, 10, 0.1)
    const player = new AnimatingSprite(idleAni)

    await waitWhileLoading(player)
    player.sprite.scale = {x: 2, y: 2}
    let PRP = {x: app.screen.width/2 + player.sprite.width/2, y: app.screen.height/3.5 *2+ player.sprite.height/2}
    const trail = new Trail(background,player,speed)
    const cog = new Cog()

    adjustPlayerPosition();
    adjustMapPosition();

    window.addEventListener("mousemove", mouseMove)
    window.addEventListener("mousedown", mouseDown)


    let mousePosition = {
        x: 0,
        y: 0
    };

    function mouseMove(event) {
        mousePosition = {
            x: event.clientX,
            y: event.clientY
        };

    }

    const exploAni = await new Animation("assets/explotionSheet.png", 100, 100, 60, 0.01, false, true, true)

    async function mouseDown(event) {
        const bomb = await new AnimatingSprite(exploAni)
        bomb.sprite.position = mousePosition
        console.log(mousePosition)
    }

    const updateTicker = async (delta) => {
        update(delta);
    };
    app.ticker.add(updateTicker)

    function update(delta){



    }

})();






