import { _decorator, Component, director, Label, math, Node, Sprite, SpriteAtlas, UITransform } from 'cc';
import { COL, ROW } from './gameScene';
const { ccclass, property } = _decorator;
export interface blockAttr{
    row:number,
    col:number,
    type:number
}
@ccclass('spriteBlock')
export class spriteBlock extends Component {
    @property(Label)
    labType:Label=null;

    @property(SpriteAtlas)
    itemAtlas:SpriteAtlas=null;

    @property(Sprite)
    itemSprite:Sprite=null;

    blockInfo:blockAttr={
        row:-1,
        col:-1,
        type:-1
    }
    size:Readonly<math.Size>=null;
    protected onLoad(): void {
        this.size = this.node.getComponent(UITransform).contentSize;
    }
    start() {
        this.node.on(Node.EventType.TOUCH_END,this.onTouch,this);
    }
    get itemSize(){
        return this.size;
    }
    onTouch(){
        director.emit("onBlockTouch",this.blockInfo.row,this.blockInfo.col);
    }
    getScoreEffect(pos){

    }
    setIndex(row,col){
        this.blockInfo.row=row;
        this.blockInfo.col=col;
    }
    setAttr(attr:blockAttr){
        if(this.size==null)
            this.size = this.node.getComponent(UITransform).contentSize;
        this.blockInfo = {...attr};        
        this.labType.string=this.blockInfo.type+"";
        this.itemSprite.spriteFrame = this.itemAtlas.getSpriteFrame(`item${this.blockInfo.type+1}`);
        this.node.setPosition((this.blockInfo.col-COL/2+0.5)*this.size.width,(this.blockInfo.row-ROW/2+0.5)*this.size.height);
    }
    getAttr(){
        return this.blockInfo;
    }
    update(deltaTime: number) {
        
    }
}


