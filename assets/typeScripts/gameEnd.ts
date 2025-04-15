import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('gameEnd')
export class gameEnd extends Component {
    @property(Node)
    winNode:Node=null;
    @property(Node)
    loseNode:Node=null;

    showResult(result){
        if(result==1){
            this.winNode.active=true;
            this.loseNode.active=false;

        }
        else{
            this.winNode.active=false;
            this.loseNode.active=true;
        }
    }
    reStart(){
        director.emit("Restart");
    }
}


