import { _decorator, Component, director, instantiate, Label, math, Node, NodePool, Prefab, screen, tween, v2, v3, view } from 'cc';
import { blockAttr, spriteBlock } from './spriteBlock';
import { levelConfig } from './config';
import { gameEnd } from './gameEnd';
const { ccclass, property } = _decorator;
export const ROW=8;
export const COL=8;
const TYPE=6;

@ccclass('gameScene')
export class gameScene extends Component {
    @property(Node)
    gameEndNode:Node=null;

    @property(Prefab)
    prefabBlock:Prefab=null;

    @property(Node)
    arrayBg:Node=null;

    @property(Label)
    labLevel:Label=null;

    @property(Label)
    labTargetScore:Label=null;

    @property(Label)
    labScore:Label=null;

    @property(Node)
    effectScore:Node=null;

    @property(Label)
    labCount:Label=null;

    @property(Node)
    selectIcon:Node=null;

    nodeArray:Node[][]=[]
    mapInfo:blockAttr[][]=[]
    markInfo:number[][]=[]

    selectRow:-1;
    selectCol:-1;

    canTouch=true;
    itemSize:Readonly<math.Size>=null;
    nodePool:NodePool=new NodePool();

    labEffectPool:NodePool=new NodePool();

    levelInfo:levelConfig={
        level:0,
        targetScore:0,
        stepCount:0,
        itemScore:0,
        score:0
    };
    protected onLoad(): void {
        // 100+level*100 60 5+level
        this.updateLabelInfo();

        director.on("Restart",this.reStart,this);

    }
    updateLabelInfo(){
        this.levelInfo.level=parseInt((localStorage.getItem("level")||"0"));
        // this.levelInfo.targetScore=1000+this.levelInfo.level*300;
        this.levelInfo.stepCount=10+this.levelInfo.level*5;
        this.levelInfo.itemScore=5+this.levelInfo.level;
        this.levelInfo.targetScore=this.levelInfo.itemScore*5*this.levelInfo.stepCount;

        this.levelInfo.score=0;

        this.labLevel.string=`第${this.levelInfo.level+1}关`;
        this.labCount.string=`剩余步数：${this.levelInfo.stepCount}`;
        this.labTargetScore.string=`目标分数：${this.levelInfo.targetScore}`;
        this.labScore.string=`当前得分：${this.levelInfo.score}`;
    }
    updateStepCount(){
        this.labCount.string=`剩余步数：${this.levelInfo.stepCount}`;
    }
    updateScore(){
        this.labScore.string=`当前得分：${this.levelInfo.score}`;
    }
    start() {
        this.initMapInfo();
        director.on("onBlockTouch",this.onTouchBlock,this);
    }
    onTouchBlock(row,col){
        if(this.canTouch==false)
            return;
        if(this.selectRow==-1||this.selectCol==-1){
            this.selectCol=col;
            this.selectRow=row;
            this.setSelect();
        }
        else{
            if(this.selectCol==col){
                if(this.selectRow-row==1||this.selectRow-row==-1){
                    this.canTouch=false;
                    this.exchangBlock(row,col);                  
                    return;
                }
            }
            else if(this.selectRow==row){
                if(this.selectCol-col==1||this.selectCol-col==-1){
                    this.canTouch=false;
                    this.exchangBlock(row,col);
                    return;
                }
            }
            this.selectCol=col;
            this.selectRow=row;
            this.setSelect();
        }
    }
    setSelect(){
        if(this.selectRow==-1)
            this.selectIcon.active=false;
        else{
            this.selectIcon.active=true;
            this.selectIcon.setPosition(this.getPosByIndex(this.selectRow,this.selectCol));

        }
    }
    printArray(str){
        console.log(str)
        for(let i=0;i<ROW;++i){
            for(let j=0;j<COL;++j){ 
                if(this.nodeArray[i][j]){
                    let attr = this.nodeArray[i][j].getComponent(spriteBlock).getAttr();
                    if(attr.row!=i||attr.col!=j){
                        console.log(attr.row,attr.col,i,j);
                    }
                    if(attr.type!=this.mapInfo[i][j].type){
                        console.log(attr.type,i,j);

                    }
                }

            }
        }
    }
    //交换方块
    exchangBlock(row,col){
        this.printArray("exchangBlock");
        this.exchangeType(this.mapInfo[row][col],this.mapInfo[this.selectRow][this.selectCol]);
        tween(this.nodeArray[row][col])
        .to(0.1,{position:this.getPosByIndex(this.selectRow,this.selectCol)})
        .start()

        tween(this.nodeArray[this.selectRow][this.selectCol])
        .to(0.1,{position:this.getPosByIndex(row,col)})
        .call(()=>{
            if(this.checkRemoveOnly(row,col)==false&&this.checkRemoveOnly(this.selectRow,this.selectCol)==false){
                this.exchangeType(this.mapInfo[row][col],this.mapInfo[this.selectRow][this.selectCol]);
                tween(this.nodeArray[row][col])
                .delay(0.1)
                .to(0.1,{position:v3(this.nodeArray[this.selectRow][this.selectCol].getPosition())})
                .start()

                tween(this.nodeArray[this.selectRow][this.selectCol])  
                .delay(0.1)            
                .to(0.1,{position:v3(this.nodeArray[row][col].getPosition())})
                .call(()=>{
                    this.canTouch=true;
                    this.selectCol=-1;
                    this.selectRow=-1;
                    this.setSelect();
                })
                .start()
            }
            else{
                [this.nodeArray[this.selectRow][this.selectCol],this.nodeArray[row][col]]=[this.nodeArray[row][col],this.nodeArray[this.selectRow][this.selectCol]]
                this.nodeArray[this.selectRow][this.selectCol].getComponent(spriteBlock).setIndex(this.selectRow,this.selectCol);
                this.nodeArray[row][col].getComponent(spriteBlock).setIndex(row,col);
                if(this.checkRemove()){
                    this.levelInfo.stepCount-=1;
                    this.updateStepCount();
                    this.startRemove();
                }
                else{
                    this.canTouch=true;
                }
                this.selectCol=-1;
                this.selectRow=-1;
                this.setSelect();
            }
        })
        .start();               
    }

    startRemove(){
        let score=0;
        for(let i=0;i<ROW;++i){
            for(let j=0;j<COL;++j){  
                if(this.markInfo[i][j]==1){
                    this.markInfo[i][j]=0;
                    this.mapInfo[i][j].type=-1;
                    this.nodePool.put(this.nodeArray[i][j]);
                    this.nodeArray[i][j]=null;
                    score+=this.levelInfo.itemScore;
                }
            }
        }
        
        let labEffect 
        if(this.labEffectPool.size()>0){
            labEffect = this.labEffectPool.get();
        }
        else{
            labEffect=instantiate(this.effectScore)
        }
        labEffect.parent=this.node;
        labEffect.getComponent(Label).string = "+"+score;
        labEffect.active=true;
        tween(labEffect)
        .set({scale:v3(0,0,0),position:v3(0,0,0)})
        .to(0.1,{scale:v3(2,2,2)})
        .delay(0.5)
        .to(0.5,{scale:v3(1,1,1),position:v3(-view.getVisibleSize().width/2+260,view.getVisibleSize().height/2-200,0)})
        .call(()=>{

            console.log(view.getFrameSize())
            console.log(screen.windowSize)
            console.log(view.getVisibleSize())

            labEffect.active=false;
            this.labEffectPool.put(labEffect);
            this.levelInfo.score+=score;
            this.updateScore();
            this.fillMap();
            // setTimeout(()=>{
            //     this.fillMap();
            // },500);
        })
        .start()

        
        
    }
    fillMap(){
        this.printArray("fillMap1");
        let emptyIndex=0;
        let maxCount=0;
        for(let j=0;j<COL;++j){ 
            emptyIndex=0;
            for(let i=0;i<ROW;++i){
                if(this.mapInfo[i][j].type!=-1){
                    if(emptyIndex!=i){
                        if(this.nodePool.size()>0)
                            this.nodeArray[emptyIndex][j]=this.nodePool.get();                        
                        else
                            this.nodeArray[emptyIndex][j]=instantiate(this.prefabBlock);
                        this.nodeArray[emptyIndex][j].getComponent(spriteBlock).setAttr(this.nodeArray[i][j].getComponent(spriteBlock).getAttr());
                        this.nodeArray[emptyIndex][j].getComponent(spriteBlock).setIndex(emptyIndex,j);
                                            
                        this.nodeArray[emptyIndex][j].parent=this.arrayBg;
                        this.nodePool.put(this.nodeArray[i][j])  
                        this.nodeArray[i][j]=null;                      
                        if(maxCount<i-emptyIndex)
                            maxCount=i-emptyIndex;
                        tween(this.nodeArray[emptyIndex][j])
                        .to(0.1*(i-emptyIndex),{position:this.getPosByIndex(emptyIndex,j)})
                        .start()
                        this.mapInfo[emptyIndex][j].type=this.mapInfo[i][j].type;
                        this.mapInfo[i][j].type=-1;
                    }
                    emptyIndex++; 
                }    
                          
            }
        } 
        
        setTimeout(()=>{
            this.printArray("fillMap2");
            if(this.checkRemove()){
                this.startRemove();
                this.printArray("fillMap3");
            }
            else{
                this.printArray("fillMap4");
                // this.initMapInfo
                this.randFill();
            }
        },maxCount*100+200)
    }
    getPosByIndex(row,col){
        return v3((col-COL/2+0.5)*this.itemSize.width,(row-ROW/2+0.5)*this.itemSize.height);
    }
    randFill(){
        for(let i=0;i<ROW;++i){
            for(let j=0;j<COL;++j){
                if(this.mapInfo[i][j].type==-1){
                    this.mapInfo[i][j].type=(Math.floor(10000*Math.random()))%TYPE;
                    if(this.nodePool.size()>0){
                        this.nodeArray[i][j] = this.nodePool.get();
                    }                    
                    else{
                        this.nodeArray[i][j] = instantiate(this.prefabBlock);
                    }
                    this.nodeArray[i][j].parent=this.arrayBg;
                    this.nodeArray[i][j].getComponent(spriteBlock).setAttr(this.mapInfo[i][j]);   
                    tween(this.nodeArray[i][j])
                    .set({scale:v3(0,0,0)})
                    .to(0.1,{scale:v3(1.0,1.0,1.0)})
                    .start()                 
                }
            }
        }
        this.printArray("randFill2");
        setTimeout(()=>{
            if(this.checkRemove()){
                this.startRemove();
            }
            else{
                if(this.levelInfo.score>=this.levelInfo.targetScore){
                    // 下一关
                    this.levelInfo.level+=1;
                    localStorage.setItem("level",this.levelInfo.level+"");
                    console.log("nextLevel")
                    this.gameEndNode.active=true;
                    this.gameEndNode.getComponent(gameEnd).showResult(1);
                }
                else if(this.levelInfo.stepCount<=0){
                    //游戏结束
                    this.gameEndNode.active=true;
                    this.gameEndNode.getComponent(gameEnd).showResult(0);
                    console.log("gameOver")
                }
                else{
                    if(this.checkPlayAble()==false){
                        this.initMapInfo();
                    }
                    else{
                        this.canTouch=true;
                        this.printArray("randFill");
                    }
                }

            }
        },200)
    }
    initMapInfo(){
        // let test=[
        //     [0,0,1,1,2,2,3,3],
        //     [3,3,5,5,4,4,0,0],
        //     [0,0,1,1,2,2,3,3],
        //     [3,3,5,5,4,4,0,0],
        //     [0,0,1,1,2,2,3,3],
        //     [3,2,5,5,4,5,5,1],
        //     [0,4,1,3,2,5,3,2],
        //     [3,3,5,2,0,4,0,0],
        // ]
        let tempValue=0;
        for(let i=0;i<ROW;++i){
            this.mapInfo[i]=[];
            this.markInfo[i]=[];
            for(let j=0;j<COL;++j){                
                // this.mapInfo[i][j]={
                //     row:i,col:j,type:test[i][j]
                // }
                this.markInfo[i][j]=0;
                while(1){
                    tempValue=(Math.floor(10000*Math.random()))%TYPE;
                    if(i>=2){
                        //连续三个一样重新生成
                        if(tempValue==this.mapInfo[i-1][j].type&&tempValue==this.mapInfo[i-2][j].type)
                            continue;
                    }
                    if(j>=2){
                        //连续三个一样重新生成
                        if(tempValue==this.mapInfo[i][j-1].type&&tempValue==this.mapInfo[i][j-2].type)
                            continue;
                    }
                    this.mapInfo[i][j]={
                        row:i,col:j,type:tempValue
                    }
                    break;
                }
            }
        }
        if(this.checkPlayAble()){
            this.generalMap();
        }
        else{
            this.initMapInfo();            
        }
    }
    reStart(){
        this.updateLabelInfo();
        this.gameEndNode.active=false;
        this.initMapInfo();  
        this.canTouch=true;
    }
    //生成砖块
    generalMap(){
        for(let i=0;i<ROW;++i){
            if(!this.nodeArray[i])
                this.nodeArray[i]=[]
            for(let j=0;j<COL;++j){
                if(this.nodeArray[i][j]==null){
                    if(this.nodePool.size()>0){
                        this.nodeArray[i][j]=this.nodePool.get();
                    }
                    else{
                        let node = instantiate(this.prefabBlock);
                        this.nodeArray[i][j]=node;
                    }
                    this.nodeArray[i][j].parent=this.arrayBg;                    
                }
                if(this.itemSize==null){
                    this.itemSize = this.nodeArray[i][j].getComponent(spriteBlock).itemSize;
                }
                this.nodeArray[i][j].getComponent(spriteBlock).setAttr(this.mapInfo[i][j]);
                tween(this.nodeArray[i][j])
                .set({scale:v3(0,0,0)})
                .delay(0.1*((ROW-1-i)*ROW+j))
                .to(0.1,{scale:v3(1.0,1.0,1.0)})
                .start()
            }
        }        
        setTimeout(()=>{
            this.canTouch=true;
        },7000)
    }
    //判断可玩性
    checkPlayAble(){
        for(let i=0;i<ROW;++i){
            for(let j=0;j<COL;++j){
                if(j<COL-1){
                    console.log(i,j)
                    this.exchangeType(this.mapInfo[i][j],this.mapInfo[i][j+1]);

                    if(this.checkRemoveOnly(i,j)==true){
                        this.exchangeType(this.mapInfo[i][j],this.mapInfo[i][j+1]);
                        return true;
                    }
                    this.exchangeType(this.mapInfo[i][j],this.mapInfo[i][j+1]);
                }
                if(i<ROW-1){
                    this.exchangeType(this.mapInfo[i][j],this.mapInfo[i+1][j]);
                    if(this.checkRemoveOnly(i,j)==true){
                        this.exchangeType(this.mapInfo[i][j],this.mapInfo[i+1][j]);
                        return true;
                    }
                    this.exchangeType(this.mapInfo[i][j],this.mapInfo[i+1][j]);
                }
            }
        }
        return false;
    }
    exchangeType(a:blockAttr,b:blockAttr){
        a.type=a.type^b.type
        b.type=a.type^b.type
        a.type=a.type^b.type
    }
    //仅检测是否有消除
    checkRemoveOnly(row,col){
        for(let i=Math.max(0,row-2);i<Math.min(row+2,ROW-2);++i){
            if(this.mapInfo[i][col].type==this.mapInfo[i+1][col].type&&this.mapInfo[i][col].type==this.mapInfo[i+2][col].type)            
                return true;
        }
        for(let j=Math.max(0,col-2);j<Math.min(col+2,COL-2);++j){
            if(this.mapInfo[row][j].type==this.mapInfo[row][j+1].type&&this.mapInfo[row][j].type==this.mapInfo[row][j+2].type)
                return true;
        }
        return false;
    }
    //检测是否有消除
    checkRemove(){
        let bRemove=false;
        for(let i=0;i<ROW;++i){
            for(let j=0;j<COL;++j){
                if(this.mapInfo[i][j].type!=-1){
                    if(i<ROW-2){
                        // let length=1;
                        // while(i+length<ROW && this.mapInfo[i][j].type==this.mapInfo[i+length][j].type){
                        //     console.log(i,j,length,this.mapInfo[i][j].type,this.mapInfo[i+length][j].type)
                        //     length++;                            
                        // }
                        // if(length>=3){
                        //     for(let index=0;index<length;++index){
                        //         this.markInfo[i+index][j]=1;
                        //     }
                        //     bRemove=true;
                        // }
                        if(this.mapInfo[i][j].type==this.mapInfo[i+1][j].type&&this.mapInfo[i][j].type==this.mapInfo[i+2][j].type){
                            this.markInfo[i][j]=1;
                            this.markInfo[i+1][j]=1;
                            this.markInfo[i+2][j]=1;
                            bRemove=true;
                        }
                    }
                    if(j<COL-2){
                        if(this.mapInfo[i][j].type==this.mapInfo[i][j+1].type&&this.mapInfo[i][j].type==this.mapInfo[i][j+2].type){
                            this.markInfo[i][j]=1;
                            this.markInfo[i][j+1]=1;
                            this.markInfo[i][j+2]=1;
                            bRemove=true;
                        }
                    }
                }
            }
        }
        this.printArray("checkRemove");
        return bRemove;
    }
    update(deltaTime: number) {
        
    }
    protected onDestroy(): void {
        director.off("Restart",this.reStart,this);        
    }
}


