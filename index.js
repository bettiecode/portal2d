// #region draw/step event
function main() //runs every frame
{
    //game
    playerScript()
    //rendering
    clear();
    draw();
    //keeping track of time
    t++;
}

function clear() //reset canvas
{
    m.width=w; 
    mctx.fillStyle="red";
    mctx.strokeStyle="empty";
}

function draw() //render layer by layer, and portal
{
    //bg layer
    //tmap layer
    for(var y=0;y<tmap.length;y++)
    {
        for(var x=0;x<tmap[0].length;x++)
        {
            if(tmap[y][x]=="a"){continue;} //air tile, nothing should be drawn
            mctx.drawImage(document.getElementById("tile-"+tmap[y][x]),x*tw-camX,y*tw-camY); //draw correct tile sprite
        }
    }
    //object layer
    drawSprite(Player.sprite); //draw player
    
    //portals
    var colors=["blue","orange"]
    
    var coll=portalCollison(Player.p.x,Player.p.y);
    if(coll!="none")
    {
        var other="blue";
        if(coll=="blue"){other="orange";}
        
        var diff=new Vector(Player.p.x+tw/2-P[coll].p.x,Player.p.y+tw/2-P[coll].p.y)

        var outDiff=-(diff.x*P[coll].out.x+diff.y*P[coll].out.y);
        var upDiff=diff.x*P[coll].up.x+diff.y*P[coll].up.y;

        var homage=new Sprite(Player.sprite.imgs,Player.sprite.width,Player.sprite.heigth);
        homage.rPos.x=P[other].p.x+(P[other].out.x*outDiff+P[other].up.x*upDiff)-tw/2-camX;
        homage.rPos.y=P[other].p.y+(P[other].out.y*outDiff+P[other].up.y*upDiff)-tw/2-camY;
        drawSprite(homage);
        //tp if in too deep
        if(outDiff>1)
        {
            Player.p.x=homage.rPos.x+camX;
            Player.p.y=homage.rPos.y+camY;
            
            var outVel=-(P[coll].out.x*Player.v.x+P[coll].out.y*Player.v.y);
            var upVel=P[coll].up.x*Player.v.x+P[coll].up.y*Player.v.y;
            Player.v.x=P[other].out.x*outVel+P[other].up.x*upVel;
            Player.v.y=P[other].out.y*outVel+P[other].up.y*upVel;
            
        }

    }

    for(var i=0;i<2;i++)
    {
        pColor=colors[i]
        if(P[pColor].placed)
        {
            for(var j=0;j<P[pColor].tiles.length;j++) // portal tiles
            {
                var tile=P[pColor].tiles[j];
                
                var imgString=pColor+"("+String(P[pColor].out.x)+";"+String(P[pColor].out.y)+")";
                mctx.drawImage(document.getElementById("tile-p"), tile.x*tw-camX,tile.y*tw-camY);
                mctx.drawImage(document.getElementById(imgString), tile.x*tw-camX,tile.y*tw-camY);
                if(P[pColor].active)
                    {
                        imgString=pColor+"("+String(-P[pColor].out.x)+";"+String(-P[pColor].out.y)+")";
                        //mctx.drawImage(document.getElementById(imgString), (tile.x+P[pColor].out.x)*tw-camX,(tile.y+P[pColor].out.y)*tw-camY);
                    }
                
            }
            mctx.beginPath();
            mctx.moveTo(P[pColor].p.x-camX-P[pColor].out.x*tw/2,P[pColor].p.y-camY-P[pColor].out.y*tw/2);
            mctx.lineTo(P[pColor].p.x-camX-P[pColor].out.x*tw/2+P[pColor].up.x*tw/2,P[pColor].p.y-camY-P[pColor].out.y*tw/2+P[pColor].up.y*tw/2);
            mctx.fillStyle=pColor
            mctx.strokeStyle="purple";
            mctx.stroke();
            mctx.closePath();
        }
    }
    //over tmap layer
    //gui layer
    if(canPlace) //aim laser
    {
        mctx.beginPath();
        mctx.moveTo(Player.sprite.rPos.x+tw/2,Player.sprite.rPos.y+tw/2)
        mctx.lineTo(endPoint.x-camX,endPoint.y-camY);
        mctx.strokeStyle="purple";
        mctx.stroke();
        mctx.closePath();
    }
}
// #endregion

// #region vectors
function Vector(x,y) //2d vector
{
    this.x=x;
    this.y=y;
}

function pointDirecton(v,w) //returns direction from first vector to the other in radians
{
    return (Math.atan2(w.y-v.y, w.x-v.x));
}

function rot(v,theta)
{
    //| cos(theta) sin(theta)||x|   | x*cos(theta)+y*sin(theta)|
    //|-sin(theta) cos(theta)||y| = |-x*sin(theta)+y*cos(theta)|
    return new Vector(
                         v.x*Math.cos(theta)+v.y*Math.sin(theta),
                        -v.x*Math.sin(theta)+v.y*Math.cos(theta)
                    )
}

// #endregion

// #region sprites
function Sprite(imgArr,width,height)
{
    this.imgs=imgArr;
    this.imgIdx=0;
    this.width=width;
    this.height=height;
    this.Mirror=false;
    this.rotation=0;
    this.rPos=new Vector(0,0)
}
function drawSprite(spr)
{
     mctx.drawImage(
        spr.imgs[spr.imgIdx],
        
        spr.rPos.x,
        spr.rPos.y
    );
}
// #endregion

// #region objs
function tileCollison(x,y,sprWidth=64,sprHeight=64) //tile collison 
{
    //get 4 corner points
    var lx=Math.floor((x)/tw);
    var rx=Math.floor((x+sprWidth)/tw);
    var ty=Math.floor((y)/tw);
    var by=Math.floor((y+sprHeight)/tw);
    //check each point, if inside non-air tile
    if(tmap[ty][lx]!="a"){return(true);}
    if(tmap[ty][rx]!="a"){return(true);}
    if(tmap[by][rx]!="a"){return(true);}
    if(tmap[by][lx]!="a"){return(true);}
    return(false);
}

function PhyObj(id,type,sprite) //physics object
{
    this.id=id; //id
    this.type=type; //type of object
    this.sprite=sprite; //sprite
    this.p=new Vector(0,0); //position
    this.v=new Vector(0,0); //velocity
    this.a=new Vector(0,0); //acceleration
    this.bounce=false; //bounce
    this.move=function() //move the object 
    {
        //x
        this.v.x+=this.a.x;
        var step=0.2*Math.sign(this.v.x);
        if(tileCollison(this.p.x+this.v.x,this.p.y))
        {
            while(!tileCollison(this.p.x+step,this.p.y))
            {
                this.p.x+=step;
            }
            this.v.x=0;
        }
        this.p.x+=this.v.x;
        //y
        this.v.y+=this.a.y;
        step=0.2*Math.sign(this.v.y);
        if(tileCollison(this.p.x,this.p.y+this.v.y))
        {
            while(!tileCollison(this.p.x,this.p.y+step))
            {
                this.p.y+=step;
            }
            this.v.y=0;
        }
        this.p.y+=this.v.y;

        //update render position of sprite
        this.sprite.rPos.x=this.p.x-camX;
        this.sprite.rPos.y=this.p.y-camY;
    }

}

function playerScript()
{
//movement
    var a=0.05; //movement acceleration
    var hk=Number(keyMap.d)-Number(keyMap.a); if(hk!=0){lastHk=hk;} //horizontal input
    if(tileCollison(Player.p.x,Player.p.y+1)){Player.a.x=hk*a;}else{Player.a.x=0;} //accelerate on input, if on gorund
    if(hk==0 && tileCollison(Player.p.x,Player.p.y+1))  //friction, if on ground
    {
        Player.a.x=-Math.sign(Player.v.x)*a;
    }
    if(Math.abs(Player.v.x)<a) //stop if v too little
    {
        Player.v.x=0;
    }
    //wall slide
    if(tileCollison(Player.p.x+hk,Player.p.y) && Player.v.y>0.5)
    {
        Player.a.y=0;
        Player.v.y=0.5;
    }else
    {
        Player.a.y=g;
    }

    //jumping
    var vJump=-Math.sqrt(2*g*3.5*tw);//v=sqrt(2gh) h=tiles to jump * tile size

    if(tileCollison(Player.p.x,Player.p.y+1) && keyMap.w){Player.v.y=vJump;} //jump, if on ground
    
    Player.move();
    if(tileCollison(Player.p.x,Player.p.y+1)) //cap velocity
    {
        if(Player.v.x> maxVx){Player.v.x= maxVx;}
        if(Player.v.x<-maxVx){Player.v.x=-maxVx;}
        if(Player.v.y> maxVy){Player.v.y= maxVy;}
        if(Player.v.y<-maxVy){Player.v.y=-maxVy;}
    }
    
    //cam update
    camX=Player.p.x-w/2;
    camY=Player.p.y-h/2;
    camX=Math.max(0,camX);
    camX=Math.min(tmap[0].length*tw-w,camX)
    camY=Math.max(0,camY);
    camY=Math.min(tmap.length*tw-h,camY)

//portal

       

    //endPoint=raycast();
    endPoint=raycast();
    
   // if(portalCollison(Player.p.x,Player.p.y)!="none"){canPlace=false} 

    if(canPlace)
    {
        if(keyMap.q && portalCollison(Player.p.x,Player.p.y)!="blue"){shootPortal("blue")}
        else 
        if(keyMap.e && portalCollison(Player.p.x,Player.p.y)!="orange"){shootPortal("orange")}
    }
}
// #endregion

// #region portals
function Portal(color)
{
    this.color=color;
    this.up=new Vector(0,0);
    this.out=new Vector(0,0);
    this.p=new Vector(0,0);
    
    this.active=true;
    this.placed=false;

    this.tiles=[];

}

function isPortalTile(x,y)
{
    if(true)
    {
        for(var i=0;i<P["blue"].tiles.length;i++)
        {
            if(
                x==P["blue"].tiles[i].x &&
                y==P["blue"].tiles[i].y
            ){return "blue"}
        }
    }
    if(true)
    {
        for(var i=0;i<P["orange"].tiles.length;i++)
        {
            if(
                x==P["orange"].tiles[i].x &&
                y==P["orange"].tiles[i].y
            ){return "orange"}
        }
    }
    return "none";
}
function portalCollison(x,y,sprWidth=64,sprHeight=64) //tile collison 
{
    //get 4 corner points
    var lx=Math.floor((x)/tw);
    var rx=Math.floor((x+sprWidth)/tw);
    var ty=Math.floor((y)/tw);
    var by=Math.floor((y+sprHeight)/tw);
    //check each point, if inside non-air tile
    if(isPortalTile(lx,ty)!="none"){return(isPortalTile(lx,ty));}
    if(isPortalTile(rx,ty)!="none"){return(isPortalTile(rx,ty));}
    if(isPortalTile(rx,by)!="none"){return(isPortalTile(rx,by));}
    if(isPortalTile(lx,by)!="none"){return(isPortalTile(lx,by));}
    return("none");
}


function raycast()
{
    var x=Player.p.x+Player.sprite.width/2;
    var y=Player.p.y+Player.sprite.height/2;
    var tx, ty;
    var dir=Math.atan2(Mouse.y-(Player.sprite.rPos.y+tw/2),Mouse.x-(Player.sprite.rPos.x+tw/2))
    var step=0.5;
    var tileVal;
    canPlace=true;
    do
    {   
        x+=Math.cos(dir)*step;
        y+=Math.sin(dir)*step;
        tx=Math.floor(x/tw);
        ty=Math.floor(y/tw)
        tileVal=tmap[ty][Math.floor(tx)];
        if(tileVal=="b"){canPlace=false;}
        if(isPortalTile(tx,ty)!="none"){canPlace=false;}
        
    }while(tileVal=="a");
    return new Vector(x,y);
}

function shootPortal(pColor)
{
    var other="blue";
    if(pColor=="blue"){other="orange"}
    //reset tiles
    for(var i=0;i<P[pColor].tiles.length;i++)
    {
        var tile=P[pColor].tiles[i];
        tmap[tile.y][tile.x]="p";

    }
    P[pColor].tiles=[]
    P[pColor].placed=false;
    //set tiles
    P[pColor].tiles.push(new Vector(Math.floor(endPoint.x/tw),Math.floor(endPoint.y/tw)));
    var pDiff=new Vector(Player.p.x-endPoint.x,Player.p.y-endPoint.y); //player difference
    var tDiff=new Vector(Math.abs(-(endPoint.x % 64)+32),Math.abs(-(endPoint.y % 64)+32)) //abs tile center difference
    var ori;
    var face;
    if(tDiff.x>tDiff.y)
    {
        ori="x";
        face=Math.sign(pDiff.x)
        var tile=P[pColor].tiles[0];
        //-y
        if(
            tmap[tile.y-1][tile.x]=="p" &&
            tmap[tile.y-1][tile.x+face]=="a"

        )
        {
            P[pColor].tiles.push(new Vector(tile.x,tile.y-1));
            P[pColor].up=new Vector(0,-1);
        }
        else
        //+y
        if(
            tmap[tile.y+1][tile.x]=="p" &&
            tmap[tile.y+1][tile.x+face]=="a"

        )
        {
            P[pColor].tiles.push(new Vector(tile.x,tile.y+1))
            P[pColor].up=new Vector(0,1);
        }
        else{P[pColor].tiles=[]}//dont place
        console.log("x");
    }
    else
    {
        ori="y";
        face=Math.sign(pDiff.y)
        var tile=P[pColor].tiles[0];
        //+hk
        if(
            tmap[tile.y][tile.x+lastHk]=="p" &&
            tmap[tile.y+face][tile.x+lastHk]=="a"
  
        )
        {
            P[pColor].tiles.push(new Vector(tile.x+lastHk,tile.y));
            P[pColor].up=new Vector(lastHk,0);
        }
        else
        //-hk
        if(
            tmap[tile.y][tile.x-lastHk]=="p" &&
            tmap[tile.y+face][tile.x-lastHk]=="a"

        )
        {
            P[pColor].tiles.push(new Vector(tile.x-lastHk,tile.y));
            P[pColor].up=new Vector(-lastHk,0);
        }
        else{P[pColor].tiles=[]}//dont place
        console.log("y");
    }
    if(P[pColor].tiles.length!=0){P[pColor].placed=true;}
    

    //set pos and facing
    P[pColor].out.x=face*Number(ori=="x");
    P[pColor].out.y=face*Number(ori=="y");
    P[pColor].p.x=tw*P[pColor].tiles[0].x+tw/2+(tw/2)*P[pColor].up.x+(tw/2)*P[pColor].out.x;
    P[pColor].p.y=tw*P[pColor].tiles[0].y+tw/2+(tw/2)*P[pColor].up.y+(tw/2)*P[pColor].out.y;
    console.log(P[pColor].p)
    //P[pColor].out=rot(P[pColor].up,(90*(Math.PI/180)))

    if(P[other].placed && P[pColor].placed){
        activatePortals()
    }else{
        deactivatePortals();
    }


}

function activatePortals()
{
    var colors=["blue","orange"]
    for(var i=0;i<2;i++)
    {
        var pColor=colors[i]
        P[pColor].active=true;
        for(var j=0;j<P[pColor].tiles.length;j++)
        {
            var tile=P[pColor].tiles[j];
            tmap[tile.y][tile.x]="a";
        }
    }    
}
function deactivatePortals()
{
    var colors=["blue","orange"]
    for(var i=0;i<2;i++)
    {
        var pColor=colors[i]
        P[pColor].active=false;
        for(var j=0;j<P[pColor].tiles.length;j++)
        {
            var tile=P[pColor].tiles[j];
            tmap[tile.y][tile.x]="p";
        }
    }    
}

// #endregion

// #region load functions
function loadLevel(n)
{
    //player positioning
    Player.p=levels[n].playerStart;
    //map
    tmap=[];
    var nums=['0','1','2','3','4','5','6','7','8','9']
    var data=[];
    var arr=[];
    var numArr=[];
    var charArr=[];
    var mapString=levels[n].map;
    console.log(mapString);
    var word="";
    for(var i=0;i<mapString.length;i++)
    {
        ch=mapString[i];
        if(ch!='(' && ch!=')')
        {
            word+=ch;
            console.log(ch);
        }
        if(ch=='(')
            {
                arr.push(Number(word)); 
                console.log(word);
                word="";  
                continue;
            }
        if(ch==')')
            { 
                arr.push(word);
                console.log(word);
                data.push(arr);
                console.log(arr);
                word="";
                arr=[];  
                continue;
            }
        
    };
    console.log(data);
    for(var i=0;i<data.length;i++)
    {
        word="";
        ch="";
        arr=[];
        numArr=[];
        charArr=[];
        for(var j=0;j<data[i][1].length;j++)
        {
            ch=data[i][1][j];
            if(!nums.includes(ch))
            {
                numArr.push(Number(word));
                charArr.push(ch);
                word="";
            }else{
                word+=ch;
            }
        }
        console.log(numArr);
        console.log(charArr);
        arr=[]
        for(var j=0;j<numArr.length;j++)
        {
            for(var k=0;k<numArr[j];k++)
            {
                arr.push(charArr[j])
            }
        }
        for(var j=0;j<data[i][0];j++)
        {
            var arrCopy=arr.slice();
            tmap.push(arrCopy)
        }
    }
    console.log(tmap)
}


// #endregion

// #region variables
const m=document.getElementById("mainCanvas");
const w=m.width;
const h=m.height;
const mctx=m.getContext("2d");

let camX=0;
let camY=0;

const g=1/20;
const maxVx=2.5;
const maxVy=40;
Player = new PhyObj(id="player",type="player",
new Sprite([
    document.getElementById("playerSprite")

],
    64,64)
)
Player.x=100;
Player.y=100;
let jumps=0;
let lastHk=1;
let endPoint;

let P=
{
    blue: new Portal("blue"),
    orange: new Portal("orange")
}
let canPlace=false;

const fps=60;
let t=0;

let tmap=[];
const scale=4;
const tw=16*scale;    

function Level(map,playerStart)
{
    this.map=map;
    this.playerStart=playerStart;
}

let levels=
[
    new Level(
        "5(9a7b8a8b)2(16a8a8b)4(7b2a7b8a8b)1(32a)12(8a16b8a)",
        new Vector(200,200)
    ),
    new Level(
        "24(32a)",
        new Vector(200,200)    
    ),
    new Level(
        "1(32b)"+
        "1(2b28p2b)"+
        "20(1b1p28a1p1b)"+
        "2(3b2p1b24a1p1b)"+
        "3(1b1p28a1p1b)"+
        "1(1b1p4a2b4a1b2p1b14a1p1b)"+
        "2(1b1p4a2p4a4b14a1p1b)"+
        "1(2b4p2b4p4b14p2b)"+
        "1(32b)",
        new Vector(200,200)
    )
]
console.log(levels)

loadLevel(2 );
//
let keyMap = {w:0, a:0, s:0, d:0};
onkeydown = onkeyup = function(e){
    //e = e || event;
    keyMap[e.key] = e.type == 'keydown';
    //console.log(keyMap);
    
}
let Mouse = new Vector(0,0);
m.onmousemove=function(ev)
{
    Mouse.x=ev.offsetX;
    Mouse.y=ev.offsetY;
}
document.onclick=function(ev)
{

}
//#endregion
let loads=0;


setInterval(main,fps/1000);


//main()
