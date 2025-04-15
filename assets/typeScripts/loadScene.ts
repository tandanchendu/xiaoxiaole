import { _decorator, Component, director, Node, ProgressBar, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('loadScene')
export class loadScene extends Component {
    @property(ProgressBar)
    progress:ProgressBar=null

    @property(Node)
    lightNode:Node=null;

    bLoadFinish=false;
    progressWidth:number=0;
    start() {
        this.progress.progress=0;
        this.progressWidth = this.progress.getComponent(UITransform).contentSize.width;
    }

    update(deltaTime: number) {
        if(this.progress.progress<1){
            this.progress.progress+=0.01;        
            this.lightNode.setPosition(-this.progressWidth/2+this.progressWidth*this.progress.progress,0);
        }
        else if(this.bLoadFinish==false){
            this.bLoadFinish=true;
            this.progress.progress=1;
            director.loadScene("gameScene")
        }
    }
}


